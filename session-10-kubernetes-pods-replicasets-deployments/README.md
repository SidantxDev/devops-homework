# Session 10: Kubernetes Pods, ReplicaSets & Deployments

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

Cluster: Minikube (Kubernetes v1.37.0). A helper pod `curl-client` (`curlimages/curl`) was used to send HTTP requests to Services from inside the cluster.

```text
session-10-kubernetes-pods-replicasets-deployments/
├── deployment-strategies/
│   ├── 01-rolling-update/deployment.yaml
│   ├── 02-blue-green/{blue,green,service}.yaml
│   ├── 03-canary/{stable,canary,service}.yaml
│   └── 04-recreate/deployment.yaml
└── pod-lifecycle/
    ├── 01-pending-pod.yaml
    ├── 02-running-pod.yaml
    ├── 03-succeeded-pod.yaml
    ├── 04-failed-pod.yaml
    ├── 05-crashloop-pod.yaml
    ├── 06-init-container-pod.yaml
    ├── 07-lifecycle-hooks-probes-pod.yaml
    └── 08-image-pull-error-pod.yaml
```

### Pod → ReplicaSet → Deployment

- **Pod:** One or more containers. If it dies, nothing replaces it on its own.
- **ReplicaSet:** Keeps a fixed number of identical Pods running and replaces any that die.
- **Deployment:** Manages ReplicaSets. Each new version gets a new ReplicaSet, which is what makes rolling updates, rollbacks and update strategies possible.

---

# Task 1: Deployment Strategies

| Strategy | How it works | Downtime | Extra resources | Rollback |
| --- | --- | --- | --- | --- |
| **Rolling Update** | Replaces Pods a few at a time | None | Small (`maxSurge`) | `kubectl rollout undo` |
| **Blue-Green** | Two full versions run side by side, and the Service switches between them | None | 2× | Switch the selector back (instant) |
| **Canary** | A small share of Pods runs the new version and gets a matching share of traffic | None | Small | Delete the canary |
| **Recreate** | Kill all old Pods, then start new ones | **Yes** | None | Redeploy |

## 01. Rolling Update

[deployment.yaml](deployment-strategies/01-rolling-update/deployment.yaml): 4 replicas of `nginx:1.26-alpine`, `strategy: RollingUpdate` with `maxSurge: 1`, `maxUnavailable: 1`, and a readiness probe so traffic only goes to ready Pods.

