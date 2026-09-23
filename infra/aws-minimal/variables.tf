variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "EC2 instance type — t3.micro (1GB RAM) proved too small for Postgres+Redis+Django+2xCelery+Nginx together (sustained 60-90% CPU, SSM agent unresponsive). t3.small (2GB RAM) is ~$15/month."
  type        = string
  default     = "t3.small"
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH into the instance — set your own IP/32 via terraform.tfvars (gitignored). In practice access is via SSM Session Manager (see ssm.tf), not direct SSH, since this security group rule only matters if you actually connect over port 22."
  type        = string
}

variable "public_key_path" {
  description = "Path to the SSH public key to install on the instance"
  type        = string
  default     = "./gcs-erp-deploy-key.pub"
}

variable "project_name" {
  description = "Name prefix for tagged resources"
  type        = string
  default     = "gcs-erp"
}

variable "deploy_bucket_name" {
  description = "S3 bucket the app deployment bundle is staged in"
  type        = string
  default     = "gcs-erp-deploy-312728688240"
}
