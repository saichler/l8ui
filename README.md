# l8ui - Layer8 UI Component Library

A configuration-driven JavaScript/CSS component library for building enterprise web applications. Provides both **Desktop** and **Mobile** surfaces with full feature parity — modules supply only data (configs, enums, columns, forms) while all behavioral logic lives in shared library components.

---

## Component Guides

All component documentation is in the [`rules/`](rules/) directory, with one `.md` file per component. Key files:

### Architecture & Setup
- [architecture-overview.md](rules/architecture-overview.md) — Dependency graph, module pattern, dual-surface design
- [setup-configuration.md](rules/setup-configuration.md) — Layer8DConfig, Layer8MConfig
- [desktop-script-loading-order.md](rules/desktop-script-loading-order.md) — Script/CSS include order for desktop
- [mobile-script-loading-order.md](rules/mobile-script-loading-order.md) — Script/CSS include order for mobile

### Desktop Components (`Layer8D*`)
- [layer8d-config.md](rules/layer8d-config.md) — Global configuration
- [layer8d-utils.md](rules/layer8d-utils.md) — Utility functions
- [layer8d-table.md](rules/layer8d-table.md) — Data tables
- [layer8d-popup.md](rules/layer8d-popup.md) — Modal popups
- [layer8d-forms.md](rules/layer8d-forms.md) — Form framework
- [layer8d-renderers.md](rules/layer8d-renderers.md) — Cell renderers
- [layer8d-reference-registry.md](rules/layer8d-reference-registry.md) — Reference registry
- [layer8d-reference-picker.md](rules/layer8d-reference-picker.md) — Reference picker
- [layer8d-datepicker.md](rules/layer8d-datepicker.md) — Date picker
- [layer8d-input-formatter.md](rules/layer8d-input-formatter.md) — Input formatting
- [layer8d-notification.md](rules/layer8d-notification.md) — Notifications
- [layer8d-data-source.md](rules/layer8d-data-source.md) — Data source abstraction
- [layer8d-module-factory.md](rules/layer8d-module-factory.md) — Module bootstrapping
- [layer8d-module-filter.md](rules/layer8d-module-filter.md) — Module filtering
- [layer8d-toggle-tree.md](rules/layer8d-toggle-tree.md) — Toggle tree
- [layer8d-view-factory.md](rules/layer8d-view-factory.md) — View type switching

### Desktop View Types
- [layer8d-chart.md](rules/layer8d-chart.md) — Charts
- [layer8d-kanban.md](rules/layer8d-kanban.md) — Kanban boards
- [layer8d-timeline.md](rules/layer8d-timeline.md) — Timeline view
- [layer8d-calendar.md](rules/layer8d-calendar.md) — Calendar view
- [layer8d-gantt.md](rules/layer8d-gantt.md) — Gantt charts
- [layer8d-tree-grid.md](rules/layer8d-tree-grid.md) — Tree grid
- [layer8d-wizard.md](rules/layer8d-wizard.md) — Multi-step wizards
- [layer8d-widget.md](rules/layer8d-widget.md) — Dashboard widgets

### Mobile Components (`Layer8M*`)
- [layer8m-config.md](rules/layer8m-config.md) — Mobile configuration
- [layer8m-auth.md](rules/layer8m-auth.md) — Mobile authentication
- [layer8m-utils.md](rules/layer8m-utils.md) — Mobile utilities
- [layer8m-popup.md](rules/layer8m-popup.md) — Mobile popups
- [layer8m-table.md](rules/layer8m-table.md) — Mobile tables
- [layer8m-forms.md](rules/layer8m-forms.md) — Mobile forms
- [layer8m-datepicker.md](rules/layer8m-datepicker.md) — Mobile date picker
- [layer8m-reference-picker.md](rules/layer8m-reference-picker.md) — Mobile reference picker
- [layer8m-renderers.md](rules/layer8m-renderers.md) — Mobile renderers
- [layer8m-nav.md](rules/layer8m-nav.md) — Mobile navigation
- [layer8m-module-registry.md](rules/layer8m-module-registry.md) — Mobile module registry
- [layer8m-view-factory.md](rules/layer8m-view-factory.md) — Mobile view factory

### Shared & Utilities
- [factory-components.md](rules/factory-components.md) — Enum, column, form, reference factories
- [shared-schemas.md](rules/shared-schemas.md) — Column & form definition schemas
- [layer8-csv-export.md](rules/layer8-csv-export.md) — CSV export
- [layer8-file-upload.md](rules/layer8-file-upload.md) — File upload
- [layer8-markdown.md](rules/layer8-markdown.md) — Markdown rendering
- [l8agent-chat.md](rules/l8agent-chat.md) — AI chat component
- [l8logs.md](rules/l8logs.md) — Log viewer
- [registration-page.md](rules/registration-page.md) — Registration page
- [data-import-system.md](rules/data-import-system.md) — Data import system

### How-To Guides
- [adding-module-desktop.md](rules/adding-module-desktop.md) — Adding a new desktop module
- [adding-module-mobile.md](rules/adding-module-mobile.md) — Adding a new mobile module
- [special-cases.md](rules/special-cases.md) — Special cases & edge cases
- [checklist.md](rules/checklist.md) — Implementation checklist
