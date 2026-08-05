# l8events UI — Event/Alarm/Maintenance Components

Reusable UI components for the `l8events` shared library's domain model (alarms, events, archived
records, maintenance windows). Provides enums, table/card column definitions, form definitions,
and detail-view rendering for any project that activates the `l8events` events service
(`events-service-required.md`).

Files: `l8ui/events/*.js`, `l8ui/events/l8events.css`.

**Used unforked on both desktop and mobile.** There is no `Layer8M*`-suffixed or `m/`-subdirectory
variant of any file here — all 9 files serve both `app.html` and `m/app.html` directly, same
script tags, same global names. This is deliberate, not an oversight: none of these files call a
genuinely desktop-only widget (`Layer8DTable`, `Layer8DPopup`); they produce platform-agnostic
`Layer8ColumnFactory`/`Layer8FormFactory` output or plain HTML-string DOM injection, and their one
real dependency — `Layer8DRenderers` — is loaded on mobile pages too (see
`mobile-script-loading-order.md`; `l8security-enums.js` follows the identical pattern already).
**Do not "fix" this by splitting the files per platform** — that reintroduces duplicate enum/column
logic that was deliberately avoided when this component was added.

## Prerequisites

Load after these shared components (available on both desktop and mobile pages):
- `Layer8DRenderers` — `createStatusRenderer`, `renderEnum`
- `Layer8EnumFactory` — `create()`
- `Layer8ColumnFactory` — `col`, `status`, `enum`, `date`, `number`
- `Layer8FormFactory` — `form`, `section`, `text`, `textarea`, `select`, `date`, `number`

## Script Loading Order

Identical include list for `app.html` and `m/app.html` — after the shared l8ui scripts above,
before project-specific module init files:

```html
<link rel="stylesheet" href="l8ui/events/l8events.css">
<script src="l8ui/events/l8events-enums.js"></script>              <!-- Must be first (others depend on it) -->
<script src="l8ui/events/l8events-category-enums.js"></script>     <!-- Sub-category enums (depends on enums) -->
<script src="l8ui/events/l8events-state-actions.js"></script>      <!-- Before alarm-detail (detail uses it) -->
<script src="l8ui/events/l8events-alarm-table.js"></script>
<script src="l8ui/events/l8events-alarm-detail.js"></script>
<script src="l8ui/events/l8events-event-viewer.js"></script>
<script src="l8ui/events/l8events-archive-viewer.js"></script>
<script src="l8ui/events/l8events-maintenance.js"></script>
```

## `window.L8EventsEnums`

Base enum maps and renderers: `SEVERITY`, `ALARM_STATE`, `EVENT_STATE`, `EVENT_CATEGORY`,
`MAINTENANCE_STATUS`, `RECURRENCE_TYPE`, plus a `render` map (`severity`, `alarmState`,
`eventState`, `eventCategory`, `maintenanceStatus`, `recurrenceType`) built with
`Layer8DRenderers.createStatusRenderer`/`renderEnum`. Every other file in this component depends
on it — must load first.

## `window.L8EventsCategoryEnums`

Sub-category enums for `EVENT_CATEGORY` values 1–17 (Audit, System, Monitoring, Security,
Integration, Network, Kubernetes, Performance, Compute, Storage, Power, GPU, Topology, Automation),
each with its own enum map and a matching `render.*EventType` function.

## `window.L8EventsAlarmTable`

```js
L8EventsAlarmTable.getColumns()          // Column defs for a table/card list of Alarm records
L8EventsAlarmTable.getFormDefinition()   // Read/edit form definition for a single Alarm
```
`getColumns()` marks `name` as the mobile card `primary` field and `severity` as `secondary` —
desktop ignores both properties.

## `window.L8EventsAlarmDetail`

```js
L8EventsAlarmDetail.render(container, alarm, options)
// options: { showStateHistory: true, showNotes: true, onStateChange: (alarmId, newState, reason) => {} }
```
Pure HTML-string generation + `container.innerHTML` — works inside a `Layer8DPopup` or
`Layer8MPopup` body identically. Renders alarm fields, state-change history timeline, and notes.
When `onStateChange` is provided, mounts `L8EventsStateActions` for the transition buttons.

## `window.L8EventsEventViewer`

```js
L8EventsEventViewer.getColumns()          // Column defs for a table/card list of Event records
L8EventsEventViewer.getFormDefinition()   // Read/edit form definition for a single Event
```
`getColumns()` marks `eventType` as `primary`, `severity` as `secondary`.

## `window.L8EventsArchiveViewer`

```js
L8EventsArchiveViewer.getArchivedAlarmColumns()   // name primary, severity secondary
L8EventsArchiveViewer.getArchivedEventColumns()   // eventType primary, severity secondary
```
Read-only column sets for archived alarm/event records (includes `archivedAt`, `archivedBy`,
`archiveReason` where applicable).

## `window.L8EventsMaintenance`

```js
L8EventsMaintenance.getColumns()          // name primary, status secondary
L8EventsMaintenance.getFormDefinition()   // Create/edit form for a Maintenance Window
```

## `window.L8EventsStateActions`

```js
L8EventsStateActions.render(container, alarm, onAction)   // onAction(alarmId, newState, reason)
L8EventsStateActions.getAvailableActions(currentState)     // -> [{ state, label, className }]
```
Renders the valid next-state transition buttons for an alarm (Acknowledge/Clear/Suppress/
Reactivate) using the shared `layer8d-btn`/`layer8d-btn-small` theme classes — same classes used
directly in mobile-specific code elsewhere in this library (`l8ui/m/js/layer8m-table-touch.js`),
so no mobile-specific styling is needed here either.
