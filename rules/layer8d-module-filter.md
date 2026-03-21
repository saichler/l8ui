# Layer8DModuleFilter

Runtime module filter that hides disabled modules/sub-modules/services based on server-stored config.

```js
await Layer8DModuleFilter.load(bearerToken)        // Load config on app startup
Layer8DModuleFilter.isEnabled('hcm')               // Check module
Layer8DModuleFilter.isEnabled('hcm.payroll')       // Check sub-module
Layer8DModuleFilter.isEnabled('hcm.core-hr.employees') // Check service
Layer8DModuleFilter.applyToSidebar()               // Hide disabled sidebar items
Layer8DModuleFilter.applyToSection('hcm')          // Hide disabled tabs/services
await Layer8DModuleFilter.save(disabledPaths, bearerToken) // Save config
```

Uses dot-notation paths. A disabled parent disables all children. Dashboard and System are never filtered.
