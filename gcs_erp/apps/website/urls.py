from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.website.views import (
    PublicContactSubmitView,
    PublicStudentRegistrationSubmitView,
    PublicEnquirySubmitView,
    PublicProjectRegistrationSubmitView,
    PublicInternshipRegistrationSubmitView,
    PublicEventRegistrationSubmitView,
    ContactInquiryViewSet,
    StudentRegistrationInquiryViewSet,
    ProjectRegistrationViewSet,
    InternshipRegistrationViewSet,
    EventRegistrationViewSet,
    SiteContentViewSet,
)

router = DefaultRouter()
router.register(r'staff/contact-inquiries', ContactInquiryViewSet, basename='contact-inquiry')
router.register(r'staff/registration-inquiries', StudentRegistrationInquiryViewSet, basename='registration-inquiry')
router.register(r'staff/project-registrations', ProjectRegistrationViewSet, basename='project-registration')
router.register(r'staff/internship-registrations', InternshipRegistrationViewSet, basename='internship-registration')
router.register(r'staff/event-registrations', EventRegistrationViewSet, basename='event-registration')
router.register(r'content', SiteContentViewSet, basename='site-content')

urlpatterns = [
    # Public unauthenticated form submission endpoints
    path('public/contact/', PublicContactSubmitView.as_view(), name='public_contact_submit'),
    path('public/register/', PublicStudentRegistrationSubmitView.as_view(), name='public_register_submit'),
    path('public/enquire/', PublicEnquirySubmitView.as_view(), name='public_enquiry_submit'),
    path('public/register-project/', PublicProjectRegistrationSubmitView.as_view(), name='public_project_register_submit'),
    path('public/register-internship/', PublicInternshipRegistrationSubmitView.as_view(), name='public_internship_register_submit'),
    path('public/register-event/', PublicEventRegistrationSubmitView.as_view(), name='public_event_register_submit'),

    # Staff management endpoints (requires IsERPStaff)
    path('', include(router.urls)),
]
