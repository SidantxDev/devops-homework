# Task 3: FQDN in Kubernetes

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

## What is an FQDN?

A **Fully Qualified Domain Name** is the **complete** DNS name of a host, all the way up to the root, so it means the same thing wherever it is used. For example `www.google.com.` is fully qualified (the trailing dot is the root), while `www` alone is a short name that needs a **search domain** added to it.

## Kubernetes Service DNS

Every Kubernetes cluster runs a DNS server (**CoreDNS**). Each Pod's `/etc/resolv.conf` points to it, and every Service automatically gets a DNS record:

```bash
$ kubectl exec curl-client -- cat /etc/resolv.conf
search default.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
```

- `nameserver 10.96.0.10` is the ClusterIP of the `kube-dns` Service, which is CoreDNS.
- `search default.svc.cluster.local svc.cluster.local cluster.local` lists the suffixes that are tried, in order, when a short name is looked up.
- `ndots:5` means that a name with fewer than 5 dots is tried with the search suffixes first.

## Kubernetes DNS naming convention

| Object | FQDN format | Resolves to |
| --- | --- | --- |
| Service (ClusterIP) | `<service>.<namespace>.svc.<cluster-domain>` | The Service's ClusterIP |
| Headless Service | `<service>.<namespace>.svc.cluster.local` | **All** ready Pod IPs |
| StatefulSet Pod (via a headless Service) | `<pod-name>.<service>.<namespace>.svc.cluster.local` | That one Pod's IP |
| Pod | `<pod-ip-with-dashes>.<namespace>.pod.cluster.local` | The Pod's IP |
| ExternalName Service | `<service>.<namespace>.svc.cluster.local` | A CNAME to the external host |

The default `<cluster-domain>` is `cluster.local`.

## Namespace-based DNS and Pod-to-Service communication

From a Pod in the **`default`** namespace, every form of the name works for a Service in the **same** namespace, because the search list fills in the rest:

```bash
$ kubectl exec curl-client -- sh -c 'for n in web-clusterip web-clusterip.default web-clusterip.default.svc web-clusterip.default.svc.cluster.local; do printf "%-42s -> " $n; curl -s -m 3 http://$n | grep Hostname || echo FAILED; done'
web-clusterip                              -> Hostname: web-85bdfcd4f6-rhr5t
web-clusterip.default                      -> Hostname: web-85bdfcd4f6-77cjm
web-clusterip.default.svc                  -> Hostname: web-85bdfcd4f6-k9qnq
web-clusterip.default.svc.cluster.local    -> Hostname: web-85bdfcd4f6-77cjm
$ kubectl exec dns-client -- nslookup web-clusterip.default.svc.cluster.local
Server:		10.96.0.10
Address:	10.96.0.10:53


Name:	web-clusterip.default.svc.cluster.local
Address: 10.111.77.60
```

For a Service in **another namespace** (`api` in `dev`), the short name **fails**. The search list only adds `default.svc...`, so it looks for `api.default.svc.cluster.local`, which does not exist. You must include at least the namespace:

```bash
$ kubectl get svc -n dev api
NAME   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
api    ClusterIP   10.105.98.173   <none>        80/TCP    18s
$ kubectl exec curl-client -- sh -c 'for n in api api.dev api.dev.svc.cluster.local; do printf "%-30s -> " $n; curl -s -m 3 http://$n | grep Hostname || echo "FAILED (could not resolve)"; done'
api                            -> FAILED (could not resolve)
api.dev                        -> Hostname: api-b54cf9cf5-ts8pn
api.dev.svc.cluster.local      -> Hostname: api-b54cf9cf5-ts8pn
$ kubectl exec dns-client -- nslookup api.dev.svc.cluster.local
Server:		10.96.0.10
Address:	10.96.0.10:53


Name:	api.dev.svc.cluster.local
Address: 10.105.98.173
```

**Rule:** Within the same namespace, use `my-svc`. Across namespaces, use `my-svc.other-namespace` or the full FQDN `my-svc.other-namespace.svc.cluster.local`. The full FQDN is the safest choice in config files.

## Pod and headless DNS records

```bash
$ POD_IP=$(kubectl get pod -l app=web -o jsonpath='{.items[0].status.podIP}') && echo "Pod IP: $POD_IP" && kubectl exec dns-client -- nslookup $(echo $POD_IP | tr . -).default.pod.cluster.local
Pod IP: 10.244.0.118
Server:		10.96.0.10
Address:	10.96.0.10:53


Name:	10-244-0-118.default.pod.cluster.local
Address: 10.244.0.118

$ kubectl exec dns-client -- nslookup web-headless.default.svc.cluster.local
Server:		10.96.0.10
Address:	10.96.0.10:53


Name:	web-headless.default.svc.cluster.local
Address: 10.244.0.116
Name:	web-headless.default.svc.cluster.local
Address: 10.244.0.118
Name:	web-headless.default.svc.cluster.local
Address: 10.244.0.117
```

## Examples of Kubernetes FQDNs (from my cluster)

| FQDN | What it is |
| --- | --- |
| `web-clusterip.default.svc.cluster.local` | ClusterIP Service → `10.111.77.60` |
| `web-headless.default.svc.cluster.local` | Headless Service → 3 Pod IPs |
| `api.dev.svc.cluster.local` | Service `api` in namespace `dev` → `10.105.98.173` |
| `external-example.default.svc.cluster.local` | ExternalName → CNAME `example.com` |
| `kubernetes.default.svc.cluster.local` | The Kubernetes API server → `10.96.0.1` |
| `kube-dns.kube-system.svc.cluster.local` | CoreDNS itself → `10.96.0.10` |
| `10-244-0-118.default.pod.cluster.local` | A Pod record → `10.244.0.118` |
| `mysql-0.mysql.db.svc.cluster.local` | (pattern) Pod `mysql-0` of a StatefulSet behind headless Service `mysql` in namespace `db` |
