/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// Security API Keys - Custom CRUD Handler (desktop)
// Create shows the raw key exactly once; edit renames or revokes; delete.
// Every endpoint comes from the service config passed in.

(function() {
    'use strict';

    var LIFETIME_DAYS = [30, 90, 180, 365];
    var DEFAULT_LIFETIME_DAYS = 90;
    var SECONDS_PER_DAY = 86400;

    function endpointOf(service) {
        return Layer8DConfig.resolveEndpoint(service.endpoint);
    }

    function esc(v) {
        return Layer8DUtils.escapeHtml(v === undefined || v === null ? '' : String(v));
    }

    function escAttr(v) {
        return Layer8DUtils.escapeAttr(v === undefined || v === null ? '' : String(v));
    }

    function formatTime(seconds) {
        var n = Number(seconds) || 0;
        return n > 0 ? Layer8DUtils.formatDateTime(n) : '-';
    }

    function isActive(key) {
        return Number(key.status) === L8Security.enums.API_KEY_STATUS_ACTIVE;
    }

    function nameFieldsHtml(name, description) {
        return '<div class="form-group">' +
            '<label for="l8sys-apikey-name">Name</label>' +
            '<input type="text" id="l8sys-apikey-name" name="name" maxlength="64" value="' + escAttr(name) + '" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="l8sys-apikey-description">Description</label>' +
            '<textarea id="l8sys-apikey-description" name="description" maxlength="512">' + esc(description) + '</textarea>' +
            '</div>';
    }

    function lifetimeHtml() {
        var options = LIFETIME_DAYS.map(function(days) {
            return '<option value="' + days + '"' + (days === DEFAULT_LIFETIME_DAYS ? ' selected' : '') + '>' +
                days + ' days</option>';
        }).join('');
        return '<div class="form-group">' +
            '<label for="l8sys-apikey-lifetime">Expires in</label>' +
            '<select id="l8sys-apikey-lifetime" name="l8sys-apikey-lifetime">' + options + '</select>' +
            '</div>';
    }

    function readOnlyHtml(label, value) {
        return '<div class="form-group">' +
            '<label>' + esc(label) + '</label>' +
            '<input type="text" value="' + escAttr(value) + '" disabled>' +
            '</div>';
    }

    function readNameFields(body) {
        return {
            name: (body.querySelector('[name="name"]').value || '').trim(),
            description: (body.querySelector('[name="description"]').value || '').trim()
        };
    }

    async function patchKey(service, data) {
        var resp = await fetch(endpointOf(service), {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!resp.ok) {
            var errText = await resp.text();
            throw new Error(errText || 'Failed to update API key');
        }
    }

    // ===== Create =====

    // The Add form is the model's form (L8Security.forms.L8ApiKey): Name and
    // Description are inputs, the server-set fields render display-only and empty.
    function openAdd(service) {
        Layer8DPopup.show({
            title: 'Add API Key',
            content: Layer8DFormsFields.generateFormHtml(L8Security.forms.L8ApiKey, {}) + lifetimeHtml(),
            size: 'medium',
            showFooter: true,
            saveButtonText: 'Create',
            onSave: function() { handleCreate(service); }
        });
    }

    async function handleCreate(service) {
        var body = Layer8DPopup.getBody();
        if (!body) return;
        var fields = readNameFields(body);
        if (!fields.name) {
            Layer8DNotification.warning('Please fill in Name');
            return;
        }
        var days = parseInt(body.querySelector('#l8sys-apikey-lifetime').value, 10) || DEFAULT_LIFETIME_DAYS;
        var data = {
            name: fields.name,
            description: fields.description,
            expiresAt: Math.floor(Date.now() / 1000) + days * SECONDS_PER_DAY
        };

        var result;
        try {
            result = await Layer8DForms.saveRecord(endpointOf(service), data, false);
        } catch (e) {
            Layer8DNotification.error('Error creating API key: ' + e.message);
            return;
        }
        Layer8DPopup.close();
        var key = result && result.list && result.list[0] ? result.list[0].key : '';
        if (!key) {
            console.error('API key create: the response has no list[0].key', result);
            Layer8DNotification.error('The API key was created, but the server did not return it');
            L8Sys.refreshCurrentTable();
            return;
        }
        showOnce(key);
    }

    function showOnce(key) {
        var content = '<div class="l8sys-apikey-warning">' +
            'Copy this key now. It is shown only once and cannot be retrieved again.' +
            '</div>' +
            '<div class="l8sys-apikey-box">' + esc(key) + '</div>' +
            '<p class="l8sys-apikey-hint">Send it as the <code>Authorization: Bearer &lt;key&gt;</code> header.</p>' +
            '<div class="l8sys-apikey-actions">' +
            '<button type="button" class="layer8d-btn layer8d-btn-primary" data-action="copy-key">Copy</button>' +
            '<button type="button" class="layer8d-btn layer8d-btn-secondary" data-action="close-key">Close</button>' +
            '</div>';

        Layer8DPopup.show({
            title: 'API Key Created',
            content: content,
            size: 'medium',
            showFooter: false,
            onCancel: function() { L8Sys.refreshCurrentTable(); },
            onShow: function(body) {
                body.addEventListener('click', function(e) {
                    var btn = e.target.closest('[data-action]');
                    if (!btn) return;
                    if (btn.dataset.action === 'copy-key') {
                        Layer8Clipboard.copyText(key).then(function() {
                            Layer8DNotification.success('Copied');
                        }, function(err) {
                            Layer8DNotification.error('Copy failed: ' + err.message);
                        });
                    } else if (btn.dataset.action === 'close-key') {
                        Layer8DPopup.close();
                        L8Sys.refreshCurrentTable();
                    }
                });
            }
        });
    }

    // ===== Edit / Revoke =====

    async function openEdit(service, keyId) {
        var key = null;
        try {
            key = await Layer8DForms.fetchRecord(endpointOf(service), 'keyId', keyId, 'L8ApiKey');
        } catch (e) {
            Layer8DNotification.error('Failed to load API key');
            return;
        }
        if (!key) {
            Layer8DNotification.error('API key not found');
            return;
        }

        var content = nameFieldsHtml(key.name, key.description) +
            readOnlyHtml('Key ID', key.keyId) +
            readOnlyHtml('User ID', key.userId) +
            '<div class="form-group"><label>Status</label><div>' +
            L8Security.render.apiKeyStatus(key.status, key) + '</div></div>' +
            readOnlyHtml('Created', formatTime(key.createdAt)) +
            readOnlyHtml('Expires', formatTime(key.expiresAt)) +
            readOnlyHtml('Last Used', formatTime(key.lastUsedAt));
        if (!isActive(key)) {
            content += readOnlyHtml('Revoked', formatTime(key.revokedAt)) +
                readOnlyHtml('Revoked By', key.revokedBy);
        } else {
            content += '<div class="l8sys-apikey-actions">' +
                '<button type="button" class="layer8d-btn layer8d-btn-secondary" data-action="revoke-key">Revoke</button>' +
                '</div>';
        }

        Layer8DPopup.show({
            title: 'Edit API Key',
            content: content,
            size: 'medium',
            showFooter: true,
            saveButtonText: 'Save',
            onSave: function() { handleEditSave(service, key); },
            onShow: function(body) {
                body.addEventListener('click', function(e) {
                    var btn = e.target.closest('[data-action="revoke-key"]');
                    if (btn) confirmRevoke(service, key);
                });
            }
        });
    }

    async function handleEditSave(service, key) {
        var body = Layer8DPopup.getBody();
        if (!body) return;
        var fields = readNameFields(body);
        if (!fields.name) {
            Layer8DNotification.warning('Please fill in Name');
            return;
        }
        try {
            await patchKey(service, { keyId: key.keyId, name: fields.name, description: fields.description });
            Layer8DPopup.close();
            L8Sys.refreshCurrentTable();
        } catch (e) {
            Layer8DNotification.error('Error saving API key: ' + e.message);
        }
    }

    function confirmRevoke(service, key) {
        Layer8DPopup.show({
            title: 'Revoke API Key',
            content: '<p>Revoke "' + esc(key.name) + '"? Every client using this key stops working immediately.</p>' +
                '<p>This cannot be undone.</p>',
            size: 'small',
            showFooter: true,
            saveButtonText: 'Revoke',
            onSave: async function() {
                try {
                    await patchKey(service, { keyId: key.keyId, status: L8Security.enums.API_KEY_STATUS_REVOKED });
                    Layer8DPopup.close();
                    Layer8DPopup.close();
                    L8Sys.refreshCurrentTable();
                } catch (e) {
                    Layer8DNotification.error('Error revoking API key: ' + e.message);
                }
            }
        });
    }

    // ===== Delete =====

    function confirmDelete(service, keyId) {
        var serviceConfig = {
            endpoint: endpointOf(service),
            primaryKey: 'keyId',
            modelName: 'L8ApiKey'
        };
        Layer8DForms.confirmDelete(serviceConfig, keyId, function() {
            L8Sys.refreshCurrentTable();
        });
    }

    window.L8SysApiKeysCRUD = {
        openAdd: openAdd,
        openEdit: openEdit,
        confirmDelete: confirmDelete
    };

})();
