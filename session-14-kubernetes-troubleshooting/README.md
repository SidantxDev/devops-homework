# Session 14: Kubernetes Troubleshooting

**Name:** Siddhant Singh
**Roll number:** 24BCS10153

| Task | Where | Content |
| --- | --- | --- |
| **Task 1:** Kubernetes commands | [01-commands/README.md](01-commands/README.md) | Hands-on with `get`, `describe`, `logs`, `exec`, `events`, `explain`, `top` and `get -o wide`, with real output |
| **Task 2:** Troubleshoot common issues | [02-common-issues/README.md](02-common-issues/README.md) | 9 broken → fixed scenarios: CrashLoopBackOff, ImagePullBackOff, ErrImagePull, Pending, ContainerCreating, Service connectivity, DNS, Pod networking, Configuration |
| **Task 3:** Mini project | [03-mini-project/README.md](03-mini-project/README.md) | The Kubernetes Troubleshooting Challenge, from deploy through to verify |

## My troubleshooting method

```text
1. Identify      kubectl get pods / svc / events          → what is wrong? (STATUS, READY, RESTARTS)
2. Investigate   kubectl describe … (Events!)              → why?
                 kubectl logs [--previous]                → what did the app say?
                 kubectl exec / kubectl debug             → what does it look like inside?
                 kubectl get endpointslices               → is traffic wired up?
3. Root cause    one precise sentence
4. Fix           change the YAML (not just the live object) and re-apply
5. Verify        same commands as step 1 → healthy + working request
6. Document      problem → investigation → cause → fix → before/after
```

## Quick reference: STATUS → where to look

| STATUS / symptom | Phase of the problem | First command | Usual causes |
| --- | --- | --- | --- |
| `Pending` (no node) | Scheduling | `describe` → `FailedScheduling` | Not enough CPU or memory, nodeSelector or affinity, taints, unbound PVC |
| `ContainerCreating` (stuck) | Volume and network setup | `describe` → `FailedMount` | Missing ConfigMap, Secret or PVC, CNI problems |
| `ErrImagePull` / `ImagePullBackOff` | Pulling the image | `describe` → `Failed to pull image` | Wrong tag or repository, private registry without credentials, rate limits |
| `CreateContainerConfigError` | Building the container config | `describe` | A referenced ConfigMap, Secret or key is missing |
| `CrashLoopBackOff` / `Error` | App start-up | `logs --previous` | App error, missing config, wrong command |
| `Running` but `0/1` | Readiness | `describe` → `Unhealthy` | Probe on the wrong port or path, app not ready |
| `Running`, Service fails | Networking | `get endpointslices`, curl Pod IP | Selector or label mismatch, wrong targetPort, app bound to 127.0.0.1, DNS name |
| `OOMKilled` | Runtime | `describe` → Last State | Memory limit too low |
