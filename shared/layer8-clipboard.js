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
/**
 * Layer8Clipboard - Shared plain-text copy for desktop and mobile.
 * Uses navigator.clipboard.writeText when present; outside a secure context it
 * falls back to a hidden textarea and execCommand('copy'), and rejects when the
 * browser refuses.
 *
 * Usage:
 *   Layer8Clipboard.copyText('some text').then(onCopied, onFailed);
 */
(function() {
    'use strict';

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
        // Not a secure context: the old way.
        return new Promise(function(resolve, reject) {
            var area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            document.body.removeChild(area);
            if (ok) resolve(); else reject(new Error('the browser refused to copy'));
        });
    }

    window.Layer8Clipboard = {
        copyText: copyText
    };
})();
