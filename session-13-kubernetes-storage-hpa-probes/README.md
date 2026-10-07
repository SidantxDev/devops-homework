# Session 13: Kubernetes Storage, HPA & Probes

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

| Task | Where |
| --- | --- |
| Task 1: Kubernetes Volumes | [01-kubernetes-volumes/README.md](01-kubernetes-volumes/README.md) (emptyDir, hostPath, PV, PVC, StorageClass, dynamic provisioning, each with a working example) |
| Task 2: HPA hands-on | Below + [02-hpa/hpa.yml](02-hpa/hpa.yml), [02-hpa/load-generator.yaml](02-hpa/load-generator.yaml) |
| Task 3: Mini project | Below + [03-mini-project/](03-mini-project/) |

---

# Task 2: HPA Hands-on

The **Horizontal Pod Autoscaler** watches a metric (here **CPU**, from `metrics-server`) and changes a Deployment's `replicas` to keep that metric near a target:

```text
desiredReplicas = ceil( currentReplicas × currentUtilization / targetUtilization )
```

[hpa.yml](02-hpa/hpa.yml) contains:
- **Deployment `php-apache`**: every request does CPU work. It has `requests.cpu: 200m`, and **HPA needs a request** because utilization is calculated as a % of it.
- **Service `php-apache`**
- **HPA**: `minReplicas: 1`, `maxReplicas: 10`, target **50% average CPU** (the scale-down stabilization window is shortened to 60s for the demo).

[load-generator.yaml](02-hpa/load-generator.yaml) is a busybox Pod that sends requests to the Service in an endless loop.

### Steps 1–3: Deploy, configure HPA, verify

```bash
$ kubectl apply -f hpa.yml
deployment.apps/php-apache created
service/php-apache created
horizontalpodautoscaler.autoscaling/php-apache created
$ kubectl rollout status deployment/php-apache --timeout=120s
Waiting for deployment "php-apache" rollout to finish: 0 of 1 updated replicas are available...
deployment "php-apache" successfully rolled out
$ kubectl get hpa
NAME         REFERENCE               TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   cpu: 2%/50%   1         10        1          77s
$ kubectl describe hpa php-apache | sed -n '/^Metrics:/,/^Conditions:/p'
Metrics:                                               ( current / target )
  resource cpu on pods  (as a percentage of request):  2% (4m) / 50%
Min replicas:                                          1
Max replicas:                                          10
Behavior:
  Scale Up:
    Stabilization Window: 0 seconds
    Select Policy: Max
    Policies:
      - Type: Pods     Value: 4    Period: 15 seconds
      - Type: Percent  Value: 100  Period: 15 seconds
  Scale Down:
    Stabilization Window: 60 seconds
    Select Policy: Max
    Policies:
      - Type: Percent  Value: 100  Period: 15 seconds
Deployment pods:       1 current / 1 desired
Conditions:
$ kubectl top pods -l app=php-apache
NAME                          CPU(cores)   MEMORY(bytes)   
php-apache-6465bb9b65-w7vxx   4m           8Mi             
$ kubectl get pods -l app=php-apache
NAME                          READY   STATUS    RESTARTS   AGE
php-apache-6465bb9b65-w7vxx   1/1     Running   0          78s
```

At idle: **2% CPU of a 50% target → 1 replica**.

### Steps 4–8: Load generator → CPU rises → Pods scale

