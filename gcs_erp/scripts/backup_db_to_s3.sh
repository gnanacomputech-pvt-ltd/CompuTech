#!/usr/bin/env bash
# ==============================================================================
# GCS ERP — Automated PostgreSQL / SQLite Database Backup to Amazon S3
# ==============================================================================
# Usage:
#   ./scripts/backup_db_to_s3.sh [--dry-run]
#
# Environment variables expected:
#   AWS_STORAGE_BUCKET_NAME  - S3 bucket name (e.g. gcs-erp-backups-production)
#   AWS_S3_REGION_NAME       - AWS region (e.g. ap-south-1)
#   AWS_ACCESS_KEY_ID        - AWS IAM Access Key (optional if running on EC2/ECS with IAM role)
#   AWS_SECRET_ACCESS_KEY    - AWS IAM Secret Key (optional if running on EC2/ECS with IAM role)
#   RETENTION_DAYS           - Retention window in days (default: 14)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "${SCRIPT_DIR}")"

cd "${ROOT_DIR}"

RETENTION_DAYS="${RETENTION_DAYS:-14}"
BUCKET="${AWS_STORAGE_BUCKET_NAME:-}"

if [ -z "${BUCKET}" ]; then
  echo "ERROR: AWS_STORAGE_BUCKET_NAME environment variable is not set." >&2
  exit 1
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting automated database backup to Amazon S3..."

python manage.py backup_db_to_s3 \
  --bucket "${BUCKET}" \
  --prefix "database-backups" \
  --retention-days "${RETENTION_DAYS}" \
  "$@"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup process finished successfully."
