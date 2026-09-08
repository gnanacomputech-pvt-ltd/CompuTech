from rest_framework import serializers
from apps.academics.models import (
    AcademicProject, Internship, Session, Attendance,
    Assignment, AssignmentSubmission, Assessment, AssessmentMark,
    MentorAllocation, StudentProgress
)


class AcademicProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProject
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SessionSerializer(serializers.ModelSerializer):
    batch_name = serializers.ReadOnlyField(source='batch.name')
    trainer_name = serializers.ReadOnlyField(source='trainer.user.full_name')

    class Meta:
        model = Session
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='enrollment.student.user.full_name')
    student_usn = serializers.ReadOnlyField(source='enrollment.student.usn')
    session_topic = serializers.ReadOnlyField(source='session.topic')
    session_date = serializers.ReadOnlyField(source='session.session_date')

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class BulkAttendanceItemSerializer(serializers.Serializer):
    enrollment_id = serializers.UUIDField(required=True)
    status = serializers.ChoiceField(choices=['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], default='PRESENT')
    remarks = serializers.CharField(required=False, allow_blank=True, default='')


class BulkAttendanceSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=True)
    records = BulkAttendanceItemSerializer(many=True)


class AssignmentSerializer(serializers.ModelSerializer):
    batch_name = serializers.ReadOnlyField(source='batch.name')

    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='enrollment.student.user.full_name')
    assignment_title = serializers.ReadOnlyField(source='assignment.title')

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at', 'created_at', 'updated_at']


class AssessmentSerializer(serializers.ModelSerializer):
    batch_name = serializers.ReadOnlyField(source='batch.name')

    class Meta:
        model = Assessment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssessmentMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='enrollment.student.user.full_name')
    student_usn = serializers.ReadOnlyField(source='enrollment.student.usn')
    assessment_title = serializers.ReadOnlyField(source='assessment.title')

    class Meta:
        model = AssessmentMark
        fields = '__all__'
        read_only_fields = ['id', 'is_passed', 'created_at', 'updated_at']


class MentorAllocationSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='enrollment.student.user.full_name')
    mentor_name = serializers.ReadOnlyField(source='mentor.user.full_name')

    class Meta:
        model = MentorAllocation
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentProgressSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='enrollment.student.user.full_name')
    batch_name = serializers.ReadOnlyField(source='enrollment.batch.name')
    program_title = serializers.ReadOnlyField(source='enrollment.program.title')

    class Meta:
        model = StudentProgress
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
