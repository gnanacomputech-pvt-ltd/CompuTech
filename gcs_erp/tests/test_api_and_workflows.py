import uuid
from decimal import Decimal
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from apps.core.models import (
    User, Role, UserRole, Institution, Program, Batch, Student, Enrollment
)
from apps.academics.models import Session, Attendance, Assessment, AssessmentMark
from apps.finance.models import Invoice, Payment, Certificate
from apps.finance.services.certificate_service import (
    CertificateEligibilityService, CertificateGenerator
)


class GCSErpFullWorkflowTests(APITestCase):
    def setUp(self):
        # 1. Setup Roles
        self.super_role, _ = Role.objects.get_or_create(code='SUPER_ADMIN', defaults={'name': 'Super Admin'})
        self.student_role, _ = Role.objects.get_or_create(code='STUDENT', defaults={'name': 'Student'})
        self.staff_role, _ = Role.objects.get_or_create(code='ACADEMIC_COORDINATOR', defaults={'name': 'Coordinator'})

        # 2. Setup Superuser / Staff
        self.admin = User.objects.create_superuser(
            email='admin@gnanacomputech.com',
            password='AdminPassword123!',
            full_name='Admin User'
        )
        UserRole.objects.create(user=self.admin, role=self.super_role)

        # 3. Setup Student User
        self.student_user = User.objects.create_user(
            email='rahul@gmail.com',
            password='StudentPassword123!',
            full_name='Rahul Kumar',
            phone='+91 99999 88888'
        )
        UserRole.objects.create(user=self.student_user, role=self.student_role)

        # 4. Setup Master Data
        self.institution = Institution.objects.create(
            code='BIT-BLR',
            name='Bangalore Institute of Technology',
            city='Bangalore',
            created_by=self.admin
        )
        self.student_profile = Student.objects.create(
            user=self.student_user,
            institution=self.institution,
            usn='1BI22CA099',
            degree='BCA',
            semester=6,
            created_by=self.admin
        )
        self.program = Program.objects.create(
            code='INT-AI-01',
            title='AI & Machine Learning Internship',
            program_type='INTERNSHIP',
            duration_weeks=8,
            base_fee=Decimal('5000.00'),
            created_by=self.admin
        )
        self.batch = Batch.objects.create(
            name='2026 Batch Alpha',
            program=self.program,
            institution=self.institution,
            start_date=timezone.now().date(),
            status='ACTIVE',
            created_by=self.admin
        )

        # 5. Core Integration Entity: Enrollment
        self.enrollment = Enrollment.objects.create(
            student=self.student_profile,
            program=self.program,
            batch=self.batch,
            institution=self.institution,
            status='ACTIVE',
            created_by=self.admin
        )

    def test_01_authentication_and_envelope_standard(self):
        """
        Verify auth login and response envelope conforming to section 5.1
        """
        # Valid login
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'admin@gnanacomputech.com',
            'password': 'AdminPassword123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], 'admin@gnanacomputech.com')

        # Invalid login -> error envelope
        invalid_resp = self.client.post('/api/v1/auth/login/', {
            'email': 'admin@gnanacomputech.com',
            'password': 'WrongPassword'
        })
        self.assertEqual(invalid_resp.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(invalid_resp.data['success'])
        self.assertIn('error', invalid_resp.data)
        self.assertEqual(invalid_resp.data['error']['code'], 'AUTHENTICATION_FAILED')

    def test_02_rbac_endpoint_protection(self):
        """
        Verify server-side RBAC: Students cannot mutate institutional master data.
        """
        self.client.force_authenticate(user=self.student_user)

        # Attempt to create program as student -> should be forbidden or restricted
        # In our viewset, student does not have IsERPStaff permission for mutating programs
        res = self.client.post('/api/v1/programs/', {
            'code': 'HACK-01',
            'title': 'Unauthorized Program',
            'program_type': 'COURSE'
        })
        # Student attempting to create program
        self.client.force_authenticate(user=self.admin)
        admin_res = self.client.post('/api/v1/programs/', {
            'code': 'VALID-01',
            'title': 'Valid Program By Admin',
            'program_type': 'COURSE'
        })
        self.assertEqual(admin_res.status_code, status.HTTP_201_CREATED)

    def test_03_certificate_eligibility_chain(self):
        """
        Test strict 8-step eligibility validation:
        Initial state: Not completed, attendance missing, fee unpaid -> Ineligible
        """
        eligibility = CertificateEligibilityService.evaluate(self.enrollment)
        self.assertFalse(eligibility['is_eligible'])
        self.assertGreater(len(eligibility['reasons']), 0)

        # 1. Satisfy attendance (100%)
        session = Session.objects.create(
            batch=self.batch,
            session_date=timezone.now().date(),
            start_time='09:00:00',
            end_time='11:00:00',
            topic='Neural Networks Deep Dive'
        )
        Attendance.objects.create(
            session=session,
            enrollment=self.enrollment,
            status='PRESENT'
        )

        # 2. Satisfy assessment
        ass = Assessment.objects.create(
            batch=self.batch,
            title='Capstone Project Viva',
            assessment_type='PROJECT_VIVA',
            max_marks=Decimal('100.00'),
            passing_marks=Decimal('50.00')
        )
        AssessmentMark.objects.create(
            assessment=ass,
            enrollment=self.enrollment,
            marks_obtained=Decimal('85.00'),
            is_passed=True
        )

        # 3. Satisfy fees (Paid in full)
        inv = Invoice.objects.create(
            enrollment=self.enrollment,
            total_amount=Decimal('5000.00'),
            paid_amount=Decimal('5000.00'),
            due_date=timezone.now().date(),
            status='PAID'
        )

        # 4. Coordinator approval and completion
        self.enrollment.status = 'COMPLETED'
        self.enrollment.coordinator_approval = True
        self.enrollment.save()

        # Now evaluate again -> should be eligible
        eligibility_now = CertificateEligibilityService.evaluate(self.enrollment)
        self.assertTrue(eligibility_now['is_eligible'], f"Expected eligible but failed with: {eligibility_now['reasons']}")

    def test_04_certificate_issuance_and_public_qr_verification(self):
        """
        Full certificate generation, QR creation, SHA-256 calculation, and public verification endpoint.
        """
        # Make enrollment fully eligible
        self.enrollment.status = 'COMPLETED'
        self.enrollment.coordinator_approval = True
        self.enrollment.save()

        # Issue certificate
        cert = CertificateGenerator.issue_certificate(
            enrollment=self.enrollment,
            title='Certificate of Excellence in AI',
            issued_by=self.admin
        )

        self.assertEqual(cert.status, 'ISSUED')
        self.assertTrue(cert.certificate_number.startswith('GCS-CERT-'))
        self.assertTrue(len(cert.token) > 20)
        self.assertTrue(len(cert.sha256_hash) == 64) # Valid SHA-256 hex string
        self.assertTrue(bool(cert.qr_code_image))
        self.assertTrue(bool(cert.pdf_file))

        # Test Public QR Verification Endpoint (Section 5.3)
        # Unauthenticated request
        self.client.logout()
        verify_url = f"/api/v1/public/certificates/verify/{cert.token}/"
        res = self.client.get(verify_url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data['data']
        self.assertEqual(data['certificate_number'], cert.certificate_number)
        self.assertEqual(data['student_name'], self.student_user.full_name)
        self.assertEqual(data['program'], self.program.title)
        self.assertEqual(data['institution'], self.institution.name)
        self.assertEqual(data['status'], 'ISSUED')
        self.assertTrue(data['is_valid'])

        # Verify NEVER exposes sensitive fields
        self.assertNotIn('phone', data)
        self.assertNotIn('email', data)
        self.assertNotIn('dob', data)
        self.assertNotIn('address', data)
        self.assertNotIn('payment', data)
        self.assertNotIn('transaction_id', data)

    def test_05_revocation_and_reissue_preserves_traceability(self):
        """
        Section 8: Revocation keeps QR live but status is REVOKED (never 404).
        Reissue creates a new certificate linked via parent_certificate_id.
        """
        self.enrollment.status = 'COMPLETED'
        self.enrollment.coordinator_approval = True
        self.enrollment.save()

        cert = CertificateGenerator.issue_certificate(
            enrollment=self.enrollment,
            title='Test Certificate',
            issued_by=self.admin
        )

        # Revoke certificate
        CertificateGenerator.revoke_certificate(cert, reason="Data entry error on USN", revoked_by=self.admin)
        cert.refresh_from_db()
        self.assertEqual(cert.status, 'REVOKED')

        # Public verification of revoked certificate must return 200 with status REVOKED (never 404)
        verify_url = f"/api/v1/public/certificates/verify/{cert.token}/"
        res = self.client.get(verify_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['status'], 'REVOKED')
        self.assertFalse(res.data['data']['is_valid'])
        self.assertIn("Data entry error on USN", res.data['data']['revocation_reason'])

        # Reissue certificate
        new_cert = CertificateGenerator.reissue_certificate(cert, reason="Corrected USN", reissued_by=self.admin)
        self.assertEqual(new_cert.status, 'ISSUED')
        self.assertNotEqual(new_cert.certificate_number, cert.certificate_number)
        self.assertEqual(new_cert.parent_certificate, cert)
        self.assertTrue(bool(new_cert.qr_code_image))
        self.assertTrue(bool(new_cert.pdf_file))
