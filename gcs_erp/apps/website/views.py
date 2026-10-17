from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.throttling import AnonRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.common.permissions import IsERPStaff, ContentAccess
from apps.website.models import (
    ContactInquiry, StudentRegistrationInquiry, SiteContent,
    ProjectRegistration, InternshipRegistration, EventRegistration,
)
from apps.website.serializers import (
    ContactInquiryCreateSerializer, ContactInquirySerializer,
    StudentRegistrationInquiryCreateSerializer, StudentRegistrationInquirySerializer,
    SiteContentSerializer, EnquirySubmitSerializer,
    ProjectRegistrationCreateSerializer, ProjectRegistrationSerializer,
    InternshipRegistrationCreateSerializer, InternshipRegistrationSerializer,
    EventRegistrationCreateSerializer, EventRegistrationSerializer,
)
from apps.website.emails import (
    send_contact_inquiry_to_staff,
    send_registration_inquiry_to_staff,
    send_enquiry_to_staff,
    send_project_registration_to_staff,
    send_internship_registration_to_staff,
    send_event_registration_to_staff,
)


class PublicFormThrottle(AnonRateThrottle):
    """
    Rate limit for public form submission endpoints.
    Protects against automated abuse while allowing sufficient submissions for testing.
    Uses 'public_form' scope defined in settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
    """
    scope = 'public_form'


# ---------------------------------------------------------------------------
# Public Form Submission Endpoints  (AllowAny + throttled)
# ---------------------------------------------------------------------------

class PublicContactSubmitView(APIView):
    """
    POST /api/v1/public/contact/
    Accepts and persists the contact form submission from the website /contact page.
    Sends full notification to staff with all details.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = ContactInquiryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry = serializer.save()

        # Send full details to staff
        try:
            send_contact_inquiry_to_staff(inquiry)
        except Exception:
            pass

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
    Sends full notification to staff with all details.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = StudentRegistrationInquiryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry = serializer.save()

        # Send full details to staff
        try:
            send_registration_inquiry_to_staff(inquiry)
        except Exception:
            pass

        return Response(
            {
                "_message": (
                    "Registration received! Our academic coordinator will contact you within 24 hours."
                ),
                "reference_id": str(inquiry.id),
            },
            status=status.HTTP_201_CREATED,
        )


class PublicEnquirySubmitView(APIView):
    """
    POST /api/v1/public/enquire/
    Accepts program & admission enquiry submissions from the /enquire page.
    Sends full notification to staff with all details.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = EnquirySubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Store in database as ContactInquiry so staff can manage in dashboard
        college_prefix = f"College / Org: {data['college']}\n" if data.get('college') else ""
        mode_prefix = f"Preferred Mode: {data['training_mode']}\n" if data.get('training_mode') else ""
        formatted_message = f"{college_prefix}{mode_prefix}\nEnquiry Message:\n{data['message']}"

        subject = data.get('interest') or 'Academic Project Enquiry'
        # Map to valid ContactInquiry SUBJECT_CHOICES if needed
        valid_subjects = dict(ContactInquiry.SUBJECT_CHOICES)
        mapped_subject = subject if subject in valid_subjects else 'Academic Project Enquiry'

        inquiry = ContactInquiry.objects.create(
            name=data['full_name'],
            email=data['email'],
            phone=data['phone'],
            subject=mapped_subject,
            message=formatted_message,
            status='NEW',
        )

        # Send full details to staff
        try:
            send_enquiry_to_staff(data, reference_id=str(inquiry.id))
        except Exception:
            pass

        return Response(
            {
                "_message": "Thank you for your enquiry! Our academic counseling team will contact you within 24 hours.",
                "reference_id": str(inquiry.id),
            },
            status=status.HTTP_201_CREATED,
        )


class PublicProjectRegistrationSubmitView(APIView):
    """
    POST /api/v1/public/register-project/
    Public submission for academic / final-year project guidance.
    Notifies staff with candidate and project details.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = ProjectRegistrationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()

        try:
            send_project_registration_to_staff(project)
        except Exception:
            pass

        return Response(
            {
                "_message": "Project registration submitted! Our technical project coordinator will contact you within 24 hours.",
                "reference_id": str(project.id),
            },
            status=status.HTTP_201_CREATED,
        )


class PublicInternshipRegistrationSubmitView(APIView):
    """
    POST /api/v1/public/register-internship/
    Public submission for IT / software internship applications.
    Notifies staff with applicant profile and track details.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = InternshipRegistrationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        internship = serializer.save()

        try:
            send_internship_registration_to_staff(internship)
        except Exception:
            pass

        return Response(
            {
                "_message": "Internship application submitted! Our HR/training team will review your profile and get in touch.",
                "reference_id": str(internship.id),
            },
            status=status.HTTP_201_CREATED,
        )


class PublicEventRegistrationSubmitView(APIView):
    """
    POST /api/v1/public/register-event/
    Public submission for workshop and event registrations.
    Notifies staff with attendee count and event details.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PublicFormThrottle]

    def post(self, request):
        serializer = EventRegistrationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event_reg = serializer.save()

        try:
            send_event_registration_to_staff(event_reg)
        except Exception:
            pass

        return Response(
            {
                "_message": "Event registration confirmed! See you at the session.",
                "reference_id": str(event_reg.id),
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


class ProjectRegistrationViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for ERP staff to manage academic project registrations.
    """
    queryset = ProjectRegistration.objects.all()
    serializer_class = ProjectRegistrationSerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'degree', 'project_domain']
    search_fields = ['full_name', 'email', 'phone', 'college', 'project_title']
    ordering_fields = ['created_at', 'status']
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']


class InternshipRegistrationViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for ERP staff to manage internship applications.
    """
    queryset = InternshipRegistration.objects.all()
    serializer_class = InternshipRegistrationSerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'internship_track', 'duration', 'mode']
    search_fields = ['full_name', 'email', 'phone', 'college', 'skills_or_portfolio']
    ordering_fields = ['created_at', 'status', 'start_date']
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']


class EventRegistrationViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for ERP staff to manage event registrations.
    """
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'attendee_type', 'participation_mode']
    search_fields = ['full_name', 'email', 'phone', 'event_title', 'college_or_organization']
    ordering_fields = ['created_at', 'status', 'ticket_count']
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']


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
    # Multipart as well as JSON: gallery photos and blog covers are uploaded
    # as files from the staff dashboard (SiteContent.image), while the
    # URL-based sections keep posting plain JSON.
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['section', 'is_active']
    search_fields = ['title', 'subtitle', 'description']
    ordering_fields = ['display_order', 'created_at', 'event_start']

    def get_throttles(self):
        if self.action in ('list', 'retrieve'):
            return []
        return super().get_throttles()

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
