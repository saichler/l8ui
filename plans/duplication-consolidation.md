# Plan: Consolidate Duplicated Data-Fetch, Form, and Picker Logic in l8ui

**Status:** Draft — awaiting review/approval
**Scope:** `l8ui` shared component library only (no consuming-project changes included)
**Blast radius:** HIGH — `l8ui` is copied via submodule into every Layer 8 project (l8erp, l8physio, probler, l8bugs, l8book, l8id, l8topology, l8myfamily, l8events, l8notify, l8alarms, ...). Every project's tables, reference pickers, forms, and date pickers run this code. See "Risk & Compatibility" below.

## 1. Background — what the audit found

A duplication audit of `l8ui` found 13 concrete instances of behavioral logic (not just DOM/rendering — actual parsing, query-building, or state-management logic) copy-pasted or independently reimplemented across 2–5 files each, instead of extracted into one shared, parameterized implementation. The largest and most consequential finding is that **the same "build an L8Query, fetch it, apply the page-1-only pagination-metadata guard" logic exists five separate times**:

| # | Location | Role |
|---|----------|------|
| 1 | `edit_table/layer8d-table-data.js` (`Layer8DTable.buildQuery`/`fetchData`) | Desktop table |
| 2 | `shared/layer8d-data-source.js` (`Layer8DDataSource`) | Desktop view types (chart/kanban/calendar/gantt/timeline/tree_grid) |
| 3 | `reference_picker/layer8d-reference-picker-data.js` | Desktop reference picker |
| 4 | `m/js/layer8m-reference-picker.js` | Mobile reference picker |
| 5 | `m/js/layer8m-data-source.js` (`Layer8MDataSource`) | Mobile view types |

`shared/layer8d-data-source.js`'s own header comment already claims to be "shared data fetching... for all view types (table, chart, kanban, etc.)" — but the table and both reference pickers never adopted it. This is very likely why `layer8d-table-pagination-metadata.md`'s pagination bug has been independently re-fixed 4 times in this codebase's history: there isn't one implementation to fix, there are five.

**A live bug was found as a byproduct of this audit:** `m/js/layer8m-reference-picker.js:150` reads `response.metadata?.keyCount?.counts?.Total` on every page fetch with no page-1 guard — the mobile reference picker will show a wrong total/page count once a user pages past page 1.

The remaining 8 findings are smaller (13–90 lines each) but follow the same pattern: desktop and mobile (or two desktop files) independently maintain the same parsing/state logic.

## 2. Goals

- Eliminate the 5-way query-builder/fetch/pagination-guard duplication by making `Layer8DDataSource` (desktop) and `Layer8MDataSource` (mobile) the single source of truth, with `Layer8DTable` and both reference pickers delegating to them internally.
- Fix the live mobile reference-picker pagination bug (immediately, independent of the larger refactor).
- Extract the smaller duplicated chunks (tags/multiselect, period dropdown, reference-picker config resolution, inline-table CRUD state, currency/percentage/hours parsing, datepicker grid math) into shared pure-function modules used by both platforms.
- **Preserve every existing public API exactly.** `Layer8DTable`, `Layer8DReferencePicker`, `Layer8MReferencePicker`, `Layer8DForms`, `Layer8MForms`, `Layer8DDatePicker`, and `Layer8MDatePicker` are consumed by every downstream project per `layer8d-api-reference.md` / `layer8m-api-reference.md`. This plan only changes internal implementation, never the documented public contract (constructor options, method signatures, callback shapes).

## 3. Non-goals

- No changes to consuming projects (l8erp, l8physio, etc.) — they pick this up automatically the next time each project re-vendors its `l8ui` submodule.
- No behavior changes beyond bug fixes explicitly called out (mobile reference-picker pagination guard, datepicker `maxDate` end-of-day/start-of-day drift). Everything else is a pure internal refactor — output (rendered HTML, network requests, L8Query strings) must be byte-identical before/after.
- No new features.

## 4. Duplication Audit Summary → Phase Mapping (traceability matrix)

