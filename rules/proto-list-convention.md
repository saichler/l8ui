# Protobuf List Type Convention

## Rule
All protobuf list/collection message types must follow this exact pattern:

```protobuf
message SomeEntityList {
  repeated SomeEntity list = 1;
  l8api.L8MetaData metadata = 2;
}
```

## Key Points
- The repeated field MUST be named `list` (not `items`, `entries`, `data`, etc.)
- The `l8api.L8MetaData metadata` field MUST be included as field 2
- This pattern is required by the Layer8 framework for proper serialization and iteration

## Why This Matters
The Layer8 framework expects the `list` field name when iterating over collection types. Using a different field name (like `items`) will cause runtime errors such as:
```
invalid <TypeName> type
```

## Verification
Before creating new proto files, verify the pattern against existing modules:
```bash
grep -A3 "List {" proto/*.proto | head -20
```

## Example
```protobuf
// CORRECT
message EcomCategoryList {
  repeated EcomCategory list = 1;
  l8api.L8MetaData metadata = 2;
}

// WRONG - will cause runtime errors
message EcomCategoryList {
  repeated EcomCategory items = 1;
}
```
