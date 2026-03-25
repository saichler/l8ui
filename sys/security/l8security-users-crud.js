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
// Security Users - Custom CRUD Handler
// Handles nested roles map in L8User via checkbox assignment

(function() {
    'use strict';

    var allRoles = {};

    // Fetch all roles for checkbox display
    async function fetchAllRoles() {
        try {
            var query = encodeURIComponent(JSON.stringify({ text: 'select * from L8Role' }));
            var response = await fetch(Layer8DConfig.resolveEndpoint('/74/roles') + '?body=' + query, {
                method: 'GET',
                headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}
            });
            if (!response.ok) return;
            var data = await response.json();
            allRoles = {};
            if (data && data.list) {
                data.list.forEach(function(role) {
                    allRoles[role.roleId] = role;
                });
            }
        } catch (e) {
            console.error('Error fetching roles:', e);
        }
    }

    // Generate role checkboxes HTML
    function generateRoleCheckboxes(userRoles) {
        var roleKeys = Object.keys(allRoles);
        if (roleKeys.length === 0) {
            return '<p style="color: #999; padding: 10px;">No roles available. Create roles first.</p>';
        }
        return roleKeys.map(function(roleId) {
            var role = allRoles[roleId];
            var checked = userRoles[roleId] === true ? ' checked' : '';
            return '<div class="l8sys-checkbox-item">' +
                '<input type="checkbox" id="role-' + Layer8DUtils.escapeAttr(roleId) + '" name="role-' + Layer8DUtils.escapeAttr(roleId) + '"' + checked + '>' +
                '<label for="role-' + Layer8DUtils.escapeAttr(roleId) + '">' + Layer8DUtils.escapeHtml(role.roleName) + ' (' + Layer8DUtils.escapeHtml(roleId) + ')</label>' +
                '</div>';
        }).join('');
    }

    // Generate account status select options
    function generateStatusOptions(currentStatus) {
        var statuses = [
            { value: 'ACCOUNT_STATUS_UNSPECIFIED', label: 'Unspecified' },
            { value: 'ACCOUNT_STATUS_ACTIVE', label: 'Active' },
            { value: 'ACCOUNT_STATUS_INACTIVE', label: 'Inactive' },
            { value: 'ACCOUNT_STATUS_LOCKED', label: 'Locked' },
            { value: 'ACCOUNT_STATUS_SUSPENDED', label: 'Suspended' },
            { value: 'ACCOUNT_STATUS_PENDING_ACTIVATION', label: 'Pending Activation' }
        ];
        return statuses.map(function(s) {
            var selected = currentStatus === s.value ? ' selected' : '';
            return '<option value="' + s.value + '"' + selected + '>' + s.label + '</option>';
        }).join('');
    }

    // Format timestamp for display
    function formatTimestamp(ts) {
        if (!ts || ts === '0' || ts === 0) return '-';
        var d = new Date(typeof ts === 'string' ? parseInt(ts, 10) : ts);
        return d.toLocaleString();
    }

    // Generate user form HTML
    function generateUserFormHtml(user, isEdit) {
        var userId = user ? user.userId || '' : '';
        var fullName = user ? user.fullName || '' : '';
        var email = user ? user.email || '' : '';
        var accountStatus = user ? user.accountStatus || 'ACCOUNT_STATUS_UNSPECIFIED' : 'ACCOUNT_STATUS_UNSPECIFIED';
        var fa = user ? user.fa || false : false;
        var mustChangePassword = user ? user.mustChangePassword || false : false;
        var userRoles = user ? user.roles || {} : {};

        var passwordSection = isEdit ? '' :
            '<div class="form-group">' +
            '<label for="l8sys-user-password">Password</label>' +
            '<input type="password" id="l8sys-user-password" name="l8sys-user-password" placeholder="Enter password" required>' +
            '</div>';

        var activitySection = '';
        if (isEdit && user) {
            activitySection =
                '<div class="form-group" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--layer8d-border);">' +
                '<label style="font-weight: 600;">Account Activity</label>' +
                '</div>' +
                '<div class="form-group"><label>Last Login</label><input type="text" value="' + formatTimestamp(user.lastLogin) + '" disabled></div>' +
                '<div class="form-group"><label>Last Failed Login</label><input type="text" value="' + formatTimestamp(user.lastFailedLogin) + '" disabled></div>' +
                '<div class="form-group"><label>Failed Login Count</label><input type="text" value="' + (user.failedLoginCount || 0) + '" disabled></div>' +
                '<div class="form-group"><label>Password Changed At</label><input type="text" value="' + formatTimestamp(user.passwordChangedAt) + '" disabled></div>' +
                '<div class="form-group"><label>Lockout Until</label><input type="text" value="' + formatTimestamp(user.lockoutUntil) + '" disabled></div>' +
                '<div class="form-group"><label>Auth Verified</label><input type="text" value="' + (user.faVerified ? 'Yes' : 'No') + '" disabled></div>';
        }

        return '<div class="form-group">' +
            '<label for="l8sys-user-id">User ID</label>' +
            '<input type="text" id="l8sys-user-id" name="l8sys-user-id" value="' + Layer8DUtils.escapeAttr(userId) + '"' + (isEdit ? ' disabled' : '') + ' required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="l8sys-user-fullname">Full Name</label>' +
            '<input type="text" id="l8sys-user-fullname" name="l8sys-user-fullname" value="' + Layer8DUtils.escapeAttr(fullName) + '" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="l8sys-user-email">Email</label>' +
            '<input type="email" id="l8sys-user-email" name="l8sys-user-email" value="' + Layer8DUtils.escapeAttr(email) + '">' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="l8sys-user-status">Account Status</label>' +
            '<select id="l8sys-user-status" name="l8sys-user-status">' + generateStatusOptions(accountStatus) + '</select>' +
            '</div>' +
            passwordSection +
            '<div class="form-group">' +
            '<input type="checkbox" id="l8sys-user-fa" name="l8sys-user-fa"' + (fa ? ' checked' : '') + '>' +
            '<label for="l8sys-user-fa"> First-Factor Auth</label>' +
            '</div>' +
            '<div class="form-group">' +
            '<input type="checkbox" id="l8sys-user-mustchange" name="l8sys-user-mustchange"' + (mustChangePassword ? ' checked' : '') + '>' +
            '<label for="l8sys-user-mustchange"> Must Change Password</label>' +
            '</div>' +
            '<div class="form-group">' +
            '<label>Assigned Roles</label>' +
            '<div class="l8sys-checkbox-list">' +
            generateRoleCheckboxes(userRoles) +
            '</div>' +
            '</div>' +
            activitySection;
    }

    // Collect selected roles from popup body
    function collectSelectedRoles(body) {
        var selectedRoles = {};
        var checkboxes = body.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function(cb) {
            if (cb.name && cb.name.startsWith('role-') && cb.checked) {
                var roleId = cb.name.replace('role-', '');
                selectedRoles[roleId] = true;
            }
        });
        return selectedRoles;
    }

    // Open Add User modal
    async function openAdd(service) {
        await fetchAllRoles();
        var formHtml = generateUserFormHtml(null, false);

        Layer8DPopup.show({
            title: 'Add User',
            content: formHtml,
            size: 'medium',
            showFooter: true,
            saveButtonText: 'Save',
            onSave: function() {
                handleSave(service, false);
            }
        });
    }

    // Open Edit User modal
    async function openEdit(service, userId) {
        await fetchAllRoles();

        var user = null;
        try {
            user = await Layer8DForms.fetchRecord(Layer8DConfig.resolveEndpoint(service.endpoint), 'userId', userId, 'L8User');
        } catch (e) {
            Layer8DNotification.error('Failed to load user');
            return;
        }
        if (!user) {
            Layer8DNotification.error('User not found');
            return;
        }

        var formHtml = generateUserFormHtml(user, true);

        Layer8DPopup.show({
            title: 'Edit User',
            content: formHtml,
            size: 'medium',
            showFooter: true,
            saveButtonText: 'Save',
            onSave: function() {
                handleSave(service, true, userId);
            }
        });
    }

    // Handle save
    async function handleSave(service, isEdit, existingUserId) {
        var body = Layer8DPopup.getBody();
        if (!body) return;

        var userIdEl = body.querySelector('#l8sys-user-id');
        var fullNameEl = body.querySelector('#l8sys-user-fullname');
        var emailEl = body.querySelector('#l8sys-user-email');
        var statusEl = body.querySelector('#l8sys-user-status');
        var faEl = body.querySelector('#l8sys-user-fa');
        var mustChangeEl = body.querySelector('#l8sys-user-mustchange');
        var passwordEl = body.querySelector('#l8sys-user-password');

        var userId = userIdEl ? userIdEl.value.trim() : '';
        var fullName = fullNameEl ? fullNameEl.value.trim() : '';

        if (!userId || !fullName) {
            Layer8DNotification.warning('Please fill in User ID and Full Name');
            return;
        }

        var selectedRoles = collectSelectedRoles(body);

        var userData;
        if (isEdit) {
            userData = {
                userId: existingUserId,
                fullName: fullName,
                email: emailEl ? emailEl.value.trim() : '',
                accountStatus: statusEl ? statusEl.value : 'ACCOUNT_STATUS_UNSPECIFIED',
                fa: faEl ? faEl.checked : false,
                mustChangePassword: mustChangeEl ? mustChangeEl.checked : false,
                roles: selectedRoles
            };
        } else {
            var password = passwordEl ? passwordEl.value : '';
            if (!password) {
                Layer8DNotification.warning('Password is required for new users');
                return;
            }
            userData = {
                userId: userId,
                fullName: fullName,
                email: emailEl ? emailEl.value.trim() : '',
                accountStatus: statusEl ? statusEl.value : 'ACCOUNT_STATUS_UNSPECIFIED',
                fa: faEl ? faEl.checked : false,
                mustChangePassword: mustChangeEl ? mustChangeEl.checked : false,
                password: { hash: password },
                roles: selectedRoles
            };
        }

        try {
            await Layer8DForms.saveRecord(Layer8DConfig.resolveEndpoint(service.endpoint), userData, isEdit);
            Layer8DPopup.close();
            L8Sys.refreshCurrentTable();
        } catch (e) {
            Layer8DNotification.error('Error saving user: ' + e.message);
        }
    }

    // Confirm delete
    function confirmDelete(service, userId) {
        var serviceConfig = {
            endpoint: Layer8DConfig.resolveEndpoint(service.endpoint),
            primaryKey: 'userId',
            modelName: 'L8User'
        };
        Layer8DForms.confirmDelete(serviceConfig, userId, function() {
            L8Sys.refreshCurrentTable();
        });
    }

    window.L8SysUsersCRUD = {
        openAdd: openAdd,
        openEdit: openEdit,
        confirmDelete: confirmDelete
    };

})();
