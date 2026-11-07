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
         * @param {{onDetach: ?function(), onReconnect: ?function()}} hooks -
         *   onDetach: the component's listeners were removed (evicted or taken
         *   over), so it is no longer live; onReconnect: fetch again after the
         *   websocket reconnected
         * @returns {{text: string, register: string, registerId: string}}
         */
        registerQuery: function(id, owner, endpoint, text, hooks) {
            var index = liveIndex(id);
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
         * showing, in place, straight from the pushed record -- no re-fetch.
         * Shared by Layer8DTable, Layer8MTable and both data sources.
         *
         * The server only pushes a change to a session whose registered query
         * matches the record, so an add or delete always belongs to the view's
         * result set: the total moves by one even when the row itself sits on
         * another page. A new record goes to the top of page 1; on any other
         * page only the total changes, since its position there is unknown.
         *
         * @param {Array} items - the view's current page, mutated in place
         * @param {{action: string, primaryKey: string, record: Object}} msg
         * @param {{getId: function(Object): *, transform: ?function(Object): Object,
         *          pageSize: number, firstPage: boolean}} opts
         * @returns {{index: number, totalDelta: number, missingRecord: boolean}}
         *   index of the row that changed on this page (-1 if none), the change
         *   to the total count, and whether an add/update arrived without its
         *   record (the server could not reconstruct it).
         */
        applyChange: function(items, msg, opts) {
            var index = -1;
            for (var i = 0; i < items.length; i++) {
                if (String(opts.getId(items[i])) === String(msg.primaryKey)) {
                    index = i;
                    break;
                }
            }

            if (msg.action === 'delete') {
                if (index >= 0) items.splice(index, 1);
                return { index: index, totalDelta: -1, missingRecord: false };
            }

            if (!msg.record) return { index: -1, totalDelta: 0, missingRecord: true };
            var record = opts.transform ? opts.transform(msg.record) : msg.record;
            // A transform may drop a record from the view entirely.
            if (record === null || record === undefined) {
                return { index: -1, totalDelta: 0, missingRecord: false };
            }

            if (index >= 0) {
                items[index] = record;
                return { index: index, totalDelta: 0, missingRecord: false };
            }
            if (msg.action !== 'add') {
                // An update to a matching record on another page.
                return { index: -1, totalDelta: 0, missingRecord: false };
            }
            if (opts.firstPage) {
                items.unshift(record);
                if (opts.pageSize && items.length > opts.pageSize) items.pop();
                return { index: 0, totalDelta: 1, missingRecord: false };
            }
            return { index: -1, totalDelta: 1, missingRecord: false };
        }
    };
})();
