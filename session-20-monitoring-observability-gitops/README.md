# Session 20: Monitoring, Observability & GitOps

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

## Task 1: Monitoring

**Monitoring** means collecting known signals and **alerting** when they cross a threshold, to answer "is it working?".

| Signal | How I collected it on my cluster |
| --- | --- |
| **Metrics** | `metrics-server` → Metrics API (`kubectl top`, also used by the HPA in [Session 13](../session-13-kubernetes-storage-hpa-probes/README.md)) |
| **Logs** | `kubectl logs` (stdout/stderr of each container) |
| **CPU utilization** | `kubectl top nodes/pods` (millicores, % of node) |
| **Memory utilization** | `kubectl top` (working-set bytes) |
| **Application health** | Readiness/liveness probes, Deployment `availableReplicas`, API server `/readyz` |
| **Alerts** | Warning events (`kubectl events --types=Warning`). In production: Prometheus alert rules → Alertmanager → Slack/email (for example *CPU > 80% for 5m*, *pod restarting*, *replicas unavailable*) |

### Demo (real output)

```bash
$ kubectl get apiservice v1beta1.metrics.k8s.io
NAME                     SERVICE                      AVAILABLE   AGE
v1beta1.metrics.k8s.io   kube-system/metrics-server   True        18d
$ kubectl top nodes
NAME       CPU(cores)   CPU(%)   MEMORY(bytes)   MEMORY(%)   
minikube   243m         2%       1552Mi          19%         
$ kubectl top pods -A --sort-by=cpu | head -8
NAMESPACE       NAME                                       CPU(cores)   MEMORY(bytes)   
kube-system     kube-apiserver-minikube                    71m          332Mi           
kube-system     etcd-minikube                              44m          53Mi            
kube-system     kube-controller-manager-minikube           27m          101Mi           
kube-system     kube-scheduler-minikube                    10m          54Mi            
ingress-nginx   ingress-nginx-controller-d7cd8c989-t4zzg   4m           153Mi           
kube-system     metrics-server-768f9f6999-nb5vg            4m           30Mi            
kube-system     storage-provisioner                        4m           17Mi            
$ kubectl top pods -l app=monitor-demo --containers
error: metrics not available yet
$ kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes | head -c 400; echo
{"kind":"NodeMetricsList","apiVersion":"metrics.k8s.io/v1beta1","metadata":{},"items":[{"metadata":{"name":"minikube","creationTimestamp":"2026-10-07T17:18:27Z","labels":{"beta.kubernetes.io/arch":"amd64","beta.kubernetes.io/os":"linux","kubernetes.io/arch":"amd64","kubernetes.io/hostname":"minikube","kubernetes.io/os":"linux","minikube.k8s.io/commit":"7a9f6a841470a207de8cf4bafcccee0969d8ba10","mi
$ kubectl get deploy monitor-demo -o jsonpath='available={.status.availableReplicas}/{.spec.replicas}{"\n"}'
available=2/2
$ kubectl get pods -l app=monitor-demo -o custom-columns=POD:.metadata.name,READY:.status.containerStatuses[0].ready,RESTARTS:.status.containerStatuses[0].restartCount
POD                            READY   RESTARTS
monitor-demo-5688765d6-827jl   true    0
monitor-demo-5688765d6-kflbw   true    0
$ kubectl get --raw /readyz?verbose | tail -4
[+]poststarthook/apiservice-openapi-controller ok
[+]poststarthook/apiservice-openapiv3-controller ok
[+]shutdown ok
readyz check passed
$ kubectl logs -l app=monitor-demo --tail=2 --prefix
[pod/monitor-demo-5688765d6-827jl/nginx] 2026/10/07 17:17:41 [notice] 1#1: start worker process 40
[pod/monitor-demo-5688765d6-827jl/nginx] 2026/10/07 17:17:41 [notice] 1#1: start worker process 41
[pod/monitor-demo-5688765d6-kflbw/nginx] 2026/10/07 17:17:41 [notice] 1#1: start worker process 40
[pod/monitor-demo-5688765d6-kflbw/nginx] 2026/10/07 17:17:41 [notice] 1#1: start worker process 41
$ kubectl events --types=Warning -A | tail -3
No events found.
```

