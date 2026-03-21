# Layer8DWizard

Multi-step wizard view with step navigation, progress indicator, and per-step content rendering.

```js
// Registered as 'wizard' view type
// viewConfig options:
{
    steps: [
        { key: 'info', label: 'Basic Info', fields: ['name', 'code'] },
        { key: 'config', label: 'Configuration', fields: ['type', 'status'] },
        { key: 'review', label: 'Review' }
    ]
}
```
