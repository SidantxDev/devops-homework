# Session 15: Helm

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

**Helm** is the package manager for Kubernetes. A **chart** is a package of templated Kubernetes YAML plus default **values**. Installing a chart creates a **release**, and every install, upgrade or rollback creates a new **revision** that Helm stores in the cluster (as a Secret), which is what makes `history` and `rollback` possible.

```text
Chart (templates + values.yaml) ──helm install/upgrade──► Release "my-release" ──► revision 1, 2, 3 …
                       ▲ -f values-prod.yaml / --set key=value            (rendered YAML applied to Kubernetes)
```

| Task | Where |
| --- | --- |
| Task 1: Helm commands | Below, chart: [01-helm-commands/demo-app](01-helm-commands/demo-app/) |
| Task 2: Helm rollback workflow | Below, values: [02-helm-rollback](02-helm-rollback/) |
| Task 3: Mini project | [03-mini-project/README.md](03-mini-project/README.md) |

Environment: **Helm v4.1.4**, Minikube (Kubernetes v1.37).

---

# Task 1: Helm Commands

## `helm create`: scaffold a chart

```bash
$ helm version
version.BuildInfo{Version:"v4.1.4", GitCommit:"05fa37973dc9e42b76e1d2883494c87174b6074f", GitTreeState:"clean", GoVersion:"go1.25.9", KubeClientVersion:"v1.35"}
$ helm create demo-app
Creating demo-app
$ find demo-app -type f | sort
demo-app/.helmignore
demo-app/Chart.yaml
demo-app/templates/NOTES.txt
demo-app/templates/_helpers.tpl
demo-app/templates/deployment.yaml
demo-app/templates/hpa.yaml
demo-app/templates/httproute.yaml
demo-app/templates/ingress.yaml
demo-app/templates/service.yaml
demo-app/templates/serviceaccount.yaml
demo-app/templates/tests/test-connection.yaml
demo-app/values.yaml
$ cat demo-app/Chart.yaml | grep -v "^#" | grep -v "^$"
apiVersion: v2
name: demo-app
description: A Helm chart for Kubernetes
type: application
version: 0.1.0
appVersion: "1.16.0"
$ grep -E "^replicaCount|^image:|^  repository|^  tag|^service:|^  type|^  port" demo-app/values.yaml
replicaCount: 1
image:
  repository: nginx
  tag: ""
service:
  type: ClusterIP
  port: 80
$ helm lint demo-app
==> Linting demo-app
[INFO] Chart.yaml: icon is recommended

1 chart(s) linted, 0 chart(s) failed
$ helm template demo-app ./demo-app --set image.tag=1.26-alpine | grep -E "^kind:|image:|replicas:" 
kind: ServiceAccount
kind: Service
kind: Deployment
  replicas: 1
          image: "nginx:1.26-alpine"
kind: Pod
      image: busybox
```

**What it does:** Generates a ready-to-use chart. `Chart.yaml` holds the chart metadata (`version` is the chart's version, `appVersion` the app's), `values.yaml` holds the defaults, and `templates/` contains Go-templated manifests. `helm lint` checks the chart, and `helm template` renders it locally **without** installing anything. I set the default image tag to `1.26-alpine` in `values.yaml`.

## `helm install`, `helm list`, `helm status`, `helm get`

