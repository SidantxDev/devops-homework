# Session 19: Cloud & Terraform in Action

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

An end-to-end AWS infrastructure project in Terraform: **VPC → public subnet (+ Internet Gateway and route table) → Security Group → EC2 instance**, plus an **S3 bucket**.

> Applied against **LocalStack** (a local AWS emulator in Docker, no AWS account and no cost). The code is standard AWS Terraform. Removing the dummy keys, `skip_*` and `endpoints` in [provider.tf](provider.tf) makes it target real AWS.

## Architecture

```text
                    Terraform (provider.tf, variables.tf, main.tf, outputs.tf)
                                         │
 ┌───────────────────── VPC 10.0.0.0/16 (aws_vpc.main) ─────────────────────┐
 │   Internet Gateway (aws_internet_gateway.igw) ◄── route 0.0.0.0/0        │
 │   ┌──── Public subnet 10.0.1.0/24, ap-south-1a (aws_subnet.public) ───┐  │
 │   │   Security Group web-sg: 80 from 0.0.0.0/0, 22 from my IP          │  │
 │   │      └── EC2 t3.micro (aws_instance.web) + user_data → nginx       │  │
 │   └───────────────────────────────────────────────────────────────────┘  │
 └──────────────────────────────────────────────────────────────────────────┘
   S3 bucket s19-demo-assets-24bcs10153 (aws_s3_bucket.assets)
```

| Concept | Where |
| --- | --- |
| **Providers** | `provider.tf`: `hashicorp/aws ~> 5.0` |
| **Variables** | `variables.tf`: region, CIDRs, AMI, instance type, my IP |
| **Resources** | `main.tf`: 8 resources |
| **Outputs** | `outputs.tf`: VPC, subnet, SG and instance IDs, public IP, bucket |
| **Dependencies** | **Implicit**, through references: the subnet uses `aws_vpc.main.id` and the instance uses `aws_subnet.public.id` + `aws_security_group.web.id`, so Terraform creates the VPC first and destroys it last (see the dependency graph) |
| **State** | `terraform.tfstate` maps each resource to its real ID (`terraform state list` / `state show`). In a team, use a remote backend (S3 + DynamoDB lock) |

## Terraform commands (real output)

