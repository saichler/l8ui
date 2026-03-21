# Layer8DWidget

Dashboard KPI card component for rendering stats with trends, sparklines, and mini charts.

```js
// Render a single KPI card
Layer8DWidget.render(
    { label: 'Total Revenue', icon: '$', onClick: () => {} },
    1500000,                           // Value (auto-formats to 1.5M)
    {
        trend: 'up',                   // 'up' | 'down'
        trendValue: 12.5,             // Percentage change
        sparklineData: [10, 20, 15, 30, 25],  // SVG sparkline
        sparklineColor: '#22c55e'
    }
)

// Render a grid of KPI widgets
Layer8DWidget.renderEnhancedStatsGrid(kpis, iconMap)   // Returns HTML string
```
