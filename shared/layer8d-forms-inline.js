/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/
/**
 * Inline Form — renders forms into a DOM container instead of a popup.
 * Mirrors Layer8DFormsModal exactly: same HTML generation, same context,
 * same pickers, same tab switching, same inline table handlers.
 *
 * Methods:
 *   renderViewForm  — mirrors openViewForm  (read-only, no footer)
 *   renderEditForm  — mirrors openEditForm  (editable, save/cancel)
 *   renderAddForm   — mirrors openAddForm   (empty, save/cancel)
 */
(function() {
    'use strict';

    /**
     * Shared: create probler-popup-body, set innerHTML, attach to container,
     * wire tab switching. Returns the body element.
     */
    function initBody(container, content) {
        var body = document.createElement('div');
        body.className = 'probler-popup-body';
        body.innerHTML = content;
        container.innerHTML = '';
        container.appendChild(body);

        // Tab switching via event delegation — same as Layer8DPopup.show (line 156-190)
        body.addEventListener('click', function(e) {
            var tab = e.target.closest('.probler-popup-tab');
            if (!tab) return;

            var tabId = tab.dataset.tab;
            if (!tabId) return;

            body.querySelectorAll('.probler-popup-tab').forEach(function(t) {
                t.classList.remove('active');
            });
            body.querySelectorAll('.probler-popup-tab-pane').forEach(function(p) {
                p.classList.remove('active');
            });

            tab.classList.add('active');
            var pane = body.querySelector('.probler-popup-tab-pane[data-pane="' + tabId + '"]');
            if (pane) {
                pane.classList.add('active');
            }
        });

        return body;
    }

    /**
     * Render a read-only form view into a container.
     * Mirrors openViewForm: generateFormHtml, setFormContext, attachDatePickers,
     * disable all inputs.
     */
    function renderViewForm(container, serviceConfig, formDef, data) {
        if (!container || !formDef || !data) return;

        var content = Layer8DFormsFields.generateFormHtml(formDef, data);
        var body = initBody(container, content);

        Layer8DFormsPickers.setFormContext(formDef, serviceConfig);

        // Attach pickers after a short delay — same as Layer8DPopup.show onShow setTimeout
        setTimeout(function() {
            Layer8DFormsPickers.attachDatePickers(body);
            body.querySelectorAll('input, select, textarea').forEach(function(el) {
                el.disabled = true;
            });
        }, 50);
    }

    /**
     * Render an editable form into a container (fetches record by ID first).
     * Mirrors openEditForm: fetchRecord, generateFormHtml, updateFormContext,
     * attachDatePickers, attachInlineTableHandlers, save/cancel footer.
     *
     * @param {Function} onCancel - Called when Cancel is clicked (mirrors popup close)
     */
    async function renderEditForm(container, serviceConfig, formDef, recordId, onSuccess, onCancel) {
        if (!container || !formDef) return;

        container.innerHTML = '<div style="text-align:center;padding:40px;color:#718096;">Loading...</div>';

        try {
            var record = await Layer8DFormsData.fetchRecord(
                serviceConfig.endpoint,
                serviceConfig.primaryKey,
                recordId,
                serviceConfig.modelName
            );

            if (!record) {
                container.innerHTML = '';
                Layer8DNotification.error('Record not found');
                return;
            }

            var content = Layer8DFormsFields.generateFormHtml(formDef, record);
            var body = initBody(container, content);

            var footer = buildFooter('Save', 'Cancel', handleSave, onCancel);
            container.appendChild(footer);

            Layer8DFormsPickers.updateFormContext({
                formDef: formDef,
                serviceConfig: serviceConfig,
                isEdit: true,
                recordId: recordId,
                onSuccess: onSuccess
            });

            // Attach pickers after a short delay — same as Layer8DPopup.show onShow setTimeout
            setTimeout(function() {
                Layer8DFormsPickers.attachDatePickers(body);
                Layer8DFormsPickers.attachInlineTableHandlers(body);
            }, 50);

        } catch (error) {
            container.innerHTML = '';
            Layer8DNotification.error('Error loading record', [error.message]);
        }
    }

    /**
     * Render an empty add form into a container.
     * Mirrors openAddForm: generateFormHtml (empty data), updateFormContext,
     * attachDatePickers, attachInlineTableHandlers, save/cancel footer.
     *
     * @param {Function} onCancel - Called when Cancel is clicked (mirrors popup close)
     */
    function renderAddForm(container, serviceConfig, formDef, onSuccess, onCancel) {
        if (!container || !formDef) return;

        var content = Layer8DFormsFields.generateFormHtml(formDef, {});
        var body = initBody(container, content);

        var footer = buildFooter('Save', 'Cancel', handleSave, onCancel);
        container.appendChild(footer);

        Layer8DFormsPickers.updateFormContext({
            formDef: formDef,
            serviceConfig: serviceConfig,
            isEdit: false,
            recordId: null,
            onSuccess: onSuccess
        });

        // Attach pickers after a short delay — same as Layer8DPopup.show onShow setTimeout
        setTimeout(function() {
            Layer8DFormsPickers.attachDatePickers(body);
            Layer8DFormsPickers.attachInlineTableHandlers(body);
        }, 50);
    }

    /**
     * Build a footer element with Save and Cancel buttons.
     * Same markup/classes as Layer8DPopup footer.
     * onCancel mirrors the popup's Cancel → close() behavior.
     */
    function buildFooter(saveText, cancelText, onSave, onCancel) {
        var footer = document.createElement('div');
        footer.className = 'probler-popup-footer';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.textContent = cancelText;
        if (typeof onCancel === 'function') {
            cancelBtn.addEventListener('click', onCancel);
        }

        var saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary';
        saveBtn.textContent = saveText;
        saveBtn.addEventListener('click', onSave);

        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
        return footer;
    }

    /**
     * Handle save — reads from getFormContext(), same as Layer8DFormsModal.handleFormSave.
     * Only difference: no Layer8DPopup.close() call (no popup to close).
     */
    async function handleSave() {
        var ctx = Layer8DFormsPickers.getFormContext();
        if (!ctx) return;

        var formDef = ctx.formDef;
        var serviceConfig = ctx.serviceConfig;
        var isEdit = ctx.isEdit;
        var recordId = ctx.recordId;
        var onSuccess = ctx.onSuccess;

        var data = Layer8DFormsData.collectFormData(formDef);
        var errors = Layer8DFormsData.validateFormData(formDef, data);

        if (errors.length > 0) {
            Layer8DNotification.error('Validation failed', errors.map(function(e) { return e.message; }));
            return;
        }

        if (isEdit && recordId) {
            data[serviceConfig.primaryKey] = recordId;
        }

        try {
            await Layer8DFormsData.saveRecord(serviceConfig.endpoint, data, isEdit);
            Layer8DFormsPickers.clearFormContext();
            if (onSuccess) onSuccess();
        } catch (error) {
            Layer8DNotification.error('Error saving', [error.message]);
        }
    }

    // Export
    window.Layer8DFormsInline = {
        renderViewForm: renderViewForm,
        renderEditForm: renderEditForm,
        renderAddForm: renderAddForm
    };

})();
