// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatLive - keeps the chat current (plan §5.5, §5.7):
//   - 3 live registrations: my conversations (all instances), the open
//     thread, and the status of the visible peers; re-registered on reconnect
//   - pushes applied in notifSeq order: a gap waits 1 s, then a gap fill;
//     a reset (ownership moved) asks for a snapshot
//   - every 60 s a "latest only" ChatSync poll and a status re-read
//   - presence heartbeat every 60 s, away after 5 idle minutes
//   - a message without its push after 10 s is resent with the same messageId

(function() {
    'use strict';

    var REG_CONV = 'l8chat-conv';
    var REG_THREAD = 'l8chat-thread';
    var REG_STAT = 'l8chat-stat';
    var PAGE = 10;
    var GAP_WAIT = 1000;
    var POLL_EVERY = 60000;
    var HEARTBEAT_EVERY = 60000;
    var AWAY_AFTER = 5 * 60000;
    var RESEND_AFTER = 10000;
    var POLL_MAX_IDS = 100;

    var ONLINE = 1, AWAY = 2;

    function Live(session) {
        this.s = session;
        this.timers = [];
        this.lastActivity = Date.now();
        this.away = false;
        this.threadConversationId = null;
        this.statusIds = [];
    }

    Live.prototype.start = function() {
        var self = this;
        this.registerConversations().catch(function() {});
        this.refreshPeers().catch(function() {});
        this.heartbeat();
        ['mousemove', 'keydown', 'focus', 'touchstart'].forEach(function(evt) {
            window.addEventListener(evt, function() { self.activity(); }, { passive: true });
        });
        this.timers.push(setInterval(function() { self.heartbeat(); }, HEARTBEAT_EVERY));
        this.timers.push(setInterval(function() { self.poll(); }, POLL_EVERY));
        this.timers.push(setInterval(function() { self.resend(); }, 2000));
    };

    Live.prototype.hooks = function(refetch) {
        var self = this;
        return { onDetach: function() {}, onReconnect: function() { refetch.call(self); self.syncAll(); } };
    };

    Live.prototype.listen = function(id, modelType, fn) {
        var self = this;
        Layer8DWebSocket.listen(id, this, modelType, function(msg) { fn.call(self, msg); });
    };

    // ---- registrations ----

    // registerConversations registers "my conversations" on every instance.
    // The fetch itself is limited to one row: the sidebar comes from ChatPeer.
    Live.prototype.registerConversations = function() {
        var s = this.s;
        var self = this;
        return s.api.query('conv', 'select * from ChatConversation where members.userId=' + s.store.me + ' limit 1 page 0',
            { id: REG_CONV, owner: this, hooks: this.hooks(this.registerConversations) })
            .then(function() { self.listen(REG_CONV, 'ChatConversation', self.onConversationPush); });
    };

    Live.prototype.refreshPeers = function() {
        var s = this.s;
        var self = this;
        return s.api.query('peer', 'select * from ChatPeer limit 30 page 0').then(function(rows) {
            var userIds = rows.filter(function(r) { return Number(r.peerKind) === L8ChatStore.PEER_USER; })
                .map(function(r) { return r.peerId; });
            return s.api.names(userIds).then(function() {
                s.store.setPeers(rows);
                self.registerStatuses(userIds);
            });
        });
    };

    // registerStatuses registers the presence of the visible peers (and me).
    Live.prototype.registerStatuses = function(userIds) {
        var s = this.s;
        var self = this;
        var ids = [s.store.me, s.tanto].concat(userIds).filter(function(id, i, all) { return id && all.indexOf(id) === i; });
        this.statusIds = ids.slice(0, 32);
        return s.api.query('stat', 'select * from ChatUserStatus where userId in ' + L8ChatApi.quoteList(this.statusIds),
            { id: REG_STAT, owner: this, hooks: this.hooks(function() { this.registerStatuses(this.statusIds); }) })
            .then(function(rows) {
                rows.forEach(function(r) { s.store.applyStatus(r); });
                self.listen(REG_STAT, 'ChatUserStatus', function(msg) {
                    if (msg.record) s.store.applyStatus(msg.record);
                });
            });
    };

    // openThread registers the thread's newest page (plan §5.3).
    Live.prototype.openThread = function(conversationId) {
        var s = this.s;
        var self = this;
        this.threadConversationId = conversationId;
        return s.api.query('msg', 'select * from ChatMessage where conversationId=' + conversationId +
            ' sort-by seq descending limit ' + PAGE + ' page 0',
            { id: REG_THREAD, owner: this, hooks: this.hooks(function() { this.openThread(this.threadConversationId); }) })
            .then(function(list) {
                s.store.openThread(conversationId, list, list.length >= PAGE);
                self.listen(REG_THREAD, 'ChatMessage', self.onMessagePush);
            });
    };

    Live.prototype.loadOlder = function() {
        var s = this.s;
        var oldest = s.store.oldestSeq();
        if (!s.store.thread || oldest <= 1) return Promise.resolve();
        return s.api.query('msg', 'select * from ChatMessage where conversationId=' + s.store.thread.conversationId +
            ' and seq<' + oldest + ' sort-by seq descending limit ' + PAGE + ' page 0')
            .then(function(list) { s.store.prependOlder(list, list.length >= PAGE); });
    };

    // ---- pushes in notifSeq order (plan §5.7) ----

    Live.prototype.onConversationPush = function(msg) {
        if (msg.record) this.ordered(msg.record.conversationId, msg.record.notifSeq, { conv: msg.record, action: msg.action });
    };

    Live.prototype.onMessagePush = function(msg) {
        if (msg.record) this.ordered(msg.record.conversationId, msg.record.notifSeq, { msg: msg.record });
    };

    Live.prototype.ordered = function(conversationId, notifSeq, change) {
        var store = this.s.store;
        var self = this;
        switch (store.accept(conversationId, notifSeq, change)) {
            case 'apply':
                this.apply(change);
                store.drain(conversationId).forEach(function(c) { self.apply(c); });
                break;
            case 'reset':
                this.apply(change);
                this.gapFill(conversationId, true);
                break;
            case 'gap':
                setTimeout(function() {
                    if (store.hasGap(conversationId)) self.gapFill(conversationId, false);
                }, GAP_WAIT);
                break;
        }
    };

    Live.prototype.apply = function(change) {
        if (change.conv) this.s.store.applyConversation(change.conv, change.action === 'delete');
        if (change.msg) this.s.store.applyMessage(change.msg);
    };

    // gapFill asks the owner for what was missed after the last applied push;
    // snapshot asks for the current header and newest messages instead.
    Live.prototype.gapFill = function(conversationId, snapshot) {
        var s = this.s;
        var self = this;
        var after = snapshot ? 0 : s.store.lastNotif(conversationId);
        var lastMsgSeq = s.store.newestSeq(conversationId);
        return s.api.query('sync', 'select * from ChatSync where conversationId=' + conversationId +
            ' and notifSeq>' + after + ' and lastMsgSeq=' + lastMsgSeq).then(function(rows) {
                if (rows[0]) self.applySync(rows[0]);
            });
    };

    Live.prototype.applySync = function(sync) {
        var store = this.s.store;
        if (sync.conversation) store.applyConversation(sync.conversation, false);
        if (sync.snapshot && sync.conversation && store.thread && store.thread.conversationId === sync.conversationId) {
            // Drop messages the server no longer has (lost in an owner crash).
            var lastSeq = Number(sync.conversation.lastSeq || 0);
            store.thread.messages = store.thread.messages.filter(function(m) {
                return m._pending || Number(m.seq || 0) <= lastSeq;
            });
        }
        (sync.messages || []).forEach(function(m) { store.applyMessage(m); });
        store.setLast(sync.conversationId, sync.notifSeq);
        store.emit('thread');
    };

    // ---- drift detection ----

    // shownConversations are the conversations the UI shows: the open thread,
    // the selected peer's list and the unread ones of the sidebar.
    Live.prototype.shownConversations = function() {
        var store = this.s.store;
        var ids = {};
        if (store.thread) ids[store.thread.conversationId] = true;
        if (store.selectedPeer) {
            store.conversationsOf(store.selectedPeer.peerKey).forEach(function(c) { ids[c.conversationId] = true; });
        }
        store.peers.forEach(function(p) { (p.unreadConversationIds || []).forEach(function(id) { ids[id] = true; }); });
        return Object.keys(ids).slice(0, POLL_MAX_IDS);
    };

    // poll: one "latest only" ChatSync query, then a gap fill where behind and
    // a snapshot where the server restarted the sequence; then statuses.
    Live.prototype.poll = function() {
        var s = this.s;
        var self = this;
        var ids = this.shownConversations();
        if (ids.length) {
            s.api.query('sync', 'select * from ChatSync where conversationId in ' + L8ChatApi.quoteList(ids))
                .then(function(rows) {
                    rows.forEach(function(r) {
                        var last = s.store.lastNotif(r.conversationId);
                        var server = Number(r.notifSeq || 0);
                        if (server > last) self.gapFill(r.conversationId, false);
                        else if (server < last) self.gapFill(r.conversationId, true);
                    });
                });
        }
        if (this.statusIds.length) this.registerStatuses(this.statusIds.filter(function(id) { return id !== s.store.me; }));
    };

    // syncAll runs after a websocket reconnect: every shown conversation catches up.
    Live.prototype.syncAll = function() {
        var self = this;
        this.shownConversations().forEach(function(id) { self.gapFill(id, false); });
    };

    // ---- presence ----

    Live.prototype.activity = function() {
        this.lastActivity = Date.now();
        if (this.away) {
            this.away = false;
            this.heartbeat();
        }
    };

    // heartbeat reports my presence: my chosen status, or away when idle.
    Live.prototype.heartbeat = function() {
        var s = this.s;
        var chosen = s.chosenStatus || { presence: ONLINE };
        var status = Object.assign({ userId: s.store.me }, chosen);
        if (Date.now() - this.lastActivity > AWAY_AFTER && Number(chosen.presence) === ONLINE) {
            this.away = true;
            status.presence = AWAY;
        }
        s.api.patch('stat', status).catch(function() {});
    };

    // ---- resend ----

    Live.prototype.resend = function() {
        var s = this.s;
        var now = Date.now();
        Object.keys(s.store.pending).forEach(function(id) {
            var p = s.store.pending[id];
            if (now - p.sentAt >= RESEND_AFTER) {
                p.sentAt = now;
                s.api.post('msg', p.message).catch(function() {});
            }
        });
    };

    window.L8ChatLive = {
        PAGE: PAGE,
        ONLINE: ONLINE,
        AWAY: AWAY,
        OFFLINE: 3,
        CUSTOM: 4,
        create: function(session) { return new Live(session); }
    };
})();
