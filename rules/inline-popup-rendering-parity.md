# Inline and Popup Rendering Must Be Identical (CRITICAL)

## Rule
When a form/detail view can be rendered in multiple contexts (popup modal, inline container, mobile panel), every context MUST call the exact same functions in the exact same order as the canonical popup path. The only permitted difference is the container — never the rendering pipeline.

## Why This Matters
If an inline form calls `generateFormHtml` but skips `attachReferencePickers`, reference fields show raw IDs instead of display names. If it skips `attachInlineTableHandlers`, child rows aren't clickable. If it uses a different `setTimeout` timing, pickers attach before the DOM is ready. These differences are silent — no errors, just visually wrong output that looks "unprofessional."

## The Canonical Pipeline
The popup detail view (`Layer8DFormsModal` + `Layer8DPopup`) establishes the canonical rendering pipeline. Any alternative rendering context must replicate it exactly:

### openViewForm pipeline:
1. `generateFormHtml(formDef, data)` — same formDef, same data
2. `setFormContext(formDef, serviceConfig)` — enables reference picker resolution
3. Body element with class `probler-popup-body` — CSS scoping
4. `setTimeout(50ms)` — wait for DOM paint
5. Inside timeout: `attachDatePickers(body)` — which internally calls `attachInputFormatters` AND `attachReferencePickers`
6. Inside timeout: disable all inputs

### openEditForm pipeline (adds to above):
7. `updateFormContext({...})` — with isEdit, recordId, onSuccess
8. `attachInlineTableHandlers(body)` — child row editors
9. Footer with Save/Cancel — Save reads from `getFormContext()`
10. Error cases use `Layer8DNotification.error()`

## Verification Checklist
When creating a new rendering context for forms:
- [ ] Same `generateFormHtml` call (same formDef, same data, same options)
- [ ] Same form context set (`setFormContext` or `updateFormContext`)
- [ ] Body element has `probler-popup-body` class
- [ ] Pickers attached via `setTimeout(50)`, not synchronously
- [ ] `attachDatePickers` called (includes formatters + reference pickers)
- [ ] `attachInlineTableHandlers` called (for edit/add forms)
- [ ] Save handler reads from `getFormContext()`, not direct params
- [ ] Error cases use `Layer8DNotification.error()`
- [ ] Every section/tab of the form renders identically to the popup

## How to Verify Parity
After implementing an alternative rendering context, open the same record in BOTH the popup and the new context. Compare every section tab:
1. Do all fields appear in both?
2. Do reference fields show display names (not raw IDs) in both?
3. Do date fields show formatted dates in both?
4. Do money fields show currency symbols in both?
5. Do inline tables show child rows in both?
6. Do enum/select fields show labels (not numbers) in both?

If ANY field looks different, the pipeline has a gap.
