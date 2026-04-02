# L8OpenSim Project Location

## Rule
The L8OpenSim project lives at `../l8opensim` relative to any Layer 8 project root. It serves as the canonical example for API simulation within the Layer 8 ecosystem.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
├── l8opensim/     # API simulator example
├── l8myfamily/    # Android app example using Layer 8 services
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

From any project root, `../l8opensim` resolves to the l8opensim project.

## What L8OpenSim Is Used For
- **API simulation patterns**: How to simulate external APIs for development and testing
- **Mock API endpoints**: How to define and serve simulated API responses
- **Testing and development**: Patterns for decoupling development from real external services by providing simulated API behavior

## Usage
When implementing API simulation or mock services in a new project, reference `../l8opensim/` for established patterns before designing your own.
