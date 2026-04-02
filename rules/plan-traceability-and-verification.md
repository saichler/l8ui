# Plan Traceability and Verification

## Rule
Every implementation plan MUST include:

1. **A traceability matrix** at the end of the analysis sections, before the phase breakdown. This is a table mapping every identified gap, MISSING item, or action item to the specific phase that will address it. Any gap without a corresponding phase is a planning error that must be resolved before the plan is written to `./plans/`.

2. **A final verification phase** as the last implementation phase. This phase smoke-tests every affected section end-to-end: navigate to each section, verify data loads in tables, verify row clicks open details, verify forms submit correctly. No plan is complete without it.

## Why This Matters
Analysis and implementation phases are often written separately. Thorough analysis can identify 50+ gaps, but if the phase breakdown is written without back-referencing those gaps, some will fall through the cracks. The traceability matrix forces a cross-check: every finding must land somewhere, and any orphan is visible immediately.

The verification phase catches integration issues that per-phase testing misses — blank tables, broken click handlers, missing transforms, wrong container IDs — problems that only surface when the full system is exercised.

## Traceability Matrix Format

After all analysis sections and before the phase breakdown:

```markdown
## Traceability Matrix

| # | Section | Gap / Action Item | Phase |
|---|---------|-------------------|-------|
| 1 | 1.3 Data Transform | Add transformDeviceData to mobile | Phase 2 |
| 2 | 1.4 Overview | Add System Name, Last Seen, Coordinates | Phase 1 |
| 3 | 4.1 K8s Columns | Add Namespace, NetworkPolicy column defs | Phase 2 |
| ...| ... | ... | ... |
```

Every row in every "Actions" or "MISSING" note from the analysis MUST appear in this table. If a gap is intentionally deferred, mark it as "Deferred — {reason}" instead of a phase number.

## Verification Phase Format

```markdown
## Phase N: End-to-End Verification

For every section affected by this plan:
1. Navigate to the section
2. Verify table data loads (not blank)
3. Verify row click opens detail/modal
4. Verify detail content is populated (not empty)
5. Verify CRUD operations work (if applicable)
6. Verify on both desktop and mobile (if both are in scope)

Sections to verify:
- [ ] Section A
- [ ] Section B
- [ ] ...
```

## Process
1. Write analysis sections with gaps and action items
2. Write the traceability matrix — one row per gap
3. Write the phase breakdown
4. Cross-check: every matrix row has a valid phase number
5. Add the verification phase as the final phase
6. Only then write the plan to `./plans/`
