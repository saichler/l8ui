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
        }
    };
})();
