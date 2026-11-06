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

    function connect() {
        var token = sessionStorage.bearerToken;
        if (!token) return;

        var protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        var url = protocol + '//' + location.host + '/ws?token=' + token;

        ws = new WebSocket(url);

        ws.onopen = function() {
            reconnectDelay = 1000;
            connected = true;
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
