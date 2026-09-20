variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "gcs-erp"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "container_image" {
  description = "ECR image URI and tag for the API container."
  type        = string
}

variable "allowed_hosts" {
  type    = string
  default = "localhost,127.0.0.1"
}

variable "cors_allowed_origins" {
  type    = string
  default = ""
}

variable "frontend_url" {
  type    = string
  default = ""
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.small"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "domain_name" {
  description = <<-EOT
    Root production domain (e.g. "gnanacomputech.com"). Leave empty to deploy
    without a custom domain: the ALB stays HTTP-only, no ACM certs or Route53
    records are created, and the frontend is served from CloudFront's default
    *.cloudfront.net domain. Set this (and re-apply) once the domain is ready
    to add HTTPS end-to-end.
  EOT
  type        = string
  default     = ""
}

variable "manage_dns" {
  description = "If true (and domain_name is set), Terraform creates a Route53 public hosted zone for domain_name and manages api./verify./root records in it. Set false if DNS is managed outside Terraform — point those records at the outputs manually."
  type        = bool
  default     = true
}

variable "api_subdomain" {
  description = "Subdomain the API/ALB is served on, e.g. \"api\" -> api.<domain_name>."
  type        = string
  default     = "api"
}

variable "alert_email" {
  description = "Email address subscribed to the SNS topic CloudWatch alarms publish to (CPU, 5xx rate, unhealthy targets, RDS storage). Leave empty to create the topic without a subscriber — alarms will fire but page nobody until you add one."
  type        = string
  default     = ""
}

variable "worker_cpu" {
  description = "Fargate CPU units for the Celery worker task."
  type        = number
  default     = 512
}

variable "worker_memory" {
  description = "Fargate memory (MiB) for the Celery worker task."
  type        = number
  default     = 1024
}

variable "beat_cpu" {
  description = "Fargate CPU units for the Celery beat task."
  type        = number
  default     = 256
}

variable "beat_memory" {
  description = "Fargate memory (MiB) for the Celery beat task."
  type        = number
  default     = 512
}

variable "waf_rate_limit_per_5min" {
  description = "Max requests from a single IP per 5-minute window before WAF blocks it (applied on both the CloudFront and ALB web ACLs)."
  type        = number
  default     = 2000
}