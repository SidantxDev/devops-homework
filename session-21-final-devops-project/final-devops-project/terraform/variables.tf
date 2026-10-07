variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "aws_endpoint" {
  description = "LocalStack endpoint (remove for real AWS)"
  type        = string
  default     = "http://localstack:4566"
}

variable "project" {
  type    = string
  default = "s19-demo"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "my_ip_cidr" {
  description = "Your public IP for SSH, e.g. 203.0.113.10/32"
  type        = string
  default     = "203.0.113.10/32"
}

variable "ami_id" {
  description = "AMI to launch (Amazon Linux 2023 in real AWS)"
  type        = string
  default     = "ami-0c55b159cbfafe1f0"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}
