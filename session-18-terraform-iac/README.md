# Session 18: Terraform & Infrastructure as Code

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

## Task 1: Terraform S3 Demo

```text
terraform-s3-demo/
├── provider.tf        # AWS provider (pointed at LocalStack)
├── variables.tf       # region, endpoint, bucket_name, environment
├── main.tf            # S3 bucket + versioning + encryption + public-access block + object
├── outputs.tf         # bucket_name, bucket_arn, versioning_status
├── terraform.tfvars   # values for the variables
└── README.md
```

> **Environment:** No AWS account was used. Terraform ran against **LocalStack**, a local AWS emulator in Docker that exposes the same S3 API on `localhost:4566`. Terraform itself ran in the `hashicorp/terraform` Docker image. The code is real AWS Terraform: removing the `endpoints`/`skip_*` lines in `provider.tf` makes it create the bucket on real AWS.

| Command | What it does |
| --- | --- |
| `terraform init` | Downloads the provider plugins (hashicorp/aws) and sets up the backend |
| `terraform fmt` | Formats the code to the standard style (`-check` only reports) |
| `terraform validate` | Checks the syntax and internal consistency |
| `terraform plan` | Shows what **will** change, without changing anything |
| `terraform apply` | Creates or updates the real resources and writes the **state** |
| `terraform show` | Shows the current state |
| `terraform output` | Prints the output values |
| `terraform destroy` | Deletes everything Terraform created |

### Full workflow (real output)

