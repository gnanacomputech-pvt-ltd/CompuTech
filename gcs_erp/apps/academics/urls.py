from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.academics.views import (
    AcademicProjectViewSet, InternshipViewSet, SessionViewSet,
    AttendanceViewSet, AssignmentViewSet, AssignmentSubmissionViewSet,
    AssessmentViewSet, AssessmentMarkViewSet, MentorAllocationViewSet,
    StudentProgressViewSet
)

router = DefaultRouter()
router.register(r'projects', AcademicProjectViewSet, basename='academic-project')
router.register(r'internships', InternshipViewSet, basename='internship')
router.register(r'sessions', SessionViewSet, basename='session')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', AssignmentSubmissionViewSet, basename='assignment-submission')
router.register(r'assessments', AssessmentViewSet, basename='assessment')
router.register(r'marks', AssessmentMarkViewSet, basename='assessment-mark')
router.register(r'mentor-allocations', MentorAllocationViewSet, basename='mentor-allocation')
router.register(r'progress', StudentProgressViewSet, basename='student-progress')

urlpatterns = [
    path('', include(router.urls)),
]
