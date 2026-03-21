# Layer8DInputFormatter

Supported types: `ssn`, `phone`, `currency`, `percentage`, `routingNumber`, `ein`, `email`, `url`, `colorCode`, `rating`, `hours`

```js
Layer8DInputFormatter.attach(input, 'currency', { min: 0, max: 1000000 })
Layer8DInputFormatter.getValue(input)       // Raw value (cents for currency)
Layer8DInputFormatter.setValue(input, 15000) // Set value (cents)
Layer8DInputFormatter.validate(input)       // { valid, errors[] }
Layer8DInputFormatter.detach(input)
Layer8DInputFormatter.attachAll(container)  // Auto-attach via data-format attr
Layer8DInputFormatter.collectValues(container) // { fieldName: rawValue }

// Display formatters
Layer8DInputFormatter.format.currency(15000)        // '$150.00'
Layer8DInputFormatter.format.ssn('123456789', true)  // '***-**-6789'
Layer8DInputFormatter.format.phone('5551234567')     // '(555) 123-4567'
```
