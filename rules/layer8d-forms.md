# Layer8DForms

Unified facade for form sub-modules (`Layer8DFormsFields`, `Layer8DFormsData`, `Layer8DFormsPickers`, `Layer8DFormsModal`).

```js
// Open add form in popup
Layer8DForms.openAddForm(serviceConfig, formDef, onSuccess)

// Open edit form (fetches record first)
Layer8DForms.openEditForm(serviceConfig, formDef, recordId, onSuccess)

// Read-only details view
Layer8DForms.openViewForm(serviceConfig, formDef, data)

// Delete with confirmation
Layer8DForms.confirmDelete(serviceConfig, recordId, onSuccess)

// Low-level (from sub-modules)
Layer8DForms.generateFormHtml(formDef, data)         // Returns HTML string
Layer8DForms.collectFormData(formDef)                 // Collect form data from DOM
Layer8DForms.validateFormData(formDef, data)          // Returns errors[]
Layer8DForms.fetchRecord(endpoint, primaryKey, id, modelName) // Fetch single record
Layer8DForms.saveRecord(endpoint, data, isEdit)       // POST or PUT
Layer8DForms.deleteRecord(endpoint, id, primaryKey, modelName) // DELETE
Layer8DForms.attachDatePickers(container)             // Init date pickers
Layer8DForms.attachReferencePickers(container)        // Init reference pickers
```

Where `serviceConfig` is:
```js
{ endpoint: '/erp/30/Employee', primaryKey: 'employeeId', modelName: 'Employee' }
```

## Layer8FormFactory Presets

Extends `Layer8FormFactory` with preset field group generators for common entity patterns:

```js
const f = window.Layer8FormFactory;

f.basicEntity()                          // [code, name, description, isActive]
f.dateRange('prefix')                    // [startDate, endDate]
f.address('parentKey')                   // [line1, line2, city, stateProvince, postalCode, countryCode]
f.contact('parentKey')                   // [value, contactType]
f.audit()                                // Read-only [createdBy, createdAt, modifiedBy, modifiedAt]
f.person(includeMiddle?)                 // [firstName, (middleName), lastName]
```

## Layer8DFormsFields Extended

Extends `Layer8DFormsFields` with advanced field rendering:

- **Inline tables**: `generateInlineTableHtml(field, rows, readOnly)` -- embedded child record tables with add/edit/delete
- **Period selector**: `onPeriodTypeChange(selectEl)` -- cascading Month/Quarter/Year selects
- **Tags/multiselect**: chip-based UI for multi-value fields
- **File upload**: drag-and-drop file upload with progress indicator (uses `Layer8FileUpload`)