```bash
$ helm install my-release ./demo-app
NAME: my-release
LAST DEPLOYED: Wed Oct  7 21:37:08 2026
NAMESPACE: default
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=demo-app,app.kubernetes.io/instance=my-release" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
$ helm list
NAME      	NAMESPACE	REVISION	UPDATED                              	STATUS  	CHART         	APP VERSION
my-release	default  	1       	2026-10-07 21:37:08.4653995 +0530 IST	deployed	demo-app-0.1.0	1.26       
$ helm status my-release
NAME: my-release
LAST DEPLOYED: Wed Oct  7 21:37:08 2026
NAMESPACE: default
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
RESOURCES:
==> v1/Pod(related)
NAME                                   READY   STATUS              RESTARTS   AGE
my-release-demo-app-8647f6f654-wl4cd   0/1     ContainerCreating   0          1s

==> v1/ServiceAccount
NAME                  AGE
my-release-demo-app   1s

==> v1/Service
NAME                  TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
my-release-demo-app   ClusterIP   10.99.15.184   <none>        80/TCP    1s

==> v1/Deployment
NAME                  READY   UP-TO-DATE   AVAILABLE   AGE
my-release-demo-app   0/1     1            0           1s


NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=demo-app,app.kubernetes.io/instance=my-release" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
$ kubectl get deploy,svc,pods -l app.kubernetes.io/instance=my-release
NAME                                  READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/my-release-demo-app   0/1     1            0           1s

NAME                          TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service/my-release-demo-app   ClusterIP   10.99.15.184   <none>        80/TCP    1s

NAME                                       READY   STATUS    RESTARTS   AGE
pod/my-release-demo-app-8647f6f654-wl4cd   0/1     Running   0          1s
$ helm get values my-release
USER-SUPPLIED VALUES:
null
$ helm get values my-release --all | head -12
COMPUTED VALUES:
affinity: {}
autoscaling:
  enabled: false
  maxReplicas: 100
  minReplicas: 1
  targetCPUUtilizationPercentage: 80
fullnameOverride: ""
httpRoute:
  annotations: {}
  enabled: false
  hostnames:
$ helm get manifest my-release | grep -E "^# Source|^kind:|image:|replicas:"
# Source: demo-app/templates/serviceaccount.yaml
kind: ServiceAccount
# Source: demo-app/templates/service.yaml
kind: Service
# Source: demo-app/templates/deployment.yaml
kind: Deployment
  replicas: 1
          image: "nginx:1.26-alpine"
$ helm get notes my-release
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=demo-app,app.kubernetes.io/instance=my-release" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT

$ helm get metadata my-release
NAME: my-release
CHART: demo-app
VERSION: 0.1.0
APP_VERSION: 1.26
ANNOTATIONS: 
LABELS: modifiedAt=1791389228,name=my-release,owner=helm,status=deployed,version=1
DEPENDENCIES: 
NAMESPACE: default
REVISION: 1
STATUS: deployed
DEPLOYED_AT: 2026-10-07T21:37:08+05:30
APPLY_METHOD: server-side apply
```

| Command | What it does |
| --- | --- |
| `helm install <release> <chart>` | Renders the templates with the values and creates every resource, as **revision 1** |
| `helm list` | Releases in the namespace, with revision, status, chart and app version |
| `helm status <release>` | Release state, the resources it created, and the NOTES |
| `helm get values` | Values **I** supplied (`--all` includes the defaults) |
| `helm get manifest` | The exact YAML Helm applied |
| `helm get notes` / `metadata` | Post-install notes / release metadata |

## `helm upgrade`, `helm history`, `helm rollback`

