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
// Step 2 of password recovery: set a new password using the emailed link.
//
// The link carries ?user=...&token=... . This page does NOT reuse
// L8SecurityChangePassword.attach(): that component always submits the
// current password, which the user does not have here. Only the shared
// strength-hints helper is reused.
document.addEventListener('DOMContentLoaded', function() {
    var DEFAULT_ENDPOINT = '/resetPassword';

    var form = document.getElementById('reset-form');
    var newPasswordInput = document.getElementById('new-password');
    var confirmPasswordInput = document.getElementById('confirm-password');
    var submitBtn = document.getElementById('reset-btn');
    var btnSpinner = document.getElementById('btn-spinner');
    var btnText = document.getElementById('btn-text');
    var messageDiv = document.getElementById('message');

    var params = new URLSearchParams(window.location.search);
    var userId = params.get('user');
    var token = params.get('token');

    if (typeof loadConfig === 'function') {
        loadConfig().then(applyLogo);
    }

    // applyLogo mirrors layer8d-login-state.js's own handling, so these pages
    // pick up a project's configured logo exactly like the login page.
    function applyLogo() {
        if (typeof LOGIN_CONFIG === 'undefined' || !LOGIN_CONFIG || !LOGIN_CONFIG.logo) {
            return;
        }
        var logoImg = document.querySelector('.app-logo');
        if (!logoImg) {
            return;
        }
        if (typeof Layer8DLogo !== 'undefined') {
            Layer8DLogo.register(logoImg, LOGIN_CONFIG.logo);
        } else {
            logoImg.src = LOGIN_CONFIG.logo;
        }
    }

    // No usable link: show the error state and no form at all.
    if (!userId || !token) {
        form.style.display = 'none';
        showMessage('This password reset link is incomplete. Please request a new one.', 'error');
        return;
    }

    if (window.L8SecurityPasswordStrength) {
        L8SecurityPasswordStrength.renderPasswordStrengthHints(newPasswordInput, null);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        resetPassword();
    });

    function endpoint() {
        if (typeof LOGIN_CONFIG !== 'undefined' && LOGIN_CONFIG && LOGIN_CONFIG.resetPasswordEndpoint) {
            return LOGIN_CONFIG.resetPasswordEndpoint;
        }
        return DEFAULT_ENDPOINT;
    }

    function resetPassword() {
        var newPassword = newPasswordInput.value;
        var confirmPassword = confirmPasswordInput.value;

        if (!newPassword || !confirmPassword) {
            showMessage('Please fill in both fields.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage('The two passwords do not match.', 'error');
            return;
        }

        setBusy(true);
        hideMessage();

        fetch(endpoint(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: userId, token: token, newPassword: newPassword })
        })
        .then(function(response) {
            return response.text().then(function(text) {
                return { status: response.status, text: text };
            });
        })
        .then(function(result) {
            if (result.status === 200) {
                form.style.display = 'none';
                showMessage('Your password has been reset. Redirecting to login...', 'success');
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 1500);
                return;
            }
            // Every failure (expired, already used, wrong token, weak password)
            // comes back as the server's own message.
            showMessage(result.text || 'Could not reset the password, please try again.', 'error');
        })
        .catch(function(error) {
            console.error('Error resetting password:', error);
            showMessage('Could not reset the password, please try again.', 'error');
        })
        .finally(function() {
            setBusy(false);
        });
    }

    function setBusy(busy) {
        submitBtn.disabled = busy;
        btnSpinner.style.display = busy ? 'inline-block' : 'none';
        btnText.textContent = busy ? 'Saving...' : 'Set new password';
    }

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = 'message ' + type;
    }

    function hideMessage() {
        messageDiv.className = 'message';
        messageDiv.textContent = '';
    }
});
