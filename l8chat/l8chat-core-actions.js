// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatSession - one signed-in chat: the api, the store, the live updates and
// the user's actions. The desktop bubble and the mobile view each create one
// and render the same views over it.

(function() {
    'use strict';

    var PEER = L8ChatStore;

    function Session(endpoints, platform, tantoUserId) {
        this.platform = platform;
        this.tanto = tantoUserId;
        this.api = L8ChatApi.create(endpoints, platform);
        this.store = L8ChatStore.create(sessionStorage.getItem('currentUser'), tantoUserId);
        this.live = L8ChatLive.create(this);
        this.chosenStatus = null;
        this.profiles = null;
        this.started = false;
    }

    Session.prototype.start = function() {
        if (this.started) return;
        this.started = true;
        this.api.names([this.store.me]);
        this.live.start();
    };

    // ---- peers and conversations ----

    // tantoPeer is the pinned Tanto row, present before any conversation exists.
    Session.prototype.tantoPeer = function() {
        return { kind: PEER.PEER_AGENT, peerId: this.tanto, peerKey: L8ChatApi.ids.agentPeerKey(this.store.me) };
    };

    Session.prototype.userPeer = function(userId) {
        return { kind: PEER.PEER_USER, peerId: userId, peerKey: L8ChatApi.ids.directPeerKey(this.store.me, userId) };
    };

    Session.prototype.groupPeer = function(groupId) {
        return { kind: PEER.PEER_GROUP, peerId: groupId, peerKey: groupId };
    };

    // openPeer selects a peer: its default conversation is created if missing
    // (deterministic ID, so the POST is idempotent), then its list is loaded.
    Session.prototype.openPeer = function(peer) {
        var self = this;
        this.store.selectedPeer = peer;
        this.store.emit('conversations');
        return this.ensureDefault(peer).then(function(defaultId) {
            return self.loadConversations(peer, defaultId, 1).then(function() { return defaultId; });
        });
    };

    // loadConversations reads the peer's conversations from every instance. A
    // default conversation created a moment ago may not be on its owner yet,
    // so the list is read once more after a short wait when it is missing.
    Session.prototype.loadConversations = function(peer, defaultId, retries) {
        var self = this;
        return this.api.query('conv', 'select * from ChatConversation where members.userId=' + this.store.me +
            ' and peerKey="' + peer.peerKey + '"').then(function(list) {
                list.forEach(function(c) { self.store.applyConversation(c, false); });
                if (retries > 0 && defaultId && !self.store.conversations[defaultId]) {
                    return new Promise(function(resolve) { setTimeout(resolve, 500); })
                        .then(function() { return self.loadConversations(peer, defaultId, retries - 1); });
                }
            });
    };

    Session.prototype.ensureDefault = function(peer) {
        var me = this.store.me;
        var api = this.api;
        if (peer.kind === PEER.PEER_GROUP) return L8ChatApi.ids.groupConversationId(peer.peerId);
        var idPromise = peer.kind === PEER.PEER_AGENT ?
            L8ChatApi.ids.agentConversationId(me) : L8ChatApi.ids.directConversationId(me, peer.peerId);
        return idPromise.then(function(id) {
            var header = { conversationId: id, peerKind: peer.kind, peerKey: peer.peerKey,
                title: peer.kind === PEER.PEER_AGENT ? 'Tanto' : 'General' };
            return api.post('conv', header).then(function() { return id; });
        });
    };

    // openConversation opens a thread and marks it read.
    Session.prototype.openConversation = function(conversationId) {
        var self = this;
        return this.live.openThread(conversationId).then(function() { self.markRead(conversationId); });
    };

    Session.prototype.markRead = function(conversationId) {
        var conv = this.store.conversations[conversationId];
        if (!conv || !this.store.isUnread(conv)) return;
        this.api.patch('conv', { conversationId: conversationId,
            members: [{ userId: this.store.me, lastReadSeq: conv.lastSeq }] }).catch(function() {});
    };

    // createConversation adds a named conversation with the selected peer.
    Session.prototype.createConversation = function(title) {
        var peer = this.store.selectedPeer;
        var self = this;
        if (!peer) return Promise.reject(new Error('Select a peer first'));
        var header = { conversationId: L8ChatApi.ids.uuid4(), peerKind: peer.kind, peerKey: peer.peerKey, title: title };
        var ready = Promise.resolve();
        if (peer.kind === PEER.PEER_GROUP) {
            header.groupId = peer.peerId;
            ready = this.api.query('group', 'select * from ChatGroup where groupId=' + peer.peerId).then(function(groups) {
                var ids = groups[0] ? groups[0].memberIds || [] : [self.store.me];
                header.members = ids.map(function(id) { return { userId: id }; });
            });
        }
        return ready.then(function() { return self.api.post('conv', header); })
            .then(function() { return self.openPeer(peer); })
            .then(function() { return self.openConversation(header.conversationId); });
    };

    // createGroup creates a group; chat-users creates its General conversation.
    Session.prototype.createGroup = function(name, memberIds) {
        var self = this;
        return this.api.post('group', { name: name, memberIds: memberIds })
            .then(function() { return self.live.refreshPeers(); });
    };

    // ---- messages ----

    // send shows the message as pending and posts it; its push marks it sent,
    // otherwise it is resent with the same messageId (plan §5.2).
    Session.prototype.send = function(body, attachments) {
        var thread = this.store.thread;
        if (!thread || (!body && !(attachments && attachments.length))) return;
        var conv = this.store.conversations[thread.conversationId] || {};
        var m = { messageId: L8ChatApi.ids.uuid4(), conversationId: thread.conversationId, body: body || '',
            attachments: attachments || [] };
        if (conv.llmProfileId) m.llmProfileId = conv.llmProfileId;
        this.store.addPending(m);
        this.api.post('msg', m).catch(function() {});
    };

    Session.prototype.loadOlder = function() {
        return this.live.loadOlder();
    };

    // ---- presence ----

    Session.prototype.setStatus = function(presence, customText, customColor) {
        this.chosenStatus = { presence: presence, customText: customText || '', customColor: customColor || '' };
        this.live.heartbeat();
    };

    // ---- Tanto ----

    // loadProfiles caches the profiles; force re-reads them (profiles added in
    // l8secure show up the next time a Tanto conversation is opened).
    Session.prototype.loadProfiles = function(force) {
        var self = this;
        if (this.profiles && !force) return Promise.resolve(this.profiles);
        return this.api.query('llmProf', 'select * from L8LlmProfile').then(function(list) {
            self.profiles = list;
            return list;
        });
    };

    Session.prototype.setProfile = function(conversationId, profileId) {
        return this.api.patch('conv', { conversationId: conversationId, llmProfileId: profileId });
    };

    Session.prototype.isAgentConversation = function(conversationId) {
        var conv = this.store.conversations[conversationId];
        return !!conv && Number(conv.peerKind) === PEER.PEER_AGENT;
    };

    // peerName is the display name of a sidebar row or peer.
    Session.prototype.peerName = function(kind, peerId, displayName) {
        if (Number(kind) === PEER.PEER_AGENT) return 'Tanto (Layer8)';
        if (Number(kind) === PEER.PEER_GROUP) return displayName || 'Group';
        return this.api.name(peerId);
    };

    window.L8ChatSession = {
        create: function(endpoints, platform, tantoUserId) { return new Session(endpoints, platform, tantoUserId); }
    };
})();
