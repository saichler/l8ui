# Run-Local Script Requirement

## Rule
Every Layer 8 project that has a fully implemented PRD (backend services, UI, mock data) MUST include a `run-local.sh` script at the Go module root (e.g., `go/run-local.sh`) that starts the entire system locally for testing and development.

## How to Create
**Always start by copying `l8erp/go/run-local.sh` and adapting it** to the new project. Do NOT write from scratch. The l8erp script is the canonical reference and contains battle-tested patterns for dependency management, service startup ordering, and cleanup.

### Adaptation steps:
1. **Copy**: `cp <path-to-l8erp>/go/run-local.sh <new-project>/go/run-local.sh`
2. **Read the entire script** to understand what it does
3. **Adjust** the following project-specific values:
   - Binary names (e.g., `erp_demo` → `l8id_demo`)
   - Service main package paths (e.g., `erp/main/` → `l8id/main/`)
   - UI web asset source paths (e.g., `erp/ui/web` → `l8id/ui/web`)
   - Mock data generator path (`tests/mocks/cmd/`)
   - Port numbers and vnet IDs
   - Service endpoint URLs and credentials
   - Database name if different
4. **Remove** components that don't apply (e.g., log agent/vnet if not needed)
5. **Add** any project-specific components
6. **Test** the script end-to-end

## When to Create
- After all PRD phases are implemented and the system is functional end-to-end
- When a new project reaches the point where it can be started, populated with mock data, and tested in a browser

## What the Script Must Do
1. **Clean and fetch dependencies**: `rm -rf go.sum go.mod vendor && go mod init && GOPROXY=direct GOPRIVATE=github.com go mod tidy && go mod vendor`
2. **Start infrastructure** (e.g., database container): `docker run -d ...`
3. **Build all binaries** into a `demo/` directory:
   - Mock data generator (`tests/mocks/cmd/`)
   - Log agent and log vnet (if applicable)
   - Backend vnet
   - Main ERP/application server
   - UI web server
4. **Copy web assets** to `demo/`
5. **Generate a `kill_demo.sh`** cleanup script that kills all demo processes and removes temp data
6. **Start all services** in correct order (vnet first, then services, then UI)
7. **Wait for services to be ready**, then prompt user to upload mock data
8. **Upload mock data** via the mock data generator
9. **Wait for user**, then clean up

## Canonical Source
The authoritative implementation is `l8erp/go/run-local.sh`:
```bash
set -e
# clean up
rm -rf go.sum go.mod vendor
# fetch dependencies
go mod init
GOPROXY=direct GOPRIVATE=github.com go mod tidy
go mod vendor
# start database
docker rm -f unsecure-postgres 2>/dev/null || true
docker run -d --name unsecure-postgres -p 5432:5432 -v /data/:/data/ saichler/unsecure-postgres:latest admin admin admin 5432
# build binaries
rm -rf demo && mkdir -p demo
cd tests/mocks/cmd && go build -o ../../../demo/mocks_demo
# ... build other binaries ...
# copy web assets
cp -r ./web ../../demo/.
# generate cleanup script
echo "pkill -9 demo" >> ./kill_demo.sh
# start services
./vnet_demo &
./erp_demo local &
./ui_demo &
# upload mocks
./mocks_demo --address https://${EXTERNAL_IP}:2773 --user admin --password admin --insecure
# cleanup
./kill_demo.sh
```

## PRD Requirement
Every PRD document MUST include a section titled **"Local Development Setup"** that describes the `run-local.sh` script and how to start the system locally. This ensures the script is planned from the start, not added as an afterthought.
