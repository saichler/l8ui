# L8Topology Project Location

## Rule
The L8Topology project lives at `../l8topology` relative to any Layer 8 project root. It serves as the canonical example for topology visualization within the Layer 8 ecosystem.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
├── l8topology/    # Topology visualization example
├── probler/       # Data collection, parsing, and modeling example
├── l8erp/         # Reference ERP project
├── l8ui/          # Shared UI component library
├── l8bugs/        # Bugs project
├── l8book/        # Book project
├── l8id/          # Identity project
└── ...
```

From any project root, `../l8topology` resolves to the l8topology project.

## What L8Topology Is Used For
- **Topology visualization patterns**: How to render and interact with network/system topology graphs
- **Node and edge modeling**: How to represent interconnected entities visually
- **Graph layout and interaction**: Patterns for pan, zoom, click, and drill-down on topology views

## Usage
When implementing topology or graph visualization in a new project, reference `../l8topology/` for established patterns before designing your own.
