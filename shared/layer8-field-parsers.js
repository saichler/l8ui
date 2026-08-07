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
// Layer8 Field Parsers — shared pure numeric conversions for form fields
// whose stored value uses a different unit than its display value.
//
// Scope note: only conversions VERIFIED to use the same convention on both
// desktop and mobile are here. Percentage was investigated and found to use
// DIFFERENT conventions per platform (desktop's Layer8DInputFormatter
// percentage type treats the stored value as already being percent-points;
// mobile treats it as a decimal fraction and multiplies/divides by 100) —
// that is a pre-existing cross-platform inconsistency, not simple
// duplication, and is intentionally NOT touched here. Hours label->minutes
// parsing also differs in malformed-input handling between platforms (desktop
// falls back to parsing decimal hours; mobile defaults to 0) and is left
// as-is on each platform — only the minutes->label display direction, which
// is identical on both, is shared.

(function() {
    'use strict';

    /**
     * Cents (integer) -> dollars (Number, unformatted). Inverse of dollarsToCents.
     */
    function centsToDollars(cents, decimals = 2) {
        return Number(cents) / Math.pow(10, decimals);
    }

    /**
     * Dollars (Number or numeric string) -> cents (rounded integer). Inverse of centsToDollars.
     */
    function dollarsToCents(dollars, decimals = 2) {
        return Math.round(Number(dollars) * Math.pow(10, decimals));
    }

    /**
     * Total minutes (integer) -> "H:MM" display label.
     */
    function minutesToHoursLabel(totalMinutes) {
        const total = parseInt(totalMinutes, 10);
        const hours = Math.floor(total / 60);
        const minutes = total % 60;
        return `${hours}:${String(minutes).padStart(2, '0')}`;
    }

    window.Layer8FieldParsers = {
        centsToDollars,
        dollarsToCents,
        minutesToHoursLabel
    };

})();