*(`metrics not available yet` for the brand-new demo Pods is expected: metrics-server scrapes every 15–60s, and the first sample for a new Pod takes a minute.)*

### Production stack
**Prometheus** (scrapes `/metrics`, PromQL, alert rules) + **Alertmanager** + **Grafana** dashboards. Installed with one Helm chart: `helm install monitoring prometheus-community/kube-prometheus-stack` (I searched this repo in [Session 15](../session-15-helm/README.md)). Example PromQL: `sum(rate(container_cpu_usage_seconds_total{namespace="webapp-prod"}[5m]))`.

## Task 2: Observability: the three pillars

**Observability** is being able to ask **new** questions about a system from its outputs ("*why* is it slow for this user?"), not just check predefined dashboards.

| Pillar | What it is | Answers | Common tools |
| --- | --- | --- | --- |
| **Metrics** | Numeric time series (counters, gauges, histograms), cheap to store | *Is something wrong? How much, and since when?* | Prometheus, Grafana, CloudWatch, Datadog |
| **Logs** | Timestamped event records, ideally structured (JSON) | *What exactly happened?* | Loki, ELK/EFK (Elasticsearch, Fluent Bit, Kibana), CloudWatch Logs |
| **Traces** | The path of one request across services (spans with timings) | *Where is the time spent, and which service failed?* | OpenTelemetry, Jaeger, Tempo, Zipkin |

**Why it's required:** microservices on Kubernetes are distributed, short-lived (Pods come and go) and scale dynamically. Without correlated metrics, logs and traces you can't find root causes quickly (MTTR), meet SLOs, plan capacity or debug problems that only happen in production.

**Kubernetes observability:** kubelet/cAdvisor (container metrics) · kube-state-metrics (object state: replicas, restarts) · node-exporter · metrics-server (HPA) · events · Fluent Bit DaemonSet to ship logs · the OpenTelemetry Collector for traces · probes for health.

## Task 3: GitOps

**GitOps** = operating infrastructure and apps where **Git is the single source of truth** and an **agent inside the cluster** keeps the cluster equal to Git.

| Principle | Meaning |
| --- | --- |
| **Git as the source of truth** | The desired state (YAML, Helm values) lives in Git. Every change is a commit or PR, so it is reviewed, versioned and auditable, and rolling back is just `git revert` |
| **Declarative configuration** | Describe *what* you want (manifests or charts), not the commands to get there |
| **Continuous reconciliation** | A controller (Argo CD, Flux) constantly compares cluster vs Git and fixes any drift (**self-heal**) |
| **Pull-based** | The cluster *pulls* from Git, so CI never needs cluster admin credentials |

```text
Developer ──PR──► Git repo (manifests / Helm values) ◄──watch/pull── Argo CD (in cluster)
                     ▲                                                    │ sync + self-heal
    CI updates the image tag in Git                                       ▼
                                                                    Kubernetes cluster
```

### Kubernetes + GitOps: my Argo CD Application

[gitops/argocd-application.yaml](gitops/argocd-application.yaml) points Argo CD at **this repository**, path `session-15-helm/03-mini-project/webapp` with `values-prod.yaml`, with `automated: {prune: true, selfHeal: true}`:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl apply -f gitops/argocd-application.yaml
# change replicaCount in values-prod.yaml → git push → Argo CD syncs automatically
# kubectl scale deploy ... by hand → Argo CD reverts it (self-heal)
```

> **Status:** the Argo CD manifest is ready but was **not applied** within the time available, so there is no screenshot of the Argo CD UI yet. The monitoring demo above is real output.
