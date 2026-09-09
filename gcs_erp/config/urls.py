from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
)
from apps.finance.views import PublicCertificateWebVerificationView

urlpatterns = [
    # Admin Interface
    path('admin/', admin.site.urls),

    # OpenAPI 3.0 Documentation (Swagger & ReDoc)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 Domain Routes
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/academics/', include('apps.academics.urls')),
    path('api/v1/', include('apps.finance.urls')),
    path('api/v1/', include('apps.website.urls')),

    # Public QR web verification page — mobile-friendly, mobile-first, no auth
    # Rate-limited via nginx zone 'public_verify_limit' configured in docker/nginx/nginx.conf
    path('verify/<str:token>/', PublicCertificateWebVerificationView.as_view(), name='public_certificate_web_verify'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
