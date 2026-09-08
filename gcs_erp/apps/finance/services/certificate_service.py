import io
import hashlib
import qrcode
from PIL import Image
from django.core.files.base import ContentFile
from django.utils import timezone
from django.conf import settings
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from apps.finance.models import Certificate, Invoice
from apps.academics.models import Attendance, AssessmentMark, StudentProgress, AssignmentSubmission, Assignment


class CertificateEligibilityService:
    """
    Strict backend-enforced 8-step eligibility chain:
    1. Student Active
    2. Enrollment Valid
    3. Program Completed (or completed status)
    4. Attendance Met (default >= 75%)
    5. Assessment Passed
    6. Assignments/Project Completed
    7. Fee Cleared (invoices balance <= 0)
    8. Coordinator Approval
    """

    @classmethod
    def get_minimum_attendance(cls):
        from django.conf import settings
        return getattr(settings, 'MINIMUM_ATTENDANCE_PERCENTAGE', 75.0)

    @classmethod
    def evaluate(cls, enrollment):
        reasons = []

        # 1. Student Active
        if not enrollment.student.is_active or not enrollment.student.user.is_active:
            reasons.append("Student profile or user account is inactive.")

        # 2. Enrollment Valid
        if enrollment.status not in ['ACTIVE', 'COMPLETED']:
            reasons.append(f"Enrollment status is {enrollment.status}; must be ACTIVE or COMPLETED.")

        # 3. Program Completed check
        if enrollment.status != 'COMPLETED' and not enrollment.coordinator_approval:
            reasons.append("Program has not been completed yet.")

        # 4. Attendance Met
        total_sessions = enrollment.batch.academic_sessions.count()
        if total_sessions > 0:
            attended = enrollment.attendance_records.filter(status__in=['PRESENT', 'EXCUSED']).count()
            attendance_pct = (attended / total_sessions) * 100
            min_attendance = cls.get_minimum_attendance()
            if attendance_pct < min_attendance:
                reasons.append(f"Attendance {attendance_pct:.1f}% is below required {min_attendance}%.")

        # 5. Assessment Passed
        assessments = enrollment.batch.assessments.all()
        if assessments.exists():
            for ass in assessments:
                mark = enrollment.assessment_marks.filter(assessment=ass).first()
                if not mark or not mark.is_passed:
                    reasons.append(f"Required assessment '{ass.title}' has not been passed.")

        # 6. Assignments Completed
        assignments = enrollment.batch.assignments.all()
        if assignments.exists():
            for assign in assignments:
                sub = enrollment.assignment_submissions.filter(assignment=assign).first()
                if not sub or sub.status != 'EVALUATED':
                    reasons.append(f"Assignment '{assign.title}' has not been completed/evaluated.")

        # 7. Fee Cleared
        invoices = enrollment.invoices.filter(is_active=True)
        for inv in invoices:
            if inv.status != 'PAID' and inv.balance_amount > 0:
                reasons.append(f"Invoice {inv.invoice_number} has an outstanding balance of ₹{inv.balance_amount}.")

        # 8. Coordinator Approval
        if not enrollment.coordinator_approval:
            reasons.append("Academic coordinator has not approved certificate eligibility.")

        is_eligible = len(reasons) == 0
        return {
            'is_eligible': is_eligible,
            'reasons': reasons
        }


