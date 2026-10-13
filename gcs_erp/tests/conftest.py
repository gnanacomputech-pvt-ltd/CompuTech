import pytest


@pytest.fixture(autouse=True)
def _plain_http_test_client(settings):
    """The Django test client speaks plain HTTP; production redirects HTTP -> HTTPS by default."""
    settings.SECURE_SSL_REDIRECT = False
