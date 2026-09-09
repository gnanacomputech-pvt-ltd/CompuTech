import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.conf import settings
from apps.academics.models import Attendance, AssignmentSubmission, AssessmentMark, StudentProgress

logger = logging.getLogger(__name__)


def update_enrollment_progress(enrollment):
    """
    Recalculates attendance, assignments, and assessments for a single student enrollment.
    Invoked synchronously via signals whenever attendance, assignment submissions,
    or assessment marks change.
    """
    if not enrollment or not enrollment.batch:
        return

    batch = enrollment.batch
    total_sessions = batch.academic_sessions.count()
    attended = enrollment.attendance_records.filter(status__in=['PRESENT', 'EXCUSED']).count()
    pct = (attended / total_sessions * 100.0) if total_sessions > 0 else 0.0

    total_assignments = batch.assignments.count()
    completed_assignments = enrollment.assignment_submissions.filter(status='EVALUATED').count()

    assessments = batch.assessments.all()
    all_assessments_passed = True
    if assessments.exists():
        for ass in assessments:
            mark = enrollment.assessment_marks.filter(assessment=ass).first()
            if not mark or not mark.is_passed:
                all_assessments_passed = False
                break
    else:
        all_assessments_passed = True

    min_attendance = getattr(settings, 'MINIMUM_ATTENDANCE_PERCENTAGE', 75.0)
    assignments_ok = (completed_assignments >= total_assignments) if total_assignments > 0 else True
    is_eligible = (pct >= min_attendance) and assignments_ok and all_assessments_passed

    progress, _ = StudentProgress.objects.get_or_create(enrollment=enrollment)
    progress.total_sessions = total_sessions
    progress.attended_sessions = attended
    progress.attendance_percentage = round(pct, 2)
    progress.total_assignments = total_assignments
    progress.assignments_completed = completed_assignments
    progress.assessments_passed = all_assessments_passed
    progress.is_eligible_for_completion = is_eligible
    progress.save()


@receiver(post_save, sender=Attendance)
@receiver(post_delete, sender=Attendance)
def on_attendance_change(sender, instance, **kwargs):
    try:
        update_enrollment_progress(instance.enrollment)
    except Exception as exc:
        logger.warning(f"Failed to update progress on attendance change: {exc}")


@receiver(post_save, sender=AssignmentSubmission)
@receiver(post_delete, sender=AssignmentSubmission)
def on_submission_change(sender, instance, **kwargs):
    try:
        update_enrollment_progress(instance.enrollment)
    except Exception as exc:
        logger.warning(f"Failed to update progress on assignment submission change: {exc}")


@receiver(post_save, sender=AssessmentMark)
@receiver(post_delete, sender=AssessmentMark)
def on_mark_change(sender, instance, **kwargs):
    try:
        update_enrollment_progress(instance.enrollment)
    except Exception as exc:
        logger.warning(f"Failed to update progress on assessment mark change: {exc}")
