# Desktop Script Loading Order

CSS files first, then JS in strict dependency order:

```html
<!-- CSS: Theme -->
<link rel="stylesheet" href="l8ui/shared/layer8d-theme.css">
<link rel="stylesheet" href="l8ui/shared/layer8d-animations.css">
<link rel="stylesheet" href="l8ui/shared/layer8d-scrollbar.css">

<!-- CSS: Section Layout (l8-* classes) -->
<link rel="stylesheet" href="l8ui/shared/layer8-section-layout.css">
<link rel="stylesheet" href="l8ui/shared/layer8-section-responsive.css">

<!-- CSS: Components -->
<link rel="stylesheet" href="l8ui/edit_table/layer8d-table.css">
<link rel="stylesheet" href="l8ui/shared/layer8d-toggle-tree.css">
<link rel="stylesheet" href="l8ui/popup/layer8d-popup.css">
<link rel="stylesheet" href="l8ui/popup/layer8d-popup-forms.css">
<link rel="stylesheet" href="l8ui/popup/layer8d-popup-content.css">
<link rel="stylesheet" href="l8ui/datepicker/layer8d-datepicker.css">
<link rel="stylesheet" href="l8ui/reference_picker/layer8d-reference-picker.css">
<link rel="stylesheet" href="l8ui/input_formatters/layer8d-input-formatter.css">
<link rel="stylesheet" href="l8ui/notification/layer8d-notification.css">

<!-- CSS: View System -->
<link rel="stylesheet" href="l8ui/shared/layer8-view-switcher.css">
<link rel="stylesheet" href="l8ui/chart/layer8d-chart.css">
<link rel="stylesheet" href="l8ui/kanban/layer8d-kanban.css">
<link rel="stylesheet" href="l8ui/timeline/layer8d-timeline.css">
<link rel="stylesheet" href="l8ui/calendar/layer8d-calendar.css">
<link rel="stylesheet" href="l8ui/gantt/layer8d-gantt.css">
<link rel="stylesheet" href="l8ui/tree_grid/layer8d-tree-grid.css">
<link rel="stylesheet" href="l8ui/wizard/layer8d-wizard.css">
<link rel="stylesheet" href="l8ui/dashboard/layer8d-widget.css">

<!-- CSS: Markdown -->
<link rel="stylesheet" href="l8ui/shared/layer8-markdown.css">

<!-- CSS: File Upload -->
<link rel="stylesheet" href="l8ui/shared/layer8-file-upload.css">

<!-- CSS: SYS Module -->
<link rel="stylesheet" href="l8ui/sys/l8sys.css">
<link rel="stylesheet" href="l8ui/sys/health/l8health.css">
<link rel="stylesheet" href="l8ui/sys/modules/l8sys-modules.css">
<link rel="stylesheet" href="l8ui/sys/logs/l8logs.css">
<link rel="stylesheet" href="l8ui/sys/dataimport/l8dataimport.css">

<!-- CSS: AI Agent -->
<link rel="stylesheet" href="l8ui/l8agent/l8agent-chat.css">

<!-- CSS: Module-specific (optional, per project) -->
<link rel="stylesheet" href="mymodule/mymodule.css">

<!-- JS: App Shell (sections mapping, app bootstrap) -->
<script src="js/sections.js"></script>
<script src="js/app.js"></script>

<!-- JS: Layer8 Core -->
<script src="l8ui/shared/layer8d-config.js"></script>
<script src="l8ui/shared/layer8d-utils.js"></script>
<script src="l8ui/shared/layer8d-renderers.js"></script>
<script src="l8ui/shared/layer8d-reference-registry.js"></script>

<!-- JS: Factory Components (load before module scripts) -->
<script src="l8ui/shared/layer8-enum-factory.js"></script>
<script src="l8ui/shared/layer8-ref-factory.js"></script>
<script src="l8ui/shared/layer8-column-factory.js"></script>
<script src="l8ui/shared/layer8-form-factory.js"></script>
<script src="l8ui/shared/layer8-form-factory-presets.js"></script>
<script src="l8ui/shared/layer8-svg-factory.js"></script>

<!-- JS: Project-specific SVG templates (optional) -->
<script src="erp-ui/erp-svg-templates.js"></script>

<script src="l8ui/shared/layer8d-module-config-factory.js"></script>
<script src="l8ui/shared/layer8-section-generator.js"></script>

<!-- JS: Reference Data (project-specific) -->
<script src="js/reference-registry-fin.js"></script>
<script src="js/reference-registry-hcm.js"></script>
<!-- ... more reference registries -->

<!-- JS: Notification Component (load before forms) -->
<script src="l8ui/notification/layer8d-notification.js"></script>

<!-- JS: Input Formatter Component (load in order, before forms) -->
<script src="l8ui/input_formatters/layer8d-input-formatter-utils.js"></script>
<script src="l8ui/input_formatters/layer8d-input-formatter-masks.js"></script>
<script src="l8ui/input_formatters/layer8d-input-formatter-types-validators.js"></script>
<script src="l8ui/input_formatters/layer8d-input-formatter-types.js"></script>
<script src="l8ui/input_formatters/layer8d-input-formatter-core.js"></script>
<script src="l8ui/input_formatters/layer8d-input-formatter.js"></script>

<!-- JS: Markdown Renderer -->
<script src="l8ui/shared/layer8-markdown.js"></script>

<!-- JS: File Upload -->
<script src="l8ui/shared/layer8-file-upload.js"></script>

<!-- JS: CSV Export -->
<script src="l8ui/shared/layer8-csv-export.js"></script>

<!-- JS: Forms Component (load sub-modules then facade) -->
<script src="l8ui/shared/layer8d-forms-fields.js"></script>
<script src="l8ui/shared/layer8d-forms-fields-ext.js"></script>
<script src="l8ui/shared/layer8d-forms-data.js"></script>
<script src="l8ui/shared/layer8d-forms-pickers.js"></script>
<script src="l8ui/shared/layer8d-forms-modal.js"></script>
<script src="l8ui/shared/layer8d-forms.js"></script>

<!-- JS: Popup Component -->
<script src="l8ui/popup/layer8d-popup.js"></script>

<!-- JS: Date Picker Component (load in order) -->
<script src="l8ui/datepicker/layer8d-datepicker-utils.js"></script>
<script src="l8ui/datepicker/layer8d-datepicker-calendar.js"></script>
<script src="l8ui/datepicker/layer8d-datepicker-core.js"></script>
<script src="l8ui/datepicker/layer8d-datepicker.js"></script>

<!-- JS: Reference Picker Component (load in order) -->
<script src="l8ui/reference_picker/layer8d-reference-picker-utils.js"></script>
<script src="l8ui/reference_picker/layer8d-reference-picker-data.js"></script>
<script src="l8ui/reference_picker/layer8d-reference-picker-render.js"></script>
<script src="l8ui/reference_picker/layer8d-reference-picker-events.js"></script>
<script src="l8ui/reference_picker/layer8d-reference-picker-core.js"></script>
<script src="l8ui/reference_picker/layer8d-reference-picker.js"></script>

<!-- JS: Table Component (load in order) -->
<script src="l8ui/edit_table/layer8d-table-core.js"></script>
<script src="l8ui/edit_table/layer8d-table-data.js"></script>
<script src="l8ui/edit_table/layer8d-table-render.js"></script>
<script src="l8ui/edit_table/layer8d-table-events.js"></script>
<script src="l8ui/edit_table/layer8d-table-filter.js"></script>
<script src="l8ui/edit_table/layer8d-table.js"></script>

<!-- JS: View System (load after table) -->
<script src="l8ui/shared/layer8d-view-factory.js"></script>
<script src="l8ui/shared/layer8-view-switcher.js"></script>
<script src="l8ui/shared/layer8d-data-source.js"></script>
<script src="l8ui/chart/layer8d-chart-core.js"></script>
<script src="l8ui/chart/layer8d-chart-bar.js"></script>
<script src="l8ui/chart/layer8d-chart-line.js"></script>
<script src="l8ui/chart/layer8d-chart-pie.js"></script>
<script src="l8ui/kanban/layer8d-kanban-core.js"></script>
<script src="l8ui/kanban/layer8d-kanban-render.js"></script>
<script src="l8ui/timeline/layer8d-timeline.js"></script>
<script src="l8ui/calendar/layer8d-calendar-core.js"></script>
<script src="l8ui/calendar/layer8d-calendar-render.js"></script>
<script src="l8ui/gantt/layer8d-gantt-core.js"></script>
<script src="l8ui/gantt/layer8d-gantt-render.js"></script>
<script src="l8ui/tree_grid/layer8d-tree-grid-core.js"></script>
<script src="l8ui/wizard/layer8d-wizard-core.js"></script>
<script src="l8ui/wizard/layer8d-wizard-render.js"></script>
<script src="l8ui/dashboard/layer8d-widget.js"></script>

<!-- JS: Module Abstractions -->
<script src="l8ui/shared/layer8d-service-registry.js"></script>
<script src="l8ui/shared/layer8d-module-crud.js"></script>
<script src="l8ui/shared/layer8d-module-navigation.js"></script>
<script src="l8ui/shared/layer8d-toggle-tree.js"></script>
<script src="l8ui/shared/layer8d-module-filter.js"></script>
<script src="l8ui/shared/layer8-module-factory-core.js"></script>
<script src="l8ui/shared/layer8d-module-factory.js"></script>

<!-- JS: Module Data (per module, per sub-module) -->
<script src="mymodule/mymodule-section-config.js"></script>
<script src="mymodule/mymodule-config.js"></script>
<script src="mymodule/submodule/submodule-enums.js"></script>
<script src="mymodule/submodule/submodule-columns.js"></script>
<script src="mymodule/submodule/submodule-forms.js"></script>
<!-- repeat for each sub-module -->
<script src="mymodule/mymodule-init.js"></script>

<!-- JS: SYS Module (built-in) -->
<script src="l8ui/sys/l8sys-config.js"></script>
<script src="l8ui/sys/health/l8health.js"></script>
<script src="l8ui/sys/security/l8security-enums.js"></script>
<script src="l8ui/sys/security/l8security-columns.js"></script>
<script src="l8ui/sys/security/l8security-forms.js"></script>
<script src="l8ui/sys/security/l8security.js"></script>
<script src="l8ui/sys/security/l8security-users-crud.js"></script>
<script src="l8ui/sys/security/l8security-roles-crud.js"></script>
<script src="l8ui/sys/security/l8security-credentials-crud.js"></script>
<script src="l8ui/sys/modules/l8sys-dependency-graph.js"></script>
<script src="l8ui/sys/modules/l8sys-modules-map.js"></script>
<script src="l8ui/sys/modules/l8sys-modules.js"></script>
<script src="l8ui/sys/logs/l8logs.js"></script>
<script src="l8ui/sys/dataimport/l8dataimport.js"></script>
<script src="l8ui/sys/dataimport/l8dataimport-templates.js"></script>
<script src="l8ui/sys/dataimport/l8dataimport-transfer.js"></script>
<script src="l8ui/sys/dataimport/l8dataimport-execute.js"></script>
<script src="l8ui/sys/l8sys-init.js"></script>

<!-- JS: AI Agent Module -->
<script src="l8ui/l8agent/l8agent-enums.js"></script>
<script src="l8ui/l8agent/l8agent-columns.js"></script>
<script src="l8ui/l8agent/l8agent-forms.js"></script>
<script src="l8ui/l8agent/l8agent-chat.js"></script>
```
