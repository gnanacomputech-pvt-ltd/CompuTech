from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.finance.views import (
    PublicCertificateVerificationView, PublicCertificateWebVerificationView,
    CertificateViewSet, FeeStructureViewSet, InvoiceViewSet,
    PaymentViewSet, FeeReceiptViewSet
)

router = DefaultRouter()
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'receipts', FeeReceiptViewSet, basename='receipt')
router.register(r'certificates', CertificateViewSet, basename='certificate')

urlpatterns = [
    # Public QR verification endpoint (Section 5.3) — JSON API for developers
    path('public/certificates/verify/<str:token>/', PublicCertificateVerificationView.as_view(), name='public_certificate_verify'),
    # Public QR web verification page — mobile-friendly HTML for end users
    # Note: the HTML route is registered at the project URL level (/verify/<token>/)
    path('', include(router.urls)),
]
