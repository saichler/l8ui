# Test Data Field Verification (CRITICAL)

## Rule
When constructing test data as `map[string]interface{}` for HTTP POST/PUT requests, every key in the map MUST exist as a field on the target protobuf struct. Never guess or assume field names — always verify against the `.pb.go` file first.

## Why This Matters
The server deserializes JSON request bodies against registered protobuf types. If the JSON contains a field that doesn't exist on the protobuf struct, the parser rejects the entire payload with `unknown field "xxx"`. This causes a `400 Bad Request` with the cryptic error `Cannot find pb for method POST` because the server tries all registered body types and none match.

## The Bug Pattern
```go
// WRONG — "message" does not exist on the Alarm struct
alarm := map[string]interface{}{
    "alarmId":  alarmId,
    "nodeId":   "test-node",
    "state":    1,
    "severity": 1,
    "message":  "Test Alarm",  // ← Alarm has no "message" field; Event does
}
client.Post("/alm/10/Alarm", alarm)
// Result: 400 Bad Request — Cannot find pb for method POST
```

```go
// CORRECT — all fields verified against Alarm struct in .pb.go
alarm := map[string]interface{}{
    "alarmId":      alarmId,
    "definitionId": defId,
    "nodeId":       "test-node",
    "state":        1,
    "severity":     1,
    "name":         "Test Alarm",  // ← "name" exists on Alarm struct
}
```

## Verification Before Writing Test Data
Before constructing any `map[string]interface{}` for an HTTP request:

```bash
# List all fields and their JSON names for the target type
grep -A 40 "type <TypeName> struct" go/types/<module>/*.pb.go
```

Each field in the `.pb.go` file has TWO `json:` appearances. Always use the one inside the `protobuf:` tag, identified by the `,proto3"` suffix:
```go
AlarmId string `protobuf:"bytes,1,opt,name=alarm_id,json=alarmId,proto3" json:"alarmId,omitempty"`
```
- **CORRECT source**: `json=alarmId,proto3"` → extract `alarmId` (between `json=` and `,proto3"`)
- **IGNORE**: the standalone `json:"alarmId,omitempty"` tag

Cross-check every key in your map against the extracted JSON names. If a key doesn't match, it will cause a silent 400 error.

## Common Mistakes
| Mistake | Why It Happens |
|---------|---------------|
| Using a field from a related type | e.g., `message` belongs to Event, not Alarm |
| Inventing descriptive fields | e.g., adding `"reason"` when the struct has `"reasonCode"` |
| Confusing parent/child fields | e.g., using `"orderId"` on a line item that has `"salesOrderId"` |
| Using Go field name instead of JSON name | e.g., `"AlarmId"` instead of `"alarmId"` or `"alarm_id"` |

## Error Symptom
- `400 Bad Request` on POST or PUT
- Server log: `Cannot find pb for method POST` or `Cannot find pb for method PUT`
- Followed by: `cannot find any matching body type <TypeName> ... unknown field "<fieldName>"`
- The error lists ALL unrecognized fields, helping identify which keys are wrong

## Applies To
- CRUD test data (`TestCRUD_test.go`)
- Validation test data (`TestValidation_test.go`)
- Any `map[string]interface{}` sent via HTTP to the server
- Mock data generators that use maps instead of protobuf structs (rare but possible)
