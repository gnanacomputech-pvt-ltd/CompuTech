from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404, render
from django.http import HttpResponse, Http404

from apps.common.permissions import IsERPStaff
from apps.core.models import Enrollment
from apps.finance.models import FeeStructure, Invoice, Payment, FeeReceipt, Certificate
from apps.finance.serializers import (
    FeeStructureSerializer, InvoiceSerializer, PaymentSerializer,
    FeeReceiptSerializer, CertificateSerializer, PublicCertificateVerificationSerializer
)
from apps.finance.services.certificate_service import (
    CertificateEligibilityService, CertificateGenerator
)
from apps.finance.tasks import generate_certificate_pdf_async


class PublicCertificateThrottle(AnonRateThrottle):
    rate = '60/minute'


class PublicCertificateVerificationView(APIView):
    """
    Section 5.3 Public Certificate Verification:
    A single unauthenticated, rate-limited endpoint, isolated in its own view
    so it can never accidentally expose authenticated data.
    GET /api/v1/public/certificates/verify/:token

    Returns only non-sensitive fields:
    - certificate_number
    - student_name
    - program
    - institution
    - status
    - issue_date
    Never exposes phone, email, DOB, address, payment details, or government ID.
    Revocation keeps the QR live but changes its resolved status to REVOKED (never a 404).
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicCertificateThrottle]

    def get(self, request, token):
        try:
            cert = Certificate.objects.select_related(
                'enrollment__student__user',
                'enrollment__program',
                'enrollment__institution'
            ).get(token=token)
        except Certificate.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_CERTIFICATE_TOKEN",
                        "message": "The certificate verification token is invalid or does not exist."
                    }
                },
                status=status.HTTP_404_NOT_FOUND
            )

        is_valid = (cert.status == 'ISSUED')
        msg = "Certificate is valid and authentic."
        revocation_reason = ""

        if cert.status == 'REVOKED':
            msg = f"This certificate was REVOKED on {cert.revoked_at.strftime('%Y-%m-%d') if cert.revoked_at else 'record'}."
            revocation_reason = cert.revocation_reason or "Certificate revoked by authority."
        elif cert.status == 'DRAFT' or cert.status == 'ELIGIBLE':
            msg = "This certificate has not yet been issued."

        payload = {
            "certificate_number": cert.certificate_number,
            "student_name": cert.enrollment.student.user.full_name,
            "program": cert.enrollment.program.title,
            "institution": cert.enrollment.institution.name,
            "status": cert.status,
            "issue_date": cert.issue_date,
            "is_valid": is_valid,
            "verification_message": msg,
            "revocation_reason": revocation_reason
        }

        serializer = PublicCertificateVerificationSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PublicCertificateWebVerificationView(APIView):
    """
    QR scan → public web verification page.
    When a user scans the QR code on a certificate, they land on this HTML page
    rather than a JSON API. Mobile-responsive, theme-aware, branded for GCS.
    GET /verify/:token/

    Returns only non-sensitive data (same sanitization as the JSON API).
    Public, unauthenticated, rate-limited via nginx.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicCertificateThrottle]

    def get(self, request, token):
        certificate_data = None
        not_found = False

        try:
            cert = Certificate.objects.select_related(
                'enrollment__student__user',
                'enrollment__program',
                'enrollment__institution'
            ).get(token=token)
            certificate_data = {
                'certificate_number': cert.certificate_number,
                'student_name': cert.enrollment.student.user.full_name,
                'program': cert.enrollment.program.title,
                'institution': cert.enrollment.institution.name,
                'status': cert.status,
                'issue_date': cert.issue_date,
                'is_valid': (cert.status == 'ISSUED'),
                'verification_message': (
                    "Certificate is valid and authentic." if cert.status == 'ISSUED'
                    else f"This certificate was REVOKED on {cert.revoked_at.strftime('%Y-%m-%d') if cert.revoked_at else 'record'}."
                    if cert.status == 'REVOKED'
                    else "This certificate has not yet been issued."
                ),
                'revocation_reason': cert.revocation_reason if cert.status == 'REVOKED' else '',
                'verify_url': request.build_absolute_uri('/verify/'),
            }
        except Certificate.DoesNotExist:
            not_found = True

        return render(request, 'finance/public_certificate_verify.html', {
            'certificate': certificate_data,
            'not_found': not_found,
        })


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.select_related(
        'enrollment__student__user',
        'enrollment__program',
        'enrollment__institution'
    ).all()
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'enrollment']
    search_fields = ['certificate_number', 'enrollment__student__user__full_name']

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            # Students can view their issued certificates
            return self.queryset.filter(enrollment__student__user=user, status='ISSUED')
        if 'INSTITUTION_COORDINATOR' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(enrollment__institution__coordinator=user)
        return self.queryset

    @action(detail=False, methods=['post'], url_path='check-eligibility', permission_classes=[permissions.IsAuthenticated])
    def check_eligibility(self, request):
        enrollment_id = request.data.get('enrollment_id')
        if not enrollment_id:
            return Response({"detail": "enrollment_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        enrollment = get_object_or_404(Enrollment, id=enrollment_id)
        result = CertificateEligibilityService.evaluate(enrollment)
        return Response({
            'enrollment_id': str(enrollment.id),
            'student_name': enrollment.student.user.full_name,
            'is_eligible': result['is_eligible'],
            'reasons': result['reasons']
        })

    @action(detail=False, methods=['post'], url_path='issue', permission_classes=[IsERPStaff])
    def issue(self, request):
        enrollment_id = request.data.get('enrollment_id')
        title = request.data.get('title', 'Certificate of Completion')
        if not enrollment_id:
            return Response({"detail": "enrollment_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        enrollment = get_object_or_404(Enrollment, id=enrollment_id)

        # Check eligibility first (fast, synchronous)
        eligibility = CertificateEligibilityService.evaluate(enrollment)
        if not eligibility['is_eligible']:
            return Response({
                "code": "INELIGIBLE_FOR_CERTIFICATE",
                "detail": "Student is not eligible for certificate.",
                "reasons": eligibility['reasons']
            }, status=status.HTTP_400_BAD_REQUEST)

        # Dispatch async task — Celery worker generates QR + PDF + SHA-256
        # This prevents the HTTP request from blocking during PDF rendering
        task = generate_certificate_pdf_async.delay(
            str(enrollment_id),
            title,
            str(request.user.id)
        )

        # Immediately return the task ID so the client can poll for completion
        return Response({
            "message": "Certificate generation has been queued.",
            "task_id": task.id,
            "enrollment_id": str(enrollment_id),
            "status": "PENDING"
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'], url_path='revoke', permission_classes=[IsERPStaff])
    def revoke(self, request, pk=None):
        cert = self.get_object()
        reason = request.data.get('reason', 'Administrative decision')
        cert = CertificateGenerator.revoke_certificate(cert, reason=reason, revoked_by=request.user)
        serializer = CertificateSerializer(cert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reissue', permission_classes=[IsERPStaff])
    def reissue(self, request, pk=None):
        cert = self.get_object()
        reason = request.data.get('reason', 'Correction requested')
        new_cert = CertificateGenerator.reissue_certificate(cert, reason=reason, reissued_by=request.user)
        serializer = CertificateSerializer(new_cert)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        cert = self.get_object()
        if not cert.pdf_file:
            # Re-generate if missing
            pdf_file, sha = CertificateGenerator.render_pdf(cert)
            cert.pdf_file.save(f"{cert.certificate_number}.pdf", pdf_file, save=True)

        response = HttpResponse(cert.pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{cert.certificate_number}.pdf"'
        return response


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related('program', 'batch').all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['program', 'batch']


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('enrollment__student__user', 'enrollment__program').prefetch_related('payments').all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'enrollment']
    search_fields = ['invoice_number', 'enrollment__student__user__full_name']

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(enrollment__student__user=user)
        return self.queryset


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice__enrollment__student__user').all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'payment_mode', 'invoice']
    search_fields = ['transaction_id']

    def perform_create(self, serializer):
        payment = serializer.save()
        # Update invoice paid_amount & status
        invoice = payment.invoice
        if payment.status == 'SUCCESS':
            invoice.paid_amount += payment.amount
            if invoice.paid_amount >= invoice.total_amount:
                invoice.status = 'PAID'
            elif invoice.paid_amount > 0:
                invoice.status = 'PARTIAL'
            invoice.save(update_fields=['paid_amount', 'status'])
            # Generate receipt
            FeeReceipt.objects.create(payment=payment)


class FeeReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FeeReceipt.objects.select_related('payment__invoice__enrollment__student__user').all()
    serializer_class = FeeReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(payment__invoice__enrollment__student__user=user)
        return self.queryset
