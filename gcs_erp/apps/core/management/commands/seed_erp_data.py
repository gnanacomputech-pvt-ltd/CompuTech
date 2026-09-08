from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.core.models import (
    User, Role, Permission, UserRole, RolePermission,
    Institution, Department, Program, Batch, Student, Employee, Enrollment
)
from apps.academics.models import (
    AcademicProject, Internship, Session, Attendance,
    Assignment, Assessment, AssessmentMark, StudentProgress
)
from apps.finance.models import FeeStructure, Invoice, Payment, FeeReceipt, Certificate
from apps.finance.services.certificate_service import CertificateGenerator


class Command(BaseCommand):
    help = "Seeds initial RBAC roles, permissions, superuser, and demo master data"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("==> Seeding Initial Roles & RBAC Matrix..."))

        ROLES = [
            ('SUPER_ADMIN', 'Super Administrator', 'Full unhindered system access and configuration'),
            ('ADMIN', 'Administrator', 'General administration and user management'),
            ('HR', 'Human Resources', 'Staff records and internal personnel management'),
            ('ACCOUNTS', 'Accounts Officer', 'Fee structures, invoices, payments, receipts'),
            ('ACADEMIC_COORDINATOR', 'Academic Coordinator', 'Academic curriculum, batch schedules, certificate approval'),
            ('INTERNSHIP_COORDINATOR', 'Internship Coordinator', 'Internship applications, reviews, and allocations'),
            ('PROJECT_COORDINATOR', 'Project Coordinator', 'Final year / degree project approvals and reviews'),
            ('TRAINER', 'Technical Trainer', 'Conducts sessions, takes attendance, grades assignments'),
            ('MENTOR', 'Project / Academic Mentor', 'Guides students, reviews synopses and milestone progress'),
            ('INSTITUTION_COORDINATOR', 'Partner Institution Coordinator', 'College POC viewing institutional student progress'),
            ('STUDENT', 'Enrolled Learner', 'Learner self-service portal, project details, certificates'),
            ('PLACEMENT_OFFICER', 'Placement Officer', 'Placement opportunities and student profiles'),
            ('CONTENT_MANAGER', 'Content Manager', 'Website blogs, testimonials, events, and media catalog'),
        ]

        role_objs = {}
        for code, name, desc in ROLES:
            role, _ = Role.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
            role_objs[code] = role

        PERMISSIONS = [
            ('users.manage', 'Manage Users & Roles', 'core'),
            ('institutions.manage', 'Manage Partner Institutions', 'core'),
            ('programs.manage', 'Manage Academic Programs & Batches', 'core'),
            ('students.view', 'View Student Profiles', 'core'),
            ('students.manage', 'Create/Edit Student Profiles', 'core'),
            ('enrollments.manage', 'Manage Student Enrollments', 'core'),
            ('attendance.mark', 'Mark Session Attendance', 'academics'),
            ('assessments.grade', 'Conduct & Grade Assessments', 'academics'),
            ('finance.manage_invoices', 'Manage Fee Invoices & Payments', 'finance'),
            ('certificates.issue', 'Issue & Revoke Official Certificates', 'finance'),
        ]

        perm_objs = {}
        for code, name, mod in PERMISSIONS:
            perm, _ = Permission.objects.get_or_create(code=code, defaults={'name': name, 'module': mod})
            perm_objs[code] = perm

        # Assign permissions to roles
        for code, role in role_objs.items():
            if code in ['SUPER_ADMIN', 'ADMIN']:
                for perm in perm_objs.values():
                    RolePermission.objects.get_or_create(role=role, permission=perm)
            elif code in ['ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'PROJECT_COORDINATOR']:
                for p_code in ['students.view', 'students.manage', 'enrollments.manage', 'attendance.mark', 'assessments.grade', 'certificates.issue']:
                    RolePermission.objects.get_or_create(role=role, permission=perm_objs[p_code])
            elif code == 'ACCOUNTS':
                for p_code in ['students.view', 'finance.manage_invoices', 'certificates.issue']:
                    RolePermission.objects.get_or_create(role=role, permission=perm_objs[p_code])

        self.stdout.write(self.style.SUCCESS(f"[OK] Created/verified {len(ROLES)} roles and {len(PERMISSIONS)} permissions."))

        # 2. Seed Superuser
        admin_email = "admin@gnanacomputech.com"
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'full_name': 'GCS Super Administrator',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'is_verified': True,
                'phone': '+91 98765 43210'
            }
        )
        if created:
            admin_user.set_password('Admin@123')
            admin_user.save()
            UserRole.objects.get_or_create(user=admin_user, role=role_objs['SUPER_ADMIN'])
            self.stdout.write(self.style.SUCCESS(f"[OK] Created Superuser: {admin_email} (Pass: Admin@123)"))
        else:
            self.stdout.write(self.style.NOTICE(f"Superuser {admin_email} already exists."))

        # 3. Seed Partner Institution & Department
        institution, _ = Institution.objects.get_or_create(
            code="BIT-BLR",
            defaults={
                'name': 'Bangalore Institute of Technology',
                'city': 'Bangalore',
                'state': 'Karnataka',
                'contact_email': 'principal@bit-bangalore.edu.in',
                'contact_phone': '+91 80 2661 5865',
                'created_by': admin_user
            }
        )
        dept, _ = Department.objects.get_or_create(
            code="CSE",
            defaults={'name': 'Computer Science & Engineering', 'institution': institution, 'created_by': admin_user}
        )

        # 4. Seed Programs
        prog_internship, _ = Program.objects.get_or_create(
            code="INT-PY-AI",
            defaults={
                'title': 'Full Stack Python & AI Internship (8 Weeks)',
                'program_type': 'INTERNSHIP',
                'duration_weeks': 8,
                'base_fee': Decimal('6500.00'),
                'description': 'Hands-on enterprise software development with Python, Django, React, and LLM APIs.',
                'created_by': admin_user
            }
        )

        prog_project, _ = Program.objects.get_or_create(
            code="PRJ-BCA-2026",
            defaults={
                'title': 'BCA Final Year IEEE Cloud & Web Architecture Project',
                'program_type': 'ACADEMIC_PROJECT',
                'duration_weeks': 12,
                'base_fee': Decimal('8500.00'),
                'description': 'IEEE-standard degree project with synopsis, implementation, documentation, and viva prep.',
                'created_by': admin_user
            }
        )

        # 5. Seed Batch
        today = timezone.now().date()
        batch, _ = Batch.objects.get_or_create(
            business_id="GCS-BAT-2026-000001",
            defaults={
                'name': 'Summer 2026 AI Batch 01',
                'program': prog_internship,
                'institution': institution,
                'start_date': today - timedelta(days=60),
                'end_date': today,
                'status': 'ACTIVE',
                'created_by': admin_user
            }
        )

        # 6. Seed Student User & Profile
        student_email = "student@gnanacomputech.com"
        student_user, s_created = User.objects.get_or_create(
            email=student_email,
            defaults={
                'full_name': 'Rahul Sharma',
                'is_staff': False,
                'is_active': True,
                'is_verified': True,
                'phone': '+91 98450 12345'
            }
        )
        if s_created:
            student_user.set_password('Student@123')
            student_user.save()
            UserRole.objects.get_or_create(user=student_user, role=role_objs['STUDENT'])

        student, _ = Student.objects.get_or_create(
            user=student_user,
            defaults={
                'business_id': 'GCS-STU-2026-000001',
                'institution': institution,
                'usn': '1BI22CA042',
                'degree': 'BCA',
                'semester': 6,
                'branch': 'Computer Applications',
                'created_by': admin_user
            }
        )

        # 7. Seed Central Integration Entity: Enrollment
        enrollment, _ = Enrollment.objects.get_or_create(
            student=student,
            batch=batch,
            defaults={
                'business_id': 'GCS-ENR-2026-000001',
                'program': prog_internship,
                'institution': institution,
                'status': 'COMPLETED',
                'coordinator_approval': True,
                'approved_by': admin_user,
                'created_by': admin_user
            }
        )

        # 8. Seed Academic Session & 100% Attendance
        session, _ = Session.objects.get_or_create(
            batch=batch,
            session_date=today - timedelta(days=10),
            defaults={
                'topic': 'Django REST Framework & Microservice Architecture',
                'start_time': '10:00:00',
                'end_time': '12:00:00',
                'is_completed': True,
                'created_by': admin_user
            }
        )
        Attendance.objects.get_or_create(
            session=session,
            enrollment=enrollment,
            defaults={'status': 'PRESENT', 'remarks': 'Attended and participated actively'}
        )

        # 9. Seed Assessment & Passing Mark
        assessment, _ = Assessment.objects.get_or_create(
            batch=batch,
            title='Final Practical Evaluation & Code Review',
            defaults={
                'assessment_type': 'FINAL_EXAM',
                'max_marks': Decimal('100.00'),
                'passing_marks': Decimal('50.00'),
                'created_by': admin_user
            }
        )
        AssessmentMark.objects.get_or_create(
            assessment=assessment,
            enrollment=enrollment,
            defaults={'marks_obtained': Decimal('88.50'), 'is_passed': True}
        )

        # 10. Seed Invoice & Full Payment
        invoice, _ = Invoice.objects.get_or_create(
            enrollment=enrollment,
            defaults={
                'invoice_number': 'GCS-INV-2026-000001',
                'total_amount': Decimal('6500.00'),
                'paid_amount': Decimal('6500.00'),
                'due_date': today,
                'status': 'PAID',
                'created_by': admin_user
            }
        )
        payment, p_created = Payment.objects.get_or_create(
            transaction_id='TXN-GCS-2026-998877',
            defaults={
                'invoice': invoice,
                'amount': Decimal('6500.00'),
                'payment_mode': 'UPI',
                'status': 'SUCCESS',
                'notes': 'Online Google Pay settlement'
            }
        )
        if p_created:
            FeeReceipt.objects.get_or_create(payment=payment, defaults={'receipt_number': 'GCS-REC-2026-000001'})

        # 11. Seed Valid Issued Certificate with Real QR & PDF
        demo_cert = Certificate.objects.filter(enrollment=enrollment, status='ISSUED').first()
        if not demo_cert:
            demo_cert = CertificateGenerator.issue_certificate(
                enrollment=enrollment,
                title="Certificate of Internship Completion",
                issued_by=admin_user
            )
            self.stdout.write(self.style.SUCCESS(
                f"[OK] Generated & Issued Sample Certificate:\n"
                f"  Certificate No: {demo_cert.certificate_number}\n"
                f"  Token: {demo_cert.token}\n"
                f"  SHA-256: {demo_cert.sha256_hash}"
            ))
        else:
            self.stdout.write(self.style.NOTICE(f"Sample certificate already issued: {demo_cert.certificate_number}"))

        self.stdout.write(self.style.SUCCESS("\n==> Successfully initialized GCS ERP test dataset!"))
