"""
Seed the Gallery and Blog sections of the site CMS.

Both pages used to render hardcoded arrays in the frontend's src/data/.
Now that they read SiteContent -- so staff edits actually show up on the
public site -- a fresh database would leave them empty. This command carries
that original content across so the pages look the way they always did,
after which everything is editable from the staff dashboard.

Idempotent: matches on (section, title), so re-running updates rather than
duplicating. Pass --only-if-empty to skip a section that already has content,
which is how the container entrypoint runs it -- that way a fresh deployment
gets the original content, but an item staff deleted is never resurrected on
the next deploy.
"""
from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.website.models import SiteContent


GALLERY = [
    {
        'title': 'Hands-on Full Stack Development Bootcamp',
        'date': '2026-02-01',
        'category': 'Workshops',
        'image_url': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80',
        'description': 'Students engaging in live React coding exercises during our weekend technical workshop.',
    },
    {
        'title': 'Python & Data Science Practical Session',
        'date': '2026-01-01',
        'category': 'Training',
        'image_url': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80',
        'description': 'Interactive classroom batch analyzing real datasets using Python Pandas and Matplotlib.',
    },
    {
        'title': 'Annual Tech Hackathon & Project Expo',
        'date': '2025-11-01',
        'category': 'Events',
        'image_url': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
        'description': 'Student teams showcasing their final year projects to industry judges and visitors.',
    },
    {
        'title': 'Software Developer Interns at Work',
        'date': '2025-12-01',
        'category': 'Internships',
        'image_url': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
        'description': 'GCS software development interns working on enterprise application modules in Sunkadakatte.',
    },
    {
        'title': 'Certificate Distribution Ceremony',
        'date': '2026-01-01',
        'category': 'Student Activities',
        'image_url': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
        'description': 'Celebrating the successful completion of the 3-month IT internship program.',
    },
    {
        'title': 'Degree College Technical Orientation',
        'date': '2025-10-01',
        'category': 'Seminars',
        'image_url': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80',
        'description': 'GCS software mentors delivering a tech career keynote at partner college auditorium.',
    },
    {
        'title': 'Mobile App Architecture Lab',
        'date': '2025-12-01',
        'category': 'Workshops',
        'image_url': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=80',
        'description': 'Hands-on Flutter mobile application debugging and state management lab.',
    },
    {
        'title': 'Mock Interview & Resume Preparation',
        'date': '2026-01-01',
        'category': 'Student Activities',
        'image_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
        'description': '1-on-1 interview feedback session conducted by senior GCS engineers.',
    },
]


