# AWS WAF: rate-based rules + AWS managed baseline rule set, in front of
# both CloudFront (frontend) and the ALB (API, including the unauthenticated
# public certificate-verification endpoint that Section 9 of the spec calls
# out by name as needing rate limiting).

resource "aws_wafv2_web_acl" "cloudfront" {
  provider    = aws.us_east_1
  name        = "${local.name}-cloudfront"
  description = "Rate limiting + baseline managed rules for the frontend CDN"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "rate-limit"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit_per_5min
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-cloudfront-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "aws-common-rule-set"
    priority = 2
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-cloudfront-common"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-cloudfront"
    sampled_requests_enabled   = true
  }

  tags = local.tags
}

resource "aws_wafv2_web_acl" "alb" {
  name        = "${local.name}-alb"
  description = "Rate limiting + baseline managed rules for the API ALB"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "rate-limit"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit_per_5min
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-alb-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # Tighter limit specifically for the unauthenticated public certificate
  # verification path and auth endpoints (Section 9): a much lower ceiling
  # than general API traffic, since these should never see bulk volume from
  # one IP.
  rule {
    name     = "sensitive-endpoints-rate-limit"
    priority = 2
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 300
        aggregate_key_type = "IP"
        scope_down_statement {
          or_statement {
            statement {
              byte_match_statement {
                search_string = "/api/v1/public/"
                field_to_match {
                  uri_path {}
                }
                positional_constraint = "STARTS_WITH"
                text_transformation {
                  priority = 0
                  type     = "NONE"
                }
              }
            }
            statement {
              byte_match_statement {
                search_string = "/api/v1/auth/"
                field_to_match {
                  uri_path {}
                }
                positional_constraint = "STARTS_WITH"
                text_transformation {
                  priority = 0
                  type     = "NONE"
                }
              }
            }
            statement {
              byte_match_statement {
                search_string = "/verify/"
                field_to_match {
                  uri_path {}
                }
                positional_constraint = "STARTS_WITH"
                text_transformation {
                  priority = 0
                  type     = "NONE"
                }
              }
            }
          }
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-alb-sensitive-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "aws-common-rule-set"
    priority = 3
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-alb-common"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-alb"
    sampled_requests_enabled   = true
  }

  tags = local.tags
}

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.alb.arn
}
