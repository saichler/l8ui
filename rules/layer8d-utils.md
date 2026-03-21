# Layer8DUtils

```js
Layer8DUtils.escapeHtml(text)                  // XSS-safe escaping
Layer8DUtils.formatDate(timestamp)             // Unix seconds -> 'MM/DD/YYYY'
Layer8DUtils.formatDateTime(timestamp)         // Unix seconds -> 'MM/DD/YYYY HH:MM:SS'
Layer8DUtils.parseDateToTimestamp(dateString)   // 'MM/DD/YYYY' -> Unix seconds
Layer8DUtils.formatMoney(cents, currency?)     // 150000 -> '$1,500.00'
Layer8DUtils.formatPercentage(decimal)         // 0.75 -> '75.00%'
Layer8DUtils.formatPhone(digits)               // '5551234567' -> '(555) 123-4567'
Layer8DUtils.formatSSN(digits, masked?)        // masked: '***-**-6789'
Layer8DUtils.formatHours(minutes)              // 150 -> '2:30'
Layer8DUtils.getNestedValue(obj, 'a.b.c')     // Deep property access
Layer8DUtils.debounce(fn, ms)                  // Returns debounced function
Layer8DUtils.matchEnumValue(input, enumMap)    // Case-insensitive enum match
```