```bash
$ terraform version
Terraform v1.16.5
on linux_amd64
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
$ terraform fmt -check -diff
$ terraform validate -no-color
Success! The configuration is valid.

$ terraform plan -no-color

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_s3_bucket.demo will be created
  + resource "aws_s3_bucket" "demo" {
      + acceleration_status         = (known after apply)
      + acl                         = (known after apply)
      + arn                         = (known after apply)
      + bucket                      = "siddhant-24bcs10153-tf-demo"
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
          + "Environment" = "dev"
          + "ManagedBy"   = "Terraform"
          + "Name"        = "siddhant-24bcs10153-tf-demo"
          + "Owner"       = "Siddhant Singh"
        }
      + tags_all                    = {
          + "Environment" = "dev"
          + "ManagedBy"   = "Terraform"
          + "Name"        = "siddhant-24bcs10153-tf-demo"
          + "Owner"       = "Siddhant Singh"
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

  # aws_s3_bucket_public_access_block.demo will be created
  + resource "aws_s3_bucket_public_access_block" "demo" {
      + block_public_acls       = true
      + block_public_policy     = true
      + bucket                  = (known after apply)
      + id                      = (known after apply)
      + ignore_public_acls      = true
      + restrict_public_buckets = true
    }

  # aws_s3_bucket_server_side_encryption_configuration.demo will be created
  + resource "aws_s3_bucket_server_side_encryption_configuration" "demo" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + rule {
          + apply_server_side_encryption_by_default {
              + sse_algorithm     = "AES256"
                # (1 unchanged attribute hidden)
            }
        }
    }

  # aws_s3_bucket_versioning.demo will be created
  + resource "aws_s3_bucket_versioning" "demo" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + versioning_configuration {
          + mfa_delete = (known after apply)
          + status     = "Enabled"
        }
    }

  # aws_s3_object.hello will be created
  + resource "aws_s3_object" "hello" {
      + acl                    = (known after apply)
      + arn                    = (known after apply)
      + bucket                 = (known after apply)
      + bucket_key_enabled     = (known after apply)
      + checksum_crc32         = (known after apply)
      + checksum_crc32c        = (known after apply)
      + checksum_crc64nvme     = (known after apply)
      + checksum_sha1          = (known after apply)
      + checksum_sha256        = (known after apply)
      + content                = "Hello from Terraform!"
      + content_type           = "text/plain"
      + etag                   = (known after apply)
      + force_destroy          = false
      + id                     = (known after apply)
      + key                    = "hello.txt"
      + kms_key_id             = (known after apply)
      + server_side_encryption = (known after apply)
      + storage_class          = (known after apply)
      + tags_all               = (known after apply)
      + version_id             = (known after apply)
    }

Plan: 5 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + bucket_arn        = (known after apply)
  + bucket_name       = "siddhant-24bcs10153-tf-demo"
  + versioning_status = "Enabled"
$ terraform apply -auto-approve -no-color

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # aws_s3_bucket.demo will be created
  + resource "aws_s3_bucket" "demo" {
      + acceleration_status         = (known after apply)
      + acl                         = (known after apply)
      + arn                         = (known after apply)
      + bucket                      = "siddhant-24bcs10153-tf-demo"
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
          + "Environment" = "dev"
          + "ManagedBy"   = "Terraform"
          + "Name"        = "siddhant-24bcs10153-tf-demo"
          + "Owner"       = "Siddhant Singh"
        }
      + tags_all                    = {
          + "Environment" = "dev"
          + "ManagedBy"   = "Terraform"
          + "Name"        = "siddhant-24bcs10153-tf-demo"
          + "Owner"       = "Siddhant Singh"
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

  # aws_s3_bucket_public_access_block.demo will be created
  + resource "aws_s3_bucket_public_access_block" "demo" {
      + block_public_acls       = true
      + block_public_policy     = true
      + bucket                  = (known after apply)
      + id                      = (known after apply)
      + ignore_public_acls      = true
      + restrict_public_buckets = true
    }

  # aws_s3_bucket_server_side_encryption_configuration.demo will be created
  + resource "aws_s3_bucket_server_side_encryption_configuration" "demo" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + rule {
          + apply_server_side_encryption_by_default {
              + sse_algorithm     = "AES256"
                # (1 unchanged attribute hidden)
            }
        }
    }

  # aws_s3_bucket_versioning.demo will be created
  + resource "aws_s3_bucket_versioning" "demo" {
      + bucket = (known after apply)
      + id     = (known after apply)

      + versioning_configuration {
          + mfa_delete = (known after apply)
          + status     = "Enabled"
        }
    }

  # aws_s3_object.hello will be created
  + resource "aws_s3_object" "hello" {
      + acl                    = (known after apply)
      + arn                    = (known after apply)
      + bucket                 = (known after apply)
      + bucket_key_enabled     = (known after apply)
      + checksum_crc32         = (known after apply)
      + checksum_crc32c        = (known after apply)
      + checksum_crc64nvme     = (known after apply)
      + checksum_sha1          = (known after apply)
      + checksum_sha256        = (known after apply)
      + content                = "Hello from Terraform!"
      + content_type           = "text/plain"
      + etag                   = (known after apply)
      + force_destroy          = false
      + id                     = (known after apply)
      + key                    = "hello.txt"
      + kms_key_id             = (known after apply)
      + server_side_encryption = (known after apply)
      + storage_class          = (known after apply)
      + tags_all               = (known after apply)
      + version_id             = (known after apply)
    }

Plan: 5 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + bucket_arn        = (known after apply)
  + bucket_name       = "siddhant-24bcs10153-tf-demo"
  + versioning_status = "Enabled"
aws_s3_bucket.demo: Creating...
aws_s3_bucket.demo: Creation complete after 1s [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket_public_access_block.demo: Creating...
aws_s3_bucket_versioning.demo: Creating...
aws_s3_bucket_server_side_encryption_configuration.demo: Creating...
aws_s3_object.hello: Creating...
aws_s3_bucket_server_side_encryption_configuration.demo: Creation complete after 0s [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket_public_access_block.demo: Creation complete after 0s [id=siddhant-24bcs10153-tf-demo]
aws_s3_object.hello: Creation complete after 0s [id=hello.txt]
aws_s3_bucket_versioning.demo: Creation complete after 1s [id=siddhant-24bcs10153-tf-demo]

Apply complete! Resources: 5 added, 0 changed, 0 destroyed.

Outputs:

bucket_arn = "arn:aws:s3:::siddhant-24bcs10153-tf-demo"
bucket_name = "siddhant-24bcs10153-tf-demo"
versioning_status = "Enabled"
$ terraform show -no-color
# aws_s3_bucket.demo:
resource "aws_s3_bucket" "demo" {
    acceleration_status         = null
    arn                         = "arn:aws:s3:::siddhant-24bcs10153-tf-demo"
    bucket                      = "siddhant-24bcs10153-tf-demo"
    bucket_domain_name          = "siddhant-24bcs10153-tf-demo.s3.amazonaws.com"
    bucket_prefix               = null
    bucket_regional_domain_name = "siddhant-24bcs10153-tf-demo.s3.ap-south-1.amazonaws.com"
    force_destroy               = false
    hosted_zone_id              = "Z11RGJOFQNVJUP"
    id                          = "siddhant-24bcs10153-tf-demo"
    object_lock_enabled         = false
    policy                      = null
    region                      = "ap-south-1"
    request_payer               = "BucketOwner"
    tags                        = {
        "Environment" = "dev"
        "ManagedBy"   = "Terraform"
        "Name"        = "siddhant-24bcs10153-tf-demo"
        "Owner"       = "Siddhant Singh"
    }
    tags_all                    = {
        "Environment" = "dev"
        "ManagedBy"   = "Terraform"
        "Name"        = "siddhant-24bcs10153-tf-demo"
        "Owner"       = "Siddhant Singh"
    }

    grant {
        id          = "75aa57f09aa0c8caeab4f8c24e99d10f8e7faeebf76c078efc7c6caea54ba06a"
        permissions = [
            "FULL_CONTROL",
        ]
        type        = "CanonicalUser"
        uri         = null
    }

    server_side_encryption_configuration {
        rule {
            bucket_key_enabled = false

            apply_server_side_encryption_by_default {
                kms_master_key_id = null
                sse_algorithm     = "AES256"
            }
        }
    }

    versioning {
        enabled    = false
        mfa_delete = false
    }
}

# aws_s3_bucket_public_access_block.demo:
resource "aws_s3_bucket_public_access_block" "demo" {
    block_public_acls       = true
    block_public_policy     = true
    bucket                  = "siddhant-24bcs10153-tf-demo"
    id                      = "siddhant-24bcs10153-tf-demo"
    ignore_public_acls      = true
    restrict_public_buckets = true
}

# aws_s3_bucket_server_side_encryption_configuration.demo:
resource "aws_s3_bucket_server_side_encryption_configuration" "demo" {
    bucket                = "siddhant-24bcs10153-tf-demo"
    expected_bucket_owner = null
    id                    = "siddhant-24bcs10153-tf-demo"

    rule {
        apply_server_side_encryption_by_default {
            kms_master_key_id = null
            sse_algorithm     = "AES256"
        }
    }
}

# aws_s3_bucket_versioning.demo:
resource "aws_s3_bucket_versioning" "demo" {
    bucket                = "siddhant-24bcs10153-tf-demo"
    expected_bucket_owner = null
    id                    = "siddhant-24bcs10153-tf-demo"

    versioning_configuration {
        mfa_delete = null
        status     = "Enabled"
    }
}

# aws_s3_object.hello:
resource "aws_s3_object" "hello" {
    arn                           = "arn:aws:s3:::siddhant-24bcs10153-tf-demo/hello.txt"
    bucket                        = "siddhant-24bcs10153-tf-demo"
    bucket_key_enabled            = false
    cache_control                 = null
    checksum_crc32                = null
    checksum_crc32c               = null
    checksum_crc64nvme            = null
    checksum_sha1                 = null
    checksum_sha256               = null
    content                       = "Hello from Terraform!"
    content_disposition           = null
    content_encoding              = null
    content_language              = null
    content_type                  = "text/plain"
    etag                          = "c57fe0cccf9e1237ea80aa663c90637b"
    force_destroy                 = false
    id                            = "hello.txt"
    key                           = "hello.txt"
    object_lock_legal_hold_status = null
    object_lock_mode              = null
    object_lock_retain_until_date = null
    server_side_encryption        = "AES256"
    storage_class                 = "STANDARD"
    tags_all                      = {}
    version_id                    = "AaEXVDhb0mYljmOzhblFdsVgCYbaBBdn"
    website_redirect              = null
}


Outputs:

bucket_arn = "arn:aws:s3:::siddhant-24bcs10153-tf-demo"
bucket_name = "siddhant-24bcs10153-tf-demo"
versioning_status = "Enabled"
$ terraform output
bucket_arn = "arn:aws:s3:::siddhant-24bcs10153-tf-demo"
bucket_name = "siddhant-24bcs10153-tf-demo"
versioning_status = "Enabled"
$ terraform state list
aws_s3_bucket.demo
aws_s3_bucket_public_access_block.demo
aws_s3_bucket_server_side_encryption_configuration.demo
aws_s3_bucket_versioning.demo
aws_s3_object.hello
$ curl -s http://localhost:4566/siddhant-24bcs10153-tf-demo/hello.txt; echo
Hello from Terraform!
$ terraform destroy -auto-approve -no-color
aws_s3_bucket.demo: Refreshing state... [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket_versioning.demo: Refreshing state... [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket_public_access_block.demo: Refreshing state... [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket_server_side_encryption_configuration.demo: Refreshing state... [id=siddhant-24bcs10153-tf-demo]
aws_s3_object.hello: Refreshing state... [id=hello.txt]

Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  - destroy

Terraform will perform the following actions:

  # aws_s3_bucket.demo will be destroyed
  - resource "aws_s3_bucket" "demo" {
      - arn                         = "arn:aws:s3:::siddhant-24bcs10153-tf-demo" -> null
      - bucket                      = "siddhant-24bcs10153-tf-demo" -> null
      - bucket_domain_name          = "siddhant-24bcs10153-tf-demo.s3.amazonaws.com" -> null
      - bucket_regional_domain_name = "siddhant-24bcs10153-tf-demo.s3.ap-south-1.amazonaws.com" -> null
      - force_destroy               = false -> null
      - hosted_zone_id              = "Z11RGJOFQNVJUP" -> null
      - id                          = "siddhant-24bcs10153-tf-demo" -> null
      - object_lock_enabled         = false -> null
      - region                      = "ap-south-1" -> null
      - request_payer               = "BucketOwner" -> null
      - tags                        = {
          - "Environment" = "dev"
          - "ManagedBy"   = "Terraform"
          - "Name"        = "siddhant-24bcs10153-tf-demo"
          - "Owner"       = "Siddhant Singh"
        } -> null
      - tags_all                    = {
          - "Environment" = "dev"
          - "ManagedBy"   = "Terraform"
          - "Name"        = "siddhant-24bcs10153-tf-demo"
          - "Owner"       = "Siddhant Singh"
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
          - enabled    = true -> null
          - mfa_delete = false -> null
        }
    }

  # aws_s3_bucket_public_access_block.demo will be destroyed
  - resource "aws_s3_bucket_public_access_block" "demo" {
      - block_public_acls       = true -> null
      - block_public_policy     = true -> null
      - bucket                  = "siddhant-24bcs10153-tf-demo" -> null
      - id                      = "siddhant-24bcs10153-tf-demo" -> null
      - ignore_public_acls      = true -> null
      - restrict_public_buckets = true -> null
    }

  # aws_s3_bucket_server_side_encryption_configuration.demo will be destroyed
  - resource "aws_s3_bucket_server_side_encryption_configuration" "demo" {
      - bucket                = "siddhant-24bcs10153-tf-demo" -> null
      - id                    = "siddhant-24bcs10153-tf-demo" -> null
        # (1 unchanged attribute hidden)

      - rule {
          - bucket_key_enabled = false -> null

          - apply_server_side_encryption_by_default {
              - sse_algorithm     = "AES256" -> null
                # (1 unchanged attribute hidden)
            }
        }
    }

  # aws_s3_bucket_versioning.demo will be destroyed
  - resource "aws_s3_bucket_versioning" "demo" {
      - bucket                = "siddhant-24bcs10153-tf-demo" -> null
      - id                    = "siddhant-24bcs10153-tf-demo" -> null
        # (1 unchanged attribute hidden)

      - versioning_configuration {
          - status     = "Enabled" -> null
            # (1 unchanged attribute hidden)
        }
    }

  # aws_s3_object.hello will be destroyed
  - resource "aws_s3_object" "hello" {
      - arn                           = "arn:aws:s3:::siddhant-24bcs10153-tf-demo/hello.txt" -> null
      - bucket                        = "siddhant-24bcs10153-tf-demo" -> null
      - bucket_key_enabled            = false -> null
      - content                       = "Hello from Terraform!" -> null
      - content_type                  = "text/plain" -> null
      - etag                          = "c57fe0cccf9e1237ea80aa663c90637b" -> null
      - force_destroy                 = false -> null
      - id                            = "hello.txt" -> null
      - key                           = "hello.txt" -> null
      - metadata                      = {} -> null
      - server_side_encryption        = "AES256" -> null
      - storage_class                 = "STANDARD" -> null
      - tags                          = {} -> null
      - tags_all                      = {} -> null
      - version_id                    = "AaEXVDhb0mYljmOzhblFdsVgCYbaBBdn" -> null
        # (13 unchanged attributes hidden)
    }

Plan: 0 to add, 0 to change, 5 to destroy.

Changes to Outputs:
  - bucket_arn        = "arn:aws:s3:::siddhant-24bcs10153-tf-demo" -> null
  - bucket_name       = "siddhant-24bcs10153-tf-demo" -> null
  - versioning_status = "Enabled" -> null
aws_s3_bucket_public_access_block.demo: Destroying... [id=siddhant-24bcs10153-tf-demo]
aws_s3_object.hello: Destroying... [id=hello.txt]
aws_s3_bucket_versioning.demo: Destroying... [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket_server_side_encryption_configuration.demo: Destroying... [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket_server_side_encryption_configuration.demo: Destruction complete after 0s
aws_s3_bucket_versioning.demo: Destruction complete after 0s
aws_s3_bucket_public_access_block.demo: Destruction complete after 0s
aws_s3_object.hello: Destruction complete after 0s
aws_s3_bucket.demo: Destroying... [id=siddhant-24bcs10153-tf-demo]
aws_s3_bucket.demo: Destruction complete after 0s

Destroy complete! Resources: 5 destroyed.
```

**Observed:** `plan` showed **5 to add**. `apply` created the bucket with versioning, AES256 encryption, a public-access block and a `hello.txt` object. `state list` shows the 5 resources tracked in `terraform.tfstate`, and the object was readable from the S3 API. `destroy` removed all 5.

## Task 2: AWS Services Research

| Service | README |
| --- | --- |
| IAM (Governance) | [aws-services/01-iam](aws-services/01-iam/README.md) |
| EC2 (Compute) | [aws-services/02-ec2](aws-services/02-ec2/README.md) |
| S3 (Storage) | [aws-services/03-s3](aws-services/03-s3/README.md) |
| VPC (Networking) | [aws-services/04-vpc](aws-services/04-vpc/README.md) |
| DynamoDB & RDS (Databases) | [aws-services/05-dynamodb-rds](aws-services/05-dynamodb-rds/README.md) |
