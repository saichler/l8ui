# Checklist

## Desktop
- [ ] Config file (`modules`, `submodules`)
- [ ] Per sub-module: enums, columns, forms, entry point
- [ ] Init file (single `Layer8DModuleFactory.create()` call)
- [ ] Section HTML with correct container IDs (`{moduleKey}-{serviceKey}-table-container`)
- [ ] app.html: script tags in correct order
- [ ] sections.js: section mapping + initializer
- [ ] Reference registry entries

## Mobile
- [ ] Per sub-module: enums, columns (with `primary`/`secondary`), forms
- [ ] Registry index file (`getColumns`, `getFormDef`, `getTransformData`, `hasModel`)
- [ ] Nav config: `hasSubModules: true` + config block with `subModules` and `services`
- [ ] Nav.js: registry added to all lookup arrays
- [ ] m/app.html: script tags + sidebar link (`data-section="dashboard" data-module="xxx"`)
- [ ] Reference registry entries

## Critical Rules
- Field names MUST match actual API/protobuf field names (verify against `.pb.go` files)
- Endpoint names max 10 characters
- CSS classes use `l8-` prefix for ALL desktop modules (shared CSS from `layer8-section-layout.css`)
- Desktop: `new Layer8DTable(options)` then `table.init()` -- single options object
- Mobile: `new Layer8MEditTable(containerId, config)` -- two arguments, no init() call needed