```bash
$ kubectl apply -f 01-rolling-update/deployment.yaml
deployment.apps/rolling-app created
$ kubectl rollout status deployment/rolling-app --timeout=120s
Waiting for deployment "rolling-app" rollout to finish: 0 of 4 updated replicas are available...
Waiting for deployment "rolling-app" rollout to finish: 1 of 4 updated replicas are available...
Waiting for deployment "rolling-app" rollout to finish: 2 of 4 updated replicas are available...
Waiting for deployment "rolling-app" rollout to finish: 3 of 4 updated replicas are available...
deployment "rolling-app" successfully rolled out
$ kubectl get deployment rolling-app -o wide
NAME          READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES              SELECTOR
rolling-app   4/4     4            4           3s    web          nginx:1.26-alpine   app=rolling-app
$ kubectl get pods -l app=rolling-app -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,STATUS:.status.phase
NAME                           IMAGE               STATUS
rolling-app-86c95794b5-4lqsz   nginx:1.26-alpine   Running
rolling-app-86c95794b5-fkfr8   nginx:1.26-alpine   Running
rolling-app-86c95794b5-h8lxg   nginx:1.26-alpine   Running
rolling-app-86c95794b5-kc6z4   nginx:1.26-alpine   Running
$ kubectl describe deployment rolling-app | grep -E "StrategyType|RollingUpdateStrategy"
StrategyType:           RollingUpdate
RollingUpdateStrategy:  1 max unavailable, 1 max surge
$ kubectl set image deployment/rolling-app web=nginx:1.27-alpine && kubectl annotate deployment/rolling-app kubernetes.io/change-cause="update nginx 1.26 -> 1.27" --overwrite
deployment.apps/rolling-app image updated
deployment.apps/rolling-app annotated
$ kubectl get pods -l app=rolling-app -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,READY:.status.containerStatuses[0].ready
NAME                           IMAGE               READY
rolling-app-6878bdfb86-42fqr   nginx:1.27-alpine   false
rolling-app-6878bdfb86-jmdz4   nginx:1.27-alpine   false
rolling-app-6878bdfb86-vvxdz   nginx:1.27-alpine   true
rolling-app-86c95794b5-4lqsz   nginx:1.26-alpine   false
rolling-app-86c95794b5-fkfr8   nginx:1.26-alpine   false
rolling-app-86c95794b5-h8lxg   nginx:1.26-alpine   true
rolling-app-86c95794b5-kc6z4   nginx:1.26-alpine   true
$ kubectl rollout status deployment/rolling-app --timeout=120s
Waiting for deployment "rolling-app" rollout to finish: 3 out of 4 new replicas have been updated...
Waiting for deployment "rolling-app" rollout to finish: 3 out of 4 new replicas have been updated...
Waiting for deployment "rolling-app" rollout to finish: 3 out of 4 new replicas have been updated...
Waiting for deployment "rolling-app" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "rolling-app" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "rolling-app" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "rolling-app" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "rolling-app" rollout to finish: 3 of 4 updated replicas are available...
Waiting for deployment "rolling-app" rollout to finish: 3 of 4 updated replicas are available...
deployment "rolling-app" successfully rolled out
$ kubectl get rs -l app=rolling-app
NAME                     DESIRED   CURRENT   READY   AGE
rolling-app-6878bdfb86   4         4         4       22s
rolling-app-86c95794b5   0         0         0       27s
$ kubectl get pods -l app=rolling-app -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,STATUS:.status.phase
NAME                           IMAGE               STATUS
rolling-app-6878bdfb86-42fqr   nginx:1.27-alpine   Running
rolling-app-6878bdfb86-7v552   nginx:1.27-alpine   Running
rolling-app-6878bdfb86-jmdz4   nginx:1.27-alpine   Running
rolling-app-6878bdfb86-vvxdz   nginx:1.27-alpine   Running
$ kubectl rollout history deployment/rolling-app
deployment.apps/rolling-app 
REVISION  CHANGE-CAUSE
1         <none>
2         update nginx 1.26 -> 1.27

$ kubectl describe deployment rolling-app | sed -n '/Events:/,$p'
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  27s   deployment-controller  Scaled up replica set rolling-app-86c95794b5 from 0 to 4
  Normal  ScalingReplicaSet  22s   deployment-controller  Scaled up replica set rolling-app-6878bdfb86 from 0 to 1
  Normal  ScalingReplicaSet  22s   deployment-controller  Scaled down replica set rolling-app-86c95794b5 from 4 to 3
  Normal  ScalingReplicaSet  22s   deployment-controller  Scaled up replica set rolling-app-6878bdfb86 from 1 to 2
  Normal  ScalingReplicaSet  21s   deployment-controller  Scaled down replica set rolling-app-86c95794b5 from 3 to 2
  Normal  ScalingReplicaSet  21s   deployment-controller  Scaled up replica set rolling-app-6878bdfb86 from 2 to 3
  Normal  ScalingReplicaSet  19s   deployment-controller  Scaled down replica set rolling-app-86c95794b5 from 2 to 1
  Normal  ScalingReplicaSet  19s   deployment-controller  Scaled up replica set rolling-app-6878bdfb86 from 3 to 4
  Normal  ScalingReplicaSet  17s   deployment-controller  Scaled down replica set rolling-app-86c95794b5 from 1 to 0
$ kubectl delete -f 01-rolling-update/deployment.yaml
deployment.apps "rolling-app" deleted from default namespace
```

**Verified old and new Pods:** Right after `set image`, old `1.26` Pods (ReplicaSet `86c95794b5`) and new `1.27` Pods (ReplicaSet `6878bdfb86`) were running **at the same time**. The events show the new ReplicaSet scaling **up** 0→1→2→3→4 while the old one scales **down** 4→3→2→1→0, so the app was never fully down. The old ReplicaSet is kept with 0 replicas so that a rollback is possible.

## 02. Blue-Green Deployment

[blue.yaml](deployment-strategies/02-blue-green/blue.yaml) · [green.yaml](deployment-strategies/02-blue-green/green.yaml) · [service.yaml](deployment-strategies/02-blue-green/service.yaml)

Both versions run all the time. The Service's `selector` (`version: blue` or `version: green`) decides which one receives **100%** of the traffic.

