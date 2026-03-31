/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/
/**
 * ERP Form Component
 * One rendering pipeline for popup and inline form contexts.
 * openViewForm, openEditForm, openAddForm accept an optional container parameter:
 *   - With container: renders form into the container
 *   - Without container: renders form into Layer8DPopup
 * Same form. Same code. Same DOM element. Same activation.
 */
(function() {
    'use strict';

    // ========================================
    // RENDERING PIPELINE
    // ========================================

    /**
     * Render form HTML into a body element, wire tab switching, set form context.
     */
    function renderFormIntoBody(bodyEl, formDef, data, serviceConfig, opts) {
        bodyEl.innerHTML = Layer8DFormsFields.generateFormHtml(formDef, data);

        // Tab switching via event delegation
        bodyEl.addEventListener('click', function(e) {
            var tab = e.target.closest('.probler-popup-tab');
            if (!tab) return;
            var tabId = tab.dataset.tab;
            if (!tabId) return;
            bodyEl.querySelectorAll('.probler-popup-tab').forEach(function(t) { t.classList.remove('active'); });
            bodyEl.querySelectorAll('.probler-popup-tab-pane').forEach(function(p) { p.classList.remove('active'); });
            tab.classList.add('active');
            var pane = bodyEl.querySelector('.probler-popup-tab-pane[data-pane="' + tabId + '"]');
            if (pane) pane.classList.add('active');
        });

        // Set form context for reference picker resolution
        if (opts.isEdit !== undefined) {
            Layer8DFormsPickers.updateFormContext({
                formDef: formDef,
                serviceConfig: serviceConfig,
                isEdit: opts.isEdit,
                recordId: opts.recordId || null,
                onSuccess: opts.onSuccess || null
            });
        } else {
            Layer8DFormsPickers.setFormContext(formDef, serviceConfig);
        }
    }

    /**
     * Attach pickers and optionally disable all inputs.
     */
    function activateForm(bodyEl, opts) {
        Layer8DFormsPickers.attachDatePickers(bodyEl);
        if (opts.attachInlineTableHandlers) {
            Layer8DFormsPickers.attachInlineTableHandlers(bodyEl);
        }
        if (opts.disableInputs) {
            bodyEl.querySelectorAll('input, select, textarea').forEach(function(el) {
                el.disabled = true;
            });
        }
    }

    // ========================================
    // SAVE LOGIC
    // ========================================

    function performSave(closePopup) {
        var ctx = Layer8DFormsPickers.getFormContext();
        var data = Layer8DFormsData.collectFormData(ctx.formDef);
        var errors = Layer8DFormsData.validateFormData(ctx.formDef, data);

        if (errors.length > 0) {
            Layer8DNotification.error('Validation failed', errors.map(function(e) { return e.message; }));
            return;
        }

        if (ctx.isEdit && ctx.recordId) {
            data[ctx.serviceConfig.primaryKey] = ctx.recordId;
        }

        Layer8DFormsData.saveRecord(ctx.serviceConfig.endpoint, data, ctx.isEdit).then(function() {
            if (closePopup) Layer8DPopup.close();
            Layer8DFormsPickers.clearFormContext();
            if (ctx.onSuccess) ctx.onSuccess();
        }).catch(function(error) {
            Layer8DNotification.error('Error saving', [error.message]);
        });
    }

    function handleFormSave() { performSave(true); }
    function handleInlineSave() { performSave(false); }

    // ========================================
    // INLINE FOOTER BUILDER
    // ========================================

    function buildInlineFooter(saveText, cancelText, onSave, onCancel) {
        var footer = document.createElement('div');
        footer.className = 'probler-popup-footer';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = cancelText;
        cancelBtn.addEventListener('click', onCancel);

        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = saveText;
        saveBtn.addEventListener('click', onSave);

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        return footer;
    }

    // ========================================
    // FORM FUNCTIONS (popup or container)
    // ========================================

    function openViewForm(serviceConfig, formDef, data, container) {
        var bodyEl = document.createElement('div');
        bodyEl.className = 'probler-popup-body';
        renderFormIntoBody(bodyEl, formDef, data, serviceConfig, {});

        if (container) {
            container.innerHTML = '';
            container.appendChild(bodyEl);
        } else {
            Layer8DPopup.show({
                title: formDef.title + ' Details',
                content: bodyEl,
                size: 'large',
                showFooter: false
            });
        }

        activateForm(bodyEl, { disableInputs: true });
    }

    async function openEditForm(serviceConfig, formDef, recordId, onSuccess, container, onCancel) {
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Loading...</div>';
        } else {
            Layer8DPopup.show({
                title: 'Edit ' + formDef.title,
                content: '<div style="text-align:center;padding:40px;color:#718096;">Loading...</div>',
                size: 'large',
                showFooter: false
            });
        }

        var record = await Layer8DFormsData.fetchRecord(
            serviceConfig.endpoint, serviceConfig.primaryKey, recordId, serviceConfig.modelName
        );

        var bodyEl = document.createElement('div');
        bodyEl.className = 'probler-popup-body';
        renderFormIntoBody(bodyEl, formDef, record, serviceConfig, {
            isEdit: true, recordId: recordId, onSuccess: onSuccess
        });

        if (container) {
            container.innerHTML = '';
            container.appendChild(bodyEl);
            container.appendChild(buildInlineFooter('Save', 'Cancel', handleInlineSave, onCancel));
        } else {
            Layer8DPopup.close();
            Layer8DPopup.show({
                title: 'Edit ' + formDef.title,
                content: bodyEl,
                size: 'large',
                showFooter: true,
                saveButtonText: 'Save',
                cancelButtonText: 'Cancel',
                onSave: handleFormSave
            });
        }

        activateForm(bodyEl, { attachInlineTableHandlers: true });
    }

    function openAddForm(serviceConfig, formDef, onSuccess, container, onCancel) {
        var bodyEl = document.createElement('div');
        bodyEl.className = 'probler-popup-body';
        renderFormIntoBody(bodyEl, formDef, {}, serviceConfig, {
            isEdit: false, onSuccess: onSuccess
        });

        if (container) {
            container.innerHTML = '';
            container.appendChild(bodyEl);
            container.appendChild(buildInlineFooter('Save', 'Cancel', handleInlineSave, onCancel));
        } else {
            Layer8DPopup.show({
                title: 'Add ' + formDef.title,
                content: bodyEl,
                size: 'large',
                showFooter: true,
                saveButtonText: 'Save',
                cancelButtonText: 'Cancel',
                onSave: handleFormSave
            });
        }

        activateForm(bodyEl, { attachInlineTableHandlers: true });
    }

    function confirmDelete(serviceConfig, recordId, onSuccess) {
        Layer8DPopup.show({
            title: 'Confirm Delete',
            content: '<div class="delete-message">' +
                '<p>Are you sure you want to delete this record?</p>' +
                '<p style="color: var(--layer8d-error); font-weight: 600;">This action cannot be undone.</p>' +
                '</div>',
            size: 'small',
            showFooter: true,
            saveButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            onSave: async function() {
                await Layer8DFormsData.deleteRecord(serviceConfig.endpoint, recordId, serviceConfig.primaryKey, serviceConfig.modelName);
                Layer8DPopup.close();
                if (onSuccess) onSuccess();
            }
        });
    }

    // ========================================
    // EXPORT
    // ========================================

    window.Layer8DFormsModal = {
        openAddForm: openAddForm,
        openEditForm: openEditForm,
        openViewForm: openViewForm,
        confirmDelete: confirmDelete,
        handleFormSave: handleFormSave
    };

    // Backward compatibility — delegates to the same functions
    window.Layer8DFormsInline = {
        renderViewForm: function(container, serviceConfig, formDef, data) {
            openViewForm(serviceConfig, formDef, data, container);
        },
        renderEditForm: function(container, serviceConfig, formDef, recordId, onSuccess, onCancel) {
            openEditForm(serviceConfig, formDef, recordId, onSuccess, container, onCancel);
        },
        renderAddForm: function(container, serviceConfig, formDef, onSuccess, onCancel) {
            openAddForm(serviceConfig, formDef, onSuccess, container, onCancel);
        }
    };

})();
