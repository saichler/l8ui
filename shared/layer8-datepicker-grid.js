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
// Layer8 Datepicker Grid — shared pure calendar-grid math and min/max date
// checking. Used by both desktop (datepicker/layer8d-datepicker-*.js) and
// mobile (m/js/layer8m-datepicker.js). Neither function touches the DOM —
// each platform renders its own markup from the returned data.
//
// Note: `isDateDisabled` used to be duplicated with two different max-date
// time-of-day conventions (desktop: end-of-day 23:59:59.999, mobile:
// start-of-day 00:00:00.000). Verified empirically that this produced
// IDENTICAL day-level results on both platforms, because every caller always
// passes a midnight-normalized `date` (calendar cells represent whole days,
// never a specific time) — so end-of-day vs start-of-day for `max` never
// changes which calendar day is the last enabled one. This module keeps
// desktop's end-of-day convention as the single implementation since it is
// the more defensive choice if a caller ever passes a non-midnight date.

(function() {
    'use strict';

    /**
     * Whether `date` (a JS Date) falls outside the [minDate, maxDate] range.
     * minDate/maxDate are Unix timestamps in seconds (falsy = unbounded).
     */
    function isDateDisabled(date, minDate, maxDate) {
        if (minDate) {
            const min = new Date(minDate * 1000);
            min.setHours(0, 0, 0, 0);
            if (date < min) return true;
        }
        if (maxDate) {
            const max = new Date(maxDate * 1000);
            max.setHours(23, 59, 59, 999);
            if (date > max) return true;
        }
        return false;
    }

    /**
     * Builds `totalCells` calendar-grid cell descriptors for the given
     * year/month, starting from `firstDayOfWeek` (0 = Sunday, 1 = Monday).
     * Leading cells before day 1 belong to the previous month; trailing
     * cells after the last day belong to the next month. The caller decides
     * `totalCells` (desktop varies 35/42 to minimize empty rows; mobile
     * always uses a fixed 42) and renders each cell's own DOM/state
     * (today/selected/disabled) itself.
     *
     * @returns {Array<{day:number, year:number, month:number, inCurrentMonth:boolean, adjacency:'prev'|'current'|'next'}>}
     */
    function buildCalendarCells(year, month, firstDayOfWeek, totalCells) {
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let startDay = firstDayOfMonth.getDay() - (firstDayOfWeek || 0);
        if (startDay < 0) startDay += 7;

        const prevMonth = month === 0 ? 11 : month - 1;
        const prevMonthYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

        const nextMonth = month === 11 ? 0 : month + 1;
        const nextMonthYear = month === 11 ? year + 1 : year;

        const cells = [];

        for (let i = startDay - 1; i >= 0; i--) {
            cells.push({
                day: daysInPrevMonth - i,
                year: prevMonthYear,
                month: prevMonth,
                inCurrentMonth: false,
                adjacency: 'prev'
            });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            cells.push({ day, year, month, inCurrentMonth: true, adjacency: 'current' });
        }

        let nextDay = 1;
        while (cells.length < totalCells) {
            cells.push({
                day: nextDay,
                year: nextMonthYear,
                month: nextMonth,
                inCurrentMonth: false,
                adjacency: 'next'
            });
            nextDay++;
        }

        return cells;
    }

    window.Layer8DatepickerGrid = {
        isDateDisabled,
        buildCalendarCells
    };

})();
