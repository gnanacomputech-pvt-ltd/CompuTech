from rest_framework import serializers
from apps.finance.models import FeeStructure, Invoice, Payment, FeeReceipt, Certificate


class FeeStructureSerializer(serializers.ModelSerializer):
    program_title = serializers.ReadOnlyField(source='program.title')
    batch_name = serializers.ReadOnlyField(source='batch.name')

    class Meta:
        model = FeeStructure
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeeReceiptSerializer(serializers.ModelSerializer):
    payment_details = PaymentSerializer(source='payment', read_only=True)

    class Meta:
        model = FeeReceipt
        fields = '__all__'
        read_only_fields = ['id', 'receipt_number', 'issued_at']


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='enrollment.student.user.full_name')
    program_title = serializers.ReadOnlyField(source='enrollment.program.title')
    balance_amount = serializers.ReadOnlyField()
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']


class CertificateSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='enrollment.student.user.full_name')
    student_usn = serializers.ReadOnlyField(source='enrollment.student.usn')
    program_title = serializers.ReadOnlyField(source='enrollment.program.title')
    institution_name = serializers.ReadOnlyField(source='enrollment.institution.name')

    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = [
            'id', 'certificate_number', 'token', 'issue_date',
            'revoked_at', 'sha256_hash', 'pdf_file', 'qr_code_image',
            'created_at', 'updated_at'
        ]


class PublicCertificateVerificationSerializer(serializers.Serializer):
    """
    QR-scan verification payload — role-based (Section 5.3):

    Anonymous / public scan -> only the non-sensitive fields below the
    "Personal details" marker are ever populated: certificate_number,
    student_name, program, institution, status, issue_date, validity. This
    is the only payload anyone without an ERP-staff session ever receives,
    matching Section 5.3's "never exposes phone, email, DOB, address,
    payment details, or government ID."

    Authenticated ERP staff (IsERPStaff — see views.py) additionally get the
    personal (email, phone, USN, degree, semester, branch) and course
    (batch, enrollment status, dates, attendance) fields, so staff scanning
    a certificate in the field can confirm the holder's full record without
    a separate lookup. Financial data (invoices, payments, fees) is never
    included here regardless of role.
    """
    certificate_number = serializers.CharField()
    student_name = serializers.CharField()
    program = serializers.CharField()
    institution = serializers.CharField()
    status = serializers.CharField()
    issue_date = serializers.DateField(allow_null=True)
    is_valid = serializers.BooleanField()
    verification_message = serializers.CharField()
    revocation_reason = serializers.CharField(allow_blank=True, required=False)
    # ---- Personal details (ERP staff only) ----
    student_id = serializers.CharField(required=False)
    usn = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(allow_blank=True, required=False)
    degree = serializers.CharField(allow_blank=True, required=False)
    semester = serializers.IntegerField(required=False)
    branch = serializers.CharField(allow_blank=True, required=False)
    # ---- Course details (ERP staff only) ----
    batch = serializers.CharField(required=False)
    enrollment_status = serializers.CharField(required=False)
    enrolled_on = serializers.DateField(required=False)
    completed_on = serializers.DateField(allow_null=True, required=False)
    attendance_percentage = serializers.FloatField(required=False)
