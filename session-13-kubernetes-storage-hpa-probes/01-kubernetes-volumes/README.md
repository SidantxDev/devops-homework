# Task 1: Kubernetes Volumes

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

A container's filesystem is **temporary**: when the container restarts, everything written to it is lost. **Volumes** give Pods storage that outlives a container restart (and, for persistent volumes, outlives the Pod).

```text
 Lifetime of the data:
 container fs  <  emptyDir (Pod)  <  hostPath (node)  <  PersistentVolume (cluster / cloud disk)
```

| Volume | Lives as long as | Shared between | Use case |
| --- | --- | --- | --- |
| `emptyDir` | The **Pod** | Containers in the same Pod | Scratch space, caches, sidecars sharing files |
| `hostPath` | The **node** | Pods on the same node | Node agents (log collectors), local testing only |
| PV + PVC | **Independent** of Pods | As the access mode allows | Databases, uploads, anything that must persist |

---

## 1. emptyDir: [01-emptydir.yaml](01-emptydir.yaml)

An empty directory is created when the Pod is scheduled and **deleted when the Pod is removed**. It can be backed by disk or by RAM (`medium: Memory`).

```bash
$ kubectl apply -f 01-emptydir.yaml
pod/emptydir-demo created
$ kubectl wait --for=condition=Ready pod/emptydir-demo --timeout=90s
pod/emptydir-demo condition met
$ kubectl exec emptydir-demo -c reader -- tail -3 /data/log.txt
Wed Oct  7 15:34:37 UTC 2026
Wed Oct  7 15:34:39 UTC 2026
Wed Oct  7 15:34:41 UTC 2026
$ kubectl delete pod emptydir-demo --now
pod "emptydir-demo" deleted from default namespace
$ kubectl apply -f 01-emptydir.yaml && kubectl wait --for=condition=Ready pod/emptydir-demo --timeout=90s
pod/emptydir-demo created
pod/emptydir-demo condition met
$ kubectl exec emptydir-demo -c reader -- wc -l /data/log.txt
1 /data/log.txt
```

**Learned:** The `writer` container writes and the `reader` container sees the same file, so both containers **share** the volume. After the Pod was deleted and recreated, the log had only **1 line**: the old data was **gone** together with the Pod.

---

## 2. hostPath: [02-hostpath.yaml](02-hostpath.yaml)

Mounts a directory **from the node's filesystem** into the Pod.

```bash
$ kubectl apply -f 02-hostpath.yaml
pod/hostpath-demo created
$ kubectl wait --for=condition=Ready pod/hostpath-demo --timeout=90s
pod/hostpath-demo condition met
$ kubectl exec hostpath-demo -- cat /host-data/hostpath.txt
written by hostpath-demo at Wed Oct  7 15:34:48 UTC 2026
$ minikube ssh -- cat /tmp/hostpath-demo/hostpath.txt
written by hostpath-demo at Wed Oct  7 15:34:48 UTC 2026
$ kubectl delete pod hostpath-demo --now
pod "hostpath-demo" deleted from default namespace
$ kubectl apply -f 02-hostpath.yaml && kubectl wait --for=condition=Ready pod/hostpath-demo --timeout=90s
pod/hostpath-demo created
pod/hostpath-demo condition met
$ kubectl exec hostpath-demo -- cat /host-data/hostpath.txt
written by hostpath-demo at Wed Oct  7 15:34:48 UTC 2026
written by hostpath-demo at Wed Oct  7 15:34:54 UTC 2026
```

**Learned:** The file is visible **on the node itself** (`minikube ssh`). After the Pod was deleted and recreated, the old line was **still there** and a new line was added, so the data survived the Pod. **But:** it is tied to that single node. If the Pod moves to another node, the data is not there. It is also a security risk, because a Pod can read the host's files. Avoid it for application data.

---

## 3. PersistentVolume (PV) and PersistentVolumeClaim (PVC): [03-pv-pvc-static.yaml](03-pv-pvc-static.yaml)