BLOGS = [
    {
        'title': 'How to Choose the Best BCA Final Year Project Topic in 2026',
        'date': '2026-02-20',
        'category': 'Academic Advice',
        'author': 'Gnana Computech Academic Team',
        'read_time': '5 min read',
        'image_url': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        'description': 'A comprehensive step-by-step guide for BCA students to pick a high-scoring, industry-relevant final year project.',
        'content': """Choosing your final year project for BCA or MCA is one of the most critical decisions of your degree. A well-executed project not only secures high university marks but also serves as your strongest asset during job interviews.

### 1. Avoid Outdated Generic Projects
Avoid building basic library management or simple calculator systems that external examiners see hundreds of times. Instead, focus on real-world problems such as automated inventory portals, AI-assisted health monitoring, or cloud-based institution ERP systems.

### 2. Choose Modern Tech Stacks
Recruiters look for modern skills on your resume. Build your project using technologies like React, Node.js, Python Django, Flutter, or PostgreSQL. Demonstrating experience with Git version control and REST APIs gives you an instant edge.

### 3. Focus on System Architecture & Documentation
A great project requires proper documentation: SRS, ER diagrams, Data Flow Diagrams (DFDs), and test cases. At Gnana Computech Solutions, we guide students through both live coding execution and professional university documentation.

### 4. Practice Viva Questions Thoroughly
Be prepared to explain your database schema, code structure, authentication flow, and security measures. Mock viva sessions are key to building confidence!""",
    },
    {
        'title': 'Top 5 IT & Programming Skills High-Volume Employers Want in 2026',
        'date': '2026-01-15',
        'category': 'Career & Tech',
        'author': 'GCS Technical Directors',
        'read_time': '6 min read',
        'image_url': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        'description': 'Explore the key software skills, frameworks, and tools computer science graduates must learn to land tech roles in Bangalore.',
        'content': """The IT landscape in Bangalore and globally is evolving rapidly. Employers are prioritizing practical problem-solving capabilities over pure theoretical scores.

### 1. Full Stack Web Development (JAVA & PYTHON)
Companies prefer developers who understand both client-side user interfaces and server-side databases. Proficiency in Java (Spring Boot), Python (Django/FastAPI), React.js, and SQL is currently the most requested combination.

### 2. Applied Data Analytics & AI Integration
Understanding Python, Pandas, SQL querying, and how to integrate Generative AI APIs into standard business applications is becoming standard across tech teams.

### 3. Git Version Control & Agile Collaboration
Writing code in isolation is no longer enough. Freshers who know Git branching, pull requests, and agile sprint workflows adapt to software companies on day one.

### 4. API Design & Security
Building secure REST APIs with JWT authentication, role-based access control, and sanitizing user inputs is essential for modern software security.

At Gnana Computech Solutions, our training programs incorporate all these skills into hands-on project modules.""",
    },
    {
        'title': 'Why Real-World Software Internships Are Essential Before Graduation',
        'date': '2025-12-05',
        'category': 'Internship Guide',
        'author': 'GCS Placement Cell',
        'read_time': '4 min read',
        'image_url': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80',
        'description': 'Discover how structured IT internships bridge the gap between classroom theory and real corporate software development.',
        'content': """Graduating with a degree is an achievement, but standing out among thousands of applicants requires proven hands-on experience.

### 1. Gain Corporate Work Culture Exposure
Internships introduce students to standup meetings, deadline management, code reviews, and communication standards used in professional software companies.

### 2. Build Verifiable Portfolio Projects
Instead of listing theoretical subjects on your CV, an internship gives you concrete project achievements and verifiable experience certificates.

### 3. Mentorship from Experienced Engineers
Working alongside experienced developers at GCS helps interns learn industry best practices, debugging techniques, and professional coding standards.""",
    },
]


def _as_datetime(date_str):
    naive = datetime.strptime(date_str, '%Y-%m-%d')
    return timezone.make_aware(naive) if timezone.is_naive(naive) else naive


class Command(BaseCommand):
    help = "Seed the gallery and blog sections of the marketing site CMS."

    def add_arguments(self, parser):
        parser.add_argument(
            '--only-if-empty',
            action='store_true',
            help=(
                "Skip a section that already has any content. This is what makes "
                "the command safe to run on every deploy: it fills an empty "
                "section but never recreates an item staff deleted."
            ),
        )

    def handle(self, *args, **options):
        created = updated = 0
        only_if_empty = options['only_if_empty']

        def should_seed(section):
            if not only_if_empty:
                return True
            if SiteContent.objects.filter(section=section).exists():
                self.stdout.write(f"Section '{section}' already has content - skipping.")
                return False
            return True

        seed_gallery = should_seed('gallery')
        seed_blog = should_seed('blog')

        for order, item in enumerate(GALLERY if seed_gallery else []):
            _, was_created = SiteContent.objects.update_or_create(
                section='gallery',
                title=item['title'],
                defaults={
                    'description': item['description'],
                    'image_url': item['image_url'],
                    'event_start': _as_datetime(item['date']),
                    'display_order': order,
                    'is_active': True,
                    'extra': {'category': item['category']},
                },
            )
            created += was_created
            updated += not was_created

        for order, item in enumerate(BLOGS if seed_blog else []):
            _, was_created = SiteContent.objects.update_or_create(
                section='blog',
                title=item['title'],
                defaults={
                    'subtitle': item['author'],
                    'description': item['description'],
                    'image_url': item['image_url'],
                    'event_start': _as_datetime(item['date']),
                    'display_order': order,
                    'is_active': True,
                    'extra': {
                        'category': item['category'],
                        'readTime': item['read_time'],
                        'content': item['content'],
                    },
                },
            )
            created += was_created
            updated += not was_created

        self.stdout.write(self.style.SUCCESS(
            f"Gallery & blog content seeded: {created} created, {updated} updated."
        ))
