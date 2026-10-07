# Session 21: Final DevOps Project & Troubleshooting

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

## Project overview

A secure **notes API** taken through the whole DevOps lifecycle, built from everything in Sessions 1–20. Everything is in [final-devops-project/](final-devops-project/).

```text
Application → Git → GitHub → CI pipeline → Build & Test → Security scanning → Docker image
   → Container registry (GHCR) → Kubernetes → Helm → Monitoring → GitOps (Argo CD)
                                     ▲
                    Terraform provisions the AWS infrastructure (VPC, subnet, SG, EC2, S3)
```

## Structure

```text
final-devops-project/
├── application/          Node.js/Express API + 7 unit tests
├── docker/Dockerfile     multi-stage, tests gate the build, distroless non-root runtime
├── kubernetes/app.yaml   Namespace, Deployment, Service, ConfigMap, Secret, Ingress, HPA, PVC, probes
├── helm/                 webapp chart + dev/prod values (from Session 15)
├── terraform/            VPC, subnet, IGW, route table, SG, EC2, S3 (from Session 19)
├── .github/workflows/    pipeline.yml: build, test, SAST, SCA, secret scan, image scan, gate, push, deploy
├── security/             Semgrep rules, gitleaks and Trivy configs
├── monitoring/           see Session 20 (metrics-server, kubectl top, probes, alerting design)
└── gitops/               Argo CD Application (auto-sync, prune, self-heal)
```

## Technologies used
Git/GitHub · GitHub Actions · Node.js · Docker (multi-stage, distroless) · GHCR · Kubernetes (Minikube/kind) · Helm · Terraform (AWS provider, run against LocalStack) · Semgrep · npm audit · Trivy · gitleaks · metrics-server · Argo CD (manifest).

## Where each part is proven

| Part | Evidence |
| --- | --- |
| Application setup + tests | [Session 17](../session-17-devsecops/README.md): 7/7 tests |
| Docker setup | This session: image built from `docker/Dockerfile` |
| Kubernetes deployment | **This session, real output below** |
| Helm deployment | [Session 15](../session-15-helm/03-mini-project/README.md): dev and prod from one chart |
| Terraform infrastructure | [Session 19](../session-19-cloud-terraform/README.md): 8 resources applied and destroyed |
| CI/CD pipeline | [Session 16](../session-16-cicd-github-actions/README.md): green GitHub Actions runs, GHCR push, kind deploy |
| DevSecOps | [Session 17](../session-17-devsecops/README.md): SAST, SCA, secrets, image scan, gate |
| Monitoring | [Session 20](../session-20-monitoring-observability-gitops/README.md) |
| GitOps | [gitops/argocd-application.yaml](final-devops-project/gitops/argocd-application.yaml) |

## Kubernetes deployment (real output)

```bash
$ docker build -q -f docker/Dockerfile -t final-devops-app:1.0.0 .
$ minikube image load final-devops-app:1.0.0
$ kubectl apply -f kubernetes/app.yaml
$ kubectl rollout status deployment/final-app -n final
deployment "final-app" successfully rolled out
$ kubectl get pods,ingress,hpa,pvc -n final
pod/final-app-84dfdcc67-g4xjh   1/1     Running   0          6s
pod/final-app-84dfdcc67-kwtzn   1/1     Running   0          6s
ingress.networking.k8s.io/final-app   nginx   final.devops.local   192.168.49.2   80
horizontalpodautoscaler.autoscaling/final-app   Deployment/final-app   cpu: <unknown>/60%   2   6   2
persistentvolumeclaim/app-data   Bound    pvc-5b147275-...   100Mi      RWO            standard
$ curl -H "Host: final.devops.local" http://127.0.0.1/
{"service":"s17-devsecops-demo","version":"1.0.0"}
$ curl -H "Host: final.devops.local" http://127.0.0.1/health
{"status":"ok"}
```

## Final troubleshooting challenge (real issues hit while building this project)

| # | Problem (symptom) | Investigation | Root cause | Fix | Verified |
| --- | --- | --- | --- | --- | --- |
| 1 | `docker build` failed: `"/application/src": not found` | Read the failing `COPY --from=test` line | My path rewrite also changed the in-container `/app` paths | Change only the build-context paths (`COPY application/...`) | Image builds |
| 2 | Pods `ErrImagePull`: `pull access denied, repository does not exist` | `kubectl describe pod` → Events | Image was only local, and Minikube tried Docker Hub | `minikube image load final-devops-app:1.0.0` (+ `IfNotPresent`) | Image found |
| 3 | Pods `CreateContainerConfigError`, Ingress **503** | `describe pod`: runAsNonRoot can't verify a non-numeric user. Service had no ready endpoints → 503 | Distroless user is the name `nonroot`, and `runAsNonRoot` needs a numeric UID | `runAsUser: 65532` | 2/2 Running, `/health` → `{"status":"ok"}` |
| 4 | Bad release `1.0.1` → `ImagePullBackOff` | `describe pod` → `Failed to pull image "final-devops-app:1.0.1"` | Tag never built | `kubectl rollout undo` | Back on 1.0.0 |
| 5 | Image scan blocked the build: CRITICAL OpenSSL CVE | Trivy table | Outdated Debian 12 distroless base | Debian 13 distroless base | Trivy clean |

## Lessons learned
- Automate the gates (tests, scans), because they caught real problems I would have shipped.
- `kubectl describe` → **Events** answered almost every Kubernetes failure.
- Pin images, run as a numeric non-root UID, and use minimal base images.
- Keep the desired state in Git (Helm values, manifests) so rollback is easy.
