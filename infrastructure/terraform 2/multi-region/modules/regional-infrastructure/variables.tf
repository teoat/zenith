variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "az_count" {
  description = "Number of availability zones"
  type        = number
  default     = 3
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 3
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.large"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}