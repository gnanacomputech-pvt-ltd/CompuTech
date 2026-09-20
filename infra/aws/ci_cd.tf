# GitHub Actions authenticates to AWS via OIDC (no long-lived access keys in
# GitHub secrets) — .github/workflows/deploy-*.yml already assume this via
# `role-to-assume: secrets.AWS_ROLE_ARN`, but nothing previously created that
# role or the OIDC trust. Without this, every deploy workflow run fails at
# the "Configure AWS credentials" step before it does anything else.

variable "github_repository" {
  description = "GitHub \"owner/repo\" this OIDC role trusts — only workflow runs from this exact repo can assume it."
  type        = string
  default     = "gnanacomputech-pvt-ltd/CompuTech"
}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # GitHub's OIDC root CA thumbprint — the well-known, stable value AWS's
  # own docs use for this provider (GitHub rotates leaf certs, not this root).
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
  tags            = local.tags
}

resource "aws_iam_role" "github_actions" {
  name = "${local.name}-github-actions"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          # Any branch/PR/tag off this repo — narrow further (e.g. ref:refs/heads/main)
          # once the branch protection rules that push to production are settled.
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
        }
      }
    }]
  })
  tags = local.tags
}

# ---------------------------------------------------------------------------
# ECR: build/push the API image
# ---------------------------------------------------------------------------
resource "aws_iam_role_policy" "github_actions_ecr" {
  role = aws_iam_role.github_actions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EcrAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "EcrPushPull"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage", "ecr:PutImage", "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart", "ecr:CompleteLayerUpload",
        ]
        Resource = aws_ecr_repository.api.arn
      },
    ]
  })
}

# ---------------------------------------------------------------------------
# ECS: register a new task definition revision (image bump only — cpu/memory/
# roles/env come from Terraform) and roll api/worker/beat services
# ---------------------------------------------------------------------------
resource "aws_iam_role_policy" "github_actions_ecs" {
  role = aws_iam_role.github_actions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EcsDeploy"
        Effect = "Allow"
        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition", # does not support resource-level scoping
          "ecs:DescribeServices",
          "ecs:UpdateService",
        ]
        Resource = "*"
      },
      {
        # Registering a task definition that references these roles requires
        # the caller to be allowed to pass them.
        Sid      = "PassEcsRoles"
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = [aws_iam_role.ecs_execution.arn, aws_iam_role.ecs_task.arn]
      },
    ]
  })
}

# ---------------------------------------------------------------------------
# Frontend deploy: sync build to S3, invalidate CloudFront
# ---------------------------------------------------------------------------
resource "aws_iam_role_policy" "github_actions_frontend" {
  role = aws_iam_role.github_actions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "FrontendBucketWrite"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
        Resource = [aws_s3_bucket.frontend.arn, "${aws_s3_bucket.frontend.arn}/*"]
      },
      {
        Sid      = "InvalidateCache"
        Effect   = "Allow"
        Action   = ["cloudfront:CreateInvalidation"]
        Resource = aws_cloudfront_distribution.frontend.arn
      },
    ]
  })
}

# ---------------------------------------------------------------------------
# Pre-deploy backup check (deploy-production.yml lists the backup bucket
# before deploying) + optional pre-go-live RDS failover test
# ---------------------------------------------------------------------------
resource "aws_iam_role_policy" "github_actions_ops" {
  role = aws_iam_role.github_actions.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ReadBackups"
        Effect   = "Allow"
        Action   = ["s3:ListBucket", "s3:GetObject"]
        Resource = [aws_s3_bucket.backups.arn, "${aws_s3_bucket.backups.arn}/*"]
      },
      {
        Sid      = "FailoverDrill"
        Effect   = "Allow"
        Action   = ["rds:RebootDBInstance"]
        Resource = "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:db:${aws_db_instance.main.identifier}"
      },
    ]
  })
}

# ---------------------------------------------------------------------------
# Dedicated backup bucket — scripts/backup_db_to_s3.sh's pg_dump exports
# (Section 9: "an independent, verified logical backup"), kept separate from
# the media bucket so a media-bucket misconfiguration can't also expose or
# lose backups. Lifecycle rule mirrors the retention the script defaults to.
# ---------------------------------------------------------------------------
resource "aws_s3_bucket" "backups" {
  bucket        = "${local.name}-${data.aws_caller_identity.current.account_id}-backups"
  force_destroy = false
  tags          = local.tags
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    id     = "expire-old-backups"
    status = "Enabled"
    filter {
      prefix = "database-backups/"
    }
    expiration {
      days = 30
    }
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# ECS tasks (api container runs scripts/backup_db_to_s3.sh manually or via a
# future scheduled task) need write access to actually create backups, not
# just the CI role's read-only check above.
resource "aws_iam_role_policy" "ecs_task_backups" {
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:GetObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.backups.arn, "${aws_s3_bucket.backups.arn}/*"]
    }]
  })
}