```bash
$ kubectl apply -f load-generator.yaml
deployment.apps/load-generator created
$ kubectl rollout status deployment/load-generator --timeout=60s
Waiting for deployment "load-generator" rollout to finish: 0 of 1 updated replicas are available...
deployment "load-generator" successfully rolled out
$ for i in 1 2 3 4 5 6 7 8; do sleep 30; echo "----- $(date +%T) (+$((i*30))s of load) -----"; kubectl get hpa php-apache --no-headers; kubectl get pods -l app=php-apache --no-headers | awk '{print $3}' | sort | uniq -c; done
----- 21:08:12 (+30s of load) -----
php-apache   Deployment/php-apache   cpu: 2%/50%   1     10    1     110s
      1 Running
----- 21:08:42 (+60s of load) -----
php-apache   Deployment/php-apache   cpu: 166%/50%   1     10    1     2m20s
      4 Running
----- 21:09:12 (+90s of load) -----
php-apache   Deployment/php-apache   cpu: 166%/50%   1     10    4     2m51s
      4 Running
----- 21:09:43 (+120s of load) -----
php-apache   Deployment/php-apache   cpu: 109%/50%   1     10    4     3m21s
      4 Running
----- 21:10:14 (+150s of load) -----
php-apache   Deployment/php-apache   cpu: 109%/50%   1     10    4     3m52s
      4 Running
----- 21:10:44 (+180s of load) -----
php-apache   Deployment/php-apache   cpu: 78%/50%   1     10    4     4m23s
      7 Running
----- 21:11:15 (+210s of load) -----
php-apache   Deployment/php-apache   cpu: 78%/50%   1     10    7     4m53s
      7 Running
----- 21:11:46 (+240s of load) -----
php-apache   Deployment/php-apache   cpu: 52%/50%   1     10    7     5m24s
      7 Running
$ kubectl top pods -l app=php-apache
NAME                          CPU(cores)   MEMORY(bytes)   
php-apache-6465bb9b65-2k4nl   107m         11Mi            
php-apache-6465bb9b65-4chpl   107m         11Mi            
php-apache-6465bb9b65-5r6bb   131m         11Mi            
php-apache-6465bb9b65-6w5s2   104m         12Mi            
php-apache-6465bb9b65-pjw9m   100m         12Mi            
php-apache-6465bb9b65-w7vxx   101m         11Mi            
php-apache-6465bb9b65-xgpfh   74m          11Mi            
$ kubectl get pods -l app=php-apache -o wide | awk '{print $1, $2, $3, $5}' | column -t
NAME                         READY  STATUS   AGE
php-apache-6465bb9b65-2k4nl  1/1    Running  3m10s
php-apache-6465bb9b65-4chpl  1/1    Running  3m10s
php-apache-6465bb9b65-5r6bb  1/1    Running  70s
php-apache-6465bb9b65-6w5s2  1/1    Running  3m10s
php-apache-6465bb9b65-pjw9m  1/1    Running  70s
php-apache-6465bb9b65-w7vxx  1/1    Running  5m25s
php-apache-6465bb9b65-xgpfh  1/1    Running  70s
$ kubectl get deployment php-apache
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
php-apache   7/7     7            7           5m25s
```

### Load removed → scale down

```bash
$ kubectl delete -f load-generator.yaml
deployment.apps "load-generator" deleted from default namespace
$ for i in 1 2 3 4 5 6; do sleep 30; echo "----- $(date +%T) (+$((i*30))s after load stopped) -----"; kubectl get hpa php-apache --no-headers; done
----- 21:12:18 (+30s after load stopped) -----
php-apache   Deployment/php-apache   cpu: 52%/50%   1     10    7     5m56s
----- 21:12:48 (+60s after load stopped) -----
php-apache   Deployment/php-apache   cpu: 39%/50%   1     10    7     6m27s
----- 21:13:19 (+90s after load stopped) -----
php-apache   Deployment/php-apache   cpu: 39%/50%   1     10    7     6m57s
----- 21:13:49 (+120s after load stopped) -----
php-apache   Deployment/php-apache   cpu: 0%/50%   1     10    6     7m27s
----- 21:14:19 (+150s after load stopped) -----
php-apache   Deployment/php-apache   cpu: 0%/50%   1     10    6     7m57s
----- 21:14:49 (+180s after load stopped) -----
php-apache   Deployment/php-apache   cpu: 0%/50%   1     10    1     8m27s
$ kubectl describe hpa php-apache | sed -n '/^Events:/,$p'
Events:
  Type     Reason                        Age                    From                       Message
  ----     ------                        ----                   ----                       -------
  Warning  FailedGetResourceMetric       7m28s (x5 over 8m28s)  horizontal-pod-autoscaler  failed to get cpu utilization: unable to get metrics for resource cpu: no metrics returned from resource metrics API
  Warning  FailedComputeMetricsReplicas  7m28s (x5 over 8m28s)  horizontal-pod-autoscaler  invalid metrics (1 invalid out of 1), first error is: failed to get cpu resource metric value: failed to get cpu utilization: unable to get metrics for resource cpu: no metrics returned from resource metrics API
  Normal   SuccessfulRescale             6m13s                  horizontal-pod-autoscaler  New size: 4; reason: cpu resource utilization (percentage of request) above target
  Normal   SuccessfulRescale             4m13s                  horizontal-pod-autoscaler  New size: 7; reason: cpu resource utilization (percentage of request) above target
  Normal   SuccessfulRescale             87s                    horizontal-pod-autoscaler  New size: 6; reason: All metrics below target
  Normal   SuccessfulRescale             27s                    horizontal-pod-autoscaler  New size: 1; reason: All metrics below target
```

