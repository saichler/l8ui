# L8UI Theme Compliance

## Rule
All UI components in the `l8ui/` directory MUST use the canonical `--layer8d-*` CSS custom properties defined in `layer8d-theme.css`. Never introduce generic/unprefixed CSS variable names (e.g., `--accent-color`, `--bg-primary`, `--text-primary`) in component CSS files.

## CSS Variables

### Required Token Usage
| Purpose | Use | Never Use |
|---------|-----|-----------|
| Primary accent | `var(--layer8d-primary)` | `var(--accent-color, ...)` |
| White/card background | `var(--layer8d-bg-white)` | `var(--bg-primary, #ffffff)` |
| Light background | `var(--layer8d-bg-light)` | `var(--bg-secondary, ...)` |
| Input background | `var(--layer8d-bg-input)` | `var(--bg-tertiary, ...)` |
| Dark text | `var(--layer8d-text-dark)` | `var(--text-primary, ...)` |
| Medium text | `var(--layer8d-text-medium)` | `var(--text-secondary, ...)` |
| Light text | `var(--layer8d-text-light)` | `var(--text-tertiary, ...)` |
| Muted text | `var(--layer8d-text-muted)` | hardcoded `#718096` etc. |
| Border | `var(--layer8d-border)` | `var(--border-color, ...)` |
| Status colors | `var(--layer8d-success)`, `var(--layer8d-warning)`, `var(--layer8d-error)` | hardcoded hex |

### No Per-View Dark Mode Blocks
Dark mode is handled centrally in `layer8d-theme.css` via `[data-theme="dark"]` overrides on `--layer8d-*` tokens. Component CSS files MUST NOT contain their own `[data-theme="dark"]` blocks. If a component uses `--layer8d-*` tokens, dark mode works automatically.

## Buttons
Reuse the shared button classes from `layer8d-theme.css`:
- `layer8d-btn layer8d-btn-primary layer8d-btn-small` for primary actions
- `layer8d-btn layer8d-btn-secondary layer8d-btn-small` for secondary actions

Do NOT create per-view button styles (e.g., `.layer8d-kanban-add-btn`, `.layer8d-wizard-btn-primary`).

## JavaScript Color References
JS render files MUST NOT hardcode hex color values for theme-dependent elements (backgrounds, text, borders, chart palettes). Instead:

1. Use `Layer8DChart.readThemeColor(varName, fallback)` for individual colors
2. Use `Layer8DChart.getThemePalette()` for chart/data visualization color arrays
3. Cache theme colors at the start of a render pass if reading multiple values

### Example
```javascript
// WRONG
const color = '#3b82f6';
const colors = ['#0ea5e9', '#22c55e', '#f59e0b'];

// CORRECT
const color = Layer8DChart.readThemeColor('--layer8d-primary', '#0ea5e9');
const colors = Layer8DChart.getThemePalette();
```

## Verification
After creating or modifying any l8ui component CSS/JS:
1. `grep 'var(--accent-color\|var(--bg-primary\|var(--text-primary\|var(--border-color' <file>` should return nothing
2. `grep '#3b82f6' <file>` should return nothing (old indigo accent)
3. No `[data-theme="dark"]` blocks in the component CSS
4. `node -c <file>` passes for any modified JS files
