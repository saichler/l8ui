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

// Layer8DRecents — pure localStorage-backed LRU list, namespaced by
// consumer. `touch(item)` moves the item to the front and dedups by
// `item.key`. The list is capped at `maxItems` (default 10).
//
// Sister utility to Layer8DFavorites. Same shape, different semantics:
// favorites are user-pinned and unbounded (within reason); recents are
// auto-managed and capped.
//
// API:
//   Layer8DRecents.touch(ns, item, max?)   — move/insert at front; cap
//   Layer8DRecents.list(ns, max?)
//   Layer8DRecents.clear(ns)
//   Layer8DRecents.subscribe(ns, fn)        — fn(list) on every change
//
// Items are stored as-is so consumers can keep both 'resource' kind
// (group/item nav target) and 'object' kind (entity ID + service ref)
// in one list. The kind field is a free-form string; the consumer
// decides how to render and dispatch each kind.
(function() {
    'use strict';

    var DEFAULT_MAX = 10;
    var subs = {};

    function storageKey(ns) {
        return 'layer8d-recents.' + (ns || 'default');
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
            /* localStorage unavailable; in-memory only this session. */
        }
        notify(ns, list);
    }

    function notify(ns, list) {
        var arr = subs[ns];
        if (!arr) return;
        for (var i = 0; i < arr.length; i++) {
            try { arr[i](list); } catch (e) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Layer8DRecents subscriber threw:', e);
                }
            }
        }
    }

    function touch(ns, item, max) {
        if (!item || !item.key) return;
        var cap = (typeof max === 'number' && max > 0) ? max : DEFAULT_MAX;
        var list = read(ns);
        // Dedup — drop existing entry with the same key, we'll re-add at
        // front with a fresh timestamp.
        list = list.filter(function(x) { return x && x.key !== item.key; });
        // Stamp it so consumers can show "Xm ago" if they want.
        var stamped = {};
        for (var k in item) stamped[k] = item[k];
        stamped._touchedAt = Date.now();
        list.unshift(stamped);
        if (list.length > cap) list = list.slice(0, cap);
        write(ns, list);
    }

    function list(ns, max) {
        var arr = read(ns);
        if (typeof max === 'number' && max > 0 && arr.length > max) {
            return arr.slice(0, max);
        }
        return arr;
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

    window.Layer8DRecents = {
        touch: touch,
        list: list,
        clear: clear,
        subscribe: subscribe
    };
})();
