# Prime Object Rules (CRITICAL)

## Rule 1: What IS a Prime Object

A **Prime Object** is an entity that can exist independently — it has its own identity, its own lifecycle, and is meaningful on its own without a parent. Prime Objects get their own service (service directory under `go/erp/<module>/`).

### Prime Object Test (ALL must be true)
Before creating a new service for a type, it MUST pass ALL of these:

1. **Independence**: Can this entity exist on its own without a parent? If deleting the parent makes this entity meaningless, it is NOT a Prime Object.
2. **Own lifecycle**: Does this entity have a lifecycle independent of any parent? If it is always created, updated, and deleted as part of a parent, it is NOT a Prime Object.
3. **Direct query need**: Do users need to query this entity across all parents? (e.g., "show all employees" makes sense; "show all order lines across all orders" does NOT — you always view lines within an order.)
4. **No parent ID dependency**: Does this entity's primary identity stand alone? If the entity's meaning requires knowing which parent it belongs to (e.g., "line 3 of order SO-001"), it is NOT a Prime Object.

### What is NOT a Prime Object (embedded child types)

These are types that belong to a parent and should be defined as `repeated` fields inside the parent's protobuf message — NOT as separate services:

- **Line items**: OrderLine, InvoiceLine, BomLine, QuotationLine
- **Entries/details**: TimesheetEntry, ExpenseEntry, LaborEntry, ChangeDetail
- **Components/operations**: RoutingOperation, WorkOrderOp, WorkflowStep
- **Assignments/members**: TerritoryAssign, CampaignMember, TeamMember
- **Child records**: CaseComment, LeadActivity, DeliveryConfirm, BackOrder
- **Configuration children**: PriceListEntry, QuantityBreak, KpiThreshold
- **Status/history records**: OrderStatusHistory, Checkpoint, AuditTrail

**Key indicator**: If the entity has a `parent_id` field (typically field 2) that is always required and always references a single parent type, it is a child — not a Prime Object.

### Correct pattern for child types

```protobuf
// CORRECT: Child types are embedded in the parent
message SalesOrder {
    string sales_order_id = 1;
    string order_number = 2;
    // ... parent fields ...
    repeated SalesOrderLine lines = 20;          // Embedded child
    repeated SalesOrderAllocation allocations = 21;  // Embedded child
    erp.AuditInfo audit_info = 30;
}

// Child type — has its own ID but NO service, NO List type
message SalesOrderLine {
    string line_id = 1;        // Own ID for addressing within parent
    string item_id = 2;        // Reference to another Prime Object (ScmItem)
    int32 quantity = 3;
    erp.Money unit_price = 4;
}

// WRONG: Child type as separate service
// go/erp/sales/salesorderlines/SalesOrderLineService.go  ← SHOULD NOT EXIST
```

### Examples

| Entity | Prime Object? | Why |
|--------|:---:|-----|
| Employee | Yes | Independent identity, own lifecycle, queried directly |
| SalesOrder | Yes | Independent document, own status lifecycle |
| Department | Yes | Organizational unit, exists independently |
| SalesOrderLine | **No** | Meaningless without its order, always viewed within order context |
| JournalEntryLine | **No** | Debit/credit line within a journal entry |
| MfgBomLine | **No** | Component within a BOM, not independent |
| CrmCaseComment | **No** | Comment on a case, meaningless alone |
| BenefitPlan | Yes | Plan definition exists independently |
| CoverageOption | **No** | Option within a benefit plan |

### Existing correct example: HCM BenefitPlan

```protobuf
message BenefitPlan {
    string plan_id = 1;
    // ... plan fields ...
    repeated CoverageOption coverage_options = 14;  // Embedded child (no service)
    repeated PlanCost costs = 15;                    // Embedded child (no service)
    EligibilityRules eligibility = 16;              // Embedded child (no service)
}
```

`CoverageOption`, `PlanCost`, and `EligibilityRules` do NOT have service directories. They are managed entirely through the `BenefitPlan` service. This is the correct pattern.

---

## Rule 2: Cross-References Between Prime Objects

Prime Objects MUST NEVER contain direct struct references (`*OtherPrimeType` or `[]*OtherPrimeType`) to other Prime Objects. Prime Objects refer to each other **ONLY via ID fields** (string).

### Why This Is Critical
When the introspector inspects a type, it recursively inspects all nested struct fields. If Prime Object A contains `[]*PrimeObjectB`, inspecting A creates a node for B in the introspector's `typeToNode` map WITHOUT B's primary key decorator. When B's service later activates and adds its decorator, it goes to a different node in `pathToNode`. This causes "Decorator Not Found" errors at runtime because `ElementToQuery` uses `NodeByTypeName` (reads `typeToNode`) and finds the old undecorated node.

This is NOT just a test issue — it breaks the ORM query path for any Get-by-filter operation on the referenced type.

### Correct Pattern
```protobuf
// WRONG - Direct reference to another Prime Object
message BenefitEnrollment {
    repeated Dependent covered_dependents = 15;  // BAD: Dependent is a Prime Object
}

// CORRECT - Reference via ID only
message BenefitEnrollment {
    repeated string covered_dependent_ids = 15;  // GOOD: Reference by ID
}
```

