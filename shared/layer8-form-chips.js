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
// Layer8 Form Chips — shared tags/multiselect chip interaction handlers.
// Used by both Layer8DFormsFields (desktop) and Layer8MFormFields (mobile) —
// identical DOM/state logic, only escaping helpers and the onclick-embedded
// namespace name differ per platform, both passed in via create().

(function() {
    'use strict';

    /**
     * @param {{ escapeHtml: Function, escapeAttr: Function, namespace: string }} options
     *   namespace — the global object name the generated HTML's inline onclick
     *   attributes reference (e.g. 'Layer8DFormsFields' or 'Layer8MFormFields').
     * @returns {{ onTagKeydown, removeTag, toggleMultiselectDropdown, onMultiselectChange, removeMultiselectValue }}
     */
    function create(options) {
        const escapeHtml = options.escapeHtml;
        const escapeAttr = options.escapeAttr;
        const ns = options.namespace;

        function onTagKeydown(event, input) {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const val = input.value.trim();
            if (!val) return;
            const wrapper = input.closest('.l8-tags-wrapper');
            const hidden = wrapper.querySelector('input[data-tags-value]');
            const chips = wrapper.querySelector('.l8-tags-chips');
            let arr = [];
            try { arr = JSON.parse(hidden.value || '[]'); } catch (e) { arr = []; }
            if (arr.includes(val)) { input.value = ''; return; }
            arr.push(val);
            hidden.value = JSON.stringify(arr);
            const chip = document.createElement('span');
            chip.className = 'l8-tag-chip';
            chip.innerHTML = `${escapeHtml(val)}<span class="l8-tag-remove" onclick="${ns}.removeTag(this)">&times;</span>`;
            chips.appendChild(chip);
            input.value = '';
        }

        function removeTag(removeBtn) {
            const chip = removeBtn.parentElement;
            const wrapper = chip.closest('.l8-tags-wrapper');
            const hidden = wrapper.querySelector('input[data-tags-value]');
            const tagText = chip.firstChild.textContent;
            let arr = [];
            try { arr = JSON.parse(hidden.value || '[]'); } catch (e) { arr = []; }
            arr = arr.filter(t => t !== tagText);
            hidden.value = JSON.stringify(arr);
            chip.remove();
        }

        function toggleMultiselectDropdown(trigger) {
            const dropdown = trigger.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }

        function onMultiselectChange(checkbox) {
            const wrapper = checkbox.closest('.l8-multiselect-wrapper');
            const hidden = wrapper.querySelector('input[data-multiselect-value]');
            const chips = wrapper.querySelector('.l8-multiselect-chips');
            const dropdownEl = wrapper.querySelector('.l8-multiselect-dropdown');
            const checked = dropdownEl.querySelectorAll('input[type="checkbox"]:checked');
            const fieldOptions = {};
            dropdownEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                fieldOptions[cb.value] = cb.parentElement.textContent.trim();
            });
            const values = [];
            let chipsHtml = '';
            checked.forEach(cb => {
                const numVal = parseInt(cb.value, 10);
                values.push(isNaN(numVal) ? cb.value : numVal);
                const label = fieldOptions[cb.value] || cb.value;
                chipsHtml += `<span class="l8-tag-chip">${escapeHtml(label)}<span class="l8-tag-remove" onclick="${ns}.removeMultiselectValue(this, '${escapeAttr(cb.value)}')">&times;</span></span>`;
            });
            hidden.value = JSON.stringify(values);
            chips.innerHTML = chipsHtml;
        }

        function removeMultiselectValue(removeBtn, val) {
            const wrapper = removeBtn.closest('.l8-multiselect-wrapper');
            const dropdownEl = wrapper.querySelector('.l8-multiselect-dropdown');
            const cb = dropdownEl.querySelector(`input[value="${val}"]`);
            if (cb) { cb.checked = false; onMultiselectChange(cb); }
        }

        return {
            onTagKeydown,
            removeTag,
            toggleMultiselectDropdown,
            onMultiselectChange,
            removeMultiselectValue
        };
    }

    window.Layer8FormChips = { create };

})();