| # | Finding | Platform | Files | Est. lines | Phase |
|---|---------|----------|-------|-----------|-------|
| 1 | `Layer8DTable` reimplements `Layer8DDataSource` | Desktop | `edit_table/layer8d-table-data.js` ↔ `shared/layer8d-data-source.js` | ~150 | Phase 8 |
| 2 | `Layer8MDataSource` reimplements `Layer8DDataSource` | Mobile | `m/js/layer8m-data-source.js` ↔ `shared/layer8d-data-source.js` | ~120 | Phase 7 |
| 3 | Desktop reference picker reimplements the query-builder pattern | Desktop | `reference_picker/layer8d-reference-picker-data.js` | ~90 | Phase 9 |
| 4 | Mobile reference picker reimplements the query-builder pattern | Mobile | `m/js/layer8m-reference-picker.js` | ~90 | Phase 9 |
| 5 | **Live bug:** mobile reference picker missing page-1 metadata guard | Mobile | `m/js/layer8m-reference-picker.js:150` | n/a | **Phase 1** |
| 6 | Reference-picker's own `debounce()` reimplements `Layer8DUtils.debounce` | Desktop | `reference_picker/layer8d-reference-picker-utils.js:55-61` | ~7 | Phase 2a |
| 7 | Tags/multiselect chip handlers copy-pasted verbatim | Desktop + Mobile | `shared/layer8d-forms-fields-ext.js:81-145` ↔ `m/js/layer8m-forms-fields-ext.js:399-463` | ~65×2 | Phase 2b |
| 8 | Period cascading-dropdown logic + constants duplicated 4× | Desktop + Mobile | `shared/layer8d-forms-fields-ext.js`, `shared/layer8d-forms-fields.js`, `m/js/layer8m-forms-fields-reference.js` (×2 sites) | ~18×4 + constants | Phase 2c |
| 9 | Currency/percentage/hours parse+format duplicated in spirit | Desktop + Mobile | `input_formatters/layer8d-input-formatter-types.js` ↔ `m/js/layer8m-forms-fields-ext.js`, `m/js/layer8m-forms.js` | ~40 | Phase 4 |
| 10 | Reference-picker config resolution (`data-ref-config` parsing/validation) | Desktop + Mobile | `shared/layer8d-forms-pickers.js:145-214` ↔ `m/js/layer8m-forms.js:371-458` | ~40 | Phase 5 |
| 11 | Inline-table CRUD state management (parse/splice/restringify) | Desktop + Mobile | `shared/layer8d-forms-pickers.js:223-287` ↔ `m/js/layer8m-forms-inline.js:26-89` | ~40 | Phase 5 |
| 12 | `isDateDisabled` duplicated + **drift bug** (maxDate end-of-day vs start-of-day) | Desktop + Mobile | `datepicker/layer8d-datepicker-utils.js:44-56` ↔ `m/js/layer8m-datepicker.js:145-157` | ~13×2 | Phase 3 |
| 13 | Calendar grid-math duplicated | Desktop + Mobile | `datepicker/layer8d-datepicker-calendar.js:119-197` ↔ `m/js/layer8m-datepicker.js:93-143` | ~65 | Phase 3 |

Every finding maps to a phase. No orphans.

## 5. Phased implementation

Phases are ordered lowest-risk/fastest-value first, ending with the highest-risk architectural change (`Layer8DTable`, the single most-used component in the entire ecosystem) last, once the supporting groundwork has proven itself in lower-stakes call sites.

### Phase 1 — Fix the live mobile reference-picker pagination bug (immediate)
Add the missing `page === 1` guard to `m/js/layer8m-reference-picker.js`'s `loadData()`, mirroring the guard already correct in `layer8d-reference-picker-data.js` and both DataSource implementations. Ships independently of everything below — this is a one-line-diff bug fix, not a refactor. (Superseded architecturally, but not made redundant, once Phase 9 lands — see Phase 9 note.)

### Phase 2 — Small mechanical extractions (low risk, fast wins)
- **2a.** Remove `reference_picker/layer8d-reference-picker-utils.js`'s local `debounce()`; call `Layer8DUtils.debounce` instead.
- **2b.** Extract the tags/multiselect chip handlers (`onTagKeydown`, `removeTag`, `toggleMultiselectDropdown`, `onMultiselectChange`, `removeMultiselectValue`) into a new shared file `shared/layer8-form-chips.js`, loaded on both platforms. `layer8d-forms-fields-ext.js` and `layer8m-forms-fields-ext.js` call into it instead of each carrying their own copy.
- **2c.** Extract the period cascading-dropdown constants (`PERIOD_MONTHS`, `PERIOD_QUARTERS`) and the rebuild-options logic into `shared/layer8-period-selector.js`. All 4 call sites (2 desktop, 2 mobile) switch to it.

