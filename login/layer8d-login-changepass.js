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
// Layer 8 - Login Page Forced Change-Password Gate
// Part 3.5 of 4 - Load after login-tfa.js, before login-ui.js
//
// Client-side-only gate, matching the TFA precedent in layer8d-login-tfa.js
// (see plans/user-password-security-hardening.md Phase 10/5): nothing on the
// server blocks a user who bypasses this some other way, but the login flow
// itself will not proceed past it without a successful change. There is no
// "back to login" link on this screen -- it cannot be dismissed.
//
// Reuses the shared component built for Phase 11
// (l8ui/sys/security/l8security-change-password.js) rather than
// reimplementing the form/validation/submit logic here.

let changePasswordInstance = null;

// Show the forced change-password gate.
function showChangePasswordRequired() {
    changePasswordRequired = true;

    document.getElementById('login-section').style.display = 'none';
    document.getElementById('change-password-section').classList.add('visible');
    hideError();

    // The shared component authenticates its PATCH using whatever token is
    // in sessionStorage -- stash the freshly-issued token/username now so it
    // resolves correctly even though the normal post-login redirect hasn't
    // happened yet.
    sessionStorage.setItem('bearerToken', pendingAuth.token);
    sessionStorage.setItem('currentUser', pendingAuth.username);

    const container = document.getElementById('change-password-container');
    const ready = window.Layer8DConfig ? Layer8DConfig.load() : Promise.resolve();

    ready.then(() => {
        changePasswordInstance = window.L8SecurityChangePassword.attach(container, {
            userId: pendingAuth.username,
            onSuccess: completeLoginAfterPasswordChange
        });
    });
}

// Called once the forced password change succeeds -- completes the login
// flow exactly as a normal (non-gated) login would.
function completeLoginAfterPasswordChange() {
    const rememberMe = document.getElementById('remember-me').checked;
    handleLoginSuccess(
        { token: pendingAuth.token, portal: pendingAuth.portal },
        pendingAuth.username,
        rememberMe
    );
}

// Handle change-password form submission
async function handleChangePasswordSubmit(event) {
    event.preventDefault();

    if (isLoading || !changePasswordInstance) return;

    setChangePasswordLoading(true);
    try {
        await changePasswordInstance.submit();
    } finally {
        setChangePasswordLoading(false);
    }
}

// Set change-password submit loading state
function setChangePasswordLoading(loading) {
    isLoading = loading;
    const spinner = document.getElementById('change-password-spinner');
    const btnText = document.getElementById('change-password-btn-text');

    if (loading) {
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Changing...';
    } else {
        spinner.style.display = 'none';
        btnText.textContent = 'Change Password';
    }
}