```bash
$ helm upgrade my-release ./demo-app --set replicaCount=3
Release "my-release" has been upgraded. Happy Helming!
NAME: my-release
LAST DEPLOYED: Wed Oct  7 21:37:12 2026
NAMESPACE: default
STATUS: deployed
REVISION: 2
DESCRIPTION: Upgrade complete
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=demo-app,app.kubernetes.io/instance=my-release" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
$ kubectl rollout status deployment/my-release-demo-app --timeout=90s
Waiting for deployment "my-release-demo-app" rollout to finish: 1 of 3 updated replicas are available...
Waiting for deployment "my-release-demo-app" rollout to finish: 2 of 3 updated replicas are available...
deployment "my-release-demo-app" successfully rolled out
$ helm list
NAME      	NAMESPACE	REVISION	UPDATED                              	STATUS  	CHART         	APP VERSION
my-release	default  	2       	2026-10-07 21:37:12.4167132 +0530 IST	deployed	demo-app-0.1.0	1.26       
$ helm get values my-release
USER-SUPPLIED VALUES:
replicaCount: 3
$ kubectl get pods -l app.kubernetes.io/instance=my-release
NAME                                   READY   STATUS    RESTARTS   AGE
my-release-demo-app-8647f6f654-cldpf   1/1     Running   0          3s
my-release-demo-app-8647f6f654-rtmpw   1/1     Running   0          3s
my-release-demo-app-8647f6f654-wl4cd   1/1     Running   0          7s
$ helm history my-release
REVISION	UPDATED                 	STATUS    	CHART         	APP VERSION	DESCRIPTION     
1       	Wed Oct  7 21:37:08 2026	superseded	demo-app-0.1.0	1.26       	Install complete
2       	Wed Oct  7 21:37:12 2026	deployed  	demo-app-0.1.0	1.26       	Upgrade complete
$ helm rollback my-release 1
Rollback was a success! Happy Helming!
$ kubectl rollout status deployment/my-release-demo-app --timeout=90s
deployment "my-release-demo-app" successfully rolled out
$ helm history my-release
REVISION	UPDATED                 	STATUS    	CHART         	APP VERSION	DESCRIPTION     
1       	Wed Oct  7 21:37:08 2026	superseded	demo-app-0.1.0	1.26       	Install complete
2       	Wed Oct  7 21:37:12 2026	superseded	demo-app-0.1.0	1.26       	Upgrade complete
3       	Wed Oct  7 21:37:16 2026	deployed  	demo-app-0.1.0	1.26       	Rollback to 1   
$ kubectl get pods -l app.kubernetes.io/instance=my-release
NAME                                   READY   STATUS    RESTARTS   AGE
my-release-demo-app-8647f6f654-wl4cd   1/1     Running   0          19s
```

| Command | What it does |
| --- | --- |
| `helm upgrade <release> <chart> --set k=v` | Applies new values or a new chart version, creating a **new revision** (2) |
| `helm history <release>` | Every revision with its status (`deployed`, `superseded`, `failed`) |
| `helm rollback <release> <rev>` | Re-applies an old revision's config **as a new revision** (3: "Rollback to 1") |

## `helm test`, `helm uninstall`

```bash
$ helm test my-release
NAME: my-release
LAST DEPLOYED: Wed Oct  7 21:37:16 2026
NAMESPACE: default
STATUS: deployed
REVISION: 3
DESCRIPTION: Rollback to 1
TEST SUITE:     my-release-demo-app-test-connection
Last Started:   Wed Oct  7 21:37:27 2026
Last Completed: Wed Oct  7 21:37:32 2026
Phase:          Succeeded
$ helm uninstall my-release
release "my-release" uninstalled
$ helm list
NAME	NAMESPACE	REVISION	UPDATED	STATUS	CHART	APP VERSION
$ helm list -A
NAME	NAMESPACE	REVISION	UPDATED	STATUS	CHART	APP VERSION
$ kubectl get all -l app.kubernetes.io/instance=my-release
No resources found in default namespace.
```

`helm test` runs the chart's test Pods (here a `wget` against the Service). `helm uninstall` deletes every resource the release created, along with the release history.

## `helm repo`, `helm search`, `helm show`, `helm pull`

