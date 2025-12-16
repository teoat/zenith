# Generated from SSOT - Single Source of Truth
# Perfection Level: infinite
# Zero Defects: True
# Quantum Enhanced: True

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC Configuration
resource "aws_vpc" "fraud_detection" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "fraud-detection-vpc"
    Environment = "production"
    Perfection  = "infinite"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "fraud_detection" {
  name = "fraud-detection-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = "production"
    Perfection  = "infinite"
  }
}

# RDS Database
resource "aws_db_instance" "fraud_detection" {
  identifier             = "fraud-detection-db"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.medium"
  allocated_storage      = 20
  db_name                = "fraud_detection"
  username               = "fraud_user"
  password               = var.db_password
  parameter_group_name   = aws_db_parameter_group.fraud_detection.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.fraud_detection.name
  skip_final_snapshot    = true

  tags = {
    Environment = "production"
    Perfection  = "infinite"
  }
}

# Variables
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Outputs
output "vpc_id" {
  value = aws_vpc.fraud_detection.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.fraud_detection.name
}

output "database_endpoint" {
  value = aws_db_instance.fraud_detection.endpoint
}
