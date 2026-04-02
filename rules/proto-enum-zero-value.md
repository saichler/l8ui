# Protobuf Enum Zero Value Convention

## Rule
Every protobuf enum MUST have an invalid/unspecified zero value as its first entry. The zero value MUST NOT represent a valid, meaningful state.

## Why This Matters
Protobuf defaults unset enum fields to 0. If 0 is a valid value (e.g., "Active"), then unset fields silently appear as "Active" instead of being detectable as missing. This makes it impossible to distinguish "explicitly set to the first value" from "never set."

## Naming Convention
The zero value name MUST follow this pattern:
```
[MODULE_PREFIX_]FIELD_NAME_UNSPECIFIED = 0
```

Examples:
```protobuf
// CORRECT
enum AccountType {
  ACCOUNT_TYPE_UNSPECIFIED = 0;
  ACCOUNT_TYPE_ASSET = 1;
  ACCOUNT_TYPE_LIABILITY = 2;
}

enum MfgBomStatus {
  MFG_BOM_STATUS_UNSPECIFIED = 0;
  MFG_BOM_STATUS_DRAFT = 1;
  MFG_BOM_STATUS_ACTIVE = 2;
}

// WRONG - 0 is a valid value
enum Priority {
  LOW = 0;      // BAD: unset fields appear as LOW
  MEDIUM = 1;
  HIGH = 2;
}

// WRONG - no zero value
enum Status {
  ACTIVE = 1;   // BAD: no 0 value defined
  INACTIVE = 2;
}
```

## Verification
After creating or modifying any proto file with enums:
```bash
# Check all enums have a 0 value containing UNSPECIFIED, INVALID, or UNKNOWN
grep -A1 "^enum " proto/*.proto | grep "= 0" | grep -iv "unspecified\|invalid\|unknown"
```
If any results appear, those enums need a proper zero value.

## Current Compliance
All 289 ERP enums across 12 modules follow this convention (verified Feb 2026).
