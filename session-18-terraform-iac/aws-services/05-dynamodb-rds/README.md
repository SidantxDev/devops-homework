# DynamoDB & RDS (Database Services)

## DynamoDB: managed NoSQL

| Concept | Meaning |
| --- | --- |
| **NoSQL** | Key-value and document database, no fixed schema, millisecond latency, serverless |
| **Tables** | Collections of items (no joins) |
| **Items** | One record (like a row), up to 400 KB |
| **Attributes** | The fields of an item. Each item can have different attributes |
| **Partition key** | Required key, hashed to choose the storage partition, for example `userId` |
| **Sort key** | Optional second key that orders items within a partition, for example `orderDate`, and enables range queries |
| **Use cases** | Shopping carts, sessions, leaderboards, IoT data, Terraform state locking |

## RDS: Relational Database Service

| Concept | Meaning |
| --- | --- |
| **Relational database** | SQL with a schema, joins and ACID transactions. AWS manages patching, backups and failover |
| **Supported engines** | MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Aurora |
| **DB instances** | Server size (`db.t3.micro` and up) plus storage (gp3/io2) |
| **Security** | Private subnets, Security Groups, KMS encryption, TLS, IAM auth, credentials in Secrets Manager |
| **Backups** | Automated snapshots with point-in-time restore (up to 35 days), plus manual snapshots |
| **Multi-AZ** | A synchronous standby in another AZ with automatic failover, for **high availability** |
| **Read replicas** | Asynchronous copies to **scale reads** and for disaster recovery |
| **Use cases** | Orders, banking, ERP/CRM, any app that needs relations and transactions |

| | DynamoDB | RDS |
| --- | --- | --- |
| Model | Key-value / document | Relational (SQL) |
| Schema | Flexible | Fixed |
| Scaling | Automatic, horizontal | Vertical + read replicas |
