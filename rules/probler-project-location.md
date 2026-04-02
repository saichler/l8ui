# Probler Project Location

## Rule
The Probler project lives at `../probler` relative to any Layer 8 project root. It serves as the canonical example for collecting, parsing, and modeling data within the Layer 8 ecosystem.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
├── probler/       # Data collection, parsing, and modeling example
├── l8erp/         # Reference ERP project
├── l8ui/          # Shared UI component library
├── l8bugs/        # Bugs project
├── l8book/        # Book project
├── l8id/          # Identity project
└── ...
```

From any project root, `../probler` resolves to the probler project.

## What Probler Is Used For
- **Data collection patterns**: How to collect raw data from external sources
- **Data parsing patterns**: How to parse and transform collected data into structured formats
- **Data modeling patterns**: How to model parsed data using protobuf types and the Layer 8 framework

## Usage
When implementing data collection, parsing, or modeling in a new project, reference `../probler/` for established patterns before designing your own.
