# Reuse Existing Module Forms — Never Redefine (CRITICAL)

## Rule
When building a new portal, view, or page that displays data from an existing module (e.g., ESS portal showing HCM data), NEVER redefine form definitions, enums, or renderers. Include the existing module's JS files and use them directly.

## Why This Matters
Every module already has complete form definitions (`*-forms.js`), enums (`*-enums.js`), and renderers in its submodule directories. These are used by the main app's detail views via `Layer8DFormsModal.openViewForm()` and `_showDetailsModal()`. Redefining them:
- Duplicates code across files
- Creates drift when the original forms are updated
- Violates the duplication prevention rules in maintainability.md
- Is unnecessary — the components already exist

## What To Do
1. **Include the module's JS files** (enums + forms) in the new page's HTML
2. **Use the existing l8ui detail view flow** (`Layer8DFormsModal.openViewForm`, `_showDetailsModal`, etc.)
3. **Look up forms** via `Layer8DServiceRegistry` or directly from the module namespace (e.g., `Payroll.forms.Payslip`)

## What NOT To Do
- Do NOT create simplified/subset form definitions for the new portal
- Do NOT create a "portal-specific" properties panel
- Do NOT claim a gap in l8ui when the forms already exist in the module

## Before Claiming a Gap
When you think a generic component is missing from l8ui, first check: does the data's source module already have the component? If yes, include and reuse it — there is no gap.
