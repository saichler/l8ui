# L8Notify, L8Events, and L8Alarms Project Locations

## Rule
The following three projects serve as the canonical examples for notifications, events, and alarms handling within the Layer 8 ecosystem:

| Project | Location | Purpose |
|---------|----------|---------|
| L8Notify | `../l8notify` | Notification handling and delivery |
| L8Events | `../l8events` | Event processing and management |
| L8Alarms | `../l8alarms` | Alarm detection, raising, and resolution |

## Path Resolution
All Layer 8 projects are checked out as siblings under the same parent directory:
```
<parent>/
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

## What Each Project Is Used For
- **L8Notify**: How to send, route, and manage user-facing notifications (e.g., email, in-app, push)
- **L8Events**: How to define, emit, and process system events across services
- **L8Alarms**: How to detect alarm conditions, raise alarms, track severity, and handle alarm lifecycle (acknowledge, clear, resolve)

## Usage
When implementing notifications, events, or alarms in a new project, reference the corresponding project for established patterns before designing your own.
