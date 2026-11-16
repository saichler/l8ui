// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatStore - the chat's client state and the reducers that apply pushed
// changes. Views subscribe with on(event, fn) and re-render on emit.
// Events: 'peers', 'conversations', 'thread', 'status', 'me'.
// Also the per-conversation notification sequence of plan §5.7: every push
// carries notifSeq; a gap is buffered and filled, a reset asks for a snapshot.

(function() {
    'use strict';

    // Enums arrive as numbers (l8web marshals with UseEnumNumbers); int64
    // fields arrive as strings, so they are read with Number().
    var PEER_USER = 1;
    var PEER_GROUP = 2;
    var PEER_AGENT = 3;

    function Store(me, tantoUserId) {
        this.me = me;
        this.tanto = tantoUserId;
        this.myStatus = null;
        this.peers = [];             // ChatPeer rows from the router, newest first
        this.conversations = {};     // ChatConversation by conversationId
        this.statuses = {};          // ChatUserStatus by userId
        this.selectedPeer = null;    // {kind, peerId, peerKey, name}
        this.thread = null;          // {conversationId, messages (ascending seq), hasOlder}
        this.pending = {};           // messageId → {message, sentAt}
        this.notif = {};             // conversationId → {last, buffer: {seq: change}}
        this._listeners = {};
    }

    Store.prototype.on = function(event, fn) {
        (this._listeners[event] = this._listeners[event] || []).push(fn);
    };

    Store.prototype.emit = function(event) {
        (this._listeners[event] || []).forEach(function(fn) { fn(); });
    };

    // ---- conversations and peers ----

    Store.prototype.isUnread = function(conv) {
        var me = this.me;
        var member = (conv.members || []).filter(function(m) { return m.userId === me; })[0];
        return Number(conv.lastSeq || 0) > Number((member && member.lastReadSeq) || 0);
    };

    // peerOf returns the peer of a conversation as seen by me.
    Store.prototype.peerOf = function(conv) {
        if (Number(conv.peerKind) === PEER_AGENT) return { kind: PEER_AGENT, peerId: this.tanto, peerKey: conv.peerKey };
        if (Number(conv.peerKind) === PEER_GROUP) return { kind: PEER_GROUP, peerId: conv.groupId, peerKey: conv.peerKey };
        var parts = String(conv.peerKey || '').split('|');
        var other = parts[0] === this.me ? parts[1] : parts[0];
        return { kind: PEER_USER, peerId: other, peerKey: conv.peerKey };
    };

    Store.prototype.setPeers = function(rows) {
        this.peers = rows.slice().sort(function(a, b) { return Number(b.lastMessageAt || 0) - Number(a.lastMessageAt || 0); });
        this.emit('peers');
    };

    // applyConversation stores a header (fetched or pushed) and keeps the
    // sidebar current: the peer's newest message time and unread set (§5.5).
    Store.prototype.applyConversation = function(conv, deleted) {
        if (deleted) {
            delete this.conversations[conv.conversationId];
            this.emit('conversations');
            return;
        }
        this.conversations[conv.conversationId] = conv;
        var peer = this.peerOf(conv);
        var row = this.peers.filter(function(p) { return Number(p.peerKind) === peer.kind && p.peerId === peer.peerId; })[0];
        if (!row) {
            row = { peerKind: peer.kind, peerId: peer.peerId, displayName: Number(conv.peerKind) === PEER_GROUP ? conv.title : '',
                lastMessageAt: 0, unreadConversationIds: [] };
            this.peers.push(row);
        }
        if (Number(conv.lastMessageAt || 0) > Number(row.lastMessageAt || 0)) {
            row.lastMessageAt = conv.lastMessageAt;
            row.lastPreview = conv.lastPreview;
        }
        var unread = (row.unreadConversationIds || []).filter(function(id) { return id !== conv.conversationId; });
        if (this.isUnread(conv)) unread.push(conv.conversationId);
        row.unreadConversationIds = unread;
        this.setPeers(this.peers);
        this.emit('conversations');
        if (this.thread && this.thread.conversationId === conv.conversationId) this.emit('thread');
    };

    // conversationsOf returns my conversations with a peer, newest first.
    Store.prototype.conversationsOf = function(peerKey) {
        var self = this;
        return Object.keys(this.conversations).map(function(id) { return self.conversations[id]; })
            .filter(function(c) { return c.peerKey === peerKey; })
            .sort(function(a, b) { return Number(b.lastMessageAt || 0) - Number(a.lastMessageAt || 0); });
    };

    // ---- thread ----

    Store.prototype.openThread = function(conversationId, messages, hasOlder) {
        this.thread = { conversationId: conversationId, messages: sortBySeq(messages), hasOlder: hasOlder };
        this.emit('thread');
    };

    Store.prototype.prependOlder = function(messages, hasOlder) {
        if (!this.thread) return;
        this.thread.messages = sortBySeq(dedupe(messages.concat(this.thread.messages)));
        this.thread.hasOlder = hasOlder;
        this.emit('thread');
    };

    // applyMessage adds a pushed or fetched message to the open thread and
    // marks my own pending message as sent (plan §5.2 step 5).
    Store.prototype.applyMessage = function(m) {
        delete this.pending[m.messageId];
        if (!this.thread || this.thread.conversationId !== m.conversationId) return;
        var list = this.thread.messages.filter(function(x) { return x.messageId !== m.messageId; });
        list.push(m);
        this.thread.messages = sortBySeq(list);
        this.emit('thread');
    };

    Store.prototype.addPending = function(m) {
        this.pending[m.messageId] = { message: m, sentAt: Date.now() };
        if (this.thread && this.thread.conversationId === m.conversationId) {
            this.thread.messages.push(Object.assign({ _pending: true }, m));
            this.emit('thread');
        }
    };

    Store.prototype.oldestSeq = function() {
        var msgs = this.thread ? this.thread.messages.filter(function(m) { return !m._pending; }) : [];
        return msgs.length ? Number(msgs[0].seq) : 0;
    };

    Store.prototype.newestSeq = function(conversationId) {
        if (!this.thread || this.thread.conversationId !== conversationId) return 0;
        var msgs = this.thread.messages.filter(function(m) { return !m._pending; });
        return msgs.length ? Number(msgs[msgs.length - 1].seq) : 0;
    };

    // ---- presence ----

    Store.prototype.applyStatus = function(s) {
        this.statuses[s.userId] = s;
        if (s.userId === this.me) {
            this.myStatus = s;
            this.emit('me');
        }
        this.emit('status');
    };

    // ---- notification sequence (plan §5.7) ----

    // accept classifies a push of a conversation: 'apply' (next in order),
    // 'reset' (ownership moved: notifSeq restarted), 'gap' (an earlier push
    // is missing; the change is buffered) or 'dup'. A conversation not seen
    // before starts at the push it gets.
    Store.prototype.accept = function(conversationId, seq, change) {
        seq = Number(seq || 0);
        var n = this.notif[conversationId];
        if (!n) {
            this.notif[conversationId] = { last: seq, buffer: {} };
            return 'apply';
        }
        if (seq === n.last + 1) {
            n.last = seq;
            return 'apply';
        }
        if (seq <= 1) {
            n.last = seq;
            n.buffer = {};
            return 'reset';
        }
        if (seq <= n.last) return 'dup';
        n.buffer[seq] = change;
        return 'gap';
    };

    // drain returns the buffered changes that now follow in order.
    Store.prototype.drain = function(conversationId) {
        var n = this.notif[conversationId];
        var ready = [];
        while (n && n.buffer[n.last + 1]) {
            n.last++;
            ready.push(n.buffer[n.last]);
            delete n.buffer[n.last];
        }
        return ready;
    };

    Store.prototype.hasGap = function(conversationId) {
        var n = this.notif[conversationId];
        return !!n && Object.keys(n.buffer).length > 0;
    };

    // setLast moves the sequence after a gap fill or snapshot.
    Store.prototype.setLast = function(conversationId, seq) {
        this.notif[conversationId] = { last: Number(seq || 0), buffer: {} };
    };

    Store.prototype.lastNotif = function(conversationId) {
        var n = this.notif[conversationId];
        return n ? n.last : 0;
    };

    function sortBySeq(list) {
        return list.sort(function(a, b) {
            if (a._pending !== b._pending) return a._pending ? 1 : -1;
            return Number(a.seq || 0) - Number(b.seq || 0);
        });
    }

    function dedupe(list) {
        var seen = {};
        return list.filter(function(m) {
            if (seen[m.messageId]) return false;
            seen[m.messageId] = true;
            return true;
        });
    }

    window.L8ChatStore = {
        PEER_USER: PEER_USER,
        PEER_GROUP: PEER_GROUP,
        PEER_AGENT: PEER_AGENT,
        create: function(me, tantoUserId) { return new Store(me, tantoUserId); }
    };
})();
