# L8LogFusion Project Location

## Rule
The L8LogFusion project lives at `../l8logfusion` relative to any Layer 8 project root. It serves as the canonical example for logging and distributed log collection within the Layer 8 ecosystem.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
├── l8logfusion/   # Logging and distributed log collection example
├── l8topology/    # Topology visualization example
├── probler/       # Data collection, parsing, and modeling example
├── l8erp/         # Reference ERP project
├── l8ui/          # Shared UI component library
├── l8bugs/        # Bugs project
├── l8book/        # Book project
├── l8id/          # Identity project
└── ...
```

From any project root, `../l8logfusion` resolves to the l8logfusion project.

## What L8LogFusion Is Used For
- **Logging patterns**: How to instrument applications with structured logging
- **Distributed log collection**: How to aggregate logs from multiple services/nodes
- **Log transport and storage**: Patterns for collecting, forwarding, and persisting logs across a distributed system

## Usage
When implementing logging or distributed log collection in a new project, reference `../l8logfusion/` for established patterns before designing your own.
