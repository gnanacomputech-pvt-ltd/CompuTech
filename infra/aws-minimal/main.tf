# ---------------------------------------------------------------------------
# Minimal single-instance deployment for GCS ERP.
#
# One EC2 instance runs the whole stack via Docker Compose (Django/Gunicorn,
# Postgres, Redis, Celery, Nginx serving both the API and the built React
# frontend). This is deliberately NOT the full HA architecture described in
# GCS_ERP_Architecture_v4_AWS_HA.md (no Multi-AZ RDS, no ALB, no ECS Fargate,
# no CloudFront) — that setup costs real money to run (NAT Gateways, RDS
# Multi-AZ, ALB, ElastiCache easily exceed $150/month). This is for demos,
# testing, and showing the app live cheaply; see infra/aws/ for the
# production-grade version if real traffic is expected.
# ---------------------------------------------------------------------------

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_security_group" "app" {
  name        = "${var.project_name}-sg"
  description = "GCS ERP minimal deployment - SSH from admin IP, HTTP/HTTPS from anyone"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH from admin"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (for later, once a domain + cert is set up)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-sg" }
}

resource "aws_key_pair" "deploy" {
  key_name   = "${var.project_name}-deploy-key"
  public_key = file(var.public_key_path)
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deploy.key_name
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ssm.name

  root_block_device {
    volume_size = 30 # GB — the current AL2023 AMI's snapshot requires >= 30GB
    volume_type = "gp3"
  }

  user_data = file("${path.module}/user_data.sh")

  tags = { Name = "${var.project_name}-app" }
}

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
  tags     = { Name = "${var.project_name}-eip" }
}
