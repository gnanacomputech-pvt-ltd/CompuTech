from django.core.management.base import BaseCommand
from apps.core.models import Program


COURSES = [
    {
        'code': 'CRS-FULLSTACK-WEB', 'title': 'Full Stack Web Development (JAVA/PYTHON)',
        'duration_weeks': 12, 'base_fee': 15000,
        'description': 'Comprehensive training program designed for students wanting to become full-stack software engineers. Build 4+ real-world web applications, learn REST API design, state management, version control, and cloud deployment.',
        'extra': {
            'category': 'Software Engineering', 'level': 'Beginner to Advanced', 'mode': 'Classroom & Online',
            'topics': [
                'HTML5, CSS3, JavaScript (ES6+), React.js', 'Tailwind CSS & Responsive Web Design',
                'Core Java, Spring Boot & Python Backend APIs', 'Database Architecture (MySQL & PostgreSQL)',
                'Git, GitHub Collaboration & Netlify/Vercel Deployment', 'Final Industry Capstone Project',
            ],
            'highlights': ['4 Live Projects', 'Placement Support', 'Course Certification', 'Mock Interviews'],
        },
    },
    {
        'code': 'CRS-PYTHON-DS', 'title': 'Python Programming & Data Analytics',
        'duration_weeks': 12, 'base_fee': 12000,
        'description': 'Python is the backbone of modern tech. This course covers core Python programming concepts, object-oriented programming, data structures, data analysis libraries, and SQL queries required for data analyst and Python developer roles.',
        'extra': {
            'category': 'Data Science & AI', 'level': 'Beginner to Intermediate', 'mode': 'Classroom & Online',
            'topics': [
                'Core & Advanced Python Programming', 'Object-Oriented Programming (OOPs)',
                'Data Analysis with Pandas & NumPy', 'Data Visualization with Matplotlib & Seaborn',
                'Relational Databases & SQL Querying', 'Data Cleaning & Real-World Dataset Analysis',
            ],
            'highlights': ['Real Datasets', 'Certificate of Excellence', 'Daily Hands-on Tasks', 'Placement Prep'],
        },
    },
    {
        'code': 'CRS-JAVA-ENTERPRISE', 'title': 'Java Enterprise Software Engineering',
        'duration_weeks': 16, 'base_fee': 16000,
        'description': "Master Java - the world's leading enterprise language. Learn Core Java concepts, multithreading, collections, Spring Boot framework, RESTful web services, and Maven build automation.",
        'extra': {
            'category': 'Software Engineering', 'level': 'Intermediate', 'mode': 'Classroom & Online',
            'topics': [
                'Java Syntax, OOP Concepts, Collections Framework', 'Multithreading, Exception Handling & File I/O',
                'Spring Boot & Hibernate ORM', 'REST API Development & Microservices',
                'Database Management with PostgreSQL/MySQL', 'Unit Testing with JUnit & Postman API Testing',
            ],
            'highlights': ['Enterprise Project', '1-on-1 Mentorship', 'Resume Building', 'Job Referrals'],
        },
    },
    {
        'code': 'CRS-MOBILE-DEV', 'title': 'Mobile App Development with Flutter & React Native',
        'duration_weeks': 12, 'base_fee': 14000,
        'description': 'Learn how to create native-feeling cross-platform mobile apps for Android and iOS. Understand widget lifecycles, state management, REST API integration, camera/location features, and Google Play Store publishing.',
        'extra': {
            'category': 'Mobile Development', 'level': 'Beginner to Intermediate', 'mode': 'Classroom & Hybrid',
            'topics': [
                'Dart Programming Language Basics', 'Flutter Architecture & UI Widgets',
                'State Management (Provider & BLoC / Redux)', 'Connecting Mobile Apps to Backend REST APIs',
                'Firebase Authentication & Cloud Storage', 'App Store & Play Store Deployment Workflow',
            ],
            'highlights': ['2 Mobile Apps Built', 'Live Play Store Demo', 'Industry Mentors', 'Certification'],
        },
    },
    {
        'code': 'CRS-BCA-MCA-PREP', 'title': 'BCA / MCA Project & Academic Prep Track',
        'duration_weeks': 8, 'base_fee': 8500,
        'description': 'Tailored specifically for computer application degree students in Bangalore. Get expert technical guidance, complete source code execution, document generation (IEEE/College standard), and live project explanation.',
        'extra': {
            'category': 'Academic Support', 'level': 'All Degree Students', 'mode': 'Classroom',
            'topics': [
                'Requirement Analysis & SRS Preparation', 'DFD, ER Diagrams & UML Architecture',
                'Project Coding & Database Execution', 'System Testing & Error Rectification',
                'Documentation & PPT Presentation Preparation', 'Comprehensive Viva Voce Practice',
            ],
            'highlights': ['100% Viva Success Rate', 'Complete Documentation', 'Full Source Code', 'Individual Guidance'],
        },
    },
    {
        'code': 'CRS-CYBER-SECURITY', 'title': 'Cyber Security & Ethical Hacking Essentials',
        'duration_weeks': 8, 'base_fee': 9500,
        'description': 'Explore the exciting domain of Cyber Security. Gain fundamental knowledge of computer networking, Linux CLI, penetration testing concepts, OWASP Top 10 vulnerabilities, and security auditing tools.',
        'extra': {
            'category': 'Security & Networking', 'level': 'Beginner', 'mode': 'Classroom & Online',
            'topics': [
                'Networking Fundamentals & OSI Model', 'Linux Command Line & Shell Scripting',
                'Ethical Hacking Methodology & Reconnaissance', 'Web Application Vulnerabilities (OWASP Top 10)',
                'Network Scanning & Wireshark Packet Analysis', 'Cyber Defense & Security Best Practices',
            ],
            'highlights': ['Hands-on Security Labs', 'Industry Expert Mentors', 'Certificate', 'Career Roadmap'],
        },
    },
]

