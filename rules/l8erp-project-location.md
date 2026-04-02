# L8ERP Project Location

## Rule
The Layer 8 ecosystem's reference/example project lives at `../l8erp` relative to any Layer 8 project root. L8ERP is the canonical implementation that all other Layer 8 projects must follow for project structure, architecture patterns, deployment artifacts, and UI conventions.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
├── l8erp/         # Reference ERP project (canonical example)
├── l8ui/          # Shared UI component library
├── l8bugs/        # Bugs project
├── l8book/        # Book project
├── l8id/          # Identity project
└── ...
```

From any project root, `../l8erp` resolves to the l8erp project.

## What l8erp Is Used For
- **Project structure reference**: Directory layout, file naming, organization (see `prd-compliance.md`)
- **run-local.sh template**: Copy and adapt from `../l8erp/go/run-local.sh` (see `run-local-script.md`)
- **Deployment artifact patterns**: build.sh, Dockerfile, K8s YAMLs (see `deployment-artifacts.md`)
- **UI patterns**: app.html, app.js, section HTML, module init files (see `mobile-rules.md`)
- **login.json source**: Copy and adapt (see `login-json-adaptation.md`)
- **K8s YAML reference**: Canonical manifests in `../l8erp/k8s/` (see `k8s-yaml-required-entries.md`)
- **Mock data patterns**: Generator structure, phase ordering (see `mock-data-generation.md`)

## Usage
- When creating a new Layer 8 project, read `../l8erp/` structure first and follow its patterns
- When copying files (run-local.sh, login.json, app.js), always copy from `../l8erp/` and adapt
- When unsure about a convention, check how l8erp does it
