// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatApi - REST access of the chat (desktop and mobile share it).
// Every path comes from the adopter's init({endpoints}) and is resolved by the
// platform (Layer8DConfig / Layer8MConfig); nothing here names a service or
// an area. The platform also carries the authenticated transport and popups.

(function() {
    'use strict';

    var REQUIRED_ENDPOINTS = ['msg', 'conv', 'peer', 'sync', 'stat', 'group', 'users', 'llmProf'];
    var NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
    var L8AI_NAMESPACE_NAME = 'https://github.com/saichler/l8ai';

    function checkResponse(r) {
        if (!r.ok) {
            return r.text().then(function(t) { throw new Error(t || r.statusText); });
        }
        return r.json();
    }

    // Desktop: Layer8DConfig + the host's getAuthHeaders() + Layer8DPopup.
    function desktopPlatform() {
        return {
            mobile: false,
            resolve: function(path) { return Layer8DConfig.resolveEndpoint(path); },
            request: function(method, url, body) {
                var opts = { method: method, headers: getAuthHeaders() };
                if (body !== undefined) opts.body = JSON.stringify(body);
                return fetch(url, opts).then(checkResponse);
            },
            notifyError: function(title, message) { Layer8DNotification.error(title, [message]); },
            popup: {
                show: function(cfg) { Layer8DPopup.show(cfg); },
                body: function() { return Layer8DPopup.getBody(); },
                close: function() { Layer8DPopup.close(); }
            }
        };
    }

    // Mobile: Layer8MConfig + Layer8MAuth verbs + Layer8MPopup.
    function mobilePlatform() {
        var popupId = null;
        return {
            mobile: true,
            resolve: function(path) { return Layer8MConfig.resolveEndpoint(path); },
            request: function(method, url, body) {
                var verb = method.toLowerCase();
                return verb === 'get' ? Layer8MAuth.get(url) : Layer8MAuth[verb](url, body);
            },
            notifyError: function(title, message) { Layer8MUtils.showError(title + ': ' + message); },
            popup: {
                show: function(cfg) {
                    popupId = 'l8chat-popup-' + Date.now();
                    var onSave = cfg.onSave;
                    var copy = Object.assign({}, cfg, { id: popupId });
                    copy.onSave = onSave ? function() { onSave(); } : null;
                    Layer8MPopup.show(copy);
                },
                body: function() { return Layer8MPopup.getBody(popupId); },
                close: function() { Layer8MPopup.close(popupId); }
            }
        };
    }

    function validateEndpoints(endpoints) {
        var missing = REQUIRED_ENDPOINTS.filter(function(k) { return !endpoints || !endpoints[k]; });
        if (missing.length) {
            throw new Error('l8chat: init({endpoints}) is missing: ' + missing.join(', '));
        }
    }

    // ---- IDs (must match l8ai go/ai/common/defaults.go) ----

    function uuid4() {
        if (crypto.randomUUID) return crypto.randomUUID();
        var b = crypto.getRandomValues(new Uint8Array(16));
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        return format(b);
    }

    function format(b) {
        var h = Array.prototype.map.call(b, function(x) { return ('0' + x.toString(16)).slice(-2); }).join('');
        return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20, 32);
    }

    function parse(uuid) {
        var hex = uuid.replace(/-/g, '');
        var b = new Uint8Array(16);
        for (var i = 0; i < 16; i++) b[i] = parseInt(hex.substr(i * 2, 2), 16);
        return b;
    }

    // UUIDv5 (SHA-1) of name in a namespace, as Go's uuid.NewSHA1.
    function uuid5(namespace, name) {
        var ns = parse(namespace);
        var nameBytes = new TextEncoder().encode(name);
        var data = new Uint8Array(ns.length + nameBytes.length);
        data.set(ns, 0);
        data.set(nameBytes, ns.length);
        return crypto.subtle.digest('SHA-1', data).then(function(hash) {
            var b = new Uint8Array(hash).slice(0, 16);
            b[6] = (b[6] & 0x0f) | 0x50;
            b[8] = (b[8] & 0x3f) | 0x80;
            return format(b);
        });
    }

    var namespacePromise = null;
    function l8aiId(name) {
        if (!namespacePromise) namespacePromise = uuid5(NAMESPACE_URL, L8AI_NAMESPACE_NAME);
        return namespacePromise.then(function(ns) { return uuid5(ns, name); });
    }

    function directPeerKey(a, b) { return b < a ? b + '|' + a : a + '|' + b; }
    function agentPeerKey(userId) { return 'agent|' + userId; }

    var ids = {
        uuid4: uuid4,
        directPeerKey: directPeerKey,
        agentPeerKey: agentPeerKey,
        directConversationId: function(a, b) { return l8aiId('dm|' + directPeerKey(a, b)); },
        groupConversationId: function(groupId) { return l8aiId('grp|' + groupId); },
        agentConversationId: function(userId) { return l8aiId(agentPeerKey(userId)); }
    };

    // ---- Api ----

    function Api(endpoints, platform) {
        validateEndpoints(endpoints);
        this.endpoints = endpoints;
        this.platform = platform;
        this._names = {};
    }

    Api.prototype.url = function(key) {
        return this.platform.resolve(this.endpoints[key]);
    };

    // query sends an L8Query. live = {id, owner, hooks} registers it for pushes
    // (one of the Layer8DWebSocket live slots); without it the query is plain.
    Api.prototype.query = function(key, text, live) {
        var url = this.url(key);
        var body = live ? Layer8DWebSocket.registerQuery(live.id, live.owner, url, text, live.hooks) : { text: text };
        return this.platform.request('GET', url + '?body=' + encodeURIComponent(JSON.stringify(body)))
            .then(function(data) { return data ? (data.list || []) : []; });
    };

    Api.prototype.post = function(key, obj) { return this.platform.request('POST', this.url(key), obj); };
    Api.prototype.patch = function(key, obj) { return this.platform.request('PATCH', this.url(key), obj); };

    // ---- users (only userId and fullName are ever selected) ----

    function quoteList(values) { return '[' + values.join(',') + ']'; }

    // names resolves user IDs to full names, batched and cached for the session.
    Api.prototype.names = function(userIds) {
        var self = this;
        var missing = userIds.filter(function(id) { return id && !(id in self._names); });
        if (!missing.length) return Promise.resolve(this._names);
        missing.forEach(function(id) { self._names[id] = id; }); // placeholder until resolved
        return this.query('users', 'select userId,fullName from L8User where userId in ' + quoteList(missing))
            .then(function(users) {
                users.forEach(function(u) { self._names[u.userId] = u.fullName || u.userId; });
                return self._names;
            });
    };

    Api.prototype.name = function(userId) {
        return this._names[userId] || userId;
    };

    Api.prototype.searchUsers = function(text, limit) {
        var clean = String(text).replace(/[^\w\s.@-]/g, '').trim();
        var self = this;
        return this.query('users', 'select userId,fullName from L8User where fullName=*' + clean +
            '* sort-by fullName limit ' + (limit || 20) + ' page 0').then(function(users) {
                users.forEach(function(u) { self._names[u.userId] = u.fullName || u.userId; });
                return users;
            });
    };

    Api.prototype.listUsers = function(limit) {
        var self = this;
        return this.query('users', 'select userId,fullName from L8User sort-by fullName limit ' + limit + ' page 0')
            .then(function(users) {
                users.forEach(function(u) { self._names[u.userId] = u.fullName || u.userId; });
                return users;
            });
    };

    function escape(text) {
        return String(text === undefined || text === null ? '' : text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    window.L8ChatApi = {
        escape: escape,
        REQUIRED_ENDPOINTS: REQUIRED_ENDPOINTS,
        create: function(endpoints, platform) { return new Api(endpoints, platform); },
        validateEndpoints: validateEndpoints,
        desktopPlatform: desktopPlatform,
        mobilePlatform: mobilePlatform,
        ids: ids,
        quoteList: quoteList
    };
})();
