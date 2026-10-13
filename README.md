# GNANA COMPUTECH SOLUTIONS PRIVATE LIMITED (GCS)
## Official Website, ERP & Portals Suite

This is the complete web platform for **GNANA COMPUTECH SOLUTIONS PRIVATE LIMITED**, based in Sunkadakatte, Bangalore North, Karnataka. It is a full-stack application: a React + Vite frontend (this directory) and a Django + DRF backend with Celery workers (`gcs_erp/`), deployed together to AWS.

It combines a modern educational website structure & UX with authentic GCS corporate content, services, degree project offerings, internships, and GCS Gold & Dark Charcoal visual identity.

---

## 🎨 Color Palette & Visual Identity

Extracted from the official GCS logo & corporate identity:

- **Primary Gold:** `#D4A72C`
- **Dark Gold:** `#B88918`
- **Charcoal:** `#222326`
- **Dark Charcoal:** `#17181A`
- **Light Background:** `#FAFAF7`
- **Border:** `#E8E1D2`
- **Main Text:** `#252525`
- **Muted Text:** `#6B6B6B`

---

## 🚀 Built With

**Frontend**
- **React 18** + **Vite 5**
- **Tailwind CSS** (compiled at build time, not the Play CDN)
- **React Router v6**
- **Lucide React Icons**

**Backend** (`gcs_erp/`)
- **Django 5.2 LTS** + **Django REST Framework**
- **PostgreSQL** (SQLite fallback for local dev)
- **Celery** + **Redis** for scheduled jobs and background tasks
- **Gunicorn** + **WhiteNoise**, containerized behind **nginx**
- **drf-spectacular** for the OpenAPI schema (`/api/docs/`)

---

## 🌐 Complete Route Map

### Public Website
- `/` - Home Page (Hero, Trust/Partners, Services preview, Courses, Testimonials carousel, Events, Quick Pillars)
- `/about` - About GCS (Company overview, Corporate quality standards, CIN, Sunkadakatte Head Office address, Mission, Vision, Training philosophy)
- `/services` - Services Listing (BCA/MCA Academic Projects, Industry Training, Software Internships, Custom Software, Placement Support, Seminars)
- `/services/:id` - Detailed Service Pages
- `/courses` - Courses & Programs Listing with category filters
- `/courses/:id` - Detailed Course Pages with curriculum & registration links
- `/internships` - Dedicated Internships Page with domain filters, stipend info, and eligibility
- `/events` - Coming Soon & Previous Workshops, Hackathons, and Seminars
- `/events/:id` - Detailed Event Information & Schedule
- `/blogs` - Tech Articles (Choosing BCA Projects, 2026 IT Skills, Importance of Internships)
- `/blogs/:id` - Full Blog Article Reader
- `/gallery` - Campus Activity Gallery with category filters and Lightbox Modal
- `/testimonials` - Learner Testimonials Spotlight & Carousel
- `/contact` - Official GCS Sunkadakatte Contact Page with address, phone, email, and validated contact form
- `/register` - Student Application & Project Registration Form with validation & success state
- `/login` - Portal Login Page with role switching (Student / ERP Staff / Institution)
- `/signup` - Account Signup for Students & Institution Partners

### GCS ERP & Management Portals
- `/erp` / `/erp/dashboard` - Staff & Admin ERP Dashboard (Students, Institutions, Employees, Programs, Batches, Enrollments, Attendance, Projects, Fees, Certificates, Logout)
- `/student` / `/student/dashboard` - Student Portal UI (Profile, Active Projects, IEEE Documentation Status, Viva Defense Prep, Fee Ledger, Logout)
- `/institution` / `/institution/dashboard` - Partner Institution Portal UI (College Student Progress, Active Batches, Workshop Certificates, Logout)

---

## 🏢 Official Company Details Included

- **Company Name:** Gnana Computech Solutions Private Limited
- **CIN:** U85500KA2025PTC205651
- **Registered Address:** 2nd Floor, No. 126, 9th A Cross, 3rd Main, Vigneswara Nagar, Sunkadakatte, Viswaneedam Post, Bangalore North, Karnataka, India - 560091
- **Accreditation:** DPIIT Recognized | Registered Private Limited Company
- **Phone:** +91 98765 43210 / +91 80 2345 6789
- **Email:** info@gnanacomputech.com

---

## ⚙️ Running Locally

The frontend and backend run as two processes. The frontend talks to the backend
over `VITE_API_BASE_URL`, which is baked in **at build time** (Vite only exposes
`VITE_`-prefixed vars), so changing it needs a rebuild, not just a restart.

