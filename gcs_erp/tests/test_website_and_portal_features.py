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
from apps.website.models import (
    ContactInquiry, StudentRegistrationInquiry,
    ProjectRegistration, InternshipRegistration, EventRegistration,
)


class WebsiteInquiryTests(APITestCase):
    """Tests for public contact and registration forms and staff management."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()
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

    def test_public_enquire_submission_success(self):
        from django.core import mail
        mail.outbox.clear()
        payload = {
            'full_name': 'Kavya Suresh',
            'email': 'kavya@gmail.com',
            'phone': '9123456789',
            'college': 'BMS College of Engineering',
            'interest': 'Full Stack Web Development',
            'training_mode': 'Hybrid (Classroom + Online)',
            'message': 'Please provide fee structure and syllabus for the weekend batch.'
        }
        res = self.client.post('/api/v1/public/enquire/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ContactInquiry.objects.filter(email='kavya@gmail.com').exists())
        inquiry = ContactInquiry.objects.get(email='kavya@gmail.com')
        self.assertEqual(inquiry.name, 'Kavya Suresh')
        self.assertIn('BMS College of Engineering', inquiry.message)
        self.assertIn('Hybrid', inquiry.message)
        # Staff email should be triggered
        self.assertTrue(len(mail.outbox) >= 1)
        self.assertIn('[New Enquiry]', mail.outbox[-1].subject)
        self.assertIn('Kavya Suresh', mail.outbox[-1].body)
        self.assertIn('9123456789', mail.outbox[-1].body)

    def test_phone_max_10_digits_enforced(self):
        # 11 digits without +91 should fail
        payload = {
            'name': 'Invalid Phone User',
            'email': 'invalid@gmail.com',
            'phone': '98765432101',
            'subject': 'General Query',
            'message': 'This is a test message to verify phone limit.'
        }
        res = self.client.post('/api/v1/public/contact/', payload)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        error_dict = res.data.get('error', {}).get('message', res.data)
        self.assertIn('phone', error_dict)

    def test_public_project_registration_submission_and_staff_email(self):
        from django.core import mail
        mail.outbox.clear()
        payload = {
            'full_name': 'Rohan Patil',
            'email': 'rohan@gmail.com',
            'phone': '9845012345',
            'college': 'Dayananda Sagar College',
            'degree': 'BCA (Bachelor of Computer Applications)',
            'year_or_semester': '6th Semester',
            'project_domain': 'Artificial Intelligence & Machine Learning',
            'project_title': 'Deep Learning Facial Attendance',
            'team_size': '2 Members Team',
            'preferred_technology': 'Python & Django / Flask',
            'message': 'Need guidance on OpenCV integration and documentation.'
        }
        res = self.client.post('/api/v1/public/register-project/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(ProjectRegistration.objects.filter(email='rohan@gmail.com').exists())
        project = ProjectRegistration.objects.get(email='rohan@gmail.com')
        self.assertEqual(project.full_name, 'Rohan Patil')
        self.assertEqual(project.status, 'NEW')
        # Staff email should be triggered
        self.assertTrue(len(mail.outbox) >= 1)
        self.assertIn('[Project Registration]', mail.outbox[-1].subject)
        self.assertIn('Rohan Patil', mail.outbox[-1].body)
        self.assertIn('9845012345', mail.outbox[-1].body)

    def test_public_internship_registration_submission_and_staff_email(self):
        from django.core import mail
        mail.outbox.clear()
        payload = {
            'full_name': 'Deepa Hegde',
            'email': 'deepa@gmail.com',
            'phone': '9740011223',
            'college': 'BMS College of Engineering',
            'degree': 'B.E. Computer Science',
            'semester': '7th Semester',
            'internship_track': 'Full Stack Web Development',
            'duration': '3 Months',
            'mode': 'Hybrid (Classroom + Online)',
            'skills_or_portfolio': 'React, Node.js, Express, MongoDB',
            'message': 'Looking for hands-on production experience.'
        }
        res = self.client.post('/api/v1/public/register-internship/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(InternshipRegistration.objects.filter(email='deepa@gmail.com').exists())
        internship = InternshipRegistration.objects.get(email='deepa@gmail.com')
        self.assertEqual(internship.full_name, 'Deepa Hegde')
        self.assertEqual(internship.status, 'NEW')
        # Staff email
        self.assertTrue(len(mail.outbox) >= 1)
        self.assertIn('[Internship Application]', mail.outbox[-1].subject)
        self.assertIn('Deepa Hegde', mail.outbox[-1].body)

    def test_public_event_registration_submission_and_staff_email(self):
        from django.core import mail
        mail.outbox.clear()
        payload = {
            'full_name': 'Varun Verma',
            'email': 'varun@gmail.com',
            'phone': '9900112233',
            'event_title': 'Masterclass on Generative AI & LLMs',
            'college_or_organization': 'PES University',
            'attendee_type': 'Student',
            'ticket_count': 2,
            'participation_mode': 'In-Person (Campus / Venue)',
            'message': 'Excited to attend the hands-on session.'
        }
        res = self.client.post('/api/v1/public/register-event/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(EventRegistration.objects.filter(email='varun@gmail.com').exists())
        event_reg = EventRegistration.objects.get(email='varun@gmail.com')
        self.assertEqual(event_reg.full_name, 'Varun Verma')
        self.assertEqual(event_reg.ticket_count, 2)
        # Staff email
        self.assertTrue(len(mail.outbox) >= 1)
        self.assertIn('[Event Registration]', mail.outbox[-1].subject)
        self.assertIn('Varun Verma', mail.outbox[-1].body)

    def test_staff_manage_project_internship_event_registrations(self):
        project = ProjectRegistration.objects.create(
            full_name='Pooja K', email='pooja@gmail.com', phone='9888877777',
            college='St Josephs', degree='BCA', project_domain='Cloud Computing'
        )
        internship = InternshipRegistration.objects.create(
            full_name='Aditya M', email='aditya@gmail.com', phone='9888877776',
            college='Jain University', degree='MCA', internship_track='Python & Data Science'
        )
        event_reg = EventRegistration.objects.create(
            full_name='Siddharth', email='sid@gmail.com', phone='9888877775',
            event_title='Tech Summit 2026', college_or_organization='Wipro'
        )

        # Unauthenticated rejected
        self.assertEqual(self.client.get('/api/v1/staff/project-registrations/').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.get('/api/v1/staff/internship-registrations/').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.client.get('/api/v1/staff/event-registrations/').status_code, status.HTTP_401_UNAUTHORIZED)

        # Staff authenticated can list and update status
        self.client.force_authenticate(user=self.staff_user)

        res_proj = self.client.get('/api/v1/staff/project-registrations/')
        self.assertEqual(res_proj.status_code, status.HTTP_200_OK)
        patch_proj = self.client.patch(
            f'/api/v1/staff/project-registrations/{project.id}/',
            {'status': 'CONFIRMED', 'staff_notes': 'Assigned to mentor Naveen'}
        )
        self.assertEqual(patch_proj.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertEqual(project.status, 'CONFIRMED')
        self.assertEqual(project.staff_notes, 'Assigned to mentor Naveen')

        res_int = self.client.get('/api/v1/staff/internship-registrations/')
        self.assertEqual(res_int.status_code, status.HTTP_200_OK)
        patch_int = self.client.patch(
            f'/api/v1/staff/internship-registrations/{internship.id}/',
            {'status': 'REVIEWING', 'staff_notes': 'Profile shortlisted for interview'}
        )
        self.assertEqual(patch_int.status_code, status.HTTP_200_OK)
        internship.refresh_from_db()
        self.assertEqual(internship.status, 'REVIEWING')

        res_evt = self.client.get('/api/v1/staff/event-registrations/')
        self.assertEqual(res_evt.status_code, status.HTTP_200_OK)
        patch_evt = self.client.patch(
            f'/api/v1/staff/event-registrations/{event_reg.id}/',
            {'status': 'ATTENDED', 'staff_notes': 'Certificate issued'}
        )
        self.assertEqual(patch_evt.status_code, status.HTTP_200_OK)
        event_reg.refresh_from_db()
        self.assertEqual(event_reg.status, 'ATTENDED')




class UserRegistrationAuthTests(APITestCase):
    """Tests for student self-registration endpoint."""

    def test_successful_user_registration(self):
        payload = {
            'email': 'newstudent@example.com',
            'full_name': 'Ananya Sharma',
            'phone': '9876543211',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'college_name': 'Soundarya Institute of Management',
        }
        res = self.client.post('/api/v1/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.data.get('data', res.data)
        self.assertEqual(data['user']['email'], 'newstudent@example.com')
        # A self-registered account waits for staff approval, so it gets no
        # token and no STUDENT role until then (apps/core/signup.py).
        self.assertNotIn('access', data)
        self.assertNotIn('refresh', data)
        self.assertEqual(data['approval_status'], 'PENDING')

        # Verify user persisted in database, inactive and pending
        user = User.objects.get(email='newstudent@example.com')
        self.assertTrue(user.check_password('SecurePassword123!'))
        self.assertFalse(user.is_active)
        self.assertEqual(user.approval_status, 'PENDING')
        self.assertEqual(user.get_role_codes(), [])

    def test_registration_requires_a_college(self):
        """Approval creates a Student profile, which needs an institution."""
        res = self.client.post('/api/v1/auth/register/', {
            'email': 'nocollege@example.com',
            'full_name': 'No College',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pending_account_cannot_log_in(self):
        self.client.post('/api/v1/auth/register/', {
            'email': 'pending@example.com',
            'full_name': 'Pending Student',
            'password': 'SecurePassword123!',
            'confirm_password': 'SecurePassword123!',
            'college_name': 'Acharya Institute',
        })
        res = self.client.post('/api/v1/auth/login/', {
            'email': 'pending@example.com',
            'password': 'SecurePassword123!',
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('awaiting approval', str(res.data).lower())

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
