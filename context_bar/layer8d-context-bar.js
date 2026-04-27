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

// Layer8DContextBar — top-toolbar holder for a fixed set of "context"
// dropdowns plus an optional search box. The K8s explorer uses it for
// cluster + namespace + search; any module that needs persistent contextual
// filtering across views (Probler hosts cluster filter, L8erp HCM dept
// scope, etc.) is a target consumer.
//
// Design notes:
//
//   * Each context is a compact `<label>` + `<select>` pair. Native select
//     because the lists are small, fast, keyboard-friendly and don't
//     warrant Layer8DReferencePicker's popup. The plan suggested
//     ReferencePicker; in practice a native control fits the context-bar
//     shape better. (See plans/k8s-explorer-portal.md §"Architecture in
//     Detail" — this is a documented, intentional deviation.)
//
//   * Contexts can declare `dependsOn: ['otherKey']`. When a parent
//     context changes value, dependents are re-fetched (e.g. namespace
//     list re-fetches whenever cluster changes).
//
//   * Selection is persisted via Layer8DRouter when `persistTo` is set.
//     Refresh / back-button restores state automatically.
//
//   * Empty values + "All" option: if `allowAll: true`, an extra option
//     with `value=""` is prepended. The empty value is the "no filter"
//     signal; consumers test for empty string.
//
//   * Non-silent fallbacks: a fetch failure renders the select disabled
//     with a tooltip and console.warn. We never silently substitute
//     fake options.
//
// API:
//   var bar = new Layer8DContextBar({
//       containerId: 'k8s-explorer-context-bar',
//       contexts: [
//           {
//               key: 'cluster',
//               label: 'Cluster',
//               optionsFetcher: function(ctx) {
//                   return fetch(...).then(resp => resp.json())
//                       .then(data => data.list.map(c =>
//                           ({ value: c.name, label: c.name })));
//               },
//               persistTo: 'k8s.cluster'
//           },
//           {
//               key: 'namespace',
//               label: 'Namespace',
//               dependsOn: ['cluster'],
//               allowAll: true,
//               allLabel: 'All namespaces',
//               optionsFetcher: function(ctx) {
//                   if (!ctx.cluster) return Promise.resolve([]);
//                   return fetchNamespaces(ctx.cluster);
//               },
//               persistTo: 'k8s.namespace'
//           }
//       ],
//       search: {
//           placeholder: 'Search current view...',
//           onInput: function(query) { ... }
//       },
//       onChange: function(ctx) {
//           // ctx === { cluster: 'home', namespace: 'kube-system', search: '' }
//       }
//   });
//   bar.render();
//   bar.getContext();
//   bar.setContext({ namespace: 'default' });
//   bar.destroy();
(function() {
    'use strict';

    function Layer8DContextBar(config) {
        this.container = document.getElementById(config.containerId);
        if (!this.container) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('Layer8DContextBar: container #' + config.containerId + ' not found');
            }
            return;
        }
        this.contexts = (config.contexts || []).map(function(c) {
            return {
                key:            c.key,
                label:          c.label || c.key,
                optionsFetcher: typeof c.optionsFetcher === 'function' ? c.optionsFetcher : null,
                dependsOn:      Array.isArray(c.dependsOn) ? c.dependsOn.slice() : [],
                allowAll:       !!c.allowAll,
                allLabel:       c.allLabel || 'All',
                persistTo:      c.persistTo || null,
                _options:       [],   // cached [{value, label}, ...]
                _state:         'idle' // idle | loading | error | ready
            };
        });
        this.search = config.search || null;
        this.onChange = typeof config.onChange === 'function' ? config.onChange : function() {};
        this.values = {}; // current { contextKey: value }
        this.searchValue = '';
        this._unsubs = [];
        this._destroyed = false;
    }

    Layer8DContextBar.prototype.render = function() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.container.classList.add('layer8d-context-bar');

        var self = this;
        for (var i = 0; i < this.contexts.length; i++) {
            this._renderContextControl(this.contexts[i]);
        }
        if (this.search) {
            this._renderSearch();
        }

        // Hydrate initial values from Layer8DRouter where available.
        for (var j = 0; j < this.contexts.length; j++) {
            var ctx = this.contexts[j];
            if (ctx.persistTo && typeof Layer8DRouter !== 'undefined') {
                var v = Layer8DRouter.get(ctx.persistTo);
                if (v) this.values[ctx.key] = v;
                // Subscribe so external Layer8DRouter writes (e.g. another
                // component setting the same key) update the dropdown.
                var unsub = Layer8DRouter.subscribe(ctx.persistTo, this._onRouterChange.bind(this, ctx.key));
                this._unsubs.push(unsub);
            }
        }

        // Load each context in dependency-order.
        this._loadAll().then(function() {
            // Initial onChange notification so consumers can apply the
            // restored (or default) context immediately.
            self.onChange(self.getContext());
        });
    };

    Layer8DContextBar.prototype.destroy = function() {
        this._destroyed = true;
        for (var i = 0; i < this._unsubs.length; i++) {
            try { this._unsubs[i](); } catch (e) {}
        }
        this._unsubs = [];
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('layer8d-context-bar');
        }
    };

    Layer8DContextBar.prototype.getContext = function() {
        var out = {};
        for (var i = 0; i < this.contexts.length; i++) {
            out[this.contexts[i].key] = this.values[this.contexts[i].key] || '';
        }
        out.search = this.searchValue || '';
        return out;
    };

    Layer8DContextBar.prototype.setContext = function(map) {
        if (!map) return;
        var changed = [];
        for (var k in map) {
            if (this.values[k] !== map[k]) {
                this.values[k] = map[k];
                changed.push(k);
                this._writeRouter(k, map[k]);
                this._setSelectValue(k, map[k]);
            }
        }
        if (changed.length === 0) return;
        // Reload dependents.
        var dependents = this._dependentsOf(changed);
        var self = this;
        Promise.all(dependents.map(function(c) { return self._loadContext(c); }))
            .then(function() { self.onChange(self.getContext()); });
    };

    Layer8DContextBar.prototype._renderContextControl = function(ctx) {
        var wrap = document.createElement('div');
        wrap.className = 'layer8d-context-bar-control';
        wrap.setAttribute('data-context', ctx.key);

        var label = document.createElement('label');
        label.className = 'layer8d-context-bar-label';
        label.textContent = ctx.label + ':';
        var selectId = 'layer8d-context-bar-select-' + ctx.key;
        label.setAttribute('for', selectId);

        var select = document.createElement('select');
        select.className = 'layer8d-context-bar-select';
        select.id = selectId;
        select.disabled = true; // until options load
        select.addEventListener('change', this._onSelectChange.bind(this, ctx.key));

        wrap.appendChild(label);
        wrap.appendChild(select);
        this.container.appendChild(wrap);
        ctx._select = select;
        ctx._wrap = wrap;
    };

    Layer8DContextBar.prototype._renderSearch = function() {
        var wrap = document.createElement('div');
        wrap.className = 'layer8d-context-bar-search-wrap';
        var input = document.createElement('input');
        input.type = 'search';
        input.className = 'layer8d-context-bar-search';
        input.placeholder = this.search.placeholder || 'Search...';
        input.value = this.searchValue;
        input.addEventListener('input', this._onSearchInput.bind(this));
        wrap.appendChild(input);
        this.container.appendChild(wrap);
        this._searchInput = input;
    };

    Layer8DContextBar.prototype._onSelectChange = function(contextKey, e) {
        var newVal = e.target.value;
        if (this.values[contextKey] === newVal) return;
        this.values[contextKey] = newVal;
        this._writeRouter(contextKey, newVal);
        var self = this;
        var dependents = this._dependentsOf([contextKey]);
        Promise.all(dependents.map(function(c) { return self._loadContext(c); }))
            .then(function() { self.onChange(self.getContext()); });
    };

    Layer8DContextBar.prototype._onSearchInput = function(e) {
        this.searchValue = e.target.value || '';
        if (this.search && typeof this.search.onInput === 'function') {
            this.search.onInput(this.searchValue, this.getContext());
        }
        this.onChange(this.getContext());
    };

    Layer8DContextBar.prototype._onRouterChange = function(contextKey, value) {
        if (this.values[contextKey] === value) return;
        this.values[contextKey] = value;
        this._setSelectValue(contextKey, value);
        var self = this;
        var dependents = this._dependentsOf([contextKey]);
        Promise.all(dependents.map(function(c) { return self._loadContext(c); }))
            .then(function() { self.onChange(self.getContext()); });
    };

    Layer8DContextBar.prototype._writeRouter = function(contextKey, value) {
        var ctx = this._findContext(contextKey);
        if (!ctx || !ctx.persistTo) return;
        if (typeof Layer8DRouter === 'undefined') return;
        Layer8DRouter.set(ctx.persistTo, value || '');
    };

    Layer8DContextBar.prototype._findContext = function(contextKey) {
        for (var i = 0; i < this.contexts.length; i++) {
            if (this.contexts[i].key === contextKey) return this.contexts[i];
        }
        return null;
    };

    Layer8DContextBar.prototype._dependentsOf = function(changedKeys) {
        var out = [];
        for (var i = 0; i < this.contexts.length; i++) {
            var c = this.contexts[i];
            for (var j = 0; j < c.dependsOn.length; j++) {
                if (changedKeys.indexOf(c.dependsOn[j]) !== -1) {
                    out.push(c);
                    break;
                }
            }
        }
        return out;
    };

    Layer8DContextBar.prototype._loadAll = function() {
        // Topological-ish: load contexts in declaration order. Since
        // dependsOn only references earlier-declared contexts in practice,
        // a single pass works. Defensive: if a forward reference exists,
        // dependents reload after their parent fetches.
        var self = this;
        var p = Promise.resolve();
        for (var i = 0; i < this.contexts.length; i++) {
            (function(ctx) {
                p = p.then(function() { return self._loadContext(ctx); });
            })(this.contexts[i]);
        }
        return p;
    };

    Layer8DContextBar.prototype._loadContext = function(ctx) {
        if (this._destroyed) return Promise.resolve();
        if (!ctx.optionsFetcher) {
            ctx._options = [];
            ctx._state = 'ready';
            this._renderOptions(ctx);
            return Promise.resolve();
        }
        ctx._state = 'loading';
        if (ctx._select) ctx._select.disabled = true;
        var self = this;
        var snapshot = this.getContext();
        return Promise.resolve()
            .then(function() { return ctx.optionsFetcher(snapshot); })
            .then(function(opts) {
                if (self._destroyed) return;
                if (!Array.isArray(opts)) opts = [];
                ctx._options = opts;
                ctx._state = 'ready';
                self._renderOptions(ctx);
            })
            .catch(function(err) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn(
                        'Layer8DContextBar: optionsFetcher for "' + ctx.key + '" failed:', err
                    );
                }
                ctx._options = [];
                ctx._state = 'error';
                self._renderOptions(ctx);
            });
    };

    Layer8DContextBar.prototype._renderOptions = function(ctx) {
        var sel = ctx._select;
        if (!sel) return;
        sel.innerHTML = '';

        if (ctx._state === 'error') {
            var optErr = document.createElement('option');
            optErr.value = '';
            optErr.textContent = '(failed to load)';
            sel.appendChild(optErr);
            sel.disabled = true;
            sel.title = 'Failed to load options. See browser console.';
            return;
        }

        if (ctx.allowAll) {
            var optAll = document.createElement('option');
            optAll.value = '';
            optAll.textContent = ctx.allLabel;
            sel.appendChild(optAll);
        }

        for (var i = 0; i < ctx._options.length; i++) {
            var o = ctx._options[i];
            var opt = document.createElement('option');
            opt.value = o.value !== undefined ? o.value : (o.id !== undefined ? o.id : '');
            opt.textContent = o.label !== undefined ? o.label : opt.value;
            sel.appendChild(opt);
        }

        // Empty list (no allowAll, no entries) — keep disabled but render
        // a hint option so the user sees why nothing is selectable.
        if (sel.children.length === 0) {
            var optEmpty = document.createElement('option');
            optEmpty.value = '';
            optEmpty.textContent = '(no options)';
            sel.appendChild(optEmpty);
            sel.disabled = true;
            return;
        }

        // Apply current value; if the persisted value isn't in the new
        // options, fall back to the first valid option (and rewrite the
        // router so the URL stays consistent).
        var desired = this.values[ctx.key] || '';
        var found = false;
        for (var j = 0; j < sel.children.length; j++) {
            if (sel.children[j].value === desired) { found = true; break; }
        }
        if (!found) {
            desired = sel.children[0].value;
            this.values[ctx.key] = desired;
            this._writeRouter(ctx.key, desired);
        }
        sel.value = desired;
        sel.disabled = false;
        sel.title = '';
    };

    Layer8DContextBar.prototype._setSelectValue = function(contextKey, value) {
        var ctx = this._findContext(contextKey);
        if (!ctx || !ctx._select) return;
        ctx._select.value = value || '';
    };

    window.Layer8DContextBar = Layer8DContextBar;
})();
