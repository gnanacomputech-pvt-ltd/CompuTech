from django.db import models
from django.utils import timezone
from apps.common.models import AuditModel, TimeStampedModel, generate_business_id
from apps.core.models import Batch, Enrollment, Employee


class AcademicProject(AuditModel):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    domain = models.CharField(max_length=100, db_index=True)  # AI/ML, Cloud, Web, IoT, etc.
    abstract = models.TextField(blank=True)
    technologies = models.CharField(max_length=255, blank=True)
    documentation_url = models.URLField(blank=True, null=True)
    synopsis_url = models.URLField(blank=True, null=True)
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'academics_projects'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} [{self.domain}]"


class Internship(AuditModel):
    code = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    domain = models.CharField(max_length=100, db_index=True)
    stipend_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_weeks = models.PositiveIntegerField(default=8)
    prerequisites = models.TextField(blank=True)
    is_open = models.BooleanField(default=True)

    class Meta:
        db_table = 'academics_internships'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.domain})"


class Session(AuditModel):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='academic_sessions')
    session_date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    topic = models.CharField(max_length=255)
    trainer = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='conducted_sessions')
    is_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'academics_sessions'
        ordering = ['-session_date', '-start_time']

    def __str__(self):
        return f"{self.batch.name} - {self.topic} ({self.session_date})"


class Attendance(TimeStampedModel):
    STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
    )

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='attendances')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name='attendance_records')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    remarks = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'academics_attendance'
        unique_together = ('session', 'enrollment')
        ordering = ['-session__session_date']

    def __str__(self):
        return f"{self.enrollment.student.user.full_name}: {self.session.topic} - {self.status}"


class Assignment(AuditModel):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField()
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)

    class Meta:
        db_table = 'academics_assignments'
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.title} ({self.batch.name})"


class AssignmentSubmission(TimeStampedModel):
    STATUS_CHOICES = (
        ('SUBMITTED', 'Submitted'),
        ('EVALUATED', 'Evaluated'),
        ('REJECTED', 'Rejected'),
    )

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name='assignment_submissions')
    submission_url = models.URLField(blank=True)
    submission_file = models.FileField(upload_to='assignments/submissions/', blank=True, null=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    feedback = models.TextField(blank=True)

    class Meta:
        db_table = 'academics_assignment_submissions'
        unique_together = ('assignment', 'enrollment')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.enrollment.student.user.full_name} -> {self.assignment.title}"


class Assessment(AuditModel):
    ASSESSMENT_TYPES = (
        ('QUIZ', 'Quiz'),
        ('MID_TERM', 'Mid-Term Exam'),
        ('FINAL_EXAM', 'Final Exam'),
        ('PROJECT_VIVA', 'Project Viva Defense'),
    )

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assessments')
    title = models.CharField(max_length=255)
    assessment_type = models.CharField(max_length=30, choices=ASSESSMENT_TYPES)
    max_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100.0)
    passing_marks = models.DecimalField(max_digits=5, decimal_places=2, default=40.0)
    conducted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'academics_assessments'
        ordering = ['-conducted_at']

    def __str__(self):
        return f"{self.title} ({self.batch.name})"


class AssessmentMark(TimeStampedModel):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='student_marks')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name='assessment_marks')
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2)
    is_passed = models.BooleanField(default=False)

    class Meta:
        db_table = 'academics_assessment_marks'
        unique_together = ('assessment', 'enrollment')

    def save(self, *args, **kwargs):
        if self.assessment and self.marks_obtained is not None:
            self.is_passed = self.marks_obtained >= self.assessment.passing_marks
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.enrollment.student.user.full_name} - {self.assessment.title}: {self.marks_obtained}"


class MentorAllocation(AuditModel):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='mentor_allocations')
    mentor = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='mentored_students')
    assigned_date = models.DateField(default=timezone.now)
    is_primary = models.BooleanField(default=True)

    class Meta:
        db_table = 'academics_mentor_allocations'
        unique_together = ('enrollment', 'mentor')

    def __str__(self):
        return f"{self.mentor.user.full_name} -> {self.enrollment.student.user.full_name}"


class StudentProgress(TimeStampedModel):
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='academic_progress')
    total_sessions = models.IntegerField(default=0)
    attended_sessions = models.IntegerField(default=0)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    assignments_completed = models.IntegerField(default=0)
    total_assignments = models.IntegerField(default=0)
    assessments_passed = models.BooleanField(default=False)
    is_eligible_for_completion = models.BooleanField(default=False)

    class Meta:
        db_table = 'academics_student_progress'

    def __str__(self):
        return f"{self.enrollment.student.user.full_name} Progress: {self.attendance_percentage}% Attended"
