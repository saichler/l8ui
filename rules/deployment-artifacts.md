# Deployment Artifacts Must Be Included in PRDs

## Rule
Every PRD that introduces a new deployable service (a new `main` package with its own binary) MUST include a section specifying the deployment artifacts: `build.sh`, `Dockerfile`, K8s YAML, and updates to `build-all-images.sh` and `k8s/deploy.sh`/`k8s/undeploy.sh`.

## Why This Matters
The project deploys as Docker images to Kubernetes. If a new service is built but has no Dockerfile, build script, or K8s manifest, it cannot be deployed. These are not optional — they are required deliverables, same as the Go source code.

## Existing Deployment Architecture

### Docker Images (5 images)
Each main method has a `build.sh` + `Dockerfile` in its directory:

| Image | Directory | Base Image | K8s Kind | Notes |
|-------|-----------|------------|----------|-------|
| `saichler/erp` | `go/erp/main/` | `saichler/erp-postgres` | StatefulSet | Backend ERP service |
| `saichler/erp-web` | `go/erp/ui/` | `saichler/erp-security` | DaemonSet (hostNetwork) | Web UI — runs 2 binaries via entrypoint.sh |
| `saichler/erp-vnet` | `go/erp/vnet/` | `saichler/erp-security` | DaemonSet (hostNetwork) | Virtual network |
| `saichler/erp-logs-vnet` | `go/logs/vnet/` | `saichler/erp-security` | DaemonSet (hostNetwork) | Log aggregation vnet |
| `saichler/erp-log-agent` | `go/logs/agent/` | `saichler/erp-security` | DaemonSet | Log collection agent |

### Build Pipeline
- **Per-image**: `build.sh` runs `docker build --no-cache --platform=linux/amd64` and `docker push`
- **All images**: `go/build-all-images.sh` calls each `build.sh` in order
- **Dockerfile pattern**: Multi-stage build — `saichler/builder:latest` compiles Go, final stage copies binary to runtime image

### Kubernetes Manifests (`k8s/`)
- `deploy.sh` — applies all YAMLs in dependency order (vnet first, then logs, erp, web, log-agent)
- `undeploy.sh` — deletes all resources
- `clean.sh` — undeploys, wipes data dirs, redeploys
- Each service gets its own namespace (e.g., `erp`, `erp-web`, `erp-vnet`)
- All containers mount `/data` from host via `hostPath`

## PRD Section Template

When a PRD introduces a new deployable service, include this section:

```markdown
## Deployment

### Docker Image
- **Image name**: `saichler/<image-name>:latest`
- **Directory**: `go/<path-to-main>/`
- **Base image (build)**: `saichler/builder:latest`
- **Base image (runtime)**: `saichler/erp-security:latest` (or `erp-postgres` if needs DB)
- **Binary name**: `<binary>`
- **Source files to COPY**: `main.go` (and any shared*.go files)

### build.sh
Standard pattern:
```bash
#!/usr/bin/env bash
set -e
docker build --no-cache --platform=linux/amd64 -t saichler/<image-name>:latest .
docker push saichler/<image-name>:latest
```

### Dockerfile
Standard multi-stage pattern:
```dockerfile
FROM saichler/builder:latest AS build
COPY main.go /home/src/github.com/saichler/build/
RUN go mod init
RUN GOPROXY=direct GOPRIVATE=github.com go mod tidy
RUN go build -o <binary>

FROM saichler/erp-security:latest AS final
COPY --from=build /home/src/github.com/saichler/build/<binary> /home/run/<binary>
ENTRYPOINT ["/home/run/<binary>"]
```

### K8s Manifest (`k8s/<name>.yaml`)
- Namespace: `<namespace>`
- Kind: StatefulSet (if needs stable identity/storage) or DaemonSet (if runs on every node)
- hostNetwork: true/false
- Volume mount: `/data` from hostPath

### Updates to Existing Files
- `go/build-all-images.sh` — add `cd ../<path> && ./build.sh`
- `k8s/deploy.sh` — add `kubectl apply -f ./<name>.yaml` in correct order
- `k8s/undeploy.sh` — add `kubectl delete -f ./<name>.yaml`
```

## When This Does NOT Apply
- New services added to an EXISTING image (e.g., adding a new ERP service to `go/erp/main/`) — no new deployment artifacts needed
- Pure UI changes — served by the existing `erp-web` image
- Library/shared code changes — compiled into existing images
