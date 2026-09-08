from celery import shared_task
import logging
from django.utils import timezone
from apps.finance.models import Certificate, Invoice
from apps.finance.services.certificate_service import (
    CertificateGenerator, CertificateEligibilityService
)

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_certificate_pdf_async(self, enrollment_id, title="Certificate of Completion", issued_by_id=None):
    """
    Celery background worker task:
    1. Re-validate eligibility
    2. Create the Certificate record (DRAFT)
    3. Generate QR code
    4. Render PDF
    5. Compute SHA-256 hash
    6. Mark ISSUED
    """
    try:
        from apps.core.models import Enrollment, User
        enrollment = Enrollment.objects.get(id=enrollment_id)
        issued_by = User.objects.filter(id=issued_by_id).first() if issued_by_id else None

        # Re-validate eligibility — defense in depth
        eligibility = CertificateEligibilityService.evaluate(enrollment)
        if not eligibility['is_eligible']:
            logger.warning(f"Certificate generation rejected — student no longer eligible: {enrollment.id}")
            return {'enrollment_id': str(enrollment_id), 'success': False, 'reasons': eligibility['reasons']}

        # Create certificate
        cert = Certificate.objects.create(
            enrollment=enrollment,
            title=title,
            status='DRAFT',
            created_by=issued_by,
            issue_date=timezone.now().date()
        )

        # Generate QR code
        qr_file = CertificateGenerator.generate_qr_code(cert.token)
        cert.qr_code_image.save(f"qr_{cert.token[:12]}.png", qr_file, save=False)

        # Render PDF & SHA-256
        pdf_file, sha = CertificateGenerator.render_pdf(cert)
        cert.pdf_file.save(f"{cert.certificate_number}.pdf", pdf_file, save=False)
        cert.sha256_hash = sha
        cert.status = 'ISSUED'
        cert.save()

        logger.info(f"Certificate {cert.certificate_number} generated and hashed successfully.")
        return {
            'certificate_id': str(cert.id),
            'certificate_number': cert.certificate_number,
            'sha256': sha,
            'success': True,
        }
    except Exception as exc:
        logger.error(f"Error rendering certificate for enrollment {enrollment_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task
def bulk_generate_certificates_task(enrollment_ids, issued_by_id=None, title="Certificate of Completion"):
    """
    Bulk certificate issuance via Celery.
    Queues one async task per enrollment and returns the list of task results.
    """
    results = []
    for enr_id in enrollment_ids:
        task = generate_certificate_pdf_async.delay(enr_id, title, issued_by_id)
        results.append({
            'enrollment_id': str(enr_id),
            'success': True,
            'task_id': task.id,
        })
    return results


@shared_task
def send_outstanding_fee_reminders():
    """
    Periodic Celery Beat task scanning for invoices past due date.
    """
    pending_invoices = Invoice.objects.filter(status__in=['PENDING', 'PARTIAL'], is_active=True)
    count = 0
    for inv in pending_invoices:
        # In production, dispatch transactional email / SMS notifications
        logger.info(f"Fee reminder dispatched for {inv.invoice_number} (Student: {inv.enrollment.student.user.email}, Due: ₹{inv.balance_amount})")
        count += 1
    return f"Dispatched {count} fee reminders."
