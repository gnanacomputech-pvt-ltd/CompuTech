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