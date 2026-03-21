# Special Cases

## Read-Only Services

Add `readOnly: true` to the service definition. The nav system skips CRUD callbacks, so no Add/Edit/Delete buttons appear.

```js
{ key: 'health', endpoint: '/0/Health', model: 'L8Health', idField: 'service', readOnly: true }
```

## Transform Data

When API data needs conversion before display, add `transformData` to the module namespace:

```js
MobileMyModule.transformData = function(item) {
    return { displayField: item.rawField || 'Unknown', formatted: convert(item.raw) };
};
```

The registry's `getTransformData(modelName)` passes it to the table.

## Custom CRUD Handlers (Desktop)

For models with nested data or special forms, override the factory CRUD in the init file:

```js
var origInit = window.initializeMyModule;
window.initializeMyModule = function() {
    if (origInit) origInit();
    MyModule._openAddModal = function(service) {
        if (service.model === 'SpecialModel') {
            MyCustomCRUD.openAdd(service);
        } else {
            Layer8DModuleCRUD._openAddModal.call(MyModule, service);
        }
    };
};
```
