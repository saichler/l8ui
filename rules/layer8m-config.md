# Layer8MConfig

```js
await Layer8MConfig.load()                     // Fetches /login.json
Layer8MConfig.getConfig()                      // Returns raw { login: {...}, app: {...} }
Layer8MConfig.resolveEndpoint('/30/Employee')   // '/erp/30/Employee'
Layer8MConfig.getDateFormat()                   // 'mm/dd/yyyy'
Layer8MConfig.registerModules({...})            // Register module configs
Layer8MConfig.registerReferences({...})         // Register reference picker data
Layer8MConfig.getReferenceConfig('Employee')    // Get reference config
```

**Note:** `getConfig()` returns raw login.json. Access app config via `config.app.healthPath`, NOT `config.healthPath`.
