# Layer8DDatePicker

```js
Layer8DDatePicker.attach(inputElement, {
    minDate: 1609459200,                   // Unix seconds
    maxDate: 1735689600,
    onChange: (timestamp, formatted) => {},
    showTodayButton: true,
    firstDayOfWeek: 0                      // 0=Sunday, 1=Monday
});
Layer8DDatePicker.setDate(input, timestamp) // 0 = 'Current'/'N/A'
Layer8DDatePicker.getDate(input)            // Unix timestamp (0=Current, null=empty)
Layer8DDatePicker.detach(input)
```
