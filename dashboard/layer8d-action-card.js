/*
 * © 2026 Sharon Aicler (saichler@gmail.com)
 *
 * Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Layer8DActionCard — KPI tile with a typed click target.
//
// Why a separate component (and not just Layer8DWidget): action cards are
// not just numbers, they are *verbs*. Each card carries a structured
// `target` (e.g. `{ groupKey, itemKey, baseWhereClause }`) that the
// consumer interprets when the card is clicked. That contract is worth
// naming explicitly. Layer8DActionCard formalizes it; Layer8DWidget can
// stay focused on raw stat rendering.
//
// Layer8DActionCard also avoids Layer8DWidget's `onClick: "<JS string>"`
// pattern (string-eval onclicks) — clicks here are wired with normal
// addEventListener, with the target attached as a data-* attribute and
// resolved lazily.
//
// API:
//   Layer8DActionCard.renderGrid(container, cards, onClick)
//
//   `cards` is an array of:
//       {
//           id?:       string  (optional; auto-generated if missing)
//           label:     string,
//           value:     number | string,
//           sublabel?: string,
//           icon?:     string,        // emoji/text
//           iconSvg?:  string,        // raw SVG markup; preferred over icon
//           severity?: '' | 'ok' | 'warning' | 'critical',
//           target?:   any            // arbitrary; passed back to onClick(target)
//       }
//
//   `onClick(target, card)` is invoked when the user clicks/activates a card.
//   Cards without a target are still rendered but not clickable.
//
//   Returns the grid element so callers can do further DOM work if needed.
//
// CSS lives in layer8d-action-card.css; theme tokens only.
(function() {
    'use strict';

    function renderGrid(container, cards, onClick) {
        if (!container) return null;
        if (!Array.isArray(cards)) cards = [];
        container.innerHTML = '';
        container.classList.add('layer8d-action-card-grid');

        var clickFn = typeof onClick === 'function' ? onClick : null;
        var idMap = {};

        for (var i = 0; i < cards.length; i++) {
            var card = cards[i] || {};
            var id = card.id || ('layer8d-action-' + i);
            idMap[id] = card;
            var el = renderOne(card, id);
            container.appendChild(el);
        }

        // Single delegated click handler — better perf than per-card listeners,
        // and gracefully handles dynamic re-renders (we re-attach on each grid
        // call so the closure captures the latest idMap).
        if (container._layer8dActionClick) {
            container.removeEventListener('click', container._layer8dActionClick);
            container.removeEventListener('keydown', container._layer8dActionKey);
        }
        var clickHandler = function(e) {
            var el = e.target.closest('.layer8d-action-card');
            if (!el || !container.contains(el)) return;
            var id = el.getAttribute('data-action-id');
            var c = idMap[id];
            if (!c || !c.target || !clickFn) return;
            clickFn(c.target, c);
        };
        var keyHandler = function(e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var el = e.target.closest('.layer8d-action-card');
            if (!el || !container.contains(el)) return;
            e.preventDefault();
            el.click();
        };
        container.addEventListener('click', clickHandler);
        container.addEventListener('keydown', keyHandler);
        container._layer8dActionClick = clickHandler;
        container._layer8dActionKey = keyHandler;

        return container;
    }

    function renderOne(card, id) {
        var hasTarget = !!card.target;
        var sev = card.severity || '';

        var el = document.createElement('div');
        el.className = 'layer8d-action-card';
        if (sev) el.classList.add('layer8d-action-card-' + sev);
        if (hasTarget) el.classList.add('layer8d-action-card-clickable');
        el.setAttribute('data-action-id', id);
        if (hasTarget) {
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
        }

        // Header row: icon + label.
        var header = document.createElement('div');
        header.className = 'layer8d-action-card-header';

        if (card.iconSvg) {
            var sw = document.createElement('span');
            sw.className = 'layer8d-action-card-icon';
            sw.innerHTML = card.iconSvg;
            header.appendChild(sw);
        } else if (card.icon) {
            var ic = document.createElement('span');
            ic.className = 'layer8d-action-card-icon';
            ic.textContent = card.icon;
            header.appendChild(ic);
        }

        var lbl = document.createElement('div');
        lbl.className = 'layer8d-action-card-label';
        lbl.textContent = card.label || '';
        header.appendChild(lbl);

        el.appendChild(header);

        // Value (the number/headline).
        var val = document.createElement('div');
        val.className = 'layer8d-action-card-value';
        val.textContent = formatValue(card.value);
        el.appendChild(val);

        // Sublabel (small descriptor).
        if (card.sublabel) {
            var sub = document.createElement('div');
            sub.className = 'layer8d-action-card-sublabel';
            sub.textContent = card.sublabel;
            el.appendChild(sub);
        }

        return el;
    }

    function formatValue(v) {
        if (v === null || v === undefined) return '—';
        if (typeof v === 'string') return v;
        if (typeof v !== 'number' || !isFinite(v)) return String(v);
        if (v >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (v >= 10000)   return (v / 1000).toFixed(0) + 'k';
        if (v >= 1000)    return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(v);
    }

    window.Layer8DActionCard = {
        renderGrid: renderGrid
    };
})();
