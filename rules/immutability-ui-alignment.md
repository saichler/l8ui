# Immutability Must Be Reflected in the UI

## Rule
When an entity or field is defined as immutable (in the PRD, proto, or backend validation), the UI MUST be updated to match. Backend immutability without corresponding UI changes is incomplete implementation.

## Entity-Level Immutability
If an entity rejects PUT requests (the entire entity is immutable after creation):
- The table view MUST be set to read-only mode (no edit/update controls)
- Detail popups MUST render all fields as display-only (no editable inputs)
- The "Edit" / "Save" buttons MUST be hidden or disabled
- POST (create) and DELETE may still be allowed unless also restricted

## Field-Level Immutability
If specific fields on an entity are protected from modification on PUT:
- Those fields MUST render as read-only / display-only in edit forms
- Editable fields should remain as normal inputs
- The form should visually distinguish between editable and read-only fields

## Checklist
When implementing immutability at any level:
1. Backend: Add validation (reject PUT, protect fields)
2. UI config: Set service/table to read-only mode if entity-level
3. UI forms: Mark protected fields as display-only if field-level
4. Verify: Confirm the UI does not present controls that the backend will reject
