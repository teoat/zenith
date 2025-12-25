# Global CDN and Edge Computing Configuration

# CloudFront Functions for edge processing
resource "aws_cloudfront_function" "security_headers" {
  name    = "378x492-security-headers"
  runtime = "cloudfront-js-2.0"
  comment = "Add security headers to all responses"
  publish = true
  code    = file("${path.module}/functions/security-headers.js")
}

resource "aws_cloudfront_function" "geo_redirect" {
  name    = "378x492-geo-redirect"
  runtime = "cloudfront-js-2.0"
  comment = "Redirect users based on geolocation"
  publish = true
  code    = file("${path.module}/functions/geo-redirect.js")
}

resource "aws_cloudfront_function" "bot_protection" {
  name    = "378x492-bot-protection"
  runtime = "cloudfront-js-2.0"
  comment = "Basic bot protection at edge"
  publish = true
  code    = file("${path.module}/functions/bot-protection.js")
}

# CloudFront Distribution with edge functions
resource "aws_cloudfront_distribution" "enhanced_frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Enhanced 378x492 Frontend with Edge Computing"
  default_root_object = "index.html"
  price_class         = "PriceClass_All" # Global distribution

  # Origin configurations
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  # API Gateway origins for different regions
  origin {
    domain_name = aws_lb.us_alb.dns_name
    origin_id   = "API-US"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = aws_lb.eu_alb.dns_name
    origin_id   = "API-EU"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name = aws_lb.asia_alb.dns_name
    origin_id   = "API-ASIA"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default cache behavior with edge functions
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-frontend"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }

    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.security_headers.arn
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400

    # Geo-based routing
    lambda_function_association {
      event_type   = "origin-request"
      lambda_arn   = aws_lambda_function.geo_routing.qualified_arn
      include_body = false
    }
  }

  # API routing behaviors
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "API-US"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.bot_protection.arn
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    # Dynamic origin selection based on geography
    lambda_function_association {
      event_type   = "origin-request"
      lambda_arn   = aws_lambda_function.api_routing.qualified_arn
      include_body = true
    }
  }

  # Static asset optimization
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-frontend"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400
    default_ttl            = 604800
    max_ttl                = 31536000

    compress = true
  }

  # Geographic restrictions (block known malicious regions)
  restrictions {
    geo_restriction {
      restriction_type = "none"
      # Can be configured to whitelist specific countries
    }
  }

  # SSL/TLS configuration
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.global.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Custom error pages
  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 500
    response_code      = 500
    response_page_path = "/500.html"
  }

  # WAF integration for additional security
  web_acl_id = aws_wafv2_web_acl.global.arn

  # Logging configuration
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  tags = {
    Project     = "378x492"
    Environment = "production"
    Component   = "CDN"
  }
}

# Lambda@Edge functions for intelligent routing
resource "aws_lambda_function" "geo_routing" {
  function_name = "378x492-geo-routing"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_edge.arn

  filename         = data.archive_file.geo_routing.output_path
  source_code_hash = data.archive_file.geo_routing.output_base64sha256

  publish = true

  tags = {
    Project     = "378x492"
    Environment = "production"
    Component   = "Edge-Computing"
  }
}

resource "aws_lambda_function" "api_routing" {
  function_name = "378x492-api-routing"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_edge.arn

  filename         = data.archive_file.api_routing.output_path
  source_code_hash = data.archive_file.api_routing.output_base64sha256

  publish = true

  tags = {
    Project     = "378x492"
    Environment = "production"
    Component   = "Edge-Computing"
  }
}

# WAF Web ACL for global security
resource "aws_wafv2_web_acl" "global" {
  name  = "378x492-global-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting
  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # SQL injection protection
  rule {
    name     = "sql-injection-protection"
    priority = 2

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesSQLiRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "sql-injection-protection"
      sampled_requests_enabled   = true
    }
  }

  # XSS protection
  rule {
    name     = "xss-protection"
    priority = 3

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesXSSRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "xss-protection"
      sampled_requests_enabled   = true
    }
  }

  # Bot protection
  rule {
    name     = "bot-protection"
    priority = 4

    action {
      block {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesBotControlRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "bot-protection"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "global-waf"
    sampled_requests_enabled   = true
  }
}

# ACM Certificate for global domain
resource "aws_acm_certificate" "global" {
  domain_name       = "fraud-detection-378x492.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.fraud-detection-378x492.com"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Project     = "378x492"
    Environment = "production"
    Component   = "SSL"
  }
}

# S3 bucket for logs
resource "aws_s3_bucket" "logs" {
  bucket = "378x492-cdn-logs"

  tags = {
    Project     = "378x492"
    Environment = "production"
    Component   = "Logging"
  }
}

# IAM role for Lambda@Edge
resource "aws_iam_role" "lambda_edge" {
  name = "378x492-lambda-edge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "edgelambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = "378x492"
    Environment = "production"
    Component   = "Edge-Computing"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_edge_basic" {
  role       = aws_iam_role.lambda_edge.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Archive files for Lambda functions (would contain actual implementation)
data "archive_file" "geo_routing" {
  type        = "zip"
  output_path = "${path.module}/functions/geo-routing.zip"
  source {
    content  = "// Geo-routing Lambda@Edge function implementation"
    filename = "index.js"
  }
}

data "archive_file" "api_routing" {
  type        = "zip"
  output_path = "${path.module}/functions/api-routing.zip"
  source {
    content  = "// API routing Lambda@Edge function implementation"
    filename = "index.js"
  }
}