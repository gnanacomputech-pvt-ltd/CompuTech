# RDS Proxy sits between RDS and the API/worker/beat ECS tasks so all three
# pool through one bounded set of DB connections instead of each holding its
# own — Section 9 of the spec calls this out as the fix for exhausting
# Postgres's max_connections once all task types are running.

# RDS Proxy authenticates to Secrets Manager via IAM, and requires the
# target secret in the {username, password} shape below — separate from
# aws_secretsmanager_secret.app (main.tf), which stores the app's combined
# DATABASE_URL/SECRET_KEY/REDIS_URL for ECS task injection instead.
resource "aws_secretsmanager_secret" "db_proxy_auth" {
  name                    = "${local.name}/rds-proxy-auth"
  recovery_window_in_days = 7
  tags                    = local.tags
}

resource "aws_secretsmanager_secret_version" "db_proxy_auth" {
  secret_id = aws_secretsmanager_secret.db_proxy_auth.id
  secret_string = jsonencode({
    username = "gcs_admin"
    password = random_password.database.result
  })
}

resource "aws_iam_role" "rds_proxy" {
  name = "${local.name}-rds-proxy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "rds.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.tags
}

resource "aws_iam_role_policy" "rds_proxy_secret" {
  role = aws_iam_role.rds_proxy.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.db_proxy_auth.arn
    }]
  })
}

resource "aws_security_group" "rds_proxy" {
  name   = "${local.name}-rds-proxy"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

# RDS itself only needs to trust the proxy's ENIs now — the app never talks
# to it directly (DATABASE_URL in main.tf points at the proxy endpoint).
resource "aws_security_group_rule" "database_from_proxy" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.database.id
  source_security_group_id = aws_security_group.rds_proxy.id
}

resource "aws_db_proxy" "main" {
  name                   = "${local.name}-proxy"
  engine_family          = "POSTGRESQL"
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = aws_subnet.private[*].id
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]
  require_tls            = true
  idle_client_timeout    = 1800

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.db_proxy_auth.arn
  }

  tags = local.tags
}

resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    max_connections_percent      = 90
    max_idle_connections_percent = 50
    connection_borrow_timeout    = 120
  }
}

resource "aws_db_proxy_target" "main" {
  db_proxy_name          = aws_db_proxy.main.name
  target_group_name      = aws_db_proxy_default_target_group.main.name
  db_instance_identifier = aws_db_instance.main.identifier
}
