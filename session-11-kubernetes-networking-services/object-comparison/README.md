# Task 2: Kubernetes Object Comparison

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

---

## 1. Deployment vs ReplicaSet

| | ReplicaSet | Deployment |
| --- | --- | --- |
| **Purpose** | Keep **N identical Pods** running at all times | Manage an application's **lifecycle**: versions, updates, rollbacks |
| **Pod management** | Creates and deletes Pods directly to match `replicas` | Does **not** manage Pods directly. It creates and manages **ReplicaSets**, and they manage the Pods |
| **Scaling** | `kubectl scale rs ... --replicas=N` | `kubectl scale deployment ... --replicas=N` (passed down to the current ReplicaSet) |
| **Rolling updates** | **No.** Changing the Pod template does not update running Pods | **Yes.** A template change creates a new ReplicaSet and gradually moves Pods across (`maxSurge`, `maxUnavailable`) |
| **Rollback** | No | `kubectl rollout undo` (old ReplicaSets are kept at 0 replicas) |
| **Used directly?** | Rarely | Yes, this is the normal way to run stateless apps |

**Relationship:**

```text
Deployment (web)
 ├── ReplicaSet web-86c95794b5   (revision 1, old)  replicas: 0
 └── ReplicaSet web-6878bdfb86   (revision 2, current) replicas: 4
       ├── Pod web-6878bdfb86-6bbq6
       ├── Pod web-6878bdfb86-qsk2l
       └── ...
```

The ReplicaSet name is the Deployment name plus a **hash of the Pod template**. You can see this in the [Session 10 rolling update](../../session-10-kubernetes-pods-replicasets-deployments/README.md), where `kubectl get rs` showed the old ReplicaSet at `0` and the new one at `4`.

---

## 2. Deployment vs DaemonSet vs StatefulSet

| | Deployment | DaemonSet | StatefulSet |
| --- | --- | --- | --- |
| **Use cases** | Stateless apps: web servers, APIs, frontends | One agent **per node**: log collectors, monitoring agents, CNI, `kube-proxy` | Stateful apps: databases (MySQL, PostgreSQL), Kafka, ZooKeeper, Elasticsearch |
| **Pod creation** | All at once (in parallel), with random names (`web-6878bdfb86-x4pd5`) | Exactly **one Pod on each node**, and a new node automatically gets one | **In order**, one at a time (`db-0`, then `db-1`, then `db-2`), deleted in reverse order |
| **Pod identity** | Interchangeable, so any Pod can replace another | Tied to its node | **Stable, sticky identity**: `db-0` is always `db-0`, even after a restart |
| **Scaling** | `replicas: N`, scales freely | Not by replica count. It follows the **number of nodes** (or a `nodeSelector`) | `replicas: N`, scales in order (adds `db-3`, removes the highest ordinal first) |
| **Networking** | One Service load-balances to any Pod | Often `hostNetwork` or `hostPort` to reach node-level resources | Needs a **Headless Service**, so each Pod gets its own DNS name: `db-0.db-svc.default.svc.cluster.local` |
| **Storage** | Usually none, or one shared volume | Usually `hostPath` (for example `/var/log`) | **`volumeClaimTemplates`**: each Pod gets **its own PVC**, which stays attached to the same Pod after a restart |
| **Examples** | `nginx`, a Node.js API, React frontend | `fluentd`, `node-exporter`, `kube-proxy`, `kindnet` | `mysql`, `mongodb`, `redis` cluster, `kafka` |

**On my cluster:** `kubectl get ds -n kube-system` shows `kube-proxy` and `kindnet` as DaemonSets, one Pod per node, while `coredns` runs as a Deployment.

---

## 3. ReplicaSet vs Service

They solve **different** problems and work together:

| | ReplicaSet | Service |
| --- | --- | --- |
| **Responsibility** | **Keep Pods alive.** Makes sure N Pods are always running | **Give Pods a stable address.** Provides one IP and DNS name and **load-balances** across them |
| **Layer** | Compute (how many copies run) | Networking (how traffic reaches them) |
| **Connects to Pods by** | Label selector (owns the Pods) | Label selector (only routes to them, does not own them) |
| **If a Pod dies** | Creates a new Pod (with a **new IP**) | Automatically updates its endpoints to the new Pod IP |

### Why is a Service required?

Pods are **ephemeral**. Every time a ReplicaSet replaces a Pod, the new one gets a **different IP**, and when it scales there are more or fewer IPs. Clients cannot keep track of that list themselves. A Service provides:
1. **A stable virtual IP (ClusterIP) and DNS name** that never change.
2. **Load balancing** across all healthy Pods.
3. **Service discovery** through DNS (`web-clusterip.default.svc.cluster.local`).
4. **Readiness-aware routing**, so Pods that are not ready get no traffic.

### How traffic reaches Pods

```text
client Pod
   │  1. DNS: "web-clusterip" ──► CoreDNS ──► 10.111.77.60 (ClusterIP)
   ▼
ClusterIP 10.111.77.60:80        (virtual: no process listens on it)
   │  2. kube-proxy has written iptables/IPVS rules on every node
   │     that DNAT the ClusterIP to one of the endpoints at random
   ▼
EndpointSlice: 10.244.0.116:80, 10.244.0.117:80, 10.244.0.118:80
   │  3. kept up to date by the EndpointSlice controller using the
   │     Service's label selector + Pod readiness
   ▼
Pod (container port = targetPort 80)
```

In [Task 1](../README.md), 30 requests through the LoadBalancer were spread **10 / 10 / 10** across the 3 Pods that the ReplicaSet keeps alive.
