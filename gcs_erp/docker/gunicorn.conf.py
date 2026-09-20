# Gunicorn configuration for GCS ERP on AWS ECS Fargate
# Worker count and threads are sized based on ECS task CPU/memory allocation
# Tune these values based on actual load and ECS task resource limits

import os

# Server socket
bind = os.environ.get("GUNICORN_BIND", "0.0.0.0:8000")
backlog = int(os.environ.get("GUNICORN_BACKLOG", "2048"))

# Worker processes
# Rule of thumb: 2-4 workers per CPU core, but Fargate tasks are small
# ECS task CPU=0.5 vCPU → 2 workers; CPU=1 vCPU → 4 workers
workers = int(os.environ.get("GUNICORN_WORKERS", "4"))
threads = int(os.environ.get("GUNICORN_THREADS", "2"))
worker_class = "gthread"  # Threaded workers for Django + I/O-bound tasks

# Timeouts
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))
keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", "5"))
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", "30"))

# Logging
accesslog = "-"  # Log to stdout (captured by CloudWatch)
errorlog = "-"   # Log to stderr (captured by CloudWatch)
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
access_log_format = (
    '%(h)s %(l)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'
)

# Process naming
proc_name = "gcs-erp-api"

# Server mechanics
daemon = False
pidfile = None
umask = 0o007
user = "appuser"
group = "appgroup"
tmp_upload_dir = None

# SSL (if terminating at Gunicorn — typically not needed behind ALB)
keyfile = None
certfile = None
ssl_version = None

# Worker temp dir
worker_tmp_dir = "/tmp/gunicorn-worker"
