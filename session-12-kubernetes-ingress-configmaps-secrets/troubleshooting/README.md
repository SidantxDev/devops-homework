# Task 5: Troubleshooting (Ingress, Services, ConfigMaps, Secrets)

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

Each folder has a `broken.yaml` with a realistic bug and a `fixed.yaml`. For each one I followed the same steps: **identify the problem → run troubleshooting commands → find the root cause → fix → capture before/after output.**

**General troubleshooting commands used:**

| Command | Why |
| --- | --- |
| `kubectl get pod/svc/ingress` | Check status at a glance (`STATUS`, `ADDRESS`, `ENDPOINTS`) |
| `kubectl describe <obj>` | **Events** and resolved backends often state the exact error |
| `kubectl get endpointslices -l kubernetes.io/service-name=<svc>` | Is the Service actually connected to any Pods? |
| `kubectl get pods --show-labels` | Compare Pod labels against the Service selector |
| `kubectl get cm/secret ... -o jsonpath='{.data}'` | Check which keys and names really exist |
| `curl -H "Host: ..."` | Test the Ingress route from the outside |

---

## Issue 1: Ingress returns 503 (wrong Service name): [01-ingress-wrong-service](01-ingress-wrong-service/)

```bash
$ kubectl apply -f 01-ingress-wrong-service/broken.yaml
ingress.networking.k8s.io/shop-ingress created
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" -H "Host: shop.local" http://127.0.0.1/
HTTP 503
$ kubectl describe ingress shop-ingress | sed -n '/^Rules/,/^Annotations/p'
Rules:
  Host        Path  Backends
  ----        ----  --------
  shop.local  
              /   app1-service:80 (<error: services "app1-service" not found>)
Annotations:  <none>
$ kubectl get svc app1-service
Error from server (NotFound): services "app1-service" not found
$ kubectl get svc | grep app1
app1-svc     ClusterIP   10.99.109.126   <none>        80/TCP    13m
$ kubectl apply -f 01-ingress-wrong-service/fixed.yaml
ingress.networking.k8s.io/shop-ingress configured
$ kubectl describe ingress shop-ingress | sed -n '/^Rules/,/^Annotations/p'
Rules:
  Host        Path  Backends
  ----        ----  --------
  shop.local  
              /   app1-svc:80 (10.244.0.124:5678,10.244.0.125:5678)
Annotations:  <none>
$ curl -s -w "HTTP %{http_code}\n" -H "Host: shop.local" http://127.0.0.1/
Hello from APP 1
HTTP 200
```

| | |
| --- | --- |
| **Problem** | `http://shop.local/` returns **HTTP 503 Service Unavailable** |
| **Investigation** | `kubectl describe ingress` shows the backend as `<error: services "app1-service" not found>` |
| **Root cause** | The Ingress backend names `app1-service`, but the real Service is `app1-svc` |
| **Fix** | Correct `backend.service.name` to `app1-svc` |
| **After** | The backend resolves to 2 Pod IPs, and the route returns **HTTP 200** "Hello from APP 1" |

---

## Issue 2: Ingress returns 503 (Service selector doesn't match the Pods): [02-service-selector-mismatch](02-service-selector-mismatch/)

```bash
$ kubectl apply -f 02-service-selector-mismatch/broken.yaml
service/shop-svc created
ingress.networking.k8s.io/shop2-ingress created
$ curl -s -o /dev/null -w "HTTP %{http_code}\n" -H "Host: shop2.local" http://127.0.0.1/
HTTP 503
$ kubectl get endpointslices -l kubernetes.io/service-name=shop-svc
NAME             ADDRESSTYPE   PORTS     ENDPOINTS   AGE
shop-svc-gfqpl   IPv4          <unset>   <unset>     52s
$ kubectl get svc shop-svc -o jsonpath='Service selector: {.spec.selector}{"\n"}'
Service selector: {"app":"App2"}
$ kubectl get pods --show-labels | grep -E "NAME|app2"
NAME                    READY   STATUS    RESTARTS   AGE   LABELS
app2-bbc59978-jjwdg     1/1     Running   0          14m   app=app2,pod-template-hash=bbc59978
app2-bbc59978-xwmzw     1/1     Running   0          14m   app=app2,pod-template-hash=bbc59978
$ kubectl apply -f 02-service-selector-mismatch/fixed.yaml
service/shop-svc configured
ingress.networking.k8s.io/shop2-ingress unchanged
$ kubectl get endpointslices -l kubernetes.io/service-name=shop-svc
NAME             ADDRESSTYPE   PORTS   ENDPOINTS                   AGE
shop-svc-gfqpl   IPv4          5678    10.244.0.127,10.244.0.126   60s
$ curl -s -w "HTTP %{http_code}\n" -H "Host: shop2.local" http://127.0.0.1/
Hello from APP 2
HTTP 200
```