```bash
$ helm repo add bitnami https://charts.bitnami.com/bitnami
"bitnami" has been added to your repositories
$ helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
"prometheus-community" has been added to your repositories
$ helm repo update
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "prometheus-community" chart repository
...Successfully got an update from the "bitnami" chart repository
Update Complete. ⎈Happy Helming!⎈
$ helm repo list
NAME                	URL                                               
bitnami             	https://charts.bitnami.com/bitnami                
prometheus-community	https://prometheus-community.github.io/helm-charts
$ helm search repo nginx | head -6
NAME                                          	CHART VERSION	APP VERSION	DESCRIPTION                                       
bitnami/nginx                                 	25.2.1       	1.31.6     	NGINX Open Source is a web server that can be a...
bitnami/nginx-ingress-controller              	12.0.7       	1.13.1     	NGINX Ingress Controller is an Ingress controll...
bitnami/nginx-intel                           	2.1.15       	0.4.9      	DEPRECATED NGINX Open Source for Intel is a lig...
prometheus-community/prometheus-nginx-exporter	1.23.1       	1.5.3      	A Helm chart for NGINX Prometheus Exporter        
$ helm search repo prometheus-community/prometheus --versions 2>/dev/null | head -5
NAME                                              	CHART VERSION	APP VERSION	DESCRIPTION                                       
prometheus-community/prometheus                   	29.36.0      	v3.15.0    	Prometheus is a monitoring system and time seri...
prometheus-community/prometheus                   	29.35.0      	v3.15.0    	Prometheus is a monitoring system and time seri...
prometheus-community/prometheus                   	29.34.0      	v3.15.0    	Prometheus is a monitoring system and time seri...
prometheus-community/prometheus                   	29.33.1      	v3.15.0    	Prometheus is a monitoring system and time seri...
$ helm search hub argo-cd --max-col-width 60 2>/dev/null | head -6
URL                                                         	CHART VERSION	APP VERSION	DESCRIPTION                                                 
https://artifacthub.io/packages/helm/spnngl-argo-cd-crds/...	3.5.6        	3.5.4      	CustomResourceDefinitions for Argo CD (Applications, Appl...
https://artifacthub.io/packages/helm/emberstack/argo-cd-e...	1.0.22       	1.0.0      	A Helm chart for Argo CD extensions                         
https://artifacthub.io/packages/helm/argo-cd-oci/argo-cd    	10.10.0      	v3.5.4     	A Helm chart for Argo CD, a declarative, GitOps continuou...
https://artifacthub.io/packages/helm/mesosphere-stable/ar...	0.5.4        	1.2.0      	A Helm chart for Argo-CD                                    
https://artifacthub.io/packages/helm/capsule-argo-addon/c...	0.8.0        	0.8.0      	Capsule Argo Addon                                          
$ helm show chart bitnami/nginx | grep -E "^name|^version|^appVersion|^description"
appVersion: 1.31.6
description: NGINX Open Source is a web server that can be also used as a reverse
name: nginx
version: 25.2.1
$ helm show values bitnami/nginx | grep -E "^replicaCount|^  type:" | head -3
replicaCount: 1
  type: RollingUpdate
  type: ""
$ cd "$TEMP" && helm pull bitnami/nginx --untar --untardir helm-pull && ls helm-pull/nginx && rm -rf helm-pull; cd - >/dev/null
Chart.yaml
README.md
charts
templates
values.yaml
```

| Command | What it does |
| --- | --- |
| `helm repo add <name> <url>` | Registers a chart repository |
| `helm repo update` | Downloads the latest chart index from every repository |
| `helm repo list` | Lists the configured repositories |
| `helm search repo <keyword>` | Searches **added** repositories (`--versions` lists every version) |
| `helm search hub <keyword>` | Searches **Artifact Hub** (all public charts) |
| `helm show chart` / `values` | Inspects a chart's metadata and defaults before installing |
| `helm pull --untar` | Downloads the chart source to read or customise it |

---

# Task 2: Helm Rollback Workflow

```text
Install (v1) → Upgrade (v2) → Verify → Upgrade again (v3, BAD) → Verify (broken) → Rollback to v2 → Verify
```

| Revision | Values file | Change |
| --- | --- | --- |
| 1 | [values-v1.yaml](02-helm-rollback/values-v1.yaml) | `nginx:1.26-alpine`, 1 replica |
| 2 | [values-v2.yaml](02-helm-rollback/values-v2.yaml) | `nginx:1.27-alpine`, 3 replicas |
| 3 | [values-v3-bad.yaml](02-helm-rollback/values-v3-bad.yaml) | Typo in the tag: `1.27-alpnie` (a broken release) |

Each step is verified by asking the running app for its version (`Server:` header).

### Install → Verify

