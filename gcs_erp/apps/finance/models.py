import uuid
import secrets
from django.db import models
from django.utils import timezone
from apps.common.models import AuditModel, TimeStampedModel, generate_business_id
from apps.core.models import Enrollment, Program, Batch


class FeeStructure(AuditModel):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='fee_structures')
    batch = models.ForeignKey(Batch, null=True, blank=True, on_delete=models.SET_NULL, related_name='fee_structures')
    title = models.CharField(max_length=150)
    tuition_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    registration_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'finance_fee_structures'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title}: ₹{self.total_fee}"


class Invoice(AuditModel):
    INVOICE_STATUS = (
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
        ('CANCELLED', 'Cancelled'),
    )

    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name='invoices')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=INVOICE_STATUS, default='PENDING', db_index=True)

    class Meta:
        db_table = 'finance_invoices'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.invoice_number} ({self.enrollment.student.user.full_name}): ₹{self.total_amount}"

    @property
    def balance_amount(self):
        return self.total_amount - self.paid_amount

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            count = Invoice.objects.count() + 1
            self.invoice_number = generate_business_id('INV', count)
        super().save(*args, **kwargs)


class Payment(TimeStampedModel):
    PAYMENT_MODES = (
        ('UPI', 'UPI / QR Code'),
        ('BANK_TRANSFER', 'NEFT / RTGS / IMPS'),
        ('CASH', 'Cash'),
        ('CARD', 'Credit / Debit Card'),
        ('CHEQUE', 'Bank Cheque / DD'),
    )

    PAYMENT_STATUS = (
        ('SUCCESS', 'Success'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed'),
    )

    transaction_id = models.CharField(max_length=100, unique=True, db_index=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=30, choices=PAYMENT_MODES, default='UPI')
    payment_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='SUCCESS')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'finance_payments'
        ordering = ['-payment_date']

    def __str__(self):
        return f"Payment ₹{self.amount} for {self.invoice.invoice_number} [{self.transaction_id}]"


class FeeReceipt(TimeStampedModel):
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    issued_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'finance_receipts'
        ordering = ['-issued_at']

    def __str__(self):
        return f"{self.receipt_number} (₹{self.payment.amount})"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            count = FeeReceipt.objects.count() + 1
            self.receipt_number = generate_business_id('REC', count)
        super().save(*args, **kwargs)


class Certificate(AuditModel):
    """
    Section 8 Certificate Specification:
    - Unique Certificate Number
    - Cryptographically random token
    - Status: DRAFT, ELIGIBLE, ISSUED, REVOKED
    - SHA-256 hash of PDF
    - Reissue links to parent_certificate (preserving full auditability)
    - Revocation keeps QR live but status becomes REVOKED (never a 404)
    """
    CERTIFICATE_STATUS = (
        ('DRAFT', 'Draft'),
        ('ELIGIBLE', 'Eligible'),
        ('ISSUED', 'Issued'),
        ('REVOKED', 'Revoked'),
    )

    certificate_number = models.CharField(max_length=60, unique=True, db_index=True)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name='certificates')
    title = models.CharField(max_length=255, default='Certificate of Completion')
    status = models.CharField(max_length=20, choices=CERTIFICATE_STATUS, default='DRAFT', db_index=True)
    issue_date = models.DateField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revocation_reason = models.TextField(blank=True)
    parent_certificate = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reissued_certificates'
    )
    pdf_file = models.FileField(upload_to='certificates/pdfs/', blank=True, null=True)
    sha256_hash = models.CharField(max_length=64, blank=True, db_index=True)
    qr_code_image = models.ImageField(upload_to='certificates/qrs/', blank=True, null=True)

    class Meta:
        db_table = 'finance_certificates'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.certificate_number} - {self.enrollment.student.user.full_name} [{self.status}]"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        if not self.certificate_number:
            count = Certificate.objects.count() + 1
            self.certificate_number = generate_business_id('CERT', count)
        super().save(*args, **kwargs)
