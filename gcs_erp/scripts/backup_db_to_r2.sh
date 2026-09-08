#!/usr/bin/env bash
# GCS ERP - Automated Encrypted PostgreSQL Backup to Cloudflare R2
# Hostinger VPS Cron Job: Runs daily at 02:00 UTC
#
# Prerequisite: aws-cli configured with Cloudflare R2 credentials or rclone

set -euo pipefail

BACKUP_DIR="/var/backups/gcs_erp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="gcs_erp_db_${TIMESTAMP}.sql.gz.enc"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
RETENTION_DAYS=14

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL backup for GCS ERP..."

# 1. Dump database and compress
docker exec gcs_erp_db pg_dump -U "${POSTGRES_USER:-gcs_admin}" "${POSTGRES_DB:-gcs_erp_production}" \
  | gzip -9 \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:BACKUP_ENCRYPTION_KEY -out "${BACKUP_FILEPATH}"

echo "[$(date)] Database encrypted backup created at: ${BACKUP_FILEPATH}"

# 2. Upload to Cloudflare R2 using AWS CLI (S3-compatible API)
if command -v aws >/dev/null 2>&1 && [ -n "${R2_BUCKET_NAME:-}" ]; then
  echo "[$(date)] Uploading ${BACKUP_FILENAME} to Cloudflare R2 (${R2_BUCKET_NAME})..."
  aws s3 cp "${BACKUP_FILEPATH}" "s3://${R2_BUCKET_NAME}/database-backups/${BACKUP_FILENAME}" \
    --endpoint-url "${R2_ENDPOINT_URL}"
  echo "[$(date)] Upload completed successfully."
fi

# 3. Clean up local backups older than retention window
find "${BACKUP_DIR}" -name "gcs_erp_db_*.sql.gz.enc" -type f -mtime +"${RETENTION_DAYS}" -delete
echo "[$(date)] Cleaned up local backups older than ${RETENTION_DAYS} days."
