# Layer8MViewFactory

Mobile view factory -- mirrors `Layer8DViewFactory` for mobile. Creates view instances by type. All mobile view wrappers auto-register on load.

```js
Layer8MViewFactory.register('chart', factoryFn)       // Register a view type
Layer8MViewFactory.create('chart', options)            // Create view instance
Layer8MViewFactory.has('kanban')                       // Check if type registered
```

Registered view types: `table`, `chart`, `kanban`, `calendar`, `timeline`, `gantt`, `tree`, `wizard`.

All view instances follow the same interface: `init()`, `refresh()`, `destroy()`.

**Mobile view switching:** `Layer8MNavData.loadServiceData()` reads `supportedViews` from the service config. When multiple views are available, it renders a `Layer8ViewSwitcher` dropdown above the data container. Switching views destroys the current view and creates a new one via `Layer8MViewFactory.create()`.

**Auto-detect chart:** If a service's columns include both `type: 'date'` and `type: 'money'`, `'chart'` is automatically added to the available views (same logic as desktop `layer8d-service-registry.js`).

**Service config `supportedViews`:**
```js
{ key: 'work-orders', label: 'Work Orders', endpoint: '/70/MfgWorkOrd',
  model: 'MfgWorkOrder', idField: 'workOrderId',
  supportedViews: ['table', 'kanban', 'gantt'] }
```

## Layer8MDataSource

Mobile data fetching layer -- mirrors `Layer8DDataSource` for mobile. Builds L8Query strings, handles pagination, and enforces the metadata-on-page-1-only rule.

```js
const ds = new Layer8MDataSource({
    endpoint: '/erp/30/Employee',
    modelName: 'Employee',
    columns: [...],
    pageSize: 15,
    baseWhereClause: 'status=1',
    transformData: (item) => ({...}),
    onDataLoaded: (items, total) => {},
    onError: (err) => {},
    onMetadata: (metadata) => {}
});

ds.fetchData(page)                      // Fetch page (1-indexed)
ds.buildQuery(page, pageSize)           // Returns { query, isInvalid }
ds.setBaseWhereClause('status=2')       // Update WHERE, resets to page 1
ds.setFilter('name', 'Smith')           // Set column filter
ds.clearFilters()
ds.setSort('name', 'asc')
ds.getTotalPages()
```
