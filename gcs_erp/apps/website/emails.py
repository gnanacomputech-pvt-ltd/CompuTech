import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


def _send_staff_email(subject, template_context, reply_to=None):
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'info.gcsminds@gmail.com')
    staff_email = getattr(settings, 'STAFF_NOTIFICATION_EMAIL', from_email)

    # Render HTML template
    try:
        html_content = render_to_string('emails/staff_notification.html', template_context)
    except Exception:
        logger.exception("Could not render emails/staff_notification.html")
        html_content = None

    # Plain text content
    plain_text_lines = [
        f"=== {template_context.get('form_type', 'Website Submission')} ===",
        f"Title: {template_context.get('title', '')}",
        f"Reference ID: {template_context.get('reference_id', 'N/A')}",
        f"Time: {template_context.get('timestamp', '')}",
        "",
        "--- Details ---",
    ]
    for item in template_context.get('fields', []):
        plain_text_lines.append(f"{item.get('label')}: {item.get('value')}")

    if template_context.get('message_content'):
        plain_text_lines.extend([
            "",
            "--- Message / Notes ---",
            template_context.get('message_content'),
        ])

    plain_text = "\n".join(plain_text_lines)

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=plain_text,
            from_email=from_email,
            to=[staff_email],
            reply_to=[reply_to] if reply_to else None,
        )
        if html_content:
            msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=True)
        logger.info("Staff notification email sent to %s for %s", staff_email, subject)
        return True
    except Exception as exc:
        logger.warning("Staff notification email delivery failed: %s", exc)
        return False


def send_contact_inquiry_to_staff(inquiry):
    """Notify staff when someone submits the Contact Us form."""
    created_str = inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if hasattr(inquiry, 'created_at') and inquiry.created_at else timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    context = {
        'form_type': 'Contact Us Submission',
        'title': f'New Contact Inquiry: {inquiry.name}',
        'intro': f'A new contact inquiry has been submitted by {inquiry.name} via the website.',
        'reference_id': str(inquiry.id),
        'timestamp': created_str,
        'reply_name': inquiry.name,
        'reply_email': inquiry.email,
        'reply_phone': inquiry.phone,
        'fields': [
            {'label': 'Full Name', 'value': inquiry.name},
            {'label': 'Email Address', 'value': inquiry.email, 'is_email': True},
            {'label': 'Phone Number', 'value': inquiry.phone, 'is_phone': True},
            {'label': 'Subject / Topic', 'value': inquiry.subject},
            {'label': 'Inquiry Status', 'value': inquiry.status},
        ],
        'message_content': inquiry.message,
    }
    subject = f"[Contact Us] {inquiry.name} - {inquiry.subject}"
    return _send_staff_email(subject, context, reply_to=inquiry.email)


def send_registration_inquiry_to_staff(inquiry):
    """Notify staff when someone submits the Student Registration form."""
    created_str = inquiry.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if hasattr(inquiry, 'created_at') and inquiry.created_at else timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    pref_date = inquiry.preferred_date.strftime('%Y-%m-%d') if getattr(inquiry, 'preferred_date', None) else 'Immediate / Flexible'
    context = {
        'form_type': 'Student Registration',
        'title': f'New Student Registration: {inquiry.full_name}',
        'intro': f'{inquiry.full_name} has submitted an application for {inquiry.program}.',
        'reference_id': str(inquiry.id),
        'timestamp': created_str,
        'reply_name': inquiry.full_name,
        'reply_email': inquiry.email,
        'reply_phone': inquiry.phone,
        'fields': [
            {'label': 'Student Full Name', 'value': inquiry.full_name},
            {'label': 'Email Address', 'value': inquiry.email, 'is_email': True},
            {'label': 'Phone Number', 'value': inquiry.phone, 'is_phone': True},
            {'label': 'College / University', 'value': inquiry.college},
            {'label': 'Degree / Course Stream', 'value': inquiry.course},
            {'label': 'Program / Project Track', 'value': inquiry.program},
            {'label': 'Preferred Start Date', 'value': pref_date},
            {'label': 'Status', 'value': inquiry.status},
        ],
        'message_content': inquiry.message,
    }
    subject = f"[New Registration] {inquiry.full_name} - {inquiry.program}"
    return _send_staff_email(subject, context, reply_to=inquiry.email)


def send_enquiry_to_staff(enquiry_data, reference_id=''):
    """Notify staff when someone submits the Program Enquiry form."""
    timestamp = timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    name = enquiry_data.get('full_name') or enquiry_data.get('name') or 'Prospective Student'
    email = enquiry_data.get('email', '')
    phone = enquiry_data.get('phone', '')
    college = enquiry_data.get('college') or 'Not specified'
    interest = enquiry_data.get('interest') or enquiry_data.get('subject') or 'General Enquiry'
    training_mode = enquiry_data.get('training_mode') or 'Classroom / Online'
    message = enquiry_data.get('message', '')

    context = {
        'form_type': 'Program & Admission Enquiry',
        'title': f'New Enquiry: {name} ({interest})',
        'intro': f'A new program/admission enquiry has been received from {name}.',
        'reference_id': str(reference_id),
        'timestamp': timestamp,
        'reply_name': name,
        'reply_email': email,
        'reply_phone': phone,
        'fields': [
            {'label': 'Applicant Name', 'value': name},
            {'label': 'Email Address', 'value': email, 'is_email': True},
            {'label': 'Phone Number', 'value': phone, 'is_phone': True},
            {'label': 'College / Organization', 'value': college},
            {'label': 'Interested In', 'value': interest},
            {'label': 'Preferred Mode', 'value': training_mode},
        ],
        'message_content': message,
    }
    subject = f"[New Enquiry] {name} - {interest}"
    return _send_staff_email(subject, context, reply_to=email)


