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
// Shared self-service "Change Password" component.
//
// Two call sites, by design (see plans/user-password-security-hardening.md
// Phase 11): the voluntary "My Password" entry point wired up below in the
// SYS Security module, and the forced login gate. Both share the same form
// markup, strength hints, and submit logic via wireForm() -- only the chrome
// differs: open() renders wireForm() inside a Layer8DPopup for the SYS
// module; a full-page caller (e.g. the login gate) can call attach()
// directly into its own container instead.

(function() {
    'use strict';

    var USERS_ENDPOINT = '/73/users';

    function authHeaders() {
        if (typeof getAuthHeaders === 'function') {
            return getAuthHeaders();
        }
        var token = sessionStorage.getItem('bearerToken');
        return {
            'Authorization': token ? 'Bearer ' + token : '',
            'Content-Type': 'application/json'
        };
    }

    function currentUserId() {
        return sessionStorage.getItem('currentUser') || '';
    }

    function buildFormHtml() {
        return '' +
            '<div class="form-group">' +
            '<label for="l8scp-current">Current Password</label>' +
            '<input type="password" id="l8scp-current" name="l8scp-current" autocomplete="current-password" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="l8scp-new">New Password</label>' +
            '<input type="password" id="l8scp-new" name="l8scp-new" autocomplete="new-password" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="l8scp-confirm">Confirm New Password</label>' +
            '<input type="password" id="l8scp-confirm" name="l8scp-confirm" autocomplete="new-password" required>' +
            '</div>';
    }

    // wireForm attaches strength hints and returns { submit } for a form
    // whose markup (from buildFormHtml()) already exists inside `container`.
    // This is the actual shared logic -- both attach() and open() below
    // funnel through it, so there is exactly one submit/validation path
    // regardless of chrome (bare container vs. Layer8DPopup).
    //
    // options:
    //   userId    - defaults to the logged-in user (sessionStorage.currentUser)
    //   policy    - L8PasswordPolicy-shaped object for strength hints (optional)
    //   onSuccess - called after a successful password change
    function wireForm(container, options) {
        options = options || {};

        var newInput = container.querySelector('#l8scp-new');
        if (window.L8SecurityPasswordStrength && newInput) {
            window.L8SecurityPasswordStrength.renderPasswordStrengthHints(newInput, options.policy || null);
        }

        function submit() {
            var currentEl = container.querySelector('#l8scp-current');
            var newEl = container.querySelector('#l8scp-new');
            var confirmEl = container.querySelector('#l8scp-confirm');

            var current = currentEl ? currentEl.value : '';
            var next = newEl ? newEl.value : '';
            var confirmVal = confirmEl ? confirmEl.value : '';

            if (!current || !next || !confirmVal) {
                Layer8DNotification.warning('Please fill in all fields');
                return Promise.resolve(false);
            }
            if (next !== confirmVal) {
                Layer8DNotification.warning('New password and confirmation do not match');
                return Promise.resolve(false);
            }

            var userId = options.userId || currentUserId();

            return fetch(Layer8DConfig.resolveEndpoint(USERS_ENDPOINT), {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({
                    userId: userId,
                    password: { hash: current },
                    newPassword: next
                })
            }).then(function(resp) {
                if (!resp.ok) {
                    return resp.text().then(function(errText) {
                        throw new Error(errText || 'Failed to change password');
                    });
                }
                Layer8DNotification.success('Password changed successfully');
                if (typeof options.onSuccess === 'function') options.onSuccess();
                return true;
            }).catch(function(e) {
                Layer8DNotification.error('Error changing password: ' + e.message);
                return false;
            });
        }

        return { submit: submit };
    }

    // attach renders the change-password form into `container` and wires it
    // via wireForm(). For bare, non-popup callers (e.g. a future full-page
    // login gate) that own their own container.
    function attach(container, options) {
        container.innerHTML = buildFormHtml();
        return wireForm(container, options);
    }

    // open renders the shared form inside a Layer8DPopup -- used by the
    // voluntary "My Password" entry point in the SYS Security module.
    function open(options) {
        options = options || {};
        var instance = null;

        Layer8DPopup.show({
            title: 'Change Password',
            content: buildFormHtml(),
            size: 'small',
            showFooter: true,
            saveButtonText: 'Change Password',
            onShow: function(body) {
                instance = wireForm(body, options);
            },
            onSave: function() {
                if (!instance) return;
                instance.submit().then(function(ok) {
                    if (ok) Layer8DPopup.close();
                });
            }
        });
    }

    // initEntryPoint injects a "My Password" action into the Security
    // module's sub-navigation, alongside Users/Roles/Credentials/Events.
    // Called from l8sys-init.js once the System section's DOM exists.
    function initEntryPoint() {
        var subnav = document.querySelector('.l8-module-content[data-module="security"] .l8-subnav');
        if (!subnav || subnav.querySelector('.l8security-my-password-btn')) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'l8-subnav-item l8security-my-password-btn';
        btn.textContent = 'My Password';
        // .l8-subnav-item is normally an <a> -- reset default <button> chrome
        // so it matches the existing Users/Roles/Credentials/Events items.
        btn.style.background = 'none';
        btn.style.border = 'none';
        btn.style.borderLeft = '3px solid transparent';
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.font = 'inherit';
        btn.addEventListener('click', function(e) {
            // No data-service attribute -- stop this from also reaching the
            // generic subnav delegated handler in layer8d-module-navigation.js,
            // which would otherwise try (and safely no-op) to load a table
            // view for an undefined service key.
            e.stopPropagation();
            open({});
        });
        subnav.appendChild(btn);
    }

    window.L8SecurityChangePassword = {
        attach: attach,
        open: open,
        initEntryPoint: initEntryPoint,
        buildFormHtml: buildFormHtml
    };

})();
