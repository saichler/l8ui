# ModConfig Failure Must Not Logout the User

## Rule
When implementing a new PRD project that copies `app.js` from l8erp, the `Layer8DModuleFilter.load()` call MUST be either removed or made non-blocking. A failed ModConfig fetch must NEVER log the user out.

## Why This Matters
The l8erp `app.js` calls `Layer8DModuleFilter.load(bearerToken)` on startup, which fetches `/0/ModConfig` (the `SysModuleConfig` service). This service is l8erp-specific — new projects don't have it. When the fetch returns 404/error, `Layer8DModuleFilter.load()` internally calls `logout()`, immediately redirecting the user to the login page in an infinite loop.

## The Trap
The logout happens INSIDE `Layer8DModuleFilter.load()` (in the shared l8ui library), not in `app.js`. Wrapping the call in try/catch does NOT help — the logout fires before the promise rejects.

## Fix Pattern
If the new project does not have a ModConfig service, remove the block entirely:
```javascript
// <ProjectName> does not use ModConfig — skip Layer8DModuleFilter to avoid logout on 404
```

If the project DOES have ModConfig (or plans to add it later), keep the call but guard it:
```javascript
// Only load module filter if ModConfig service exists
if (typeof Layer8DModuleFilter !== 'undefined' && HAS_MOD_CONFIG_SERVICE) {
    const configLoaded = await Layer8DModuleFilter.load(bearerToken);
    if (configLoaded) {
        Layer8DModuleFilter.applyToSidebar();
    }
}
```

## Applies To
- Any project that copies `app.js` from l8erp
- Any project that copies l8ui shared components (which include `layer8d-module-filter.js`)

## Also Check When Copying app.js
Other l8erp-specific fetches in app.js that may not apply to new projects:
- Currency cache loading (`/erp/40/Currency`) — only needed if the project uses Money fields
- Exchange rate cache loading (`/erp/40/XchgRate`) — only needed if the project uses currency conversion
- Any endpoint with `/erp/` prefix — must be changed to the project's prefix or removed
