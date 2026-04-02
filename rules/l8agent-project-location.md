# L8Agent Project Location

## Rule
The L8Agent project lives at `../l8agent` relative to any Layer 8 project root. It serves as the canonical example for building an AI agent within the Layer 8 ecosystem.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
├── l8agent/       # AI agent example
├── l8notify/      # Notifications example
├── l8events/      # Events example
├── l8alarms/      # Alarms example
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

From any project root, `../l8agent` resolves to the l8agent project.

## What L8Agent Is Used For
- **AI agent patterns**: How to build an AI agent that operates within the Layer 8 framework
- **Agent integration**: How to connect an AI agent to Layer 8 services, data, and infrastructure
- **Agent lifecycle**: Patterns for agent initialization, task execution, and response handling

## Usage
When implementing an AI agent in a new Layer 8 project, reference `../l8agent/` for established patterns before designing your own.
