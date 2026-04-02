# Nested Protobuf Types in Form Definitions

## Rule
Before using any form factory method (`f.text()`, `f.number()`, etc.) for a field, you MUST check its protobuf type. If the protobuf type is a nested object (pointer to another struct like `*erp.Something`), a repeated field (`[]string`, `[]*Type`), or a map (`map[string]string`), you CANNOT use scalar form methods like `f.text()`, `f.number()`, or `f.textarea()`. These will display `[object Object]` because JavaScript stringifies the nested object.

## How to Check
```bash
# Look up the actual protobuf type for any field
grep -A 30 "type ModelName struct" go/types/<module>/*.pb.go
```

If a field's Go type starts with `*`, `[]`, or `map[`, it is NOT a simple scalar — it requires special handling.

## What to Do

### If a form factory method already exists for that type → use it
Example: `*erp.Money` → `f.money()`, `*erp.Address` → `f.address()`, `*erp.DateRange` → two `f.date()` calls

### If NO form factory method exists for that type → create one first
1. Add a factory method to `layer8-form-factory.js` that produces the correct `type:` value
2. Add a `case` handler in `layer8d-forms-fields.js` `generateFieldHtml()` to render it
3. Add a `case` handler in `layer8d-forms-data.js` `collectFormData()` to collect it
4. Then use the new factory method in form definitions

### Never work around it by using f.text() or f.textarea()
This will appear to work during development but will display `[object Object]` at runtime.

## Current Type Mappings

| Go Type Pattern | Form Factory | Why |
|----------------|-------------|-----|
| `string`, `int32`, `int64`, `float64`, `bool` | `f.text()`, `f.number()`, `f.checkbox()` | Simple scalars — safe |
| `*erp.Money` | `f.money()` | Nested `{amount, currencyCode}` |
| `*erp.Address` | `...f.address('prefix')` | Expands to 6 address fields |
| `*erp.ContactInfo` | `...f.contact('prefix')` | Expands to email + phone |
| `*erp.DateRange` | Two `f.date('parent.startDate/endDate')` | Two timestamps in nested object |
| `*erp.AuditInfo` | `...f.audit()` | Read-only metadata |
| `[]string` | `f.text()` (temporary) | Displays comma-separated; needs future `f.tags()` |
| Any new `*erp.X` | **Create handler first** | Never use scalar fallback |

## Error Symptoms
- `[object Object]` in form field → nested type using scalar form method
- Field empty on edit but table shows data → dot-notation key not resolving
- Save corrupts data → form sends scalar but server expects nested object
