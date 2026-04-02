# Single Display Formatter for Field Types (CRITICAL)

## Rule
Every field type MUST have its read-only display logic in ONE place: `formatFieldDisplayValue()` in `layer8d-forms-fields.js`. Do NOT add read-only display logic inline in the `isReadOnly` block, in `formatInlineTableCell`, or in any other rendering path. All read-only rendering delegates to `formatFieldDisplayValue`.

## When Adding a New Field Type
1. Add the editable rendering case to the `switch` block in `generateFieldHtml`
2. Add the display formatting case to `formatFieldDisplayValue` in the same file
3. Done. No other places need updating — `isReadOnly` and `formatInlineTableCell` both delegate to `formatFieldDisplayValue`.

## Why This Matters
Before this rule, adding a new field type required updating 3 separate code paths:
1. The editable `switch` block (new input rendering)
2. The `isReadOnly` if/else chain (new display formatting)
3. `formatInlineTableCell` in `layer8d-forms-fields-ext.js` (inline table display)

Paths 2 and 3 were routinely missed, causing fields to display raw values (`[object Object]`, raw timestamps, unformatted numbers) in view/detail mode. This bug recurred 4 times across multiple fix rounds because the duplication was invisible — the editable switch worked fine, only the read-only path was broken.

## Anti-Pattern
```javascript
// WRONG — adding display logic directly in isReadOnly block
if (isReadOnly) {
    if (field.type === 'newType') {
        displayValue = formatNewType(value);  // ← duplication!
    }
}
```

## Correct Pattern
```javascript
// CORRECT — add to formatFieldDisplayValue only
function formatFieldDisplayValue(field, value) {
    switch (field.type) {
        case 'newType':
            return formatNewType(value);
        // ... all other types ...
    }
}

// isReadOnly block just calls formatFieldDisplayValue — never has type-specific logic
if (isReadOnly) {
    const displayValue = formatFieldDisplayValue(field, value);
    return `<span class="form-display-value">${escapeHtml(displayValue)}</span>`;
}
```
