# JavaScript Protobuf Field Name Verification (CRITICAL)

## Rule
Every field name used in JavaScript (columns, forms, reference registries, renderers) MUST be verified against the protobuf JSON field name before use. Never guess, assume, or invent field names.

## Historical Context
During refactoring, field names written from memory introduced ~450 silent mismatches across 9 modules, causing empty table cells throughout the UI. The cost of checking is seconds; the cost of not checking is hundreds of broken columns.

## MANDATORY: Protobuf-First Workflow

1. **BEFORE writing any field name**, read the protobuf struct:
   ```bash
   grep -A 40 "type ModelName struct" go/types/<module>/*.pb.go
   ```

2. **Extract the JSON field name from the `protobuf:` struct tag.** Each field in the `.pb.go` file has TWO `json:` appearances — always use the one inside the `protobuf:` tag, identified by the `,proto3"` suffix:
   ```go
   ProjectedInflows float64 `protobuf:"fixed64,7,opt,name=projected_inflows,json=projectedInflows,proto3" json:"projectedInflows,omitempty"`
   ```
   - **CORRECT source**: `json=projectedInflows,proto3"` → extract `projectedInflows` (between `json=` and `,proto3"`)
   - **IGNORE**: the standalone `json:"projectedInflows,omitempty"` tag — while it usually matches, the `protobuf:` tag is the authoritative source

3. **ONLY use field names that exist in the protobuf struct.** Never invent fields.

4. **After writing**, verify every field name in the file against the protobuf struct.

## Field Name Format
Protobuf `snake_case` converts to `camelCase` in JSON:

| Protobuf Field | JSON Name | Common Mistake |
|----------------|-----------|----------------|
| `warehouse_id` | `warehouseId` | `warehouseID` |
| `code` | `code` | `warehouseCode` |
| `is_active` | `isActive` | `active` |
| `audit_info` | `auditInfo` | `audit` |

## Common Mismatch Categories
| Category | Example Wrong | Example Correct |
|---|---|---|
| Singular vs Plural | `projectedInflow` | `projectedInflows` |
| Abbreviated | `allocatedQty` | `allocatedQuantity` |
| Missing prefix | `reason` | `reasonCode` |
| Fabricated field | `salePrice` | `disposalProceeds` |
| Timestamp convention | `signedAt` | `signedDate` |
| Wrong prefix | `fromDepartment` | `fromDepartmentId` |
| Semantic guess | `oldValue` | `previousValue` |

## CRITICAL: "Number" Field Pitfall

**DO NOT assume all "number" fields are named the same way across models.**

| Model | Correct Field | Common Mistake |
|-------|---------------|----------------|
| `MfgWorkOrder` | `workOrderNumber` | `orderNumber` |
| `MfgProductionOrder` | `orderNumber` | (correct) |
| `SalesOrder` | `orderNumber` | (correct) |
| `MfgBom` | `bomNumber` | `bomId` |
| `MfgRouting` | `routingNumber` | `routingId` |

**Always verify**: `grep -A15 "type MfgWorkOrder struct" go/types/mfg/*.pb.go | grep -E "Number|number"`

## CRITICAL: Nav Config `idField` Must Use JSON Name (5x REGRESSION)

The `idField` property in mobile nav configs (`*-nav-config-*.js`) is used to build `getItemId: (item) => item[idField]`. If the casing is wrong, `getItemId` returns `undefined`, cards get `data-id=""`, `_findItemById("")` matches nothing, and `onRowClick` is **never called**. No error, no popup, complete silence.

The Go struct field is `Id` (exported), but the JSON serialization tag is `id` (lowercase). Always use the **JSON name**.

```javascript
// WRONG — Go field name (capital I)
{ model: 'NetworkDevice', idField: 'Id' }

// CORRECT — JSON tag name (lowercase)
{ model: 'NetworkDevice', idField: 'id' }
```

**This bug wasted 5 fix attempts** because the failure is completely silent — no console error, no visible symptom other than "clicking does nothing." Debug required adding `console.log` to the table click handler to discover `getItemId` returned `undefined`.

### Verification after writing any nav config
```bash
# Extract all idField values
grep -oP "idField: '[^']+'" *-nav-config-*.js | sort -u
# Cross-reference each against the protobuf JSON tag
grep 'json:"' go/types/<module>/*.pb.go | grep -i '<fieldName>'
```

## Applies To
- Desktop column files: `go/erp/ui/web/*/**/*-columns.js`
- Desktop form files: `go/erp/ui/web/*/**/*-forms.js`
- Mobile column files: `go/erp/ui/web/m/js/**/*-columns.js`
- Mobile form files: `go/erp/ui/web/m/js/**/*-forms.js`
- Reference registries: `reference-registry-*.js`, `layer8m-reference-registry.js`
- **Nav config `idField`**: `*-nav-config-*.js` — uses JSON field name for item ID lookup
- Any `render: (item) => fn(item.fieldName)` usage

## Error Symptoms
- Table rows appear but specific columns are empty (no data, no error) — completely silent
- Server log: `cannot find property for col <model>.<field>:Unknown attribute <model>.<field>`
- **Clicking a table row/card does nothing** — no popup, no error (idField mismatch)

## Quick Field Name Lookup
```bash
grep -A 30 "type TypeName struct" go/types/<module>/*.pb.go | grep 'json:"'
```
