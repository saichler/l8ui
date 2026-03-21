# Architecture Overview

Both desktop and mobile follow a **configuration-driven module pattern**:
- All behavioral logic (CRUD, navigation, table rendering, form handling) lives in shared library components.
- Modules supply only **data**: configs, enums, columns, forms.
- A module is bootstrapped by a single factory call (desktop) or registry registration (mobile).

**Desktop** (`Layer8D*` prefix): Traditional table-based layout with sidebar navigation, tabs, and sub-navigation.
**Mobile** (`Layer8M*` prefix): Card-based responsive layout with hierarchical card drill-down navigation.

### Dependency Graph (Desktop)

```
Layer8DConfig
    |
Layer8DUtils  <--- Layer8DRenderers
    |
    +--- Factory Components
    |       Layer8EnumFactory
    |       Layer8RefFactory
    |       Layer8ColumnFactory
    |       Layer8FormFactory
    |       Layer8SvgFactory
    |       Layer8SectionGenerator / Layer8SectionConfigs
    |       Layer8ModuleConfigFactory
    |
    +--- Layer8DTable (class)
    +--- Layer8DDatePicker
    +--- Layer8DInputFormatter
    +--- Layer8DReferencePicker
    +--- Layer8DNotification
    +--- Layer8DPopup
    +--- Layer8DReferenceRegistry
    +--- Layer8DForms (facade)
    |       Layer8DFormsFields
    |       Layer8DFormsData
    |       Layer8DFormsPickers
    |       Layer8DFormsModal
    +--- Layer8DServiceRegistry
    +--- Layer8DModuleNavigation
    +--- Layer8DModuleCRUD
    +--- Layer8DToggleTree
    +--- Layer8DModuleFilter
    +--- Layer8DModuleFactory (orchestrates all)
    |
    +--- View System
    |       Layer8DViewFactory (registry + table auto-registered)
    |       Layer8ViewSwitcher (dropdown UI)
    |       Layer8DDataSource (shared fetch/pagination)
    |       Layer8DChart (bar/line/pie with type selector)
    |           Layer8DChartBar, Layer8DChartLine, Layer8DChartPie
    |       Layer8DKanban + Layer8DKanbanRender
    |       Layer8DTimeline
    |       Layer8DCalendar + Layer8DCalendarRender
    |       Layer8DGantt + Layer8DGanttRender
    |       Layer8DTreeGrid
    |       Layer8DWizard + Layer8DWizardRender
    +--- Layer8DWidget (dashboard KPI cards)
    +--- Layer8Markdown (markdown-to-HTML renderer)
    +--- L8AgentChat (AI chat interface)
```

### Dependency Graph (Mobile)

```
Layer8MConfig
    |
Layer8MAuth
Layer8MUtils
    |
    +--- Desktop Shared (loaded in mobile too)
    |       Layer8DConfig, Layer8DUtils, Layer8DRenderers
    |       Layer8DReferenceRegistry
    |       Layer8EnumFactory, Layer8RefFactory
    |       Layer8ColumnFactory, Layer8FormFactory
    |
    +--- Layer8MPopup
    +--- Layer8MConfirm
    +--- Layer8MTable (class)
    +--- Layer8MEditTable (extends Table)
    +--- Layer8MFormFields / Layer8MFormFieldsReference
    +--- Layer8MForms
    +--- Layer8MDatePicker
    +--- Layer8MReferenceRegistry
    +--- Layer8MReferencePicker
    +--- Layer8MRenderers
    +--- Layer8MModuleRegistry
    +--- Layer8DToggleTree, Layer8DModuleFilter
    +--- LAYER8M_NAV_CONFIG (data)
    +--- Layer8MNavCrud, Layer8MNavData
    +--- Layer8MNav (uses all above)
    |
    +--- View System (wraps desktop core components)
    |       Layer8MViewFactory (registry + table auto-registered)
    |       Layer8ViewSwitcher (shared with desktop)
    |       Layer8MChart, Layer8MKanban, Layer8MCalendar
    |       Layer8MTimeline, Layer8MGantt, Layer8MTreeGrid
    |       Layer8MWizard
    +--- Layer8MDataSource (mobile fetch/pagination)
    +--- L8AgentChatMobile (AI chat mobile)
```

## Project Structure

```
l8ui/
├── shared/              # Core: config, utils, renderers, factories, forms, data source,
│                        #   module system, CRUD, navigation, view factory, theme
├── edit_table/          # Editable data table with pagination, filtering, sorting
├── popup/               # Modal popup system with stacking support
├── reference_picker/    # Entity reference picker with search
├── datepicker/          # Date picker with calendar
├── input_formatters/    # Input masks and formatting (currency, phone, etc.)
├── chart/               # Charts: bar, line, pie
├── kanban/              # Kanban board with drag-and-drop
├── calendar/            # Calendar view
├── timeline/            # Timeline view
├── tree_grid/           # Hierarchical tree grid
├── gantt/               # Gantt chart
├── wizard/              # Multi-step wizard
├── dashboard/           # Dashboard KPI widgets
├── notification/        # Toast notifications
├── login/               # Login page with TFA support
├── register/            # User registration page with CAPTCHA
├── l8agent/             # AI Agent chat interface (desktop + mobile)
│   └── m/               #   Mobile AI agent chat
├── m/                   # Mobile components
│   ├── js/              #   Mobile JS (auth, nav, forms, table, popup, views, etc.)
│   └── css/             #   Mobile CSS
├── sys/                 # Built-in System module
│   ├── security/        #   Users, roles, credentials management
│   ├── modules/         #   Module management with dependency graph
│   ├── health/          #   System health monitoring
│   ├── logs/            #   Log file viewer with tree browser
│   └── dataimport/      #   CSV/JSON/XML import with AI-assisted mapping
├── images/              # Logo and brand images
└── font/                # Bundled fonts
```

### Usage

l8ui is designed to be copied into each Layer8 project's web directory:

```bash
cp -r l8ui/ <project>/go/<module>/ui/web/l8ui/
```

### Theming

All components use `--layer8d-*` CSS custom properties defined in `shared/layer8d-theme.css`. Dark mode is handled centrally via `[data-theme="dark"]` overrides on these tokens. Component CSS files should never contain their own dark mode blocks.
