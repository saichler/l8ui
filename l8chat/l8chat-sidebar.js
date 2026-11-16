// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatSidebar - me and my status, then the peers (plan §6.2): Tanto pinned
// first, then the peers by newest message, padded alphabetically with users
// to 30 rows; a user search replaces the list while it has text.

(function() {
    'use strict';

    var ROWS = 30;
    var SEARCH_DELAY = 300;

    function Sidebar(container, session, handlers) {
        this.el = container;
        this.s = session;
        this.handlers = handlers;
        this.searchResults = null;
        this.padding = [];
        this.searchTimer = null;
    }

    Sidebar.prototype.render = function() {
        var self = this;
        this.el.innerHTML =
            '<div class="l8chat-sidebar">' +
                '<div class="l8chat-me">' +
                    '<button class="l8chat-me-status" title="Set your status"></button>' +
                    '<span class="l8chat-me-name"></span>' +
                    '<button class="l8chat-icon-btn l8chat-new-group" title="New group">+</button>' +
                '</div>' +
                '<div class="l8chat-divider"></div>' +
                '<input type="search" class="l8chat-search" placeholder="Search users">' +
                '<div class="l8chat-peers"></div>' +
            '</div>';
        this.el.querySelector('.l8chat-me-status').addEventListener('click', function(e) {
            L8ChatStatus.openPicker(e.currentTarget, self.s);
        });
        this.el.querySelector('.l8chat-new-group').addEventListener('click', function() {
            L8ChatGroupDialog.open(self.s);
        });
        this.el.querySelector('.l8chat-search').addEventListener('input', function(e) {
            self.search(e.target.value);
        });
        ['peers', 'status', 'me'].forEach(function(evt) {
            self.s.store.on(evt, function() { self.update(); });
        });
        this.s.api.listUsers(ROWS).then(function(users) {
            self.padding = users;
            self.update();
        });
        this.update();
    };

    Sidebar.prototype.search = function(text) {
        var self = this;
        clearTimeout(this.searchTimer);
        if (!text.trim()) {
            this.searchResults = null;
            this.update();
            return;
        }
        this.searchTimer = setTimeout(function() {
            self.s.api.searchUsers(text, 20).then(function(users) {
                self.searchResults = users.filter(function(u) { return u.userId !== self.s.store.me; });
                self.update();
            });
        }, SEARCH_DELAY);
    };

    // rows returns the list to show: [{peer, name, preview, unread, status}].
    Sidebar.prototype.rows = function() {
        var s = this.s;
        var store = s.store;
        if (this.searchResults) {
            return this.searchResults.map(function(u) {
                return { peer: s.userPeer(u.userId), name: u.fullName || u.userId, status: store.statuses[u.userId] };
            });
        }
        var tantoRow = store.peers.filter(function(p) { return Number(p.peerKind) === L8ChatStore.PEER_AGENT; })[0] || {};
        var rows = [{ peer: s.tantoPeer(), name: s.peerName(L8ChatStore.PEER_AGENT), preview: tantoRow.lastPreview,
            unread: (tantoRow.unreadConversationIds || []).length > 0, status: store.statuses[s.tanto] }];
        var seen = {};
        store.peers.forEach(function(p) {
            var kind = Number(p.peerKind);
            if (kind === L8ChatStore.PEER_AGENT) return;
            var peer = kind === L8ChatStore.PEER_GROUP ? s.groupPeer(p.peerId) : s.userPeer(p.peerId);
            seen[p.peerId] = true;
            rows.push({ peer: peer, name: s.peerName(kind, p.peerId, p.displayName), preview: p.lastPreview,
                unread: (p.unreadConversationIds || []).length > 0, status: store.statuses[p.peerId],
                group: kind === L8ChatStore.PEER_GROUP });
        });
        this.padding.forEach(function(u) {
            if (rows.length >= ROWS || seen[u.userId] || u.userId === store.me) return;
            rows.push({ peer: s.userPeer(u.userId), name: u.fullName || u.userId, status: store.statuses[u.userId] });
        });
        return rows.slice(0, ROWS);
    };

    Sidebar.prototype.update = function() {
        var self = this;
        var store = this.s.store;
        this.el.querySelector('.l8chat-me-status').innerHTML = L8ChatStatus.dot(store.myStatus);
        this.el.querySelector('.l8chat-me-name').textContent = this.s.api.name(store.me);
        var list = this.el.querySelector('.l8chat-peers');
        var selected = store.selectedPeer ? store.selectedPeer.peerKey : '';
        var rows = this.rows();
        list.innerHTML = rows.map(function(r, i) {
            var badge = r.group ? '<span class="l8chat-group-icon" title="Group">#</span>' : L8ChatStatus.dot(r.status);
            return '<div class="l8chat-peer' + (r.peer.peerKey === selected ? ' l8chat-peer-selected' : '') +
                '" data-index="' + i + '">' + badge +
                '<div class="l8chat-peer-text"><div class="l8chat-peer-name">' + L8ChatApi.escape(r.name) + '</div>' +
                (r.preview ? '<div class="l8chat-peer-preview">' + L8ChatApi.escape(r.preview) + '</div>' : '') +
                '</div>' + (r.unread ? '<span class="l8chat-unread"></span>' : '') + '</div>';
        }).join('');
        list.querySelectorAll('.l8chat-peer').forEach(function(rowEl) {
            rowEl.addEventListener('click', function() {
                var row = rows[Number(rowEl.getAttribute('data-index'))];
                self.handlers.onPeer(row.peer);
            });
        });
    };

    window.L8ChatSidebar = {
        render: function(container, session, handlers) {
            var sidebar = new Sidebar(container, session, handlers);
            sidebar.render();
            return sidebar;
        }
    };
})();
