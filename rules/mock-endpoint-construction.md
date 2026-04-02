# Mock Endpoint Construction

## Endpoint Format
Mock endpoints must follow this exact format:
```
/erp/{ServiceArea}/{ServiceName}
```

## Finding the Correct ServiceName
The `ServiceName` constant is defined in each service's `*Service.go` file. Before writing a mock endpoint:

1. Locate the service file: `go/erp/{module}/{servicedir}/*Service.go`
2. Find the `ServiceName` constant (typically around line 30)
3. Use that exact value in the endpoint

## Example
For Sales Territory service:
```go
// In go/erp/sales/salesterritories/SalesTerritoryService.go
const (
    ServiceName = "Territory"  // <-- Use this value
    ServiceArea = byte(60)
)
```

Mock endpoint should be:
```go
client.post("/erp/60/Territory", &sales.SalesTerritoryList{...})
```

**NOT** `/erp/60/SalesTerritory` (incorrect - doesn't match ServiceName)

## ServiceName Constraint
ServiceName must be 10 characters or less (per maintainability.md). This is why names are abbreviated:
- `Territory` not `SalesTerritory`
- `DlvryOrder` not `DeliveryOrder`
- `CustSegmt` not `CustomerSegment`

## Verification Checklist
Before creating mock phase files:
1. Run: `grep "ServiceName = " go/erp/{module}/**/*Service.go` to list all service names
2. Cross-reference each mock endpoint against the grep output
3. Ensure exact match between endpoint path segment and ServiceName constant

## Common Mistakes to Avoid
- Using the type name (e.g., `SalesTerritory`) instead of ServiceName (`Territory`)
- Guessing abbreviated names instead of checking the actual constant
- Forgetting that ServiceName has a 10-character limit
