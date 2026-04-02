# Mobile UI Rules (CRITICAL)

In the paths below, `<project>` refers to the project directory (e.g., `erp`, `bugs`, `l8id`).

---

## Rule 1: Mobile Anti-Patterns

For step-by-step mobile module setup, see the l8ui rules (`adding-module-mobile.md`). This rule documents what NOT to do.

### What NOT to Do
- Do NOT write a custom sidebar with hardcoded `<a>` tags — use the l8ui mobile navigation system
- Do NOT write a custom header layout — use the l8erp header pattern
- Do NOT skip the `Layer8MModuleRegistry` / dynamic nav system in favor of static HTML
- Do NOT invent a new app initialization flow — follow l8erp's `app-core.js` pattern

### The Trap
It looks faster to write a simple custom HTML sidebar with a few nav links. But this produces a mobile UI with no card-based navigation, no dynamic section loading, and none of the built-in navigation features (back buttons, breadcrumbs, service cards, view switching).

### Verification
1. Compare `m/app.html` body structure against l8erp's — should be nearly identical except for branding
2. Compare `app-core.js` initialization against l8erp's — should follow the same pattern
3. No hardcoded sidebar nav items — navigation should be dynamically generated from nav config

---

## Rule 2: Desktop/Mobile Functional Parity

Every UI feature must have **functional parity** between desktop and mobile. This means not just the UI element, but also its **behavioral effects** on the rest of the application.

### 1. When Implementing a New Feature
Before marking any UI task as complete, verify the feature works on both desktop (`go/<project>/ui/web/`) and mobile (`go/<project>/ui/web/m/`). If only one side was implemented, implement the other before moving on.

### 2. When Touching Any Section or Module
Whenever you modify or work on a section, audit the **entire section** for desktop/mobile parity gaps before finishing. Compare:
- Desktop section HTML (`sections/<module>.html`) vs mobile section HTML (`m/sections/<module>.html`)
- Desktop JS features (detail popups, tabs, interactive elements) vs mobile equivalents
- Script includes in `app.html` vs `m/app.html`

If you find gaps, flag them to the user and offer to fix them.

### 3. Behavioral Effects (CRITICAL)
A feature includes **all its downstream effects**, not just the UI element itself. When implementing a feature, trace its effects across the entire application on BOTH platforms.

Examples:
- **Module enable/disable**: The toggle tree UI exists on both platforms. But does disabling a module actually HIDE it from navigation on both platforms?
- **Configuration changes**: If a settings page changes behavior, does the change propagate to all UI components on both platforms?
- **Data operations**: If a CRUD operation on one view affects what's shown in another view, does that cross-view effect work on both platforms?

**Ask yourself**: "If a user performs this action on mobile, will the result be identical to performing it on desktop?" If not, there's a parity gap.

### Verification Checklist
1. Does the desktop version have detail popups? Does mobile?
2. Does the desktop version have interactive features (sorting, filtering, tabs)? Does mobile?
3. Are all shared scripts included in both `app.html` and `m/app.html`?
4. Are section HTML files placeholders ("Under Development") on one side but functional on the other?
5. **Does the feature's EFFECT propagate to all navigation and display components on both platforms?**
6. **Do shared components (Layer8DModuleFilter, Layer8DUtils, etc.) get consumed by both desktop and mobile navigation?**
