# Layer8DChart

SVG chart component supporting bar, line, and pie/donut renderers. Auto-detects category and value fields from column definitions. Includes an inline chart type selector (bar | line | pie).

```js
const chart = new Layer8DChart({
    containerId: 'chart-container',
    columns: [...],                     // Column defs (for auto-detection)
    dataSource: dataSourceInstance,      // Layer8DDataSource
    viewConfig: {
        chartType: 'bar',              // 'bar'|'line'|'area'|'pie'|'donut'
        categoryField: 'status',       // Group-by field (auto-detected if omitted)
        valueField: 'amount',          // Value field (auto-detected if omitted)
        aggregation: 'count',          // 'count'|'sum'|'avg'|'min'|'max'
        title: 'Chart Title',
        colors: ['#0ea5e9', ...],      // Custom palette (uses theme if omitted)
        pageSize: 100                  // Fetch all data for chart
    },
    onItemClick: (item, label) => {},
    onAdd: () => {}
});
chart.init();
chart.setData(items, total);
chart.refresh();
chart.destroy();
```

Static utilities:
```js
Layer8DChart.readThemeColor('--layer8d-primary', '#0ea5e9')
Layer8DChart.getThemePalette()          // Array of 10 theme colors
```

Sub-renderers (internal, auto-dispatched by `chartType`):
- `Layer8DChartBar.render(chart, w, h)` -- vertical/horizontal bars
- `Layer8DChartLine.render(chart, w, h)` -- line/area with data points
- `Layer8DChartPie.render(chart, w, h)` -- pie/donut with legend

**Chart type selector:** An inline button group (Bar | Line | Pie) renders above the chart. Clicking a button updates `chartType` and re-renders the SVG without refetching data.

**Auto-detection priority:** When `categoryField` and `valueField` are not specified in `viewConfig`, the chart auto-detects them from columns in this order:
1. **Period columns** (`type: 'period'`) -- L8Period objects, grouped by period label
2. **Date columns** (`type: 'date'`) when money columns (`type: 'money'`) also exist -- timestamps normalized to year/quarter
3. **Status/type/category/health** patterns -- grouped by enum value
4. **Fallback** -- title field via `Layer8DViewFactory.detectTitleField()`

**Auto-enabled chart view:** The service registry automatically adds `'chart'` to a service's `supportedViews` when its columns include both a `type: 'date'` and a `type: 'money'` column. No manual `supportedViews` config is needed for date+money models.

**L8Period support:** When the `categoryField` contains L8Period objects (objects with `periodType`, `periodYear`, `periodValue` properties), the chart auto-detects them and converts each period to a human-readable label: `"2025"` (yearly), `"2025 / Q1"` (quarterly), or `"2025 / January"` (monthly). Records with the same period are grouped and aggregated. Groups are sorted chronologically.

**Date normalization:** When the `categoryField` contains Unix timestamps (from date columns), the chart normalizes them to year/quarter buckets. Labels use the format `"2025 / Q1"`. Records within the same quarter are grouped and their money values aggregated (default: sum). Groups are sorted chronologically. Timestamps may arrive as numeric strings (e.g., `"1770840462"`) -- both number and string formats are handled automatically.
