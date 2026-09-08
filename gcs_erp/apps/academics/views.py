from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404

from apps.common.permissions import IsERPStaff
from apps.academics.models import (
    AcademicProject, Internship, Session, Attendance,
    Assignment, AssignmentSubmission, Assessment, AssessmentMark,
    MentorAllocation, StudentProgress
)
from apps.core.models import Enrollment
from apps.academics.serializers import (
    AcademicProjectSerializer, InternshipSerializer, SessionSerializer,
    AttendanceSerializer, BulkAttendanceSerializer, AssignmentSerializer,
    AssignmentSubmissionSerializer, AssessmentSerializer,
    AssessmentMarkSerializer, MentorAllocationSerializer,
    StudentProgressSerializer
)


class AcademicProjectViewSet(viewsets.ModelViewSet):
    queryset = AcademicProject.objects.all()
    serializer_class = AcademicProjectSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['domain', 'is_available']
    search_fields = ['title', 'code', 'domain', 'technologies']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsERPStaff()]


class InternshipViewSet(viewsets.ModelViewSet):
    queryset = Internship.objects.all()
    serializer_class = InternshipSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['domain', 'is_open']
    search_fields = ['title', 'code', 'domain']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsERPStaff()]


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related('batch', 'trainer__user').all()
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['batch', 'session_date', 'is_completed']
    search_fields = ['topic']


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('session', 'enrollment__student__user').all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['session', 'enrollment', 'status']

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(enrollment__student__user=user)
        return self.queryset

    @action(detail=False, methods=['post'], url_path='bulk-mark', permission_classes=[IsERPStaff])
    def bulk_mark(self, request):
        """
        Bulk mark attendance for an entire session.
        """
        serializer = BulkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data['session_id']
        records = serializer.validated_data['records']
        session = get_object_or_404(Session, id=session_id)

        created_or_updated = 0
        for item in records:
            enrollment_id = item['enrollment_id']
            status_val = item['status']
            remarks = item.get('remarks', '')

            Attendance.objects.update_or_create(
                session=session,
                enrollment_id=enrollment_id,
                defaults={'status': status_val, 'remarks': remarks}
            )
            created_or_updated += 1

        session.is_completed = True
        session.save(update_fields=['is_completed'])

        return Response({
            'session_id': str(session.id),
            'records_processed': created_or_updated,
            'message': f"Successfully processed {created_or_updated} attendance records."
        }, status=status.HTTP_200_OK)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related('batch').all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['batch']
    search_fields = ['title']


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.select_related('assignment', 'enrollment__student__user').all()
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['assignment', 'enrollment', 'status']

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(enrollment__student__user=user)
        return self.queryset


class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.select_related('batch').all()
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['batch', 'assessment_type']
    search_fields = ['title']


class AssessmentMarkViewSet(viewsets.ModelViewSet):
    queryset = AssessmentMark.objects.select_related('assessment', 'enrollment__student__user').all()
    serializer_class = AssessmentMarkSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['assessment', 'enrollment', 'is_passed']

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(enrollment__student__user=user)
        return self.queryset


class MentorAllocationViewSet(viewsets.ModelViewSet):
    queryset = MentorAllocation.objects.select_related('mentor__user', 'enrollment__student__user').all()
    serializer_class = MentorAllocationSerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['mentor', 'enrollment']


class StudentProgressViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StudentProgress.objects.select_related('enrollment__student__user', 'enrollment__program', 'enrollment__batch').all()
    serializer_class = StudentProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(enrollment__student__user=user)
        return self.queryset
