# Layer8DTimeline

Vertical timeline displaying events in chronological order with alternating left/right layout.

```js
const timeline = new Layer8DTimeline({
    containerId: 'timeline-container',
    columns: [...],
    dataSource: dataSourceInstance,
    viewConfig: {
        dateField: 'auditInfo.createdDate',    // Timestamp field
        actorField: 'auditInfo.createdBy',     // Who performed the action
        titleField: 'name',                    // Auto-detected if omitted
        descriptionField: 'description',
        colorField: 'status',                  // Optional color grouping
        pageSize: 20
    },
    onItemClick: (item, id) => {},
    onAdd: () => {}
});
timeline.init();
timeline.setData(items, total);
timeline.refresh();
timeline.destroy();
```