| | |
| --- | --- |
| **Problem** | The Service and Ingress both exist and look fine, but the route returns **HTTP 503** |
| **Investigation** | The Service's EndpointSlice has **no endpoints** (`<unset>`). The selector is `app=App2`, but the Pods are labelled `app=app2` |
| **Root cause** | **Labels are case-sensitive.** The selector matched zero Pods, so the Service had nowhere to send traffic |
| **Fix** | Change the selector to `app: app2` |
| **After** | The EndpointSlice lists the 2 Pod IPs, and the route returns **HTTP 200** "Hello from APP 2" |

---

## Issue 3: `CreateContainerConfigError` (missing ConfigMap key): [03-missing-configmap-key](03-missing-configmap-key/)

```bash
$ kubectl apply -f 03-missing-configmap-key/broken.yaml
pod/cm-broken-pod created
$ kubectl get pod cm-broken-pod
NAME            READY   STATUS                       RESTARTS   AGE
cm-broken-pod   0/1     CreateContainerConfigError   0          8s
$ kubectl describe pod cm-broken-pod | sed -n '/^Events:/,$p' | grep -E "Type|----|Warning"
  Type     Reason     Age              From               Message
  ----     ------     ----             ----               -------
  Warning  Failed     7s (x2 over 8s)  kubelet            Error: couldn't find key log_level in ConfigMap default/app-config
$ kubectl get configmap app-config -o jsonpath='{.data}' ; echo
{"APP_ENV":"production","LOG_LEVEL":"debug","MAX_CONNECTIONS":"100","app.properties":"app.name=devops-demo\napp.theme=dark\nfeature.new-ui=true\n"}
$ kubectl delete pod cm-broken-pod --now
pod "cm-broken-pod" deleted from default namespace
$ kubectl apply -f 03-missing-configmap-key/fixed.yaml
pod/cm-broken-pod created
$ kubectl wait --for=condition=Ready pod/cm-broken-pod --timeout=60s
pod/cm-broken-pod condition met
$ kubectl get pod cm-broken-pod
NAME            READY   STATUS    RESTARTS   AGE
cm-broken-pod   1/1     Running   0          1s
$ kubectl logs cm-broken-pod
LOG_LEVEL=debug
```

| | |
| --- | --- |
| **Problem** | The Pod is stuck in **`CreateContainerConfigError`** and the container never starts |
| **Investigation** | The events say `couldn't find key log_level in ConfigMap default/app-config`. Listing the ConfigMap's data shows the key is `LOG_LEVEL` |
| **Root cause** | ConfigMap **keys are case-sensitive**: `log_level` ≠ `LOG_LEVEL` |
| **Fix** | Use `key: LOG_LEVEL` and recreate the Pod (most Pod fields can't be edited in place) |
| **After** | The Pod is `Running`, and the logs print `LOG_LEVEL=debug` |

---

## Issue 4: `CreateContainerConfigError` (Secret not found): [04-missing-secret](04-missing-secret/)

```bash
$ kubectl apply -f 04-missing-secret/broken.yaml
pod/secret-broken-pod created
$ kubectl get pod secret-broken-pod
NAME                READY   STATUS                       RESTARTS   AGE
secret-broken-pod   0/1     CreateContainerConfigError   0          8s
$ kubectl describe pod secret-broken-pod | sed -n '/^Events:/,$p' | grep -E "Type|----|Warning"
  Type     Reason     Age              From               Message
  ----     ------     ----             ----               -------
  Warning  Failed     8s (x2 over 8s)  kubelet            Error: secret "database-secret" not found
$ kubectl get secrets
NAME        TYPE     DATA   AGE
db-secret   Opaque   2      15m
$ kubectl delete pod secret-broken-pod --now
pod "secret-broken-pod" deleted from default namespace
$ kubectl apply -f 04-missing-secret/fixed.yaml
pod/secret-broken-pod created
$ kubectl wait --for=condition=Ready pod/secret-broken-pod --timeout=60s
pod/secret-broken-pod condition met
$ kubectl get pod secret-broken-pod
NAME                READY   STATUS    RESTARTS   AGE
secret-broken-pod   1/1     Running   0          1s
$ kubectl logs secret-broken-pod
connected as admin
```

| | |
| --- | --- |
| **Problem** | The Pod is stuck in **`CreateContainerConfigError`** |
| **Investigation** | The events say `secret "database-secret" not found`. `kubectl get secrets` shows only `db-secret` |
| **Root cause** | Wrong Secret name in `secretKeyRef`, or the Secret was never created in this namespace (Secrets are namespaced) |
| **Fix** | Reference `db-secret` |
| **After** | The Pod is `Running`, and the logs print `connected as admin` |

---

### Key lessons

- **503 from the Ingress** means the controller is fine but the **backend** is not. Check that the Service exists and **has endpoints**.
- **404 from the Ingress** means **no rule matched** the host or path.
- **`CreateContainerConfigError`** means a referenced **ConfigMap, Secret or key is missing**. `kubectl describe pod` tells you exactly which one.
- Names, labels and keys are all **case-sensitive**.
