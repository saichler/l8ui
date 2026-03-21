# Layer8DReferenceRegistry

```js
Layer8DReferenceRegistry.register({
    Employee: {
        idColumn: 'employeeId',
        displayColumn: 'lastName',
        selectColumns: ['employeeId', 'firstName', 'lastName'],
        displayLabel: 'Employee',
        displayFormat: (item) => `${item.lastName}, ${item.firstName}`
    }
});
Layer8DReferenceRegistry.get('Employee')    // Returns config object
```
