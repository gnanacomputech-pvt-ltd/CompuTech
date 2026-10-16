"""
The reported bug: a photo added in the dashboard never showed up on the
website, because the gallery was browser-localStorage on the staff side and
a hardcoded array on the public side. These tests pin the fix: a staff
upload is persisted server-side and comes straight back out of the public
read endpoint the Gallery page uses.
"""
import io

import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.core.models import User, Role, UserRole
from apps.website.models import SiteContent


def _png_upload(name='photo.png'):
    buffer = io.BytesIO()
    Image.new('RGB', (12, 8), color=(212, 167, 44)).save(buffer, format='PNG')
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type='image/png')


@pytest.fixture
def content_staff(db):
    """A Content Manager — the role whose domain owns the site CMS."""
    user = User.objects.create_user(
        email='content@example.com', password='ContentPass123!',
        full_name='Content Manager', is_active=True,
    )
    role, _ = Role.objects.get_or_create(code='CONTENT_MANAGER', defaults={'name': 'Content Manager'})
    UserRole.objects.get_or_create(user=user, role=role)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_uploaded_gallery_photo_appears_on_public_endpoint(content_staff, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path

    response = content_staff.post('/api/v1/content/', {
        'section': 'gallery',
        'title': 'Full Stack Bootcamp',
        'description': 'Students at the weekend workshop.',
        'image': _png_upload(),
        'extra': '{"category": "Workshops"}',
        'is_active': True,
    }, format='multipart')
    assert response.status_code == 201, response.data

    created = response.data.get('data', response.data)
    assert created['image_src'], 'the upload must come back as a usable image URL'

    # The public Gallery page reads this unauthenticated.
    public = APIClient().get('/api/v1/content/?section=gallery')
    assert public.status_code == 200
    rows = public.data.get('data', public.data)['results']
    titles = [row['title'] for row in rows]
    assert 'Full Stack Bootcamp' in titles

    photo = next(row for row in rows if row['title'] == 'Full Stack Bootcamp')
    assert photo['image_src'].startswith('http'), 'the SPA needs an absolute URL'
    assert photo['extra']['category'] == 'Workshops'


@pytest.mark.django_db
def test_unpublished_photo_is_hidden_from_the_public_but_visible_to_staff(content_staff):
    SiteContent.objects.create(
        section='gallery', title='Draft Photo', is_active=False,
        image_url='https://example.com/draft.jpg',
    )
    SiteContent.objects.create(
        section='gallery', title='Live Photo', is_active=True,
        image_url='https://example.com/live.jpg',
    )

    public = APIClient().get('/api/v1/content/?section=gallery')
    public_titles = [row['title'] for row in public.data.get('data', public.data)['results']]
    assert public_titles == ['Live Photo']

    staff = content_staff.get('/api/v1/content/?section=gallery')
    staff_titles = {row['title'] for row in staff.data.get('data', staff.data)['results']}
    assert staff_titles == {'Draft Photo', 'Live Photo'}


@pytest.mark.django_db
def test_blog_post_round_trips_with_its_body(content_staff):
    """The article body lives in `extra.content`; it must survive a save."""
    body = 'Opening paragraph.\n\n### A heading\n\nMore text.'
    response = content_staff.post('/api/v1/content/', {
        'section': 'blog',
        'title': 'Choosing a Final Year Project',
        'subtitle': 'GCS Academic Team',
        'description': 'A step-by-step guide.',
        'extra': {'category': 'Academic Advice', 'readTime': '5 min read', 'content': body},
        'is_active': True,
    }, format='json')
    assert response.status_code == 201, response.data

    post_id = response.data.get('data', response.data)['id']
    detail = APIClient().get(f'/api/v1/content/{post_id}/')
    assert detail.status_code == 200
    assert detail.data.get('data', detail.data)['extra']['content'] == body


@pytest.mark.django_db
def test_anonymous_visitor_cannot_write_content():
    response = APIClient().post('/api/v1/content/', {
        'section': 'gallery', 'title': 'Not allowed',
    }, format='json')
    assert response.status_code in (401, 403), response.data
    assert not SiteContent.objects.filter(title='Not allowed').exists()


@pytest.mark.django_db
def test_content_manager_can_manage_the_course_catalog(content_staff):
    """
    Courses and internships on the public site are Program rows, and the
    staff dashboard's Courses screen writes them — so the Content Manager
    role has to be allowed to (apps/common/permissions.py ProgramAccess).
    """
    response = content_staff.post('/api/v1/programs/', {
        'code': 'CRS-TEST-STACK',
        'title': 'Test Full Stack Course',
        'program_type': 'COURSE',
        'description': 'Course added from the staff dashboard.',
        'duration_weeks': 12,
        'base_fee': 15000,
        'is_published': True,
        'extra': {'category': 'Software Engineering', 'topics': ['React', 'Django']},
    }, format='json')
    assert response.status_code == 201, response.data

    program = response.data.get('data', response.data)
    assert program['enrollment_count'] == 0

    # And it is immediately visible on the public Courses page.
    public = APIClient().get('/api/v1/programs/?program_type=COURSE')
    titles = [row['title'] for row in public.data.get('data', public.data)['results']]
    assert 'Test Full Stack Course' in titles


@pytest.mark.django_db
def test_trainer_cannot_edit_the_website(db):
    """A Trainer may approve students but owns no website content."""
    user = User.objects.create_user(
        email='trainer-content@example.com', password='x', full_name='Trainer', is_active=True)
    role, _ = Role.objects.get_or_create(code='TRAINER', defaults={'name': 'Trainer'})
    UserRole.objects.get_or_create(user=user, role=role)
    client = APIClient()
    client.force_authenticate(user=user)

    denied = client.post('/api/v1/content/', {'section': 'gallery', 'title': 'Nope'}, format='json')
    assert denied.status_code == 403, denied.data
