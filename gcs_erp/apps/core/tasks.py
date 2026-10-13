from celery import shared_task
import logging

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _welcome_email_payload(user):
    """Build the subject, plain-text body and HTML body for the welcome email.

    Kept separate from sending so both the Celery task and the inline fallback
    render exactly the same message.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    login_url = f"{frontend_url}/login"
    support_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'info@gnanacomputech.com')

    subject = "Welcome to Gnana Computech Solutions"
    message = (
        f"Hi {user.full_name},\n\n"
        "Your GCS student account has been created successfully.\n\n"
        "You can now sign in to the student portal to track your projects, "
        "attendance and certificates:\n"
        f"{login_url}\n\n"
        "What you can do next:\n"
        "  - Browse academic projects and internship openings\n"
        "  - Register for BCA/MCA degree project guidance\n"
        "  - Track your attendance and IEEE documentation progress\n"
        "  - Download certificates once your programme is complete\n\n"
        "If this wasn't you, please contact us at "
        f"{support_email}.\n\n"
        "Gnana Computech Solutions Private Limited\n"
        "Bangalore North, Karnataka, India\n"
    )

    # A missing or broken template must never cost us the plain-text email,
    # which on its own is a perfectly good welcome message.
    try:
        html_message = render_to_string('emails/welcome.html', {
            'user': user,
            'login_url': login_url,
            'support_email': support_email,
        })
    except Exception:
        logger.exception("Could not render emails/welcome.html; sending plain text only")
        html_message = None

    return subject, message, html_message


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_welcome_email(self, user_id):
    """Email a newly registered student their welcome message.

    Runs on the Celery worker so a slow or unreachable SMTP host never delays
    the signup request. `fail_silently=False` on purpose: the task needs the
    exception so it can retry a transient SES/SMTP failure.
    """
    from apps.core.models import User

    user = User.objects.filter(id=user_id).first()
    if user is None:
        logger.warning("send_welcome_email: no user with id %s", user_id)
        return {'user_id': str(user_id), 'sent': False, 'reason': 'user_not_found'}

    if not user.email:
        logger.warning("send_welcome_email: user %s has no email address", user_id)
        return {'user_id': str(user_id), 'sent': False, 'reason': 'no_email'}

    subject, message, html_message = _welcome_email_payload(user)

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gnanacomputech.com'),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
    except Exception as exc:
        logger.warning("Welcome email to %s failed (attempt %s): %s", user.email, self.request.retries + 1, exc)
        # After max_retries Celery re-raises; the account still exists and is
        # usable, so a permanently undeliverable welcome email is not fatal.
        raise self.retry(exc=exc)

    logger.info("Welcome email sent to %s", user.email)
    return {'user_id': str(user_id), 'sent': True}


def queue_welcome_email(user):
    """Dispatch the welcome email without ever breaking the caller.

    Prefers the Celery worker. If the broker is unreachable (local dev with no
    Redis, or a worker outage) the email is sent inline with fail_silently=True
    rather than being dropped — slower, but the user still gets it, and a signup
    is never rejected because of the email system.
    """
    try:
        send_welcome_email.delay(str(user.id))
        return 'queued'
    except Exception:
        logger.warning("Celery unavailable; sending welcome email inline", exc_info=True)

    try:
        subject, message, html_message = _welcome_email_payload(user)
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gnanacomputech.com'),
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,
        )
        return 'sent_inline'
    except Exception:
        logger.exception("Welcome email to %s could not be sent", getattr(user, 'email', '<unknown>'))
        return 'failed'
