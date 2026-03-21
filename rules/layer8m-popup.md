# Layer8MPopup

```js
Layer8MPopup.show({
    title: 'Edit Employee',
    content: '<div>...</div>',
    size: 'large',                             // 'small'|'medium'|'large'|'full'
    showFooter: true,
    saveButtonText: 'Save',
    cancelButtonText: 'Cancel',
    showCancelButton: true,
    onSave: (popup) => {},                     // popup.body for DOM access
    onShow: (popup) => {},                     // Called after render
    onTabChange: (tabId, popup) => {}          // Called when tab switches (50ms delay for layout)
});
Layer8MPopup.close()
Layer8MPopup.getBody()
```

## Layer8MConfirm

```js
const confirmed = await Layer8MConfirm.show({
    title: 'Confirm', message: 'Are you sure?',
    confirmText: 'Yes', cancelText: 'No', destructive: false
});
const confirmed = await Layer8MConfirm.confirmDelete('Employee Name');
```
