# Factory Components

Four factories reduce boilerplate in module data files. All are loaded before module scripts.

## Layer8EnumFactory

```js
const factory = window.Layer8EnumFactory;

// Full enum (label, value alias, CSS class)
const STATUS = factory.create([
    ['Unspecified', null, ''],
    ['Active', 'active', 'layer8d-status-active'],
    ['Inactive', 'inactive', 'layer8d-status-inactive'],
]);
// STATUS.enum = { 0: 'Unspecified', 1: 'Active', 2: 'Inactive' }
// STATUS.values = { 'active': 1, 'inactive': 2 }
// STATUS.classes = { 1: 'layer8d-status-active', 2: 'layer8d-status-inactive' }

// Simple enum (labels only, no values/classes)
const TYPE = factory.simple(['Unspecified', 'Type A', 'Type B']);

// Enum with value aliases (no classes)
const EMPLOYMENT = factory.withValues([['Full-Time', 'full-time'], ['Part-Time', 'part-time']]);
```

## Layer8RefFactory

```js
const ref = window.Layer8RefFactory;
window.MyRegistry = {
    ...ref.simple('Model', 'modelId', 'name', 'Label'),
    ...ref.person('Person', 'personId', 'lastName', 'firstName'),
    ...ref.coded('Entity', 'entityId', 'code', 'name'),
    ...ref.idOnly('LineItem', 'lineId')
};
```

## Layer8ColumnFactory

```js
const col = window.Layer8ColumnFactory;
Module.columns = {
    Model: [
        ...col.id('modelId'),
        ...col.col('field', 'Label'),
        ...col.boolean('isActive', 'Active'),
        ...col.date('createdDate', 'Created'),
        ...col.money('amount', 'Amount'),
        ...col.status('status', 'Status', enums.STATUS_VALUES, render.status),
        ...col.enum('type', 'Type', null, render.type),
        ...col.custom('key', 'Label', (item) => item.x, { sortKey: 'key' })
    ]
};
```

## Layer8FormFactory

```js
const f = window.Layer8FormFactory;
Module.forms = {
    Model: f.form('Model', [
        f.section('Info', [
            ...f.text('code', 'Code', true),
            ...f.text('name', 'Name', true),
            ...f.textarea('description', 'Description'),
            ...f.select('status', 'Status', enums.STATUS, true),
            ...f.reference('managerId', 'Manager', 'Employee'),
            ...f.date('startDate', 'Start Date'),
            ...f.money('amount', 'Amount'),
            ...f.checkbox('isActive', 'Active'),
            ...f.number('quantity', 'Quantity')
        ])
    ])
};
```
