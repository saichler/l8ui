# Report Infrastructure Bugs Instead of Working Around Them

## Rule
When an expected scenario does not work properly due to a bug in the underlying infrastructure (framework, SDK, shared libraries), do NOT alter the code to work around the bug. Instead, highlight the bug to the user and let them fix it.

## What This Means
- If a function call should work based on its documented/expected behavior but doesn't, report it — don't remove the call or add workarounds.
- If a framework API returns unexpected results (e.g., empty results when it should return data), flag it — don't restructure the code to avoid the API.
- If a shared component has a bug that causes downstream failures, identify the root cause — don't patch over it in the consuming code.

## What to Report
1. **What fails**: The exact error or unexpected behavior
2. **Where the bug is**: Which infrastructure function/API is misbehaving
3. **Expected behavior**: What the function should do based on its contract
4. **Actual behavior**: What it actually does
5. **Impact**: What features are blocked until the bug is fixed

## Why This Matters
Working around infrastructure bugs:
- Adds unnecessary complexity to consuming code
- Masks the real problem, making it harder to find and fix later
- May introduce subtle behavioral differences from the intended design
- Wastes time on workarounds that become dead code once the bug is fixed

## No Silent Fallbacks in UI Code (CRITICAL)

UI code at ANY level (shared components, framework libraries, module code) MUST NOT use silent fallback logic that masks missing or incorrect data. If a required value is missing, the code must fail visibly (console.warn/error, thrown exception), NOT silently return a default that hides the problem.

### The Anti-Pattern
```javascript
// WRONG — silent fallback hides the real bug
_defaultGetItemId(item) {
    const refConfig = getReferenceConfig(this.config.modelName);
    if (refConfig && refConfig.idColumn) {
        return item[refConfig.idColumn];
    }
    return item.id || item.Id || '';  // ← silently returns '' for every item
}
```
This returned `''` for every target (primary key: `targetId`), making every row click show the same record. No error, no warning — completely silent. The bug took multiple investigation rounds to find because nothing failed visibly.

### The Correct Pattern
```javascript
// CORRECT — fail visibly when configuration is missing
_defaultGetItemId(item) {
    const refConfig = getReferenceConfig(this.config.modelName);
    if (refConfig && refConfig.idColumn) {
        return item[refConfig.idColumn];
    }
    console.error(`Layer8MEditTable: Cannot resolve item ID for model "${this.config.modelName}". No getItemId provided and no reference config found.`);
    return undefined;
}
```

### Why Silent Fallbacks Are Dangerous
1. **They mask configuration errors**: A missing `getItemId` passthrough in a factory becomes invisible — the table renders, cards appear, clicks "work" — but every click returns the first item
2. **They make debugging exponentially harder**: The symptom ("same data every click") appears far from the cause (factory not forwarding a parameter). With a visible error, the cause is immediate
3. **They compound**: One silent fallback (`''`) feeds into another function (`_findItemById('')`) which silently returns the first match, creating a chain of "working" code that produces wrong results

### Where This Applies
- ID resolution (`getItemId`, `_findItemById`, `getItemId` fallbacks)
- Configuration lookups (reference configs, module configs, nav configs)
- Data transforms (missing transform returning raw data without warning)
- Endpoint resolution (returning empty string instead of erroring)
- Any function that returns a default value when the real value should have been provided by configuration

### Where This Does NOT Apply
- Defensive null checks on optional data (`item.name || '-'` for display purposes is fine)
- User-facing empty states ("No results found" is appropriate UX, not a fallback)
- Optional configuration with documented defaults (`pageSize || 15` is fine — 15 is a valid default, not a mask)
