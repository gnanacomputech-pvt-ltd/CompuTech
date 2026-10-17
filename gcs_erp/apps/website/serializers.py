import re
from rest_framework import serializers
from apps.website.models import (
    ContactInquiry, StudentRegistrationInquiry, SiteContent,
    ProjectRegistration, InternshipRegistration, EventRegistration,
)


def validate_phone(value):
    val = value.strip()
    digits = re.sub(r'\D', '', val)
    # Strip leading India country code 91 if present with 12 digits
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    if len(digits) == 0:
        raise serializers.ValidationError("Phone number is required.")
    if len(digits) > 10:
        raise serializers.ValidationError("Phone number must not exceed 10 digits.")
    if len(digits) < 10:
        raise serializers.ValidationError("Enter a valid 10-digit phone number.")
    return digits


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


class EnquirySubmitSerializer(serializers.Serializer):
    """
    Public serializer for POST /api/v1/public/enquire/.
    """
    full_name = serializers.CharField(required=True, max_length=255)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=True, max_length=20)
    college = serializers.CharField(required=False, allow_blank=True, max_length=255, default='')
    interest = serializers.CharField(required=False, allow_blank=True, max_length=150, default='Academic Project Guidance')
    training_mode = serializers.CharField(required=False, allow_blank=True, max_length=100, default='Classroom / Offline')
    message = serializers.CharField(required=True, min_length=10)

    def validate_phone(self, value):
        return validate_phone(value)


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
# Project Registration Form (Academic & Final Year Projects)
# ---------------------------------------------------------------------------

class ProjectRegistrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRegistration
        fields = [
            'full_name', 'email', 'phone', 'college', 'degree',
            'year_or_semester', 'project_domain', 'project_title',
            'team_size', 'preferred_technology', 'message'
        ]

    def validate_phone(self, value):
        return validate_phone(value)

    def validate_college(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Please enter your college name.")
        return value.strip()


class ProjectRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectRegistration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


# ---------------------------------------------------------------------------
# Internship Registration Form (IT / Software Internships)
# ---------------------------------------------------------------------------

class InternshipRegistrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipRegistration
        fields = [
            'full_name', 'email', 'phone', 'college', 'degree',
            'semester', 'internship_track', 'duration', 'mode',
            'start_date', 'skills_or_portfolio', 'message'
        ]

    def validate_phone(self, value):
        return validate_phone(value)

    def validate_college(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Please enter your college name.")
        return value.strip()


class InternshipRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipRegistration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


# ---------------------------------------------------------------------------
# Event Registration Form (Workshops & Seminars)
# ---------------------------------------------------------------------------

class EventRegistrationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = [
            'full_name', 'email', 'phone', 'event_title',
            'college_or_organization', 'attendee_type',
            'ticket_count', 'participation_mode', 'message'
        ]

    def validate_phone(self, value):
        return validate_phone(value)

    def validate_event_title(self, value):
        if not value or len(value.strip()) < 2:
            raise serializers.ValidationError("Event title is required.")
        return value.strip()


class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
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
