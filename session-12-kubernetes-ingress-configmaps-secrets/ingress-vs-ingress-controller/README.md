# Task 4: Ingress vs Ingress Controller

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

## What is an Ingress?

An **Ingress** is a Kubernetes **API object (a set of rules)** that describes **how external HTTP/HTTPS traffic should reach Services** inside the cluster:

- **Host-based routing:** `app1.demo.local` → `app1-svc`
- **Path-based routing:** `demo.local/app2` → `app2-svc`
- **TLS termination:** HTTPS certificates for hostnames
- Rewrites, redirects, and similar rules, via annotations

It is only **configuration**. On its own, an Ingress object does **nothing**: no process reads it and no port is opened.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-ingress
spec:
  ingressClassName: nginx        # which controller should implement these rules
  rules:
    - host: demo.local
      http:
        paths:
          - path: /app1
            pathType: Prefix
            backend:
              service: {name: app1-svc, port: {number: 80}}
```

## What is an Ingress Controller?

An **Ingress Controller** is the **actual software (a running Pod)** that:

1. **Watches** the Kubernetes API for Ingress objects (and the Services and endpoints they point to).
2. **Translates** those rules into the configuration of a real reverse proxy or load balancer (for example `nginx.conf`).
3. **Receives** the incoming traffic (through a LoadBalancer or NodePort Service) and **forwards** it to the right Pods.

Kubernetes does **not** ship one by default, so you have to install one. On Minikube, `minikube addons enable ingress` installs the **NGINX Ingress Controller**:

```text
$ kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller
NAME                                       READY   STATUS    RESTARTS        AGE
ingress-nginx-controller-d7cd8c989-t4zzg   1/1     Running   150 (58m ago)   19d
$ kubectl get ingressclass
NAME              CONTROLLER             PARAMETERS   AGE
nginx (default)   k8s.io/ingress-nginx   <none>       19d
```

## Difference between them

| | Ingress | Ingress Controller |
| --- | --- | --- |
| **What it is** | A Kubernetes **resource** (YAML rules) | A **program** running as Pods (Deployment or DaemonSet) |
| **Role** | Says *what* should happen ("send `/app1` to `app1-svc`") | Makes it *actually* happen (proxies the packets) |
| **Analogy** | The **traffic rules** / route map | The **traffic police** who enforce them |
| **Created by** | App developers, one per app or route | Cluster admins, usually once per cluster |
| **Built into Kubernetes?** | Yes, the API type exists in every cluster | **No**, it must be installed |
| **Without the other** | Rules exist but are ignored, so no traffic flows and there is no ADDRESS | Running proxy with nothing to route, so it returns 404 (default backend) |
| **Linked by** | `spec.ingressClassName: nginx` | `IngressClass` named `nginx` → controller `k8s.io/ingress-nginx` |
| **Examples** | `demo-ingress`, `host-ingress` in this session | NGINX Ingress, Traefik, HAProxy, Kong, Istio Gateway, AWS Load Balancer Controller, GKE Ingress |

## Why both are required

- **The Ingress alone** is just data stored in etcd. Kubernetes has no built-in HTTP proxy that reads it.
- **The controller alone** has nothing to do. It only knows which hosts and paths to route because developers create Ingress objects.
- **Together:** Developers declare routing **declaratively**, next to their apps, while operators run a single, shared, production-grade proxy. This separation means:
  - **one** external IP or load balancer for many Services (cheaper than one LoadBalancer per Service)
  - **L7 features** such as host and path routing, TLS, rewrites and rate limiting
  - **swappable** implementations: you can switch from NGINX to Traefik without changing the Ingress YAML (apart from controller-specific annotations)

## Examples

**Request flow in my demo:**

```text
curl -H "Host: demo.local" http://127.0.0.1/app1
  │
  ▼  minikube tunnel → ingress-nginx-controller Service
NGINX Ingress Controller Pod  (generated nginx.conf from the Ingress rules)
  │  rule: host demo.local + path /app1  → app1-svc:80
  ▼
app1-svc (ClusterIP) → app1 Pod 10.244.0.124:5678 → "Hello from APP 1"
```

The controller's access log shows this directly:

```text
"GET /app1 HTTP/1.1" 200 ... [default-app1-svc-80] [] 10.244.0.124:5678
"GET /app3 HTTP/1.1" 404 ... [upstream-default-backend] [] 127.0.0.1:8181
```

**Proof that the controller does the work:** Every Ingress got `ADDRESS 192.168.49.2` only because the controller picked it up and wrote that status back. In the [troubleshooting](../troubleshooting/README.md) scenarios, the Ingress object was valid, but the controller returned **503** because the backend Service was missing or had no endpoints. The rules exist; the controller is what actually serves the traffic.
