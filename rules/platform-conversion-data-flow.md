# Platform Conversion Must Trace Data Flow (CRITICAL)

## Rule
When converting code from one platform to another (desktop to mobile, v1 to v2, iframe to direct), you MUST trace the **data flow** end-to-end before writing any code. Do NOT replicate the visual output and assume how the data gets there.

## The 5-Step Conversion Protocol

### Step 0: Feature inventory of the source platform
Before writing any code, enumerate **every interactive element** on the source platform's page — not just the main CRUD flows. Create a checklist covering:

1. **Table chrome**: filters, dropdowns, search bars, column pickers, base where clauses, toolbar buttons
2. **CRUD flows**: add, edit, delete, detail popup, save
3. **State management**: local caches, global variables, selected filters that persist across interactions
4. **Navigation elements**: tabs, sub-tabs, view switchers, breadcrumbs
5. **Supplementary features**: toggle buttons (e.g., state toggle), bulk actions, export, refresh

Each item must be accounted for in the target platform — either implemented, or explicitly marked as deferred with a reason. A feature that is not in the inventory will not be ported.

#### Example: The Inventory Type Filter Gap
```
Desktop targets.js feature inventory:
  ✓ Target table with pagination
  ✓ Add/Edit/Delete target CRUD
  ✓ Target detail popup
  ✓ Nested host/protocol editing
  ✗ Inventory type filter dropdown (initInventoryTypeFilter, baseWhereClause)  ← MISSED
  ✗ Toggle target state button (toggleTargetState)  ← MISSED
```
The mobile port implemented the CRUD flows but missed the filter dropdown because no feature inventory was created. The dropdown was part of the table initialization code (lines 155-201), not the modal/form code, so it fell outside the scope of what was being read.

