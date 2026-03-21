# Layer8DTable

Constructor takes a single options object. **Must call `table.init()` after construction.**

```js
const table = new Layer8DTable({
    containerId: 'my-table-container',     // REQUIRED: DOM element ID
    endpoint: '/erp/30/Employee',          // API endpoint
    modelName: 'Employee',                 // Model name for L8Query
    columns: [...],                        // Column definitions
    pageSize: 10,                          // Rows per page (default: 10)
    serverSide: true,                      // Server-side pagination
    primaryKey: 'employeeId',              // Primary key field
    sortable: true,                        // Column sorting (default: true)
    filterable: true,                      // Column filtering (default: true)
    filterDebounceMs: 1000,                // Filter debounce (default: 1000)
    transformData: (item) => ({...}),      // Transform each row
    baseWhereClause: 'status=1',           // Base WHERE for all queries
    onDataLoaded: (data, items, total) => {},
    onRowClick: (item, id) => {},          // Row click handler
    onAdd: () => {},                       // Add button (null = hidden)
    onEdit: (id) => {},                    // Edit button (null = hidden)
    onDelete: (id) => {},                  // Delete button (null = hidden)
    addButtonText: 'Add Employee',
    showActions: true,                     // Action column (default: true)
    emptyMessage: 'No data found.',
    pageSizeOptions: [5, 10, 25, 50]
});
table.init();
```

Instance methods:
```js
table.init()                               // Initialize and render
table.setData(array)                       // Client-side: set data
table.setServerData(array, totalCount)     // Server-side: set data
table.fetchData(page, pageSize)            // Fetch from server
table.setBaseWhereClause('status=1')       // Update WHERE, re-fetch
table.render()                             // Re-render
table.sort('columnKey')                    // Sort (toggles asc/desc)
table.goToPage(2)                          // Navigate (1-indexed)
```

Static methods:
```js
Layer8DTable.tag('Active', 'status-active')
Layer8DTable.tags(['A', 'B'], 'my-class')
Layer8DTable.countBadge(5, 'item', 'items')
Layer8DTable.statusTag(true, 'Up', 'Down')
```
