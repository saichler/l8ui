# Layer8MTable

Card-based mobile table. Constructor takes `(containerId, config)`.

```js
const table = new Layer8MTable('container-id', {
    endpoint: '/erp/30/Employee',
    modelName: 'Employee',
    columns: [...],
    rowsPerPage: 15,
    transformData: (item) => ({...}),
    statusField: 'status',
    onCardClick: (item) => {},
    getItemId: (item) => item.employeeId
});
```

## Layer8MEditTable (extends Layer8MTable)

Adds Add/Edit/Delete buttons. If callbacks are null, buttons are hidden (read-only mode).

```js
const table = new Layer8MEditTable('container-id', {
    // All Layer8MTable options plus:
    onAdd: () => {},                           // null = no add button
    addButtonText: 'Add Employee',
    onEdit: (id, item) => {},                  // null = no edit button
    onDelete: (id, item) => {},                // null = no delete button
    onRowClick: (item, id) => {},
    getItemId: (item) => item.employeeId
});
```