```bash
$ kubectl apply -f 02-blue-green/blue.yaml -f 02-blue-green/green.yaml -f 02-blue-green/service.yaml
deployment.apps/app-blue created
deployment.apps/app-green created
service/bg-app created
$ kubectl rollout status deployment/app-blue --timeout=120s && kubectl rollout status deployment/app-green --timeout=120s
Waiting for deployment "app-blue" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "app-blue" rollout to finish: 1 of 2 updated replicas are available...
deployment "app-blue" successfully rolled out
deployment "app-green" successfully rolled out
$ kubectl get pods -l app=bg-app -L version
NAME                        READY   STATUS    RESTARTS   AGE   VERSION
app-blue-7997bc89d7-5h4kd   1/1     Running   0          2s    blue
app-blue-7997bc89d7-lmsx2   1/1     Running   0          2s    blue
app-green-fcc5f56d8-fqndx   1/1     Running   0          2s    green
app-green-fcc5f56d8-t99r9   1/1     Running   0          2s    green
$ kubectl get svc bg-app -o jsonpath='Service selector: {.spec.selector}{"\n"}'
Service selector: {"app":"bg-app","version":"blue"}
$ for i in 1 2 3; do kubectl exec curl-client -- curl -s http://bg-app; done
BLUE version (v1)
BLUE version (v1)
BLUE version (v1)
$ kubectl patch service bg-app -p '{"spec":{"selector":{"app":"bg-app","version":"green"}}}'
service/bg-app patched
$ kubectl get svc bg-app -o jsonpath='Service selector: {.spec.selector}{"\n"}'
Service selector: {"app":"bg-app","version":"green"}
$ kubectl get endpointslices -l kubernetes.io/service-name=bg-app -o custom-columns=NAME:.metadata.name,ENDPOINTS:.endpoints[*].addresses[0]
NAME           ENDPOINTS
bg-app-wgvd7   10.244.0.66,10.244.0.65
$ kubectl get pods -l version=green -o wide | awk '{print $1, $6}'
NAME IP
app-green-fcc5f56d8-fqndx 10.244.0.65
app-green-fcc5f56d8-t99r9 10.244.0.66
$ for i in 1 2 3; do kubectl exec curl-client -- curl -s http://bg-app; done
GREEN version (v2)
GREEN version (v2)
GREEN version (v2)
$ kubectl patch service bg-app -p '{"spec":{"selector":{"app":"bg-app","version":"blue"}}}'
service/bg-app patched
$ kubectl exec curl-client -- curl -s http://bg-app
BLUE version (v1)
$ kubectl delete -f 02-blue-green/
deployment.apps "app-blue" deleted from default namespace
deployment.apps "app-green" deleted from default namespace
service "bg-app" deleted from default namespace
```

**Verified active version:** With the selector set to `blue`, every request returned `BLUE version (v1)`. After a single `kubectl patch` to `green`, the Service endpoints changed to the green Pod IPs (`10.244.0.65`, `10.244.0.66`) and every request returned `GREEN version (v2)`. Switching back was just as instant, which is the main benefit of blue-green.

## 03. Canary Deployment

[stable.yaml](deployment-strategies/03-canary/stable.yaml) (9 replicas) · [canary.yaml](deployment-strategies/03-canary/canary.yaml) (1 replica) · [service.yaml](deployment-strategies/03-canary/service.yaml)

The Service selects only `app: canary-app`, so it load-balances across **both** tracks. The traffic split follows the number of Pods: 1 canary out of 10 Pods ≈ **10%**.

