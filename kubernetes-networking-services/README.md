# Kubernetes Networking & Services

**Section:** Kubernetes Networking & Services

## Task 1: Service Basics

**One-line description:** Expose an application with a Kubernetes Service.

**Command:**
```bash
kubectl expose deployment web --type=NodePort --port=80 --target-port=80
kubectl get svc
kubectl get endpoints
```

**Terminal output:**
```bash
NAME   TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
web    NodePort   10.96.123.45   <none>        80:30000/TCP   10s
```

**Screenshot:**
```text
![Service exposure](./screenshots/01-service.png)
```

---

## Task 2: Understand Ports

**One-line description:** Explain the difference between `port`, `targetPort`, and `nodePort`.

**Key concept:**
- `port`: port exposed by the Service
- `targetPort`: port on the Pod container
- `nodePort`: external port exposed on each node

**Example:**
```yaml
ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080
```

**Screenshot:**
```text
![Port mapping diagram](./screenshots/02-port-mapping.png)
```

---

## Task 3: ClusterIP and LoadBalancer

**One-line description:** Compare internal and external service exposure types.

**Commands:**
```bash
kubectl expose deployment web --type=ClusterIP --port=80
kubectl expose deployment web --type=LoadBalancer --port=80
kubectl get svc
```

**Terminal output:**
```bash
NAME   TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)
web    ClusterIP      10.96.10.10     <none>        80/TCP
web    LoadBalancer   10.96.10.20    <pending>     80:32000/TCP
```

**Screenshot:**
```text
![Service types](./screenshots/03-service-types.png)
```

---

## Task 4: Route Traffic to Pods

**One-line description:** Show how a Service selects pods using labels.

**Concept:**
- Labels identify pods.
- Selectors match labels to route traffic.

**Example:**
```yaml
selector:
  app: web
```

**Screenshot:**
```text
![Service selector](./screenshots/04-selector.png)
```

---

## Summary

Kubernetes networking uses Services to abstract pod IPs and expose them internally or externally. Services rely on labels and selectors to route traffic to the correct Pods.
