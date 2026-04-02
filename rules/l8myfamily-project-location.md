# L8MyFamily Project Location

## Rule
The L8MyFamily project lives at `../l8myfamily` relative to any Layer 8 project root. It serves as the canonical example for building an Android application backed by Layer 8 server-side services.

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
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

From any project root, `../l8myfamily` resolves to the l8myfamily project.

## What L8MyFamily Is Used For
- **Android app patterns**: How to build an Android application that consumes Layer 8 services
- **Client-server integration**: How to connect an Android client to Layer 8 backend services
- **Mobile native development**: Patterns for authentication, data fetching, and UI rendering in an Android app backed by Layer 8

## Usage
When building an Android application that integrates with Layer 8 server-side services, reference `../l8myfamily/` for established patterns before designing your own.