```bash
$ terraform init -no-color
Initializing the backend...

Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
- Installing hashicorp/aws v5.100.0...
- Installed hashicorp/aws v5.100.0 (signed by HashiCorp)

Terraform has created a lock file .terraform.lock.hcl to record the provider
selections it made above. Include this file in your version control repository
so that Terraform can guarantee to make the same selections by default when
you run "terraform init" in the future.

Terraform has been successfully initialized!
$ terraform validate -no-color
Success! The configuration is valid.

$ terraform plan -no-color

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_instance.web will be created
  + resource "aws_instance" "web" {
      + ami                                  = "ami-0c55b159cbfafe1f0"
      + arn                                  = (known after apply)
      + associate_public_ip_address          = (known after apply)
      + availability_zone                    = (known after apply)
      + cpu_core_count                       = (known after apply)
      + cpu_threads_per_core                 = (known after apply)
      + disable_api_stop                     = (known after apply)
      + disable_api_termination              = (known after apply)
      + ebs_optimized                        = (known after apply)
      + enable_primary_ipv6                  = (known after apply)
      + get_password_data                    = false
      + host_id                              = (known after apply)
      + host_resource_group_arn              = (known after apply)
      + iam_instance_profile                 = (known after apply)
      + id                                   = (known after apply)
      + instance_initiated_shutdown_behavior = (known after apply)
      + instance_lifecycle                   = (known after apply)
      + instance_state                       = (known after apply)
      + instance_type                        = "t3.micro"
      + ipv6_address_count                   = (known after apply)
      + ipv6_addresses                       = (known after apply)
      + key_name                             = (known after apply)
      + monitoring                           = (known after apply)
      + outpost_arn                          = (known after apply)
      + password_data                        = (known after apply)
      + placement_group                      = (known after apply)
      + placement_partition_number           = (known after apply)
      + primary_network_interface_id         = (known after apply)
      + private_dns                          = (known after apply)
      + private_ip                           = (known after apply)
      + public_dns                           = (known after apply)
      + public_ip                            = (known after apply)
      + secondary_private_ips                = (known after apply)
      + security_groups                      = (known after apply)
      + source_dest_check                    = true
      + spot_instance_request_id             = (known after apply)
      + subnet_id                            = (known after apply)
      + tags                                 = {
          + "Name" = "s19-demo-web"
        }
      + tags_all                             = {
          + "Name" = "s19-demo-web"
        }
      + tenancy                              = (known after apply)
      + user_data                            = "14ec9722d26e194beaef5a01df2985bc0c59331d"
      + user_data_base64                     = (known after apply)
      + user_data_replace_on_change          = false
      + vpc_security_group_ids               = (known after apply)

      + capacity_reservation_specification (known after apply)

      + cpu_options (known after apply)

      + ebs_block_device (known after apply)

      + enclave_options (known after apply)

      + ephemeral_block_device (known after apply)

      + instance_market_options (known after apply)

      + maintenance_options (known after apply)

      + metadata_options (known after apply)

      + network_interface (known after apply)

      + private_dns_name_options (known after apply)

      + root_block_device (known after apply)
    }

  # aws_internet_gateway.igw will be created
  + resource "aws_internet_gateway" "igw" {
      + arn      = (known after apply)
      + id       = (known after apply)
      + owner_id = (known after apply)
      + tags     = {
          + "Name" = "s19-demo-igw"
        }
      + tags_all = {
          + "Name" = "s19-demo-igw"
        }
      + vpc_id   = (known after apply)
    }

  # aws_route_table.public will be created
  + resource "aws_route_table" "public" {
      + arn              = (known after apply)
      + id               = (known after apply)
      + owner_id         = (known after apply)
      + propagating_vgws = (known after apply)
      + route            = [
          + {
              + cidr_block                 = "0.0.0.0/0"
              + gateway_id                 = (known after apply)
                # (11 unchanged attributes hidden)
            },
        ]
      + tags             = {
          + "Name" = "s19-demo-public-rt"
        }
      + tags_all         = {
          + "Name" = "s19-demo-public-rt"
        }
      + vpc_id           = (known after apply)
    }

  # aws_route_table_association.public will be created
  + resource "aws_route_table_association" "public" {
      + id             = (known after apply)
      + route_table_id = (known after apply)
      + subnet_id      = (known after apply)
    }

  # aws_s3_bucket.assets will be created
  + resource "aws_s3_bucket" "assets" {
      + acceleration_status         = (known after apply)
      + acl                         = (known after apply)
      + arn                         = (known after apply)
      + bucket                      = "s19-demo-assets-24bcs10153"
      + bucket_domain_name          = (known after apply)
      + bucket_prefix               = (known after apply)
      + bucket_regional_domain_name = (known after apply)
      + force_destroy               = false
      + hosted_zone_id              = (known after apply)
      + id                          = (known after apply)
      + object_lock_enabled         = (known after apply)
      + policy                      = (known after apply)
      + region                      = (known after apply)
      + request_payer               = (known after apply)
      + tags                        = {
          + "Name" = "s19-demo-assets"
        }
      + tags_all                    = {
          + "Name" = "s19-demo-assets"
        }
      + website_domain              = (known after apply)
      + website_endpoint            = (known after apply)

      + cors_rule (known after apply)

      + grant (known after apply)

      + lifecycle_rule (known after apply)

      + logging (known after apply)

      + object_lock_configuration (known after apply)

      + replication_configuration (known after apply)

      + server_side_encryption_configuration (known after apply)

      + versioning (known after apply)

      + website (known after apply)
    }

  # aws_security_group.web will be created
  + resource "aws_security_group" "web" {
      + arn                    = (known after apply)
      + description            = "Allow HTTP from anywhere and SSH from my IP"
      + egress                 = [
          + {
              + cidr_blocks      = [
                  + "0.0.0.0/0",
                ]
              + from_port        = 0
              + ipv6_cidr_blocks = []
              + prefix_list_ids  = []
              + protocol         = "-1"
              + security_groups  = []
              + self             = false
              + to_port          = 0
                # (1 unchanged attribute hidden)
            },
        ]
      + id                     = (known after apply)
      + ingress                = [
          + {
              + cidr_blocks      = [
                  + "0.0.0.0/0",
                ]
              + description      = "HTTP"
              + from_port        = 80
              + ipv6_cidr_blocks = []
              + prefix_list_ids  = []
              + protocol         = "tcp"
              + security_groups  = []
              + self             = false
              + to_port          = 80
            },
          + {
              + cidr_blocks      = [
                  + "203.0.113.10/32",
                ]
              + description      = "SSH"
              + from_port        = 22
              + ipv6_cidr_blocks = []
              + prefix_list_ids  = []
              + protocol         = "tcp"
              + security_groups  = []
              + self             = false
              + to_port          = 22
            },
        ]
      + name                   = "s19-demo-web-sg"
      + name_prefix            = (known after apply)
      + owner_id               = (known after apply)
      + revoke_rules_on_delete = false
      + tags                   = {
          + "Name" = "s19-demo-web-sg"
        }
      + tags_all               = {
          + "Name" = "s19-demo-web-sg"
        }
      + vpc_id                 = (known after apply)
    }

  # aws_subnet.public will be created
  + resource "aws_subnet" "public" {
      + arn                                            = (known after apply)
      + assign_ipv6_address_on_creation                = false
      + availability_zone                              = "ap-south-1a"
      + availability_zone_id                           = (known after apply)
      + cidr_block                                     = "10.0.1.0/24"
      + enable_dns64                                   = false
      + enable_resource_name_dns_a_record_on_launch    = false
      + enable_resource_name_dns_aaaa_record_on_launch = false
      + id                                             = (known after apply)
      + ipv6_cidr_block_association_id                 = (known after apply)
      + ipv6_native                                    = false
      + map_public_ip_on_launch                        = true
      + owner_id                                       = (known after apply)
      + private_dns_hostname_type_on_launch            = (known after apply)
      + tags                                           = {
          + "Name" = "s19-demo-public-subnet"
        }
      + tags_all                                       = {
          + "Name" = "s19-demo-public-subnet"
        }
      + vpc_id                                         = (known after apply)
    }

  # aws_vpc.main will be created
  + resource "aws_vpc" "main" {
      + arn                                  = (known after apply)
      + cidr_block                           = "10.0.0.0/16"
      + default_network_acl_id               = (known after apply)
      + default_route_table_id               = (known after apply)
      + default_security_group_id            = (known after apply)
      + dhcp_options_id                      = (known after apply)
      + enable_dns_hostnames                 = true
      + enable_dns_support                   = true
      + enable_network_address_usage_metrics = (known after apply)
      + id                                   = (known after apply)
      + instance_tenancy                     = "default"
      + ipv6_association_id                  = (known after apply)
      + ipv6_cidr_block                      = (known after apply)
      + ipv6_cidr_block_network_border_group = (known after apply)
      + main_route_table_id                  = (known after apply)
      + owner_id                             = (known after apply)
      + tags                                 = {
          + "Name" = "s19-demo-vpc"
        }
      + tags_all                             = {
          + "Name" = "s19-demo-vpc"
        }
    }

Plan: 8 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + bucket_name        = "s19-demo-assets-24bcs10153"
  + instance_id        = (known after apply)
  + instance_public_ip = (known after apply)
  + public_subnet_id   = (known after apply)
  + security_group_id  = (known after apply)
  + vpc_id             = (known after apply)
$ terraform apply -auto-approve -no-color

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_instance.web will be created
  + resource "aws_instance" "web" {
      + ami                                  = "ami-0c55b159cbfafe1f0"
      + arn                                  = (known after apply)
      + associate_public_ip_address          = (known after apply)
      + availability_zone                    = (known after apply)
      + cpu_core_count                       = (known after apply)
      + cpu_threads_per_core                 = (known after apply)
      + disable_api_stop                     = (known after apply)
      + disable_api_termination              = (known after apply)
      + ebs_optimized                        = (known after apply)
      + enable_primary_ipv6                  = (known after apply)
      + get_password_data                    = false
      + host_id                              = (known after apply)
      + host_resource_group_arn              = (known after apply)
      + iam_instance_profile                 = (known after apply)
      + id                                   = (known after apply)
      + instance_initiated_shutdown_behavior = (known after apply)
      + instance_lifecycle                   = (known after apply)
      + instance_state                       = (known after apply)
      + instance_type                        = "t3.micro"
      + ipv6_address_count                   = (known after apply)
      + ipv6_addresses                       = (known after apply)
      + key_name                             = (known after apply)
      + monitoring                           = (known after apply)
      + outpost_arn                          = (known after apply)
      + password_data                        = (known after apply)
      + placement_group                      = (known after apply)
      + placement_partition_number           = (known after apply)
      + primary_network_interface_id         = (known after apply)
      + private_dns                          = (known after apply)
      + private_ip                           = (known after apply)
      + public_dns                           = (known after apply)
      + public_ip                            = (known after apply)
      + secondary_private_ips                = (known after apply)
      + security_groups                      = (known after apply)
      + source_dest_check                    = true
      + spot_instance_request_id             = (known after apply)
      + subnet_id                            = (known after apply)
      + tags                                 = {
          + "Name" = "s19-demo-web"
        }
      + tags_all                             = {
          + "Name" = "s19-demo-web"
        }
      + tenancy                              = (known after apply)
      + user_data                            = "14ec9722d26e194beaef5a01df2985bc0c59331d"
      + user_data_base64                     = (known after apply)
      + user_data_replace_on_change          = false
      + vpc_security_group_ids               = (known after apply)

      + capacity_reservation_specification (known after apply)

      + cpu_options (known after apply)

      + ebs_block_device (known after apply)

      + enclave_options (known after apply)

      + ephemeral_block_device (known after apply)

      + instance_market_options (known after apply)

      + maintenance_options (known after apply)

      + metadata_options (known after apply)

      + network_interface (known after apply)

      + private_dns_name_options (known after apply)

      + root_block_device (known after apply)
    }

  # aws_internet_gateway.igw will be created
  + resource "aws_internet_gateway" "igw" {
      + arn      = (known after apply)
      + id       = (known after apply)
      + owner_id = (known after apply)
      + tags     = {
          + "Name" = "s19-demo-igw"
        }
      + tags_all = {
          + "Name" = "s19-demo-igw"
        }
      + vpc_id   = (known after apply)
    }

  # aws_route_table.public will be created
  + resource "aws_route_table" "public" {
      + arn              = (known after apply)
      + id               = (known after apply)
      + owner_id         = (known after apply)
      + propagating_vgws = (known after apply)
      + route            = [
          + {
              + cidr_block                 = "0.0.0.0/0"
              + gateway_id                 = (known after apply)
                # (11 unchanged attributes hidden)
            },
        ]
      + tags             = {
          + "Name" = "s19-demo-public-rt"
        }
      + tags_all         = {
          + "Name" = "s19-demo-public-rt"
        }
      + vpc_id           = (known after apply)
    }

  # aws_route_table_association.public will be created
  + resource "aws_route_table_association" "public" {
      + id             = (known after apply)
      + route_table_id = (known after apply)
      + subnet_id      = (known after apply)
    }

  # aws_s3_bucket.assets will be created
  + resource "aws_s3_bucket" "assets" {
      + acceleration_status         = (known after apply)
      + acl                         = (known after apply)
      + arn                         = (known after apply)
      + bucket                      = "s19-demo-assets-24bcs10153"
      + bucket_domain_name          = (known after apply)
      + bucket_prefix               = (known after apply)
      + bucket_regional_domain_name = (known after apply)
      + force_destroy               = false
      + hosted_zone_id              = (known after apply)
      + id                          = (known after apply)
      + object_lock_enabled         = (known after apply)
      + policy                      = (known after apply)
      + region                      = (known after apply)
      + request_payer               = (known after apply)
      + tags                        = {
          + "Name" = "s19-demo-assets"
        }
      + tags_all                    = {
          + "Name" = "s19-demo-assets"
        }
      + website_domain              = (known after apply)
      + website_endpoint            = (known after apply)

      + cors_rule (known after apply)

      + grant (known after apply)

      + lifecycle_rule (known after apply)

      + logging (known after apply)

      + object_lock_configuration (known after apply)

      + replication_configuration (known after apply)

      + server_side_encryption_configuration (known after apply)

      + versioning (known after apply)

      + website (known after apply)
    }

  # aws_security_group.web will be created
  + resource "aws_security_group" "web" {
      + arn                    = (known after apply)
      + description            = "Allow HTTP from anywhere and SSH from my IP"
      + egress                 = [
          + {
              + cidr_blocks      = [
                  + "0.0.0.0/0",
                ]
              + from_port        = 0
              + ipv6_cidr_blocks = []
              + prefix_list_ids  = []
              + protocol         = "-1"
              + security_groups  = []
              + self             = false
              + to_port          = 0
                # (1 unchanged attribute hidden)
            },
        ]
      + id                     = (known after apply)
      + ingress                = [
          + {
              + cidr_blocks      = [
                  + "0.0.0.0/0",
                ]
              + description      = "HTTP"
              + from_port        = 80
              + ipv6_cidr_blocks = []
              + prefix_list_ids  = []
              + protocol         = "tcp"
              + security_groups  = []
              + self             = false
              + to_port          = 80
            },
          + {
              + cidr_blocks      = [
                  + "203.0.113.10/32",
                ]
              + description      = "SSH"
              + from_port        = 22
              + ipv6_cidr_blocks = []
              + prefix_list_ids  = []
              + protocol         = "tcp"
              + security_groups  = []
              + self             = false
              + to_port          = 22
            },
        ]
      + name                   = "s19-demo-web-sg"
      + name_prefix            = (known after apply)
      + owner_id               = (known after apply)
      + revoke_rules_on_delete = false
      + tags                   = {
          + "Name" = "s19-demo-web-sg"
        }
      + tags_all               = {
          + "Name" = "s19-demo-web-sg"
        }
      + vpc_id                 = (known after apply)
    }

  # aws_subnet.public will be created
  + resource "aws_subnet" "public" {
      + arn                                            = (known after apply)
      + assign_ipv6_address_on_creation                = false
      + availability_zone                              = "ap-south-1a"
      + availability_zone_id                           = (known after apply)
      + cidr_block                                     = "10.0.1.0/24"
      + enable_dns64                                   = false
      + enable_resource_name_dns_a_record_on_launch    = false
      + enable_resource_name_dns_aaaa_record_on_launch = false
      + id                                             = (known after apply)
      + ipv6_cidr_block_association_id                 = (known after apply)
      + ipv6_native                                    = false
      + map_public_ip_on_launch                        = true
      + owner_id                                       = (known after apply)
      + private_dns_hostname_type_on_launch            = (known after apply)
      + tags                                           = {
          + "Name" = "s19-demo-public-subnet"
        }
      + tags_all                                       = {
          + "Name" = "s19-demo-public-subnet"
        }
      + vpc_id                                         = (known after apply)
    }

  # aws_vpc.main will be created
  + resource "aws_vpc" "main" {
      + arn                                  = (known after apply)
      + cidr_block                           = "10.0.0.0/16"
      + default_network_acl_id               = (known after apply)
      + default_route_table_id               = (known after apply)
      + default_security_group_id            = (known after apply)
      + dhcp_options_id                      = (known after apply)
      + enable_dns_hostnames                 = true
      + enable_dns_support                   = true
      + enable_network_address_usage_metrics = (known after apply)
      + id                                   = (known after apply)
      + instance_tenancy                     = "default"
      + ipv6_association_id                  = (known after apply)
      + ipv6_cidr_block                      = (known after apply)
      + ipv6_cidr_block_network_border_group = (known after apply)
      + main_route_table_id                  = (known after apply)
      + owner_id                             = (known after apply)
      + tags                                 = {
          + "Name" = "s19-demo-vpc"
        }
      + tags_all                             = {
          + "Name" = "s19-demo-vpc"
        }
    }

Plan: 8 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + bucket_name        = "s19-demo-assets-24bcs10153"
  + instance_id        = (known after apply)
  + instance_public_ip = (known after apply)
  + public_subnet_id   = (known after apply)
  + security_group_id  = (known after apply)
  + vpc_id             = (known after apply)
aws_vpc.main: Creating...
aws_s3_bucket.assets: Creating...
aws_s3_bucket.assets: Creation complete after 0s [id=s19-demo-assets-24bcs10153]
aws_vpc.main: Still creating... [00m10s elapsed]
aws_vpc.main: Creation complete after 14s [id=vpc-ecd57e9336d4ffec0]
aws_internet_gateway.igw: Creating...
aws_subnet.public: Creating...
aws_security_group.web: Creating...
aws_internet_gateway.igw: Creation complete after 0s [id=igw-0ce6663b13d809884]
aws_route_table.public: Creating...
aws_route_table.public: Creation complete after 0s [id=rtb-1fc0d5f185c4843e2]
aws_security_group.web: Creation complete after 0s [id=sg-998cc78a9042fddcc]
aws_subnet.public: Still creating... [00m10s elapsed]
aws_subnet.public: Creation complete after 10s [id=subnet-1bfece071c5191d3d]
aws_route_table_association.public: Creating...
aws_instance.web: Creating...
aws_route_table_association.public: Creation complete after 0s [id=rtbassoc-a26ee61b31c4c0487]
aws_instance.web: Still creating... [00m10s elapsed]
aws_instance.web: Creation complete after 10s [id=i-3d38784fddf4c9da9]

Apply complete! Resources: 8 added, 0 changed, 0 destroyed.

Outputs:

bucket_name = "s19-demo-assets-24bcs10153"
instance_id = "i-3d38784fddf4c9da9"
instance_public_ip = "54.214.63.97"
public_subnet_id = "subnet-1bfece071c5191d3d"
security_group_id = "sg-998cc78a9042fddcc"
vpc_id = "vpc-ecd57e9336d4ffec0"
$ terraform output
bucket_name = "s19-demo-assets-24bcs10153"
instance_id = "i-3d38784fddf4c9da9"
instance_public_ip = "54.214.63.97"
public_subnet_id = "subnet-1bfece071c5191d3d"
security_group_id = "sg-998cc78a9042fddcc"
vpc_id = "vpc-ecd57e9336d4ffec0"
$ terraform state list
aws_instance.web
aws_internet_gateway.igw
aws_route_table.public
aws_route_table_association.public
aws_s3_bucket.assets
aws_security_group.web
aws_subnet.public
aws_vpc.main
$ terraform state show aws_instance.web
# aws_instance.web:
resource "aws_instance" "web" {
    ami                                  = "ami-0c55b159cbfafe1f0"
    arn                                  = "arn:aws:ec2:ap-south-1::instance/i-3d38784fddf4c9da9"
    associate_public_ip_address          = true
    availability_zone                    = "ap-south-1a"
    disable_api_stop                     = false
    disable_api_termination              = false
    ebs_optimized                        = false
    get_password_data                    = false
    hibernation                          = false
    host_id                              = [90mnull[0m[0m
    iam_instance_profile                 = [90mnull[0m[0m
    id                                   = "i-3d38784fddf4c9da9"
    instance_initiated_shutdown_behavior = "stop"
    instance_lifecycle                   = [90mnull[0m[0m
    instance_state                       = "running"
    instance_type                        = "t3.micro"
    ipv6_address_count                   = 0
    ipv6_addresses                       = []
    key_name                             = [90mnull[0m[0m
    monitoring                           = false
    outpost_arn                          = [90mnull[0m[0m
    password_data                        = [90mnull[0m[0m
    placement_group                      = [90mnull[0m[0m
    placement_partition_number           = 0
    primary_network_interface_id         = "eni-56f7e8641088f0f73"
    private_dns                          = "ip-10-0-1-4.ap-south-1.compute.internal"
    private_ip                           = "10.0.1.4"
    public_dns                           = "ec2-54-214-63-97.ap-south-1.compute.amazonaws.com"
    public_ip                            = "54.214.63.97"
    secondary_private_ips                = []
    security_groups                      = []
    source_dest_check                    = true
    spot_instance_request_id             = [90mnull[0m[0m
    subnet_id                            = "subnet-1bfece071c5191d3d"
    tags                                 = {
        "Name" = "s19-demo-web"
    }
    tags_all                             = {
        "Name" = "s19-demo-web"
    }
    tenancy                              = "default"
    user_data                            = "14ec9722d26e194beaef5a01df2985bc0c59331d"
    user_data_replace_on_change          = false
    vpc_security_group_ids               = [
        "sg-998cc78a9042fddcc",
    ]

    credit_specification {
        cpu_credits = "standard"
    }

    metadata_options {
        http_endpoint               = "enabled"
        http_protocol_ipv6          = "disabled"
        http_put_response_hop_limit = 1
        http_tokens                 = "optional"
        instance_metadata_tags      = "disabled"
    }

    root_block_device {
        delete_on_termination = true
        device_name           = "/dev/sda1"
        encrypted             = false
        iops                  = 0
        kms_key_id            = [90mnull[0m[0m
        tags                  = {}
        tags_all              = {}
        throughput            = 0
        volume_id             = "vol-7874317a8774a3c20"
        volume_size           = 8
        volume_type           = "gp2"
    }
}
$ terraform graph | grep -- "->" | head -12
  "aws_instance.web" -> "aws_security_group.web";
  "aws_instance.web" -> "aws_subnet.public";
  "aws_internet_gateway.igw" -> "aws_vpc.main";
  "aws_route_table.public" -> "aws_internet_gateway.igw";
  "aws_route_table_association.public" -> "aws_route_table.public";
  "aws_route_table_association.public" -> "aws_subnet.public";
  "aws_security_group.web" -> "aws_vpc.main";
  "aws_subnet.public" -> "aws_vpc.main";
```

