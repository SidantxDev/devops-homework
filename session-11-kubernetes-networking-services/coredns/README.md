# Task 4: CoreDNS

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

## What is CoreDNS?

**CoreDNS** is a fast, flexible DNS server written in Go and built from **plugins**. It is a CNCF graduated project and has been the **default cluster DNS in Kubernetes since v1.13**, replacing `kube-dns`. It runs as a normal **Deployment** in `kube-system`, exposed through a Service that is still called **`kube-dns`** for backward compatibility.

```bash
$ kubectl get deployment coredns -n kube-system
NAME      READY   UP-TO-DATE   AVAILABLE   AGE
coredns   1/1     1            1           22d
$ kubectl get pods -n kube-system -l k8s-app=kube-dns -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP
NAME                       STATUS    IP
coredns-559f6c778d-wrxcf   Running   10.244.0.120
$ kubectl get svc kube-dns -n kube-system
NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   22d
$ kubectl get endpointslices -n kube-system -l kubernetes.io/service-name=kube-dns
NAME             ADDRESSTYPE   PORTS        ENDPOINTS      AGE
kube-dns-s29gx   IPv4          53,53,9153   10.244.0.120   22d
```

## Why Kubernetes uses CoreDNS

- **Service discovery by name:** Pod and Service IPs change all the time, and DNS lets apps use stable names instead.
- **Plugin-based:** Features such as caching, metrics, logging, forwarding and rewriting are just lines in a config file.
- **Watches the Kubernetes API:** The `kubernetes` plugin answers directly from the live list of Services and EndpointSlices, so records are always up to date.
- **Lightweight and secure:** A single binary with a small memory footprint, it can run several replicas for high availability.
- **Forwards external names**, such as `example.com`, to the upstream DNS server.

## How Service discovery works

1. A Service is created. The API server stores it, and the **EndpointSlice controller** records the IPs of the ready Pods behind it.
2. CoreDNS's `kubernetes` plugin **watches** Services and EndpointSlices through the API.
3. The kubelet writes `/etc/resolv.conf` in every Pod with `nameserver 10.96.0.10` (the `kube-dns` ClusterIP) plus the search domains.
4. The app looks up `web-clusterip`. The resolver adds the search suffix, asks CoreDNS, and receives the ClusterIP. kube-proxy then sends the connection to one of the Pods.

## How DNS queries are resolved

```text
Pod: curl http://web-clusterip
  │ resolv.conf: search default.svc.cluster.local ...  ndots:5
  ▼
query "web-clusterip.default.svc.cluster.local"  ──► 10.96.0.10:53 (kube-dns Service)
                                                         │ kube-proxy
                                                         ▼
                                                   CoreDNS Pod
          ┌───────────────────────────────────────────────┴─────────────────────┐
          │ ends in cluster.local?                                               │
          │   YES → "kubernetes" plugin → answer from API data (A record)        │
          │   NO  → "cache" → "forward . /etc/resolv.conf" → upstream DNS        │
          └──────────────────────────────────────────────────────────────────────┘
```

```bash
$ kubectl exec dns-client -- nslookup kubernetes.default.svc.cluster.local
Server:		10.96.0.10
Address:	10.96.0.10:53


Name:	kubernetes.default.svc.cluster.local
Address: 10.96.0.1

$ kubectl exec dns-client -- nslookup -timeout=5 example.com
Server:		10.96.0.10
Address:	10.96.0.10:53

Non-authoritative answer:

Non-authoritative answer:
Name:	example.com
Address: 104.20.23.154
Name:	example.com
Address: 172.66.147.243
```

The first lookup was answered from cluster data (it is a `cluster.local` name). `example.com` was **forwarded** to the upstream resolver, which is why the answer is "Non-authoritative".

## CoreDNS configuration (the Corefile)

CoreDNS is configured by the `coredns` ConfigMap in `kube-system`:

```bash
$ kubectl get configmap coredns -n kube-system -o jsonpath='{.data.Corefile}'
.:53 {
    log
    errors
    health {
       lameduck 5s
    }
    ready
    kubernetes cluster.local in-addr.arpa ip6.arpa {
       pods insecure
       fallthrough in-addr.arpa ip6.arpa
       ttl 30
    }
    prometheus :9153
    hosts {
       192.168.65.254 host.minikube.internal
       fallthrough
    }
    forward . /etc/resolv.conf {
       max_concurrent 1000
    }
    cache 30 {
       disable success cluster.local
       disable denial cluster.local
    }
    loop
    reload
    loadbalance
}
```

