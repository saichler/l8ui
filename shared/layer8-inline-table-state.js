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
// Layer8 Inline Table State — shared read/write of an inline table field's
// row data, stored as JSON in a hidden <input>. Used identically by desktop
// (shared/layer8d-forms-pickers.js attachInlineTableHandlers) and mobile
// (m/js/layer8m-forms-inline.js initInlineTableHandlers).
//
// Scope note: only the JSON parse/stringify primitives are shared here. The
// surrounding event-delegation (click target selectors, isReadOnly detection,
// card vs. row DOM shape, rerender rendering) differs enough between
// platforms that it stays in each platform's own file — this module doesn't
// touch the DOM beyond the one hidden input it's given.

(function() {
    'use strict';

    /**
     * Reads and parses the row array from a hidden input's JSON value.
     * Returns [] if empty or malformed.
     */
    function getRows(hiddenInput) {
        try { return JSON.parse(hiddenInput.value || '[]'); } catch (e) { return []; }
    }

    /**
     * Serializes `rows` back into the hidden input's value.
     */
    function setRows(hiddenInput, rows) {
        hiddenInput.value = JSON.stringify(rows);
    }

    window.Layer8InlineTableState = { getRows, setRows };

})();
