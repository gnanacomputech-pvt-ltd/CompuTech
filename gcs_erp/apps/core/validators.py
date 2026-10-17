import socket
from django.conf import settings
from django.core.validators import EmailValidator, ValidationError


def validate_email_address(email):
    """
    Validates email format and domain structure/resolvability.
    Returns (is_valid: bool, error_message: str).
    """
    if not email or not isinstance(email, str):
        return False, "Email address is required."

    email = email.strip()
    if not email:
        return False, "Email address is required."

    # 1. Django standard EmailValidator
    validator = EmailValidator(message="Please enter a valid email address.")
    try:
        validator(email)
    except ValidationError:
        return False, "Please enter a valid email address."

    # 2. Structural checks
    if '@' not in email:
        return False, "Please enter a valid email address."

    parts = email.rsplit('@', 1)
    if len(parts) != 2:
        return False, "Please enter a valid email address."

    user_part, domain_part = parts[0].strip(), parts[1].strip()
    if not user_part or not domain_part:
        return False, "Please enter a valid email address."

    # Domain must contain a valid dot-separated TLD
    if '.' not in domain_part:
        return False, "Email domain must include a valid top-level domain (e.g. .com)."

    subdomains = domain_part.split('.')
    if any(len(sub) == 0 for sub in subdomains):
        return False, "Please enter a valid email address."

    if len(subdomains[-1]) < 2:
        return False, "Email top-level domain is invalid."

    # 3. DNS check for domain reachability when in real environment
    is_testing = (
        getattr(settings, 'TESTING', False)
        or getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False)
        or getattr(settings, 'DEBUG', False)
    )
    skip_domains = {'example.com', 'test.com', 'testserver', 'localhost'}
    lower_domain = domain_part.lower()

    if not is_testing and lower_domain not in skip_domains and not lower_domain.endswith('.example') and not lower_domain.endswith('.test'):
        try:
            socket.getaddrinfo(domain_part, None)
        except (socket.gaierror, socket.herror, OSError):
            return False, f"Domain '{domain_part}' does not exist or cannot be reached."

    return True, ""
