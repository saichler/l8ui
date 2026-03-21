# Layer8MNav

```js
Layer8MNav.showHome()                          // Module cards grid
Layer8MNav.navigateToModule('hcm')             // Sub-module cards
Layer8MNav.navigateToSubModule('hcm', 'core-hr')
Layer8MNav.navigateToService('hcm', 'core-hr', 'employees')
Layer8MNav.navigateBack()
Layer8MNav.getCurrentState()                   // { level, module, subModule, service }
```

Layer8MNav looks up columns/forms/transforms from registered module objects (checked in order):
```js
[window.MobileHCM, window.MobileFIN, window.MobileSCM, window.MobileSYS, ...]
```

Each must provide:
```js
window.MobileXXX = {
    getColumns(modelName),      // Column array or null
    getFormDef(modelName),      // Form definition or null
    getTransformData(modelName) // Transform function or null (optional)
}
```

## LAYER8M_NAV_CONFIG

Navigation hierarchy:

```js
window.LAYER8M_NAV_CONFIG = {
    modules: [
        { key: 'hcm', label: 'Human Capital', icon: 'hcm', hasSubModules: true }
    ],
    hcm: {
        subModules: [
            { key: 'core-hr', label: 'Core HR', icon: 'employees' }
        ],
        services: {
            'core-hr': [
                { key: 'employees', label: 'Employees', icon: 'employees',
                  endpoint: '/30/Employee', model: 'Employee', idField: 'employeeId' },
                { key: 'leave-requests', label: 'Leave Requests', icon: 'time',
                  endpoint: '/30/LeaveReq', model: 'LeaveRequest', idField: 'requestId',
                  supportedViews: ['table', 'kanban', 'calendar'] },
                { key: 'health', label: 'Health', icon: 'health',
                  endpoint: '/0/Health', model: 'L8Health', idField: 'service',
                  readOnly: true }
            ]
        }
    },
    icons: { 'hcm': '<svg>...</svg>' },
    getIcon(key) { ... }
};
```

## Extensibility Patterns

The l8ui library is designed for extensibility. Project-specific code lives in a separate directory (e.g., `erp-ui/`) and registers with the library components.

### Layer8MReferenceRegistry.register()

Register project-specific model reference configurations:

```js
// In erp-ui/m/reference-registries/layer8m-reference-registry-mymodule.js
const ref = window.Layer8RefFactory;

window.Layer8MReferenceRegistryMyModule = {
    ...ref.simple('Model', 'modelId', 'name', 'Label'),
    ...ref.person('Person', 'personId', 'lastName', 'firstName'),
    ...ref.coded('Entity', 'entityId', 'code', 'name'),
    ...ref.idOnly('LineItem', 'lineId')
};

// Register with the central registry
Layer8MReferenceRegistry.register(window.Layer8MReferenceRegistryMyModule);
```

### Layer8SvgFactory.registerTemplate()

Register project-specific SVG illustration templates:

```js
// In erp-ui/erp-svg-templates.js
Layer8SvgFactory.registerTemplate('myModule', function(color) {
    return `<svg viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="50" fill="${color}" opacity="0.2"/>
        <!-- more SVG content -->
    </svg>`;
});
```

Use in section generator:
```js
Layer8SectionConfigs.register('mymodule', {
    svgContent: Layer8SvgFactory.get('myModule', '#4CAF50'),
    // ...
});
```
