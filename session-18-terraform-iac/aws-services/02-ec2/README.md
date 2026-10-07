# EC2: Elastic Compute Cloud (Compute)

**EC2** provides resizable **virtual machines (instances)** in the cloud, billed per second.

| Concept | Meaning |
| --- | --- |
| **AMI** | Amazon Machine Image: the template (OS plus software) an instance boots from, for example Amazon Linux 2023 or Ubuntu 24.04 |
| **Instance types** | CPU/RAM sizes by family: `t3` (burstable), `m` (general), `c` (compute), `r` (memory), `g/p` (GPU). For example `t3.micro` = 2 vCPU, 1 GiB |
| **Key pairs** | Public/private SSH keys. AWS keeps the public key, and you keep the `.pem` to `ssh -i key.pem ec2-user@ip` |
| **Security Groups** | A **stateful** virtual firewall at the instance level. Allow rules only (for example 22 from my IP, 80/443 from anywhere) |
| **EBS** | Elastic Block Store: network disks (gp3, io2) attached to an instance. They persist independently of the instance and support snapshots |
| **Public vs private IP** | Every instance gets a **private IP** inside the VPC. A **public IP** (or a static Elastic IP) is needed for internet access in a public subnet |
| **Instance lifecycle** | pending → running → stopping → stopped → running, or shutting-down → terminated. A stopped instance is not billed for compute, but its EBS still is |

**Pricing:** On-Demand · Reserved/Savings Plans (up to about 72% cheaper) · Spot (up to 90% cheaper, can be interrupted). **User data:** a script that runs at first boot.

## Common use cases
Web and app servers · CI build agents · batch jobs · bastion hosts · Kubernetes worker nodes (EKS) · Auto Scaling groups behind a load balancer.