- **PersistentVolume (PV):** A piece of storage in the cluster (an NFS share, an AWS EBS disk, a local path) **created by an admin** or by a provisioner. It is a cluster resource, not namespaced.
- **PersistentVolumeClaim (PVC):** A **request for storage** by a user ("I need 500Mi, ReadWriteOnce"). Kubernetes **binds** it to a matching PV, and the Pod mounts the PVC, never the PV directly.
- **Access modes:** `ReadWriteOnce` (one node), `ReadOnlyMany`, `ReadWriteMany` (many nodes, for example NFS), `ReadWriteOncePod`.
- **Reclaim policy** (what happens to the PV when the PVC is deleted): `Retain` keeps the data for manual cleanup, and `Delete` removes the storage.

```bash
$ kubectl apply -f 03-pv-pvc-static.yaml
persistentvolume/static-pv created
persistentvolumeclaim/static-pvc created
pod/static-pvc-pod created
$ kubectl wait --for=condition=Ready pod/static-pvc-pod --timeout=90s
pod/static-pvc-pod condition met
$ kubectl get pv static-pv
NAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
static-pv   1Gi        RWO            Retain           Bound    default/static-pvc   manual         <unset>                          1s
$ kubectl get pvc static-pvc
NAME         STATUS   VOLUME      CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
static-pvc   Bound    static-pv   1Gi        RWO            manual         <unset>                 2s
$ kubectl exec static-pvc-pod -- sh -c 'echo "important data" > /data/file.txt && cat /data/file.txt'
important data
$ kubectl delete pod static-pvc-pod --now
pod "static-pvc-pod" deleted from default namespace
$ kubectl delete pvc static-pvc
persistentvolumeclaim "static-pvc" deleted from default namespace
$ kubectl get pv static-pv
NAME        CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS     CLAIM                STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
static-pv   1Gi        RWO            Retain           Released   default/static-pvc   manual         <unset>                          6s
$ minikube ssh -- cat /tmp/static-pv/file.txt
important data
```

**Learned:** The PVC asked for 500Mi and was **Bound** to the 1Gi `static-pv` (a PVC binds to a PV that is **at least** as large, with a matching class and access mode). After the Pod **and** the PVC were deleted, the PV went to **`Released`** (not deleted) because of `Retain`, and the file is still on disk.

---

## 4. StorageClass: [04-storageclass.yaml](04-storageclass.yaml)

A **StorageClass** describes a **type** of storage (fast SSD, cheap HDD, NFS) and **which provisioner** creates it. Important fields:

| Field | Meaning |
| --- | --- |
| `provisioner` | Who creates the disk: `ebs.csi.aws.com`, `pd.csi.storage.gke.io`, `k8s.io/minikube-hostpath`, and so on |
| `parameters` | Provisioner options, for example `type: gp3` |
| `reclaimPolicy` | `Delete` (default) or `Retain` for the PVs it creates |
| `volumeBindingMode` | `Immediate`, or `WaitForFirstConsumer` (create the disk in the zone where the Pod lands) |
| `allowVolumeExpansion` | Whether PVCs can be resized later |

One StorageClass can be marked **`(default)`**. PVCs that don't name a class use it, which on Minikube is `standard`.

```bash
$ kubectl get storageclass
NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           false                  22d
$ kubectl apply -f 04-storageclass.yaml
storageclass.storage.k8s.io/fast-local created
$ kubectl get storageclass
NAME                 PROVISIONER                RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
fast-local           k8s.io/minikube-hostpath   Delete          Immediate           false                  0s
standard (default)   k8s.io/minikube-hostpath   Delete          Immediate           false                  22d
```

---

## 5. Dynamic provisioning: [05-pvc-dynamic.yaml](05-pvc-dynamic.yaml)

With **static** provisioning an admin has to create PVs in advance. With **dynamic** provisioning the user only writes a **PVC** that names a StorageClass, and the **provisioner creates a matching PV automatically**. This is how cloud clusters work: a PVC automatically creates an EBS or Persistent Disk volume.

