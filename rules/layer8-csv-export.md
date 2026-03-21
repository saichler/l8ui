# Layer8CsvExport

**Global object:** `window.Layer8CsvExport` (shared between desktop and mobile)

Posts to the backend `CsvExport` service which pages through all data server-side, builds a CSV with attribute-based column headers, and returns the complete CSV string. The client triggers a browser file download.

Backend endpoint: `POST /erp/0/CsvExport` with JSON body:
```json
{ "modelType": "Employee", "serviceName": "Employee", "serviceArea": 30 }
```

```js
Layer8CsvExport.export({
    modelName: 'Employee',
    serviceName: 'Employee',
    serviceArea: 30,
    filename: 'Employee'
});

Layer8CsvExport.parseEndpoint(endpoint)    // '/erp/30/Employee' -> { serviceName, serviceArea }
```

The Export button appears automatically in both desktop and mobile pagination bars when `endpoint` and `modelName` are set.
