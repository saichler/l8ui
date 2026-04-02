# Compound Form Field Data Collection

## Rule
When a form field type renders **multiple sub-elements** with modified names (e.g., `fieldKey.__amount`, `fieldKey.__currencyId`), the data collection code MUST NOT rely on `form.elements[field.key]` to find the element — it won't exist.

## Why This Matters
The standard data collection pattern is:
```javascript
const element = form.elements[field.key];
if (!element) return;  // ← Skips the ENTIRE field silently!
```

For compound fields (like `type: 'money'`), no single element has `name="fieldKey"`. The sub-elements have names like `fieldKey.__amount` and `fieldKey.__currencyId`. The guard silently skips data collection, the server receives no value, and required validation fails with a cryptic error.

## The Trap
This bug is **silent** — no console error, no visible failure during form rendering. The form looks correct, the user fills in values, but on save the server rejects with "Field is required" because the data was never collected.

## Checklist for Compound Field Types
When adding a new compound field type (a field that renders multiple sub-inputs):

1. **Rendering**: Sub-elements use `name="${field.key}.__subField"` convention
2. **Data collection guard**: Add the field type to the guard exception:
   ```javascript
   if (!element && field.type !== 'money' && field.type !== 'newCompoundType') return;
   ```
3. **Data collection case**: Use `form.elements[field.key + '.__subField']` or `form.querySelector()` to find sub-elements directly
4. **Test manually**: After implementing, verify that saving a form with the compound field actually sends the data to the server

## Current Compound Field Types
- `money` — renders `fieldKey.__currencyId` (`<select>`) + `fieldKey.__amount` (formatted input)

## Desktop vs Mobile
- **Desktop** (`layer8d-forms-data.js`): Uses `form.elements[field.key]` lookup — VULNERABLE to this bug
- **Mobile** (`layer8m-forms.js`): Iterates all `input, select, textarea` elements by name — NOT vulnerable (collects all sub-elements, then post-processes compound keys)
