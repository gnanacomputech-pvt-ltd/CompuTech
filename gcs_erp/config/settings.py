import os
import sys
from pathlib import Path
from datetime import timedelta
import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Ensure apps directory is on PYTHONPATH
sys.path.insert(0, str(BASE_DIR))

# Load .env file
load_dotenv(BASE_DIR / '.env')

# Sentry Initialization (Section 2 & 9 — optional, only enabled if SENTRY_DSN is set)
SENTRY_DSN = os.getenv('SENTRY_DSN')
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[DjangoIntegration(), CeleryIntegration()],
            traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
            send_default_pii=False,
            environment=os.getenv('SENTRY_ENVIRONMENT', 'production' if not os.getenv('DEBUG', 'True').lower() in ('true', '1', 't') else 'development'),
            release=os.getenv('GIT_COMMIT_SHA', 'gcs-erp@2.0.0'),
        )
    except ImportError:
        pass

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    SECRET_KEY = 'gcs-erp-dev-insecure-key-change-in-production-2026'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

# AWS deployment: only allow explicitly configured production hosts
ALLOWED_HOSTS = [
    host.strip() for host in os.getenv(
        'ALLOWED_HOSTS',
        'localhost,127.0.0.1,testserver,api.gnanacomputech.com,verify.gnanacomputech.com,gnanacomputech.com'
    ).split(',') if host.strip()
]

# Reverse proxy SSL termination (works for ALB/CloudFront and Render)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# CSRF Trusted Origins - strict CORS policy, no wildcards in production
CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CSRF_TRUSTED_ORIGINS',
        'https://gnanacomputech.com,https://www.gnanacomputech.com,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
    ).split(',') if origin.strip()
]

# ---------------------------------------------------------------------------
# Security Headers (Section 9 — HTTPS, HSTS, CSP, X-Frame, etc.)
# ---------------------------------------------------------------------------
# HSTS: 1 year + preload + subdomains (only in production behind TLS)
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))  # 0 = disabled for dev
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Enforce HTTPS redirects (ALB/CloudFront terminates TLS, so only if proxy sets X-Forwarded-Proto)
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1', 't')

# Secure cookies (session, CSRF)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Clickjacking protection
X_FRAME_OPTIONS = 'DENY'

# MIME type sniffing protection
SECURE_CONTENT_TYPE_NOSNIFF = True

# Referrer policy
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Content Security Policy — tightened for production
# Report-only mode first; tighten after testing
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")  # Tailwind needs unsafe-inline for JIT
CSP_IMG_SRC = ("'self'", 'data:', 'https:')
CSP_FONT_SRC = ("'self'", 'data:')
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # GCS ERP Domain Apps
    'apps.common',
    'apps.core',
    'apps.academics',
    'apps.finance',
    'apps.website',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Additional Security Headers (enforced via middleware)
# These headers are added via Django's SecurityMiddleware settings below

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Custom User Model (Section 3.1 & 6)
AUTH_USER_MODEL = 'core.User'

# Database Configuration
# AWS: RDS PostgreSQL Multi-AZ behind RDS Proxy, with SSL enforced
# Local dev: SQLite fallback when DATABASE_URL is absent
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=0,              # RDS Proxy manages connections; disable client-side pooling
            conn_health_checks=True,
            ssl_require=True if not DEBUG else False,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# When running on AWS ECS behind RDS Proxy, Django must not try to manage
# its own connection pool — let RDS Proxy handle connection reuse.
# In local Docker Compose, the app talks directly to PostgreSQL.
if os.getenv('RDS_PROXY_ENABLED', 'False').lower() in ('true', '1', 't'):
    DATABASES['default']['CONN_MAX_AGE'] = 0  # RDS Proxy handles pooling

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# ---------------------------------------------------------------------------
# Object Storage Configuration (AWS S3, Cloudflare R2, MinIO)
# ---------------------------------------------------------------------------
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME') or os.getenv('R2_BUCKET_NAME')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('R2_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY') or os.getenv('R2_SECRET_ACCESS_KEY')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', os.getenv('AWS_REGION', 'ap-south-1'))
AWS_S3_ENDPOINT_URL = os.getenv('AWS_S3_ENDPOINT_URL') or os.getenv('R2_ENDPOINT_URL')
AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN')  # e.g. CloudFront distribution domain
AWS_S3_SIGNATURE_VERSION = os.getenv('AWS_S3_SIGNATURE_VERSION', 's3v4')
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}

