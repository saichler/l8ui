# Data Import System

Generic data import system in the System section. Supports CSV, JSON, and XML file imports using reusable mapping templates with AI-assisted column mapping.

## Architecture

Four JS files work together under a tab-based UI within the System section:

| File | Global Object | Purpose |
|------|--------------|---------|
| `l8dataimport.js` | `L8DataImport` | Main controller, renders 3 inner sub-tabs |
| `l8dataimport-templates.js` | `L8DITemplates` | Template CRUD, AI mapping, mapping editor |
| `l8dataimport-transfer.js` | `L8DITransfer` | Export/import templates between environments |
| `l8dataimport-execute.js` | `L8DIExecute` | Select template, upload data, run import |

## Backend Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/erp/0/ImprtTmpl` | GET/POST/PUT/DELETE | Template CRUD |
| `/erp/0/ImprtAI` | POST | AI-assisted column mapping suggestions |
| `/erp/0/ImprtInfo` | POST | Get target model field metadata |
| `/erp/0/ImprtExec` | POST | Execute data import |
| `/erp/0/ImprtXfer` | POST | Export templates to JSON |
| `/erp/0/ImprtXfer` | PUT | Import templates from JSON |

## L8DataImport API

```js
L8DataImport.initialize()          // Renders 3-tab layout into #dataimport-container
L8DataImport.showTab(tabName)      // 'templates' | 'transfer' | 'import'
L8DataImport.getHeaders()          // Auth + JSON content-type headers
```

## L8DITemplates API

- `L8DITemplates.initialize()` -- Renders template list view, loads templates from server

**Template Editor features:**
- Name, description, target model, service name, service area, source format fields
- File drop zone for uploading a sample source file
- AI mapping: posts source columns + sample values to `/erp/0/ImprtAI`, receives suggested column mappings with confidence score
- Mapping table: source column -> target field dropdown (populated from model info)
- Skip checkbox per column to exclude from import
- Save (POST new / PUT update) and Delete operations

## L8DITransfer API

- `L8DITransfer.initialize()` -- Renders export/import view, loads template list

**Export:** Select templates via checkboxes -> POST to `/erp/0/ImprtXfer` -> downloads JSON file.
**Import:** Drop/browse JSON file -> PUT to `/erp/0/ImprtXfer` -> shows imported/skipped count. Optionally overwrite existing templates.

## L8DIExecute API

- `L8DIExecute.initialize()` -- Renders 3-step import execution view

**Workflow:**
1. Select template from dropdown (loaded from `/erp/0/ImprtTmpl`)
2. Upload data file (read as base64)
3. Click "Run Import" -> POST to `/erp/0/ImprtExec`
4. Results display: total/imported/failed counts + error list with row number, field, message, source value

## CSS (`l8dataimport.css`)

All classes prefixed with `l8di-`. Uses `--layer8d-*` theme tokens throughout. Key classes:
- `.l8di-tabs` / `.l8di-tab` -- Inner tab navigation
- `.l8di-dropzone` -- File drag-and-drop area
- `.l8di-mapping-table` -- Column mapping editor table
- `.l8di-template-card` -- Template list cards
- `.l8di-confidence` -- AI confidence badge (`.high`, `.medium`, `.low`)
- `.l8di-results` / `.l8di-stat` -- Import results summary
- `.l8di-errors` / `.l8di-error-row` -- Error list

## Script Loading Order

- **Desktop** (`app.html`): After `l8logs.js`, before `l8sys-init.js`
- **Mobile** (`m/app.html`): After `l8sys-modules.js`, before nav scripts
- **CSS**: `l8dataimport.css` after `l8logs.css` (desktop) and after `l8sys-modules.css` (mobile)
