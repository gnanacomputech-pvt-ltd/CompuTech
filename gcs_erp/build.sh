#!/usr/bin/env bash
# Container and build script for gcs-erp-api
# Runs collectstatic and applies database migrations on deployment.
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Collect static assets (WhiteNoise / S3)
python manage.py collectstatic --noinput

# Apply any pending database migrations
python manage.py migrate --noinput