# AWS S3 IAM role-based auth (ECS task role) — prefer over static keys
AWS_USE_IAM_ROLE_FOR_S3 = os.getenv('AWS_USE_IAM_ROLE_FOR_S3', 'True').lower() in ('true', '1', 't')

# ---------------------------------------------------------------------------
# Storage Configuration (AWS S3 or local FileSystem)
# ---------------------------------------------------------------------------
# When running on ECS Fargate with AWS_STORAGE_BUCKET_NAME set, media files
# (certificates, uploads) are stored on S3 and served via CloudFront. Otherwise,
# use the local filesystem during development.

if AWS_STORAGE_BUCKET_NAME:
    STORAGES = {
        "default": {
            "BACKEND": "apps.common.storage.S3MediaStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
        },
    }
    DEFAULT_FILE_STORAGE = 'apps.common.storage.S3MediaStorage'
    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"
    elif AWS_S3_ENDPOINT_URL:
        MEDIA_URL = f"{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/media/"
    else:
        MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/media/"
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
        },
    }
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
    MEDIA_URL = '/media/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'apps.common.renderers.EnvelopeJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'EXCEPTION_HANDLER': 'apps.common.exceptions.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'apps.common.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # App-level rate limiting (Section 9) — supplements AWS WAF rate-based rules
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'user': os.getenv('THROTTLE_USER_RATE', '1000/hour'),
        'anon': os.getenv('THROTTLE_ANON_RATE', '100/hour'),
    },
}

# AWS WAF / ALB forwarded headers — trust X-Forwarded-For from CloudFront/ALB
# Use SECURE_PROXY_SSL_HEADER and USE_X_FORWARDED_HOST appropriately
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
IPWARE_META_PRECEDENCE_ORDER = (
    'HTTP_X_FORWARDED_FOR',   # CloudFront/ALB forwarded IP
    'REMOTE_ADDR',             # direct client IP
)

# SimpleJWT Configuration (Section 2 & 9)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_MINUTES', 30))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Configuration — scoped to known production origins only
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        'CORS_ALLOWED_ORIGINS',
        'https://gnanacomputech.com,https://www.gnanacomputech.com,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
    ).split(',') if origin.strip()
]
# No regex-based origins — strict allowlist only
CORS_ALLOWED_ORIGIN_REGEXES = []
CORS_ALLOW_CREDENTIALS = True

# OpenAPI Documentation (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'GCS ERP API',
    'DESCRIPTION': 'Production API for Gnana Computech Solutions Private Limited (GCS ERP) — Managing Students, Batches, Academics, Fees, and QR-Verified Certificates.',
    'VERSION': '2.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/v[0-9]',
}

# Celery & Redis Configuration (Section 2 & 7)
# AWS ElastiCache Redis with TLS (rediss://) or local redis://
REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/0')
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

# ElastiCache Redis connection options
# When using ElastiCache with TLS (rediss://), configure SSL
if REDIS_URL.startswith('rediss://'):
    CELERY_BROKER_USE_SSL = {
        'ssl_cert_reqs': None,  # ElastiCache uses self-signed CA; verify disabled
    }
    CELERY_REDIS_BACKEND_USE_SSL = CELERY_BROKER_USE_SSL
    CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Scheduler (for periodic tasks)
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Celery worker settings for production
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Email Configuration (Supports AWS SES SMTP, Gmail, or Console)
AWS_SES_REGION_NAME = os.getenv('AWS_SES_REGION_NAME', os.getenv('AWS_REGION', 'ap-south-1'))
USE_SES = os.getenv('USE_SES', 'False').lower() in ('true', '1', 't')

if USE_SES:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = f'email-smtp.{AWS_SES_REGION_NAME}.amazonaws.com'
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv('AWS_SES_SMTP_USERNAME') or os.getenv('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.getenv('AWS_SES_SMTP_PASSWORD') or os.getenv('EMAIL_HOST_PASSWORD', '')
else:
    EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
    EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
    EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@gnanacomputech.com')
SERVER_EMAIL = os.getenv('SERVER_EMAIL', DEFAULT_FROM_EMAIL)

# Business Logic Constants (Section 8 — Certificate Eligibility)
MINIMUM_ATTENDANCE_PERCENTAGE = float(os.getenv('MINIMUM_ATTENDANCE_PERCENTAGE', 75.0))
