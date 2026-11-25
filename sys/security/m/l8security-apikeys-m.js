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
// Security API Keys - shared mobile CRUD (L8SysApiKeysMobile)
// Projects only wire it: each function takes the service config
// ({endpoint, label, model, idField}) from the project's mobile Security config.
// The raw key is rendered only in the show-once popup.

(function() {
    'use strict';

    var LIFETIME_DAYS = [30, 90, 180, 365];
    var DEFAULT_LIFETIME_DAYS = 90;
    var SECONDS_PER_DAY = 86400;

    function endpointOf(service) {
        return Layer8MConfig.resolveEndpoint(service.endpoint);
    }

    function esc(v) {
        return Layer8MUtils.escapeHtml(v === undefined || v === null ? '' : String(v));
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

    function refreshTable() {
        var activeTable = window._Layer8MNavActiveTable;
        if (activeTable) activeTable.refresh();
    }

    function field(label, inputHtml) {
        return '<div class="mobile-form-field">' +
            '<label class="mobile-form-label">' + esc(label) + '</label>' + inputHtml + '</div>';
    }

    function nameFieldsHtml(name, description) {
        return field('Name', '<input type="text" id="m-apikey-name" class="mobile-form-input" maxlength="64" value="' +
                escAttr(name) + '" required>') +
            field('Description', '<textarea id="m-apikey-description" class="mobile-form-input" maxlength="512">' +
                esc(description) + '</textarea>');
    }

    function readOnly(label, value) {
        return field(label, '<input type="text" class="mobile-form-input" value="' + escAttr(value) + '" disabled>');
    }

    function readNameFields(body) {
        return {
            name: (body.querySelector('#m-apikey-name').value || '').trim(),
            description: (body.querySelector('#m-apikey-description').value || '').trim()
        };
    }

    // Card columns for Layer8MTable. Status is hidden: the card's status badge
    // renders it (Active, Revoked, Expired), so it is not repeated in the card.
    var columns = [
        { key: 'name', label: 'Name', primary: true },
        { key: 'status', label: 'Status', hidden: true,
            render: function(item) { return L8Security.render.apiKeyStatus(item.status, item); } },
        { key: 'expiresAt', label: 'Expires', render: function(item) { return esc(formatTime(item.expiresAt)); } },
        { key: 'lastUsedAt', label: 'Last Used', render: function(item) { return esc(formatTime(item.lastUsedAt)); } }
    ];

    // ===== Create =====

    function openAdd(service) {
        var options = LIFETIME_DAYS.map(function(days) {
            return '<option value="' + days + '"' + (days === DEFAULT_LIFETIME_DAYS ? ' selected' : '') + '>' +
                days + ' days</option>';
        }).join('');
        Layer8MPopup.show({
            title: 'Add API Key',
            content: nameFieldsHtml('', '') +
                field('Expires in', '<select id="m-apikey-lifetime" class="mobile-form-input">' + options + '</select>'),
            size: 'large',
            showFooter: true,
            saveButtonText: 'Create',
            onSave: function() { handleCreate(service); }
        });
    }

    async function handleCreate(service) {
        var body = Layer8MPopup.getBody();
        if (!body) return;
        var fields = readNameFields(body);
        if (!fields.name) {
            Layer8MUtils.showError('Please fill in Name');
            return;
        }
        var days = parseInt(body.querySelector('#m-apikey-lifetime').value, 10) || DEFAULT_LIFETIME_DAYS;
        var result;
        try {
            result = await Layer8MAuth.post(endpointOf(service), {
                name: fields.name,
                description: fields.description,
                expiresAt: Math.floor(Date.now() / 1000) + days * SECONDS_PER_DAY
            });
        } catch (e) {
            Layer8MUtils.showError('Error creating API key: ' + (e.message || e));
            return;
        }
        Layer8MPopup.close();
        var key = result && result.list && result.list[0] ? result.list[0].key : '';
        if (!key) {
            console.error('API key create: the response has no list[0].key', result);
            Layer8MUtils.showError('The API key was created, but the server did not return it');
            refreshTable();
            return;
        }
        showOnce(key);
    }

    function showOnce(key) {
        var content = '<p style="border-left:3px solid var(--layer8d-warning);padding:8px 12px;margin:0 0 12px;' +
            'color:var(--layer8d-text-dark);">Copy this key now. It is shown only once and cannot be retrieved again.</p>' +
            '<div class="m-apikey-box" style="font-family:monospace;font-size:13px;word-break:break-all;padding:10px 12px;' +
            'background:var(--layer8d-bg-input);color:var(--layer8d-text-dark);border:1px solid var(--layer8d-border);' +
            'border-radius:6px;user-select:all;">' + esc(key) + '</div>' +
            '<p style="font-size:12px;color:var(--layer8d-text-dark);">Send it as the ' +
            '<code>Authorization: Bearer &lt;key&gt;</code> header.</p>' +
            '<div style="display:flex;gap:8px;">' +
            '<button type="button" class="btn btn-primary" data-action="copy-key" style="flex:1;">Copy</button>' +
            '<button type="button" class="btn" data-action="close-key" style="flex:1;">Close</button>' +
            '</div>';

        Layer8MPopup.show({
            title: 'API Key Created',
            content: content,
            size: 'large',
            showFooter: false,
            onClose: function() { refreshTable(); },
            onShow: function(popup) {
                popup.body.addEventListener('click', function(e) {
                    var btn = e.target.closest('[data-action]');
                    if (!btn) return;
                    if (btn.dataset.action === 'copy-key') {
                        Layer8Clipboard.copyText(key).then(function() {
                            Layer8MUtils.showSuccess('Copied');
                        }, function(err) {
                            Layer8MUtils.showError('Copy failed: ' + err.message);
                        });
                    } else if (btn.dataset.action === 'close-key') {
                        Layer8MPopup.close();
                    }
                });
            }
        });
    }

    // ===== Details / Edit / Revoke =====

    function openEdit(service, item) {
        if (!item) {
            Layer8MUtils.showError('API key not found');
            return;
        }
        var content = nameFieldsHtml(item.name, item.description) +
            readOnly('Key ID', item.keyId) +
            readOnly('User ID', item.userId) +
            field('Status', '<div>' + L8Security.render.apiKeyStatus(item.status, item) + '</div>') +
            readOnly('Created', formatTime(item.createdAt)) +
            readOnly('Expires', formatTime(item.expiresAt)) +
            readOnly('Last Used', formatTime(item.lastUsedAt));
        if (isActive(item)) {
            content += '<button type="button" class="btn" data-action="revoke-key" style="width:100%;margin-top:8px;">Revoke</button>';
        } else {
            content += readOnly('Revoked', formatTime(item.revokedAt)) + readOnly('Revoked By', item.revokedBy);
        }

        Layer8MPopup.show({
            title: 'API Key',
            content: content,
            size: 'large',
            showFooter: true,
            saveButtonText: 'Save',
            onSave: function() { handleEditSave(service, item); },
            onShow: function(popup) {
                popup.body.addEventListener('click', function(e) {
                    if (e.target.closest('[data-action="revoke-key"]')) revoke(service, item);
                });
            }
        });
    }

    async function handleEditSave(service, item) {
        var body = Layer8MPopup.getBody();
        if (!body) return;
        var fields = readNameFields(body);
        if (!fields.name) {
            Layer8MUtils.showError('Please fill in Name');
            return;
        }
        try {
            await Layer8MAuth.patch(endpointOf(service), { keyId: item.keyId, name: fields.name, description: fields.description });
            Layer8MPopup.close();
            Layer8MUtils.showSuccess('API key saved');
            refreshTable();
        } catch (e) {
            Layer8MUtils.showError('Error saving API key: ' + (e.message || e));
        }
    }

    async function revoke(service, item) {
        var confirmed = await Layer8MConfirm.show({
            title: 'Revoke API Key',
            message: 'Revoke "' + (item.name || item.keyId) + '"? Every client using this key stops working immediately. This cannot be undone.',
            confirmText: 'Revoke',
            destructive: true
        });
        if (!confirmed) return;
        try {
            await Layer8MAuth.patch(endpointOf(service), { keyId: item.keyId, status: L8Security.enums.API_KEY_STATUS_REVOKED });
            Layer8MPopup.close();
            Layer8MUtils.showSuccess('API key revoked');
            refreshTable();
        } catch (e) {
            Layer8MUtils.showError('Error revoking API key: ' + (e.message || e));
        }
    }

    // ===== Delete =====

    async function confirmDelete(service, keyId) {
        var confirmed = await Layer8MConfirm.confirmDelete('API key "' + keyId + '"');
        if (!confirmed) return;
        try {
            await Layer8MAuth.delete(endpointOf(service), { text: "select * from L8ApiKey where keyId='" + keyId + "'" });
            Layer8MUtils.showSuccess('API key deleted');
            refreshTable();
        } catch (e) {
            Layer8MUtils.showError('Failed to delete API key: ' + (e.message || e));
        }
    }

    window.L8SysApiKeysMobile = {
        columns: columns,
        showDetails: openEdit,
        openAdd: openAdd,
        openEdit: openEdit,
        confirmDelete: confirmDelete
    };
})();
