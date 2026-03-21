# Layer8MForms

```js
const html = Layer8MForms.renderForm(formDef, data, readonly)
const data = Layer8MForms.getFormData(container)
const errors = Layer8MForms.validateForm(container)
Layer8MForms.showErrors(container, errors)
Layer8MForms.initFormFields(container)         // Init reference pickers
```

## Layer8MFormFields Extended

Extends `Layer8MFormFields` with mobile-optimized rendering for 15+ field types:

- `renderCurrencyField`, `renderPercentageField`, `renderPhoneField`, `renderSSNField`
- `renderUrlField`, `renderRatingField`, `renderHoursField`, `renderEinField`, `renderRoutingNumberField`
- `renderColorCodeField`, `renderInlineTableField`, `renderTimeField`
- `renderTagsField`, `renderMultiselectField`, `renderRichtextField`
- Tag/multiselect interaction handlers: `onTagKeydown`, `removeTag`, `toggleMultiselectDropdown`, `onMultiselectChange`

## Inline Table Handlers

Extends `Layer8MForms` with inline table management for nested child records:

```js
Layer8MForms.initInlineTableHandlers(container, formDef)
// Sets up add/edit/delete event listeners for inline table rows

// Internal methods:
// _openMobileRowEditor(fieldDef, rowIndex, rowData, onSave) -- popup row editor
// _showMobileChildDetail(fieldDef, rowData) -- read-only row detail popup
// _rerenderMobileTable(tableEl, fieldDef, rows, isReadOnly) -- re-render after changes
```
