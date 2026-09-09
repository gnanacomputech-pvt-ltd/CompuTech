from django.db import models
from apps.common.models import TimeStampedModel


class ContactInquiry(TimeStampedModel):
    """
    Stores submissions from the public /contact page.
    All fields are publicly supplied — no authentication required.
    """
    SUBJECT_CHOICES = (
        ('Academic Project Enquiry', 'BCA / MCA Project Enquiry'),
        ('Course Admission', 'Course / Training Admission'),
        ('Internship Application', 'IT Internship Application'),
        ('College Partnership', 'College / Institution Workshop'),
        ('General Query', 'Other General Query'),
    )

    STATUS_CHOICES = (
        ('NEW', 'New / Unread'),
        ('READ', 'Read'),
        ('REPLIED', 'Replied'),
        ('CLOSED', 'Closed'),
    )

    name = models.CharField(max_length=255)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=20)
    subject = models.CharField(max_length=100, choices=SUBJECT_CHOICES, default='General Query')
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW', db_index=True)
    staff_notes = models.TextField(blank=True, help_text="Internal notes visible only to ERP staff.")

    class Meta:
        db_table = 'website_contact_inquiries'
        ordering = ['-created_at']
        verbose_name = 'Contact Inquiry'
        verbose_name_plural = 'Contact Inquiries'

    def __str__(self):
        return f"[{self.status}] {self.name} — {self.subject} ({self.email})"


class StudentRegistrationInquiry(TimeStampedModel):
    """
    Stores pre-enrollment applications from the public /register page.
    Collected before the student has a portal account.
    """
    COURSE_CHOICES = (
        ('BCA (Bachelor of Computer Applications)', 'BCA'),
        ('MCA (Master of Computer Applications)', 'MCA'),
        ('B.E. / B.Tech (CS / IT / ECE)', 'BE / BTech'),
        ('BSc Computer Science', 'BSc CS'),
        ('Diploma in Computer Science', 'Diploma CS / IT'),
        ('Other Degree Stream', 'Other'),
    )

    PROGRAM_CHOICES = (
        ('Academic Project Guidance', 'BCA / MCA Final Year Project'),
        ('Full Stack Web Development (MERN)', 'Full Stack Web Development (MERN)'),
        ('Python & Data Science Course', 'Python & Data Analytics'),
        ('Software Internship Track', 'IT / Software Internship'),
        ('Java Enterprise Track', 'Java Enterprise Engineering'),
        ('Flutter Mobile App Track', 'Mobile App Development'),
    )

    STATUS_CHOICES = (
        ('NEW', 'New Application'),
        ('CONTACTED', 'Contacted by Coordinator'),
        ('ENROLLED', 'Converted to Enrollment'),
        ('REJECTED', 'Rejected / Ineligible'),
    )

    full_name = models.CharField(max_length=255)
    email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=20)
    college = models.CharField(max_length=255)
    course = models.CharField(max_length=100, choices=COURSE_CHOICES, default='BCA (Bachelor of Computer Applications)')
    program = models.CharField(max_length=100, choices=PROGRAM_CHOICES, default='Academic Project Guidance')
    preferred_date = models.DateField(null=True, blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW', db_index=True)
    staff_notes = models.TextField(blank=True, help_text="Internal notes visible only to ERP staff.")

    class Meta:
        db_table = 'website_student_registrations'
        ordering = ['-created_at']
        verbose_name = 'Student Registration Inquiry'
        verbose_name_plural = 'Student Registration Inquiries'

    def __str__(self):
        return f"[{self.status}] {self.full_name} — {self.program} ({self.email})"