### What I observed

| Time under load | CPU (target 50%) | Replicas | What happened |
| --- | --- | --- | --- |
| 0 s | 2% | 1 | Idle |
| +60 s | **166%** | 1 → **4** | ceil(1 × 166/50) = 4, so the HPA scaled up (up to 4 Pods per 15s allowed) |
| +120 s | 109% | 4 | Still above target |
| +180 s | 78% | 4 → **7** | ceil(4 × 78/50) = 7 |
| +240 s | **52%** | 7 | Load spread over 7 Pods, so CPU is close to the 50% target (`kubectl top` shows about 100m per Pod) |
| Load stopped | 39% → 0% | 7 → 6 → **1** | After the stabilization window, scaled back down to `minReplicas` |

- The first `FailedGetResourceMetric` warning appeared only during the first minute, before `metrics-server` had collected data for the new Pod (the target showed `<unknown>`). That is normal.
- `kubectl describe hpa` shows each `SuccessfulRescale` and the reason.

---

# Task 3: Mini Project: Resilient Web App (Storage + Probes + HPA)

> I couldn't access the course's Session 13 mini-project brief, so I built a project that combines everything in this session: **persistent storage, all three probe types, resource requests and autoscaling** in one app.

[app.yaml](03-mini-project/app.yaml):

| Feature | Implementation |
| --- | --- |
| **Persistent storage** | A PVC `web-content` (dynamically provisioned) holds the website. An **init container** seeds `index.html` only if it doesn't already exist |
| **startupProbe** | HTTP `/`, up to 10 × 3s, which gives the app time to start before the other probes run |
| **readinessProbe** | HTTP `/health/ready.html` (served from a per-Pod `emptyDir`). If it fails, the Pod is **removed from the Service** but not restarted |
| **livenessProbe** | `cat /tmp/alive`. If it fails twice, the **container is restarted** |
| **postStart hook** | Creates the liveness and readiness marker files |
| **Resources** | `requests: 100m CPU / 32Mi`, `limits: 300m / 64Mi` |
| **HPA** | 2–6 replicas, 50% CPU target |
| **Service** | ClusterIP `resilient-web` |

### Demo

