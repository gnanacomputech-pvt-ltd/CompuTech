# Celery worker + beat as their own ECS Fargate services (Section 7 of the
# spec): background load never competes with the API's request-handling
# capacity, and each scales independently. Neither sits behind the ALB —
# they have no HTTP surface, just a queue connection.
#
# Note: these share the api container image (var.container_image) and only
# override `command`, same as docker/docker-compose.yml does locally.

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${local.name}/worker"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "beat" {
  name              = "/ecs/${local.name}/beat"
  retention_in_days = 30
  tags              = local.tags
}

resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.name}-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions = jsonencode([{
    name        = "worker"
    image       = var.container_image
    essential   = true
    command     = ["celery", "-A", "config", "worker", "--loglevel=info", "-c", "2"]
    secrets     = local.container_secrets
    environment = local.container_environment
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.worker.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "worker"
      }
    }
  }])
  tags = local.tags

  lifecycle {
    ignore_changes = [container_definitions]
  }
}

resource "aws_ecs_service" "worker" {
  name            = "${local.name}-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 200

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  tags = local.tags
}

resource "aws_ecs_task_definition" "beat" {
  family                   = "${local.name}-beat"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.beat_cpu
  memory                   = var.beat_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  container_definitions = jsonencode([{
    name        = "beat"
    image       = var.container_image
    essential   = true
    command     = ["celery", "-A", "config", "beat", "--loglevel=info"]
    secrets     = local.container_secrets
    environment = local.container_environment
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.beat.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "beat"
      }
    }
  }])
  tags = local.tags

  lifecycle {
    ignore_changes = [container_definitions]
  }
}

resource "aws_ecs_service" "beat" {
  name            = "${local.name}-beat"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.beat.arn
  # Exactly one beat task, ever — a second one would double-fire every
  # scheduled job (duplicate fee reminders, duplicate attendance recalc).
  desired_count = 1
  launch_type   = "FARGATE"

  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  tags = local.tags
}
