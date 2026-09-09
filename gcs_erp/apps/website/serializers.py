import re
from rest_framework import serializers
from apps.website.models import ContactInquiry, StudentRegistrationInquiry


PHONE_RE = re.compile(r'^[0-9+\s\-]{10,15}$')


def validate_phone(value):
    if not PHONE_RE.match(value.strip()):
        raise serializers.ValidationError(
            "Enter a valid phone number (10–15 digits, may include +, spaces, or hyphens)."
        )
    return value.strip()


# ---------------------------------------------------------------------------
# Contact Form
# ---------------------------------------------------------------------------

class ContactInquiryCreateSerializer(serializers.ModelSerializer):
    """
    Public write-only serializer for POST /api/v1/public/contact/.
    Exposes only the fields the visitor submits — status is set server-side.
    """
    class Meta:
        model = ContactInquiry
        fields = ['name', 'email', 'phone', 'subject', 'message']

    def validate_phone(self, value):
        return validate_phone(value)

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Message must be at least 10 characters.")
        return value.strip()


class ContactInquirySerializer(serializers.ModelSerializer):
    """
    Full serializer for authenticated staff to read/manage inquiries.
    """
    class Meta:
        model = ContactInquiry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


# ---------------------------------------------------------------------------
# Student Registration Inquiry Form
# ---------------------------------------------------------------------------

class StudentRegistrationInquiryCreateSerializer(serializers.ModelSerializer):
    """
    Public write-only serializer for POST /api/v1/public/register/.
    """
    class Meta:
        model = StudentRegistrationInquiry
        fields = ['full_name', 'email', 'phone', 'college', 'course', 'program', 'preferred_date', 'message']

    def validate_phone(self, value):
        return validate_phone(value)

    def validate_college(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Please enter a valid college or institution name.")
        return value.strip()


class StudentRegistrationInquirySerializer(serializers.ModelSerializer):
    """
    Full serializer for authenticated staff to read/manage registration inquiries.
    """
    class Meta:
        model = StudentRegistrationInquiry
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
