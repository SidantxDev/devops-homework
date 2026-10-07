output "bucket_name" {
  value = aws_s3_bucket.demo.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.demo.arn
}

output "versioning_status" {
  value = aws_s3_bucket_versioning.demo.versioning_configuration[0].status
}
