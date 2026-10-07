# Session 17: Complete CI/CD & DevSecOps

**Name:** Siddhant Singh · **Roll number:** 24BCS10153

```text
Code → Build → Unit Test → SAST → SCA → Secret Scan → Docker Build → Container Image Scan → Security Gate → Push Image → Deploy to Kubernetes
```

| Deliverable | File |
| --- | --- |
| Application | [app/](app/): Express 5 notes API with `helmet` security headers, input validation and a body-size limit. 7 unit tests |
| Dockerfile | [Dockerfile](Dockerfile): multi-stage. Tests gate the build, and the runtime is **distroless** (no shell, no package manager) running as **non-root** |
| GitHub Actions workflow | [.github/workflows/s17-devsecops.yml](../.github/workflows/s17-devsecops.yml) |
| Security tools configuration | [security/semgrep-rules.yml](security/semgrep-rules.yml) (custom SAST rules), [security/.gitleaks.toml](security/.gitleaks.toml), [security/trivy.yaml](security/trivy.yaml) |
| Kubernetes manifests | [k8s/deployment.yaml](k8s/deployment.yaml): non-root, read-only root FS, all capabilities dropped, seccomp, probes, resources |

## Pipeline stages

| Stage | Job | Tool | Fails the pipeline when |
| --- | --- | --- | --- |
| Build + Unit Test | `build-test` | `npm ci`, `node --test` | Any test fails |
| **SAST** | `sast` | **Semgrep** (`p/javascript`, `p/nodejs` + 4 custom rules: eval, `child_process.exec`, hard-coded credentials, Express without helmet) | Any finding (`--error`) |
| **SCA** | `sca` | **npm audit** `--audit-level=high` + **Trivy fs** | A HIGH/CRITICAL vulnerable dependency |
| **Secret scan** | `secret-scan` | **gitleaks** (all built-in rules) | Any leaked key or token |
| Docker build + **image scan** | `docker-build-scan` | `docker build` + **Trivy image** | A fixable HIGH/CRITICAL CVE in the OS or packages |
| **Security gate** | `security-gate` | Checks every previous result (`if: always()`) | Any check is not `success` |
| Push image | `push-image` | GHCR via `GITHUB_TOKEN` | Runs **only** after the gate passes |
| Deploy | `deploy` | kind cluster + `kubectl apply` + smoke test | Rollout or smoke test fails |

## Security results (real output, run locally with the same tools and configs)

**Unit tests:** 7/7 passed. **npm audit:** `found 0 vulnerabilities`.

**SAST (Semgrep):**
```text
✅ Scan completed successfully.
 • Findings: 0 (0 blocking)
 • Rules run: 72
 • Targets scanned: 2
Ran 72 rules on 2 files: 0 findings.
```

**Secret scan (gitleaks):**
```text
INF scanned ~6126 bytes (6.13 KB) in 213ms
INF no leaks found
```

**Container image scan (Trivy): the security gate in action.** My first runtime base, `distroless/nodejs22-debian12`, was **blocked**:

```text
│ libssl3 │ CVE-2026-31789 │ CRITICAL │ fixed  │ 3.0.18-1~deb12u2  │ 3.0.19-1~deb12u2 │ openssl: Heap buffer overflow ...
│         │ CVE-2026-28387 │ HIGH     │        │                   │                  │ openssl: Arbitrary code execution ...
│         │ CVE-2026-28388 │ HIGH     │ ...  (6 fixable HIGH/CRITICAL in total)
```

Comparing base images with Trivy (HIGH/CRITICAL, fixable only):

```text
node:22-alpine                                 {'HIGH': 10}
gcr.io/distroless/nodejs22-debian13:nonroot    no HIGH/CRITICAL (fixable)
gcr.io/distroless/nodejs24-debian13:nonroot    no HIGH/CRITICAL (fixable)
```

**Fix:** switch the runtime to `distroless/nodejs22-debian13:nonroot`. The rebuilt image scan is **clean**: OS packages and all `node_modules` show `0`.

**Second finding (Kubernetes):** with `runAsNonRoot: true`, the Pods failed with `CreateContainerConfigError`, because the distroless user is the **name** `nonroot` and Kubernetes can't verify a non-numeric user. **Fix:** `runAsUser: 65532`.

> **Pipeline run:** the full DevSecOps workflow passed on GitHub Actions in [run #37660541259](https://github.com/SidantxDev/devops-homework/actions/runs/37660541259) (3m5s): build/test → SAST → SCA → secret scan → image scan → security gate → push to GHCR → deploy to Kubernetes.
