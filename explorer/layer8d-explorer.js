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

// Layer8DExplorer — a generic left-rail navigator for hierarchical resource
// browsers. Each group is a collapsible section; each item under a group is
// selectable. Groups themselves can be selectable (when they have no items,
// or when they are the "leaf" of a single-resource group). Decoration
// supported: per-node count badge, per-node status dot (warning/critical/ok).
//
// Built for the Kubernetes Explorer portal but intentionally domain-agnostic
// — see plans/k8s-explorer-portal.md for the reuse story (Probler Network,
// L8erp module browser, L8topology side-list, etc.).
//
// API:
//   var exp = new Layer8DExplorer({
//       containerId: 'rail',
//       namespace:   'k8s',           // localStorage key prefix for
//                                     // collapse state
//       groups: [
//           { key: 'overview', label: 'Overview', icon: '◉' },
//           { key: 'workloads', label: 'Workloads', icon: '⚙', items: [
//               { key: 'pods',        label: 'Pods' },
//               { key: 'deployments', label: 'Deployments' },
//               ...
//           ]},
//           ...
//       ],
//       selected: { group: 'overview', item: null },
//       onSelect: function(groupKey, itemKey) { ... }
//   });
//   exp.render();
//   exp.setSelected({ group: 'workloads', item: 'pods' });
//   exp.setCounts({ workloads: 8, pods: 1247, deployments: 42, ... });
//   exp.setStatus({ pods: 'warning', deployments: 'critical' });
//   exp.destroy();
//
// Counts and status maps are flat — one entry per group OR item key.
// When both a group and an item share a key, namespace your keys upstream.
//
// Composes existing l8ui patterns: nothing project-specific imported here.
// Theme tokens only via layer8d-explorer.css.
(function() {
    'use strict';

    var STATUSES = { ok: 1, warning: 1, critical: 1 };

    function Layer8DExplorer(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('Layer8DExplorer: container #' + config.containerId + ' not found');
            }
            return;
        }
        this.namespace = config.namespace || 'default';
        this.groups = config.groups || [];
        this.onSelect = typeof config.onSelect === 'function' ? config.onSelect : function() {};
        this.selected = config.selected || { group: null, item: null };
        this.counts = {};
        this.status = {};
        this.collapsed = this._loadCollapsedState();
        this._keyHandler = this._onKeyDown.bind(this);
        this._clickHandler = this._onClick.bind(this);
    }

    Layer8DExplorer.prototype.render = function() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.classList.add('layer8d-explorer');

        var nav = document.createElement('nav');
        nav.className = 'layer8d-explorer-nav';
        nav.setAttribute('role', 'tree');
        nav.setAttribute('aria-label', 'Resource navigator');

        for (var i = 0; i < this.groups.length; i++) {
            nav.appendChild(this._renderGroup(this.groups[i]));
        }

        this.container.appendChild(nav);
        this.container.addEventListener('click', this._clickHandler);
        this.container.addEventListener('keydown', this._keyHandler);
        this._applyDecorations();
        this._applySelection();
    };

    Layer8DExplorer.prototype.destroy = function() {
        if (!this.container) return;
        this.container.removeEventListener('click', this._clickHandler);
        this.container.removeEventListener('keydown', this._keyHandler);
        this.container.innerHTML = '';
        this.container.classList.remove('layer8d-explorer');
    };

    Layer8DExplorer.prototype.setSelected = function(sel) {
        this.selected = {
            group: sel && sel.group ? sel.group : null,
            item:  sel && sel.item  ? sel.item  : null
        };
        this._applySelection();
    };

    Layer8DExplorer.prototype.getSelected = function() {
        return { group: this.selected.group, item: this.selected.item };
    };

    Layer8DExplorer.prototype.setCounts = function(map) {
        if (!map) return;
        for (var k in map) this.counts[k] = map[k];
        this._applyDecorations();
    };

    Layer8DExplorer.prototype.setStatus = function(map) {
        if (!map) return;
        for (var k in map) {
            var v = map[k];
            // Defensive: only accept known statuses or null/clear.
            if (v == null || v === '') {
                delete this.status[k];
            } else if (STATUSES[v]) {
                this.status[k] = v;
            } else if (typeof console !== 'undefined' && console.warn) {
                console.warn('Layer8DExplorer.setStatus: unknown status "' + v + '" for "' + k + '"');
            }
        }
        this._applyDecorations();
    };

    Layer8DExplorer.prototype._renderGroup = function(group) {
        var hasItems = group.items && group.items.length > 0;
        var isCollapsed = hasItems && this.collapsed[group.key] === true;

        var wrap = document.createElement('div');
        wrap.className = 'layer8d-explorer-group';
        wrap.setAttribute('data-group', group.key);
        if (isCollapsed) wrap.classList.add('collapsed');

        var header = document.createElement('button');
        header.type = 'button';
        header.className = 'layer8d-explorer-group-header';
        header.setAttribute('data-group', group.key);
        header.setAttribute('data-leaf', hasItems ? 'false' : 'true');
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', hasItems ? 'treeitem' : 'treeitem');
        if (hasItems) header.setAttribute('aria-expanded', String(!isCollapsed));

        var chevron = document.createElement('span');
        chevron.className = 'layer8d-explorer-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.textContent = hasItems ? '▾' : '';
        header.appendChild(chevron);

        if (group.icon) {
            var icon = document.createElement('span');
            icon.className = 'layer8d-explorer-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = group.icon;
            header.appendChild(icon);
        }

        var label = document.createElement('span');
        label.className = 'layer8d-explorer-label';
        label.textContent = group.label;
        header.appendChild(label);

        var countBadge = document.createElement('span');
        countBadge.className = 'layer8d-explorer-count';
        countBadge.setAttribute('data-count-for', group.key);
        countBadge.style.display = 'none';
        header.appendChild(countBadge);

        var statusDot = document.createElement('span');
        statusDot.className = 'layer8d-explorer-status';
        statusDot.setAttribute('data-status-for', group.key);
        statusDot.style.display = 'none';
        header.appendChild(statusDot);

        wrap.appendChild(header);

        if (hasItems) {
            var list = document.createElement('ul');
            list.className = 'layer8d-explorer-items';
            list.setAttribute('role', 'group');
            for (var i = 0; i < group.items.length; i++) {
                list.appendChild(this._renderItem(group, group.items[i]));
            }
            wrap.appendChild(list);
        }
        return wrap;
    };

    Layer8DExplorer.prototype._renderItem = function(group, item) {
        var li = document.createElement('li');
        li.className = 'layer8d-explorer-item';
        li.setAttribute('data-group', group.key);
        li.setAttribute('data-item', item.key);
        li.setAttribute('role', 'treeitem');
        li.setAttribute('tabindex', '0');

        if (item.icon) {
            var icon = document.createElement('span');
            icon.className = 'layer8d-explorer-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = item.icon;
            li.appendChild(icon);
        }

        var label = document.createElement('span');
        label.className = 'layer8d-explorer-item-label';
        label.textContent = item.label;
        li.appendChild(label);

        var countBadge = document.createElement('span');
        countBadge.className = 'layer8d-explorer-count';
        countBadge.setAttribute('data-count-for', item.key);
        countBadge.style.display = 'none';
        li.appendChild(countBadge);

        var statusDot = document.createElement('span');
        statusDot.className = 'layer8d-explorer-status';
        statusDot.setAttribute('data-status-for', item.key);
        statusDot.style.display = 'none';
        li.appendChild(statusDot);

        return li;
    };

    Layer8DExplorer.prototype._onClick = function(e) {
        var headerEl = e.target.closest('.layer8d-explorer-group-header');
        if (headerEl) {
            var groupKey = headerEl.getAttribute('data-group');
            var isLeaf = headerEl.getAttribute('data-leaf') === 'true';
            if (isLeaf) {
                this._select(groupKey, null);
            } else {
                // Whole header toggles for non-leaf groups. Selecting the
                // group itself when it has children would be ambiguous —
                // the plan documents items as the selectable unit.
                this._toggleGroup(groupKey);
            }
            return;
        }
        var itemEl = e.target.closest('.layer8d-explorer-item');
        if (itemEl) {
            var gk = itemEl.getAttribute('data-group');
            var ik = itemEl.getAttribute('data-item');
            this._select(gk, ik);
        }
    };

    Layer8DExplorer.prototype._onKeyDown = function(e) {
        var focusable = Array.prototype.slice.call(this.container.querySelectorAll(
            '.layer8d-explorer-group-header, .layer8d-explorer-item'
        ));
        var idx = focusable.indexOf(document.activeElement);
        if (idx === -1) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (idx < focusable.length - 1) focusable[idx + 1].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (idx > 0) focusable[idx - 1].focus();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (document.activeElement.classList.contains('layer8d-explorer-group-header')) {
                    var rgroupKey = document.activeElement.getAttribute('data-group');
                    if (this.collapsed[rgroupKey]) this._toggleGroup(rgroupKey);
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (document.activeElement.classList.contains('layer8d-explorer-group-header')) {
                    var lgroupKey = document.activeElement.getAttribute('data-group');
                    if (!this.collapsed[lgroupKey]) this._toggleGroup(lgroupKey);
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                document.activeElement.click();
                break;
        }
    };

    Layer8DExplorer.prototype._toggleGroup = function(groupKey) {
        var wrap = this.container.querySelector('.layer8d-explorer-group[data-group="' + cssEscape(groupKey) + '"]');
        if (!wrap) return;
        var nowCollapsed = !wrap.classList.contains('collapsed');
        wrap.classList.toggle('collapsed', nowCollapsed);
        var header = wrap.querySelector('.layer8d-explorer-group-header');
        if (header) header.setAttribute('aria-expanded', String(!nowCollapsed));
        if (nowCollapsed) this.collapsed[groupKey] = true;
        else delete this.collapsed[groupKey];
        this._saveCollapsedState();
    };

    Layer8DExplorer.prototype._select = function(groupKey, itemKey) {
        this.selected = { group: groupKey, item: itemKey || null };
        this._applySelection();
        this.onSelect(groupKey, itemKey || null);
    };

    Layer8DExplorer.prototype._applySelection = function() {
        var actives = this.container.querySelectorAll('.layer8d-explorer-active');
        for (var i = 0; i < actives.length; i++) {
            actives[i].classList.remove('layer8d-explorer-active');
        }
        if (!this.selected || !this.selected.group) return;
        var gk = this.selected.group;
        var ik = this.selected.item;
        var sel;
        if (ik) {
            sel = this.container.querySelector(
                '.layer8d-explorer-item[data-group="' + cssEscape(gk) + '"][data-item="' + cssEscape(ik) + '"]'
            );
        } else {
            sel = this.container.querySelector(
                '.layer8d-explorer-group-header[data-group="' + cssEscape(gk) + '"][data-leaf="true"]'
            );
        }
        if (sel) {
            sel.classList.add('layer8d-explorer-active');
            sel.setAttribute('aria-selected', 'true');
        }
    };

    Layer8DExplorer.prototype._applyDecorations = function() {
        // Counts.
        var countEls = this.container.querySelectorAll('[data-count-for]');
        for (var i = 0; i < countEls.length; i++) {
            var el = countEls[i];
            var key = el.getAttribute('data-count-for');
            var v = this.counts[key];
            if (v === null || v === undefined || v === '') {
                el.style.display = 'none';
                el.textContent = '';
            } else {
                el.style.display = '';
                el.textContent = formatCount(v);
            }
        }
        // Status dots.
        var statusEls = this.container.querySelectorAll('[data-status-for]');
        for (var j = 0; j < statusEls.length; j++) {
            var sel = statusEls[j];
            var skey = sel.getAttribute('data-status-for');
            var sv = this.status[skey];
            sel.classList.remove('status-ok', 'status-warning', 'status-critical');
            if (sv) {
                sel.classList.add('status-' + sv);
                sel.style.display = '';
            } else {
                sel.style.display = 'none';
            }
        }
    };

    Layer8DExplorer.prototype._loadCollapsedState = function() {
        try {
            var raw = localStorage.getItem('layer8d-explorer.' + this.namespace + '.collapsed');
            if (!raw) return {};
            var arr = JSON.parse(raw);
            var out = {};
            if (Array.isArray(arr)) {
                for (var i = 0; i < arr.length; i++) out[arr[i]] = true;
            }
            return out;
        } catch (e) {
            return {};
        }
    };

    Layer8DExplorer.prototype._saveCollapsedState = function() {
        try {
            var keys = Object.keys(this.collapsed);
            localStorage.setItem(
                'layer8d-explorer.' + this.namespace + '.collapsed',
                JSON.stringify(keys)
            );
        } catch (e) {
            /* localStorage unavailable; collapse state simply won't persist. */
        }
    };

    function formatCount(n) {
        if (typeof n === 'number') {
            if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            if (n >= 10000)   return (n / 1000).toFixed(0) + 'k';
            if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            return String(n);
        }
        return String(n);
    }

    // CSS.escape isn't available in older browsers; provide a tiny shim
    // just for the characters we use in keys (alnum + dash + underscore +
    // dot). Anything outside that is best-effort.
    function cssEscape(s) {
        if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
        return String(s).replace(/[^a-zA-Z0-9_\-]/g, '\\$&');
    }

    window.Layer8DExplorer = Layer8DExplorer;
})();
