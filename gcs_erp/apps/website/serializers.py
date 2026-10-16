import re
from rest_framework import serializers
from apps.website.models import ContactInquiry, StudentRegistrationInquiry, SiteContent


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


# ---------------------------------------------------------------------------
# Site Content (marketing-site CMS)
# ---------------------------------------------------------------------------

class SiteContentSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.full_name')
    # The single field every consumer should render: an uploaded file if
    # there is one, otherwise the pasted URL. Saves each public page from
    # re-deciding which of the two is populated.
    image_src = serializers.SerializerMethodField()

    class Meta:
        model = SiteContent
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_image_src(self, obj):
        if obj.image:
            request = self.context.get('request')
            url = obj.image.url
            # MEDIA_URL is a relative path in local dev, so the SPA (served
            # from a different port) needs this absolutised. On S3 the url is
            # already absolute and build_absolute_uri leaves it alone.
            return request.build_absolute_uri(url) if request else url
        return obj.image_url or ''

    def validate(self, attrs):
        """`extra` has to stay a JSON object: multipart form posts send it as
        a string, and a stray scalar would break every consumer that reads
        `extra.features`/`extra.category` and friends."""
        extra = attrs.get('extra')
        if extra is not None and not isinstance(extra, dict):
            raise serializers.ValidationError(
                {"extra": "Must be a JSON object, e.g. {\"category\": \"Workshops\"}."}
            )
        return attrs