```bash
$ kubectl apply -f 03-canary/stable.yaml -f 03-canary/service.yaml
deployment.apps/app-stable created
service/canary-app created
$ kubectl rollout status deployment/app-stable --timeout=120s
Waiting for deployment "app-stable" rollout to finish: 0 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 1 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 2 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 3 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 4 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 5 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 6 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 7 of 9 updated replicas are available...
Waiting for deployment "app-stable" rollout to finish: 8 of 9 updated replicas are available...
deployment "app-stable" successfully rolled out
$ kubectl exec curl-client -- sh -c 'for i in $(seq 1 20); do curl -s http://canary-app; done' | sort | uniq -c
     20 STABLE v1
$ kubectl apply -f 03-canary/canary.yaml
deployment.apps/app-canary created
$ kubectl rollout status deployment/app-canary --timeout=120s
Waiting for deployment "app-canary" rollout to finish: 0 of 1 updated replicas are available...
deployment "app-canary" successfully rolled out
$ kubectl get deployments -l '!x' -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,READY:.status.readyReplicas | grep -E "NAME|app-stable|app-canary"
NAME         REPLICAS   READY
app-canary   1          1
app-stable   9          9
$ kubectl get pods -l app=canary-app -L track --no-headers | awk '{print $6}' | sort | uniq -c
      1 canary
      9 stable
$ kubectl exec curl-client -- sh -c 'for i in $(seq 1 200); do curl -s http://canary-app; done' | sort | uniq -c
     22 CANARY v2
    178 STABLE v1
$ kubectl scale deployment app-canary --replicas=3 && kubectl scale deployment app-stable --replicas=7
deployment.apps/app-canary scaled
deployment.apps/app-stable scaled
$ kubectl rollout status deployment/app-canary --timeout=120s
Waiting for deployment "app-canary" rollout to finish: 1 of 3 updated replicas are available...
Waiting for deployment "app-canary" rollout to finish: 2 of 3 updated replicas are available...
deployment "app-canary" successfully rolled out
$ kubectl exec curl-client -- sh -c 'for i in $(seq 1 200); do curl -s http://canary-app; done' | sort | uniq -c
     57 CANARY v2
    143 STABLE v1
$ kubectl delete -f 03-canary/
deployment.apps "app-canary" deleted from default namespace
service "canary-app" deleted from default namespace
deployment.apps "app-stable" deleted from default namespace
```

**Verified both versions:**

| Pods (stable : canary) | Expected canary traffic | Measured (200 requests) |
| --- | --- | --- |
| 10 : 0 | 0% | 0 / 20 |
| 9 : 1 | 10% | **22 / 200 = 11%** |
| 7 : 3 | 30% | **57 / 200 = 28.5%** |

If the canary looks healthy, you keep moving traffic to it until it reaches 100%. If it fails, you delete it and only a small share of users were affected.

## 04. Recreate Deployment

[deployment.yaml](deployment-strategies/04-recreate/deployment.yaml): `strategy: type: Recreate`

```bash
$ kubectl apply -f 04-recreate/deployment.yaml
deployment.apps/recreate-app created
$ kubectl rollout status deployment/recreate-app --timeout=120s
Waiting for deployment "recreate-app" rollout to finish: 0 of 3 updated replicas are available...
Waiting for deployment "recreate-app" rollout to finish: 1 of 3 updated replicas are available...
Waiting for deployment "recreate-app" rollout to finish: 2 of 3 updated replicas are available...
deployment "recreate-app" successfully rolled out
$ kubectl describe deployment recreate-app | grep StrategyType
StrategyType:       Recreate
$ kubectl get pods -l app=recreate-app -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,STATUS:.status.phase
NAME                            IMAGE               STATUS
recreate-app-77b48ffc45-4v6bb   nginx:1.26-alpine   Running
recreate-app-77b48ffc45-8h54s   nginx:1.26-alpine   Running
recreate-app-77b48ffc45-svqp5   nginx:1.26-alpine   Running
$ kubectl set image deployment/recreate-app web=nginx:1.27-alpine
deployment.apps/recreate-app image updated
$ kubectl get pods -l app=recreate-app
NAME                            READY   STATUS        RESTARTS   AGE
recreate-app-77b48ffc45-4v6bb   1/1     Terminating   0          3s
recreate-app-77b48ffc45-8h54s   1/1     Terminating   0          3s
recreate-app-77b48ffc45-svqp5   1/1     Terminating   0          3s
$ kubectl get pods -l app=recreate-app
NAME                            READY   STATUS              RESTARTS   AGE
recreate-app-5c8bdcb4b8-gd9qw   0/1     ContainerCreating   0          1s
recreate-app-5c8bdcb4b8-rs2ww   0/1     ContainerCreating   0          1s
recreate-app-5c8bdcb4b8-wgfkl   0/1     ContainerCreating   0          1s
recreate-app-77b48ffc45-4v6bb   0/1     Completed           0          5s
recreate-app-77b48ffc45-8h54s   0/1     Completed           0          5s
recreate-app-77b48ffc45-svqp5   0/1     Completed           0          5s
$ kubectl rollout status deployment/recreate-app --timeout=120s
Waiting for deployment "recreate-app" rollout to finish: 0 of 3 updated replicas are available...
Waiting for deployment "recreate-app" rollout to finish: 1 of 3 updated replicas are available...
Waiting for deployment "recreate-app" rollout to finish: 2 of 3 updated replicas are available...
deployment "recreate-app" successfully rolled out
$ kubectl get pods -l app=recreate-app -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image,STATUS:.status.phase
NAME                            IMAGE               STATUS
recreate-app-5c8bdcb4b8-gd9qw   nginx:1.27-alpine   Running
recreate-app-5c8bdcb4b8-rs2ww   nginx:1.27-alpine   Running
recreate-app-5c8bdcb4b8-wgfkl   nginx:1.27-alpine   Running
$ kubectl describe deployment recreate-app | sed -n '/Events:/,$p'
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  8s    deployment-controller  Scaled up replica set recreate-app-77b48ffc45 from 0 to 3
  Normal  ScalingReplicaSet  5s    deployment-controller  Scaled down replica set recreate-app-77b48ffc45 from 3 to 0
  Normal  ScalingReplicaSet  4s    deployment-controller  Scaled up replica set recreate-app-5c8bdcb4b8 from 0 to 3
$ kubectl delete -f 04-recreate/deployment.yaml
deployment.apps "recreate-app" deleted from default namespace
```

