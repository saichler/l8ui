# Adding a New Module (Mobile)

## Step 1: Module Data Files

**Enums:** `m/js/projects/planning-enums.js`
```js
(function() {
    'use strict';
    window.MobileProjectPlanning = window.MobileProjectPlanning || {};
    MobileProjectPlanning.enums = {
        STATUS: { 0: 'Unknown', 1: 'Draft', 2: 'Active', 3: 'Done' },
        STATUS_VALUES: { 'draft': 1, 'active': 2, 'done': 3 },
        STATUS_CLASSES: { 1: 'pending', 2: 'active', 3: 'completed' }
    };
    MobileProjectPlanning.render = {};
    MobileProjectPlanning.render.status = Layer8MRenderers.createStatusRenderer(
        MobileProjectPlanning.enums.STATUS, MobileProjectPlanning.enums.STATUS_CLASSES
    );
})();
```

**Columns:** `m/js/projects/planning-columns.js` (add `primary: true` and `secondary: true` for card display)
```js
(function() {
    'use strict';
    var enums = MobileProjectPlanning.enums;
    var render = MobileProjectPlanning.render;
    MobileProjectPlanning.columns = {
        Project: [
            { key: 'projectId', label: 'ID', sortKey: 'projectId', filterKey: 'projectId' },
            { key: 'name', label: 'Name', primary: true, sortKey: 'name', filterKey: 'name' },
            { key: 'status', label: 'Status', secondary: true, sortKey: 'status',
              enumValues: enums.STATUS_VALUES,
              render: (item) => render.status(item.status) }
        ]
    };
    MobileProjectPlanning.primaryKeys = { Project: 'projectId' };
})();
```

**Forms:** `m/js/projects/planning-forms.js` (same structure as desktop, mobile namespace)

**Registry:** `m/js/projects/projects-index.js`
```js
// m/js/projects/projects-index.js
(function() {
    'use strict';
    Layer8MModuleRegistry.create('MobileProjects', {
        'Planning': MobileProjectPlanning
    });
})();
```

## Step 2: Update Nav Config

Navigation configs are project-specific and live in `erp-ui/m/nav-configs/`. Add your module to the appropriate config file:

1. Add to modules array in `layer8m-nav-config-base.js`:
   `{ key: 'projects', label: 'Projects', icon: 'projects', hasSubModules: true }`
2. Add config block to the appropriate category file (e.g., `layer8m-nav-config-prj-other.js`):
```js
LAYER8M_NAV_CONFIG.projects = {
    subModules: [
        { key: 'planning', label: 'Planning', icon: 'projects' }
    ],
    services: {
        'planning': [
            { key: 'projects', label: 'Projects', icon: 'projects',
              endpoint: '/60/Project', model: 'Project', idField: 'projectId',
              supportedViews: ['table', 'kanban', 'gantt', 'timeline'] },
            { key: 'tasks', label: 'Tasks', icon: 'projects',
              endpoint: '/60/Task', model: 'ProjectTask', idField: 'taskId' }
        ]
    }
};
```

## Step 3: Register Module with Nav.js

In `l8ui/m/js/layer8m-nav-data.js`, add `window.MobileProjects` to the registry arrays in `_getServiceColumns`, `_getServiceFormDef`, and `_getServiceTransformData`. **Note:** This requires modifying a library file; future versions may support dynamic registration.

## Step 4: Update m/app.html

Add scripts before nav config:
```html
<script src="js/projects/planning-enums.js"></script>
<script src="js/projects/planning-columns.js"></script>
<script src="js/projects/planning-forms.js"></script>
<script src="js/projects/projects-index.js"></script>
```

Add sidebar link (routes through card nav):
```html
<a href="#dashboard" class="sidebar-item" data-section="dashboard" data-module="projects">Projects</a>
```

## Step 5: Register Reference Models

Create a project-specific reference registry file in `erp-ui/m/reference-registries/`:

```js
// erp-ui/m/reference-registries/layer8m-reference-registry-projects.js
const ref = window.Layer8RefFactory;

window.Layer8MReferenceRegistryProjects = {
    ...ref.simple('Project', 'projectId', 'name', 'Project'),
    ...ref.simple('ProjectTask', 'taskId', 'name', 'Task')
};

// Register with the central registry
Layer8MReferenceRegistry.register(window.Layer8MReferenceRegistryProjects);
```

Then include it in `m/app.html` after the main reference registry loads.
