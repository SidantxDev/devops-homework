# IAM: Identity and Access Management (Governance)

**IAM** controls **who** (authentication) can do **what** (authorization) on **which** AWS resources. It is global (not tied to a region) and free.

| Concept | Meaning |
| --- | --- |
| **Users** | A person or application with long-term credentials (password and/or access keys) |
| **Groups** | A collection of users. Attach policies to the group instead of to each user (for example `Developers`, `Admins`) |
| **Roles** | An identity with **temporary** credentials that is *assumed* by an AWS service (EC2, Lambda), another account, or a federated user. No long-term keys |
| **Policies** | JSON documents with `Effect` (Allow/Deny), `Action`, `Resource` and an optional `Condition`. Types: AWS-managed, customer-managed, inline, resource-based (for example S3 bucket policies) |
| **Permissions** | Everything is **denied by default**. An explicit `Allow` grants access, and an explicit `Deny` always wins |
| **Least privilege** | Grant only the exact actions and resources needed, and nothing more |

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::siddhant-24bcs10153-tf-demo/*"
  }]
}
```

## Best practices
- Don't use the **root** account for daily work. Enable **MFA** on it.
- Use **roles** (temporary credentials) for EC2, Lambda and CI/CD (for example GitHub Actions OIDC), not access keys.
- Manage permissions through **groups**. Rotate keys and remove unused users.
- Use **least privilege** and conditions (IP, MFA, tags), and SCPs in AWS Organizations.
- Turn on **CloudTrail** to audit every API call.

## Common use cases
An EC2 instance role to read from S3 · developers with read-only production access · cross-account access for an auditing account · CI/CD pipelines deploying through an assumed role.
