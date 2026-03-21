# Mobile Script Loading Order

```html
<!-- CSS: Components -->
<link rel="stylesheet" href="../l8ui/m/css/layer8m-popup.css">
<link rel="stylesheet" href="../l8ui/m/css/layer8m-confirm.css">
<link rel="stylesheet" href="../l8ui/m/css/layer8m-table.css">
<link rel="stylesheet" href="../l8ui/m/css/layer8m-edit-table.css">
<link rel="stylesheet" href="../l8ui/m/css/layer8m-forms.css">
<link rel="stylesheet" href="../l8ui/m/css/layer8m-datepicker.css">
<link rel="stylesheet" href="../l8ui/m/css/layer8m-reference-picker.css">
<link rel="stylesheet" href="../l8ui/m/css/layer8m-nav-cards.css">

<!-- JS: Layer8 Mobile Core -->
<script src="../l8ui/m/js/layer8m-config.js"></script>
<!-- JS: Project-specific config registration (optional) -->
<script src="js/mobile-config-hcm.js"></script>
<!-- JS: Layer8 Mobile Auth & Utils -->
<script src="../l8ui/m/js/layer8m-auth.js"></script>
<script src="../l8ui/m/js/layer8m-utils.js"></script>

<!-- JS: Shared Desktop Utilities (needed for currency cache, renderers) -->
<script src="../l8ui/shared/layer8d-config.js"></script>
<script src="../l8ui/shared/layer8d-utils.js"></script>
<script src="../l8ui/shared/layer8d-renderers.js"></script>
<script src="../l8ui/shared/layer8d-reference-registry.js"></script>

<!-- JS: Factory Components (shared with desktop) -->
<script src="../l8ui/shared/layer8-enum-factory.js"></script>
<script src="../l8ui/shared/layer8-ref-factory.js"></script>
<script src="../l8ui/shared/layer8-column-factory.js"></script>
<script src="../l8ui/shared/layer8-form-factory.js"></script>

<!-- JS: Mobile Module Registry Factory -->
<script src="../l8ui/m/js/layer8m-module-registry.js"></script>

<!-- JS: Layer8 Mobile Components -->
<script src="../l8ui/m/js/layer8m-popup.js"></script>
<script src="../l8ui/m/js/layer8m-confirm.js"></script>
<script src="../l8ui/m/js/layer8m-table.js"></script>
<script src="../l8ui/m/js/layer8m-edit-table.js"></script>
<script src="../l8ui/m/js/layer8m-forms-fields.js"></script>
<script src="../l8ui/m/js/layer8m-forms-fields-ext.js"></script>
<script src="../l8ui/m/js/layer8m-forms-fields-reference.js"></script>
<script src="../l8ui/m/js/layer8m-forms.js"></script>
<script src="../l8ui/m/js/layer8m-forms-inline.js"></script>
<script src="../l8ui/m/js/layer8m-datepicker.js"></script>
<script src="../l8ui/m/js/layer8m-reference-registry.js"></script>

<!-- JS: Project-specific Reference Registries (register with Layer8MReferenceRegistry) -->
<script src="../erp-ui/m/reference-registries/layer8m-reference-registry-hcm.js"></script>
<script src="../erp-ui/m/reference-registries/layer8m-reference-registry-scm.js"></script>
<!-- ... more project-specific registries -->

<script src="../l8ui/m/js/layer8m-reference-picker.js"></script>
<script src="../l8ui/m/js/layer8m-renderers.js"></script>
<script src="../l8ui/m/js/layer8m-data-source.js"></script>

<!-- JS: Shared Utilities (markdown, file upload, CSV export) -->
<script src="../l8ui/shared/layer8-markdown.js"></script>
<script src="../l8ui/shared/layer8-file-upload.js"></script>
<script src="../l8ui/shared/layer8-csv-export.js"></script>

<!-- JS: Module Data (per module) -->
<script src="js/mymodule/submodule-enums.js"></script>
<script src="js/mymodule/submodule-columns.js"></script>
<script src="js/mymodule/submodule-forms.js"></script>
<script src="js/mymodule/mymodule-index.js"></script>

<!-- JS: Shared Toggle Tree + Module Filter -->
<script src="../l8ui/shared/layer8d-toggle-tree.js"></script>
<script src="../l8ui/shared/layer8d-module-filter.js"></script>
<script src="../l8ui/sys/modules/l8sys-dependency-graph.js"></script>
<script src="../l8ui/sys/modules/l8sys-modules-map.js"></script>
<script src="../l8ui/sys/modules/l8sys-modules.js"></script>

<!-- JS: Navigation Core (generic, load BEFORE nav configs) -->
<script src="../l8ui/m/js/layer8m-nav-crud.js"></script>
<script src="../l8ui/m/js/layer8m-nav-data.js"></script>
<script src="../l8ui/m/js/layer8m-nav.js"></script>

<!-- JS: Navigation Config (project-specific, load AFTER nav core) -->
<script src="../erp-ui/m/nav-configs/layer8m-nav-config-base.js"></script>
<script src="../erp-ui/m/nav-configs/layer8m-nav-config-icons.js"></script>
<script src="../erp-ui/m/nav-configs/layer8m-nav-config-fin-hcm.js"></script>
<script src="../erp-ui/m/nav-configs/layer8m-nav-config-scm-sales.js"></script>
<script src="../erp-ui/m/nav-configs/layer8m-nav-config-prj-other.js"></script>
<script src="../erp-ui/m/nav-configs/layer8m-nav-config.js"></script>

<!-- JS: Mobile View System -->
<script src="../l8ui/m/js/layer8m-view-factory.js"></script>
<script src="../l8ui/shared/layer8-view-switcher.js"></script>
<script src="../l8ui/m/js/layer8m-chart.js"></script>
<script src="../l8ui/m/js/layer8m-kanban.js"></script>
<script src="../l8ui/m/js/layer8m-calendar.js"></script>
<script src="../l8ui/m/js/layer8m-timeline.js"></script>
<script src="../l8ui/m/js/layer8m-gantt.js"></script>
<script src="../l8ui/m/js/layer8m-tree-grid.js"></script>
<script src="../l8ui/m/js/layer8m-wizard.js"></script>

<!-- JS: AI Agent (Mobile) -->
<script src="../l8ui/l8agent/l8agent-enums.js"></script>
<script src="../l8ui/l8agent/l8agent-columns.js"></script>
<script src="../l8ui/l8agent/l8agent-forms.js"></script>
<script src="../l8ui/l8agent/m/l8agent-chat-m.js"></script>

<!-- JS: App -->
<script src="js/app-core.js"></script>
```

**Note:** Mobile loads several desktop shared utilities (`Layer8DConfig`, `Layer8DUtils`, `Layer8DRenderers`, `Layer8DReferenceRegistry`) and all four factory components. Reference registries, nav configs, and SYS module components are project-specific and live in `erp-ui/`. The core l8ui library loads first, then project-specific files register their data. Navigation core scripts load BEFORE nav config scripts.
