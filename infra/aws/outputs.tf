output "ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "api_load_balancer_url" {
  value = "http://${aws_lb.main.dns_name}"
}

output "application_secret_arn" {
  value     = aws_secretsmanager_secret.app.arn
  sensitive = true
}

output "media_bucket_name" {
  value = aws_s3_bucket.media.bucket
}

output "rds_endpoint" {
  value     = aws_db_instance.main.address
  sensitive = true
}

output "rds_instance_identifier" {
  description = "Set as the RDS_INSTANCE_ID GitHub Actions secret (only used by the optional pre-go-live failover test run)."
  value       = aws_db_instance.main.identifier
}

output "rds_proxy_endpoint" {
  description = "What DATABASE_URL actually points at — the app/worker/beat never talk to RDS directly."
  value       = aws_db_proxy.main.endpoint
  sensitive   = true
}

output "api_url" {
  description = "Public URL for the API — HTTPS once domain_name+manage_dns are set, plain HTTP (ALB DNS name) until then."
  value       = local.dns_enabled ? "https://${local.api_hostname}" : "http://${aws_lb.main.dns_name}"
}

output "frontend_bucket_name" {
  description = "S3 bucket the frontend build (dist/) deploys to."
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "Needed for the frontend deploy workflow's cache invalidation after each release."
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "Frontend URL when no custom domain is configured yet (*.cloudfront.net)."
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "route53_name_servers" {
  description = "Set these as the NS records at your domain registrar to delegate DNS to this Route53 zone. Empty until domain_name + manage_dns are set."
  value       = local.dns_enabled ? aws_route53_zone.main[0].name_servers : []
}

output "sns_alerts_topic_arn" {
  description = "Subscribe Slack/PagerDuty/etc. here in addition to (or instead of) var.alert_email."
  value       = aws_sns_topic.alerts.arn
}

output "waf_alb_web_acl_arn" {
  value = aws_wafv2_web_acl.alb.arn
}

output "rds_proxy_auth_secret_arn" {
  value     = aws_secretsmanager_secret.db_proxy_auth.arn
  sensitive = true
}

output "github_actions_role_arn" {
  description = "Set as the AWS_ROLE_ARN GitHub Actions secret — see infra/aws/README.md for the full secrets list."
  value       = aws_iam_role.github_actions.arn
}

output "backup_bucket_name" {
  description = "Set as the BACKUP_BUCKET_NAME GitHub Actions secret, and as DB_BACKUP_BUCKET_NAME for scripts/backup_db_to_s3.sh."
  value       = aws_s3_bucket.backups.bucket
}