### What Is Allowed
- Prime Objects MAY contain fields of **shared/common types** (e.g., `erp.Money`, `erp.Address`, `erp.AuditInfo`, `erp.ContactInfo`, `erp.DateRange`)
- Prime Objects MAY contain `repeated` fields of **embedded child types** (types without their own service, e.g., `SalesOrderLine`, `CoverageOption`, `PlanCost`)
- Prime Objects MAY reference other Prime Objects via **string ID fields** (e.g., `employee_id`, `department_id`)

---

## Rule 3: UI Implications of Prime vs Child

The Prime Object classification directly determines how an entity appears in the UI. Getting this wrong creates standalone UI entries (config, columns, forms, nav) for entities that should only appear inline within their parent's form.

### Prime Object UI Stack (standalone)
A Prime Object gets ALL of the following:
- **Config entry** in `*-config.js` (service key, model, endpoint)
- **Column definitions** in `*-columns.js` (table columns for list view)
- **Form definition** in `*-forms.js` (standalone create/edit form)
- **Nav entry** in desktop section HTML and mobile `layer8m-nav-config.js`
- **Type registration** in `go/erp/ui/main.go`
- **Reference registry entry** (if other forms reference it via `lookupModel`)
- **Mock data generator** with its own ID slice in `store.go`

### Child Type UI (inline within parent)
A child type gets NONE of the above. Instead:
- **No config entry** — not a standalone service
- **No column definitions** — not shown in its own table
- **No standalone form** — not independently created/edited
- **No nav entry** — not navigable on its own
- **No type registration** — not a registered Prime Object
- **Inline table in parent form** — child rows displayed via `f.inlineTable()` within the parent's form definition
- **Mock data inline** — generated as part of the parent's `repeated` field, not as a separate generator

### Correct UI Pattern for Child Types

```javascript
// Parent form embeds child rows via inlineTable
SalesOrder: f.form('Sales Order', [
    f.section('Order Details', [
        ...f.text('orderNumber', 'Order #', true),
        ...f.reference('customerId', 'Customer', 'Customer', true),
    ]),
    f.section('Order Lines', [
        ...f.inlineTable('lines', 'Order Lines', [
            { key: 'lineId', label: 'Line ID', hidden: true },
            { key: 'itemId', label: 'Item', type: 'reference', lookupModel: 'ScmItem' },
            { key: 'quantity', label: 'Qty', type: 'number' },
            { key: 'unitPrice', label: 'Unit Price', type: 'money' },
        ]),
    ]),
])
```

### Wrong UI Pattern (child as standalone)

```javascript
// WRONG: Child type has its own config entry
{ key: 'salesorderlines', label: 'Order Lines', model: 'SalesOrderLine' }

// WRONG: Child type has its own form
SalesOrderLine: f.form('Order Line', [
    f.section('Line Details', [
        ...f.reference('salesOrderId', 'Sales Order', 'SalesOrder', true),  // parent ref
        ...f.reference('itemId', 'Item', 'ScmItem', true),
        ...f.number('quantity', 'Quantity', true),
    ]),
])
```

### Why This Matters
When a child is wrongly given standalone UI, users see it as an independent navigable entity — they can create "orphan" lines without an order, browse lines across all orders (which is never useful), and the parent form shows no children. The correct UX is always: navigate to the parent, see its children inline, edit children within the parent context.

---

## Verification

### Before creating a new service
1. Apply the Prime Object Test (Rule 1) — does the entity pass ALL four criteria?
2. If it has a parent_id field that is always required, it is a child — embed it in the parent instead
3. If unsure, default to embedded child. It is easy to promote a child to a Prime Object later; it is painful to demote a Prime Object to a child (requires deleting services, updating UI, etc.)

### Before creating or modifying a protobuf message
1. Check if any `*Type` or `repeated Type` fields reference a Prime Object
2. If yes, replace with the corresponding ID field(s)
3. After fixing proto, regenerate bindings, update mock generators, forms, and columns

```bash
# Find all Prime Object type names
for dir in $(find go/erp/ -mindepth 3 -maxdepth 3 -name '*Service.go'); do
    grep -oP 'type \K\w+(?= struct)' "$(dirname "$dir")/../../../types/$(basename "$(dirname "$(dirname "$dir")")")/"*.pb.go 2>/dev/null
done

# Check for direct references between Prime Objects in proto types
grep -rn '\[\]\*\|^\s*\*' go/types/**/*.pb.go | grep 'protobuf:' | grep -v 'List     \[' | grep -v 'erp\.\|l8api\.\|l8web\.'
```

## Historical Context
- **Rule 2** was discovered when `BenefitEnrollment.CoveredDependents []*Dependent` caused "Decorator Not Found in Dependent" errors.
- **Rule 1** was established after an audit found ~134 child entities (order lines, BOM lines, invoice lines, case comments, fiscal periods, bins, etc.) incorrectly implemented as separate Prime Objects with their own services across 10 modules. These should have been embedded `repeated` fields in their parent types from the start.
- **Rule 3** was added because those ~134 child entities each had a full standalone UI stack (config, columns, forms, nav entries) that should not have existed — children should only appear as inline tables within their parent's form.