```bash
$ kubectl apply -f 05-pvc-dynamic.yaml
persistentvolumeclaim/dynamic-pvc created
deployment.apps/dynamic-pvc-app created
$ kubectl rollout status deployment/dynamic-pvc-app --timeout=90s
Waiting for deployment "dynamic-pvc-app" rollout to finish: 0 of 1 updated replicas are available...
deployment "dynamic-pvc-app" successfully rolled out
$ kubectl get pvc dynamic-pvc
NAME          STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
dynamic-pvc   Bound    pvc-eaea3606-e8bd-4bb8-b9ac-9648638dbca1   200Mi      RWO            fast-local     <unset>                 2s
$ kubectl get pv | grep -E "NAME|dynamic-pvc"
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                 STORAGECLASS   VOLUMEATTRIBUTESCLASS   REASON   AGE
pvc-eaea3606-e8bd-4bb8-b9ac-9648638dbca1   200Mi      RWO            Delete           Bound       default/dynamic-pvc   fast-local     <unset>                          2s
$ kubectl describe pvc dynamic-pvc | sed -n '/^Events:/,$p'
Events:
  Type    Reason                 Age   From                                                                    Message
  ----    ------                 ----  ----                                                                    -------
  Normal  ExternalProvisioning   2s    persistentvolume-controller                                             Waiting for a volume to be created either by the external provisioner 'k8s.io/minikube-hostpath' or manually by the system administrator. If volume creation is delayed, please verify that the provisioner is running and correctly registered.
  Normal  Provisioning           2s    k8s.io/minikube-hostpath_minikube_e788901b-fc70-4879-b566-76b48d1bea44  External provisioner is provisioning volume for claim "default/dynamic-pvc"
  Normal  ProvisioningSucceeded  2s    k8s.io/minikube-hostpath_minikube_e788901b-fc70-4879-b566-76b48d1bea44  Successfully provisioned volume pvc-eaea3606-e8bd-4bb8-b9ac-9648638dbca1
$ POD=$(kubectl get pod -l app=dynamic-pvc-app -o name) && kubectl exec $POD -- sh -c 'echo "survives pod restarts" > /data/note.txt'
$ kubectl delete pod -l app=dynamic-pvc-app --now && kubectl rollout status deployment/dynamic-pvc-app --timeout=90s
pod "dynamic-pvc-app-7cc6cbb588-rwwc4" deleted from default namespace
deployment "dynamic-pvc-app" successfully rolled out
$ POD=$(kubectl get pod -l app=dynamic-pvc-app -o name) && echo "new pod: $POD" && kubectl exec $POD -- cat /data/note.txt
new pod: pod/dynamic-pvc-app-7cc6cbb588-hf8gc
survives pod restarts
$ kubectl delete -f 05-pvc-dynamic.yaml
persistentvolumeclaim "dynamic-pvc" deleted from default namespace
deployment.apps "dynamic-pvc-app" deleted from default namespace
$ kubectl get pv | grep dynamic-pvc || echo "PV was deleted automatically (reclaimPolicy: Delete)"
PV was deleted automatically (reclaimPolicy: Delete)
```

**Learned:**
- I never wrote a PV, yet one called `pvc-eaea3606-...` was **created automatically** and bound. The PVC events show `ExternalProvisioning → Provisioning → ProvisioningSucceeded`.
- Data written to the volume **survived the Pod being deleted**, and the new Pod (`...-hf8gc`) read the same file.
- Deleting the PVC also **deleted the PV automatically**, because the class's `reclaimPolicy` is `Delete`.

---

## Summary

```text
            (admin)                         (developer)
   StorageClass "fast-local"  ◄──────── PVC "dynamic-pvc" (200Mi, RWO)
            │ provisioner                    ▲       │ bound
            ▼ creates                        │       ▼
   PersistentVolume pvc-eaea...  ────────────┘     Pod mounts the PVC at /data
```
