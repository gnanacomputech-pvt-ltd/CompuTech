# AWS Deployment Guide — GCS ERP Backend

**Production Architecture Specification (Revision 4)**
**Gnana Computech Solutions Private Limited**
**Stack: React + Tailwind • Django + DRF • PostgreSQL • Amazon Web Services**
**Target scale: under 1,00,000 users**

---

## 1. Overview

This guide covers the complete AWS deployment configuration for the GCS ERP backend, built as a containerized service on ECS Fargate with Multi-AZ RDS PostgreSQL, ElastiCache Redis, S3 object storage, and CloudFront CDN.

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           CloudFront CDN                         │
│                    (SSL termination, edge cache)                 │
│                  api.gnanacomputech.com                          │
│              verify.gnanacomputech.com                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Application Load Balancer (ALB)                     │
│         AWS Certificate Manager (ACM) HTTPS certificates         │
│    Target Group → ECS Fargate API tasks (2+ across 2 AZs)       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌────────────────┐ ┌─────────┐ ┌────────────────┐
    │ ECS Fargate    │ │ ECS     │ │ ECS Fargate    │
    │ API Tasks      │ │ Worker  │ │ Celery Beat    │
    │ Gunicorn       │ │ Celery  │ │ Scheduled Jobs │
    │ (2+ tasks)     │ │ (1+)    │ │ (1 task)       │
    └───────┬────────┘ └────┬────┘ └────────────────┘
            │               │
            └───────┬───────┘
                    ▼
    ┌─────────────────────────────────────────────────────────┐
    │              Amazon RDS Proxy                            │
    │         Connection pooling for API + Worker              │
    └──────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌─────────────┐ ┌──────────┐ ┌─────────────┐
    │  RDS PG     │ │ RDS PG   │ │ RDS Proxy   │
    │  Primary    │ │ Standby  │ │ (managed)   │
    │  (Multi-AZ) │ │ (Multi-  │ │             │
    │             │ │  AZ)     │ │             │
    └─────────────┘ └──────────┘ └─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
    ┌─────────────┐ ┌──────────┐ ┌─────────────┐
    │ ElastiCache │ │ S3       │ │ Secrets Mgr │
    │ Redis       │ │ (Certs,  │ │ (Credentials│
    │ (broker +   │ │  media)  │ │  injected)  │
    │  cache)     │ │          │ │             │
    └─────────────┘ └──────────┘ └─────────────┘
```

## 3. AWS Services Used

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **ECS Fargate** | API, worker, beat tasks | 2+ API tasks, 1 worker, 1 beat |
| **RDS PostgreSQL** | Primary database | Multi-AZ, `db.t4g.small` minimum |
| **RDS Proxy** | Connection pooling | Shared across API + worker tasks |
| **ElastiCache Redis** | Celery broker + cache | `cache.t4g.micro` |
| **S3** | Object storage | Certificates, media, backups |
| **CloudFront** | CDN + edge caching | SSL, compression, geo-restriction |
| **ALB** | Load balancing | HTTPS termination, health checks |
| **ACM** | SSL certificates | Auto-renewal |
| **Secrets Manager** | Credential storage | DB creds, JWT keys, API secrets |
| **WAF** | Rate limiting | Auth endpoints, public cert verify |
| **CloudWatch** | Logs + metrics + alarms | CPU, 5xx rate, queue depth |
| **IAM** | Role-based access | ECS task roles, scoped access |
| **NAT Gateway** | Outbound from private subnets | 1 per AZ for HA |

## 4. Prerequisites

### 4.1 AWS Account Setup

1. **Create a dedicated AWS account** for GCS ERP (or a dedicated project account)
2. **Enable required services**: ECS, RDS, ElastiCache, S3, CloudFront, ALB, ACM, WAF, Secrets Manager, CloudWatch
3. **Create IAM roles** for ECS tasks with scoped permissions
4. **Set up VPC** with public + private subnets across 2 AZs

### 4.2 Required Secrets

Store these in **AWS Secrets Manager** (not in plain `.env` files):

```bash
# Database credentials
aws secretsmanager create-secret --name gcs-erp/prod/database \
  --secret-string '{"username":"gcs_admin","password":"secure_db_password_here","host":"gcs-erp-rds-proxy","port":5432,"dbname":"gcs_erp_production"}'