### Phase 3 — Datepicker: extract shared calendar-grid math, fix the `maxDate` drift bug
Extract a shared, pure `shared/layer8-datepicker-grid.js` exposing:
- `isDateDisabled(timestamp, minDate, maxDate)` — fixes the drift bug in the same change by making both platforms use one implementation. Decision needed from reviewers: should `maxDate` be inclusive (end-of-day, desktop's current behavior) or exclusive (start-of-day, mobile's current behavior)? Recommend desktop's end-of-day semantics as canonical (matches user expectation that selecting "today" as maxDate allows picking today), but flagging for explicit sign-off since it's a behavior change on the mobile side.
- `buildCalendarGrid(year, month, firstDayOfWeek)` — returns cell descriptors (day number, in-month/prev-month/next-month, disabled) for the caller to render into its own DOM. Desktop's dynamic 35/42-cell grid and `firstDayOfWeek` option are preserved as parameters; mobile can keep its simpler fixed-grid rendering call but computes cells from the same function.
`datepicker/layer8d-datepicker-calendar.js`, `datepicker/layer8d-datepicker-utils.js`, and `m/js/layer8m-datepicker.js` are updated to call it instead of computing independently.

### Phase 4 — Extract shared currency/percentage/hours parse/format module
New `shared/layer8-field-parsers.js` (pure functions, no DOM): `formatCurrency`/`parseCurrency` (cents↔dollars), `formatPercentage`/`parsePercentage` (decimal↔percent), `formatHours`/`parseHours` (minutes↔`H:MM`) — extracted from `input_formatters/layer8d-input-formatter-types.js`, which becomes the thin caller for its `currency`/`percentage`/`hours` type definitions. `m/js/layer8m-forms-fields-ext.js` (display) and `m/js/layer8m-forms.js` (parse-back on save) switch from their inline reimplementations to calling this module — this is the fix for the "drift risk" finding: a future rounding/precision fix only needs to happen once.

### Phase 5 — Extract reference-picker config resolution and inline-table CRUD state
- New `shared/layer8-reference-config-resolver.js`: parses/validates a `data-ref-config` attribute, falls back to `getEndpointForModel`, pulls `displayFormat`/`selectColumns` overrides from the reference registry. `shared/layer8d-forms-pickers.js` and `m/js/layer8m-forms.js` both call it; each keeps its own final widget-attach call (`Layer8DReferencePicker.attach` vs `Layer8MReferencePicker.show`) since that part is legitimately platform-specific.
- New `shared/layer8-inline-table-state.js`: row parsing (`JSON.parse` of the hidden input), add/edit/delete via splice/push, restringify. `shared/layer8d-forms-pickers.js` and `m/js/layer8m-forms-inline.js` both call it; each keeps its own popup API calls (`Layer8DPopup` vs `Layer8MPopup`).

### Phase 6 — Extract a shared, transport-agnostic L8Query builder
New `shared/layer8-query-builder.js`: a pure function (no `fetch`, no DOM, no auth headers) that takes `{ modelName, selectColumns, baseWhereClause, filters (per-column map OR single free-text filter), sortColumn, sortDirection, page, pageSize, realtime }` and returns `{ query, invalidFilters }`. This is the piece that is byte-identical across all 5 existing implementations found in the audit (modulo the "specific columns vs `*`" and "per-column filters vs single free-text filter" variations, which become explicit parameters). No behavior change yet — this phase only creates the new module and unit-verifies it produces identical query strings to what each of the 5 existing call sites currently produces, for a representative set of inputs.

### Phase 7 — Wire `Layer8DDataSource` and `Layer8MDataSource` onto the shared query builder
Both become thin wrappers: call `shared/layer8-query-builder.js` for the query string, keep their own transport (`fetch`+`getAuthHeaders()` for desktop, `Layer8MAuth.get` for mobile) and their own page-1 metadata guard (logic now identical, but each still owns its own `fetchData` because the transport call itself differs). Verify: for a fixed set of table/view configs, network requests before and after are identical.

### Phase 8 — Refactor `Layer8DTable` to delegate to `Layer8DDataSource` internally
**Highest-risk phase — do last, and only after Phases 6–7 have shipped and soaked.** `Layer8DTable` keeps its exact existing public API (`buildQuery`, `fetchData(page, pageSize)`, `setBaseWhereClause`, `setData`, `setServerData`, `onDataLoaded(data, items, totalCount)` 3-arg callback, static helpers `tag`/`tags`/`countBadge`/`statusTag`) — none of that changes. Internally, `fetchData` constructs (or reuses) a `Layer8DDataSource` instance and translates its 1-arg `result` object callback into the 3-arg shape `Layer8DTable` consumers already expect. Also absorbs `Layer8DDataSource`'s existing WebSocket realtime-update handling (`_handleChangeNotification`) rather than keeping `Layer8DTable`'s own near-duplicate copy — verify realtime table use cases (marked `realtime: true`) still merge in-place updates and still trigger delete/add refetch-with-notification the same way.

