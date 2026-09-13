# AWS backend and database

This Terraform stack provisions the production backend foundation:

- VPC across two Availability Zones with one NAT Gateway per AZ
- Private ECS, RDS PostgreSQL Multi-AZ, and ElastiCache Redis subnets
- Public Application Load Balancer
- ECR repository and ECS Fargate API service with two tasks
- Secrets Manager values generated during `terraform apply`
- Private, versioned S3 bucket for Django media
- CloudWatch logs and ECS container insights

## Deploy

Run from `infra/aws` with AWS credentials already configured:

```powershell
terraform init
terraform apply -var="container_image=PLACEHOLDER"
```

Build and push the API image, then apply with its immutable tag:

```powershell
$repo = terraform output -raw ecr_repository_url
$registry = $repo -replace '/[^/]+$',''
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $registry
docker build -f ../../gcs_erp/docker/Dockerfile -t "$repo:2026-09-09" ../../gcs_erp
docker push "$repo:2026-09-09"
terraform apply -var="container_image=$repo:2026-09-09"
```

Generated database, Django, and Redis secrets are stored in Terraform state and AWS Secrets Manager. Keep state in an encrypted, locked remote backend before team or production use. Never commit state, plans, or `.terraform/`.

The stack starts with an HTTP ALB. Add ACM, Route 53, an HTTPS listener, and an HTTP redirect after the production domain is known.