INTERNSHIPS = [
    {
        'code': 'INT-FULLSTACK-WEB', 'title': 'Full Stack Web Development Internship',
        'duration_weeks': 4, 'base_fee': 0,
        'description': 'Work on live web applications, REST APIs, responsive UI engineering, and database management alongside senior developers.',
        'extra': {
            'domain': 'Software Engineering', 'mode': 'In-Office / Hybrid (Sunkadakatte, Bangalore)',
            'stipend': 'Performance Based / Certificate Provided',
            'skills': ['React.js', 'Node.js', 'Express', 'MongoDB/MySQL', 'Git', 'Tailwind CSS'],
            'learnings': [
                'Build responsive frontend components using React and Tailwind',
                'Design RESTful API endpoints and integrate with SQL databases',
                'Collaborate using Git branching workflows and code reviews',
                'Participate in daily standup meetings and sprint planning',
            ],
            'eligibility': 'BCA, MCA, B.E., B.Tech, BSc CS, Diploma Students & Recent Graduates',
        },
    },
    {
        'code': 'INT-PYTHON-BACKEND', 'title': 'Python & Backend Systems Internship',
        'duration_weeks': 4, 'base_fee': 0,
        'description': 'Develop Python backend microservices, data processing pipelines, and database integration scripts for client projects.',
        'extra': {
            'domain': 'Backend Engineering', 'mode': 'In-Office (Bangalore)',
            'stipend': 'Certificate + Stipend for top performers',
            'skills': ['Python 3', 'Django/Flask', 'PostgreSQL', 'REST APIs', 'Postman', 'Linux'],
            'learnings': [
                'Write clean, modular Python backend code and automation scripts',
                'Database schema design, indexing, and complex SQL query optimization',
                'API authentication using JWT tokens and session security',
                'Deploy backend applications to cloud infrastructure',
            ],
            'eligibility': 'BCA, MCA, Engineering CS/IT Undergraduates',
        },
    },
    {
        'code': 'INT-MOBILE-APP', 'title': 'Mobile Application Engineering Internship',
        'duration_weeks': 12, 'base_fee': 0,
        'description': 'Gain hands-on experience building mobile apps using Flutter and React Native for Android and iOS devices.',
        'extra': {
            'domain': 'Mobile App Development', 'mode': 'In-Office / Hybrid',
            'stipend': 'Certificate Provided',
            'skills': ['Flutter', 'Dart', 'React Native', 'Firebase', 'State Management', 'Mobile UI/UX'],
            'learnings': [
                'Construct intuitive mobile screens and custom animations',
                'Integrate device native APIs (Camera, GPS, Notifications)',
                'Connect mobile applications to cloud backends and Firebase',
                'Prepare release builds for Google Play Store testing',
            ],
            'eligibility': 'Computer Application & Engineering Students with OOP Knowledge',
        },
    },
    {
        'code': 'INT-ACADEMIC-PROJECT', 'title': 'Degree Final Year Project Development Internship',
        'duration_weeks': 8, 'base_fee': 0,
        'description': 'Build your final year academic project under official software company guidance and receive a verified internship certificate.',
        'extra': {
            'domain': 'Academic & Applied Tech', 'mode': 'In-Office (Sunkadakatte)',
            'stipend': 'Certificate + Complete Project Deliverables',
            'skills': ['Project Architecture', 'SRS Documentation', 'Full Stack Development', 'Viva Prep'],
            'learnings': [
                'Complete end-to-end design and coding of your degree final year project',
                'Create academic documentation, architecture diagrams, and testing reports',
                'Gain real corporate project development exposure and mentorship',
                'Confidently defend your project in college viva voce',
            ],
            'eligibility': 'BCA, MCA, B.E., B.Tech, BSc Computer Science Final Year Students',
        },
    },
]


class Command(BaseCommand):
    help = "Seeds the public Courses/Internships pages' content as real Program rows (idempotent — safe to re-run)."

    def handle(self, *args, **options):
        created, updated = 0, 0
        for row in COURSES:
            _, was_created = Program.objects.update_or_create(
                code=row['code'],
                defaults={
                    'title': row['title'], 'program_type': 'COURSE',
                    'description': row['description'], 'duration_weeks': row['duration_weeks'],
                    'base_fee': row['base_fee'], 'is_published': True, 'extra': row['extra'],
                },
            )
            created += was_created
            updated += not was_created

        for row in INTERNSHIPS:
            _, was_created = Program.objects.update_or_create(
                code=row['code'],
                defaults={
                    'title': row['title'], 'program_type': 'INTERNSHIP',
                    'description': row['description'], 'duration_weeks': row['duration_weeks'],
                    'base_fee': row['base_fee'], 'is_published': True, 'extra': row['extra'],
                },
            )
            created += was_created
            updated += not was_created

        self.stdout.write(self.style.SUCCESS(
            f"[OK] Seeded public programs: {created} created, {updated} updated "
            f"({len(COURSES)} courses, {len(INTERNSHIPS)} internships)."
        ))
