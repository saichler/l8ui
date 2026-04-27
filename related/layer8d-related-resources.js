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

// Layer8DRelatedResources — declarative panel that renders relationships
// between a "source" entity and other entities (or navigation targets).
//
// Each relation is one of:
//   • Async fetch:  { label, fetch: function(): Promise<Array<related>> }
//   • Pre-fetched:  { label, items: Array<related> }
//   • Coming-soon:  { label, comingSoon: 'reason' }
//   • Navigation:   { label, links: [{label, target}] }
//
// `related` shape (what fetchers / items resolve to):
//   { label, sublabel?, target, severity? }
//
// `target` is opaque — the consumer's onSelect handler interprets it.
// Severity drives a small dot like the Layer8DExplorer rail's status.
//
// Per the non-silent-fallback rule:
//   • Empty fetch result → "(none)" text, not a fake row.
//   • Fetch failure → "(failed to load)" + console.warn — NOT silent empty.
//   • coming-soon → explicit pill with the reason in a tooltip — NOT empty.
//
// Theme tokens only; CSS in layer8d-related-resources.css.
(function() {
    'use strict';

    /**
     * Render a related-resources panel into `container`.
     * @param {object} cfg
     * @param {HTMLElement} cfg.container
     * @param {Array} cfg.relations
     * @param {Function} [cfg.onSelect]   called with (target, related)
     *                                    when a row or link is clicked
     */
    function render(cfg) {
        var container = cfg && cfg.container;
        if (!container) return;
        var relations = (cfg && cfg.relations) || [];
        var onSelect = typeof cfg.onSelect === 'function' ? cfg.onSelect : null;

        container.innerHTML = '';
        container.classList.add('layer8d-related');
        if (relations.length === 0) {
            container.innerHTML = '<div class="layer8d-related-empty">No related resources defined.</div>';
            return;
        }

        // Single delegated click handler — works for all rows + nav links.
        var clickHandler = function(e) {
            var el = e.target.closest('[data-related-target]');
            if (!el || !container.contains(el)) return;
            var raw = el.getAttribute('data-related-target');
            if (!raw) return;
            var t;
            try { t = JSON.parse(raw); } catch (_) { return; }
            if (onSelect) onSelect(t, null);
        };
        if (container._layer8dRelatedClick) {
            container.removeEventListener('click', container._layer8dRelatedClick);
        }
        container.addEventListener('click', clickHandler);
        container._layer8dRelatedClick = clickHandler;

        // Render each relation block in declaration order, kicking off
        // fetches in parallel.
        for (var i = 0; i < relations.length; i++) {
            renderRelation(container, relations[i]);
        }
    }

    function renderRelation(container, relation) {
        var section = document.createElement('section');
        section.className = 'layer8d-related-section';

        var heading = document.createElement('h4');
        heading.className = 'layer8d-related-heading';
        heading.textContent = relation.label || '(unnamed)';
        section.appendChild(heading);

        var body = document.createElement('div');
        body.className = 'layer8d-related-body';
        section.appendChild(body);

        container.appendChild(section);

        if (relation.comingSoon) {
            renderComingSoon(body, relation.comingSoon);
            return;
        }
        if (relation.links) {
            renderLinks(body, relation.links);
            return;
        }
        if (Array.isArray(relation.items)) {
            renderItems(body, relation.items);
            return;
        }
        if (typeof relation.fetch === 'function') {
            renderLoading(body);
            Promise.resolve()
                .then(function() { return relation.fetch(); })
                .then(function(items) {
                    if (!Array.isArray(items)) items = [];
                    body.innerHTML = '';
                    renderItems(body, items);
                })
                .catch(function(err) {
                    body.innerHTML = '';
                    renderError(body);
                    if (typeof console !== 'undefined' && console.warn) {
                        console.warn('Layer8DRelatedResources fetch failed for "' + relation.label + '":', err);
                    }
                });
            return;
        }
        // Misconfigured relation — render a pill so the bug is visible.
        renderError(body, 'No fetch / items / comingSoon / links');
    }

    function renderItems(body, items) {
        if (!items || items.length === 0) {
            var none = document.createElement('div');
            none.className = 'layer8d-related-none';
            none.textContent = '(none)';
            body.appendChild(none);
            return;
        }
        var list = document.createElement('ul');
        list.className = 'layer8d-related-list';
        for (var i = 0; i < items.length; i++) {
            list.appendChild(renderItem(items[i]));
        }
        body.appendChild(list);
    }

    function renderItem(item) {
        var li = document.createElement('li');
        li.className = 'layer8d-related-item';
        if (item.target !== undefined && item.target !== null) {
            li.setAttribute('data-related-target', JSON.stringify(item.target));
            li.setAttribute('role', 'button');
            li.setAttribute('tabindex', '0');
        }

        if (item.severity) {
            var dot = document.createElement('span');
            dot.className = 'layer8d-related-dot status-' + item.severity;
            li.appendChild(dot);
        }

        var label = document.createElement('span');
        label.className = 'layer8d-related-label';
        label.textContent = item.label || '(unnamed)';
        li.appendChild(label);

        if (item.sublabel) {
            var sub = document.createElement('span');
            sub.className = 'layer8d-related-sublabel';
            sub.textContent = item.sublabel;
            li.appendChild(sub);
        }
        return li;
    }

    function renderLinks(body, links) {
        var list = document.createElement('ul');
        list.className = 'layer8d-related-list';
        for (var i = 0; i < links.length; i++) {
            var link = links[i] || {};
            var li = document.createElement('li');
            li.className = 'layer8d-related-item layer8d-related-nav';
            if (link.target !== undefined) {
                li.setAttribute('data-related-target', JSON.stringify(link.target));
                li.setAttribute('role', 'button');
                li.setAttribute('tabindex', '0');
            }
            li.textContent = link.label || '(unnamed)';
            list.appendChild(li);
        }
        body.appendChild(list);
    }

    function renderComingSoon(body, reason) {
        var pill = document.createElement('div');
        pill.className = 'layer8d-related-comingsoon';
        pill.textContent = '(coming soon)';
        if (reason) pill.title = reason;
        body.appendChild(pill);
    }

    function renderLoading(body) {
        var el = document.createElement('div');
        el.className = 'layer8d-related-loading';
        el.textContent = 'Loading…';
        body.appendChild(el);
    }

    function renderError(body, msg) {
        var el = document.createElement('div');
        el.className = 'layer8d-related-error';
        el.textContent = msg ? msg : '(failed to load)';
        body.appendChild(el);
    }

    window.Layer8DRelatedResources = { render: render };
})();
