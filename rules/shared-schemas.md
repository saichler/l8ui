# Shared Schemas

## Column Definition (Desktop)

```js
{
    key: 'fieldName',                      // Data field (dots supported: 'user.name')
    label: 'Display Label',                // Column header
    sortKey: 'fieldName',                  // L8Query sort field
    filterKey: 'fieldName',                // L8Query filter field
    enumValues: { 'active': 1 },           // Filter validation map
    render: (item, index) => '<html>'      // Custom cell renderer
}
```

## Column Definition (Mobile)

Same as desktop plus:
```js
{
    primary: true,                         // Shown as card title
    secondary: true,                       // Shown as card subtitle
    hidden: true                           // Not rendered in card body
}
```

## Form Definition

Same schema for both desktop and mobile:

```js
{
    title: 'Employee',
    sections: [
        {
            title: 'Personal Information',
            fields: [
                { key: 'firstName', label: 'First Name', type: 'text', required: true },
                { key: 'gender', label: 'Gender', type: 'select', options: { 1: 'Male', 2: 'Female' } },
                { key: 'hireDate', label: 'Hire Date', type: 'date' },
                { key: 'salary', label: 'Salary', type: 'currency' },
                { key: 'isActive', label: 'Active', type: 'checkbox' },
                { key: 'bio', label: 'Biography', type: 'textarea' },
                { key: 'nationalId', label: 'SSN', type: 'ssn' },
                { key: 'departmentId', label: 'Dept', type: 'reference', lookupModel: 'Department' },
                { key: 'rate', label: 'Rate', type: 'percentage' },
                { key: 'phone', label: 'Phone', type: 'phone' },
                { key: 'hours', label: 'Hours', type: 'hours' }
            ]
        }
    ]
}
```

## Supported Field Types

`text`, `email`, `tel`, `number`, `textarea`, `date`, `datetime`, `select`, `checkbox`, `currency`, `percentage`, `phone`, `ssn`, `reference`, `url`, `rating`, `hours`, `ein`, `routingNumber`, `colorCode`, `period`, `file`

## Field-Level Read-Only

Any field can be marked `readOnly: true` to render as a display-only span instead of an editable input. Read-only fields are skipped during form data collection (never sent to the server on POST/PUT).

```js
{ key: 'nodeId', label: 'Node ID', type: 'text', readOnly: true }
{ key: 'severity', label: 'Severity', type: 'select', options: SEVERITY_ENUM, readOnly: true }
```

Use this for system-managed fields that the user can see but not modify (e.g., alarm identity fields, computed values). The `datetime` type is inherently display-only and does not need `readOnly`.

## Data Collection Behaviors

| Type | Input Format | Stored Value |
|------|-------------|-------------|
| currency | Dollar amount | Cents (integer) |
| percentage | Percent value | Decimal (0.75) |
| hours | HH:MM | Total minutes |
| date | Calendar picker | Unix timestamp (0 = Current/N/A) |
| reference | Picker | ID value |
| checkbox | Toggle | 1 or 0 |
| number | Number | parseFloat |
| period | 3 cascading selects (type/year/value) | `{periodType, periodYear, periodValue}` (L8Period) |
