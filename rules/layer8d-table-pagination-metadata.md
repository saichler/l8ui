# Pagination Metadata Must Only Be Read on Page 1 (CRITICAL — 4x REGRESSION)

## Rule
In **EVERY** component that fetches paginated data from the server, the response metadata (`data.metadata.keyCount.counts.Total`) MUST only be read and stored on the **first page**. On all subsequent pages, the previously stored `totalItems` value MUST be reused. This applies to ALL files, not just Layer8DTable.

**This bug has regressed 4 times.** Every time it is fixed in one file, it reappears in another. **ALL data-fetching code must be audited.**

## Why This Is Critical
The server only computes aggregate metadata (total count, status breakdowns, key counts) when processing page 0 (the first page). Subsequent page responses return **zero or stale metadata**. If `fetchData` reads metadata on every page, page 2+ will overwrite the correct `totalItems` with 0, causing:

- **Page 1**: "Page 1 of 2002" (correct)
- **Page 2**: "Page 2 of 1" (totalItems overwritten with 0, `Math.ceil(0/15) = 0` → displays as 1)

## The Correct Pattern
```javascript
// CORRECT — only read metadata on first page
let totalCount = 0;
if (page === 1 && data.metadata?.keyCount?.counts) {
    totalCount = data.metadata.keyCount.counts.Total || 0;
    this.totalItems = totalCount;
} else {
    totalCount = this.totalItems;  // Reuse cached value
}
```

## The Wrong Pattern
```javascript
// WRONG — overwrites totalItems on every page
let totalCount = 0;
if (data.metadata?.keyCount?.counts) {
    totalCount = data.metadata.keyCount.counts.Total || 0;
}
this.setServerData(items, totalCount);  // totalCount is 0 on page 2+!
```

## setServerData Must Also Be Defensive
```javascript
// CORRECT — never overwrite with 0
Layer8DTable.prototype.setServerData = function(data, totalItems) {
    this.data = Array.isArray(data) ? data : Object.values(data);
    if (totalItems > 0) {
        this.totalItems = totalItems;
    }
    this.render();
};
```

## What Resets to Page 1 (Triggers Fresh Metadata)
These actions set `currentPage = 1` before calling `fetchData`, so metadata is correctly refreshed:
- Filter changes (typing in filter inputs)
- Sort changes (clicking column headers)
- Page size changes (changing items per page)
- Base where clause changes (`setBaseWhereClause()`)
- Initial load / `init()`

## ALL Files That Must Have This Guard
Every file that reads `data.metadata?.keyCount?.counts` for pagination MUST guard with a page check:

| File | Page variable | First page value | Status |
|------|--------------|-----------------|--------|
| `layer8d-table-data.js` | `page` | `1` | Fixed (regression #4) |
| `layer8d-data-source.js` | `page` | `1` | Correct |
| `layer8m-data-source.js` | `page` | `1` | Correct |
| `layer8d-reference-picker-data.js` | `state.currentPage` | `0` | Fixed (regression #4) |

**When adding ANY new component that fetches paginated data, add it to this table.**

Files that read metadata for non-pagination purposes (dashboard stats, hero counters) are OK — they always fetch page 1.

## Verification After ANY Edit to These Files
```bash
# Check all metadata reads have a page guard
grep -n "metadata?.keyCount" l8ui/edit_table/layer8d-table-data.js l8ui/shared/layer8d-data-source.js l8ui/m/js/layer8m-data-source.js l8ui/reference_picker/layer8d-reference-picker-data.js
# Every match MUST be preceded by a page === 1 (or page === 0) check on the same or previous line
```

## This Bug Has Recurred 4 Times
1. Original implementation lacked the guard
2. Refactor removed the guard from `layer8d-table-data.js`
3. Guard was re-removed during a later edit
4. **2026-03-07**: Guard was missing again in `layer8d-table-data.js` AND was never added to `layer8d-reference-picker-data.js`

Root cause: the pattern `if (data.metadata?.keyCount?.counts)` **looks correct** — it checks for existence. The bug is invisible because it produces correct results on page 1. Only page 2+ reveals the problem. The `page === 1` guard is counterintuitive (why skip valid-looking metadata?) so it gets removed during refactors.

**When modifying ANY pagination or data-fetching code, verify the page guard is intact in ALL files listed above.**