class CertificateGenerator:
    """
    Renders high-quality PDF certificates, generates QR code tokens,
    computes SHA-256 integrity hash, and handles revocation/reissue.
    """

    @classmethod
    def generate_qr_code(cls, token: str) -> ContentFile:
        base_url = getattr(settings, 'FRONTEND_URL', 'https://verify.gnanacomputech.com')
        verification_url = f"{base_url}/verify/{token}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=2,
        )
        qr.add_data(verification_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#222326", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return ContentFile(buffer.getvalue(), name=f"qr_{token[:12]}.png")

    @classmethod
    def render_pdf(cls, certificate: Certificate) -> tuple[ContentFile, str]:
        """
        Renders PDF canvas with GCS branding, coordinates, border, and QR code.
        Returns (ContentFile, sha256_hash).
        """
        buffer = io.BytesIO()
        # Landscape Letter
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)

        # Brand Colors: Gold #D4A72C, Charcoal #222326
        gold = colors.HexColor('#D4A72C')
        charcoal = colors.HexColor('#222326')
        light_gold = colors.HexColor('#F8F4E8')

        # Outer & Inner Ornamental Borders
        p.setStrokeColor(gold)
        p.setLineWidth(5)
        p.rect(20, 20, width - 40, height - 40)

        p.setStrokeColor(charcoal)
        p.setLineWidth(1.5)
        p.rect(28, 28, width - 56, height - 56)

        # Company Header
        p.setFont("Helvetica-Bold", 24)
        p.setFillColor(charcoal)
        p.drawCentredString(width / 2.0, height - 80, "GNANA COMPUTECH SOLUTIONS")

        p.setFont("Helvetica", 11)
        p.setFillColor(colors.HexColor('#555555'))
        p.drawCentredString(width / 2.0, height - 100, "ISO 9001:2015 Certified | CIN: U85500KA2025PTC205651")
        p.drawCentredString(width / 2.0, height - 116, "Bangalore North, Karnataka, India")

        # Certificate Title Ribbon
        p.setFont("Helvetica-Bold", 18)
        p.setFillColor(gold)
        p.drawCentredString(width / 2.0, height - 160, certificate.title.upper())

        # Presentation Text
        p.setFont("Helvetica-Oblique", 13)
        p.setFillColor(charcoal)
        p.drawCentredString(width / 2.0, height - 200, "This is to certify that")

        # Recipient Name
        student_name = certificate.enrollment.student.user.full_name
        p.setFont("Helvetica-Bold", 26)
        p.setFillColor(charcoal)
        p.drawCentredString(width / 2.0, height - 240, student_name.upper())

        # Institution / USN info
        institution_name = certificate.enrollment.institution.name
        usn = certificate.enrollment.student.usn or ""
        usn_text = f" (USN: {usn})" if usn else ""
        p.setFont("Helvetica", 12)
        p.setFillColor(colors.HexColor('#444444'))
        p.drawCentredString(width / 2.0, height - 265, f"of {institution_name}{usn_text}")

        # Program Details
        program_title = certificate.enrollment.program.title
        p.setFont("Helvetica", 13)
        p.drawCentredString(width / 2.0, height - 305, f"has successfully completed the comprehensive training program in")
        p.setFont("Helvetica-Bold", 16)
        p.setFillColor(gold)
        p.drawCentredString(width / 2.0, height - 330, program_title)

        # Batch & Duration
        batch_name = certificate.enrollment.batch.name
        issue_date_str = (certificate.issue_date or timezone.now().date()).strftime("%B %d, %Y")
        p.setFont("Helvetica", 11)
        p.setFillColor(charcoal)
        p.drawCentredString(width / 2.0, height - 360, f"Batch: {batch_name} | Issued on {issue_date_str}")

        # Draw QR Code if available
        if certificate.qr_code_image:
            try:
                qr_img = Image.open(certificate.qr_code_image.path)
                p.drawInlineImage(qr_img, 60, 45, width=90, height=90)
            except Exception:
                pass

        # Verification note next to QR
        p.setFont("Helvetica", 8)
        p.setFillColor(colors.HexColor('#777777'))
        p.drawString(160, 90, f"Certificate No: {certificate.certificate_number}")
        p.drawString(160, 75, f"Verification Token: {certificate.token[:16]}...")
        p.drawString(160, 60, "Scan QR code or verify online at verify.gnanacomputech.com")

        # Signature Lines
        p.setStrokeColor(charcoal)
        p.setLineWidth(1)
        p.line(width - 240, 75, width - 60, 75)
        p.setFont("Helvetica-Bold", 10)
        p.drawCentredString(width - 150, 60, "Authorized Signatory")
        p.setFont("Helvetica", 8)
        p.drawCentredString(width - 150, 48, "Gnana Computech Solutions Pvt. Ltd.")

        p.showPage()
        p.save()

        buffer.seek(0)
        pdf_bytes = buffer.getvalue()
        sha256_hash = hashlib.sha256(pdf_bytes).hexdigest()
        filename = f"{certificate.certificate_number}.pdf"
        return ContentFile(pdf_bytes, name=filename), sha256_hash

    @classmethod
    def issue_certificate(cls, enrollment, title="Certificate of Completion", issued_by=None) -> Certificate:
        """
        Full lifecycle:
        1. Check eligibility
        2. Create certificate record
        3. Generate QR code
        4. Render PDF + calculate SHA-256
        5. Mark ISSUED
        """
        eligibility = CertificateEligibilityService.evaluate(enrollment)
        if not eligibility['is_eligible']:
            raise ValueError(f"Student is not eligible for certificate: {'; '.join(eligibility['reasons'])}")

        cert = Certificate.objects.create(
            enrollment=enrollment,
            title=title,
            status='DRAFT',
            created_by=issued_by,
            issue_date=timezone.now().date()
        )

        # Generate QR code
        qr_file = cls.generate_qr_code(cert.token)
        cert.qr_code_image.save(f"qr_{cert.token[:12]}.png", qr_file, save=False)

        # Render PDF & SHA-256
        pdf_file, sha256_hash = cls.render_pdf(cert)
        cert.pdf_file.save(f"{cert.certificate_number}.pdf", pdf_file, save=False)
        cert.sha256_hash = sha256_hash
        cert.status = 'ISSUED'
        cert.save()

        return cert

    @classmethod
    def revoke_certificate(cls, certificate: Certificate, reason: str, revoked_by=None) -> Certificate:
        """
        Revocation keeps QR live but changes status to REVOKED (never a 404).
        """
        certificate.status = 'REVOKED'
        certificate.revoked_at = timezone.now()
        certificate.revocation_reason = reason
        certificate.updated_by = revoked_by
        certificate.save()
        return certificate

    @classmethod
    def reissue_certificate(cls, old_certificate: Certificate, reason: str, reissued_by=None) -> Certificate:
        """
        Reissue creates a new certificate linked via parent_certificate_id.
        """
        cls.revoke_certificate(old_certificate, f"Reissued due to: {reason}", revoked_by=reissued_by)

        new_cert = Certificate.objects.create(
            enrollment=old_certificate.enrollment,
            title=old_certificate.title,
            status='DRAFT',
            parent_certificate=old_certificate,
            created_by=reissued_by,
            issue_date=timezone.now().date()
        )

        qr_file = cls.generate_qr_code(new_cert.token)
        new_cert.qr_code_image.save(f"qr_{new_cert.token[:12]}.png", qr_file, save=False)

        pdf_file, sha256_hash = cls.render_pdf(new_cert)
        new_cert.pdf_file.save(f"{new_cert.certificate_number}.pdf", pdf_file, save=False)
        new_cert.sha256_hash = sha256_hash
        new_cert.status = 'ISSUED'
        new_cert.save()

        return new_cert
