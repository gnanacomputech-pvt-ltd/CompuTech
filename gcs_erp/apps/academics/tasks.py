from celery import shared_task
import logging
from apps.core.models import Enrollment
from apps.academics.models import StudentProgress, Attendance, AssignmentSubmission

logger = logging.getLogger(__name__)


@shared_task
def recalculate_all_attendance_progress():
    """
    Periodic Celery Beat job to recalculate attendance percentage & completion status for all active enrollments.
    """
    enrollments = Enrollment.objects.filter(status__in=['ACTIVE', 'COMPLETED']).select_related('batch')
    updated = 0

    for enr in enrollments:
        total_sessions = enr.batch.academic_sessions.count()
        attended = enr.attendance_records.filter(status__in=['PRESENT', 'EXCUSED']).count()
        pct = (attended / total_sessions * 100) if total_sessions > 0 else 0.0

        total_assignments = enr.batch.assignments.count()
        completed_assignments = enr.assignment_submissions.filter(status='EVALUATED').count()

        progress, _ = StudentProgress.objects.get_or_create(enrollment=enr)
        progress.total_sessions = total_sessions
        progress.attended_sessions = attended
        progress.attendance_percentage = round(pct, 2)
        progress.total_assignments = total_assignments
        progress.assignments_completed = completed_assignments
        from django.conf import settings
        min_attendance = getattr(settings, 'MINIMUM_ATTENDANCE_PERCENTAGE', 75.0)
        progress.is_eligible_for_completion = (pct >= min_attendance) and (completed_assignments >= total_assignments if total_assignments > 0 else True)
        progress.save()
        updated += 1

    logger.info(f"Recalculated academic progress for {updated} enrollments.")
    return f"Recalculated {updated} enrollments."
