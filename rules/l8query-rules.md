# L8Query Rules (CRITICAL)

Three related rules governing L8Query usage across the system.

---

## Rule 1: Service GET Requests Require L8Query

Every HTTP GET request to a Layer 8 service endpoint MUST include an L8Query passed as a `?body=` query parameter. A bare `fetch('/erp/{area}/{ServiceName}', { method: 'GET' })` with no query parameter will ALWAYS fail.

The server expects ALL GET requests to contain a JSON-encoded L8Query in the `?body=` URL parameter. There is NO "get all" shortcut.

### Correct Pattern
```javascript
const query = 'select * from L8ImportTemplate';  // Use PROTOBUF TYPE NAME, not ServiceName
const body = encodeURIComponent(JSON.stringify({ text: query }));
fetch('/erp/0/ImprtTmpl?body=' + body, {
    method: 'GET',
    headers: getHeaders()
})
```

### Wrong Pattern
```javascript
// WRONG — bare GET with no L8Query
fetch('/erp/0/ImprtTmpl', { method: 'GET', headers: getHeaders() })
```

### Two Requirements in One
1. **`?body=` parameter is mandatory** — the server has no default "return everything" behavior
2. **The `from` clause must use the protobuf type name** — NOT the ServiceName (see `protobuf-model-names.md`)

| Component | Example | Used Where |
|-----------|---------|------------|
| ServiceName | `ImprtTmpl` | URL path: `/erp/0/ImprtTmpl?body=...` |
| Protobuf type | `L8ImportTemplate` | L8Query: `select * from L8ImportTemplate` |

### When This Does NOT Apply
- `Layer8DTable` and `Layer8DDataSource` handle L8Query construction automatically
- POST, PUT, DELETE requests use JSON body in the request payload, not `?body=`

### Error Symptoms
- `Cannot find pb for method GET` followed by `L8Query-proto: syntax error (line 1:1): unexpected token`
- 400 Bad Request on GET, but POST/PUT/DELETE work fine

---

## Rule 2: Use SELECT * for Detail Popups

When a detail popup/modal is opened for any entity and an L8Query is constructed to fetch that entity's data, the query MUST use `select * from ...`. Never use `select attr1, attr2, ... from ...` with a specific column list.

### Why This Matters
Detail forms display ALL fields. If the query selects only specific columns, the remaining fields show as empty — no error, no warning, just blank inputs.

### When SELECT specific columns IS acceptable
- Table/list views where only visible columns are needed
- Reference lookups that only need ID + display name
- Autocomplete/search dropdowns
- Aggregation queries

---

## Rule 3: GetEntities with Empty Filter Must Use L8Query

When calling `common.GetEntities` with an empty filter (all zero-value fields), the filter-based lookup will return no results. To fetch all entities of a type, you MUST use an L8Query instead.

```go
// WRONG — empty filter returns nothing
years, err := common.GetEntities("FiscalYr", 40, &fin.FiscalYear{}, vnic)

// CORRECT — L8Query fetches all entities
// Use "select * from FiscalYear" (protobuf type name, NOT ServiceName)
```

---

## Verification
```bash
# Find all bare GETs (missing ?body=) to service endpoints
grep -n "fetch('/erp/" *.js | grep "GET" | grep -v "?body="
```
Any matches are bugs — every GET must have `?body=` with an L8Query.
