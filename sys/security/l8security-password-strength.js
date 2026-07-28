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
// Password Strength Hints - shared UX helper
// Renders a live-updating list of password requirements next to a password
// input, sourced from an L8PasswordPolicy-shaped object. UX only -- the
// server (go/secure/provider/PasswordPolicy.go) remains the source of truth
// and independently rejects non-compliant passwords.
//
// Shared by l8security-change-password.js (Change Password form) and
// l8security-users-crud.js (Admin Add-user form) -- do not duplicate this
// logic in either consumer.

(function() {
    'use strict';

    // Mirrors the server's shipped default (go/secure/provider/PasswordPolicy.go
    // defaultPasswordPolicy) for use when no policy object is supplied.
    var DEFAULT_POLICY = {
        minLength: 10,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSpecialChar: true
    };

    function buildRules(policy) {
        var p = policy && policy.minLength ? policy : DEFAULT_POLICY;
        var rules = [];

        rules.push({
            key: 'length',
            label: 'At least ' + p.minLength + ' characters',
            test: function(v) { return v.length >= p.minLength; }
        });
        if (p.requireUppercase) {
            rules.push({ key: 'upper', label: 'One uppercase letter', test: function(v) { return /[A-Z]/.test(v); } });
        }
        if (p.requireLowercase) {
            rules.push({ key: 'lower', label: 'One lowercase letter', test: function(v) { return /[a-z]/.test(v); } });
        }
        if (p.requireDigit) {
            rules.push({ key: 'digit', label: 'One digit', test: function(v) { return /[0-9]/.test(v); } });
        }
        if (p.requireSpecialChar) {
            rules.push({ key: 'special', label: 'One special character', test: function(v) { return /[^A-Za-z0-9]/.test(v); } });
        }
        return rules;
    }

    // renderPasswordStrengthHints attaches a live hint list after `inputEl`
    // that updates on every keystroke. `policy` is an L8PasswordPolicy-shaped
    // object ({ minLength, requireUppercase, requireLowercase, requireDigit,
    // requireSpecialChar }) or null/undefined to use the default above.
    function renderPasswordStrengthHints(inputEl, policy) {
        if (!inputEl || !inputEl.parentNode) return null;

        var rules = buildRules(policy);

        var list = document.createElement('ul');
        list.className = 'l8security-password-hints';
        rules.forEach(function(rule) {
            var li = document.createElement('li');
            li.setAttribute('data-rule', rule.key);
            li.textContent = rule.label;
            list.appendChild(li);
        });

        inputEl.parentNode.insertBefore(list, inputEl.nextSibling);

        function update() {
            var value = inputEl.value || '';
            rules.forEach(function(rule) {
                var li = list.querySelector('[data-rule="' + rule.key + '"]');
                if (!li) return;
                var met = rule.test(value);
                li.classList.toggle('l8security-hint-met', met);
                li.classList.toggle('l8security-hint-unmet', !met);
            });
        }

        inputEl.addEventListener('input', update);
        update();

        return list;
    }

    window.L8SecurityPasswordStrength = {
        renderPasswordStrengthHints: renderPasswordStrengthHints
    };

})();
