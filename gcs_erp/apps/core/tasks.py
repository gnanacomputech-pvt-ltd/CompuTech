from celery import shared_task
import logging
import socket
from urllib.parse import urlparse

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

# How long we are willing to spend finding out whether the broker is there.
# This runs inside an HTTP request, so it has to be short.
_BROKER_PROBE_TIMEOUT = 0.75

_DEFAULT_BROKER_PORTS = {'redis': 6379, 'rediss': 6379, 'amqp': 5672, 'amqps': 5671}


def _broker_is_reachable():
    """Cheap TCP pre-flight before dispatching a task from a web request.

    A dispatch to an unreachable broker costs the *request* a reconnect
    cycle inside Celery. Measured locally with no Redis running: ~64s
    originally (apply_async also registers the task with the result store,
    whose retry policy the broker timeouts do not govern -- it fails with
    "Retry limit exceeded while trying to reconnect to the Celery result
    store backend"), ~6s once the timeouts in config/settings.py cap both
    connections, and under a second with this probe, which skips the
    attempt entirely and lets queue_welcome_email send inline instead.

    Returns True when we cannot tell (an unparseable or non-TCP broker URL),
    so an unusual configuration still gets the normal dispatch path.
    """
    url = getattr(settings, 'CELERY_BROKER_URL', '') or ''
    try:
        parsed = urlparse(url)
    except Exception:
        return True

    host = parsed.hostname
    if not host:
        return True
    port = parsed.port or _DEFAULT_BROKER_PORTS.get(parsed.scheme)
    if not port:
        return True

    try:
        with socket.create_connection((host, port), timeout=_BROKER_PROBE_TIMEOUT):
            return True
    except OSError:
        return False


def _welcome_email_payload(user):
    """Build the subject, plain-text body and HTML body for the welcome email.

    Kept separate from sending so both the Celery task and the inline fallback
    render exactly the same message.

    Self-registered accounts land in the approval queue and cannot sign in
    yet (see apps/core/signup.py), so the copy changes accordingly: telling a
    PENDING student to go and sign in would just send them to a login screen
    that refuses them. The same message is sent again, in its approved form,
    once a reviewer approves the account.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    login_url = f"{frontend_url}/login"
    support_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'info@gnanacomputech.com')
    pending_approval = getattr(user, 'approval_status', 'APPROVED') == 'PENDING'

    subject = "Welcome to Gnana Computech Solutions"
    if pending_approval:
        opening = (
            "Thank you for registering with Gnana Computech Solutions.\n\n"
            "Your account has been created and is now waiting for approval by "
            "our team. We will email you as soon as it has been approved, and "
            "you can then sign in here:\n"
            f"{login_url}\n\n"
            "What happens next:\n"
            "  - Our coordinator reviews your registration details\n"
            "  - You receive a confirmation email once approved\n"
            "  - You sign in to track your projects, attendance and certificates\n\n"
        )
    else:
        opening = (
            "Your GCS student account has been created successfully.\n\n"
            "You can now sign in to the student portal to track your projects, "
            "attendance and certificates:\n"
            f"{login_url}\n\n"
            "What you can do next:\n"
            "  - Browse academic projects and internship openings\n"
            "  - Register for BCA/MCA degree project guidance\n"
            "  - Track your attendance and IEEE documentation progress\n"
            "  - Download certificates once your programme is complete\n\n"
        )

    message = (
        f"Hi {user.full_name},\n\n"
        + opening
        + "If this wasn't you, please contact us at "
        + f"{support_email}.\n\n"
        + "Gnana Computech Solutions Private Limited\n"
        + "Bangalore North, Karnataka, India\n"
    )

    # A missing or broken template must never cost us the plain-text email,
    # which on its own is a perfectly good welcome message.
    try:
        html_message = render_to_string('emails/welcome.html', {
            'user': user,
            'login_url': login_url,
            'support_email': support_email,
            'pending_approval': pending_approval,
        })
    except Exception:
        logger.exception("Could not render emails/welcome.html; sending plain text only")
        html_message = None

    return subject, message, html_message


# ignore_result: nobody ever reads this task's return value, and asking
# the result store to record it is what made a dispatch from a web
# request wait on Redis at all.
@shared_task(bind=True, max_retries=3, default_retry_delay=60, ignore_result=True)
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
    # In eager mode (tests) there is no broker to reach and the task runs
    # inline anyway, so skip the probe.
    eager = getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False)
    if eager or _broker_is_reachable():
        try:
            # retry=False so a transient failure raises here rather than
            # holding the HTTP request open through a publish retry loop;
            # the inline send below is the fallback.
            send_welcome_email.apply_async(args=[str(user.id)], retry=False)
            return 'queued'
        except Exception:
            logger.warning("Celery unavailable; sending welcome email inline", exc_info=True)
    else:
        logger.info("Broker unreachable; sending welcome email inline")

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


# ---------------------------------------------------------------------------
# Signup approval / rejection notifications
# ---------------------------------------------------------------------------

def _approval_email_payload(user, approved, reason=''):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    login_url = f"{frontend_url}/login"
    support_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'info@gnanacomputech.com')

    if approved:
        subject = "Your Gnana Computech account has been approved"
        message = (
            f"Hi {user.full_name},\n\n"
            "Good news - your Gnana Computech Solutions account has been approved.\n\n"
            f"You can sign in here: {login_url}\n\n"
            "Gnana Computech Solutions Private Limited\n"
        )
    else:
        subject = "Update on your Gnana Computech account request"
        message = (
            f"Hi {user.full_name},\n\n"
            "Thank you for your interest in Gnana Computech Solutions. "
            "Unfortunately your account request was not approved at this time.\n\n"
        )
        if reason:
            message += f"Reason: {reason}\n\n"
        message += (
            f"If you believe this is a mistake, please contact us at {support_email}.\n\n"
            "Gnana Computech Solutions Private Limited\n"
        )

    return subject, message


def notify_signup_decision(user, approved, reason=''):
    """Email the applicant the outcome of their signup review.

    Swallows its own failures for the same reason queue_welcome_email does:
    an approval must not be rolled back because the mail host is unreachable.
    """
    try:
        subject, message = _approval_email_payload(user, approved, reason)
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gnanacomputech.com'),
            recipient_list=[user.email],
            fail_silently=True,
        )
        return 'sent'
    except Exception:
        logger.exception("Signup decision email to %s could not be sent", getattr(user, 'email', '<unknown>'))
        return 'failed'
