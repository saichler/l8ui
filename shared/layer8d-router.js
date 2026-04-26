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

// Layer8DRouter — tiny URL-hash state sync utility.
//
// Purpose: let any Layer8 portal/section persist named state values into
// the URL hash so refresh and back/forward preserve user context. Used by
// the Kubernetes Explorer portal (cluster, namespace, selected resource);
// equally useful for any section that wants deep links (e.g. open-record-
// by-ID, log file path + offset).
//
// The hash format is a flat key=value list joined by `&`, e.g.:
//
//   #k8s.cluster=home&k8s.namespace=kube-system&k8s.resource=pods
//
// Keys are namespaced by the consumer (prefix everything with the section
// name) so independent consumers do not collide. Values are URL-encoded.
//
// Public API:
//   Layer8DRouter.set(key, value)              — write one key, push to URL
//   Layer8DRouter.setMany({k1: v1, k2: v2})    — atomic multi-key write
//   Layer8DRouter.get(key)                     — read one key, returns ''
//                                                when absent
//   Layer8DRouter.snapshot()                   — entire {key: value} map
//   Layer8DRouter.subscribe(key, fn)           — fn(value) called on change;
//                                                returns an unsubscribe fn
//   Layer8DRouter.subscribeAll(fn)             — fn(snapshot) on any change
//
// Setting a key to '' or null removes it from the URL. The router fires
// hashchange events natively so back/forward work without any extra wiring
// in the consumer.
(function() {
    'use strict';

    var listeners = {};   // key -> [fn, ...]
    var allListeners = []; // [fn, ...]
    var lastSnapshot = parseHash(location.hash);
    var suppressNext = false;

    function parseHash(hash) {
        var out = {};
        if (!hash) return out;
        var s = hash.charAt(0) === '#' ? hash.slice(1) : hash;
        if (!s) return out;
        var parts = s.split('&');
        for (var i = 0; i < parts.length; i++) {
            var p = parts[i];
            if (!p) continue;
            var eq = p.indexOf('=');
            var k, v;
            if (eq === -1) {
                k = decodeURIComponent(p);
                v = '';
            } else {
                k = decodeURIComponent(p.slice(0, eq));
                v = decodeURIComponent(p.slice(eq + 1));
            }
            if (k) out[k] = v;
        }
        return out;
    }

    function buildHash(map) {
        var keys = Object.keys(map);
        keys.sort(); // deterministic for nicer URLs and reliable diffing
        var out = [];
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var v = map[k];
            if (v === '' || v === null || v === undefined) continue;
            out.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
        }
        return out.length ? '#' + out.join('&') : '';
    }

    function applyMap(next) {
        var newHash = buildHash(next);
        if (newHash === location.hash || (newHash === '' && !location.hash)) {
            return; // no-op; do not push history
        }
        suppressNext = true;
        // Use replaceState to avoid clogging history for every keystroke;
        // consumers that want a real history entry can call setMany with a
        // marker key and rely on hashchange. Keeping this simple by default.
        if (newHash) {
            history.replaceState(null, '', location.pathname + location.search + newHash);
        } else {
            history.replaceState(null, '', location.pathname + location.search);
        }
        // We replaced state silently, so no hashchange fired. Synthesize the
        // notify path ourselves.
        notifyChanges(lastSnapshot, next);
        lastSnapshot = next;
    }

    function notifyChanges(prev, next) {
        var keys = {};
        var k;
        for (k in prev) keys[k] = true;
        for (k in next) keys[k] = true;
        for (k in keys) {
            if (prev[k] !== next[k]) {
                var subs = listeners[k];
                if (subs) {
                    for (var i = 0; i < subs.length; i++) {
                        try { subs[i](next[k] || ''); } catch (e) {
                            if (typeof console !== 'undefined' && console.warn) {
                                console.warn('Layer8DRouter listener for "' + k + '" threw:', e);
                            }
                        }
                    }
                }
            }
        }
        for (var j = 0; j < allListeners.length; j++) {
            try { allListeners[j](next); } catch (e) {
                if (typeof console !== 'undefined' && console.warn) {
                    console.warn('Layer8DRouter all-listener threw:', e);
                }
            }
        }
    }

    function onHashChange() {
        if (suppressNext) {
            suppressNext = false;
            return;
        }
        var next = parseHash(location.hash);
        notifyChanges(lastSnapshot, next);
        lastSnapshot = next;
    }

    window.addEventListener('hashchange', onHashChange);

    function set(key, value) {
        var next = {};
        for (var k in lastSnapshot) next[k] = lastSnapshot[k];
        if (value === '' || value === null || value === undefined) {
            delete next[key];
        } else {
            next[key] = String(value);
        }
        applyMap(next);
    }

    function setMany(map) {
        var next = {};
        var k;
        for (k in lastSnapshot) next[k] = lastSnapshot[k];
        for (k in map) {
            var v = map[k];
            if (v === '' || v === null || v === undefined) {
                delete next[k];
            } else {
                next[k] = String(v);
            }
        }
        applyMap(next);
    }

    function get(key) {
        var v = lastSnapshot[key];
        return v === undefined ? '' : v;
    }

    function snapshot() {
        var out = {};
        for (var k in lastSnapshot) out[k] = lastSnapshot[k];
        return out;
    }

    function subscribe(key, fn) {
        if (typeof fn !== 'function') return function() {};
        if (!listeners[key]) listeners[key] = [];
        listeners[key].push(fn);
        return function unsubscribe() {
            var arr = listeners[key];
            if (!arr) return;
            var idx = arr.indexOf(fn);
            if (idx !== -1) arr.splice(idx, 1);
        };
    }

    function subscribeAll(fn) {
        if (typeof fn !== 'function') return function() {};
        allListeners.push(fn);
        return function unsubscribe() {
            var idx = allListeners.indexOf(fn);
            if (idx !== -1) allListeners.splice(idx, 1);
        };
    }

    window.Layer8DRouter = {
        set: set,
        setMany: setMany,
        get: get,
        snapshot: snapshot,
        subscribe: subscribe,
        subscribeAll: subscribeAll
    };
})();
