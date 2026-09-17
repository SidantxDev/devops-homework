# Kubernetes Pods, ReplicaSets & Deployments

**Section:** Kubernetes Pods, ReplicaSets & Deployments

## Task 1: Create and Verify a Pod

**One-line description:** Deploy a simple Nginx pod and verify it is running.

**Command:**
```bash
kubectl run nginx-pod --image=nginx --restart=Never
kubectl get pods -o wide
kubectl describe pod nginx-pod
```

**Terminal output:**
```bash
NAME        READY   STATUS    RESTARTS   AGE
nginx-pod   1/1     Running   0          10s
```

**Screenshot:**
```text
![Pod running](./screenshots/01-pod-running.png)
```

---

## Task 2: ReplicaSet Check

**One-line description:** Ensure a ReplicaSet keeps the desired number of replicas alive.

**Command:**
```bash
kubectl create deployment web --image=nginx --replicas=3
kubectl get rs
kubectl get pods
```

**Terminal output:**
```bash
NAME   DESIRED   CURRENT   READY   AGE
web    3         3         3       10s
```

**Screenshot:**
```text
![ReplicaSet check](./screenshots/02-replicaset.png)
```

---

## Task 3: Deployment Rollout

**One-line description:** Verify that a Deployment manages rolling updates and keeps pods healthy.

**Commands:**
```bash
kubectl rollout status deployment/web
kubectl get deployment web
kubectl get pods
```

**Terminal output:**
```bash
deployment "web" successfully rolled out
```

**Screenshot:**
```text
![Deployment rollout](./screenshots/03-deployment-rollout.png)
```

---

## Task 4: Delete a Pod and Self-Healing

**One-line description:** Show that Kubernetes recreates a pod when one is deleted.

**Command:**
```bash
kubectl delete pod <pod-name>
kubectl get pods -w
```

**Terminal output:**
```bash
pod "<pod-name>" deleted
new pod created
```

**Screenshot:**
```text
![Pod self-healing](./screenshots/04-self-healing.png)
```

---

## Concepts

- `Pod`: the smallest unit that runs containers.
- `ReplicaSet`: ensures the required number of pod replicas are running.
- `Deployment`: a higher-level object for managing updates, rollout, and rollback.
- Kubernetes keeps the cluster self-healing by replacing failed or deleted pods.
