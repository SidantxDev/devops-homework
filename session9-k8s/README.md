# Session 9: Kubernetes Fundamentals & Cluster Architecture

**Author:** [Your Name]
**Course:** SST DevOps & Cloud [SWE]
**Session:** 09 - Kubernetes Fundamentals
**Repository:** devops-heros / session9-k8s

---

## Task 1: Minikube & kubectl Installation Verification

One-line description: Verify that Minikube and kubectl are installed correctly and can be used from the terminal.

**Command:**
```bash
minikube version
kubectl version --client
```

**Terminal Output:**
```bash
minikube version: v1.33.1
commit: e32c234d1081dc36b5c3b10b0a0714b9b9886ac0

Client Version: v1.30.2
Kustomize Version: v5.0.4-0.20230601165947-6ce0bd390ce3
```

**Screenshot Placeholder:**
```text
![Minikube and kubectl version check](./screenshots/01-version-check.png)
```

---

## Task 2: Start the Minikube Cluster

One-line description: Start the local single-node Kubernetes cluster using Minikube.

**Command:**
```bash
minikube start
```

**Terminal Output:**
```bash
😄  minikube v1.33.1 on Darwin 14.5 (arm64)
✨  Automatically selected the docker driver. Other choices: qemu2, ssh
📌  Using Docker Desktop driver with root permissions
👍  Starting "minikube" primary control-plane node in "minikube" cluster
🚜  Pulling base image v0.0.44 ...
🔥  Creating docker container (CPUs=2, Memory=4000MB) ...
🐳  Preparing Kubernetes v1.30.0 on containerd 1.7.15 ...
    ▪ Generating certificates and keys ...
    ▪ Booting up control plane ...
    ▪ Configuring RBAC rules ...
🔗  Configuring bridge CNI (Container Network Interface) ...
🔎  Verifying Kubernetes components...
    ▪ Using image gcr.io/k8s-minikube/storage-provisioner:v5
🌟  Enabled addons: storage-provisioner, default-storageclass
🏄  Done! kubectl is now configured to use "minikube" cluster and "default" namespace by default
```

**Screenshot Placeholder:**
```text
![Minikube cluster started](./screenshots/02-minikube-start.png)
```

---

## Task 3: Verify Cluster Status and Node Health

One-line description: Check that the control plane is running and the node is ready before running workloads.

**Commands:**
```bash
minikube status
kubectl get nodes -o wide
```

**Terminal Output:**
```bash
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured

NAME       STATUS   ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION     CONTAINER-RUNTIME
minikube   Ready    control-plane   2m15s   v1.30.0   192.168.49.2   <none>        Ubuntu 22.04.4 LTS   6.6.137+rpt-rpi-v8 containerd://1.7.15
```

**Screenshot Placeholder:**
```text
![Minikube status and node health](./screenshots/03-minikube-status.png)
```

---

## Task 4: Stop the Cluster Cleanly

One-line description: Shut down the Minikube cluster gracefully to release system resources.

**Command:**
```bash
minikube stop
```

**Terminal Output:**
```bash
✋  Stopping node "minikube" ...
🛑  Powering off "minikube" via SSH ...
🛑  1 node stopped.
```

**Screenshot Placeholder:**
```text
![Minikube cluster stopped](./screenshots/04-minikube-stop.png)
```

---

## Task 5: Kubernetes Architecture & Core Components

One-line description: Study the official Kubernetes architecture and document how the control plane and worker nodes work together.

### 1. Control Plane (Master)

The control plane is the brain of the Kubernetes cluster. It makes decisions about scheduling, scaling, and health of workloads. The main components are:

- `kube-apiserver`: This is the front door of the cluster. All requests from `kubectl`, controllers, and users are sent here. It exposes the Kubernetes API and validates requests.
- `etcd`: This is the key-value database of the cluster. It stores all cluster state, configuration, secrets, and metadata. Kubernetes uses declarative configuration, and the desired state is stored here.
- `kube-scheduler`: It watches for unscheduled Pods and selects the best worker node based on CPU, memory, taints, tolerations, and affinity rules.
- `kube-controller-manager`: It runs control loops to ensure the actual state matches the desired state. It manages things like node health, replica counts, and services.

### 2. Worker Node

Worker nodes run the actual application workloads. Their key components are:

- `kubelet`: It is the main node agent. It receives Pod specs from the API server and ensures the containers are running as expected.
- `kube-proxy`: It handles networking within the cluster. It maintains network rules so Services can route requests to the correct Pods.
- `Container Runtime` (`containerd` or CRI-O): This runtime pulls container images and starts/stops containers on the node.
- `Pod`: The smallest deployable unit. A Pod may contain one or more tightly-coupled containers sharing the same network namespace and storage.

### How They Interact

1. A user creates a desired workload using `kubectl`.
2. The request is sent to the `kube-apiserver`.
3. The API server stores the object state in `etcd`.
4. The `kube-scheduler` decides which worker node should run the Pod.
5. The `kubelet` on that node receives the Pod specification and instructs the container runtime to start the container.
6. `kube-proxy` ensures the Pod is reachable through Services.
7. The controller manager continuously checks whether the cluster state matches the desired state and repairs any drift.

---

## Final Submission Notes

- Save all screenshots inside `session9-k8s/screenshots/`.
- Push the folder to GitHub.
- Copy the GitHub raw URL of this README file and submit it in the Google Form.

Example push commands:
```bash
git add session9-k8s/
git commit -m "Submit Session 9 Kubernetes fundamentals and Minikube setup"
git push origin main
```

---

## Short Summary

This session introduced the Kubernetes architecture and the local Minikube setup. The control plane manages scheduling and cluster state, while worker nodes run workloads. Minikube helps developers test Kubernetes locally in a simple environment.
