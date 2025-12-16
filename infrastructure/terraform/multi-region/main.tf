# Multi-Region Infrastructure Configuration
# Supports geo-DNS, CDN, and high availability across regions

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket = "378x492-terraform-state"
    key    = "multi-region-infrastructure.tfstate"
    region = "us-east-1"
  }
}

# Provider configurations for multiple regions
provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu-west-1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap-southeast-1"
  region = "ap-southeast-1"
}

provider "cloudflare" {
  # Configure with API token
}

# Global Route 53 configuration for geo-DNS
resource "aws_route53_zone" "main" {
  name = "fraud-detection-378x492.com"
}

# Geo-DNS records for regional endpoints
resource "aws_route53_record" "api_global" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.fraud-detection-378x492.com"
  type    = "A"

  geolocation_routing_policy {
    continent = "EU"
  }

  set_identifier = "EU"
  alias {
    name                   = aws_lb.eu_alb.dns_name
    zone_id                = aws_lb.eu_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_us" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.fraud-detection-378x492.com"
  type    = "A"

  geolocation_routing_policy {
    country_code = "US"
  }

  set_identifier = "US"
  alias {
    name                   = aws_lb.us_alb.dns_name
    zone_id                = aws_lb.us_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "api_asia" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.fraud-detection-378x492.com"
  type    = "A"

  geolocation_routing_policy {
    continent = "AS"
  }

  set_identifier = "ASIA"
  alias {
    name                   = aws_lb.asia_alb.dns_name
    zone_id                = aws_lb.asia_alb.zone_id
    evaluate_target_health = true
  }
}

# CloudFront CDN for global content delivery
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "378x492 Fraud Detection Platform Frontend"
  default_root_object = "index.html"

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

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

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "OAI for 378x492 frontend"
}

# S3 bucket for frontend assets
resource "aws_s3_bucket" "frontend" {
  bucket = "378x492-frontend-assets"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# US East Region Infrastructure
module "us_east_infrastructure" {
  source = "./modules/regional-infrastructure"

  providers = {
    aws = aws.us-east-1
  }

  region          = "us-east-1"
  environment     = "production"
  vpc_cidr        = "10.0.0.0/16"
  az_count        = 3
  instance_count  = 6
  instance_type   = "t3.large"

  tags = {
    Project     = "378x492"
    Environment = "production"
    Region      = "us-east"
  }
}

# EU West Region Infrastructure
module "eu_west_infrastructure" {
  source = "./modules/regional-infrastructure"

  providers = {
    aws = aws.eu-west-1
  }

  region          = "eu-west-1"
  environment     = "production"
  vpc_cidr        = "10.1.0.0/16"
  az_count        = 3
  instance_count  = 4
  instance_type   = "t3.large"

  tags = {
    Project     = "378x492"
    Environment = "production"
    Region      = "eu-west"
  }
}

# Asia Pacific Region Infrastructure
module "asia_pacific_infrastructure" {
  source = "./modules/regional-infrastructure"

  providers = {
    aws = aws.ap-southeast-1
  }

  region          = "ap-southeast-1"
  environment     = "production"
  vpc_cidr        = "10.2.0.0/16"
  az_count        = 3
  instance_count  = 4
  instance_type   = "t3.large"

  tags = {
    Project     = "378x492"
    Environment = "production"
    Region      = "asia-pacific"
  }
}

# Global DynamoDB for cross-region data synchronization
resource "aws_dynamodb_table" "global_user_sessions" {
  name         = "378x492-user-sessions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
  stream_enabled   = true

  replica {
    region_name = "eu-west-1"
  }

  replica {
    region_name = "ap-southeast-1"
  }
}

# Global CloudWatch for monitoring
resource "aws_cloudwatch_dashboard" "global" {
  dashboard_name = "378x492-Global-Overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "378x492-us-east-asg", { "label": "US East CPU" }],
            [".", ".", ".", "378x492-eu-west-asg", { "label": "EU West CPU" }],
            [".", ".", ".", "378x492-asia-pacific-asg", { "label": "Asia Pacific CPU" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Global CPU Utilization"
        }
      }
    ]
  })
}

# Outputs
output "cloudfront_distribution_url" {
  description = "CloudFront distribution URL for frontend"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "us_east_alb_dns" {
  description = "US East ALB DNS name"
  value       = module.us_east_infrastructure.alb_dns_name
}

output "eu_west_alb_dns" {
  description = "EU West ALB DNS name"
  value       = module.eu_west_infrastructure.alb_dns_name
}

output "asia_pacific_alb_dns" {
  description = "Asia Pacific ALB DNS name"
  value       = module.asia_pacific_infrastructure.alb_dns_name
}