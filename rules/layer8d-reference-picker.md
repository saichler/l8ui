# Layer8DReferencePicker

```js
Layer8DReferencePicker.attach(inputElement, {
    endpoint: '/erp/30/Department',        // REQUIRED
    modelName: 'Department',               // REQUIRED
    idColumn: 'departmentId',              // REQUIRED
    displayColumn: 'name',                 // REQUIRED
    displayFormat: (item) => `${item.code} - ${item.name}`,
    selectColumns: ['departmentId', 'name', 'code'],
    baseWhereClause: 'isActive=true',
    pageSize: 10,
    onChange: (id, displayValue, item) => {},
    title: 'Select Department'
});
Layer8DReferencePicker.getValue(input)      // Selected ID
Layer8DReferencePicker.getItem(input)       // Full selected item
Layer8DReferencePicker.setValue(input, id, displayValue, item)
Layer8DReferencePicker.detach(input)
```
