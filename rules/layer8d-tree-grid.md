# Layer8DTreeGrid

Hierarchical tree table that builds parent-child relationships from a flat list using a `parentIdField`.

```js
const tree = new Layer8DTreeGrid({
    containerId: 'tree-container',
    columns: [...],
    dataSource: dataSourceInstance,
    viewConfig: {
        parentIdField: 'parentId',     // Field linking to parent's ID
        idField: 'categoryId',         // Primary key (default: primaryKey)
        labelField: 'name',            // Auto-detected if omitted
        expandedByDefault: true,       // Start expanded (default: true)
        pageSize: 500                  // Fetch all for tree building
    },
    primaryKey: 'categoryId',
    onItemClick: (item, id) => {},
    onAdd: () => {},
    onEdit: (id) => {},
    onDelete: (id) => {}
});
tree.init();
tree.setData(items);
tree.toggleNode(nodeId);
tree.expandAll();
tree.collapseAll();
tree.refresh();
tree.destroy();
```
