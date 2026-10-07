# VPC: Virtual Private Cloud (Networking)

A **VPC** is your own isolated private network inside an AWS region. [Session 19](../../../session-19-cloud-terraform/README.md) builds one with Terraform.

| Concept | Meaning |
| --- | --- |
| **CIDR** | The VPC's IP range, for example `10.0.0.0/16` (65,536 addresses). Subnets take smaller blocks such as `10.0.1.0/24` |
| **Subnets** | A slice of the VPC in **one Availability Zone**. Spread them across AZs for high availability |
| **Route tables** | Rules saying where traffic goes (`0.0.0.0/0 → igw`). Each subnet is associated with one |
| **Internet Gateway** | Connects the VPC to the internet, in both directions |
| **NAT Gateway** | Lets **private** subnets reach the internet **outbound only** |
| **Security Groups** | **Stateful** instance-level firewalls. Allow rules only |
| **Network ACLs** | **Stateless** subnet-level firewalls. Allow **and** deny rules, evaluated in numbered order |
| **Public vs private subnet** | **Public**: its route table sends `0.0.0.0/0` to the IGW (web servers, load balancers). **Private**: internet only through a NAT (apps, databases) |

```text
VPC 10.0.0.0/16
├── Public subnet 10.0.1.0/24  ── 0.0.0.0/0 ──► Internet Gateway
└── Private subnet 10.0.2.0/24 ── 0.0.0.0/0 ──► NAT Gateway
```
