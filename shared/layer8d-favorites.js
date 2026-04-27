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

// Layer8DFavorites — pure localStorage-backed pinned-items utility,
// namespaced by consumer.
//
// Items are arbitrary objects whose `key` field is the dedup key. The
// utility stores the entire object so consumers can keep navigation
// hints (group, item, label, icon, etc.) in one place. Storage is
// per-namespace so independent consumers (k8s, l8erp, l8logs, …)
// don't collide.
//
// API:
//   Layer8DFavorites.add(ns, item)         — add or replace by item.key
//   Layer8DFavorites.remove(ns, key)
//   Layer8DFavorites.toggle(ns, item)      — returns true if now favorited
//   Layer8DFavorites.has(ns, key)
//   Layer8DFavorites.list(ns)
//   Layer8DFavorites.clear(ns)
//   Layer8DFavorites.subscribe(ns, fn)     — fn(list) on every change
//
// LocalStorage key format: `layer8d-favorites.<ns>`. JSON-encoded array.
(function() {
    'use strict';

    var subs = {};            // ns -> [fn, ...]

    function storageKey(ns) {
        return 'layer8d-favorites.' + (ns || 'default');
    }

    function read(ns) {
        try {
            var raw = localStorage.getItem(storageKey(ns));
            if (!raw) return [];
            var arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function write(ns, list) {
        try {
            localStorage.setItem(storageKey(ns), JSON.stringify(list));
        } catch (e) {
            /* localStorage unavailable; in-memory only for this session. */
        }
        notify(ns, list);
    }

    function notify(ns, list) {
        var arr = subs[ns];
        if (!arr) return;
        for (var i = 0; i < arr.length; i++) {
            try { arr[i](list); } catch (e) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Layer8DFavorites subscriber threw:', e);
                }
            }
        }
    }

    function add(ns, item) {
        if (!item || !item.key) return;
        var list = read(ns);
        var idx = list.findIndex(function(x) { return x && x.key === item.key; });
        if (idx === -1) list.push(item);
        else list[idx] = item;
        write(ns, list);
    }

    function remove(ns, key) {
        if (!key) return;
        var list = read(ns).filter(function(x) { return x && x.key !== key; });
        write(ns, list);
    }

    function toggle(ns, item) {
        if (!item || !item.key) return false;
        if (has(ns, item.key)) {
            remove(ns, item.key);
            return false;
        }
        add(ns, item);
        return true;
    }

    function has(ns, key) {
        if (!key) return false;
        var list = read(ns);
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].key === key) return true;
        }
        return false;
    }

    function list(ns) {
        return read(ns);
    }

    function clear(ns) {
        write(ns, []);
    }

    function subscribe(ns, fn) {
        if (typeof fn !== 'function') return function() {};
        if (!subs[ns]) subs[ns] = [];
        subs[ns].push(fn);
        return function unsubscribe() {
            var arr = subs[ns];
            if (!arr) return;
            var idx = arr.indexOf(fn);
            if (idx !== -1) arr.splice(idx, 1);
        };
    }

    window.Layer8DFavorites = {
        add: add,
        remove: remove,
        toggle: toggle,
        has: has,
        list: list,
        clear: clear,
        subscribe: subscribe
    };
})();
