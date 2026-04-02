# Cascading Hide Must Distinguish "All Hidden" from "None by Design" (CRITICAL)

## Rule
Any UI logic that hides a parent element when all its children are hidden MUST distinguish between:
1. **Children exist but all are hidden** (by filtering/permissions) → hide the parent
2. **No children by design** (custom UI module, standalone panel) → do NOT hide the parent

A parent with zero children is NOT the same as a parent whose children were all filtered out.

## Why This Matters
The System section has 5 module tabs. Only "security" has sub-nav service items. The other 4 (health, modules, logs, dataimport) are custom UI panels with no sub-nav items. A cascading hide that checks `visibleChildren.length === 0` hides all 4 tabs because they have zero children — not because access was denied.

## The Bug Pattern
```javascript
// WRONG — treats "no children" the same as "all children hidden"
var visibleItems = container.querySelectorAll('.child-item:not([style*="display: none"])');
if (visibleItems.length === 0) {
    parentTab.style.display = 'none';  // hides tabs that never had children
}
```

## The Correct Pattern
```javascript
// CORRECT — only hide if children EXIST but all are hidden
var allItems = container.querySelectorAll('.child-item');
if (allItems.length > 0) {
    var visibleItems = container.querySelectorAll('.child-item:not([style*="display: none"])');
    if (visibleItems.length === 0) {
        parentTab.style.display = 'none';
    }
}
// If allItems.length === 0, the module has no sub-nav by design — leave it visible
```

## Where This Applies
- Permission filter cascading tab hide (`layer8d-permission-filter.js` `applyToSection`)
- Module filter cascading hide (if it has similar logic)
- Any future filter that hides parents based on visible child count
- Mobile navigation filtering with similar cascading logic

## Verification
After implementing any cascading hide logic, test with:
1. A module that HAS sub-nav items (e.g., HCM security) — verify filtering works
2. A module that has NO sub-nav items by design (e.g., System health, logs) — verify it stays visible
3. An admin user with full permissions — verify ALL tabs/sections are visible
