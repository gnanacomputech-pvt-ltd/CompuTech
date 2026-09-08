#!/usr/bin/env bash
# Render build script for gcs-erp-api
# Runs once before the web service starts on each deploy.
set -o errexit

# Install Python dependencies
pip install -r requirements.txt

# Collect static assets (whitenoise serves these)
python manage.py collectstatic --noinput

# Apply any pending database migrations
python manage.py migrate --noinput
