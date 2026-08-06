# l8notify UI — Notification Delivery-Log and Integration-Config Components

Reusable UI components for the `l8notify` shared library's activatable services: `Notify` (immutable delivery-log
records, dispatches on `POST`) and `IntegCfg` (editable SMTP/webhook/Slack integration endpoint configuration).
Provides enums, table/card column definitions, and form definitions for any project that activates
`notifyservices.ActivateNotify`/`ActivateIntegrationConfig`.

Files: `l8ui/notify/*.js`, `l8ui/notify/l8notify-notification.css`.

**Used unforked on both desktop and mobile.** There is no `Layer8M*`-suffixed or `m/`-subdirectory variant of any
file here — all 4 JS files serve both `app.html` and `m/app.html` directly, same script tags, same global names.
This is deliberate, not an oversight: none of these files call a genuinely desktop-only widget
(`Layer8DTable`, `Layer8DPopup`) — every one of them is a pure `getColumns()`/`getFormDefinition()`/
`getInlineTableDef()` data function with zero DOM manipulation. Their one real dependency —
`Layer8DRenderers` — is loaded on mobile pages too (see `mobile-script-loading-order.md`; `l8security-enums.js`
and `l8events-enums.js` already follow the identical pattern in production). **Do not "fix" this by splitting the
files per platform** — that reintroduces duplicate enum/column logic that was deliberately avoided when this
component was added.

The CSS file is currently empty (just a header comment) — every component here is data-only and relies entirely
on `Layer8DTable`/`Layer8DForms`' own styling. Add rules only if a future component in this directory renders its
own markup.

## Prerequisites

Load after these shared components (available on both desktop and mobile pages):
- `Layer8DRenderers` — `createStatusRenderer`, `renderEnum`
- `Layer8EnumFactory` — `create()`
- `Layer8ColumnFactory` — `col`, `status`, `enum`, `date`, `number`, `custom`
- `Layer8FormFactory` — `form`, `section`, `text`, `textarea`, `select`, `number`, `checkbox`, `date`

## Script Loading Order

Identical include list for `app.html` and `m/app.html` — after the shared l8ui scripts above, before
project-specific module init files:

```html
<link rel="stylesheet" href="l8ui/notify/l8notify-notification.css">
<script src="l8ui/notify/l8notify-enums.js"></script>              <!-- Must be first (others depend on it) -->
<script src="l8ui/notify/l8notify-integration-mgmt.js"></script>
<script src="l8ui/notify/l8notify-delivery-log.js"></script>
<script src="l8ui/notify/l8notify-target-editor.js"></script>
```

## `window.L8NotifyEnums`

Enum maps and renderers: `NOTIFY_CHANNEL` (Unspecified/Email/Webhook/Slack/PagerDuty/Custom), `DELIVERY_STATUS`
(Unspecified/Pending/Sent/Failed/Retrying), `INTEGRATION_TYPE` (Unspecified/SMTP/Webhook/Slack/PagerDuty/Custom),
plus a `render` map (`channel`, `deliveryStatus`, `integrationType`) built with
`Layer8DRenderers.renderEnum`/`createStatusRenderer`. Every other file in this component depends on it — must
load first.

**When using any of these enums in `f.select(...)`, pass `.enum`, not the enum object itself** — e.g.
`f.select('channel', 'Channel', L8NotifyEnums.NOTIFY_CHANNEL.enum)`. `Layer8FormFactory.select()` stores its
`options` argument as-is with no unwrapping; passing the whole `{enum, values, classes}` factory-return object
produces a dropdown with three garbage options instead of the real choices.

## `window.L8NotifyIntegrationMgmt`

```js
L8NotifyIntegrationMgmt.getColumns()          // Column defs for a table/card list of IntegrationConfig records
L8NotifyIntegrationMgmt.getFormDefinition()   // Create/edit form definition for a single IntegrationConfig
```
`getColumns()` marks `name` as the mobile card `primary` field and `type` as `secondary` — desktop ignores both
properties. `IntegrationConfig` is fully editable (unlike `NotifyRecord`) — wire this into a standard CRUD flow
(`Layer8DForms.openAddForm`/`openEditForm`/`confirmDelete`) against `/<prefix>/78/IntegCfg`,
`modelName: 'IntegrationConfig'`, `primaryKey: 'integrationId'`. The form's `credentialKey` field is a plain text
input, not a masked/password field — it's a lookup key into the consumer's own security config JSON `credentials`
map, never the secret value itself.

## `window.L8NotifyDeliveryLog`

```js
L8NotifyDeliveryLog.getColumns(options)       // options: { showChannel: true, showTarget: true } (both default true)
L8NotifyDeliveryLog.getFormDefinition()       // Read-only detail form definition for a single NotifyRecord
```
`getColumns()` marks `endpoint` as the mobile card `primary` field when `showTarget` is not `false` (it's
conditionally included), and `status` as `secondary` (always present). `NotifyRecord` is immutable — the server
rejects `PUT` — so the detail popup MUST be opened via `Layer8DForms.openViewForm(...)`, never `openEditForm(...)`
(`immutability-ui-alignment.md`). Wire the table read-only: `onAdd: null, onEdit: null, onDelete: null`.

## `window.L8NotifyTargetEditor`

```js
L8NotifyTargetEditor.getInlineTableDef()   // { key: 'targets', label: 'Notification Targets', columns: [...] }
```
Returns an inline-table definition for editing a `repeated NotifyTarget` array embedded in a consumer's own
policy/rule form — pass it to `f.inlineTable(def.key, def.label, def.columns)`. `NotifyTarget` is an
embedded/child type, not backed by its own service. No `primary`/`secondary` markers — this feeds a *nested*
inline table inside a parent form, not a top-level `Layer8MTable`/`Layer8MEditTable` card list, so the mobile
card-display convention doesn't apply here.
