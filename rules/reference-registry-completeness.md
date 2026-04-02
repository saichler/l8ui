# Reference Registry Completeness

## Rule
Every model used as a `lookupModel` in form definitions MUST have a corresponding entry in the reference registry. Forms with unregistered lookupModels will fail silently or show console warnings.

For the reference registry API and entry format, see the l8ui rules (`factory-components.md` and `layer8d-reference-registry.md`).

## When This Applies
- When creating or modifying `*-forms.js` files
- When adding new `type: 'reference'` fields to forms
- When creating a new module with reference lookups

## Verification Commands

### Check for Missing Registrations
```bash
# Get all lookupModel values used in forms
grep -rh "lookupModel: '" go/<project>/ui/web --include="*-forms.js" | \
  sed "s/.*lookupModel: '\\([^']*\\)'.*/\\1/" | sort -u > /tmp/used.txt

# Get all registered models
grep -rhoE "(simple|coded|batch|batchIdOnly|idOnly|person)\\(['\"][^'\"]+['\"]" \
  go/<project>/ui/web/js/reference-registry-*.js | \
  sed "s/.*(['\"]\\([^'\"]*\\)['\"].*/\\1/" | sort -u > /tmp/registered.txt

# Find missing
comm -23 /tmp/used.txt /tmp/registered.txt
```

### Verify a Specific Model
```bash
grep -r "ModelName:" go/<project>/ui/web/js/reference-registry-*.js
```

## Checklist for New Modules

When creating a new module:
1. [ ] Create `reference-registry-<module>.js` for desktop
2. [ ] Create `layer8m-reference-registry-<module>.js` for mobile
3. [ ] Add script includes to `app.html` and `m/app.html`
4. [ ] Register all models that will be used as lookupModel
5. [ ] Run verification command to confirm no missing registrations

## Error Symptom
```
Reference input missing required config: fieldName
```
This console warning means the lookupModel for that field is not in the reference registry.