| Plugin | What it does |
| --- | --- |
| `.:53` | Serve every zone (`.`) on port 53 |
| `log` / `errors` | Log every query (handy for debugging) and log errors |
| `health` / `ready` | `:8080/health` for liveness and `:8181/ready` for readiness probes |
| `kubernetes cluster.local ...` | Answer cluster names from the Kubernetes API. `pods insecure` enables Pod A records, and `ttl 30` sets the record TTL |
| `prometheus :9153` | Expose metrics for Prometheus |
| `hosts` | Static entries (Minikube adds `host.minikube.internal`) |
| `forward . /etc/resolv.conf` | Send all other names to the node's upstream DNS |
| `cache 30` | Cache answers for 30 seconds |
| `loop` / `reload` / `loadbalance` | Detect forwarding loops, reload the Corefile automatically when it changes, and shuffle A records |

## How to troubleshoot DNS issues

**Checklist:**

1. Is the name right (spelling, namespace)? Test with the **full FQDN**.
2. Is CoreDNS running? `kubectl get pods -n kube-system -l k8s-app=kube-dns`
3. Does the `kube-dns` Service have **endpoints**? `kubectl get endpointslices -n kube-system -l kubernetes.io/service-name=kube-dns`
4. Is the Pod's `/etc/resolv.conf` correct? `kubectl exec <pod> -- cat /etc/resolv.conf`
5. What does CoreDNS log? `kubectl logs -n kube-system -l k8s-app=kube-dns`
6. Is the Corefile correct? `kubectl get cm coredns -n kube-system -o yaml`
7. Are NetworkPolicies blocking UDP/TCP port 53?

### Problem 1: Wrong Service name (`NXDOMAIN`)

```bash
$ kubectl exec curl-client -- sh -c 'curl -s -m 3 http://web-clusteripp || echo "curl exit code $? -> name could not be resolved"'
curl exit code 28 -> name could not be resolved
$ kubectl exec dns-client -- nslookup web-clusteripp.default.svc.cluster.local
Server:		10.96.0.10
Address:	10.96.0.10:53

** server can't find web-clusteripp.default.svc.cluster.local: NXDOMAIN

** server can't find web-clusteripp.default.svc.cluster.local: NXDOMAIN

command terminated with exit code 1
$ kubectl get svc | grep web-cluster
web-clusterip      ClusterIP      10.111.77.60    <none>        80/TCP           3m13s
```

**Root cause:** A typo (`web-clusteripp`). `NXDOMAIN` means the DNS server **is working** but the name **does not exist**. `kubectl get svc` shows the correct name. **Fix:** Use `web-clusterip`.

### Problem 2: CoreDNS is down (no DNS server reachable)

I simulated a DNS outage by scaling CoreDNS to 0 replicas:

```bash
$ kubectl scale deployment coredns -n kube-system --replicas=0
deployment.apps/coredns scaled
$ kubectl exec dns-client -- nslookup -timeout=2 web-clusterip.default.svc.cluster.local
nslookup: write to '10.96.0.10': Connection refused
;; connection timed out; no servers could be reached

command terminated with exit code 1
$ kubectl get endpointslices -n kube-system -l kubernetes.io/service-name=kube-dns
NAME             ADDRESSTYPE   PORTS     ENDPOINTS   AGE
kube-dns-s29gx   IPv4          <unset>   <unset>     22d
$ kubectl scale deployment coredns -n kube-system --replicas=1
deployment.apps/coredns scaled
$ kubectl rollout status deployment/coredns -n kube-system --timeout=90s
Waiting for deployment "coredns" rollout to finish: 0 of 1 updated replicas are available...
deployment "coredns" successfully rolled out
$ kubectl exec dns-client -- nslookup web-clusterip.default.svc.cluster.local
Server:		10.96.0.10
Address:	10.96.0.10:53

Name:	web-clusterip.default.svc.cluster.local
Address: 10.111.77.60



$ kubectl logs -n kube-system -l k8s-app=kube-dns --tail=4
linux/amd64, go1.26.5, 424d125
[INFO] 127.0.0.1:48361 - 19831 "HINFO IN 779923706414046553.3362433351335646919. udp 56 false 512" NXDOMAIN qr,rd,ra 56 0.115560355s
[INFO] 10.244.0.115:35704 - 61210 "A IN web-clusterip.default.svc.cluster.local. udp 57 false 512" NOERROR qr,aa,rd 112 0.001438505s
[INFO] 10.244.0.115:35704 - 42516 "AAAA IN web-clusterip.default.svc.cluster.local. udp 57 false 512" NOERROR qr,aa,rd 150 0.002063046s
```

**Investigation:** The error is now `connection timed out; no servers could be reached` / `Connection refused`, not `NXDOMAIN`, so the **DNS server itself** cannot be reached. The `kube-dns` EndpointSlice has **no endpoints** (`<unset>`), meaning no CoreDNS Pod is behind the Service.
**Root cause:** No CoreDNS Pods were running.
**Fix:** Scale CoreDNS back up. Once its Pod was ready, the same lookup worked, and the CoreDNS logs show the query answered with `NOERROR`.
