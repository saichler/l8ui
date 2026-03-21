# Layer8DPopup

```js
Layer8DPopup.show({
    title: 'Edit Employee',                // Plain text title
    titleHtml: '<b>Custom</b> Title',      // HTML title (overrides title)
    content: '<div>...</div>',             // Body HTML
    size: 'large',                         // 'small'|'medium'|'large'|'xlarge'
    showFooter: true,                      // Show cancel/save buttons
    saveButtonText: 'Save',
    cancelButtonText: 'Cancel',
    noPadding: false,                      // Remove body padding
    onSave: (formData) => {},              // Save callback
    onShow: (body) => {}                   // Called 50ms after popup appears
});

Layer8DPopup.close()                       // Close topmost
Layer8DPopup.closeAll()                    // Close all stacked
Layer8DPopup.updateContent('<html>')       // Replace body HTML
Layer8DPopup.updateTitle('New Title')
Layer8DPopup.getBody()                     // Get body element
```

Built-in tab support via event delegation:
```html
<div class="probler-popup-tabs">
    <div class="probler-popup-tab active" data-tab="overview">Overview</div>
    <div class="probler-popup-tab" data-tab="details">Details</div>
</div>
<div class="probler-popup-tab-content">
    <div class="probler-popup-tab-pane active" data-pane="overview">...</div>
    <div class="probler-popup-tab-pane" data-pane="details">...</div>
</div>
```
