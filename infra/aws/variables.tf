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