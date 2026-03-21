# Layer8DModuleFactory

Single call bootstraps an entire module with navigation, CRUD, and service registry:

```js
Layer8DModuleFactory.create({
    namespace: 'HCM',                      // window.HCM
    defaultModule: 'core-hr',              // Default sub-module tab
    defaultService: 'employees',           // Default service
    sectionSelector: 'core-hr',            // data-module attribute
    initializerName: 'initializeHCM',      // Global init function name
    requiredNamespaces: ['CoreHR', 'Payroll']
});
```

This call: registers sub-modules, creates forms facade, attaches tab/subnav navigation, attaches CRUD operations, and exposes the global initializer function.

## Layer8ModuleConfigFactory

Factory for creating module configurations with minimal boilerplate. Use instead of manually setting `modules`, `submodules`, and `renderStatus` on namespace objects.

```js
// Helper: create a service entry
const svc = Layer8ModuleConfigFactory.service;

// Helper: create a module entry
const mod = Layer8ModuleConfigFactory.module;

// Create a full module config
Layer8ModuleConfigFactory.create({
    namespace: 'Bi',
    modules: {
        'reporting': mod('Reporting', 'icon', [
            svc('reports', 'Reports', 'icon', '/35/BiReport', 'BiReport'),
            svc('schedules', 'Schedules', 'icon', '/35/BiSchedule', 'BiReportSchedule')
        ]),
        'dashboards': mod('Dashboards', 'icon', [
            svc('dashboards', 'Dashboards', 'icon', '/35/BiDashbrd', 'BiDashboard')
        ])
    },
    submodules: ['BiReporting', 'BiDashboards']
});
```

This creates `window.Bi` with `.modules`, `.submodules`, and `.renderStatus` properties.
