/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/
// Integration Config CRUD — direct popup handler (bypasses form-registry chain)

(function() {
    'use strict';

    var INTEGRATION_TYPES = { 0: 'Unspecified', 1: 'SMTP', 2: 'Webhook', 3: 'Slack', 4: 'PagerDuty', 5: 'Custom' };

    function resolveEndpoint(service) {
        return Layer8DConfig.resolveEndpoint(service.endpoint);
    }

    function buildForm(record) {
        record = record || {};
        var attrs = record.attributes || {};
        var typeOptions = Object.keys(INTEGRATION_TYPES).map(function(k) {
            var sel = String(record.type || 0) === k ? ' selected' : '';
            return '<option value="' + k + '"' + sel + '>' + INTEGRATION_TYPES[k] + '</option>';
        }).join('');

        return '<div class="layer8d-form-body">' +
            '<div class="layer8d-form-section"><div class="layer8d-form-section-title">Identity</div>' +
            '<div class="layer8d-form-row"><label>Name (e.g. "smtp") <span class="required">*</span></label>' +
            '<input type="text" data-field="name" value="' + esc(record.name || '') + '" class="layer8d-input" required/></div>' +
            '<div class="layer8d-form-row"><label>Type</label>' +
            '<select data-field="type" class="layer8d-input"><option value="">— Select —</option>' + typeOptions + '</select></div>' +
            '</div>' +
            '<div class="layer8d-form-section"><div class="layer8d-form-section-title">SMTP Settings</div>' +
            '<div class="layer8d-form-row"><label>SMTP Host</label>' +
            '<input type="text" data-field="host" value="' + esc(record.host || '') + '" class="layer8d-input" placeholder="smtp.gmail.com"/></div>' +
            '<div class="layer8d-form-row"><label>SMTP Port</label>' +
            '<input type="number" data-field="port" value="' + (record.port || '') + '" class="layer8d-input" placeholder="587"/></div>' +
            '<div class="layer8d-form-row"><label>Use STARTTLS</label>' +
            '<input type="checkbox" data-field="useTls"' + (record.useTls ? ' checked' : '') + '/></div>' +
            '<div class="layer8d-form-row"><label>From Email Address</label>' +
            '<input type="text" data-field="fromAddress" value="' + esc(record.fromAddress || '') + '" class="layer8d-input"/></div>' +
            '<div class="layer8d-form-row"><label>From Display Name</label>' +
            '<input type="text" data-field="fromName" value="' + esc(record.fromName || '') + '" class="layer8d-input" placeholder="Zumba with Erika"/></div>' +
            '</div>' +
            '<div class="layer8d-form-section"><div class="layer8d-form-section-title">Credentials</div>' +
            '<div class="layer8d-form-row"><label>SMTP Username</label>' +
            '<input type="text" data-field="attributes.username" value="' + esc(attrs.username || '') + '" class="layer8d-input"/></div>' +
            '<div class="layer8d-form-row"><label>SMTP Password</label>' +
            '<input type="text" data-field="attributes.password" value="' + esc(attrs.password || '') + '" class="layer8d-input"/></div>' +
            '<div class="layer8d-form-row"><label>Credential Key (security store)</label>' +
            '<input type="text" data-field="credentialKey" value="' + esc(record.credentialKey || '') + '" class="layer8d-input" placeholder="smtp"/></div>' +
            '</div>' +
            '<div class="layer8d-form-section"><div class="layer8d-form-section-title">Webhook / Advanced</div>' +
            '<div class="layer8d-form-row"><label>URL</label>' +
            '<input type="text" data-field="url" value="' + esc(record.url || '') + '" class="layer8d-input"/></div>' +
            '<div class="layer8d-form-row"><label>Retry Count</label>' +
            '<input type="number" data-field="retryCount" value="' + (record.retryCount || '') + '" class="layer8d-input"/></div>' +
            '<div class="layer8d-form-row"><label>Timeout (ms)</label>' +
            '<input type="number" data-field="timeoutMs" value="' + (record.timeoutMs || '') + '" class="layer8d-input"/></div>' +
            '</div>' +
            '</div>';
    }

    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    }

    // attributes is a map on the model: attributes.<k> inputs go into it, on
    // top of the record's other attribute entries so an edit keeps them.
    function collectData(container, record) {
        var data = {};
        var attrs = Object.assign({}, (record && record.attributes) || {});
        container.querySelectorAll('[data-field]').forEach(function(el) {
            var key = el.getAttribute('data-field');
            var value;
            if (el.type === 'checkbox') {
                value = el.checked;
            } else if (el.type === 'number') {
                value = el.value ? parseInt(el.value, 10) : 0;
            } else {
                value = el.value;
            }
            if (key.indexOf('attributes.') === 0) {
                var k = key.substring('attributes.'.length);
                if (value) attrs[k] = value; else delete attrs[k];
            } else {
                data[key] = value;
            }
        });
        data.attributes = attrs;
        return data;
    }

    function openAdd(service) {
        var endpoint = resolveEndpoint(service);
        var bodyEl = document.createElement('div');
        bodyEl.innerHTML = buildForm(null);

        Layer8DPopup.show({
            title: 'Add Integration Config',
            content: bodyEl,
            size: 'large',
            showFooter: true,
            saveButtonText: 'Save',
            cancelButtonText: 'Cancel',
            onSave: function() {
                var data = collectData(bodyEl);
                if (!data.name) {
                    Layer8DNotification.error('Name is required');
                    return false;
                }
                return Layer8DForms.saveRecord(endpoint, data, false).then(function() {
                    Layer8DNotification.success('Integration Config saved');
                    L8Sys.refreshCurrentTable();
                }).catch(function(e) {
                    Layer8DNotification.error('Save failed: ' + e.message);
                });
            }
        });
    }

    function openEdit(service, id) {
        var endpoint = resolveEndpoint(service);
        Layer8DForms.fetchRecord(endpoint, 'integrationId', id, 'IntegrationConfig').then(function(record) {
            var bodyEl = document.createElement('div');
            bodyEl.innerHTML = buildForm(record);

            Layer8DPopup.show({
                title: 'Edit Integration Config',
                content: bodyEl,
                size: 'large',
                showFooter: true,
                saveButtonText: 'Save',
                cancelButtonText: 'Cancel',
                onSave: function() {
                    var data = collectData(bodyEl, record);
                    data.integrationId = id;
                    if (!data.name) {
                        Layer8DNotification.error('Name is required');
                        return false;
                    }
                    return Layer8DForms.saveRecord(endpoint, data, true).then(function() {
                        Layer8DNotification.success('Integration Config saved');
                        L8Sys.refreshCurrentTable();
                    }).catch(function(e) {
                        Layer8DNotification.error('Save failed: ' + e.message);
                    });
                }
            });
        }).catch(function(e) {
            Layer8DNotification.error('Failed to load record: ' + e.message);
        });
    }

    function confirmDelete(service, id) {
        var endpoint = resolveEndpoint(service);
        Layer8DForms.confirmDelete(
            { endpoint: endpoint, primaryKey: 'integrationId', modelName: 'IntegrationConfig' },
            id,
            function() { L8Sys.refreshCurrentTable(); }
        );
    }

    window.L8SysIntegrationCRUD = {
        openAdd: openAdd,
        openEdit: openEdit,
        confirmDelete: confirmDelete
    };

})();
