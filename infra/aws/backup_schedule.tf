# Runs scripts/backup_db_to_s3.sh nightly as a one-off Fargate task via
# EventBridge Scheduler. RDS Multi-AZ automated snapshots (main.tf) are the
# primary recovery path; this is the independent, scripted second copy
# Section 9 of the spec calls for.

resource "aws_cloudwatch_log_group" "backup" {
  name              = "/ecs/${local.name}/backup"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_ecs_task_definition" "backup" {
  family                   = "${local.name}-backup"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions = jsonencode([{
    name      = "backup"
    image     = var.container_image
    essential = true
    command   = ["bash", "scripts/backup_db_to_s3.sh"]
    secrets   = local.container_secrets
    environment = concat(local.container_environment, [
      { name = "DB_BACKUP_BUCKET_NAME", value = aws_s3_bucket.backups.bucket },
      { name = "RETENTION_DAYS", value = "30" },
    ])
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.backup.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "backup"
      }
    }
  }])
  tags = local.tags

  lifecycle {
    ignore_changes = [container_definitions]
  }
}

resource "aws_iam_role" "backup_scheduler" {
  name = "${local.name}-backup-scheduler"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.tags
}

resource "aws_iam_role_policy" "backup_scheduler_run_task" {
  role = aws_iam_role.backup_scheduler.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecs:RunTask"]
        Resource = "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task-definition/${aws_ecs_task_definition.backup.family}:*"
        Condition = {
          ArnLike = { "ecs:cluster" = aws_ecs_cluster.main.arn }
        }
      },
      {
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = [aws_iam_role.ecs_execution.arn, aws_iam_role.ecs_task.arn]
      },
    ]
  })
}

resource "aws_scheduler_schedule" "nightly_backup" {
  name                = "${local.name}-nightly-backup"
  schedule_expression = "cron(0 20 * * ? *)" # 20:00 UTC = 01:30 IST — off-peak
  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.main.arn
    role_arn = aws_iam_role.backup_scheduler.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.backup.arn
      launch_type         = "FARGATE"
      network_configuration {
        subnets          = aws_subnet.private[*].id
        security_groups  = [aws_security_group.ecs.id]
        assign_public_ip = false
      }
    }
  }
}