**Observed:** Straight after the update, **all 3 old Pods were `Terminating`** and **no new Pod existed yet**. Only after they were gone did the 3 new Pods appear in `ContainerCreating`. The events confirm the order: old ReplicaSet `3 → 0` first, **then** new ReplicaSet `0 → 3`. Between those steps the app had **downtime**. Recreate is used when two versions must never run together, for example because of a database schema change.

---

# Task 2: Pod Lifecycle

A Pod's **phase** is one of `Pending → Running → Succeeded / Failed` (or `Unknown` if the node is unreachable). Each container also has a **state** (`Waiting`, `Running`, `Terminated`) with a **reason** such as `ContainerCreating`, `CrashLoopBackOff` or `ImagePullBackOff`.

For each YAML: **apply → check status → check details → capture output → explain.**

### 1. Pending: [01-pending-pod.yaml](pod-lifecycle/01-pending-pod.yaml)

```bash
$ kubectl apply -f 01-pending-pod.yaml
pod/pending-pod created
$ kubectl get pod pending-pod
NAME          READY   STATUS    RESTARTS   AGE
pending-pod   0/1     Pending   0          6s
$ kubectl describe pod pending-pod | sed -n '/^Status:/p;/^Conditions:/,/^Volumes:/p;/^Events:/,$p'
Status:           Pending
Conditions:
  Type           Status
  PodScheduled   False 
Volumes:
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  6s    default-scheduler  0/1 nodes are available: 1 Insufficient cpu. preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.
```

**Observed:** The Pod requests 100 CPUs, which no node has. The **scheduler** cannot place it, so `PodScheduled=False` and the Pod stays `Pending` forever. The event says why: `Insufficient cpu`.

### 2. Running: [02-running-pod.yaml](pod-lifecycle/02-running-pod.yaml)

```bash
$ kubectl apply -f 02-running-pod.yaml
pod/running-pod created
$ kubectl wait --for=condition=Ready pod/running-pod --timeout=60s
pod/running-pod condition met
$ kubectl get pod running-pod -o wide
NAME          READY   STATUS    RESTARTS   AGE   IP             NODE       NOMINATED NODE   READINESS GATES
running-pod   1/1     Running   0          1s    10.244.0.108   minikube   <none>           <none>
$ kubectl describe pod running-pod | sed -n '/^Status:/p;/    State:/,/Restart Count/p;/^Conditions:/,/^Volumes:/p'
Status:           Running
    State:          Running
      Started:      Wed, 07 Oct 2026 20:32:53 +0530
    Ready:          True
    Restart Count:  0
Conditions:
  Type                        Status
  PodReadyToStartContainers   True 
  Initialized                 True 
  Ready                       True 
  ContainersReady             True 
  PodScheduled                True 
Volumes:
```

**Observed:** The Pod went through every condition: `PodScheduled → PodReadyToStartContainers → Initialized → ContainersReady → Ready`. It has an IP, it was placed on `minikube`, and the container state is `Running`.

### 3. Succeeded: [03-succeeded-pod.yaml](pod-lifecycle/03-succeeded-pod.yaml)

