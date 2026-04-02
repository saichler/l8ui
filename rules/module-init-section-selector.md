# Module Init sectionSelector Must Match defaultModule

## Rule
In `*-init.js` files that use `Layer8DModuleFactory.create()`, the `sectionSelector` property MUST match the `defaultModule` property value.

## Why This Matters
The navigation code in `layer8d-module-navigation.js` searches for the section container using:
```javascript
document.querySelector(`.hcm-module-content[data-module="${config.sectionSelector}"]`)
```

The `data-module` attributes in the HTML correspond to submodule names (e.g., `planning`, `resources`, `opportunities`), NOT the section name (e.g., `projects`, `crm`).

If `sectionSelector` doesn't match any `data-module` attribute in the HTML, the module will fail to initialize with the error:
```
<Module> section container not found
```

## Correct Pattern

```javascript
// CORRECT - sectionSelector matches defaultModule
Layer8DModuleFactory.create({
    namespace: 'Prj',
    defaultModule: 'planning',        // <-- These must match
    defaultService: 'projects',
    sectionSelector: 'planning',      // <-- These must match
    initializerName: 'initializePrj',
    requiredNamespaces: [...]
});
```

```javascript
// WRONG - sectionSelector uses section name instead of module name
Layer8DModuleFactory.create({
    namespace: 'Prj',
    defaultModule: 'planning',
    defaultService: 'projects',
    sectionSelector: 'projects',      // <-- WRONG: 'projects' is the section, not the module
    initializerName: 'initializePrj',
    requiredNamespaces: [...]
});
```

## Verification
When creating a module init file, verify:
1. `sectionSelector` === `defaultModule`
2. The HTML has `<div class="hcm-module-content" data-module="${sectionSelector}">`

## Examples from Existing Modules

| Module | defaultModule | sectionSelector |
|--------|---------------|-----------------|
| CRM    | opportunities | opportunities   |
| PRJ    | planning      | planning        |
| HCM    | core-hr       | core-hr         |
| FIN    | general-ledger| general-ledger  |