def send_project_registration_to_staff(project):
    """Notify staff when a student or team registers an academic/final year project."""
    created_str = project.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if hasattr(project, 'created_at') and project.created_at else timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    context = {
        'form_type': 'Academic Project Registration',
        'title': f'New Project Registration: {project.full_name}',
        'intro': f'{project.full_name} has submitted a project registration for {project.project_domain}.',
        'reference_id': str(project.id),
        'timestamp': created_str,
        'reply_name': project.full_name,
        'reply_email': project.email,
        'reply_phone': project.phone,
        'fields': [
            {'label': 'Student / Team Lead', 'value': project.full_name},
            {'label': 'Email Address', 'value': project.email, 'is_email': True},
            {'label': 'Phone Number', 'value': project.phone, 'is_phone': True},
            {'label': 'College / University', 'value': project.college},
            {'label': 'Degree & Semester', 'value': f"{project.degree} ({project.year_or_semester})" if project.year_or_semester else project.degree},
            {'label': 'Project Domain', 'value': project.project_domain},
            {'label': 'Project Title / Topic', 'value': project.project_title or 'To be decided with guide'},
            {'label': 'Team Size', 'value': project.team_size},
            {'label': 'Preferred Tech Stack', 'value': project.preferred_technology or 'Open to recommendation'},
            {'label': 'Status', 'value': project.status},
        ],
        'message_content': project.message,
    }
    subject = f"[Project Registration] {project.full_name} - {project.project_domain}"
    return _send_staff_email(subject, context, reply_to=project.email)


def send_internship_registration_to_staff(internship):
    """Notify staff when a student applies for an IT/Software internship."""
    created_str = internship.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if hasattr(internship, 'created_at') and internship.created_at else timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    start_str = internship.start_date.strftime('%Y-%m-%d') if getattr(internship, 'start_date', None) else 'Immediate / Flexible'
    context = {
        'form_type': 'Internship Application',
        'title': f'New Internship Application: {internship.full_name}',
        'intro': f'{internship.full_name} has applied for the {internship.internship_track} internship track.',
        'reference_id': str(internship.id),
        'timestamp': created_str,
        'reply_name': internship.full_name,
        'reply_email': internship.email,
        'reply_phone': internship.phone,
        'fields': [
            {'label': 'Applicant Name', 'value': internship.full_name},
            {'label': 'Email Address', 'value': internship.email, 'is_email': True},
            {'label': 'Phone Number', 'value': internship.phone, 'is_phone': True},
            {'label': 'College / University', 'value': internship.college},
            {'label': 'Degree / Semester', 'value': f"{internship.degree} ({internship.semester})" if internship.semester else internship.degree},
            {'label': 'Internship Track', 'value': internship.internship_track},
            {'label': 'Duration', 'value': internship.duration},
            {'label': 'Work Mode', 'value': internship.mode},
            {'label': 'Preferred Start Date', 'value': start_str},
            {'label': 'Skills / Portfolio', 'value': internship.skills_or_portfolio or 'Not provided'},
            {'label': 'Status', 'value': internship.status},
        ],
        'message_content': internship.message,
    }
    subject = f"[Internship Application] {internship.full_name} - {internship.internship_track}"
    return _send_staff_email(subject, context, reply_to=internship.email)


def send_event_registration_to_staff(event_reg):
    """Notify staff when an attendee registers for a workshop/event."""
    created_str = event_reg.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if hasattr(event_reg, 'created_at') and event_reg.created_at else timezone.now().strftime('%Y-%m-%d %H:%M:%S UTC')
    context = {
        'form_type': 'Event & Workshop Registration',
        'title': f'New Event Registration: {event_reg.full_name}',
        'intro': f'{event_reg.full_name} has registered for {event_reg.event_title}.',
        'reference_id': str(event_reg.id),
        'timestamp': created_str,
        'reply_name': event_reg.full_name,
        'reply_email': event_reg.email,
        'reply_phone': event_reg.phone,
        'fields': [
            {'label': 'Attendee Name', 'value': event_reg.full_name},
            {'label': 'Email Address', 'value': event_reg.email, 'is_email': True},
            {'label': 'Phone Number', 'value': event_reg.phone, 'is_phone': True},
            {'label': 'Event / Workshop', 'value': event_reg.event_title},
            {'label': 'Institution / Organization', 'value': event_reg.college_or_organization},
            {'label': 'Attendee Type', 'value': event_reg.attendee_type},
            {'label': 'Number of Passes / Tickets', 'value': str(event_reg.ticket_count)},
            {'label': 'Participation Mode', 'value': event_reg.participation_mode},
            {'label': 'Registration Status', 'value': event_reg.status},
        ],
        'message_content': event_reg.message,
    }
    subject = f"[Event Registration] {event_reg.full_name} - {event_reg.event_title}"
    return _send_staff_email(subject, context, reply_to=event_reg.email)