```bash
$ kubectl apply -f app.yaml
persistentvolumeclaim/web-content created
deployment.apps/resilient-web created
service/resilient-web created
horizontalpodautoscaler.autoscaling/resilient-web created
$ kubectl rollout status deployment/resilient-web --timeout=120s
Waiting for deployment "resilient-web" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "resilient-web" rollout to finish: 1 of 2 updated replicas are available...
deployment "resilient-web" successfully rolled out
$ kubectl get pvc,deploy,svc,hpa -l '!x' | grep -E "NAME|resilient|web-content"
NAME                                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
persistentvolumeclaim/web-content   Bound    pvc-7389b62c-fc18-46af-bb48-5a775a80314f   100Mi      RWO            standard       <unset>                 4s
NAME                            READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/resilient-web   2/2     2            2           4s
NAME                    TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service/resilient-web   ClusterIP   10.97.111.23   <none>        80/TCP    4s
NAME                                                REFERENCE                  TARGETS              MINPODS   MAXPODS   REPLICAS   AGE
horizontalpodautoscaler.autoscaling/resilient-web   Deployment/resilient-web   cpu: <unknown>/50%   2         6         2          4s
$ kubectl get pods -l app=resilient-web -o wide | awk '{print $1, $2, $3, $4, $6}' | column -t
NAME                            READY  STATUS   RESTARTS  IP
resilient-web-6b7d65c47b-8kjz8  1/1    Running  0         10.244.0.149
resilient-web-6b7d65c47b-fplgx  1/1    Running  0         10.244.0.148
$ kubectl exec curl-client -- curl -s http://resilient-web
<h1>Resilient Web App</h1><p>Served from a PersistentVolume</p>

$ kubectl exec deploy/resilient-web -c web -- sh -c 'echo "<p>Visitor note added at $(date +%T)</p>" >> /usr/share/nginx/html/index.html'
$ kubectl delete pods -l app=resilient-web --now
pod "resilient-web-6b7d65c47b-8kjz8" deleted from default namespace
pod "resilient-web-6b7d65c47b-fplgx" deleted from default namespace
$ kubectl rollout status deployment/resilient-web --timeout=120s
Waiting for deployment "resilient-web" rollout to finish: 0 of 2 updated replicas are available...
Waiting for deployment "resilient-web" rollout to finish: 1 of 2 updated replicas are available...
deployment "resilient-web" successfully rolled out
$ kubectl get pods -l app=resilient-web
NAME                             READY   STATUS    RESTARTS   AGE
resilient-web-6b7d65c47b-7f6s6   1/1     Running   0          4s
resilient-web-6b7d65c47b-k4nnf   1/1     Running   0          4s
$ kubectl exec curl-client -- curl -s http://resilient-web
<h1>Resilient Web App</h1><p>Served from a PersistentVolume</p>
<p>Visitor note added at 15:45:39</p>

$ P1=$(kubectl get pods -l app=resilient-web -o jsonpath='{.items[0].metadata.name}') && echo "Breaking readiness of $P1"
Breaking readiness of resilient-web-6b7d65c47b-7f6s6
$ kubectl exec $P1 -c web -- rm /usr/share/nginx/html/health/ready.html
$ kubectl get pods -l app=resilient-web
NAME                             READY   STATUS    RESTARTS   AGE
resilient-web-6b7d65c47b-7f6s6   0/1     Running   0          11s
resilient-web-6b7d65c47b-k4nnf   1/1     Running   0          11s
$ kubectl get endpointslices -l kubernetes.io/service-name=resilient-web -o jsonpath='{range .items[*].endpoints[*]}{.targetRef.name}  ready={.conditions.ready}{"\n"}{end}'
resilient-web-6b7d65c47b-7f6s6  ready=false
resilient-web-6b7d65c47b-k4nnf  ready=true
$ kubectl describe pod $P1 | grep -E "Readiness probe failed" | tail -1
  Warning  Unhealthy  2s (x3 over 5s)  kubelet            Readiness probe failed: HTTP probe failed with statuscode: 404
$ kubectl exec $P1 -c web -- sh -c 'echo ok > /usr/share/nginx/html/health/ready.html'
$ kubectl get pods -l app=resilient-web
NAME                             READY   STATUS    RESTARTS   AGE
resilient-web-6b7d65c47b-7f6s6   1/1     Running   0          18s
resilient-web-6b7d65c47b-k4nnf   1/1     Running   0          18s

$ P2=$(kubectl get pods -l app=resilient-web -o jsonpath='{.items[1].metadata.name}') && echo "Breaking liveness of $P2"
Breaking liveness of resilient-web-6b7d65c47b-k4nnf
$ kubectl exec $P2 -c web -- rm /tmp/alive
$ kubectl get pods -l app=resilient-web
NAME                             READY   STATUS    RESTARTS      AGE
resilient-web-6b7d65c47b-7f6s6   1/1     Running   0             44s
resilient-web-6b7d65c47b-k4nnf   1/1     Running   1 (19s ago)   44s
$ kubectl describe pod $P2 | grep -E "Liveness probe failed|failed liveness probe" | tail -2
  Warning  Unhealthy  19s (x2 over 24s)  kubelet            Liveness probe failed: cat: can't open '/tmp/alive': No such file or directory
  Normal   Killing    19s                kubelet            Container web failed liveness probe, will be restarted
$ kubectl exec curl-client -- curl -s http://resilient-web
<h1>Resilient Web App</h1><p>Served from a PersistentVolume</p>
<p>Visitor note added at 15:45:39</p>

$ kubectl apply -f load-generator.yaml
deployment.apps/web-load created
$ kubectl get hpa resilient-web
NAME            REFERENCE                  TARGETS        MINPODS   MAXPODS   REPLICAS   AGE
resilient-web   Deployment/resilient-web   cpu: 58%/50%   2         6         3          2m51s
$ kubectl top pods -l app=resilient-web
NAME                             CPU(cores)   MEMORY(bytes)   
resilient-web-6b7d65c47b-7f6s6   60m          11Mi            
resilient-web-6b7d65c47b-k4nnf   57m          11Mi            
$ kubectl get pods -l app=resilient-web
NAME                             READY   STATUS    RESTARTS        AGE
resilient-web-6b7d65c47b-6qv9j   1/1     Running   0               50s
resilient-web-6b7d65c47b-7f6s6   1/1     Running   0               2m46s
resilient-web-6b7d65c47b-k4nnf   1/1     Running   1 (2m21s ago)   2m46s
$ kubectl delete -f load-generator.yaml
deployment.apps "web-load" deleted from default namespace
$ kubectl describe hpa resilient-web | sed -n '/^Events:/,$p' | grep -E "Type|----|Rescale"
  Type     Reason                        Age                   From                       Message
  ----     ------                        ----                  ----                       -------
  Normal   SuccessfulRescale             51s                   horizontal-pod-autoscaler  New size: 3; reason: cpu resource utilization (percentage of request) above target
```

