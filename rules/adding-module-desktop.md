# Adding a New Module (Desktop)

Example: "Projects" module, service area 60.

## Step 1: Module Config

**File:** `l8ui/projects/projects-config.js`

```js
(function() {
    'use strict';
    const svc = Layer8ModuleConfigFactory.service;
    const mod = Layer8ModuleConfigFactory.module;

    Layer8ModuleConfigFactory.create({
        namespace: 'Projects',
        modules: {
            'planning': mod('Planning', 'icon-emoji', [
                svc('projects', 'Projects', 'icon', '/60/Project', 'Project'),
                svc('tasks', 'Tasks', 'icon', '/60/Task', 'ProjectTask')
            ])
        },
        submodules: ['ProjectPlanning']
    });
})();
```

## Step 2: Sub-Module Data Files (per sub-module)

**Enums:** `l8ui/projects/planning/planning-enums.js`
```js
(function() {
    'use strict';
    window.ProjectPlanning = window.ProjectPlanning || {};
    ProjectPlanning.enums = {
        STATUS: { 0: 'Unknown', 1: 'Draft', 2: 'Active', 3: 'Done' },
        STATUS_VALUES: { 'draft': 1, 'active': 2, 'done': 3 },
        STATUS_CLASSES: { 1: 'status-pending', 2: 'status-active', 3: 'status-completed' }
    };
    ProjectPlanning.render = {};
    ProjectPlanning.render.status = Layer8DRenderers.createStatusRenderer(
        ProjectPlanning.enums.STATUS, ProjectPlanning.enums.STATUS_CLASSES
    );
})();
```

**Columns:** `l8ui/projects/planning/planning-columns.js`
```js
(function() {
    'use strict';
    var enums = ProjectPlanning.enums;
    var render = ProjectPlanning.render;
    ProjectPlanning.columns = {
        Project: [
            { key: 'projectId', label: 'ID', sortKey: 'projectId', filterKey: 'projectId' },
            { key: 'name', label: 'Name', sortKey: 'name', filterKey: 'name' },
            { key: 'status', label: 'Status', sortKey: 'status', filterKey: 'status',
              enumValues: enums.STATUS_VALUES,
              render: (item) => render.status(item.status) }
        ]
    };
    ProjectPlanning.primaryKeys = { Project: 'projectId' };
})();
```

**Forms:** `l8ui/projects/planning/planning-forms.js`
```js
(function() {
    'use strict';
    var enums = ProjectPlanning.enums;
    ProjectPlanning.forms = {
        Project: {
            title: 'Project',
            sections: [{
                title: 'Project Information',
                fields: [
                    { key: 'name', label: 'Name', type: 'text', required: true },
                    { key: 'status', label: 'Status', type: 'select', options: enums.STATUS },
                    { key: 'startDate', label: 'Start', type: 'date', required: true }
                ]
            }]
        }
    };
})();
```

## Step 3: Module Init

**File:** `l8ui/projects/projects-init.js`
```js
(function() {
    'use strict';
    Layer8DModuleFactory.create({
        namespace: 'Projects',
        defaultModule: 'planning',
        defaultService: 'projects',
        sectionSelector: 'planning',
        initializerName: 'initializeProjects',
        requiredNamespaces: ['ProjectPlanning']
    });
})();
```

## Step 4: Section HTML

**File:** `sections/projects.html`

**IMPORTANT:** Table container IDs follow the pattern `{moduleKey}-{serviceKey}-table-container`. CSS classes use the `l8-` prefix for ALL modules (shared CSS from `layer8-section-layout.css`).

```html
<div class="section-container l8-section">
    <div class="page-header"><h1>Projects</h1></div>
    <div class="l8-module-tabs">
        <button class="l8-module-tab active" data-module="planning">
            <span class="tab-icon">icon</span>
            <span class="tab-label">Planning</span>
        </button>
    </div>
    <div class="l8-module-content active" data-module="planning">
        <div class="l8-subnav">
            <a class="l8-subnav-item active" data-service="projects">Projects</a>
            <a class="l8-subnav-item" data-service="tasks">Tasks</a>
        </div>
        <div class="l8-service-view active" data-service="projects">
            <div class="l8-table-container" id="planning-projects-table-container"></div>
        </div>
        <div class="l8-service-view" data-service="tasks">
            <div class="l8-table-container" id="planning-tasks-table-container"></div>
        </div>
    </div>
</div>
```

## Step 5: Wire into app.html

Add script tags (order: config, enums, columns, forms per sub-module, then init):
```html
<script src="l8ui/projects/projects-config.js"></script>
<script src="l8ui/projects/planning/planning-enums.js"></script>
<script src="l8ui/projects/planning/planning-columns.js"></script>
<script src="l8ui/projects/planning/planning-forms.js"></script>
<script src="l8ui/projects/projects-init.js"></script>
```

## Step 6: Wire into sections.js

```js
const sections = { ..., projects: 'sections/projects.html' };
const sectionInitializers = { ..., projects: () => { if (typeof initializeProjects === 'function') initializeProjects(); } };
```

## Step 7: Register Reference Models

```js
Layer8DReferenceRegistry.register({
    Project: { idColumn: 'projectId', displayColumn: 'name', displayLabel: 'Project' }
});
```
