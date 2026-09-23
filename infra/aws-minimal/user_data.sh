#!/bin/bash
# Bootstraps Docker + Compose on a fresh Amazon Linux 2023 instance.
# The actual app code and docker-compose.yml are pushed separately via
# rsync/scp after the instance is up (see infra/aws-minimal/deploy.sh) —
# keeping this script minimal means we never have to re-provision the
# instance just to change app code.
set -euxo pipefail

dnf update -y
dnf install -y docker git

systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# SSM agent isn't pre-started on this AMI variant — install/enable it
# explicitly so Session Manager works without needing direct SSH (this
# deployer's network can't reach the instance's public IP on any port).
# Fall back to AWS's official RPM if the dnf repo package isn't found.
dnf install -y amazon-ssm-agent || \
  dnf install -y "https://s3.ap-south-1.amazonaws.com/amazon-ssm-ap-south-1/latest/linux_amd64/amazon-ssm-agent.rpm"
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Docker Compose v2 + Buildx plugins (AL2023's docker package doesn't bundle
# either, and `docker compose build` requires a buildx new enough that the
# repo package is usually behind — pin a known-good buildx version rather
# than "latest" since its release filenames embed the version).
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

curl -SL "https://github.com/docker/buildx/releases/download/v0.37.1/buildx-v0.37.1.linux-amd64" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

mkdir -p /opt/gcs-erp
chown ec2-user:ec2-user /opt/gcs-erp
