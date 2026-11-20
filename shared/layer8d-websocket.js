// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

(function() {
    'use strict';

    var ws = null;
    var listeners = {};
    var reconnectDelay = 1000;
    var maxReconnectDelay = 30000;
    var connected = false;
    var hasConnected = false;

    // Live registrations: at most MAX_LIVE client components hold a server
    // registration at a time, oldest first. Registering a new component past
    // the limit evicts the oldest: its listeners are detached and each of its
    // queries is sent with register=Unregister, so the service's cache drops
    // it. A component that registers again (a revisit) moves to the newest.
    var MAX_LIVE = 5;
    var live = [];

    function liveIndex(id) {
        for (var i = 0; i < live.length; i++) {
            if (live[i].id === id) return i;
        }
        return -1;
    }

    function detach(entry) {
        var unsubs = entry.listeners;
        entry.listeners = [];
        for (var i = 0; i < unsubs.length; i++) unsubs[i]();
        if (entry.onDetach) entry.onDetach();
        entry.owner = null;
    }

    function sendUnregister(entry) {
        var token = sessionStorage.bearerToken;
        if (!token) return;
        entry.queries.forEach(function(q) {
            var body = encodeURIComponent(JSON.stringify({
                text: q.text, register: 'L8_REGISTER_UNREGISTER', registerId: entry.id }));
            fetch(q.endpoint + '?body=' + body, {
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
            }).catch(function() {});
        });
    }

    function connect() {
        var token = sessionStorage.bearerToken;
        if (!token) return;

        var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        var url = protocol + '//' + location.host + '/ws?token=' + token;

        ws = new WebSocket(url);

        ws.onopen = function() {
            reconnectDelay = 1000;
            connected = true;
            // The server drops a user's registrations when their websocket
            // closes, so after a reconnect every live component fetches again,
            // which registers it again and picks up what changed meanwhile.
            if (hasConnected) {
                live.slice().forEach(function(entry) {
                    if (entry.onReconnect) entry.onReconnect();
                });
            }
            hasConnected = true;
        };

        ws.onmessage = function(event) {
            try {
                var msg = JSON.parse(event.data);
                var cbs = listeners[msg.modelType];
                if (cbs) {
                    for (var i = 0; i < cbs.length; i++) {
                        cbs[i](msg);
                    }
                }
            } catch (e) {
            }
        };

        ws.onclose = function(event) {
            connected = false;
            setTimeout(connect, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
        };

        ws.onerror = function(event) {
            if (ws) ws.close();
        };
    }

    window.Layer8DWebSocket = {
        init: function() {
            connect();
        },

        subscribe: function(modelType, callback) {
            if (!listeners[modelType]) listeners[modelType] = [];
            listeners[modelType].push(callback);
            return function unsubscribe() {
                var cbs = listeners[modelType];
                if (!cbs) return;
                var idx = cbs.indexOf(callback);
                if (idx >= 0) cbs.splice(idx, 1);
            };
        },

        disconnect: function() {
            if (ws) {
                ws.onclose = null;
                ws.close();
                ws = null;
            }
            connected = false;
        },

        isConnected: function() {
            return connected;
        },

        /**
         * Registers a component's query for live change notifications and
         * returns the query body to send: the text plus register=Register and
         * registerId=id, which the server keys the registration by (per user).
         * Call it on every fetch -- paging or a new filter replaces the
         * registration. The component becomes the newest of the MAX_LIVE live
         * components; the oldest past the limit is evicted.
         *
         * @param {string} id - stable id of the component (e.g. its container id)
         * @param {Object} owner - the component instance; a new instance under
         *   the same id (a revisit) takes the slot over and detaches the old one
         * @param {string} endpoint - resolved endpoint the query is sent to
         * @param {string} text - the L8QL query text
         * @param {{onDetach: ?function(), onReconnect: ?function(),
         *          keepPosition: ?boolean}} hooks -
         *   onDetach: the component's listeners were removed (evicted or taken
         *   over), so it is no longer live; onReconnect: fetch again after the
         *   websocket reconnected; keepPosition: a re-fetch the user did not
         *   ask for (a pushed change, a reconnect) -- a component already live
         *   keeps its place instead of becoming the newest, so background
         *   updates never reorder which components stay live
         * @returns {{text: string, register: string, registerId: string}}
         */
        registerQuery: function(id, owner, endpoint, text, hooks) {
            var index = liveIndex(id);
            if (hooks && hooks.keepPosition && index >= 0 && live[index].owner === owner) {
                var kept = live[index];
                kept.onDetach = hooks.onDetach;
                kept.onReconnect = hooks.onReconnect;
                kept.queries = kept.queries.filter(function(q) { return q.endpoint !== endpoint; });
                kept.queries.push({ endpoint: endpoint, text: text });
                return { text: text, register: 'L8_REGISTER_REGISTER', registerId: id };
            }
            var entry;
            if (index >= 0) {
                entry = live.splice(index, 1)[0];
                if (entry.owner !== owner) {
                    // Taken over by another instance (a revisit, or a shell
                    // that reuses one container for every service): drop the
                    // old instance's listeners, and unregister its queries on
                    // other endpoints -- the one on this endpoint is replaced
                    // by this registration itself.
                    detach(entry);
                    var stale = entry.queries.filter(function(q) { return q.endpoint !== endpoint; });
                    if (stale.length) sendUnregister({ id: id, queries: stale });
                    entry.queries = [];
                }
            } else {
                entry = { id: id, owner: null, listeners: [], queries: [] };
            }
            entry.owner = owner;
            entry.onDetach = hooks && hooks.onDetach;
            entry.onReconnect = hooks && hooks.onReconnect;
            entry.queries = entry.queries.filter(function(q) { return q.endpoint !== endpoint; });
            entry.queries.push({ endpoint: endpoint, text: text });
            live.push(entry);

            while (live.length > MAX_LIVE) {
                var oldest = live.shift();
                detach(oldest);
                sendUnregister(oldest);
            }
            return { text: text, register: 'L8_REGISTER_REGISTER', registerId: id };
        },

        /**
         * Subscribes a registered component to pushed changes of modelType.
         * The listener belongs to the component's live slot: evicting or
         * taking over the slot removes it.
         * @returns {function()} unsubscribe
         */
        listen: function(id, owner, modelType, callback) {
            var index = liveIndex(id);
            if (index < 0 || live[index].owner !== owner) return function() {};
            var entry = live[index];
            var unsubscribe = this.subscribe(modelType, callback);
            entry.listeners.push(unsubscribe);
            return function() {
                var i = entry.listeners.indexOf(unsubscribe);
                if (i >= 0) entry.listeners.splice(i, 1);
                unsubscribe();
            };
        },

        /**
         * A component shown again without fetching (switching back to a
         * table that already exists) is used again: it moves to the newest.
         * Returns false when the component no longer holds its slot (it was
         * evicted or taken over); it must then fetch to register again.
         */
        touch: function(id, owner) {
            var index = liveIndex(id);
            if (index < 0 || live[index].owner !== owner) return false;
            live.push(live.splice(index, 1)[0]);
            return true;
        },

        /**
         * A destroyed component stops listening. Its registration stays in
         * its slot (no Unregister): the same component usually registers
         * again right away (a view switch), and an Unregister racing that
         * registration could drop it. The slot is replaced or evicted later.
         */
        release: function(id, owner) {
            var index = liveIndex(id);
            if (index >= 0 && live[index].owner === owner) {
                var entry = live[index];
                var unsubs = entry.listeners;
                entry.listeners = [];
                for (var i = 0; i < unsubs.length; i++) unsubs[i]();
                entry.owner = null;
                entry.onDetach = null;
                entry.onReconnect = null;
            }
        },

        /** Ids of the live components, oldest first (diagnostics and tests). */
        liveIds: function() {
            return live.map(function(entry) { return entry.id; });
        },

        /**
         * Applies one change notification to the page of items a live view is
         * showing. Shared by Layer8DTable, Layer8MTable and both data sources.
         *
         * The server pushes a change only to a view whose displayed page it
         * belongs to (an update/delete of a row on the page, or an add that
         * sorts into it). So:
         *  - an update of a row on the page replaces it in place from the
         *    pushed record -- no re-fetch, no full re-render;
         *  - an add, or a delete of a row on the page, changes which rows the
         *    page holds: the view re-fetches its page, which also re-registers
         *    it so the server's snapshot of the page follows;
         *  - an update/delete of a row not on the page is ignored, with or
         *    without a record -- it is never a reason to re-fetch.
         * (probler/plans/websocket-page-scoped-notifications.md Phase 5)
         *
         * @param {Array} items - the view's current page, mutated in place
         * @param {{action: string, primaryKey: string, record: Object}} msg
         * @param {{getId: function(Object): *, transform: ?function(Object): Object}} opts
         * @returns {{index: number, refetch: boolean}}
         *   index of the row replaced in place (-1 if none), and whether the
         *   view must re-fetch its page.
         */
        applyChange: function(items, msg, opts) {
            var none = { index: -1, refetch: false };

            if (msg.action === 'add') {
                // A transform may drop a record from the view entirely.
                if (msg.record && opts.transform) {
                    var added = opts.transform(msg.record);
                    if (added === null || added === undefined) return none;
                }
                return { index: -1, refetch: true };
            }
            if (msg.action !== 'update' && msg.action !== 'delete') return none;

            var index = -1;
            for (var i = 0; i < items.length; i++) {
                if (String(opts.getId(items[i])) === String(msg.primaryKey)) {
                    index = i;
                    break;
                }
            }
            if (index < 0) return none;
            if (msg.action === 'delete' || !msg.record) return { index: index, refetch: true };

            var record = opts.transform ? opts.transform(msg.record) : msg.record;
            // The transform dropped a row the page shows: the page changes.
            if (record === null || record === undefined) return { index: index, refetch: true };
            items[index] = record;
            return { index: index, refetch: false };
        }
    };
})();
