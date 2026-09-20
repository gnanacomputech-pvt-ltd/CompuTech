# AWS infrastructure (Terraform)

This stack provisions the full production architecture from
`docs/AWS_DEPLOYMENT.md` / the Revision 4 spec:

- VPC across two Availability Zones, one NAT Gateway per AZ
- Private subnets for ECS, RDS PostgreSQL (Multi-AZ), ElastiCache Redis (Multi-AZ)
- RDS Proxy in front of RDS — API + Celery worker + beat all pool through it
- ECS Fargate services: API (2+ tasks, target-tracking autoscaling 2–6 on CPU),
  Celery worker, Celery beat — each its own service, none competing for capacity
- Application Load Balancer (HTTP always; HTTPS once a domain is configured)
- S3 (private, versioned) for both Django media and the built frontend
- CloudFront in front of the frontend S3 bucket, with an Origin Access Control
  (no public bucket access) and SPA-style routing fallback to `index.html`
- AWS WAF (rate-based rules + AWS managed common rule set) on both CloudFront
  and the ALB, with a tighter limit specifically on `/api/v1/public/`,
  `/api/v1/auth/`, and `/verify/`
- Secrets Manager: app secrets (`SECRET_KEY`/`DATABASE_URL`/`REDIS_URL`) generated
  during `apply`, plus a separate secret in the {username,password} shape RDS
  Proxy requires
- CloudWatch alarms (ALB 5xx, unhealthy targets, ECS/RDS/ElastiCache CPU, RDS
  free storage, RDS connection count) → an SNS topic you can subscribe email,
  Slack, or PagerDuty to
- ECR repository, CloudWatch log groups + container insights
- GitHub Actions OIDC role — what `.github/workflows/deploy-*.yml` actually
  authenticates as; no long-lived AWS keys ever touch GitHub secrets
- Dedicated, private, versioned backup bucket + a nightly EventBridge
  Scheduler run of `scripts/backup_db_to_s3.sh` as a one-off Fargate task

## Deploy

Run from `infra/aws` with AWS credentials already configured (`aws configure`
or an assumed role — Terraform never wants your keys typed into a file):

```powershell
terraform init
terraform apply -var="container_image=PLACEHOLDER"
```

Build and push the API image, then apply with its immutable tag:

```powershell
$repo = terraform output -raw ecr_repository_url
$registry = $repo -replace '/[^/]+$',''
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $registry
docker build -f ../../gcs_erp/docker/Dockerfile -t "$repo:2026-09-19" ../../gcs_erp
docker push "$repo:2026-09-19"
terraform apply -var="container_image=$repo:2026-09-19"
```

After that, day-to-day deploys go through `.github/workflows/deploy-production.yml`
/ `deploy-staging.yml` (fetch the live task definition, bump the image, register
a new revision, roll the service) — not repeated `terraform apply` runs. Terraform
owns cpu/memory/IAM/secrets/env for the task definitions
(`lifecycle { ignore_changes = [container_definitions] }`); CI/CD owns the image tag.

Generated database, Django, and Redis secrets are stored in Terraform state and
AWS Secrets Manager. **Keep state in an encrypted, locked remote backend
(S3 + DynamoDB lock table) before team or production use** — this repo does not
configure one, so a fresh `terraform init` today uses local state, which is fine
solo but not for a team. Never commit state, plans, or `.terraform/`.

## Bringing a domain online

The stack works with **no domain at all** on a first apply: the ALB serves
plain HTTP and the frontend is reachable at its `*.cloudfront.net` URL
(`terraform output cloudfront_domain_name`). When the production domain is
ready:

1. Set `domain_name = "gnanacomputech.com"` (or whatever you own) in
   `terraform.tfvars`.
2. Leave `manage_dns = true` if Route53 should own DNS for this domain —
   Terraform creates the hosted zone, both ACM certs (regional for the ALB,
   us-east-1 for CloudFront), all validation records, and the HTTPS listener
   in one `apply`.
3. `terraform apply`, then `terraform output route53_name_servers` and set
   those as the NS records at your domain registrar.
4. Re-apply once DNS has propagated if the ACM validation didn't complete
   the first time (it usually does within the same apply).

If DNS is managed outside Route53, set `manage_dns = false` — the whole
HTTPS/ACM/Route53 section is skipped and stays HTTP + default CloudFront
domain until you wire up HTTPS manually.

## Wiring up CI/CD (GitHub Actions)

`terraform apply` creates the IAM role the workflows assume
(`github_actions_role_arn` output) — GitHub itself still needs to be told
about it. Set these as **repository secrets** (Settings → Secrets and
variables → Actions) once the first `apply` has run:

| Secret | Value |
|---|---|
| `AWS_ROLE_ARN` | `terraform output -raw github_actions_role_arn` |
| `AWS_REGION` | `var.aws_region` (defaults to `ap-south-1`) |
| `BACKUP_BUCKET_NAME` | `terraform output -raw backup_bucket_name` |
| `RDS_INSTANCE_ID` | `terraform output -raw rds_instance_identifier` (only needed for the optional pre-go-live failover test run) |
| `S3_BUCKET` | `terraform output -raw frontend_bucket_name` (frontend deploy workflow) |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output -raw cloudfront_distribution_id` (frontend deploy workflow) |
| `VITE_API_BASE_URL` | `terraform output -raw api_url` (frontend deploy workflow — baked into the build at compile time) |
| `API_HOSTNAME` | `api.<your-domain>` once DNS is live, otherwise the ALB DNS name (used only for the post-deploy smoke test) |

The trust policy (`ci_cd.tf`) scopes `AssumeRoleWithWebIdentity` to
`repo:<github_repository>:*` — any branch/PR/tag from this exact repo can
assume it, nothing else can. Tighten the `sub` condition to
`repo:<org>/<repo>:ref:refs/heads/main` once branch protection on `main` is
in place, if only `main` should ever be able to deploy to production.

Staging needs its own `environment: staging` secrets in GitHub if staging
runs as a separate `environment = "staging"` Terraform workspace/state —
this repo's variables default to a single `production` deploy; duplicate the
module (or use a `.tfvars` per environment) for a real staging stack.

## What still needs a person, not Terraform

Per Section 10.1 of the spec, applying this doesn't by itself prove the HA
story works — before go-live:

- Trigger an actual RDS Multi-AZ failover (`aws rds reboot-db-instance
  --force-failover`, or the `deploy-production.yml` workflow's optional
  "Pre-go-live failover test" run) and confirm the app recovers cleanly.
- Run a real restore from the scripted `pg_dump` backup
  (`gcs_erp/scripts/backup_db_to_s3.sh`), not just confirm the backup file exists.
- Set `alert_email` (or subscribe Slack/PagerDuty to `sns_alerts_topic_arn`)
  and confirm an alarm you trigger on purpose actually reaches a person.
- `manage_dns = true` walks through ACM + Route53 automatically, but it still
  can't confirm you *own* the domain at the registrar — do that first.