```bash
$ helm install shop ../01-helm-commands/demo-app -f values-v1.yaml --wait
NAME: shop
LAST DEPLOYED: Wed Oct  7 21:38:46 2026
NAMESPACE: default
STATUS: deployed
REVISION: 1
DESCRIPTION: Install complete
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=demo-app,app.kubernetes.io/instance=shop" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
$ helm history shop
REVISION	UPDATED                 	STATUS  	CHART         	APP VERSION	DESCRIPTION     
1       	Wed Oct  7 21:38:46 2026	deployed	demo-app-0.1.0	1.26       	Install complete
$ kubectl get deploy shop-demo-app -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,IMAGE:.spec.template.spec.containers[0].image
NAME            REPLICAS   IMAGE
shop-demo-app   1          nginx:1.26-alpine
$ kubectl exec curl-client -- sh -c 'curl -sI http://shop-demo-app | grep -i "^server"'
Server: nginx/1.26.3
```

### Upgrade → Verify

```bash
$ helm upgrade shop ../01-helm-commands/demo-app -f values-v2.yaml --wait
Release "shop" has been upgraded. Happy Helming!
NAME: shop
LAST DEPLOYED: Wed Oct  7 21:38:49 2026
NAMESPACE: default
STATUS: deployed
REVISION: 2
DESCRIPTION: Upgrade complete
NOTES:
1. Get the application URL by running these commands:
  export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=demo-app,app.kubernetes.io/instance=shop" -o jsonpath="{.items[0].metadata.name}")
  export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
  echo "Visit http://127.0.0.1:8080 to use your application"
  kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
$ helm history shop
REVISION	UPDATED                 	STATUS    	CHART         	APP VERSION	DESCRIPTION     
1       	Wed Oct  7 21:38:46 2026	superseded	demo-app-0.1.0	1.26       	Install complete
2       	Wed Oct  7 21:38:49 2026	deployed  	demo-app-0.1.0	1.26       	Upgrade complete
$ kubectl get deploy shop-demo-app -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,IMAGE:.spec.template.spec.containers[0].image
NAME            REPLICAS   IMAGE
shop-demo-app   3          nginx:1.27-alpine
$ kubectl get pods -l app.kubernetes.io/instance=shop
NAME                             READY   STATUS      RESTARTS   AGE
shop-demo-app-6cf7f8f856-r5gs6   0/1     Completed   0          15s
shop-demo-app-6f6d5c69fc-hpfck   1/1     Running     0          2s
shop-demo-app-6f6d5c69fc-ns8c8   1/1     Running     0          1s
shop-demo-app-6f6d5c69fc-nzcnh   1/1     Running     0          15s
$ kubectl exec curl-client -- sh -c 'curl -sI http://shop-demo-app | grep -i "^server"'
Server: nginx/1.27.5
```

### Upgrade again (bad release) → Verify

```bash
$ helm upgrade shop ../01-helm-commands/demo-app -f values-v3-bad.yaml --wait --timeout 45s
level=WARN msg="upgrade failed" name=shop error="resource Deployment/default/shop-demo-app not ready. status: InProgress, message: Updated: 1/3\ncontext deadline exceeded"
Error: UPGRADE FAILED: resource Deployment/default/shop-demo-app not ready. status: InProgress, message: Updated: 1/3
context deadline exceeded
$ helm history shop
REVISION	UPDATED                 	STATUS    	CHART         	APP VERSION	DESCRIPTION                                                                                                          
1       	Wed Oct  7 21:38:46 2026	superseded	demo-app-0.1.0	1.26       	Install complete                                                                                                     
2       	Wed Oct  7 21:38:49 2026	deployed  	demo-app-0.1.0	1.26       	Upgrade complete                                                                                                     
3       	Wed Oct  7 21:39:05 2026	failed    	demo-app-0.1.0	1.26       	Upgrade "shop" failed: resource Deployment/default/shop-demo-app not ready. status: InProgress, message: Updated: ...
$ kubectl get pods -l app.kubernetes.io/instance=shop
NAME                             READY   STATUS             RESTARTS   AGE
shop-demo-app-649f99d77f-wz7z2   0/1     ImagePullBackOff   0          45s
shop-demo-app-6f6d5c69fc-hpfck   1/1     Running            0          48s
shop-demo-app-6f6d5c69fc-ns8c8   1/1     Running            0          47s
shop-demo-app-6f6d5c69fc-nzcnh   1/1     Running            0          61s
$ kubectl get deploy shop-demo-app -o custom-columns=NAME:.metadata.name,READY:.status.readyReplicas,UPDATED:.status.updatedReplicas,IMAGE:.spec.template.spec.containers[0].image
NAME            READY   UPDATED   IMAGE
shop-demo-app   3       1         nginx:1.27-alpnie
$ kubectl exec curl-client -- sh -c 'curl -sI http://shop-demo-app | grep -i "^server"'
Server: nginx/1.27.5
```

