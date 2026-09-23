from django.db import models
from django.conf import settings
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


class SiteContent(TimeStampedModel):
    """
    Editorial content for the marketing site's mostly-static sections, made
    admin-manageable (ERP staff CRUD) instead of hardcoded in frontend data
    files. One flexible model instead of nine near-identical ones — the
    sections differ enough (events need a date/time range, services need a
    feature list, testimonials need a rating) that a single fixed schema
    would either be too narrow or too wide for all of them, so field usage
    varies by `section` and free-form extras (features, technologies,
    agenda, rating, tag, etc.) live in `extra`.

    image_url/link_url are plain URLs rather than an uploaded file field —
    matches how the data these sections replace already worked (S3/external
    logo and avatar URLs in src/data/*.js), and keeps this endpoint a plain
    JSON CRUD API with no multipart upload path to build.
    """
    SECTION_CHOICES = (
        ('partner', 'Partner College / Training Association'),
        ('recognition', 'Official Recognition / Certification'),
        ('about', 'About Gnana Computech Solutions'),
        ('owner', 'Owner / Leadership'),
        ('impact_stat', 'Our Impact in Numbers'),
        ('event', 'Event / Workshop'),
        ('service', 'Technology Service'),
        ('internship', 'Internship Program'),
        ('testimonial', 'Student & Partner Story'),
    )

    section = models.CharField(max_length=20, choices=SECTION_CHOICES, db_index=True)
    title = models.CharField(max_length=255, help_text="Name / heading (e.g. college name, owner's name, stat label).")
    subtitle = models.CharField(max_length=255, blank=True, help_text="e.g. designation, role, badge, program type.")
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True, max_length=1000)
    link_url = models.URLField(blank=True, max_length=1000)
    location = models.CharField(max_length=255, blank=True)
    event_start = models.DateTimeField(null=True, blank=True, help_text="Event section: start date & time.")
    event_end = models.DateTimeField(null=True, blank=True, help_text="Event section: end date & time (optional).")
    display_order = models.PositiveIntegerField(default=0, help_text="Lower shows first within its section.")
    is_active = models.BooleanField(default=True, db_index=True, help_text="Unpublished items are hidden from the public site but stay editable.")
    extra = models.JSONField(default=dict, blank=True, help_text="Section-specific extras, e.g. {\"features\": [...], \"technologies\": [...], \"rating\": 5}.")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='site_content_created'
    )

    class Meta:
        db_table = 'website_site_content'
        ordering = ['section', 'display_order', '-created_at']
        verbose_name = 'Site Content'
        verbose_name_plural = 'Site Content'

    def __str__(self):
        return f"[{self.section}] {self.title}"
