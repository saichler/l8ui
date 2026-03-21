# Layer8DDataSource

Shared data fetching layer used by all view types. Builds L8Query strings, handles pagination, and enforces the metadata-on-page-1-only rule.

```js
const ds = new Layer8DDataSource({
    endpoint: '/erp/30/Employee',
    modelName: 'Employee',
    columns: [...],                     // Column defs (for filter/sort keys)
    pageSize: 10,
    baseWhereClause: 'status=1',
    transformData: (item) => ({...})
});

ds.fetchData(page)                      // Fetch page (1-indexed)
ds.buildQuery(page, pageSize)           // Returns { query, invalidFilters }
ds.setBaseWhereClause('status=2')       // Update WHERE, resets to page 1
ds.setFilter('name', 'Smith')           // Set column filter
ds.clearFilters()
ds.setSort('name', 'asc')              // Set sort column/direction
ds.getTotalPages()                      // ceil(totalItems / pageSize)
```

**Pagination rule:** Metadata (totalCount, key counts) is valid ONLY on page 1. Pages 2+ preserve existing metadata.
