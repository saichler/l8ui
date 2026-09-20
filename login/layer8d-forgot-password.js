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
// Step 1 of password recovery: ask for a reset link.
//
// The server answers 200 whether or not the account exists (and whether or
// not the request was throttled), so this page always shows the same generic
// success message on 200 and never branches on the response body. Only a bad
// captcha (400) produces a different state, and that says nothing about the
// account.
document.addEventListener('DOMContentLoaded', function() {
    var DEFAULT_ENDPOINT = '/forgotPassword';
    var GENERIC_SUCCESS = 'If an account exists for that username/email, a reset link has been sent.';

    var form = document.getElementById('forgot-form');
    var captchaImage = document.getElementById('captcha-image');
    var refreshCaptchaBtn = document.getElementById('refresh-captcha');
    var captchaInput = document.getElementById('captcha');
    var userInput = document.getElementById('user-id');
    var submitBtn = document.getElementById('forgot-btn');
    var btnSpinner = document.getElementById('btn-spinner');
    var btnText = document.getElementById('btn-text');
    var messageDiv = document.getElementById('message');

    Layer8DCaptchaWidget.attach(captchaImage, refreshCaptchaBtn, onCaptchaError);

    // login.json may override the endpoint and the app logo; the defaults
    // match l8web's route and the shared logo the login page uses.
    if (typeof loadConfig === 'function') {
        loadConfig().then(applyLogo);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        requestReset();
    });

    function endpoint() {
        if (typeof LOGIN_CONFIG !== 'undefined' && LOGIN_CONFIG && LOGIN_CONFIG.forgotPasswordEndpoint) {
            return LOGIN_CONFIG.forgotPasswordEndpoint;
        }
        return DEFAULT_ENDPOINT;
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

    function onCaptchaError() {
        showMessage('Failed to load captcha. Please refresh.', 'error');
    }

    function requestReset() {
        var userId = userInput.value.trim();
        var captcha = captchaInput.value.trim();

        if (!userId || !captcha) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        setBusy(true);
        hideMessage();

        fetch(endpoint(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: userId, captcha: captcha })
        })
        .then(function(response) {
            return response.text().then(function(text) {
                return { status: response.status, text: text };
            });
        })
        .then(function(result) {
            if (result.status === 200) {
                // Identical for found / not found / throttled — never branch
                // on the body, or the page would leak account existence.
                showMessage(GENERIC_SUCCESS, 'success');
                form.reset();
                Layer8DCaptchaWidget.reload(captchaImage, onCaptchaError);
                return;
            }
            if (result.status === 400) {
                // Bad captcha: the only error the server distinguishes here.
                showMessage(result.text || 'Incorrect captcha.', 'error');
            } else {
                console.error('Forgot password failed with status', result.status, result.text);
                showMessage('Could not submit the request, please try again.', 'error');
            }
            captchaInput.value = '';
            Layer8DCaptchaWidget.reload(captchaImage, onCaptchaError);
        })
        .catch(function(error) {
            console.error('Error requesting password reset:', error);
            showMessage('Could not submit the request, please try again.', 'error');
            captchaInput.value = '';
            Layer8DCaptchaWidget.reload(captchaImage, onCaptchaError);
        })
        .finally(function() {
            setBusy(false);
        });
    }

    function setBusy(busy) {
        submitBtn.disabled = busy;
        btnSpinner.style.display = busy ? 'inline-block' : 'none';
        btnText.textContent = busy ? 'Sending...' : 'Send reset link';
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
