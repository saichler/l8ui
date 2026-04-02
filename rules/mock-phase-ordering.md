# Mock Phase Ordering: Cross-Module Dependencies

## Rule
When adding server-side validation (e.g., `ValidateRequired`) for a foreign key field, you MUST verify that the mock data phase ordering ensures the referenced entity's IDs are populated BEFORE any generator that uses them.

## Why This Matters
Mock generators use `pickRef(store.XxxIDs, index)` to reference entities from other modules. If `store.XxxIDs` is empty (because the referenced module hasn't run yet), `pickRef` returns `""`, and any `ValidateRequired` check on that field will fail with "XxxId is required".

## The `pickRef` Trap
```go
func pickRef(ids []string, index int) string {
    if len(ids) == 0 {
        return ""  // ← Silent empty string, not an error!
    }
    return ids[index%len(ids)]
}
```

`pickRef` does NOT panic or warn when the slice is empty. It silently returns an empty string, which passes Go compilation but fails server validation at runtime.

## Current Module Phase Order (in `main_phases.go`)

FIN and HCM have a circular dependency, resolved by splitting FIN:
```
1. FIN Foundation (Phases 1-3) — CurrencyIDs, FiscalYearIDs, Accounts, Vendors, Customers
2. HCM (all phases)            — EmployeeIDs, DepartmentIDs (needs CurrencyIDs)
3. FIN Remaining (Phases 4-9)  — Budgets, AP, AR, GL, Assets, Tax (needs DepartmentIDs, EmployeeIDs)
4. SCM
5. Sales
6. MFG
7. CRM
8. PRJ
9. BI
10. DOC
11. ECOM
12. COMP
```

## Why FIN is Split
- FIN Phases 1-3: No HCM dependency. Provides CurrencyIDs needed by ALL modules.
- FIN Phase 4 (`gen_fin_config.go`): Uses `store.DepartmentIDs` for Budgets.
- FIN Phase 8 (`gen_fin_assets.go`): Uses `store.EmployeeIDs` and `store.DepartmentIDs`.
- HCM: Uses `store.CurrencyIDs` in gen_compensation.go, gen_payroll.go, gen_benefits.go, gen_employee_data.go.

**When splitting modules like this, use `runXxxFoundation()` and `runXxxRemaining()` in `main_phases_modules*.go`.**

## Checklist When Adding Required Validation

Before adding `common.ValidateRequired(entity.SomeId, "SomeId")` to a service callback:

1. **Identify which module generates the referenced IDs** (e.g., CurrencyIDs come from FIN)
2. **Check `main_phases.go`** to confirm that module runs BEFORE the module being validated
3. **Check mock generators** for the validated entity — verify they set the field using `pickRef(store.XxxIDs, ...)`
4. **If the referenced module runs AFTER**, either:
   - Reorder modules in `main_phases.go` (preferred if no circular dependency)
   - Move the referenced entity generation to an earlier cross-module bootstrap phase

## Common Cross-Module Dependencies
| Field | Source Module | Source Phase | Used By |
|-------|-------------|-------------|---------|
| CurrencyIDs | FIN | Phase 1 | ALL modules (via Money fields) |
| EmployeeIDs | HCM | Phase 1-3 | FIN 8, CRM, PRJ, MFG, Sales |
| DepartmentIDs | HCM | Phase 1 | FIN 4+8, PRJ, MFG |
| VendorIDs | FIN | Phase 2 | SCM, MFG |
| CustomerIDs | FIN | Phase 2 | Sales, ECOM, CRM |
| ItemIDs | SCM | Phase 1 | Sales, MFG, ECOM |

## Direct Index Access Trap
Some generators use `store.XxxIDs[i]` or `store.XxxIDs[0]` (direct index, not `pickRef`). These will **panic** with "index out of range" if the slice is empty, rather than silently returning "". Both patterns are dangerous but panics are at least immediately visible.
