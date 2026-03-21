# Layer8DViewFactory

Registry of view type constructors. Creates the appropriate view component based on service `viewType` configuration. Default is `'table'`.

```js
Layer8DViewFactory.register('chart', factoryFn)       // Register a view type
Layer8DViewFactory.create('chart', options)            // Create view instance
Layer8DViewFactory.has('kanban')                       // Check if type registered
Layer8DViewFactory.getTypes()                          // ['table','chart','kanban',...]
Layer8DViewFactory.detectTitleField(columns, pk)       // Auto-detect label field

// Create view with a type-switcher dropdown
Layer8DViewFactory.createWithSwitcher(type, options, viewTypes, serviceKey, onSwitch)
```

All view instances follow the same interface: `init()`, `refresh()`, `destroy()`.

Registered view types: `table`, `chart`, `kanban`, `timeline`, `calendar`, `gantt`, `tree`, `wizard`.

## Layer8ViewSwitcher

Small icon button with floating dropdown menu for switching between view types. Shared by desktop and mobile.

```js
// Render HTML for the switcher
const html = Layer8ViewSwitcher.render(serviceKey, viewTypes, activeType)

// Attach click handlers
Layer8ViewSwitcher.attach(container, function(newViewType) { ... })
```

View labels: `table` -> "Table View", `chart` -> "Chart View", `kanban` -> "Kanban Board", `timeline` -> "Timeline", `calendar` -> "Calendar", `tree` -> "Tree Grid", `gantt` -> "Gantt Chart", `wizard` -> "Wizard".