### Frontend

```bash
npm install
cp .env.example .env.local      # defaults to http://localhost:8000
npm run dev                     # http://localhost:3000
```

### Backend (`gcs_erp/`)

```bash
cd gcs_erp
python -m venv venv && source venv/bin/activate   # Windows: venv/Scripts/activate
pip install -r requirements/dev.txt
cp .env.example .env            # then set SECRET_KEY and DEBUG=True
python manage.py migrate
python manage.py seed_erp_data  # optional demo data
python manage.py runserver      # http://localhost:8000
```

`DEBUG` defaults to **off**, and with `DEBUG` off the app refuses to start
without a `SECRET_KEY` rather than falling back to a shared dev key. For local
work set `DEBUG=True` in `gcs_erp/.env`.

Generate a production key with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Tests and checks

These are the same gates CI enforces, so run them before pushing:

```bash
cd gcs_erp
flake8 apps config tests                  # lint
python manage.py makemigrations --check --dry-run   # no un-generated migrations
python manage.py check --deploy           # production settings audit
pytest                                    # full suite
```

```bash
npm run build                             # frontend must build clean
```

---

## 🚀 Deployment (AWS)

Two AWS paths exist. Both build the frontend to static files and run the backend
in Docker; they differ in scale.

| | `infra/aws-minimal/` | `infra/aws/` |
|---|---|---|
| Shape | One EC2 instance, Docker Compose | ECS Fargate, RDS Multi-AZ, ElastiCache, CloudFront, WAF |
| TLS | None yet — plain HTTP, reached by IP | ACM certificates on CloudFront + ALB |
| Use | Current live demo environment | Full production architecture |
| Workflow | `.github/workflows/deploy-aws-minimal.yml` | `deploy-production.yml` / `deploy-staging.yml` |
| Docs | This section | `gcs_erp/docs/AWS_DEPLOYMENT.md`, `infra/aws/README.md` |

### How the live deploy works

Pushing to `main` (when a build input changes) runs
`deploy-aws-minimal.yml`, which:

1. **Gates on tests** — runs the full backend suite via `ci.yml`. Nothing ships
   if lint, system checks, the migration check or pytest fail.
2. **Builds the frontend** with `VITE_API_BASE_URL` set to the instance IP.
3. **Validates the env file** against this target. The instance is plain HTTP, so
   the deploy is refused unless `DEBUG`, `SECURE_SSL_REDIRECT`,
   `SECURE_HSTS_SECONDS` and `COOKIE_SECURE` are all explicitly disabled, and
   `ALLOWED_HOSTS` contains the server IP. `settings.py` turns HTTPS redirects
   and HSTS **on** by default whenever `DEBUG` is off, which on an HTTP-only host
   would 301 every request to an `https://` URL nothing is listening on.
4. **Ships via S3 + SSM** — direct SSH is not reachable from every network, so the
   bundle goes to S3 and Systems Manager tells the instance to pull it. The
   bundle is fetched and unpacked *before* containers are touched, so a failed
   download leaves the running site alone.
5. **Verifies** — waits for `/api/v1/health/` on the instance, then smoke-tests
   the public IP for the health endpoint, the homepage and a React Router deep
   link. Container logs are dumped on failure.

### Required GitHub Actions secrets

| Secret | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` | Deploy user with S3 + SSM access |
| `AWS_SECRET_ACCESS_KEY` | — |
| `DEPLOY_ENV_FILE` | Full contents of the backend `.env` used on the instance |

`DEPLOY_ENV_FILE` must at minimum set `SECRET_KEY`, `ALLOWED_HOSTS`,
`POSTGRES_PASSWORD`, `DATABASE_URL`, `REDIS_URL`, and the four HTTP-only values
from step 3. The validation step names whichever one is wrong before anything
is deployed.

### Running the stack with Docker locally

```bash
cd gcs_erp
cp .env.example .env            # set SECRET_KEY and POSTGRES_PASSWORD
docker compose -f docker/docker-compose.yml up --build
```

That compose file is the HTTPS/Certbot variant used once a domain exists; run
`docker/init-letsencrypt.sh` for first-time certificate issuance.

---

## 🔐 Secrets

No real secrets are committed — only `.env.example` templates. `.env` files,
Terraform state, `*.tfvars`, deploy keys and `infra/aws-minimal/deploy-env/`
are all gitignored, as is `.claude/`. Keep it that way: rotate anything that
reaches a commit.
