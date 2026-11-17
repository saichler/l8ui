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
// Layer8D Calendar Events
// Navigation, view toggle, and event click handlers.

(function() {
    'use strict';

    window.Layer8DCalendarEvents = {
        attach(cal) {
            const container = cal.container;
            if (!container) return;

            // Prev/Next buttons
            container.querySelectorAll('[data-action="prev"]').forEach(btn => {
                btn.addEventListener('click', () => cal.prevMonth());
            });
            container.querySelectorAll('[data-action="next"]').forEach(btn => {
                btn.addEventListener('click', () => cal.nextMonth());
            });

            // Today button
            container.querySelectorAll('[data-action="today"]').forEach(btn => {
                btn.addEventListener('click', () => cal.today());
            });

            // View mode toggles
            container.querySelectorAll('[data-view]').forEach(btn => {
                btn.addEventListener('click', () => {
                    cal.setViewMode(btn.dataset.view);
                });
            });

            // Add button
            const addBtn = container.querySelector('[data-action="add"]');
            if (addBtn && cal.onAdd) {
                addBtn.addEventListener('click', () => cal.onAdd());
            }

            // Event click
            if (cal.onItemClick) {
                container.querySelectorAll('.layer8d-calendar-event').forEach(el => {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = el.dataset.id;
                        const item = cal.data.find(d => String(cal._getItemId(d)) === id);
                        if (item) cal.onItemClick(item, id);
                    });
                });
            }

            // "+X more" click — show popup with all events for that day
            container.querySelectorAll('.layer8d-calendar-more').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const dateParts = (el.dataset.date || '').split('-');
                    if (dateParts.length < 3) return;
                    const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                    const events = cal.getEventsForDate(date);
                    _showOverflowPopup(cal, el, events);
                });
            });
        }
    };

    function _showOverflowPopup(cal, anchor, events) {
        const existing = document.querySelector('.layer8d-calendar-overflow-popup');
        if (existing) existing.remove();

        const colorVars = [
            '--layer8d-chart-1', '--layer8d-chart-2', '--layer8d-chart-3',
            '--layer8d-chart-4', '--layer8d-chart-5', '--layer8d-chart-6'
        ];

        const popup = document.createElement('div');
        popup.className = 'layer8d-calendar-overflow-popup';
        popup.style.cssText = 'position:fixed;z-index:9999;background:var(--layer8d-bg-white,#fff);border:1px solid var(--layer8d-border,#ddd);border-radius:6px;box-shadow:0 4px 16px var(--layer8d-shadow,rgba(0,0,0,0.18));padding:6px;min-width:160px;max-width:260px;';

        events.forEach((item, i) => {
            const title = typeof cal.viewConfig.formatEventLabel === 'function'
                ? cal.viewConfig.formatEventLabel(item)
                : (cal._getNestedValue(item, cal.titleField) || 'Event');
            const color = Layer8DChart.readThemeColor(colorVars[i % colorVars.length], '#0ea5e9');
            const id = cal._getItemId(item);
            const pill = document.createElement('div');
            pill.style.cssText = `background:${color};color:var(--layer8d-text-on-color,#fff);padding:3px 8px;border-radius:4px;margin-bottom:3px;cursor:pointer;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
            pill.textContent = title;
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                popup.remove();
                if (cal.onItemClick) cal.onItemClick(item, String(id));
            });
            popup.appendChild(pill);
        });

        document.body.appendChild(popup);
        const rect = anchor.getBoundingClientRect();
        let top = rect.bottom + 4;
        let left = rect.left;
        if (left + 260 > window.innerWidth) left = window.innerWidth - 268;
        if (top + popup.offsetHeight > window.innerHeight) top = rect.top - popup.offsetHeight - 4;
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';

        const close = (e) => {
            if (!popup.contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    }

})();
