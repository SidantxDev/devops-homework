# Task 2: Troubleshoot Common Issues

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

Every folder has a **`broken.yaml`** (the realistic bug) and a **`fixed.yaml`**. For each issue I followed the same process:

```text
1. Identify  →  2. Investigate  →  3. Root cause  →  4. Fix  →  5. Verify  →  6. Document
```

| # | Issue | STATUS you see | Root cause in this demo | Key command |
| --- | --- | --- | --- | --- |
| 1 | [CrashLoopBackOff](#1-crashloopbackoff) | `Error` / `CrashLoopBackOff`, RESTARTS climbing | App exits: required env var missing | `kubectl logs` |
| 2 | [ImagePullBackOff](#2-imagepullbackoff) | `ImagePullBackOff` | Image **tag** doesn't exist | `describe` → Events |
| 3 | [ErrImagePull](#3-errimagepull) | `ErrImagePull` | Typo in the image **repository** name | `describe` → Events |
| 4 | [Pending](#4-pending) | `Pending`, no NODE | `nodeSelector` matches no node | `describe` → FailedScheduling |
| 5 | [ContainerCreating](#5-containercreating) | Stuck in `ContainerCreating` | The mounted ConfigMap doesn't exist | `describe` → FailedMount |
| 6 | [Service connectivity](#6-service-connectivity) | Pods `Running`, but the Service doesn't answer | Wrong `targetPort` | endpointslices vs containerPort |
| 7 | [DNS](#7-dns-issue) | App logs "could not resolve" | Short name used across namespaces | `nslookup`, `resolv.conf` |
| 8 | [Pod networking](#8-pod-networking-issue) | Even the Pod IP refuses connections | App listens on `127.0.0.1` only | `kubectl debug` + `netstat` |
| 9 | [Configuration](#9-configuration-issue) | `Running` but `0/1` READY | Wrong port in a ConfigMap | probe events + logs |

---

## 1. CrashLoopBackOff

[broken.yaml](01-crashloopbackoff/broken.yaml) → [fixed.yaml](01-crashloopbackoff/fixed.yaml)

```bash
$ kubectl apply -f 01-crashloopbackoff/broken.yaml
deployment.apps/payment-api created
$ kubectl get pods -l app=payment-api
NAME                           READY   STATUS   RESTARTS      AGE
payment-api-646b97b94c-tkwj2   0/1     Error    3 (24s ago)   39s
$ kubectl describe pod -l app=payment-api | grep -E "State:|Reason:|Exit Code:|Restart Count:|BackOff"
    State:          Terminated
      Reason:       Error
      Exit Code:    1
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
    Restart Count:  3
  Warning  BackOff    2s (x3 over 37s)  kubelet            Back-off restarting failed container api in pod payment-api-646b97b94c-tkwj2_default(6bb86602-d45b-47ad-87ad-c7c79fc2d526)
$ kubectl logs deploy/payment-api
FATAL: DATABASE_URL is not set
$ kubectl get deploy payment-api -o jsonpath='{.spec.template.spec.containers[0].env}'; echo "(no env vars defined)"
(no env vars defined)
$ kubectl apply -f 01-crashloopbackoff/fixed.yaml
deployment.apps/payment-api configured
$ kubectl rollout status deploy/payment-api --timeout=90s
Waiting for deployment "payment-api" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "payment-api" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "payment-api" rollout to finish: 1 old replicas are pending termination...
deployment "payment-api" successfully rolled out
$ kubectl get pods -l app=payment-api
NAME                           READY   STATUS    RESTARTS      AGE
payment-api-646b97b94c-tkwj2   0/1     Error     3 (25s ago)   40s
payment-api-86cbd6fd87-nlxbr   1/1     Running   0             0s
$ kubectl logs deploy/payment-api
Found 2 pods, using pod/payment-api-86cbd6fd87-nlxbr
connected to postgres://db:5432/payments
$ kubectl delete -f 01-crashloopbackoff/fixed.yaml
deployment.apps "payment-api" deleted from default namespace
```

- **Problem:** The `payment-api` Pod keeps restarting (`RESTARTS 3`, `Exit Code: 1`) and the `BackOff: Back-off restarting failed container` event repeats.
- **Investigation:** `describe` shows the container *terminates* with an error, not that it can't start. `logs` shows the application's own message: `FATAL: DATABASE_URL is not set`.
- **Root cause:** The app needs `DATABASE_URL`, but the Deployment defines no env vars.
- **Fix:** Add the `DATABASE_URL` env var (in real life usually from a ConfigMap or Secret).
- **Verify:** The new Pod is `1/1 Running` with 0 restarts, and the logs say `connected to postgres://db:5432/payments`.

> On Kubernetes 1.37 the STATUS column shows `Error` between restarts. The `BackOff` event and the increasing restart delay are the CrashLoopBackOff.

## 2. ImagePullBackOff

[broken.yaml](02-imagepullbackoff/broken.yaml) → [fixed.yaml](02-imagepullbackoff/fixed.yaml)

```bash
$ kubectl apply -f 02-imagepullbackoff/broken.yaml
pod/web-v2 created
$ kubectl get pod web-v2
NAME     READY   STATUS              RESTARTS   AGE
web-v2   0/1     ContainerCreating   0          3s
$ kubectl get pod web-v2
NAME     READY   STATUS             RESTARTS   AGE
web-v2   0/1     ImagePullBackOff   0          23s
$ kubectl describe pod web-v2 | grep -E "Image:|State:|Reason:"
    Image:          nginx:1.99.99
    State:          Waiting
      Reason:       ImagePullBackOff
$ kubectl describe pod web-v2 | sed -n '/^Events:/,$p'
Events:
  Type     Reason     Age               From               Message
  ----     ------     ----              ----               -------
  Normal   Scheduled  24s               default-scheduler  Successfully assigned default/web-v2 to minikube
  Normal   BackOff    20s               kubelet            Back-off pulling image "nginx:1.99.99"
  Warning  Failed     20s               kubelet            Error: ImagePullBackOff
  Normal   Pulling    9s (x2 over 23s)  kubelet            Pulling image "nginx:1.99.99"
  Warning  Failed     7s (x2 over 21s)  kubelet            Failed to pull image "nginx:1.99.99": rpc error: code = NotFound desc = failed to pull and unpack image "docker.io/library/nginx:1.99.99": failed to resolve reference "docker.io/library/nginx:1.99.99": docker.io/library/nginx:1.99.99: not found
  Warning  Failed     7s (x2 over 21s)  kubelet            Error: ErrImagePull
$ kubectl delete pod web-v2 --now
pod "web-v2" deleted from default namespace
$ kubectl apply -f 02-imagepullbackoff/fixed.yaml
pod/web-v2 created
$ kubectl wait --for=condition=Ready pod/web-v2 --timeout=90s
pod/web-v2 condition met
$ kubectl get pod web-v2
NAME     READY   STATUS    RESTARTS   AGE
web-v2   1/1     Running   0          1s
$ kubectl delete pod web-v2 --now
pod "web-v2" deleted from default namespace
```

- **Problem:** The Pod never starts. It sits in `ContainerCreating` and then `ImagePullBackOff`.
- **Investigation:** The Events say `nginx:1.99.99: not found` (`code = NotFound`).
- **Root cause:** The **tag** `1.99.99` was never published.
- **Fix:** Use an existing tag (`nginx:1.27`). Image Pods can't be edited in place, so delete and re-apply.
- **Verify:** `1/1 Running`.

## 3. ErrImagePull

[broken.yaml](03-errimagepull/broken.yaml) → [fixed.yaml](03-errimagepull/fixed.yaml)

```bash
$ kubectl apply -f 03-errimagepull/broken.yaml
pod/frontend created
$ kubectl get pod frontend
NAME       READY   STATUS         RESTARTS   AGE
frontend   0/1     ErrImagePull   0          4s
$ kubectl describe pod frontend | sed -n '/^Events:/,$p'
Events:
  Type     Reason     Age   From               Message
  ----     ------     ----  ----               -------
  Normal   Scheduled  5s    default-scheduler  Successfully assigned default/frontend to minikube
  Normal   Pulling    4s    kubelet            Pulling image "ngnix:1.27"
  Warning  Failed     2s    kubelet            Failed to pull image "ngnix:1.27": failed to pull and unpack image "docker.io/library/ngnix:1.27": failed to resolve reference "docker.io/library/ngnix:1.27": pull access denied, repository does not exist or may require authorization: server message: insufficient_scope: authorization failed
  Warning  Failed     2s    kubelet            Error: ErrImagePull
  Normal   BackOff    2s    kubelet            Back-off pulling image "ngnix:1.27"
  Warning  Failed     2s    kubelet            Error: ImagePullBackOff
$ kubectl delete pod frontend --now
pod "frontend" deleted from default namespace
$ kubectl apply -f 03-errimagepull/fixed.yaml
pod/frontend created
$ kubectl wait --for=condition=Ready pod/frontend --timeout=90s
pod/frontend condition met
$ kubectl get pod frontend
NAME       READY   STATUS    RESTARTS   AGE
frontend   1/1     Running   0          1s
$ kubectl delete pod frontend --now
pod "frontend" deleted from default namespace
```

- **Problem:** `ErrImagePull` straight after creation.
- **Investigation:** The Events say `pull access denied, repository does not exist or may require authorization`.
- **Root cause:** The **repository** is misspelled: `ngnix` instead of `nginx`. The same message appears for **private images without `imagePullSecrets`**.
- **Fix:** Correct the image name.
- **Verify:** `1/1 Running`.

**ErrImagePull vs ImagePullBackOff:** `ErrImagePull` is the **actual failed attempt**. `ImagePullBackOff` is the state **between retries**, where the kubelet waits longer each time (10s, 20s, 40s, … up to 5 min). One Pod switches between the two, as the Events above show (`Error: ErrImagePull` and `Error: ImagePullBackOff`).

## 4. Pending

[broken.yaml](04-pending/broken.yaml) → [fixed.yaml](04-pending/fixed.yaml)

```bash
$ kubectl apply -f 04-pending/broken.yaml
pod/gpu-job created
$ kubectl get pod gpu-job -o wide
NAME      READY   STATUS    RESTARTS   AGE   IP       NODE     NOMINATED NODE   READINESS GATES
gpu-job   0/1     Pending   0          6s    <none>   <none>   <none>           <none>
$ kubectl describe pod gpu-job | sed -n '/^Node-Selectors:/p;/^Events:/,$p'
Node-Selectors:              accelerator=nvidia-gpu
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  6s    default-scheduler  0/1 nodes are available: 1 node(s) didn't match Pod's node affinity/selector. preemption: 0/1 nodes are available: 1 Preemption is not helpful for scheduling.
$ kubectl get nodes --show-labels | tr ',' '\n' | grep -E "NAME|accelerator|kubernetes.io/os|kubernetes.io/hostname"
NAME       STATUS   ROLES           AGE   VERSION   LABELS
beta.kubernetes.io/os=linux
kubernetes.io/hostname=minikube
kubernetes.io/os=linux
$ kubectl delete pod gpu-job --now
pod "gpu-job" deleted from default namespace
$ kubectl apply -f 04-pending/fixed.yaml
pod/gpu-job created
$ kubectl wait --for=condition=Ready pod/gpu-job --timeout=60s
pod/gpu-job condition met
$ kubectl get pod gpu-job -o wide
NAME      READY   STATUS    RESTARTS   AGE   IP             NODE       NOMINATED NODE   READINESS GATES
gpu-job   1/1     Running   0          1s    10.244.0.162   minikube   <none>           <none>
$ kubectl logs gpu-job
running on gpu-job
$ kubectl delete pod gpu-job --now
pod "gpu-job" deleted from default namespace
```

- **Problem:** The Pod is `Pending` with **no IP and no NODE**, so it was never scheduled.
- **Investigation:** The `FailedScheduling` event says `0/1 nodes are available: 1 node(s) didn't match Pod's node affinity/selector`. The node's labels don't include `accelerator=nvidia-gpu`.
- **Root cause:** The `nodeSelector` asks for a label no node has. Other common causes of `Pending` are **insufficient CPU or memory**, taints without tolerations, and an unbound PVC.
- **Fix:** Select a label that exists (or label a node: `kubectl label node <node> accelerator=nvidia-gpu`).
- **Verify:** Scheduled on `minikube`, `Running`.

## 5. ContainerCreating

[broken.yaml](05-containercreating/broken.yaml) → [fixed.yaml](05-containercreating/fixed.yaml)

```bash
$ kubectl apply -f 05-containercreating/broken.yaml
pod/report-generator created
$ kubectl get pod report-generator
NAME               READY   STATUS              RESTARTS   AGE
report-generator   0/1     ContainerCreating   0          20s
$ kubectl describe pod report-generator | sed -n '/^Events:/,$p'
Events:
  Type     Reason       Age               From               Message
  ----     ------       ----              ----               -------
  Normal   Scheduled    21s               default-scheduler  Successfully assigned default/report-generator to minikube
  Warning  FailedMount  5s (x6 over 21s)  kubelet            MountVolume.SetUp failed for volume "config" : configmap "report-settings" not found
$ kubectl get configmap report-settings
Error from server (NotFound): configmaps "report-settings" not found
$ kubectl apply -f 05-containercreating/fixed.yaml
configmap/report-settings created
$ kubectl wait --for=condition=Ready pod/report-generator --timeout=180s
pod/report-generator condition met
$ kubectl get pod report-generator
NAME               READY   STATUS    RESTARTS   AGE
report-generator   1/1     Running   0          33s
$ kubectl logs report-generator
[report]
format=pdf
schedule=daily
$ kubectl delete pod report-generator --now
pod "report-generator" deleted from default namespace
$ kubectl delete -f 05-containercreating/fixed.yaml
configmap "report-settings" deleted from default namespace
```

- **Problem:** The Pod is stuck in `ContainerCreating` for a long time (normally this takes a few seconds).
- **Investigation:** The `FailedMount` event says `configmap "report-settings" not found`, and `kubectl get configmap` confirms it.
- **Root cause:** The Pod mounts a ConfigMap volume that doesn't exist, so the kubelet can't set up the volume and never starts the container. (Other causes: a missing Secret volume, PVC or CSI attach problems, CNI or IP allocation problems.)
- **Fix:** Create the ConfigMap. **No Pod restart was needed**, because the kubelet retries the mount and the Pod started on its own.
- **Verify:** `Running`, and the logs print the mounted `settings.ini`.

## 6. Service connectivity

[broken.yaml](06-service-connectivity/broken.yaml) → [fixed.yaml](06-service-connectivity/fixed.yaml)

```bash
$ kubectl apply -f 06-service-connectivity/broken.yaml
deployment.apps/orders created
service/orders created
$ kubectl rollout status deploy/orders --timeout=90s
Waiting for deployment "orders" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "orders" rollout to finish: 1 of 2 updated replicas are available...
deployment "orders" successfully rolled out
$ kubectl exec curl-client -- sh -c 'curl -s -m 3 http://orders || echo "curl failed with exit code $?"'
curl failed with exit code 7
$ kubectl get pods -l app=orders
NAME                     READY   STATUS    RESTARTS   AGE
orders-5d6ccd78c-8b67j   1/1     Running   0          1s
orders-5d6ccd78c-g666m   1/1     Running   0          1s
$ kubectl get endpointslices -l kubernetes.io/service-name=orders
NAME           ADDRESSTYPE   PORTS   ENDPOINTS                   AGE
orders-vtwf4   IPv4          8080    10.244.0.164,10.244.0.165   1s
$ kubectl describe svc orders | grep -E "Selector|Port|Endpoints"
Selector:                 app=orders
Port:                     <unset>  80/TCP
TargetPort:               8080/TCP
Endpoints:                10.244.0.164:8080,10.244.0.165:8080
$ kubectl get pods -l app=orders -o jsonpath='{.items[0].spec.containers[0].ports}'; echo
[{"containerPort":5678,"protocol":"TCP"}]
$ POD_IP=$(kubectl get pod -l app=orders -o jsonpath='{.items[0].status.podIP}') && kubectl exec curl-client -- curl -s -m 3 http://$POD_IP:5678
orders service OK
$ kubectl apply -f 06-service-connectivity/fixed.yaml
deployment.apps/orders unchanged
service/orders configured
$ kubectl get endpointslices -l kubernetes.io/service-name=orders
NAME           ADDRESSTYPE   PORTS   ENDPOINTS                   AGE
orders-vtwf4   IPv4          5678    10.244.0.164,10.244.0.165   2s
$ kubectl exec curl-client -- curl -s -m 3 http://orders
orders service OK
$ kubectl delete -f 06-service-connectivity/fixed.yaml
deployment.apps "orders" deleted from default namespace
service "orders" deleted from default namespace
```

- **Problem:** Both Pods are `Running`, but `curl http://orders` fails (exit 7, connection refused).
- **Investigation:** The Service **has endpoints**, so the selector is fine, but on port **8080**. The container's `containerPort` is **5678**, and curling a Pod IP directly on 5678 **works**, so the app itself is healthy.
- **Root cause:** The Service's `targetPort: 8080` doesn't match the port the app listens on.
- **Fix:** `targetPort: 5678`.
- **Verify:** The endpoints now show port 5678, and `curl http://orders` returns `orders service OK`.

**Checklist for "Service not reachable":** (1) Does it have endpoints? If not, check the selector and labels and whether the Pods are ready. (2) Does `targetPort` equal the container's port? (3) Does the Pod IP work directly? (4) Is DNS resolving the name?

## 7. DNS issue

[setup.yaml](07-dns/setup.yaml) · [broken.yaml](07-dns/broken.yaml) → [fixed.yaml](07-dns/fixed.yaml)

```bash
$ kubectl apply -f 07-dns/setup.yaml
namespace/backend created
deployment.apps/inventory created
service/inventory created
$ kubectl rollout status deploy/inventory -n backend --timeout=90s
Waiting for deployment "inventory" rollout to finish: 0 of 1 updated replicas are available...
deployment "inventory" successfully rolled out
$ kubectl apply -f 07-dns/broken.yaml
pod/shop-frontend created
$ kubectl logs shop-frontend --tail=2
15:59:23 ERROR: could not resolve/reach inventory
15:59:31 ERROR: could not resolve/reach inventory
$ kubectl exec shop-frontend -- sh -c 'echo $INVENTORY_URL'
http://inventory
$ kubectl exec shop-frontend -- cat /etc/resolv.conf
search default.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
$ kubectl exec dns-client -- nslookup inventory.default.svc.cluster.local | tail -2
command terminated with exit code 1
** server can't find inventory.default.svc.cluster.local: NXDOMAIN

$ kubectl get svc -A | grep -E "NAMESPACE|inventory"
NAMESPACE       NAME                                 TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
backend         inventory                            ClusterIP   10.98.183.235    <none>        80/TCP                       15s
$ kubectl exec dns-client -- nslookup inventory.backend.svc.cluster.local | tail -3
Name:	inventory.backend.svc.cluster.local
Address: 10.98.183.235

$ kubectl delete pod shop-frontend --now
pod "shop-frontend" deleted from default namespace
$ kubectl apply -f 07-dns/fixed.yaml
pod/shop-frontend created
$ kubectl logs shop-frontend --tail=2
15:59:40 inventory: 42 items in stock
15:59:45 inventory: 42 items in stock
$ kubectl delete pod shop-frontend --now
pod "shop-frontend" deleted from default namespace
$ kubectl delete -f 07-dns/setup.yaml
namespace "backend" deleted
deployment.apps "inventory" deleted from backend namespace
service "inventory" deleted from backend namespace
```

- **Problem:** `shop-frontend` (namespace `default`) logs `could not resolve/reach inventory`.
- **Investigation:** The app uses `http://inventory`. `resolv.conf` shows the search domain `default.svc.cluster.local`, so the name becomes `inventory.default.svc.cluster.local`, which gives **NXDOMAIN**. `kubectl get svc -A` shows the Service actually lives in namespace **`backend`**, and `inventory.backend.svc.cluster.local` resolves.
- **Root cause:** A short Service name only resolves **within the same namespace**.
- **Fix:** Use the namespace-qualified FQDN `inventory.backend.svc.cluster.local`.
- **Verify:** The logs now show `inventory: 42 items in stock`.

(For a cluster-wide DNS outage, where CoreDNS itself is down, see [Session 11 CoreDNS troubleshooting](../../session-11-kubernetes-networking-services/coredns/README.md).)

## 8. Pod networking issue

[broken.yaml](08-pod-networking/broken.yaml) → [fixed.yaml](08-pod-networking/fixed.yaml)

```bash
$ kubectl apply -f 08-pod-networking/broken.yaml
deployment.apps/metrics-api created
service/metrics-api created
$ kubectl rollout status deploy/metrics-api --timeout=90s
Waiting for deployment "metrics-api" rollout to finish: 0 of 1 updated replicas are available...
deployment "metrics-api" successfully rolled out
$ kubectl exec curl-client -- sh -c 'curl -s -m 3 http://metrics-api || echo "curl failed with exit code $?"'
curl failed with exit code 7
$ kubectl get endpointslices -l kubernetes.io/service-name=metrics-api
NAME                ADDRESSTYPE   PORTS   ENDPOINTS      AGE
metrics-api-qw5fv   IPv4          5678    10.244.0.178   1s
$ POD_IP=$(kubectl get pod -l app=metrics-api -o jsonpath='{.items[0].status.podIP}') && kubectl exec curl-client -- sh -c "curl -s -m 3 http://$POD_IP:5678 || echo \"direct Pod IP also fails: exit code \$?\""
direct Pod IP also fails: exit code 7
$ kubectl logs deploy/metrics-api
2026/10/07 15:59:57 [INFO] server is listening on 127.0.0.1:5678
$ kubectl debug -q $(kubectl get pod -l app=metrics-api -o name) --image=busybox:1.36 --target=api --profile=general -i -- sh -c 'netstat -tln; wget -qO- http://127.0.0.1:5678' 2>/dev/null
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       
tcp        0      0 127.0.0.1:5678          0.0.0.0:*               LISTEN      
metrics-api OK
$ kubectl apply -f 08-pod-networking/fixed.yaml
deployment.apps/metrics-api configured
service/metrics-api unchanged
$ kubectl rollout status deploy/metrics-api --timeout=90s
Waiting for deployment "metrics-api" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "metrics-api" rollout to finish: 1 old replicas are pending termination...
deployment "metrics-api" successfully rolled out
$ kubectl get pods -l app=metrics-api
NAME                           READY   STATUS    RESTARTS   AGE
metrics-api-75cd8b69cc-f677t   1/1     Running   0          17s
$ kubectl logs deploy/metrics-api
2026/10/07 16:00:00 [INFO] server is listening on 0.0.0.0:5678
$ kubectl exec curl-client -- curl -s -m 3 http://metrics-api
metrics-api OK
$ kubectl delete -f 08-pod-networking/fixed.yaml
deployment.apps "metrics-api" deleted from default namespace
service "metrics-api" deleted from default namespace
```

- **Problem:** The Service has an endpoint with the **correct** port, yet both the Service **and the Pod IP directly** fail.
- **Investigation:** The app's log says `listening on 127.0.0.1:5678`. The image has no shell, so I attached an **ephemeral debug container** (`kubectl debug --target=api`) that shares the Pod's network namespace. `netstat` shows `127.0.0.1:5678 LISTEN`, and `wget 127.0.0.1:5678` works **inside** the Pod.
- **Root cause:** The app is bound to the **loopback interface**, so only processes inside the Pod can reach it. Traffic arriving on the Pod's `eth0` (`10.244.x.x`) is refused.
- **Fix:** Listen on `0.0.0.0:5678` (all interfaces).
- **Verify:** The log says `listening on 0.0.0.0:5678`, and `curl http://metrics-api` returns `metrics-api OK`.

## 9. Configuration issue

[broken.yaml](09-configuration/broken.yaml) → [fixed.yaml](09-configuration/fixed.yaml)

```bash
$ kubectl apply -f 09-configuration/broken.yaml
configmap/greeter-config created
deployment.apps/greeter created
service/greeter created
$ kubectl get pods -l app=greeter
NAME                       READY   STATUS    RESTARTS   AGE
greeter-54894fdcc6-d7znk   0/1     Running   0          20s
$ kubectl describe pod -l app=greeter | grep -E "Readiness|Unhealthy"
    Readiness:      tcp-socket :5678 delay=0s timeout=1s period=3s #success=1 #failure=3
  Warning  Unhealthy  2s (x8 over 20s)  kubelet            Readiness probe failed: dial tcp 10.244.0.171:5678: connect: connection refused
$ kubectl logs deploy/greeter
2026/10/07 15:57:53 [INFO] server is listening on :80
$ kubectl get configmap greeter-config -o jsonpath='{.data}'; echo
{"GREETING":"Hello from the greeter","LISTEN_PORT":"80"}
$ kubectl get endpointslices -l kubernetes.io/service-name=greeter -o jsonpath='{range .items[*].endpoints[*]}{.addresses[0]} ready={.conditions.ready}{"\n"}{end}'
10.244.0.171 ready=false
$ kubectl apply -f 09-configuration/fixed.yaml
configmap/greeter-config configured
deployment.apps/greeter unchanged
service/greeter unchanged
$ kubectl rollout restart deploy/greeter
deployment.apps/greeter restarted
$ kubectl rollout status deploy/greeter --timeout=90s
Waiting for deployment "greeter" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "greeter" rollout to finish: 1 old replicas are pending termination...
Waiting for deployment "greeter" rollout to finish: 1 old replicas are pending termination...
deployment "greeter" successfully rolled out
$ kubectl get pods -l app=greeter
NAME                       READY   STATUS    RESTARTS   AGE
greeter-54894fdcc6-d7znk   0/1     Error     0          23s
greeter-86c96584c8-4w67q   1/1     Running   0          1s
$ kubectl logs deploy/greeter
2026/10/07 15:58:14 [INFO] server is listening on :5678
$ kubectl exec curl-client -- curl -s -m 3 http://greeter
Hello from the greeter
$ kubectl delete -f 09-configuration/fixed.yaml
configmap "greeter-config" deleted from default namespace
deployment.apps "greeter" deleted from default namespace
service "greeter" deleted from default namespace
```

- **Problem:** The Pod is `Running` but **`0/1` READY**, so the Service sends it no traffic.
- **Investigation:** The readiness probe fails with `dial tcp ...:5678: connection refused`. The logs say `listening on :80`, and the ConfigMap has `LISTEN_PORT: "80"`. The EndpointSlice marks the Pod `ready=false`.
- **Root cause:** A wrong value in the **ConfigMap**. The app listens on 80 while the probe and the Service expect 5678.
- **Fix:** Set `LISTEN_PORT: "5678"`, then **`kubectl rollout restart`**. Env vars from a ConfigMap are only read when the container starts, so changing the ConfigMap alone does nothing to running Pods.
- **Verify:** The new Pod is `1/1`, logs `listening on :5678`, and `curl http://greeter` returns `Hello from the greeter`.
