import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('gcs_erp')

# Load task config from Django settings with namespace 'CELERY'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

# Celery Beat Scheduled Tasks (Section 7)
app.conf.beat_schedule = {
    'recalculate-attendance-percentages-nightly': {
        'task': 'apps.academics.tasks.recalculate_all_attendance_progress',
        'schedule': crontab(hour=1, minute=0), # Every night at 1:00 AM
    },
    'send-fee-reminders-weekly': {
        'task': 'apps.finance.tasks.send_outstanding_fee_reminders',
        'schedule': crontab(day_of_week='monday', hour=9, minute=0), # Every Monday at 9:00 AM
    },
}
