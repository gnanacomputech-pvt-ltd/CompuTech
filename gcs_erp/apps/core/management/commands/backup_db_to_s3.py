"""
Django management command to perform an encrypted or gzipped backup of the database
and upload it directly to Amazon S3 using boto3.
"""
import os
import gzip
import shutil
import tempfile
import subprocess
from datetime import datetime, timezone as dt_timezone
import boto3
from botocore.exceptions import ClientError

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = "Dumps the GCS ERP database and uploads the backup archive to Amazon S3."

    def add_arguments(self, parser):
        parser.add_argument(
            '--bucket',
            type=str,
            default=getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None),
            help='Target Amazon S3 bucket name (defaults to AWS_STORAGE_BUCKET_NAME in settings)'
        )
        parser.add_argument(
            '--prefix',
            type=str,
            default='database-backups',
            help='S3 key prefix / folder name (default: "database-backups")'
        )
        parser.add_argument(
            '--retention-days',
            type=int,
            default=14,
            help='Delete S3 backups older than this number of days (default: 14)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate backup creation without performing S3 upload or deletions'
        )

    def handle(self, *args, **options):
        bucket_name = options['bucket']
        prefix = options['prefix'].strip('/')
        retention_days = options['retention_days']
        dry_run = options['dry_run']

        if not bucket_name:
            raise CommandError(
                "No S3 bucket specified. Set AWS_STORAGE_BUCKET_NAME in settings or pass --bucket."
            )

        timestamp = datetime.now(dt_timezone.utc).strftime('%Y%m%d_%H%M%S')
        db_config = settings.DATABASES['default']
        engine = db_config.get('ENGINE', '')

        self.stdout.write(self.style.NOTICE(f"==> Initiating GCS ERP database backup to s3://{bucket_name}/{prefix}/"))

        with tempfile.TemporaryDirectory() as tmp_dir:
            if 'sqlite' in engine:
                archive_name = f"gcs_erp_db_{timestamp}.sqlite3.gz" if not ('memory' in str(db_config.get('NAME', ''))) else f"gcs_erp_db_{timestamp}.sql.gz"
                archive_path = os.path.join(tmp_dir, archive_name)
                db_name = str(db_config.get('NAME', ''))

                if 'memory' in db_name or db_name == ':memory:':
                    self.stdout.write(f"Dumping in-memory SQLite database via iterdump...")
                    from django.db import connection
                    with gzip.open(archive_path, 'wb', compresslevel=9) as f_out:
                        for line in connection.connection.iterdump():
                            f_out.write(f"{line}\n".encode('utf-8'))
                else:
                    db_path = db_config.get('NAME')
                    if not os.path.exists(db_path):
                        raise CommandError(f"SQLite database file not found at: {db_path}")
                    self.stdout.write(f"Compressing SQLite database: {db_path}...")
                    with open(db_path, 'rb') as f_in:
                        with gzip.open(archive_path, 'wb', compresslevel=9) as f_out:
                            shutil.copyfileobj(f_in, f_out)

            elif 'postgresql' in engine or 'postgres' in engine:
                archive_name = f"gcs_erp_db_{timestamp}.sql.gz"
                archive_path = os.path.join(tmp_dir, archive_name)

                pg_host = db_config.get('HOST', 'localhost')
                pg_port = str(db_config.get('PORT', '5432'))
                pg_user = db_config.get('USER', 'postgres')
                pg_db = db_config.get('NAME', 'postgres')
                pg_password = db_config.get('PASSWORD', '')

                self.stdout.write(f"Dumping PostgreSQL database: {pg_db} from {pg_host}:{pg_port}...")
                env = os.environ.copy()
                if pg_password:
                    env['PGPASSWORD'] = pg_password

                dump_proc = subprocess.Popen(
                    ['pg_dump', '-h', pg_host, '-p', pg_port, '-U', pg_user, '-d', pg_db, '--no-owner', '--no-privileges'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=env
                )
                with gzip.open(archive_path, 'wb', compresslevel=9) as gz_out:
                    shutil.copyfileobj(dump_proc.stdout, gz_out)

                dump_proc.wait()
                if dump_proc.returncode != 0:
                    err_msg = dump_proc.stderr.read().decode('utf-8')
                    raise CommandError(f"pg_dump failed (code {dump_proc.returncode}): {err_msg}")

            else:
                raise CommandError(f"Unsupported database engine for automated backup: {engine}")

            file_size_mb = os.path.getsize(archive_path) / (1024 * 1024)
            s3_key = f"{prefix}/{archive_name}"

            self.stdout.write(self.style.SUCCESS(
                f"[OK] Compressed archive created: {archive_name} ({file_size_mb:.2f} MB)"
            ))

            if dry_run:
                self.stdout.write(self.style.WARNING(
                    f"[DRY-RUN] Would upload {archive_path} to s3://{bucket_name}/{s3_key}"
                ))
                return

            # Initialize Boto3 S3 client
            boto_kwargs = {}
            if getattr(settings, 'AWS_ACCESS_KEY_ID', None):
                boto_kwargs['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
            if getattr(settings, 'AWS_SECRET_ACCESS_KEY', None):
                boto_kwargs['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
            if getattr(settings, 'AWS_S3_REGION_NAME', None):
                boto_kwargs['region_name'] = settings.AWS_S3_REGION_NAME
            if getattr(settings, 'AWS_S3_ENDPOINT_URL', None):
                boto_kwargs['endpoint_url'] = settings.AWS_S3_ENDPOINT_URL

            s3_client = boto3.client('s3', **boto_kwargs)

            try:
                self.stdout.write(f"Uploading to s3://{bucket_name}/{s3_key}...")
                s3_client.upload_file(
                    Filename=archive_path,
                    Bucket=bucket_name,
                    Key=s3_key,
                    ExtraArgs={'ServerSideEncryption': 'AES256'} if not getattr(settings, 'AWS_S3_ENDPOINT_URL', None) else {}
                )
                self.stdout.write(self.style.SUCCESS(f"[OK] Successfully uploaded: s3://{bucket_name}/{s3_key}"))
            except ClientError as exc:
                raise CommandError(f"Failed to upload backup to S3: {exc}")

            # Retention management
            if retention_days > 0:
                self.stdout.write(f"Pruning backups older than {retention_days} days in s3://{bucket_name}/{prefix}/...")
                try:
                    now = datetime.now(dt_timezone.utc)
                    paginator = s3_client.get_paginator('list_objects_v2')
                    deleted_count = 0
                    for page in paginator.paginate(Bucket=bucket_name, Prefix=f"{prefix}/"):
                        for obj in page.get('Contents', []):
                            age = (now - obj['LastModified']).days
                            if age >= retention_days:
                                self.stdout.write(f"  Deleting stale backup: {obj['Key']} ({age} days old)")
                                s3_client.delete_object(Bucket=bucket_name, Key=obj['Key'])
                                deleted_count += 1
                    self.stdout.write(self.style.SUCCESS(f"[OK] Pruned {deleted_count} stale backup(s)."))
                except ClientError as exc:
                    self.stdout.write(self.style.WARNING(f"Could not complete retention pruning: {exc}"))