```bash
$ kubectl apply -f 03-succeeded-pod.yaml
pod/succeeded-pod created
$ kubectl get pod succeeded-pod
NAME            READY   STATUS      RESTARTS   AGE
succeeded-pod   0/1     Completed   0          8s
$ kubectl get pod succeeded-pod -o jsonpath='phase={.status.phase}  exitCode={.status.containerStatuses[0].state.terminated.exitCode}  reason={.status.containerStatuses[0].state.terminated.reason}{"\n"}'
phase=Succeeded  exitCode=0  reason=Completed
$ kubectl logs succeeded-pod
Task finished successfully
```

**Observed:** The container ran its task and exited with **code 0**. With `restartPolicy: Never`, the Pod's phase becomes **`Succeeded`**, which `kubectl` shows as `Completed`. This is how Jobs behave.

### 4. Failed: [04-failed-pod.yaml](pod-lifecycle/04-failed-pod.yaml)

```bash
$ kubectl apply -f 04-failed-pod.yaml
pod/failed-pod created
$ kubectl get pod failed-pod
NAME         READY   STATUS   RESTARTS   AGE
failed-pod   0/1     Error    0          8s
$ kubectl get pod failed-pod -o jsonpath='phase={.status.phase}  exitCode={.status.containerStatuses[0].state.terminated.exitCode}  reason={.status.containerStatuses[0].state.terminated.reason}{"\n"}'
phase=Failed  exitCode=1  reason=Error
$ kubectl logs failed-pod
Something went wrong
```

**Observed:** It exited with **code 1** and was not restarted, so the phase is **`Failed`** (shown as `Error`). The logs show what went wrong.

### 5. CrashLoopBackOff: [05-crashloop-pod.yaml](pod-lifecycle/05-crashloop-pod.yaml)

```bash
$ kubectl apply -f 05-crashloop-pod.yaml
pod/crashloop-pod created
$ kubectl get pod crashloop-pod
NAME            READY   STATUS    RESTARTS      AGE
crashloop-pod   1/1     Running   4 (61s ago)   106s
$ kubectl describe pod crashloop-pod | sed -n '/    State:/,/Restart Count/p;/^Events:/,$p'
    State:          Running
      Started:      Wed, 07 Oct 2026 20:34:55 +0530
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
      Started:      Wed, 07 Oct 2026 20:33:53 +0530
      Finished:     Wed, 07 Oct 2026 20:33:55 +0530
    Ready:          True
    Restart Count:  4
Events:
  Type     Reason     Age                 From               Message
  ----     ------     ----                ----               -------
  Normal   Scheduled  106s                default-scheduler  Successfully assigned default/crashloop-pod to minikube
  Warning  BackOff    61s (x3 over 100s)  kubelet            Back-off restarting failed container app in pod crashloop-pod_default(4758cf87-6b2c-4228-9cfa-2f1bda981cbe)
  Normal   Pulled     1s (x5 over 105s)   kubelet            Container image "busybox:1.36" already present on machine and can be accessed by the pod
  Normal   Created    1s (x5 over 105s)   kubelet            Container created
  Normal   Started    1s (x5 over 105s)   kubelet            Container started
$ kubectl logs crashloop-pod
Starting...
```

**Observed:** With `restartPolicy: Always`, the kubelet keeps restarting the crashing container (`Restart Count: 4`, `Last State: Terminated, Exit Code 1`). The `BackOff: Back-off restarting failed container` event shows the **CrashLoopBackOff** behaviour: the wait between restarts doubles each time (10s → 20s → 40s → … up to 5 min). On this Kubernetes version (1.37), `STATUS` shows `Error` (or briefly `Running`) between restarts rather than the words `CrashLoopBackOff`, but the back-off events are the same.

### 6. Init container: [06-init-container-pod.yaml](pod-lifecycle/06-init-container-pod.yaml)

```bash
$ kubectl apply -f 06-init-container-pod.yaml
pod/init-container-pod created
$ kubectl get pod init-container-pod
NAME                 READY   STATUS     RESTARTS   AGE
init-container-pod   0/1     Init:0/1   0          3s
$ kubectl get pod init-container-pod
NAME                 READY   STATUS    RESTARTS   AGE
init-container-pod   1/1     Running   0          12s
$ kubectl logs init-container-pod -c wait-a-bit
Init: preparing...
Init done
$ kubectl describe pod init-container-pod | sed -n '/^Init Containers:/,/Restart Count/p' | grep -E "Init Containers|wait-a-bit:|State|Reason|Exit Code"
Init Containers:
  wait-a-bit:
    State:          Terminated
      Reason:       Completed
      Exit Code:    0
```

