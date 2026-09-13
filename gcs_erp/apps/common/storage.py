"""
Custom storage backends for AWS S3 and S3-compatible object storage.
"""
import os
from storages.backends.s3boto3 import S3Boto3Storage


class S3MediaStorage(S3Boto3Storage):
    """
    Storage backend for uploaded media files (certificates, avatars, assignment submissions).
    Isolates uploaded assets under the configured location (default: 'media/').
    Enforces non-overwrite to prevent generated certificates from being clobbered.
    """
    location = os.getenv('AWS_MEDIA_LOCATION', 'media')
    file_overwrite = False
    default_acl = None


class S3StaticStorage(S3Boto3Storage):
    """
    Optional storage backend for static assets when served directly from S3/CloudFront
    instead of WhiteNoise.
    """
    location = os.getenv('AWS_STATIC_LOCATION', 'static')
    default_acl = None