### Phase 9 — Refactor both reference pickers to delegate to their platform's DataSource
`reference_picker/layer8d-reference-picker-data.js` and `m/js/layer8m-reference-picker.js` switch to constructing a `Layer8DDataSource`/`Layer8MDataSource` instance (configured for single-column-set + single free-text filter, per Phase 6's parameterization) instead of their own `buildQuery`/fetch logic. This is what makes Phase 1's manual bug fix permanent at the architecture level — the guard now lives in one place mobile can't drift away from again.

### Phase 10 — Final verification

Since `l8ui` has no example app or automated test harness of its own (it's a pure component library, copied into consuming projects via submodule per `l8ui-copy-to-new-project.md`), verification must happen by vendoring the changed `l8ui` into one real consuming project (recommend `l8erp`, the canonical reference project) and smoke-testing:

- [ ] Desktop table: load, paginate past page 2, filter (per-column), sort, verify page count stays correct across pages
- [ ] Desktop table: `realtime: true` table — trigger an update from another session, verify in-place row update; trigger add/delete, verify refetch-with-notification
- [ ] Mobile table/card list: load, paginate past page 2, filter, sort, verify page count stays correct across pages
- [ ] Desktop reference picker: search, paginate past page 2, verify total count stays correct, select an item
- [ ] Mobile reference picker: search, paginate past page 2, verify total count stays correct, select an item — this is the direct regression test for the Phase 1 bug fix
- [ ] Desktop chart/kanban/calendar/gantt/timeline/tree_grid views: verify they still load data (they already go through `Layer8DDataSource` — Phase 7 must not break them)
- [ ] Mobile chart/kanban/calendar/gantt/timeline/tree_grid views: verify they still load data (they already go through `Layer8MDataSource` — Phase 7 must not break them)
- [ ] Desktop: tags field add/remove, multiselect field add/remove
- [ ] Mobile: tags field add/remove, multiselect field add/remove
- [ ] Desktop: period field (month/quarter/year cascading selects)
- [ ] Mobile: period field (month/quarter/year cascading selects)
- [ ] Desktop: currency, percentage, hours fields — display formatting and save round-trip
- [ ] Mobile: currency, percentage, hours fields — display formatting and save round-trip
- [ ] Desktop: reference field inside a form (not a standalone picker) — config resolution, existing-value display
- [ ] Mobile: reference field inside a form (not a standalone picker) — config resolution, existing-value display
- [ ] Desktop: inline table field — add/edit/delete child rows
- [ ] Mobile: inline table field — add/edit/delete child rows
- [ ] Desktop: date picker — min/max date disabling (explicitly re-test the maxDate day itself), month navigation across a leap-year February
- [ ] Mobile: date picker — min/max date disabling (explicitly re-test the maxDate day itself), month navigation across a leap-year February

## 6. Risk & compatibility notes

- **This is the most widely-consumed code in the Layer 8 ecosystem.** `Layer8DTable` and the reference pickers are used by every project. Treat Phases 8–9 with the caution of a framework-interface change even though no interface is actually changing — an implementation bug here breaks tables everywhere, silently, the same way the pagination-metadata bug already has 4 times.
- Every phase must produce **zero change** to: rendered HTML output, network request shapes (URL + query string), and public method signatures — except the two explicitly-called-out bug fixes (Phase 1 / Phase 3's `maxDate` decision, Phase 9 permanently closing the same class of bug).
- Recommend each phase land as its own commit/PR, in the order above, so a regression can be bisected to one phase.
- New shared files (`shared/layer8-query-builder.js`, `shared/layer8-field-parsers.js`, `shared/layer8-form-chips.js`, `shared/layer8-period-selector.js`, `shared/layer8-reference-config-resolver.js`, `shared/layer8-inline-table-state.js`, `shared/layer8-datepicker-grid.js`) follow the existing precedent of `shared/` files being loaded on **both** desktop and mobile pages (same pattern as `Layer8DConfig`/`Layer8DUtils`/`Layer8DRenderers` today). Each must be added to the canonical desktop and mobile script-loading-order documentation, in dependency order, before the files that consume it.
- No file introduced by this plan is expected to exceed ~150 lines — well under the 500-line maintainability ceiling.

## 7. What's explicitly out of scope / already fine

Confirmed during the audit as **not** duplication and requiring no action:
- The mobile view-type wrappers (`m/js/layer8m-{chart,kanban,calendar,timeline,gantt,tree-grid,wizard}.js`) — already correctly thin wrappers delegating to their desktop core class + `Layer8MDataSource`. This is the pattern the rest of the codebase is being brought in line with.
- Desktop notification panel vs. mobile toast — legitimately different UX for the same concept, not copy-pasted logic.
- Per-module enum/column/form data files (`sys/security`, `l8agent`, `events`, `notify`) — this is the intended "configuration only" pattern via the shared factories (`Layer8EnumFactory`, `Layer8ColumnFactory`, `Layer8FormFactory`), not duplication.
