from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.website.views import (
    PublicContactSubmitView,
    PublicStudentRegistrationSubmitView,
    ContactInquiryViewSet,
    StudentRegistrationInquiryViewSet,
)

router = DefaultRouter()
router.register(r'staff/contact-inquiries', ContactInquiryViewSet, basename='contact-inquiry')
router.register(r'staff/registration-inquiries', StudentRegistrationInquiryViewSet, basename='registration-inquiry')

urlpatterns = [
    # Public unauthenticated form submission endpoints
    path('public/contact/', PublicContactSubmitView.as_view(), name='public_contact_submit'),
    path('public/register/', PublicStudentRegistrationSubmitView.as_view(), name='public_register_submit'),

    # Staff management endpoints (requires IsERPStaff)
    path('', include(router.urls)),
]
