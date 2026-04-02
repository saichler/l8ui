# Model Names Must Match Protobuf Types (CRITICAL)

## Rule
Everywhere a model name is used — L8Query strings, JS config, forms, columns, reference lookups, navigation — it MUST be the **protobuf type name**, NOT the ServiceName constant. These are often different.

## Why This Matters
The server resolves model names against the protobuf type registry. If the name doesn't match a registered protobuf type, the server returns `Cannot find node for table <wrong-name>`. The ServiceName is an HTTP routing label (max 10 chars); the protobuf type is the actual data model name.

## Common Mismatches

### ServiceName vs Protobuf Type
| ServiceName (HTTP path) | Protobuf Type (use this) |
|------------------------|-----------------------------|
| `Sprint` | `BugsSprint` |
| `Project` | `BugsProject` |
| `Territory` | `SalesTerritory` |
| `DlvryOrder` | `ScmDeliveryOrder` |
| `MfgWorkOrd` | `MfgWorkOrder` |
| `ImprtTmpl` | `L8ImportTemplate` |

### Module Prefix Omission (JS-specific)
Protobuf types often have a module prefix. Never omit it:

| Wrong (JS) | Correct (JS) |
|------------|--------------|
| `ReturnOrder` | `SalesReturnOrder` |
| `CustomerHierarchy` | `SalesCustomerHierarchy` |
| `PurchaseOrder` | `ScmPurchaseOrder` |
| `Warehouse` | `ScmWarehouse` |

## Where Model Names Are Used

### In L8Query Strings
```javascript
// CORRECT — protobuf type name
const query = 'select * from SalesTerritory';

// WRONG — ServiceName
const query = 'select * from Territory';  // 400 Bad Request
```

### In JavaScript UI Files
1. **Config files** (`*-config.js`): `{ model: 'SalesReturnOrder' }`
2. **Form definitions** (`*-forms.js`): `Module.forms = { SalesReturnOrder: { ... } }`
3. **Column definitions** (`*-columns.js`): `Module.columns = { SalesReturnOrder: [...] }`
4. **Primary key mappings**: `Module.primaryKeys = { SalesReturnOrder: 'returnOrderId' }`
5. **Reference lookups**: `{ lookupModel: 'ScmWarehouse' }`
6. **Navigation configs**: `{ model: 'SalesReturnOrder' }`

## Finding the Correct Names
ServiceName is in `*Service.go` files. Protobuf type is in `*.pb.go` files.

```bash
# Find protobuf types for a module
grep "type Sales" go/types/sales/*.pb.go | grep "struct {"

# List all type names
grep -oP "type \K\w+" go/types/sales/*.pb.go | grep -v "^is" | sort -u

# Confirm a specific type exists
grep "type.*struct {" go/types/<module>/*.pb.go | grep -i <keyword>
```

## Error Symptoms
- HTTP 400 Bad Request on a GET with `?body=` query parameter
- Server log: `Cannot find node for table <wrong-name>`
- `(Error) - Cannot find node for table ReturnOrder` (should be `SalesReturnOrder`)

## Files to Check When Adding a Module
- `*-config.js` — `model` property
- `*-forms.js` — form definition keys and `lookupModel` references
- `*-columns.js` — column definition keys
- `*-renderers.js` — model references
- `layer8m-nav-config.js` — mobile navigation
- `reference-registry*.js` — registry keys
