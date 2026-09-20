# CloudWatch alarms that actually page someone (Section 10.1's explicit ask:
# "confirm the CloudWatch alarms reach a real person, not just a log group
# nobody watches"), wired to a single SNS topic. Add a Slack/PagerDuty
# subscription to the same topic for anything beyond email.

resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
  tags = local.tags
}

resource "aws_sns_topic_subscription" "alerts_email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---------------------------------------------------------------------------
# ALB / API
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "More than 10 upstream 5xx responses in a minute, twice in a row — fee/certificate flows may be failing."
  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  ok_actions         = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "${local.name}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "At least one API task is failing its ALB health check."
  dimensions = {
    TargetGroup  = aws_lb_target_group.api.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  ok_actions         = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}

resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "${local.name}-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "API service CPU pinned above 85% for 3 minutes straight — autoscaling should be handling this; alarms if it's maxed at 6 tasks and still climbing."
  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.api.name
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}

# ---------------------------------------------------------------------------
# RDS
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${local.name}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "RDS CPU above 85% for 3 minutes — check for a runaway query or plan the next instance-class step up."
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage_low" {
  alarm_name          = "${local.name}-rds-free-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5 * 1024 * 1024 * 1024 # 5 GiB
  alarm_description   = "RDS free storage under 5 GiB — storage autoscaling caps at 200 GB (main.tf); don't let this page you for the first time at 0 bytes."
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${local.name}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Direct RDS connection count climbing despite RDS Proxy being the only intended path in — something may be bypassing the proxy."
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}

# ---------------------------------------------------------------------------
# ElastiCache (Celery broker — a stalled broker silently backs up every
# background job: certificate PDFs, fee reminders, attendance recalc)
# ---------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  alarm_name          = "${local.name}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "EngineCPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ElastiCache engine CPU above 85% for 3 minutes."
  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.replication_group_id
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}

resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  alarm_name          = "${local.name}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = 85
  alarm_description   = "ElastiCache memory above 85% — Celery broker queue or cache eviction risk."
  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.replication_group_id
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"
  tags               = local.tags
}