# JWT signing key
aws secretsmanager create-secret --name gcs-erp/prod/jwt \
  --secret-string '{"secret_key":"gcs-erp-render-supabase-secret-key-2026-prod"}'

# AWS SES SMTP credentials (if using SES)
aws secretsmanager create-secret --name gcs-erp/prod/ses-smtp \
  --secret-string '{"username":"","password":""}'
```

### 4.3 Infrastructure as Code (IaC)

Create the following infrastructure resources:

- **VPC** with public + private subnets across 2 AZs
- **NAT Gateway** (1 per AZ) for private subnet outbound access
- **RDS PostgreSQL** instance (Multi-AZ) with automated backups
- **RDS Proxy** for connection pooling
- **ElastiCache Redis** cluster
- **S3 bucket** for certificates/media with versioning + lifecycle rules
- **CloudFront distribution** for CDN
- **ALB** with HTTPS listener (ACM certificate)
- **ECS cluster** with Fargate launch type
- **ECR repository** for Docker images
- **WAF rules** for rate limiting
- **CloudWatch alarms** for CPU, 5xx rate, queue depth

## 5. ECS Task Definitions

### 5.1 API Task Definition

```json
{
  "family": "gcs-erp-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsGcsErpTaskRole",
  "containerDefinitions": [
    {
      "name": "gcs-erp-api",
      "image": "<account>.dkr.ecr.<region>.amazonaws.com/gcs-erp-api:latest",
      "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
      "environment": [
        {"name": "DJANGO_SETTINGS_MODULE", "value": "config.settings"},
        {"name": "DATABASE_URL", "value": "postgresql://gcs_admin:***@rds-proxy-endpoint:5432/gcs_erp_production"},
        {"name": "REDIS_URL", "value": "redis://elasticache-endpoint:6379/0"},
        {"name": "RDS_PROXY_ENABLED", "value": "True"},
        {"name": "AWS_STORAGE_BUCKET_NAME", "value": "gcs-erp-certificates-production"},
        {"name": "AWS_S3_REGION_NAME", "value": "ap-south-1"},
        {"name": "SECRET_KEY", "value": "***"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:region:account:secret:gcs-erp/prod/database"},
        {"name": "SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:region:account:secret:gcs-erp/prod/jwt"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/gcs-erp-api",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/api/v1/health/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 5.2 Worker Task Definition

Same as API but with:
- `command: celery -A config worker --loglevel=info -c 2`
- Lower CPU/memory allocation (0.25 vCPU / 512 MB)

### 5.3 Beat Task Definition

Same as API but with:
- `command: celery -A config beat --loglevel=info`
- Minimal resources (0.25 vCPU / 256 MB)

## 6. Deployment Steps

### 6.1 Initial Deployment

```bash
# 1. Build and push Docker image to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com
docker build -t gcs-erp-api ./gcs_erp -f ./gcs_erp/docker/Dockerfile
docker tag gcs-erp-api:latest <account>.dkr.ecr.ap-south-1.amazonaws.com/gcs-erp-api:latest
docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/gcs-erp-api:latest

# 2. Run database migrations (one-off ECS task)
aws ecs run-task --cluster gcs-erp-production-cluster \
  --task-definition gcs-erp-api \
  --overrides '{"containerOverrides":[{"name":"gcs-erp-api","command":["python","manage.py","migrate","--noinput"]}]}' \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=DISABLED}"

# 3. Collect static files (one-off ECS task)
aws ecs run-task --cluster gcs-erp-production-cluster \
  --task-definition gcs-erp-api \
  --overrides '{"containerOverrides":[{"name":"gcs-erp-api","command":["python","manage.py","collectstatic","--noinput"]}]}' \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=DISABLED}"

# 4. Seed initial data (if needed)
aws ecs run-task --cluster gcs-erp-production-cluster \
  --task-definition gcs-erp-api \
  --overrides '{"containerOverrides":[{"name":"gcs-erp-api","command":["python","manage.py","seed_erp_data"]}]}' \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-zzz],assignPublicIp=DISABLED}"
```

### 6.2 CI/CD Pipeline (GitHub Actions)

The GitHub Actions workflows in `.github/workflows/` handle:

- **`ci.yml`**: Lint, test, migration check on PRs
- **`deploy-staging.yml`**: Build, push to ECR, deploy to staging ECS service on `develop` push
- **`deploy-production.yml`**: Build, push to ECR, deploy to production ECS service on `main` push

#### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | IAM role ARN for GitHub Actions OIDC |
| `AWS_REGION` | AWS region (default: `ap-south-1`) |
| `STAGING_TASK_DEFINITION_FILE` | Path to staging task definition JSON |
| `PRODUCTION_TASK_DEFINITION_FILE` | Path to production task definition JSON |
| `PRODUCTION_SSH_KEY` | SSH key for production server (if using SSH backup) |
| `BACKUP_BUCKET_NAME` | S3 bucket name for backups |
| `RDS_INSTANCE_ID` | RDS instance ID for failover testing |
| `STAGING_SSH_KEY` | SSH key for staging server (if using SSH backup) |
| `STAGING_HOST` | Staging server hostname |
| `STAGING_SSH_USER` | Staging SSH username |

### 6.3 Post-Deployment Verification

```bash
# 1. Check ECS service status
aws ecs describe-services --cluster gcs-erp-production-cluster --services gcs-erp-production-api-service

# 2. Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>

# 3. Run smoke test
curl -f -sS https://api.gnanacomputech.com/api/v1/health/

# 4. Check RDS Proxy connections
aws rds describe-db-proxies --db-proxy-name gcs-erp-proxy

# 5. Check ElastiCache Redis
aws elasticache describe-cache-clusters --cache-cluster-id gcs-erp-redis

# 6. Verify S3 bucket
aws s3 ls s3://gcs-erp-certificates-production/
```

## 7. Environment Variables Reference

### 7.1 Required (via Secrets Manager / ECS task env)

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Generated securely |
| `DATABASE_URL` | RDS Proxy endpoint | `postgresql://user:pass@proxy-endpoint:5432/db` |
| `REDIS_URL` | ElastiCache endpoint | `redis://endpoint:6379/0` |
| `AWS_STORAGE_BUCKET_NAME` | S3 bucket name | `gcs-erp-certificates-production` |
| `AWS_S3_REGION_NAME` | AWS region | `ap-south-1` |
| `AWS_S3_CUSTOM_DOMAIN` | CloudFront domain (optional) | `d111111abcdef8.cloudfront.net` |
| `ALLOWED_HOSTS` | Allowed hosts | `api.gnanacomputech.com,verify.gnanacomputech.com` |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `https://gnanacomputech.com` |

### 7.2 Optional (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `False` | Debug mode |
| `RDS_PROXY_ENABLED` | `True` | RDS Proxy connection pooling |
| `AWS_USE_IAM_ROLE_FOR_S3` | `True` | Use IAM role for S3 access |
| `USE_SES` | `False` | Use AWS SES for email |
| `MINIMUM_ATTENDANCE_PERCENTAGE` | `75.0` | Minimum attendance for certificates |
| `THROTTLE_USER_RATE` | `1000/hour` | User rate limit |
| `THROTTLE_ANON_RATE` | `100/hour` | Anonymous rate limit |
| `JWT_ACCESS_MINUTES` | `30` | JWT access token lifetime |
| `JWT_REFRESH_DAYS` | `7` | JWT refresh token lifetime |
| `SECURE_HSTS_SECONDS` | `0` | HSTS max-age (set 31536000 in prod) |
| `SECURE_SSL_REDIRECT` | `False` | Redirect HTTP to HTTPS |
| `SENTRY_DSN` | (empty) | Sentry DSN for error tracking |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | Sentry traces sampling |

## 8. Security Configuration

### 8.1 Network Isolation

- **RDS** and **ElastiCache** in private subnets (no public IP)
- **ALB** in public subnets only
- **NAT Gateway** (1 per AZ) for private subnet outbound access
- **Security Groups** scoped to minimum required ports:
  - ALB → ECS API: TCP 8000
  - ECS API → RDS Proxy: TCP 5432
  - ECS API → ElastiCache: TCP 6379
  - ECS Worker → RDS Proxy: TCP 5432
  - ECS Worker → ElastiCache: TCP 6379

### 8.2 IAM Roles

ECS task role (scoped to S3, Secrets Manager):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::gcs-erp-certificates-production/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:region:account:secret:gcs-erp/*"
    }
  ]
}
```

### 8.3 Security Headers

All responses include:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 9. Backup & Recovery

### 9.1 Backup Strategy

| Backup Type | Schedule | Retention | Verification |
|-------------|----------|-----------|--------------|
| RDS Automated Snapshots | Daily | 35 days | Multi-AZ failover test |
| RDS Manual Snapshots | Pre-deploy | Until manual delete | Restore drill |
| `pg_dump` to S3 | Daily (scripted) | 30 days | Periodic restore drill |
| S3 Versioning | On upload | Until manual delete | Lifecycle rules |

### 9.2 Backup Script

```bash
#!/bin/bash
# scripts/backup_db_to_r2.sh
# Scheduled via ECS Fargate task or EventBridge rule
set -e

BUCKET="gcs-erp-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DUMP_FILE="gcs_erp_dump_${DATE}.sql"
ENCRYPTION_KEY=${BACKUP_ENCRYPTION_KEY}

# Run pg_dump
pg_dump "$DATABASE_URL" > /tmp/${DUMP_FILE}

# Encrypt with AES-256-CBC
openssl enc -aes-256-cbc -salt -in /tmp/${DUMP_FILE} -out /tmp/${DUMP_FILE}.enc -pass pass:${ENCRYPTION_KEY}

# Upload to S3 with versioning
aws s3 cp /tmp/${DUMP_FILE}.enc s3://${BUCKET}/daily/${DUMP_FILE}.enc

# Clean up
rm /tmp/${DUMP_FILE} /tmp/${DUMP_FILE}.enc

echo "Backup complete: ${DUMP_FILE}.enc"
```

### 9.3 Recovery Procedure

```bash
# 1. Download latest backup
aws s3 cp s3://gcs-erp-backups/daily/gcs_erp_dump_2026-09-09_12-00-00.sql.enc /tmp/restore.sql.enc

# 2. Decrypt
openssl enc -aes-256-cbc -d -in /tmp/restore.sql.enc -out /tmp/restore.sql -pass pass:${ENCRYPTION_KEY}

# 3. Restore to a temporary RDS instance
psql postgresql://user:pass@temp-rds-endpoint:5432/gcs_erp_restore < /tmp/restore.sql

# 4. Verify data integrity
psql postgresql://user:pass@temp-rds-endpoint:5432/gcs_erp_restore -c "SELECT count(*) FROM core_student;"

# 5. Promote temp instance or restore to primary
```

## 10. Monitoring & Alerting

### 10.1 CloudWatch Alarms

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU utilization (ECS tasks) | > 80% for 5 min | Scale out or page on-call |
| Memory utilization | > 85% for 5 min | Scale up task size |
| 5xx error rate (ALB) | > 1% for 2 min | Page on-call |
| RDS CPU | > 80% for 5 min | Scale up instance |
| RDS connections | > 80% of max | Page on-call |
| ElastiCache CPU | > 80% for 5 min | Scale up cluster |
| S3 bucket size | > 90% of quota | Alert admin |
| Celery queue depth | > 100 for 5 min | Scale workers |

### 10.2 SNS Notifications

Configure SNS topics for alarms:
- **DevOps Pager**: For critical alarms (5xx rate, DB down, worker dead)
- **Team Slack**: For non-critical alarms (CPU high, backup success/failure)
- **Email**: For backup completion, certificate issuance reports

### 10.3 Sentry Integration

- Error tracking for both frontend and backend
- Traces sampling: 10% in production
- Release tracking via `GIT_COMMIT_SHA`
- Environment: `production` for prod, `staging` for staging

## 11. Cost Estimate

| Service | Instance | Monthly Cost |
|---------|----------|--------------|
| ECS Fargate (API) | 2 tasks × 0.5 vCPU / 1 GB | ~$40–60 |
| ECS Fargate (Worker) | 1 task × 0.25 vCPU / 512 MB | ~$10–15 |
| ECS Fargate (Beat) | 1 task × 0.25 vCPU / 256 MB | ~$5–8 |
| RDS PostgreSQL Multi-AZ | `db.t4g.small` | ~$50–70 |
| RDS Proxy | Shared | ~$15–25 |
| ElastiCache Redis | `cache.t4g.micro` | ~$15–20 |
| S3 Storage | 50 GB standard | ~$1–2 |
| CloudFront | 100 GB transfer | ~$8–15 |
| ALB | 1 load balancer | ~$16–22 |
| NAT Gateway | 2 (one per AZ) | ~$60–80 |
| **Total** | | **~$220–315/month** |

*Cost estimate for ap-south-1 (Mumbai) region, September 2026 pricing.*

## 12. Migration from Render/Supabase to AWS

Render and Supabase configs have been removed from this repo; `infra/aws/`
(Terraform) is now the single way this infrastructure gets built — see
`infra/aws/README.md`. Everything below except the data dump/restore itself
(RDS Multi-AZ, ElastiCache, S3, IAM roles, ALB+ACM, CloudFront, Route53, WAF,
CloudWatch alarms, Secrets Manager, RDS Proxy, autoscaling) is now a single
`terraform apply` — this section is kept as historical reference for anyone
migrating a Supabase database with live data into the new RDS instance.

### 12.1 Pre-Migration Checklist

- [ ] Export all data from Supabase PostgreSQL
- [ ] `terraform apply` in `infra/aws/` — provisions RDS (Multi-AZ), RDS Proxy,
      ElastiCache (Multi-AZ), S3 (media + frontend), IAM roles, ALB, ECS
      cluster/services (api/worker/beat + autoscaling), WAF, CloudWatch alarms,
      and Secrets Manager in one pass
- [ ] Import data to RDS
- [ ] Set `domain_name` + re-apply once the domain is ready — adds ACM,
      Route 53, and the HTTPS listener/CloudFront alias automatically

### 12.2 Migration Steps

```bash
# 1. Dump Supabase data
pg_dump --host=db.tpndrlirvmknywmfyukz.supabase.co --port=5432 \
  --username=postgres --dbname=postgres --no-owner --no-privileges \
  --format=custom > gcs_erp_dump.custom

# 2. Restore to RDS
pg_restore --host=gcs-erp-rds-endpoint --port=5432 \
  --username=gcs_admin --dbname=gcs_erp_production --no-owner \
  gcs_erp_dump.custom

# 3. Update DATABASE_URL in Secrets Manager
aws secretsmanager update-secret --secret-id gcs-erp/prod/database \
  --secret-string '{"username":"gcs_admin","password":"new_password","host":"rds-proxy-endpoint","port":5432,"dbname":"gcs_erp_production"}'

# 4. Deploy to AWS ECS
# Use GitHub Actions deploy-production.yml workflow

# 5. Verify
curl -f -sS https://api.gnanacomputech.com/api/v1/health/
```

### 12.3 Post-Migration

- [ ] Verify all endpoints respond correctly
- [ ] Verify certificate QR verification endpoint
- [ ] Verify file uploads go to S3
- [ ] Verify Celery tasks run on workers
- [ ] Verify CloudWatch alarms are firing
- [ ] Verify SNS notifications reach on-call
- [ ] Run `pg_dump` restore drill
- [ ] Run RDS failover test
- [ ] Update DNS to CloudFront distribution

## 13. Troubleshooting

### 13.1 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `502 Bad Gateway` | ALB health check failing | Check security groups, target group health |
| `504 Gateway Timeout` | Worker overloaded | Scale worker tasks, check Celery queue |
| `DatabaseConnectionError` | RDS Proxy max connections | Increase proxy max connections, check connection pooling |
| `S3 Access Denied` | IAM role missing S3 permissions | Add S3 PutObject/GetObject to task role |
| `Redis Connection Refused` | ElastiCache security group | Allow ECS tasks on port 6379 |
| `Certificate generation failed` | S3 upload permissions | Check S3 bucket policy, IAM role |
| `Migrations pending` | Deploy didn't run migrations | Run one-off ECS task with `migrate` |

### 13.2 Log Access

```bash
# CloudWatch logs
aws logs tail /ecs/gcs-erp-api --follow

# ECS task logs
aws ecs execute-command --cluster gcs-erp-production-cluster \
  --task <task-id> --container gcs-erp-api --command "/bin/sh"

# RDS logs
aws rds describe-db-log-files --db-instance-identifier gcs-erp-rds
```

---

**Document Version**: 1.0.0
**Last Updated**: 2026-09-09
**Author**: GCS ERP Architecture Team
**Status**: Draft — requires review before go-live
