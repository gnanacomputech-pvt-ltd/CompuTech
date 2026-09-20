# Production Dockerfile for GCS ERP Backend
# Python 3.13 Slim — optimized for AWS ECS Fargate deployment
#
# Multi-stage build:
# 1. Builder stage: compiles Python packages (build-essential/libpq-dev/gcc)
# 2. Runtime stage: minimal image with only runtime dependencies
#
# Key properties:
# - Runs as non-root appuser
# - App source is copied (and chowned) before dropping root, so USER applies
#   cleanly regardless of which Docker builder (classic vs BuildKit) is used
# - libpq5 + curl kept in the runtime image: curl backs the ECS task
#   healthCheck command (docker/ecs/gcs-erp-api-task.json), libpq5 is a
#   defensive no-op if a future dependency needs the system client library
# - Gunicorn config is environment-driven (docker/gunicorn.conf.py)
FROM python:3.13-slim AS builder

# System dependencies (required to build psycopg2 and other C extensions)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements/ /app/requirements/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements/prod.txt

# ============================================================================
# Runtime image
# ============================================================================
FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python packages from builder stage
COPY --from=builder /usr/local/lib/python3.13/site-packages/ /usr/local/lib/python3.13/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Copy application source (as root — default for COPY with no --chown)
COPY . /app/

# Security: create the runtime user, then hand ownership of everything
# (source + static/media mount points) to it in one pass, and only then
# switch USER — this ordering is builder-agnostic.
RUN mkdir -p /app/staticfiles /app/media && \
    groupadd --system appgroup && \
    useradd --system --gid appgroup appuser && \
    chown -R appuser:appgroup /app

USER appuser

# Gunicorn tuning lives entirely in docker/gunicorn.conf.py (itself driven by
# GUNICORN_WORKERS / GUNICORN_THREADS / GUNICORN_BIND env vars) — no
# GUNICORN_CMD_ARGS here, since that env var overrides --config and would
# fight with it.

# Expose port expected by the ALB target group / ECS health check
EXPOSE 8000

# ---- Entrypoint ----
# Collect staticfiles, apply migrations, then launch Gunicorn.
# - Migration is idempotent (no-op if already applied)
# - collectstatic uses the S3MediaStorage backend if AWS_STORAGE_BUCKET_NAME is set
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate --noinput && gunicorn config.wsgi:application --config docker/gunicorn.conf.py"]
