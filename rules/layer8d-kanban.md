# Layer8DKanban

Kanban board with configurable lanes. Cards display title, subtitle, and custom fields.

```js
// Registered as 'kanban' view type
// viewConfig options:
{
    laneField: 'status',               // Field that determines the lane
    lanes: {                            // Lane definitions (keyed by field value)
        1: { label: 'To Do', color: '#0ea5e9' },
        2: { label: 'In Progress', color: '#f59e0b' },
        3: { label: 'Done', color: '#22c55e' }
    },
    cardTitle: 'name',                 // Field for card title
    cardSubtitle: 'assignee',          // Field for card subtitle
    cardFields: ['priority', 'dueDate'] // Additional fields on cards
}
```
