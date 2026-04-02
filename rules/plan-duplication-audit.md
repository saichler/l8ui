# Plans Must Audit for Duplicate Code Before Implementation (CRITICAL)

## Rule
Before writing any implementation plan to `./plans/`, you MUST audit the plan for duplicate behavioral code. If the plan creates 2+ files with the same behavioral logic (differing only in configuration values like namespaces, field names, or labels), the plan MUST include an extraction phase BEFORE the implementation phases.

## The Audit Process

### Step 1: Identify the pattern source
If the plan says "follow the pattern from X" or "replicate X for Y", read X completely. Categorize every line as either:
- **Behavioral**: Logic that would be identical across all instances (auth, rendering, event handling, data fetching, DOM manipulation)
- **Configuration**: Data that is unique per instance (namespaces, field names, endpoint paths, labels, column definitions)

### Step 2: Calculate duplication
```
Duplicated lines = behavioral_lines × (number_of_new_instances)
```
If `duplicated_lines > 100`, extraction is MANDATORY.

### Step 3: Design the shared abstraction
The shared component should accept configuration and handle all behavioral logic. Each instance should be config-only (~30-50 lines). The abstraction should be created as Phase 0 of the plan, and the source pattern (X) should be refactored to use it before building new instances.

### Step 4: Refactor the original first
The pattern source (X) must be refactored to use the shared abstraction in the same Phase 0. This proves the abstraction works before it's used by new instances, and prevents drift between the original and the new instances.

## What Counts as Behavioral (Must Be Extracted)
- Authentication / authorization flows
- Navigation rendering and event wiring
- Table initialization and configuration
- Form rendering, data collection, and submission
- Detail popup opening and closing
- Section/tab loading and switching
- Data fetching patterns (L8Query construction, fetch calls)
- Sidebar toggle, responsive layout logic
- CSS layout and component styles (extract to shared CSS file)
- HTML shell structure (header, sidebar, content area)

## What Counts as Configuration (Stays Per-Instance)
- Namespace / window object name
- Section-to-service mappings
- Column definitions
- Form definitions
- Enum definitions
- Primary key mappings
- Nav menu items
- Dashboard card definitions and data loaders
- Scope field name and value resolver
- Module includes in HTML `<script>` tags
- Portal-specific actions

## Error Pattern This Prevents
```
Plan says: "Create 5 portals following the ESS pattern"
Each portal gets: app.js (278 lines), m/app.js (310 lines), dashboard.js (125 lines)
Behavioral code per portal: ~520 lines
Total duplication: 520 × 5 = 2,600 lines of copy-pasted behavioral code

CORRECT: Extract shared framework (~500 lines) + 5 × config (~50 lines) = 750 lines total
```

## Checklist Before Writing Plan to ./plans/
- [ ] I have read the source pattern completely
- [ ] I have categorized every line as behavioral vs. configuration
- [ ] If creating 2+ instances: behavioral code is extracted to a shared component
- [ ] Phase 0 refactors the original pattern to use the shared component
- [ ] Each new instance's app/init file is config-only (~30-50 lines)
- [ ] Shared CSS is extracted (not duplicated in each HTML file's `<style>` block)

## Relationship to Existing Rules
This rule extends `maintainability.md`'s "Second Instance Rule" to the planning phase. The Second Instance Rule says "extract when creating the second instance." This rule says "plan the extraction before writing any code, so it doesn't get skipped under time pressure."