### Results

| Test | What I did | Result |
| --- | --- | --- |
| **Deploy** | `kubectl apply` | PVC `Bound` (dynamic PV), 2/2 Pods ready, page served |
| **Storage persistence** | Added a line to `index.html`, then **deleted all Pods** | The new Pods serve the page **with the added line**. The data lives in the PV, not in the Pods |
| **Readiness probe** | Deleted `ready.html` in one Pod | The Pod became **`0/1`**, the EndpointSlice marked it `ready=false` (no traffic), the event says `Readiness probe failed: 404`, and there was **no restart**. Restoring the file brought it back to `1/1` |
| **Liveness probe** | Deleted `/tmp/alive` in another Pod | `Liveness probe failed` → `Container web failed liveness probe, will be restarted` → **RESTARTS 1**, and the Pod healed itself |
| **Availability** | `curl` during the tests | The Service kept answering, because traffic went only to ready Pods |
| **Autoscaling** | 3 load-generator Pods | CPU **58% / 50%** → the HPA scaled **2 → 3** |

### Probes: summary

| Probe | Question it answers | On failure |
| --- | --- | --- |
| **startupProbe** | "Has the app finished starting?" | Keeps the other probes disabled. After `failureThreshold`, the container is restarted |
| **readinessProbe** | "Can it receive traffic **right now**?" | Removed from Service endpoints (no restart) |
| **livenessProbe** | "Is it still alive / not stuck?" | **Container restarted** |
