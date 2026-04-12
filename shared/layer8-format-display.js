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
 * Layer8FormatDisplay - Shared field display value formatting
 * Used by both desktop (layer8d-forms-fields.js) and mobile (layer8m-forms-fields.js)
 * for read-only display rendering.
 *
 * This is a pure formatting function with no DOM dependencies (except richtext).
 * It is the SINGLE source of truth for value→display conversion.
 */
(function() {
    'use strict';

    var utils = typeof Layer8DUtils !== 'undefined' ? Layer8DUtils :
                typeof Layer8MUtils !== 'undefined' ? Layer8MUtils : null;

    function formatDate(value) {
        return utils ? utils.formatDate(value) : String(value);
    }

    function formatDateTime(value) {
        return utils ? utils.formatDateTime(value) : String(value);
    }

    function formatMoney(value) {
        return utils ? utils.formatMoney(value) : String(value);
    }

    function formatPercentage(value) {
        return utils ? utils.formatPercentage(value) : String(value);
    }

    /**
     * Determine the appropriate zero-value label for a date field
     */
    function getDateZeroLabel(fieldKey) {
        var lowerKey = (fieldKey || '').toLowerCase();
        if (lowerKey.includes('end') || lowerKey.includes('expir') || lowerKey.includes('termination')) {
            return 'N/A';
        }
        return 'Current';
    }

    /**
     * Format a field value for read-only display.
     * Every field type handled in the editable switch MUST have a case here.
     */
    function format(field, value) {
        if (value === null || value === undefined || value === '') return '-';

        // Zero-value handling for temporal types
        if (value === 0) {
            if (field.type === 'date' || field.type === 'datetime') {
                return getDateZeroLabel(field.key);
            }
            return '-';
        }

        switch (field.type) {
            case 'select':
                return (field.options && field.options[value] !== undefined)
                    ? String(field.options[value]) : String(value);

            case 'checkbox':
            case 'toggle':
                return value ? 'Yes' : 'No';

            case 'money':
                return formatMoney(value);

            case 'date':
                return formatDate(value);

            case 'datetime':
                return formatDateTime(value);

            case 'time':
                return String(value);

            case 'percentage':
                return formatPercentage(value);

            case 'currency':
                return formatMoney(value);

            case 'ssn':
                return typeof value === 'string' && value.length >= 4
                    ? '***-**-' + value.slice(-4) : String(value);

            case 'phone':
            case 'email':
            case 'url':
            case 'routingNumber':
            case 'ein':
            case 'colorCode':
                return String(value);

            case 'number':
            case 'rating':
            case 'hours':
            case 'slider':
                return String(value);

            case 'tags':
                return Array.isArray(value) ? value.join(', ') : String(value);

            case 'multiselect': {
                if (!Array.isArray(value)) return String(value);
                var opts = field.options || {};
                return value.map(function(v) { return opts[v] || String(v); }).join(', ');
            }

            case 'period': {
                if (typeof value !== 'object' || value === null) return String(value);
                var PERIOD_LABELS = {0: '', 1: 'Yearly', 2: 'Quarterly', 3: 'Monthly'};
                var PERIOD_MONTHS = {1:'Jan',2:'Feb',3:'Mar',4:'Apr',5:'May',6:'Jun',
                                     7:'Jul',8:'Aug',9:'Sep',10:'Oct',11:'Nov',12:'Dec'};
                var PERIOD_QUARTERS = {13:'Q1',14:'Q2',15:'Q3',16:'Q4'};
                var pType = value.periodType || 0;
                var pYear = value.periodYear || '';
                var pVal = value.periodValue || 0;
                var pLabel = PERIOD_LABELS[pType] || '';
                var vLabel = PERIOD_MONTHS[pVal] || PERIOD_QUARTERS[pVal] || '';
                return [pLabel, vLabel, pYear].filter(Boolean).join(' ');
            }

            case 'richtext':
                if (typeof value === 'string') {
                    if (typeof document !== 'undefined') {
                        var div = document.createElement('div');
                        div.innerHTML = value;
                        return div.textContent || div.innerText || '';
                    }
                    return value.replace(/<[^>]*>/g, '');
                }
                return String(value);

            case 'lookup':
            case 'text':
            case 'textarea':
            default:
                return String(value);
        }
    }

    window.Layer8FormatDisplay = {
        format: format,
        getDateZeroLabel: getDateZeroLabel
    };

})();
