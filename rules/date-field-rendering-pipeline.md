# Date/DateTime/Time Rendering Must Handle All Value Types (CRITICAL)

## Rule
Every rendering path that displays date, datetime, or time fields MUST:
1. Handle **both** numeric AND string-typed values (protobuf int64 serializes as string in JSON)
2. Have explicit cases for ALL three temporal types: `date`, `datetime`, `time`
3. Never guard date formatting with `typeof value === 'number'` — always coerce first

## Why This Matters
Protobuf serializes int64 fields as strings in JSON to preserve 64-bit precision. A `typeof value === 'number'` guard silently rejects these string-typed timestamps, causing the value to fall through to `String(value)` — which displays raw numbers like `"1704067200"` instead of formatted dates. This bug is completely silent: no errors, no warnings, just wrong output.

## The Three Rendering Paths
Every temporal field type must be handled in ALL of these locations:

### 1. Utility functions (`layer8d-utils.js`)
`formatDate()`, `formatDateTime()`, and any future temporal formatters must coerce string input to number:
```javascript
function formatDate(timestamp, options) {
    if (timestamp === null || timestamp === undefined) return '-';
    if (typeof timestamp === 'string') timestamp = Number(timestamp);
    if (isNaN(timestamp)) return '-';
    // ... rest of formatting
}
```

### 2. Read-only form rendering (`layer8d-forms-fields.js`, isReadOnly block)
Must have explicit cases for `date`, `datetime`, AND `time`:
```javascript
} else if (field.type === 'date') {
    displayValue = formatDate(value);
} else if (field.type === 'datetime') {
    displayValue = formatDateTime(value);
} else if (field.type === 'time') {
    displayValue = String(value);  // already formatted "HH:MM"
}
```

### 3. Inline table cell rendering (`layer8d-forms-fields-ext.js`, formatInlineTableCell)
Same three cases as above.

## Checklist When Adding a New Temporal Field Type
If a new temporal type is added to the form factory (e.g., `f.daterange()`):
- [ ] Add a formatting function to `layer8d-utils.js` that handles both numeric and string input
- [ ] Add a case in the `isReadOnly` block in `layer8d-forms-fields.js`
- [ ] Add a case in `formatInlineTableCell` in `layer8d-forms-fields-ext.js`
- [ ] Add a column factory method if applicable (`col.daterange()`)
- [ ] Add a renderer in `layer8d-renderers.js` if applicable

## Anti-Pattern
```javascript
// WRONG — rejects string-typed timestamps from protobuf JSON
if (field.type === 'date' && typeof value === 'number') {
    displayValue = formatDate(value);
}

// CORRECT — formatDate handles coercion internally
if (field.type === 'date') {
    displayValue = formatDate(value);
}
```

## Error Symptoms
- Date fields show raw numbers like `1704067200` in view/detail forms
- Date fields show `NaN` or invalid dates (string × 1000 = NaN)
- No console errors — the failure is completely silent
- Tables may render dates correctly (column renderers) while the same field in a form popup shows a number (different rendering path)
