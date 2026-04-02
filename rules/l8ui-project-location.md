# L8UI Project Location

## Rule
The Layer 8 ecosystem's shared UI component library lives at `../l8ui` relative to any Layer 8 project root. This is the canonical source for all shared UI components, rules, and the submodule setup script.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
├── l8ui/          # Shared UI component library
├── l8erp/         # ERP project
├── l8bugs/        # Bugs project
├── l8book/        # Book project
├── l8id/          # Identity project
└── ...
```

From any project root, `../l8ui` resolves to the l8ui project.

## What Lives in l8ui
- Shared UI components (tables, forms, popups, navigation, charts, etc.)
- `setup-l8ui-submodule.sh` — adds l8ui as a git submodule to a project's `web/` directory
- `rules/` — l8ui-specific rules for component usage, module setup, and factory APIs

## Usage
- When referencing l8ui source, scripts, or rules: use `../l8ui/`
- When adding l8ui to a new project: copy `../l8ui/setup-l8ui-submodule.sh` into the project's `web/` directory and run it (see `l8ui-copy-to-new-project.md`)
- When reading l8ui rules for PRD compliance: read from `../l8ui/rules/` (see `prd-compliance.md`)
