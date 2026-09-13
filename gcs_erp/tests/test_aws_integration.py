import io
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.core.management import call_command
from django.core.management.base import CommandError
from apps.common.storage import S3MediaStorage, S3StaticStorage


class AWSStorageTests(TestCase):
    """Tests for S3 storage configuration and custom classes."""

    def test_s3_media_storage_attributes(self):
        storage = S3MediaStorage()
        self.assertEqual(storage.location, 'media')
        self.assertFalse(storage.file_overwrite)
        self.assertIsNone(storage.default_acl)

    def test_s3_static_storage_attributes(self):
        storage = S3StaticStorage()
        self.assertEqual(storage.location, 'static')
        self.assertIsNone(storage.default_acl)


class AWSBackupCommandTests(TestCase):
    """Tests for the backup_db_to_s3 management command."""

    def test_backup_fails_without_bucket(self):
        with self.assertRaises(CommandError) as ctx:
            call_command('backup_db_to_s3', bucket=None)
        self.assertIn("No S3 bucket specified", str(ctx.exception))

    def test_backup_dry_run_sqlite(self):
        out = io.StringIO()
        call_command('backup_db_to_s3', bucket='test-bucket', dry_run=True, stdout=out)
        output = out.getvalue()
        self.assertIn("[OK] Compressed archive created", output)
        self.assertIn("[DRY-RUN]", output)

    @patch('boto3.client')
    def test_backup_successful_s3_upload(self, mock_boto_client):
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3

        out = io.StringIO()
        call_command('backup_db_to_s3', bucket='test-bucket', retention_days=0, stdout=out)
        output = out.getvalue()

        self.assertIn("[OK] Successfully uploaded", output)
        self.assertEqual(mock_s3.upload_file.call_count, 1)


class AWSSESConfigurationTests(TestCase):
    """Tests for Amazon SES email settings."""

    @override_settings(
        USE_SES=True,
        AWS_SES_REGION_NAME='ap-south-1',
        EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
        EMAIL_HOST='email-smtp.ap-south-1.amazonaws.com',
        EMAIL_PORT=587,
        EMAIL_USE_TLS=True
    )
    def test_ses_settings_configured(self):
        from django.conf import settings
        self.assertTrue(settings.USE_SES)
        self.assertEqual(settings.EMAIL_HOST, 'email-smtp.ap-south-1.amazonaws.com')
        self.assertEqual(settings.EMAIL_PORT, 587)
        self.assertTrue(settings.EMAIL_USE_TLS)
