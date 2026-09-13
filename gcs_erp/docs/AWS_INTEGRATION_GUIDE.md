# GCS ERP — AWS Cloud Integration Guide

This guide outlines how to configure, connect, and deploy Gnana Computech Solutions ERP (`gcs_erp`) using Amazon Web Services (AWS).

---

## Architecture Overview

```mermaid
graph TD
    Client[Web & Mobile Browsers] --> CloudFront[Amazon CloudFront CDN]
    CloudFront --> S3Media[Amazon S3 Bucket: Media & Certificates]
    Client --> ALB[AWS Application Load Balancer]
    ALB --> ECS[AWS ECS Fargate / App Runner: Django API]
    ECS --> RDS[(Amazon RDS: PostgreSQL 16)]
    ECS --> ElastiCache[(Amazon ElastiCache: Redis)]
    ECS --> S3Media
    ECS --> SES[Amazon SES: Transactional Emails]
    Celery[Celery Background Workers] --> ElastiCache
    Celery --> RDS
    Celery --> S3Media
```

---

## 1. Amazon S3 (Object Storage for Media & Certificates)

### 1.1 Bucket Configuration
1. Create an S3 Bucket (e.g., `gcs-erp-certificates-production`) in your chosen region (e.g., `ap-south-1` Mumbai).
2. **Block Public Access**: Keep "Block all public access" **ON** if using pre-signed URLs or CloudFront Origin Access Control (OAC).
3. **CORS Configuration**:
   Add this JSON CORS policy to the S3 bucket permissions:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": [
         "https://gnanacomputech.com",
         "https://verify.gnanacomputech.com",
         "http://localhost:3000"
       ],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

### 1.2 IAM Policy for Django Application
Attach this policy to the ECS Task Role (`gcsErpTaskRole`) or IAM User:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3MediaStorageAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::gcs-erp-certificates-production",
        "arn:aws:s3:::gcs-erp-certificates-production/*"
      ]
    }
  ]
}
```

### 1.3 Environment Variables
```env
AWS_STORAGE_BUCKET_NAME=gcs-erp-certificates-production
AWS_S3_REGION_NAME=ap-south-1
# Optional: Set if not using IAM Task Roles
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
# Optional: CloudFront CDN distribution domain
AWS_S3_CUSTOM_DOMAIN=d111111abcdef8.cloudfront.net
```

---

## 2. Amazon SES (Simple Email Service)

Used for transactional emails: password resets, student registration receipts, and invoice reminders.

### 2.1 Domain & Identity Verification
1. Open the Amazon SES console in your region (`ap-south-1`).
2. Add and verify domain identity `gnanacomputech.com` by adding the generated DKIM CNAME records to DNS.
3. Request production access in SES if your account is currently in the SES Sandbox.

### 2.2 SMTP Credentials / Environment Variables
1. Under **SES -> SMTP Settings**, click **Create SMTP credentials**.
2. Set the variables in `.env`:
```env
USE_SES=True
AWS_SES_REGION_NAME=ap-south-1
AWS_SES_SMTP_USERNAME=AKIA...
AWS_SES_SMTP_PASSWORD=BJalr...
DEFAULT_FROM_EMAIL=noreply@gnanacomputech.com
```

---

## 3. Amazon RDS (PostgreSQL 16)

### 3.1 Provisioning
- Engine: PostgreSQL 16.x
- DB Instance Class: `db.t4g.micro` (Dev/Test) or `db.m6g.large` (Production Multi-AZ)
- Enable automated backups (7–30 days retention).
- In the VPC Security Group, allow inbound port `5432` only from the ECS/App Runner Security Group.

### 3.2 Connection Configuration
```env
DATABASE_URL=postgresql://gcs_admin:your_secure_password@gcs-erp-db.xyz.ap-south-1.rds.amazonaws.com:5432/gcs_erp_production
```

---

## 4. Automated Database Backup to S3

Run automated compressed and encrypted database backups using the built-in Django management command:

```bash
python manage.py backup_db_to_s3 --bucket gcs-erp-certificates-production --prefix database-backups --retention-days 14
```

Or schedule via cron using the helper script:
```bash
./scripts/backup_db_to_s3.sh
```

---

## 5. Deployment Options

### Option A: AWS App Runner (Zero-Ops Container)
1. Use `docker/aws/apprunner.yaml`.
2. Connect your GitHub repository to AWS App Runner.
3. Add secrets via AWS Secrets Manager and specify environment variables.

### Option B: AWS ECS Fargate
1. Build and push Docker image to Amazon ECR:
   ```bash
   aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.ap-south-1.amazonaws.com
   docker build -t gcs-erp-api -f docker/Dockerfile .
   docker tag gcs-erp-api:latest <account_id>.dkr.ecr.ap-south-1.amazonaws.com/gcs-erp-api:latest
   docker push <account_id>.dkr.ecr.ap-south-1.amazonaws.com/gcs-erp-api:latest
   ```
2. Register task definition using `docker/aws/ecs-task-definition.json`.
3. Create ECS Service with ALB targeting health check path `/api/v1/health/`.
