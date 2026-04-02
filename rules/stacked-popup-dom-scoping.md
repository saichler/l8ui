# Stacked Popup DOM Scoping

## Rule
Never use `document.getElementById()` or `document.querySelector()` to find elements inside a popup when the popup system supports stacking (nested modals). Always scope DOM lookups to the **active popup's body**.

## Why This Is Critical
The Layer8DPopup system uses a modal stack. When a child popup opens on top of a parent popup, both exist in the DOM simultaneously. If both popups contain elements with the same ID (e.g., `<form id="layer8d-edit-form">`), `document.getElementById()` returns the **first** one in DOM order — which is the stacked (hidden) parent, not the active child popup. This causes data to be read from or written to the wrong form.

## The Bug Pattern
```javascript
// WRONG — finds the parent form when a child popup is stacked on top
const form = document.getElementById('layer8d-edit-form');
const data = collectFromForm(form); // collects empty/wrong data
```

```javascript
// CORRECT — scopes to the active (topmost) popup
let form = null;
if (typeof Layer8DPopup !== 'undefined') {
    const body = Layer8DPopup.getBody(); // returns topmost non-stacked popup body
    if (body) {
        form = body.querySelector('#layer8d-edit-form');
    }
}
if (!form) {
    form = document.getElementById('layer8d-edit-form'); // fallback when no popup
}
```

## When This Applies
- Any code that reads form data from a popup (collectFormData, getFormData)
- Any code that writes to or manipulates DOM elements inside a popup
- Any code triggered by popup button callbacks (onSave, onShow) that needs to find elements
- Inline table row editors (child popups opened from within a parent edit form)

## Key APIs
- **Desktop**: `Layer8DPopup.getBody()` — returns the topmost non-stacked popup's body element
- **Mobile**: `popup.body` — passed directly to callbacks by `Layer8MPopup`, already scoped correctly

## Error Symptom
- Editing a child row in an inline table and pressing Save/Update results in blanked data
- Form data collected is empty or contains the parent form's values instead of the child form's
- No console errors — the failure is completely silent
