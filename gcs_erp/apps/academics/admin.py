from django.contrib import admin
from apps.academics.models import (
    AcademicProject, Internship, Session, Attendance,
    Assignment, AssignmentSubmission, Assessment,
    AssessmentMark, MentorAllocation, StudentProgress
)


@admin.register(AcademicProject)
class AcademicProjectAdmin(admin.ModelAdmin):
    list_display = ['code', 'title', 'domain', 'technologies', 'is_available', 'created_at']
    list_filter = ['domain', 'is_available']
    search_fields = ['code', 'title', 'domain', 'technologies']
    ordering = ['title']


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ['code', 'title', 'domain', 'stipend_amount', 'duration_weeks', 'is_open', 'created_at']
    list_filter = ['domain', 'is_open']
    search_fields = ['code', 'title', 'domain']
    ordering = ['title']


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ['batch', 'topic', 'session_date', 'start_time', 'end_time', 'trainer', 'is_completed', 'created_at']
    list_filter = ['batch', 'is_completed', 'session_date']
    search_fields = ['topic', 'batch__name']
    ordering = ['-session_date', '-start_time']
    raw_id_fields = ['batch', 'trainer']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['session', 'enrollment', 'status', 'remarks', 'created_at']
    list_filter = ['status', 'session__batch']
    search_fields = ['enrollment__student__user__full_name', 'session__topic']
    raw_id_fields = ['session', 'enrollment']
    ordering = ['-created_at']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'batch', 'due_date', 'max_marks', 'created_at']
    list_filter = ['batch', 'due_date']
    search_fields = ['title', 'batch__name']
    ordering = ['-due_date']
    raw_id_fields = ['batch']


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ['assignment', 'enrollment', 'status', 'marks_obtained', 'created_at']
    list_filter = ['status', 'assignment__batch']
    search_fields = ['enrollment__student__user__full_name', 'assignment__title']
    ordering = ['-created_at']
    raw_id_fields = ['assignment', 'enrollment']


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'batch', 'assessment_type', 'max_marks', 'passing_marks', 'conducted_at', 'created_at']
    list_filter = ['assessment_type', 'batch']
    search_fields = ['title', 'batch__name']
    ordering = ['-conducted_at']
    raw_id_fields = ['batch']


@admin.register(AssessmentMark)
class AssessmentMarkAdmin(admin.ModelAdmin):
    list_display = ['assessment', 'enrollment', 'marks_obtained', 'is_passed', 'created_at']
    list_filter = ['is_passed', 'assessment__batch']
    search_fields = ['enrollment__student__user__full_name', 'assessment__title']
    ordering = ['-created_at']
    raw_id_fields = ['assessment', 'enrollment']


@admin.register(MentorAllocation)
class MentorAllocationAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'mentor', 'assigned_date', 'is_primary', 'created_at']
    list_filter = ['is_primary']
    search_fields = ['enrollment__student__user__full_name', 'mentor__user__full_name']
    raw_id_fields = ['enrollment', 'mentor']


@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'total_sessions', 'attended_sessions', 'attendance_percentage', 'assignments_completed', 'total_assignments', 'assessments_passed', 'is_eligible_for_completion', 'created_at']
    list_filter = ['is_eligible_for_completion', 'assessments_passed']
    search_fields = ['enrollment__student__user__full_name']
    readonly_fields = ['attendance_percentage']
    raw_id_fields = ['enrollment']
