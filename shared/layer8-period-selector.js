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
// Layer8 Period Selector — shared data + option-building logic for the
// L8Period field type's cascading Type -> Year -> Value selects.
// Used identically by desktop (layer8d-forms-fields.js / layer8d-forms-fields-ext.js)
// and mobile (layer8m-forms-fields-reference.js). Each platform keeps its own
// outer <select> markup (classes, disabled/required attributes, onchange
// namespace) — only the period-type/value data and option-list construction
// live here.

(function() {
    'use strict';

    // periodType: 0/unset = Unspecified, 1 = Yearly, 2 = Quarterly, 3 = Monthly
    const PERIOD_TYPE_OPTIONS = [['', '-- Select --'], ['1', 'Yearly'], ['2', 'Quarterly'], ['3', 'Monthly']];

    const PERIOD_MONTHS = [
        [1, 'January'], [2, 'February'], [3, 'March'], [4, 'April'],
        [5, 'May'], [6, 'June'], [7, 'July'], [8, 'August'],
        [9, 'September'], [10, 'October'], [11, 'November'], [12, 'December']
    ];
    const PERIOD_QUARTERS = [[13, 'Q1'], [14, 'Q2'], [15, 'Q3'], [16, 'Q4']];

    /**
     * Returns the [value, label] option pairs applicable to a given period type.
     * Quarterly (2) -> quarters, Monthly (3) -> months, everything else -> none.
     */
    function getValueOptionsForType(periodType) {
        const t = Number(periodType);
        if (t === 2) return PERIOD_QUARTERS;
        if (t === 3) return PERIOD_MONTHS;
        return [];
    }

    /**
     * Builds the <option> tags (including the leading blank option) for the
     * period-value select, given a period type and the currently-selected value.
     * Pass selectedValue as undefined/null when rebuilding after a type change
     * (nothing should be marked selected in that case).
     */
    function buildValueOptionsHtml(periodType, selectedValue) {
        const options = getValueOptionsForType(periodType);
        let html = '<option value="">--</option>';
        for (const [val, lbl] of options) {
            html += `<option value="${val}"${Number(selectedValue) === val ? ' selected' : ''}>${lbl}</option>`;
        }
        return html;
    }

    window.Layer8PeriodSelector = {
        PERIOD_TYPE_OPTIONS,
        PERIOD_MONTHS,
        PERIOD_QUARTERS,
        getValueOptionsForType,
        buildValueOptionsHtml
    };

})();
