# Layer8MModuleRegistry

Factory that creates mobile module registries, replacing manual `findModule()` boilerplate.

```js
// Creates window.MobileHCM with getColumns, getFormDef, etc.
window.MobileHCM = Layer8MModuleRegistry.create('MobileHCM', {
    'Core HR': MobileCoreHR,
    'Payroll': MobilePayroll,
    'Benefits': MobileBenefits
});
```

The created registry provides:
```js
registry.getColumns(modelName)      // Column array or null
registry.getFormDef(modelName)      // Form definition or null
registry.getEnums(modelName)        // Enums object or null
registry.getPrimaryKey(modelName)   // Primary key field name or null
registry.getRender(modelName)       // Render object or null
registry.hasModel(modelName)        // Boolean
registry.getAllModels()             // Array of all model names
registry.getModuleName(modelName)   // Sub-module name or null
```
