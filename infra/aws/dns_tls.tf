# HTTPS end-to-end: Route53 hosted zone, ACM certificates (regional for the
# ALB, us-east-1 for CloudFront), DNS validation, and the ALB's 443 listener.
#
# Everything in this file only exists when var.domain_name is set AND
# var.manage_dns is true (the default). Until then the stack still deploys
# and works — the ALB just stays HTTP-only (see the listener in main.tf) and
# CloudFront serves the frontend on its default *.cloudfront.net domain.
# Bring a domain whenever it's ready and re-apply.

locals {
  dns_enabled  = var.domain_name != "" && var.manage_dns
  api_hostname = local.dns_enabled ? "${var.api_subdomain}.${var.domain_name}" : ""
  # The public certificate-verification page (Section 5.3 / 8 of the spec)
  # is served by the same Django app/ALB as the API, just under its own
  # friendly hostname.
  verify_hostname = local.dns_enabled ? "verify.${var.domain_name}" : ""
}

resource "aws_route53_zone" "main" {
  count = local.dns_enabled ? 1 : 0
  name  = var.domain_name
  tags  = local.tags
}

# ---------------------------------------------------------------------------
# Regional ACM cert for the ALB (api.<domain>, verify.<domain>)
# ---------------------------------------------------------------------------

resource "aws_acm_certificate" "api" {
  count                     = local.dns_enabled ? 1 : 0
  domain_name               = local.api_hostname
  subject_alternative_names = [local.verify_hostname]
  validation_method         = "DNS"
  tags                      = local.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "api_cert_validation" {
  for_each = local.dns_enabled ? {
    for dvo in aws_acm_certificate.api[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id         = aws_route53_zone.main[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "api" {
  count                   = local.dns_enabled ? 1 : 0
  certificate_arn         = aws_acm_certificate.api[0].arn
  validation_record_fqdns = [for r in aws_route53_record.api_cert_validation : r.fqdn]
}

# ---------------------------------------------------------------------------
# us-east-1 ACM cert for the CloudFront frontend distribution
# ---------------------------------------------------------------------------

resource "aws_acm_certificate" "frontend" {
  count                     = local.dns_enabled ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"
  tags                      = local.tags

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "frontend_cert_validation" {
  for_each = local.dns_enabled ? {
    for dvo in aws_acm_certificate.frontend[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id         = aws_route53_zone.main[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "frontend" {
  count                   = local.dns_enabled ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.frontend[0].arn
  validation_record_fqdns = [for r in aws_route53_record.frontend_cert_validation : r.fqdn]
}

# ---------------------------------------------------------------------------
# ALB HTTPS listener — api./verify. both forward to the same API target
# group; Django's ALLOWED_HOSTS/CORS already need both hostnames (see
# terraform.tfvars.example).
# ---------------------------------------------------------------------------

resource "aws_lb_listener" "https" {
  count             = local.dns_enabled ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.api[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_route53_record" "api" {
  count   = local.dns_enabled ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = local.api_hostname
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "verify" {
  count   = local.dns_enabled ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = local.verify_hostname
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Root domain + www -> CloudFront (cdn.tf)
resource "aws_route53_record" "frontend_apex" {
  count   = local.dns_enabled ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "frontend_www" {
  count   = local.dns_enabled ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
