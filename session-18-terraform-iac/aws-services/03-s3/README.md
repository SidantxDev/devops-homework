# S3: Simple Storage Service (Storage)

**S3** is object storage with practically unlimited capacity and 11 nines of durability. The bucket I created with Terraform is in [Task 1](../../README.md).

| Concept | Meaning |
| --- | --- |
| **Buckets** | Containers for objects. The name must be **globally unique**. A bucket lives in one region |
| **Objects** | A file plus metadata, identified by a **key** (for example `images/logo.png`). Up to 5 TB each |
| **Storage classes** | Standard · Intelligent-Tiering · Standard-IA · One Zone-IA · Glacier Instant/Flexible · Glacier Deep Archive (cheapest) |
| **Versioning** | Keeps every version of an object, which protects against overwrites and deletes. Enabled in my Terraform demo |
| **Lifecycle policies** | Move objects to cheaper classes or expire them automatically, for example to IA after 30 days, Glacier after 90 and deleted after 365 |
| **Encryption** | SSE-S3 (AES256, the default, used in my demo), SSE-KMS, SSE-C or client-side, plus HTTPS in transit |
| **Bucket policies** | Resource-based JSON policies. **Block Public Access** (enabled in my demo) prevents accidental public buckets |

## Common use cases
Static websites · backups and archives · data lakes · Terraform remote state · CI/CD artifacts · media behind CloudFront · logs.
