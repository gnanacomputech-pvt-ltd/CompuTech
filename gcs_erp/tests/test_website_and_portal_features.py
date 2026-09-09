from decimal import Decimal
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from apps.core.models import (
    User, Role, UserRole, Institution, Program, Batch, Student, Enrollment
)
from apps.academics.models import (
    Session, Attendance, Assignment, AssignmentSubmission, Assessment, AssessmentMark, StudentProgress
)
from apps.website.models import ContactInquiry, StudentRegistrationInquiry


class WebsiteInquiryTests(APITestCase):
    """Tests for public contact and registration forms and staff management."""

    def setUp(self):
        self.staff_role, _ = Role.objects.get_or_create(code='ADMIN', defaults={'name': 'Admin'})
        self.staff_user = User.objects.create_user(
            email='admin_website@example.com',
            password='Password123!',
            full_name='Staff Admin',
            is_staff=True
        )
        UserRole.objects.get_or_create(user=self.staff_user, role=self.staff_role)

    def test_public_contact_submission_success(self):
        payload = {
            'name': 'Prajwal Gowda',
            'email': 'prajwal@gmail.com',
            'phone': '9876543210',
            'subject': 'Academic Project Enquiry',
            'message': 'I would like to inquire about BCA final year project topics.'
        }
        res = self.client.post('/api/v1/public/contact/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ContactInquiry.objects.filter(email='prajwal@gmail.com').exists())
        inquiry = ContactInquiry.objects.get(email='prajwal@gmail.com')
        self.assertEqual(inquiry.status, 'NEW')
        self.assertEqual(inquiry.name, 'Prajwal Gowda')

    def test_public_contact_validation_failure(self):
        payload = {
            'name': 'Prajwal Gowda',
            'email': 'not-an-email',
            'phone': '123',  # invalid phone
            'subject': 'General Query',
            'message': 'Short'  # message < 10 chars
        }
        res = self.client.post('/api/v1/public/contact/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_registration_submission_success(self):
        payload = {
            'full_name': 'Megha Rao',
            'email': 'megha@example.com',
            'phone': '+91 9988776655',
            'college': 'RV College of Engineering',
            'course': 'BCA (Bachelor of Computer Applications)',
            'program': 'Academic Project Guidance',
            'message': 'Interested in Python / AI track.'
        }
        res = self.client.post('/api/v1/public/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(StudentRegistrationInquiry.objects.filter(email='megha@example.com').exists())
        inquiry = StudentRegistrationInquiry.objects.get(email='megha@example.com')
        self.assertEqual(inquiry.full_name, 'Megha Rao')
        self.assertEqual(inquiry.status, 'NEW')

    def test_staff_manage_inquiries(self):
        inquiry = ContactInquiry.objects.create(
            name='Test Person',
            email='test@example.com',
            phone='9876543210',
            subject='Course Admission',
            message='Need details on React course.'
        )

        # Unauthenticated access rejected
        res = self.client.get('/api/v1/staff/contact-inquiries/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Staff access allowed
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.get('/api/v1/staff/contact-inquiries/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Patch status
        patch_res = self.client.patch(
            f'/api/v1/staff/contact-inquiries/{inquiry.id}/',
            {'status': 'REPLIED', 'staff_notes': 'Contacted student on phone.'}
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, 'REPLIED')
        self.assertEqual(inquiry.staff_notes, 'Contacted student on phone.')


class UserRegistrationAuthTests(APITestCase):
    """Tests for student self-registration endpoint."""

    def test_successful_user_registration(self):
        payload = {
            'email': 'newstudent@example.com',
            'full_name': 'Ananya Sharma',
            'phone': '9876543211',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!'
        }
        res = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.data.get('data', res.data)
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertEqual(data['user']['email'], 'newstudent@example.com')
        self.assertIn('STUDENT', data['user']['roles'])

        # Verify user persisted in database
        user = User.objects.get(email='newstudent@example.com')
        self.assertTrue(user.check_password('SecurePassword123!'))

    def test_registration_password_mismatch(self):
        payload = {
            'email': 'mismatch@example.com',
            'full_name': 'Mismatch Test',
            'password': 'Password123!',
            'confirm_password': 'PasswordDifferent!'
        }
        res = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_duplicate_email(self):
        User.objects.create_user(email='existing@example.com', password='Password123!', full_name='Existing')
        payload = {
            'email': 'existing@example.com',
            'full_name': 'Duplicate User',
            'password': 'Password123!',
            'confirm_password': 'Password123!'
        }
        res = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class DashboardStatsTests(APITestCase):
    """Tests for the ERP Dashboard Stats API."""

    def setUp(self):
        self.admin_role, _ = Role.objects.get_or_create(code='SUPER_ADMIN', defaults={'name': 'Super Admin'})
        self.student_role, _ = Role.objects.get_or_create(code='STUDENT', defaults={'name': 'Student'})

        self.admin_user = User.objects.create_user(
            email='dashadmin@example.com', password='Password123!', full_name='Dash Admin', is_superuser=True
        )
        UserRole.objects.get_or_create(user=self.admin_user, role=self.admin_role)

        self.student_user = User.objects.create_user(
            email='dashstudent@example.com', password='Password123!', full_name='Dash Student'
        )
        UserRole.objects.get_or_create(user=self.student_user, role=self.student_role)

        self.institution = Institution.objects.create(code='DASH-INST', name='Dash College')
        self.student_profile = Student.objects.create(
            user=self.student_user, institution=self.institution, degree='BCA', semester=6
        )

    def test_dashboard_stats_unauthenticated(self):
        res = self.client.get('/api/v1/dashboard/stats/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_dashboard_stats_erp_staff(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/v1/dashboard/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data.get('data', res.data)
        self.assertIn('students', data)
        self.assertIn('enrollments', data)
        self.assertIn('batches', data)
        self.assertIn('finance', data)
        self.assertIn('certificates', data)

    def test_dashboard_stats_student(self):
        self.client.force_authenticate(user=self.student_user)
        res = self.client.get('/api/v1/dashboard/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data.get('data', res.data)
        self.assertIn('student', data)
        self.assertEqual(data['student']['name'], 'Dash Student')


class AcademicSignalsTests(APITestCase):
    """Tests that Django signals auto-recalculate StudentProgress."""

    def setUp(self):
        self.institution = Institution.objects.create(code='SIG-INST', name='Signal Institute')
        self.program = Program.objects.create(
            code='SIG-PROG', title='Signal Program', program_type='INTERNSHIP', base_fee=Decimal('5000')
        )
        self.batch = Batch.objects.create(
            name='Signal Batch', program=self.program, institution=self.institution,
            start_date=timezone.now().date()
        )
        self.user = User.objects.create_user(
            email='sigstudent@example.com', password='Password123!', full_name='Signal Student'
        )
        self.student = Student.objects.create(user=self.user, institution=self.institution)
        self.enrollment = Enrollment.objects.create(
            student=self.student, program=self.program, batch=self.batch, institution=self.institution,
            status='ACTIVE'
        )

    def test_attendance_signal_updates_student_progress(self):
        session1 = Session.objects.create(
            batch=self.batch, session_date=timezone.now().date(),
            start_time='10:00:00', end_time='11:00:00', topic='Intro'
        )
        session2 = Session.objects.create(
            batch=self.batch, session_date=timezone.now().date(),
            start_time='11:00:00', end_time='12:00:00', topic='Deep Dive'
        )

        # Mark 1 session present
        Attendance.objects.create(session=session1, enrollment=self.enrollment, status='PRESENT')

        progress = StudentProgress.objects.get(enrollment=self.enrollment)
        self.assertEqual(progress.total_sessions, 2)
        self.assertEqual(progress.attended_sessions, 1)
        self.assertEqual(float(progress.attendance_percentage), 50.0)

        # Mark 2nd session present
        att2 = Attendance.objects.create(session=session2, enrollment=self.enrollment, status='PRESENT')
        progress.refresh_from_db()
        self.assertEqual(progress.attended_sessions, 2)
        self.assertEqual(float(progress.attendance_percentage), 100.0)

        # Delete an attendance record
        att2.delete()
        progress.refresh_from_db()
        self.assertEqual(progress.attended_sessions, 1)
        self.assertEqual(float(progress.attendance_percentage), 50.0)