### Step 1: Trace the source platform's data flow
For every user interaction (row click, edit button, detail popup, save), answer:
1. **Where does the data come from?** (server query, table's loaded data, local cache, parent component?)
2. **How does it get to the handler?** (passed as parameter, looked up by ID, fetched from server?)
3. **What transforms are applied?** (enum mapping, date formatting, nested object flattening?)

Write down the answers. Do not proceed until this is documented.

### Step 2: Map to the target platform's equivalentsFor each data flow path identified in Step 1:
1. Does the target platform's framework provide the same data? (e.g., does the mobile table also pass the full item to onRowClick?)
2. If yes, use it directly — do NOT introduce additional server calls.
3. If no, document what's missing and design the minimal bridge.

### Step 3: Trace every link in the target platform's pipelineAfter writing the code, trace the data through **every intermediate layer** on the target platform — not just the entry point and exit point, but every function, factory, and lookup in between. Verify that each link forwards the data correctly to the next.

**This step catches "dropped parameter" bugs**: cases where the data exists at point A and is consumed at point C, but an intermediate layer B (factory, adapter, registry) fails to forward it.**

For each intermediate layer, verify:
1. Does it receive the data from the previous layer?
2. Does it forward/pass it to the next layer?
3. Does it transform or rename it? If so, does the next layer expect the new name?

#### Example: The `getItemId` Bug
```
Nav system (A) → builds getItemId from idField ✓
View factory (B) → receives getItemId in options BUT DOES NOT PASS IT to table constructor ✗
EditTable (C) → falls back to _defaultGetItemId → item.id || '' → always returns '' for non-'id' keys
Handler (D) → _findItemById('') → always returns first item
```
The data existed at A and was needed at C, but B dropped it. Tracing only A→D ("nav sets idField, handler receives item") would miss this. You must verify B forwards it.

### Step 4: Verify parity by diffing behavior, not structureAfter implementation, for each interaction path:
1. Does the target platform get its data from the same source type? (local data vs server query)
2. Does it make the same number of server calls? (zero should stay zero)
3. Does it pass the same data types to the same functions?
4. **Click through the actual UI** — test at least one path end-to-end to catch dropped parameters

## The Anti-Patterns This Prevents

### Anti-Pattern 1: Unnecessary server calls
```
Desktop: Table → onRowClick(item) → showDetail(item) → render item fields
                 ↑ item comes from table's loaded data, NO server call

Mobile (WRONG): Table → onRowClick(item) → IGNORE item → L8Query server call → render response
                 ↑ unnecessary server call that desktop never makes, with broken syntax
```

### Anti-Pattern 2: Dropped parameters in intermediate layers
```
Config:  idField='targetId' → getItemId=(item)=>item.targetId  ✓
Factory: receives getItemId in options → DOES NOT pass to constructor  ✗
Table:   no getItemId → falls back to item.id → '' for all items  ✗
Result:  every card has data-id="", every click returns first item
```

## Rendering Lifecycle: Hidden Containers and Deferred Initialization

When the source platform renders components inside **tabbed interfaces, collapsible panels, or other initially-hidden containers**, you MUST trace **when** each component initializes relative to its container's visibility — not just what data it uses.

### The Problem
Chart libraries, canvas elements, and layout-dependent components require their container to have non-zero dimensions at render time. If the container is hidden (inactive tab, collapsed section, `display:none`), the component renders with zero width/height and appears blank or broken even after the container becomes visible.

### What to Trace
For every component inside a tabbed or hideable container on the source platform:
1. **When does it initialize?** On popup open? On tab activation? On first visibility?
2. **Does the source platform defer rendering?** Look for tab-change event handlers that trigger `init()`, `render()`, `resize()`, or `chart.update()`.
3. **Does the source platform re-render on tab switch?** Some components render once; others re-render each time the tab is activated.

### Correct Pattern
```javascript
// CORRECT — render chart when tab becomes active, not on popup open
tabContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab && tab.dataset.tab === 'performance') {
        initPerformanceCharts();  // Container is now visible with real dimensions
    }
});
```

### Wrong Pattern
```javascript
// WRONG — chart renders into hidden tab on popup open
onShow: (popup) => {
    initPerformanceCharts();  // Performance tab is hidden, container has 0x0 dimensions
}
```

### Components Affected
Any component that reads container dimensions during initialization:
- **Charts** (bar, line, pie, area) — canvas/SVG needs width and height
- **Maps/topology** — viewport calculation depends on container size
- **Drag-and-drop layouts** — position calculation needs visible bounds
- **Virtual scrollers** — row count depends on container height

### Checklist Addition
When porting a tabbed interface, add to the feature inventory (Step 0):
- For each tab: what components does it contain?
- For each component: does it require visible container dimensions?
- If yes: how does the source platform defer its initialization?

## Never Bypass Existing Abstractions

When fixing a bug or adding a feature to converted code, **extend the existing wrapper/helper** — do NOT replace it with a direct call to the underlying API. A working abstraction may handle edge cases, guards, or state management that are not visible in its source code.

### The Anti-Pattern
```javascript
// BEFORE: Uses existing wrapper that works
D.showTabbedPopup(device.name, tabs, onShowCallback);

// WRONG FIX: Bypasses wrapper, calls underlying API directly
Layer8MPopup.show({ title: device.name, tabs: tabs, onShow: ..., onTabChange: ... });
```

### The Correct Approach
```javascript
// CORRECT: Extend the wrapper to support the new feature
ProblerDetail.showTabbedPopup = function(title, tabs, onShow, onTabChange) {
    // ... existing logic unchanged ...
    if (onTabChange) opts.onTabChange = onTabChange;
    Layer8MPopup.show(opts);
};

// Call site: passes new parameter through the wrapper
D.showTabbedPopup(device.name, tabs, onShowCallback, onTabChangeCallback);
```

### Why This Causes Regressions
1. The wrapper may apply guards, defaults, or transformations you didn't notice
2. The wrapper's call site has been tested in production — the direct call has not
3. Other code may depend on the wrapper's side effects (e.g., setting state, dispatching events)
4. The wrapper is the contract; the underlying API is an implementation detail that may change

### When This Applies
- Fixing bugs in code that already works through a helper/wrapper
- Adding callbacks, options, or features to an existing flow
- Any time you're tempted to replace `helper(args)` with `underlying.api(reconstructedArgs)`

## Checklist Before Writing Conversion Code
- [ ] I have created a feature inventory of every interactive element on the source platform's page
- [ ] Every item in the inventory is marked as "implement" or "defer (reason)"
- [ ] I have traced every data flow path in the source platform
- [ ] I know whether each path uses local data or server queries
- [ ] I have verified the target platform's framework provides equivalent data access
- [ ] I am NOT introducing server calls that the source platform doesn't make
- [ ] I am NOT adding UI features (edit buttons, shortcuts) that the source platform doesn't have
- [ ] I have verified the target platform's auth/transport layer supports all HTTP methods used by the source

## Checklist After Writing Conversion Code
- [ ] I have traced the data through EVERY intermediate layer (factories, registries, adapters)
- [ ] Every parameter needed by the consuming code is forwarded by all intermediate layers
- [ ] Components in hidden containers (tabs, collapsed panels) defer initialization until visible
- [ ] I did NOT bypass any existing wrapper/helper — I extended it instead
- [ ] I have tested at least one complete interaction path end-to-end in the actual UI

## Common Traps
| Trap | What Happens | Prevention |
|------|-------------|------------|
| Assuming detail needs server fetch | Broken L8Query, wrong/duplicate data | Check if table passes item to handler |
| Dropped parameter in factory/adapter | Data exists at source, missing at consumer | Trace every intermediate layer |
| Adding "convenience" features | Edit button in read-only view | Match source platform exactly, no additions |
| Replicating untested patterns | Same bug in 6+ files | Test ONE file end-to-end before replicating |
| Checking structure not behavior | "File exists and has functions" ≠ works | Trace click → handler → data → render |
| Verifying only endpoints, not middle | A→D looks correct, but B drops data | Verify A→B→C→D, every link |
| Skipping feature inventory | Table chrome (filters, dropdowns, toggles) not ported | Enumerate all elements in Step 0 before coding |
| Assuming transport parity | `Auth.patch()` doesn't exist, silent TypeError on save | Verify target auth layer supports all HTTP methods used |
| Rendering into hidden containers | Charts/canvas blank in inactive tabs (0x0 dimensions) | Trace source platform's deferred init pattern; render on tab activation, not on popup open |
| Bypassing existing wrappers | Regression — wrapper handled guards/state you didn't replicate | Extend the wrapper to support new features; never replace with direct API call |

## Parity Plans Must Trace Data Transforms

When comparing two implementations for parity (desktop vs mobile, v1 vs v2, etc.), every field comparison MUST verify not just the field **name/path** but also the field **value type** arriving at the consuming code. If one side applies a transform (e.g., enum integer → string label, timestamp → formatted date, nested object → flat field), the plan must explicitly state whether the other side receives the same transformed value or the raw server value.

### The Bug Pattern
1. Server returns `{ status: 1, lastSeen: 1710000000 }` (raw protobuf values)
2. Desktop has `transformData()` that converts to `{ status: "Online", lastSeen: "2024-03-09 12:00" }`
3. Desktop detail code uses `device.status.toUpperCase()` — works (string)
4. Mobile detail code uses `device.status.toUpperCase()` — crashes (number has no toUpperCase)
5. Parity plan says "status: YES" because both sides have the field

### Required Plan Columns
When building a field-by-field parity table, add a **Value Type** column:

```markdown
| # | Field | Desktop Path | Mobile Path | Name Match? | Value Type Match? | Notes |
|---|-------|-------------|-------------|-------------|-------------------|-------|
| 1 | Status | device.status | item.status | YES | NO — desktop is post-transform string, mobile is raw enum int | Must apply enum label before detail code |
| 2 | Last Seen | device.lastSeen | item.lastSeen | YES | NO — desktop formats as date string, mobile is raw timestamp | Must format before detail code |
| 3 | Name | device.name | item.name | YES | YES — both are raw strings from server | OK |
```

### Parity Transform Checklist
1. **Identify all transforms** on the source side (search for transform functions, renderers, formatters, enum maps)
2. **For every transformed field**, verify the target side either applies the same transform OR the consuming code handles the raw type
3. **Mark value type mismatches** as action items in the traceability matrix — they are bugs, not cosmetic differences

### Fields Most Likely to Have Transform Mismatches
| Raw Server Type | Common Transform | Breaks When |
|----------------|-----------------|-------------|
| Enum integer (0, 1, 2...) | → String label ("Online", "Active") | `.toUpperCase()`, string concatenation, display |
| Unix timestamp (seconds) | → Formatted date string | `.includes()`, `.substring()`, display |
| Nested object (`{amount, currency}`) | → Flat string ("$1,234.56") | String methods, display |
| Boolean (true/false) | → Label ("Yes"/"No", "Enabled"/"Disabled") | `.toUpperCase()`, display |
| Repeated/array field | → Comma-joined string or count | `.length` means different things |
