# Layer8MReferencePicker

```js
Layer8MReferencePicker.show({
    endpoint: '/erp/30/Department',
    modelName: 'Department',
    idColumn: 'departmentId',
    displayColumn: 'name',
    displayFormat: (item) => `${item.code} - ${item.name}`,
    selectColumns: ['departmentId', 'name', 'code'],
    pageSize: 15,
    currentValue: 'DEPT-001',
    onChange: (id, displayValue, item) => {}
});
Layer8MReferencePicker.getValue(inputElement)
Layer8MReferencePicker.setValue(input, id, displayValue, item)
```