### terraform destroy

```bash
$ terraform destroy -auto-approve -no-color
aws_vpc.main: Refreshing state... [id=vpc-ecd57e9336d4ffec0]
aws_s3_bucket.assets: Refreshing state... [id=s19-demo-assets-24bcs10153]
aws_internet_gateway.igw: Refreshing state... [id=igw-0ce6663b13d809884]
aws_subnet.public: Refreshing state... [id=subnet-1bfece071c5191d3d]
aws_security_group.web: Refreshing state... [id=sg-998cc78a9042fddcc]
aws_route_table.public: Refreshing state... [id=rtb-1fc0d5f185c4843e2]
aws_instance.web: Refreshing state... [id=i-3d38784fddf4c9da9]
aws_route_table_association.public: Refreshing state... [id=rtbassoc-a26ee61b31c4c0487]

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  - destroy

Terraform will perform the following actions:

  # aws_instance.web will be destroyed
  - resource "aws_instance" "web" {
      - ami                                  = "ami-0c55b159cbfafe1f0" -> null
      - arn                                  = "arn:aws:ec2:ap-south-1::instance/i-3d38784fddf4c9da9" -> null
      - associate_public_ip_address          = true -> null
      - availability_zone                    = "ap-south-1a" -> null
      - disable_api_stop                     = false -> null
      - disable_api_termination              = false -> null
      - ebs_optimized                        = false -> null
      - get_password_data                    = false -> null
      - hibernation                          = false -> null
      - id                                   = "i-3d38784fddf4c9da9" -> null
      - instance_initiated_shutdown_behavior = "stop" -> null
      - instance_state                       = "running" -> null
      - instance_type                        = "t3.micro" -> null
      - ipv6_address_count                   = 0 -> null
      - ipv6_addresses                       = [] -> null
      - monitoring                           = false -> null
      - placement_partition_number           = 0 -> null
      - primary_network_interface_id         = "eni-56f7e8641088f0f73" -> null
      - private_dns                          = "ip-10-0-1-4.ap-south-1.compute.internal" -> null
      - private_ip                           = "10.0.1.4" -> null
      - public_dns                           = "ec2-54-214-63-97.ap-south-1.compute.amazonaws.com" -> null
      - public_ip                            = "54.214.63.97" -> null
      - secondary_private_ips                = [] -> null
      - security_groups                      = [] -> null
      - source_dest_check                    = true -> null
      - subnet_id                            = "subnet-1bfece071c5191d3d" -> null
      - tags                                 = {
          - "Name" = "s19-demo-web"
        } -> null
      - tags_all                             = {
          - "Name" = "s19-demo-web"
        } -> null
      - tenancy                              = "default" -> null
      - user_data                            = "14ec9722d26e194beaef5a01df2985bc0c59331d" -> null
      - user_data_replace_on_change          = false -> null
      - vpc_security_group_ids               = [
          - "sg-998cc78a9042fddcc",
        ] -> null
        # (8 unchanged attributes hidden)

      - credit_specification {
          - cpu_credits = "standard" -> null
        }

      - metadata_options {
          - http_endpoint               = "enabled" -> null
          - http_protocol_ipv6          = "disabled" -> null
          - http_put_response_hop_limit = 1 -> null
          - http_tokens                 = "optional" -> null
          - instance_metadata_tags      = "disabled" -> null
        }

      - root_block_device {
          - delete_on_termination = true -> null
          - device_name           = "/dev/sda1" -> null
          - encrypted             = false -> null
          - iops                  = 0 -> null
          - tags                  = {} -> null
          - tags_all              = {} -> null
          - throughput            = 0 -> null
          - volume_id             = "vol-7874317a8774a3c20" -> null
          - volume_size           = 8 -> null
          - volume_type           = "gp2" -> null
            # (1 unchanged attribute hidden)
        }
    }

  # aws_internet_gateway.igw will be destroyed
  - resource "aws_internet_gateway" "igw" {
      - arn      = "arn:aws:ec2:ap-south-1:000000000000:internet-gateway/igw-0ce6663b13d809884" -> null
      - id       = "igw-0ce6663b13d809884" -> null
      - owner_id = "000000000000" -> null
      - tags     = {
          - "Name" = "s19-demo-igw"
        } -> null
      - tags_all = {
          - "Name" = "s19-demo-igw"
        } -> null
      - vpc_id   = "vpc-ecd57e9336d4ffec0" -> null
    }

  # aws_route_table.public will be destroyed
  - resource "aws_route_table" "public" {
      - arn              = "arn:aws:ec2:ap-south-1:000000000000:route-table/rtb-1fc0d5f185c4843e2" -> null
      - id               = "rtb-1fc0d5f185c4843e2" -> null
      - owner_id         = "000000000000" -> null
      - propagating_vgws = [] -> null
      - route            = [
          - {
              - cidr_block                 = "0.0.0.0/0"
              - gateway_id                 = "igw-0ce6663b13d809884"
                # (11 unchanged attributes hidden)
            },
        ] -> null
      - tags             = {
          - "Name" = "s19-demo-public-rt"
        } -> null
      - tags_all         = {
          - "Name" = "s19-demo-public-rt"
        } -> null
      - vpc_id           = "vpc-ecd57e9336d4ffec0" -> null
    }

  # aws_route_table_association.public will be destroyed
  - resource "aws_route_table_association" "public" {
      - id             = "rtbassoc-a26ee61b31c4c0487" -> null
      - route_table_id = "rtb-1fc0d5f185c4843e2" -> null
      - subnet_id      = "subnet-1bfece071c5191d3d" -> null
        # (1 unchanged attribute hidden)
    }

  # aws_s3_bucket.assets will be destroyed
  - resource "aws_s3_bucket" "assets" {
      - arn                         = "arn:aws:s3:::s19-demo-assets-24bcs10153" -> null
      - bucket                      = "s19-demo-assets-24bcs10153" -> null
      - bucket_domain_name          = "s19-demo-assets-24bcs10153.s3.amazonaws.com" -> null
      - bucket_regional_domain_name = "s19-demo-assets-24bcs10153.s3.ap-south-1.amazonaws.com" -> null
      - force_destroy               = false -> null
      - hosted_zone_id              = "Z11RGJOFQNVJUP" -> null
      - id                          = "s19-demo-assets-24bcs10153" -> null
      - object_lock_enabled         = false -> null
      - region                      = "ap-south-1" -> null
      - request_payer               = "BucketOwner" -> null
      - tags                        = {
          - "Name" = "s19-demo-assets"
        } -> null
      - tags_all                    = {
          - "Name" = "s19-demo-assets"
        } -> null
        # (3 unchanged attributes hidden)

      - grant {
          - id          = "75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a" -> null
          - permissions = [
              - "FULL_CONTROL",
            ] -> null
          - type        = "CanonicalUser" -> null
            # (1 unchanged attribute hidden)
        }

      - server_side_encryption_configuration {
          - rule {
              - bucket_key_enabled = false -> null

              - apply_server_side_encryption_by_default {
                  - sse_algorithm     = "AES256" -> null
                    # (1 unchanged attribute hidden)
                }
            }
        }

      - versioning {
          - enabled    = false -> null
          - mfa_delete = false -> null
        }
    }

  # aws_security_group.web will be destroyed
  - resource "aws_security_group" "web" {
      - arn                    = "arn:aws:ec2:ap-south-1:000000000000:security-group/sg-998cc78a9042fddcc" -> null
      - description            = "Allow HTTP from anywhere and SSH from my IP" -> null
      - egress                 = [
          - {
              - cidr_blocks      = [
                  - "0.0.0.0/0",
                ]
              - from_port        = 0
              - ipv6_cidr_blocks = []
              - prefix_list_ids  = []
              - protocol         = "-1"
              - security_groups  = []
              - self             = false
              - to_port          = 0
                # (1 unchanged attribute hidden)
            },
        ] -> null
      - id                     = "sg-998cc78a9042fddcc" -> null
      - ingress                = [
          - {
              - cidr_blocks      = [
                  - "0.0.0.0/0",
                ]
              - description      = "HTTP"
              - from_port        = 80
              - ipv6_cidr_blocks = []
              - prefix_list_ids  = []
              - protocol         = "tcp"
              - security_groups  = []
              - self             = false
              - to_port          = 80
            },
          - {
              - cidr_blocks      = [
                  - "203.0.113.10/32",
                ]
              - description      = "SSH"
              - from_port        = 22
              - ipv6_cidr_blocks = []
              - prefix_list_ids  = []
              - protocol         = "tcp"
              - security_groups  = []
              - self             = false
              - to_port          = 22
            },
        ] -> null
      - name                   = "s19-demo-web-sg" -> null
      - owner_id               = "000000000000" -> null
      - revoke_rules_on_delete = false -> null
      - tags                   = {
          - "Name" = "s19-demo-web-sg"
        } -> null
      - tags_all               = {
          - "Name" = "s19-demo-web-sg"
        } -> null
      - vpc_id                 = "vpc-ecd57e9336d4ffec0" -> null
        # (1 unchanged attribute hidden)
    }

  # aws_subnet.public will be destroyed
  - resource "aws_subnet" "public" {
      - arn                                            = "arn:aws:ec2:ap-south-1:000000000000:subnet/subnet-1bfece071c5191d3d" -> null
      - assign_ipv6_address_on_creation                = false -> null
      - availability_zone                              = "ap-south-1a" -> null
      - availability_zone_id                           = "aps1-az1" -> null
      - cidr_block                                     = "10.0.1.0/24" -> null
      - enable_dns64                                   = false -> null
      - enable_lni_at_device_index                     = 0 -> null
      - enable_resource_name_dns_a_record_on_launch    = false -> null
      - enable_resource_name_dns_aaaa_record_on_launch = false -> null
      - id                                             = "subnet-1bfece071c5191d3d" -> null
      - ipv6_native                                    = false -> null
      - map_customer_owned_ip_on_launch                = false -> null
      - map_public_ip_on_launch                        = true -> null
      - owner_id                                       = "000000000000" -> null
      - private_dns_hostname_type_on_launch            = "ip-name" -> null
      - tags                                           = {
          - "Name" = "s19-demo-public-subnet"
        } -> null
      - tags_all                                       = {
          - "Name" = "s19-demo-public-subnet"
        } -> null
      - vpc_id                                         = "vpc-ecd57e9336d4ffec0" -> null
        # (4 unchanged attributes hidden)
    }

  # aws_vpc.main will be destroyed
  - resource "aws_vpc" "main" {
      - arn                                  = "arn:aws:ec2:ap-south-1:000000000000:vpc/vpc-ecd57e9336d4ffec0" -> null
      - assign_generated_ipv6_cidr_block     = false -> null
      - cidr_block                           = "10.0.0.0/16" -> null
      - default_network_acl_id               = "acl-ea141dc80cedae6fe" -> null
      - default_route_table_id               = "rtb-c007c27b3f555a412" -> null
      - default_security_group_id            = "sg-037073c6339070252" -> null
      - dhcp_options_id                      = "default" -> null
      - enable_dns_hostnames                 = true -> null
      - enable_dns_support                   = true -> null
      - enable_network_address_usage_metrics = false -> null
      - id                                   = "vpc-ecd57e9336d4ffec0" -> null
      - instance_tenancy                     = "default" -> null
      - ipv6_netmask_length                  = 0 -> null
      - main_route_table_id                  = "rtb-c007c27b3f555a412" -> null
      - owner_id                             = "000000000000" -> null
      - tags                                 = {
          - "Name" = "s19-demo-vpc"
        } -> null
      - tags_all                             = {
          - "Name" = "s19-demo-vpc"
        } -> null
        # (4 unchanged attributes hidden)
    }

Plan: 0 to add, 0 to change, 8 to destroy.

Changes to Outputs:
  - bucket_name        = "s19-demo-assets-24bcs10153" -> null
  - instance_id        = "i-3d38784fddf4c9da9" -> null
  - instance_public_ip = "54.214.63.97" -> null
  - public_subnet_id   = "subnet-1bfece071c5191d3d" -> null
  - security_group_id  = "sg-998cc78a9042fddcc" -> null
  - vpc_id             = "vpc-ecd57e9336d4ffec0" -> null
aws_route_table_association.public: Destroying... [id=rtbassoc-a26ee61b31c4c0487]
aws_instance.web: Destroying... [id=i-3d38784fddf4c9da9]
aws_s3_bucket.assets: Destroying... [id=s19-demo-assets-24bcs10153]
aws_s3_bucket.assets: Destruction complete after 0s
aws_route_table_association.public: Destruction complete after 0s
aws_route_table.public: Destroying... [id=rtb-1fc0d5f185c4843e2]
aws_route_table.public: Destruction complete after 0s
aws_internet_gateway.igw: Destroying... [id=igw-0ce6663b13d809884]
aws_internet_gateway.igw: Destruction complete after 0s
aws_instance.web: Still destroying... [id=i-3d38784fddf4c9da9, 00m10s elapsed]
aws_instance.web: Destruction complete after 10s
aws_subnet.public: Destroying... [id=subnet-1bfece071c5191d3d]
aws_security_group.web: Destroying... [id=sg-998cc78a9042fddcc]
aws_subnet.public: Destruction complete after 0s
aws_security_group.web: Destruction complete after 0s
aws_vpc.main: Destroying... [id=vpc-ecd57e9336d4ffec0]
aws_vpc.main: Destruction complete after 0s

Destroy complete! Resources: 8 destroyed.
```

**Observed:** `plan` → **8 to add**. `apply` created the VPC first, then the IGW, subnet and SG (all depend on the VPC), the route table and its association, and finally the EC2 instance, which got the public IP `54.214.63.97` because `map_public_ip_on_launch = true`. `terraform graph` shows the dependency edges. `destroy` removed all 8 in **reverse** dependency order: the instance before the subnet and SG, and the VPC last.