**Observed:** `Init:0/1` means the init container is still running. The main `nginx` container does **not** start until the init container finishes with `Completed, Exit Code 0`. Init containers are used for setup work, such as waiting for a database or downloading config.

### 7. Lifecycle hooks and probes: [07-lifecycle-hooks-probes-pod.yaml](pod-lifecycle/07-lifecycle-hooks-probes-pod.yaml)

```bash
$ kubectl apply -f 07-lifecycle-hooks-probes-pod.yaml
pod/hooks-probes-pod created
$ kubectl get pod hooks-probes-pod
NAME               READY   STATUS    RESTARTS   AGE
hooks-probes-pod   0/1     Running   0          3s
$ kubectl get pod hooks-probes-pod
NAME               READY   STATUS    RESTARTS   AGE
hooks-probes-pod   1/1     Running   0          5s
$ kubectl exec hooks-probes-pod -- cat /usr/share/nginx/html/hook.txt
postStart hook ran
$ kubectl describe pod hooks-probes-pod | grep -E "Liveness|Readiness|PostStart|PreStop"
    Liveness:       http-get http://:80/ delay=5s timeout=1s period=5s #success=1 #failure=3
    Readiness:      http-get http://:80/ delay=3s timeout=1s period=3s #success=1 #failure=3
$ kubectl delete pod hooks-probes-pod --wait=false
pod "hooks-probes-pod" deleted from default namespace
$ kubectl get pod hooks-probes-pod
NAME               READY   STATUS        RESTARTS   AGE
hooks-probes-pod   1/1     Terminating   0          5s
```

**Observed:**
- At first the Pod was `Running` but `0/1` ready. The **readiness probe** had not passed yet, so a Service would not send it traffic. A moment later it became `1/1`.
- The **postStart** hook ran right after the container started and wrote `hook.txt`.
- The **liveness probe** checks `/` every 5s, and the kubelet would restart the container if it failed 3 times.
- On delete, the Pod went to `Terminating`. The **preStop** hook runs first (a graceful `nginx -s quit`), within `terminationGracePeriodSeconds`.

### 8. ImagePullBackOff: [08-image-pull-error-pod.yaml](pod-lifecycle/08-image-pull-error-pod.yaml)

```bash
$ kubectl apply -f 08-image-pull-error-pod.yaml
pod/image-error-pod created
$ kubectl get pod image-error-pod
NAME              READY   STATUS             RESTARTS   AGE
image-error-pod   0/1     ImagePullBackOff   0          20s
$ kubectl describe pod image-error-pod | sed -n '/^Events:/,$p'
Events:
  Type     Reason     Age               From               Message
  ----     ------     ----              ----               -------
  Normal   Scheduled  20s               default-scheduler  Successfully assigned default/image-error-pod to minikube
  Normal   BackOff    17s               kubelet            Back-off pulling image "nginx:this-tag-does-not-exist"
  Warning  Failed     17s               kubelet            Error: ImagePullBackOff
  Normal   Pulling    4s (x2 over 20s)  kubelet            Pulling image "nginx:this-tag-does-not-exist"
  Warning  Failed     0s (x2 over 18s)  kubelet            Failed to pull image "nginx:this-tag-does-not-exist": rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/nginx:this-tag-does-not-exist": failed to resolve reference "docker.io/library/nginx:this-tag-does-not-exist": docker.io/library/nginx:this-tag-does-not-exist: not found
  Warning  Failed     0s (x2 over 18s)  kubelet            Error: ErrImagePull
```

**Observed:** The image tag does not exist, so the pull fails with `ErrImagePull` (`not found`). The kubelet then retries with back-off, shown as `ImagePullBackOff`. The phase stays `Pending` because the container never started.

### Summary of all Pods

```bash
$ kubectl get pods -o custom-columns=NAME:.metadata.name,PHASE:.status.phase,REASON:.status.containerStatuses[0].state.waiting.reason,RESTARTS:.status.containerStatuses[0].restartCount | grep -v -E "curl-client"
NAME                 PHASE       REASON             RESTARTS
crashloop-pod        Running     <none>             4
failed-pod           Failed      <none>             0
image-error-pod      Pending     ImagePullBackOff   0
init-container-pod   Running     <none>             0
pending-pod          Pending     <none>             <none>
running-pod          Running     <none>             0
succeeded-pod        Succeeded   <none>             0
```
