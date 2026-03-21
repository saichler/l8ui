# Layer8DGantt

SVG-based Gantt chart for project scheduling with task bars, progress indicators, and dependency arrows.

```js
// Registered as 'gantt' view type
// viewConfig options:
{
    startDateField: 'startDate',       // Task start timestamp (auto-detected if omitted)
    endDateField: 'endDate',           // Task end timestamp (auto-detected if omitted)
    progressField: 'percentComplete',  // 0-100 completion percentage
    titleField: 'name',               // Task label (auto-detected via detectTitleField)
    dependencyField: 'dependencies',   // Array of dependent task IDs
    defaultZoom: 'week'                // 'day' | 'week' | 'month' | 'quarter' | 'year'
}
```

**Date field auto-detection:** When `startDateField` is not explicitly configured, the Gantt scans columns for date fields (`type: 'date'` or keys ending in `Date`, `Start`, `End`) and matches them to start/end roles using key patterns:
- **Start**: keys containing `start`, `begin`, or `from`
- **End**: keys containing `end`, `due`, `until`, `required`, or `expir`
- If only one pattern matches and there are 2+ date columns, the other date column is assigned to the missing role
- If a start column is found but no end column, the end field is inferred by replacing `Start` with `End` in the key (e.g., `plannedStartDate` -> `plannedEndDate`)

**Zoom levels:** Day, Week, Month, Quarter, and Year. Quarter groups cells by ~91 days; Year groups by ~365 days.

**Timestamp handling:** Timestamps from the server may arrive as numeric strings (e.g., `"1770840462"` instead of `1770840462`). The Gantt automatically coerces numeric strings to numbers for correct date parsing.
