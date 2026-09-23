from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.common.permissions import IsERPStaff, ContentAccess
from apps.website.models import ContactInquiry, StudentRegistrationInquiry, SiteContent
from apps.website.serializers import (
    ContactInquiryCreateSerializer, ContactInquirySerializer,
    StudentRegistrationInquiryCreateSerializer, StudentRegistrationInquirySerializer,
    SiteContentSerializer,
)


class PublicFormThrottle(AnonRateThrottle):
    """
    Strict rate limit for public form submission endpoints.
    Prevents spam / abuse of contact and registration forms.
    """
    rate = '20/hour'


# ---------------------------------------------------------------------------
# Public Form Submission Endpoints  (AllowAny + throttled)
# ---------------------------------------------------------------------------

class PublicContactSubmitView(APIView):
    """
    POST /api/v1/public/contact/
    Accepts and persists the contact form submission from the website /contact page.
    Returns 201 Created on success; never reveals whether the email already exists.
    Authentication is NOT required — this is a public endpoint.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = ContactInquiryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry = serializer.save()

        return Response(
            {
                "_message": "Thank you for reaching out! Our team will respond within 24 hours.",
                "reference_id": str(inquiry.id),
            },
            status=status.HTTP_201_CREATED,
        )


class PublicStudentRegistrationSubmitView(APIView):
    """
    POST /api/v1/public/register/
    Accepts and persists the student pre-enrollment application from the /register page.
    Returns 201 Created on success.
    Authentication is NOT required — this is a public endpoint.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = StudentRegistrationInquiryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry = serializer.save()

        return Response(
            {
                "_message": (
                    "Registration received! Our academic coordinator will contact you within 24 hours."
                ),
                "reference_id": str(inquiry.id),
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Staff-Facing Management ViewSets  (IsERPStaff)
# ---------------------------------------------------------------------------

class ContactInquiryViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for ERP staff to manage contact form submissions.
    Staff can update `status` and add `staff_notes`.
    """
    queryset = ContactInquiry.objects.all()
    serializer_class = ContactInquirySerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'subject']
    search_fields = ['name', 'email', 'phone', 'message']
    ordering_fields = ['created_at', 'status']
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']  # No public POST from staff side


class StudentRegistrationInquiryViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for ERP staff to manage student registration applications.
    Staff can update `status`, add `staff_notes`, and track conversion to enrollment.
    """
    queryset = StudentRegistrationInquiry.objects.all()
    serializer_class = StudentRegistrationInquirySerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'course', 'program']
    search_fields = ['full_name', 'email', 'phone', 'college']
    ordering_fields = ['created_at', 'status', 'preferred_date']
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']  # No public POST from staff side


# ---------------------------------------------------------------------------
# Site Content (marketing-site CMS) — public read, ERP-staff-only write
# ---------------------------------------------------------------------------

class SiteContentViewSet(viewsets.ModelViewSet):
    """
    GET  /api/v1/content/?section=partner   — anyone, only is_active=True items
    GET  /api/v1/content/?section=partner   — ERP staff, everything (incl. drafts)
    POST/PATCH/DELETE                       — ERP staff only

    One endpoint backs every editable marketing-site section (Section list:
    partner colleges, recognitions, about/owners, impact stats, events,
    services, internships, testimonials) — see SiteContent's docstring for
    why this is one flexible model rather than nine narrow ones.
    """
    queryset = SiteContent.objects.all()
    serializer_class = SiteContentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['section', 'is_active']
    search_fields = ['title', 'subtitle', 'description']
    ordering_fields = ['display_order', 'created_at', 'event_start']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        # Write: Full-access staff or Content Manager. Other Medium-access
        # roles (Trainer, Accounts, ...) can still see drafts (get_queryset
        # below), just not create/edit/delete them.
        return [ContentAccess()]

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated and IsERPStaff().has_permission(self.request, self):
            return self.queryset
        # Public visitors never see unpublished drafts.
        return self.queryset.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