### Rollback → Verify

```bash
$ helm rollback shop 2 --wait
Rollback was a success! Happy Helming!
$ helm history shop
REVISION	UPDATED                 	STATUS    	CHART         	APP VERSION	DESCRIPTION                                                                                                          
1       	Wed Oct  7 21:38:46 2026	superseded	demo-app-0.1.0	1.26       	Install complete                                                                                                     
2       	Wed Oct  7 21:38:49 2026	superseded	demo-app-0.1.0	1.26       	Upgrade complete                                                                                                     
3       	Wed Oct  7 21:39:05 2026	failed    	demo-app-0.1.0	1.26       	Upgrade "shop" failed: resource Deployment/default/shop-demo-app not ready. status: InProgress, message: Updated: ...
4       	Wed Oct  7 21:39:51 2026	deployed  	demo-app-0.1.0	1.26       	Rollback to 2                                                                                                        
$ kubectl rollout status deployment/shop-demo-app --timeout=90s
deployment "shop-demo-app" successfully rolled out
$ kubectl get pods -l app.kubernetes.io/instance=shop
NAME                             READY   STATUS    RESTARTS   AGE
shop-demo-app-6f6d5c69fc-hpfck   1/1     Running   0          58s
shop-demo-app-6f6d5c69fc-ns8c8   1/1     Running   0          57s
shop-demo-app-6f6d5c69fc-nzcnh   1/1     Running   0          71s
$ kubectl get deploy shop-demo-app -o custom-columns=NAME:.metadata.name,REPLICAS:.spec.replicas,IMAGE:.spec.template.spec.containers[0].image
NAME            REPLICAS   IMAGE
shop-demo-app   3          nginx:1.27-alpine
$ helm get values shop
USER-SUPPLIED VALUES:
image:
  tag: 1.27-alpine
replicaCount: 3
$ kubectl exec curl-client -- sh -c 'curl -sI http://shop-demo-app | grep -i "^server"'
Server: nginx/1.27.5
$ helm list
NAME	NAMESPACE	REVISION	UPDATED                              	STATUS  	CHART         	APP VERSION
shop	default  	4       	2026-10-07 21:39:51.4208168 +0530 IST	deployed	demo-app-0.1.0	1.26       
```

### What happened

| Step | Revision | Result | Verified by |
| --- | --- | --- | --- |
| Install | 1 | `deployed` | 1 Pod, `Server: nginx/1.26.3` |
| Upgrade | 2 | `deployed` | 3 Pods, `Server: nginx/1.27.5` |
| Upgrade again | 3 | **`failed`** | `--wait` timed out. The new Pod is in `ImagePullBackOff` and the Deployment shows `UPDATED 1` with image `nginx:1.27-alpnie`. The **old v2 Pods kept serving** (rolling update + `maxUnavailable`), so users saw no outage |
| Rollback to 2 | **4** ("Rollback to 2") | `deployed` | The broken Pod is gone, 3 healthy Pods, image `1.27-alpine`, `Server: nginx/1.27.5` |

**Lessons:**
- A rollback **doesn't delete history**. It creates a **new** revision (4) with revision 2's configuration, and revision 3 stays as `failed` for the record.
- Use `--wait` (and `--timeout`) so a bad upgrade is reported as **`failed`** instead of looking `deployed`.
- `helm rollback <release>` without a number goes back to the previous revision.
