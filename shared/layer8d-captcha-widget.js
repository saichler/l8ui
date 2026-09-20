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
// Layer8DCaptchaWidget owns the captcha <img> on unauthenticated pages:
// fetching /captcha, decoding the base64 PNG into the image, and wiring the
// refresh button. It does NOT own the captcha answer input — that is a plain
// text input the calling page reads itself.
//
// Shared by register/index.html and login/forgot-password.html.
(function() {
    'use strict';

    // load fetches a fresh captcha into imageEl. onError, when given, is
    // called with the Error so the page can show its own message; the image's
    // alt text is always updated so the failure is visible either way.
    function load(imageEl, onError) {
        if (!imageEl) {
            console.error('Layer8DCaptchaWidget: no image element');
            return;
        }
        imageEl.src = '';
        imageEl.alt = 'Loading...';

        fetch('/captcha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load captcha');
            }
            return response.json();
        })
        .then(function(data) {
            if (data.captcha) {
                imageEl.src = 'data:image/png;base64,' + data.captcha;
                imageEl.alt = 'Captcha';
            }
        })
        .catch(function(error) {
            console.error('Error loading captcha:', error);
            imageEl.alt = 'Failed to load captcha';
            if (onError) {
                onError(error);
            }
        });
    }

    window.Layer8DCaptchaWidget = {
        // attach loads the first captcha and wires refreshBtnEl to reload it.
        attach: function(imageEl, refreshBtnEl, onError) {
            load(imageEl, onError);
            if (refreshBtnEl) {
                refreshBtnEl.addEventListener('click', function() {
                    load(imageEl, onError);
                });
            }
        },
        // reload re-fetches the captcha, e.g. after a failed submit.
        reload: function(imageEl, onError) {
            load(imageEl, onError);
        }
    };
})();
