# Data Completeness Pipeline (CRITICAL)

## Rule
Every protobuf field must flow through the full pipeline: **Proto fields → Forms/Columns → Mock data**. A gap at any stage produces silent empty cells with no errors.

---

## Stage 1: Proto → Forms and Columns

Every non-system field in a protobuf struct MUST appear in both the form (`*-forms.js`) and column (`*-columns.js`) definitions.

### System Fields (excluded by default)
- Primary key ID — auto-generated on POST
- `auditInfo` — rendered via `...f.audit()` or omitted
- `customFields` — generic map

### Dependent Field Groups
If any field in a group is included, ALL must be included:
| Selector | Dependent Fields |
|----------|-----------------|
| `period` (enum) | `month`, `quarter`, `year` |
| `addressType` | address fields |
| `paymentMethod` | method-specific fields |
| `status` (with reason) | `reason`, `reasonCode` |

### If intentionally excluded, add a comment:
```javascript
// Omitted: internalScore — system-calculated, not user-editable
```

---

## Stage 2: Columns → Mock Data

Every field with a UI column definition MUST be populated by the mock data generator with a **non-zero value**. Protobuf `omitempty` omits zero values from JSON, making columns appear empty.

### Special cases:
- **Enum fields**: Must use non-zero values (0 = UNSPECIFIED, omitted by `omitempty`)
- **Conditional fields**: Populate on records in the appropriate state (e.g., `resolvedDate` only on resolved records)
- **AI/computed fields**: Use realistic simulated values; a subset can be zero to simulate "pending"

---

## Stage 3: All Services → Mock Generators

ALL services in a module MUST have corresponding mock data generators. No service should be left without mock data.

### Commonly missed entities:
- Line items (`SalesOrderLine`, `SalesReturnOrderLine`)
- Secondary entities (Allocations, BackOrders, Confirmations)
- Break tables (`QuantityBreak`, `PriceBreak`)
- Junction tables (`TerritoryAssign`, `EmployeeSkill`)

### Generator file organization:
```
gen_<module>_foundation.go    - Base/master data
gen_<module>_<area1>.go       - First functional area
gen_<module>_<area2>.go       - Second functional area
```

### Phase organization:
```
Phase 1: Foundation (no dependencies)
Phase 2: Core entities (depend on foundation)
Phase 3: Configuration (depend on core)
Phase 4: Transactions (depend on configuration)
Phase 5: Line items (depend on transactions)
```

---

## Verification Commands

```bash
# Stage 1: Compare protobuf fields vs form fields
grep -A 40 "type ModelName struct" go/types/<module>/*.pb.go | grep -oP 'json:"\K[^,"]+' | sort
grep -oP "key:\s*'[^']+'" <forms-file> | sort

# Stage 2: Check mock generator populates each column field
grep -oP "col\.\w+\('[^']+'" <columns-file> | grep -oP "'[^']+'" | tr -d "'"
grep "<FieldName>:" go/tests/mocks/gen_*.go

# Stage 3: Count services vs generators
ls -d go/erp/<module>/*/ | wc -l
grep -c "func generate<Module>" go/tests/mocks/gen_<module>*.go
```

## Checklist Before PR
- [ ] Every protobuf field appears in forms and columns (or has a comment explaining omission)
- [ ] Every column field is populated in mock generators with non-zero values
- [ ] All services have mock generators
- [ ] store.go has ID slices for all entities
- [ ] All generators are called in phase files
- [ ] `go build ./tests/mocks/` and `go vet ./tests/mocks/` pass

## Error Symptom (Same for All Stages)
Table columns appear but show no data (empty cells). No console errors, no server errors. The field exists in the protobuf, the column key is correct — data is just missing from the pipeline.
