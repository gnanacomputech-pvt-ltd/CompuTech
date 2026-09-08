from django.contrib import admin
from apps.finance.models import (
    FeeStructure, Invoice, Payment, FeeReceipt, Certificate
)


@admin.register(FeeStructure)
class FeeStructureAdmin(admin.ModelAdmin):
    list_display = ['title', 'program', 'batch', 'tuition_fee', 'registration_fee', 'exam_fee', 'total_fee', 'created_at']
    list_filter = ['program']
    search_fields = ['title', 'program__title']
    raw_id_fields = ['program', 'batch']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'enrollment', 'total_amount', 'paid_amount', 'balance_amount', 'due_date', 'status', 'created_at']
    list_filter = ['status', 'due_date']
    search_fields = ['invoice_number', 'enrollment__student__user__full_name']
    ordering = ['-created_at']
    raw_id_fields = ['enrollment']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'invoice', 'amount', 'payment_mode', 'status', 'payment_date', 'created_at']
    list_filter = ['status', 'payment_mode', 'payment_date']
    search_fields = ['transaction_id', 'invoice__invoice_number']
    ordering = ['-payment_date']
    raw_id_fields = ['invoice']


@admin.register(FeeReceipt)
class FeeReceiptAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'payment', 'issued_at', 'created_at']
    search_fields = ['receipt_number', 'payment__transaction_id']
    ordering = ['-issued_at']
    raw_id_fields = ['payment']
    readonly_fields = ['receipt_number', 'created_at']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_number', 'enrollment', 'title', 'status', 'issue_date', 'revoked_at', 'parent_certificate', 'sha256_hash_short', 'created_at']
    list_filter = ['status', 'issue_date']
    search_fields = ['certificate_number', 'enrollment__student__user__full_name', 'token']
    ordering = ['-created_at']
    raw_id_fields = ['enrollment', 'parent_certificate']
    readonly_fields = ['certificate_number', 'token', 'sha256_hash', 'qr_code_image', 'pdf_file', 'created_at', 'updated_at']

    def sha256_hash_short(self, obj):
        return f"{obj.sha256_hash[:16]}..." if obj.sha256_hash else "-"
    sha256_hash_short.short_description = "SHA-256"
