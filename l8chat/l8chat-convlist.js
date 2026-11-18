// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatConvList - the selected peer's conversations, newest first (plan §6.3):
// a purple dot when there are messages I have not read, grey otherwise.

(function() {
    'use strict';

    function ConvList(container, session, handlers) {
        this.el = container;
        this.s = session;
        this.handlers = handlers;
    }

    ConvList.prototype.render = function() {
        var self = this;
        this.el.innerHTML =
            '<div class="l8chat-convlist">' +
                '<div class="l8chat-convlist-header">' +
                    '<span class="l8chat-convlist-title"></span>' +
                    '<button class="l8chat-icon-btn l8chat-new-conv" title="New conversation">+</button>' +
                    '<button class="l8chat-icon-btn l8chat-collapse"></button>' +
                '</div>' +
                '<div class="l8chat-convs"></div>' +
            '</div>';
        this.el.querySelector('.l8chat-new-conv').addEventListener('click', function() {
            L8ChatConvDialog.open(self.s);
        });
        this.s.store.on('conversations', function() { self.update(); });
        this.s.store.on('thread', function() { self.update(); });
        this.update();
    };

    ConvList.prototype.update = function() {
        var self = this;
        var store = this.s.store;
        var peer = store.selectedPeer;
        this.el.querySelector('.l8chat-convlist-title').textContent =
            peer ? this.s.peerName(peer.kind, peer.peerId, this.groupName(peer)) : '';
        var open = store.thread ? store.thread.conversationId : '';
        var convs = peer ? store.conversationsOf(peer.peerKey) : [];
        var list = this.el.querySelector('.l8chat-convs');
        list.innerHTML = convs.map(function(c) {
            return '<div class="l8chat-conv' + (c.conversationId === open ? ' l8chat-conv-open' : '') +
                '" data-id="' + L8ChatApi.escape(c.conversationId) + '" title="' +
                L8ChatApi.escape(c.title || 'Conversation') + '">' +
                '<span class="l8chat-conv-dot ' + (store.isUnread(c) ? 'l8chat-conv-unread' : 'l8chat-conv-read') + '"></span>' +
                '<div class="l8chat-conv-text"><div class="l8chat-conv-title">' + L8ChatApi.escape(c.title || 'Conversation') +
                '</div><div class="l8chat-conv-preview">' + L8ChatApi.escape(c.lastPreview || '') + '</div></div></div>';
        }).join('');
        list.querySelectorAll('.l8chat-conv').forEach(function(row) {
            row.addEventListener('click', function() { self.handlers.onOpen(row.getAttribute('data-id')); });
        });
    };

    ConvList.prototype.groupName = function(peer) {
        var row = this.s.store.peers.filter(function(p) { return p.peerId === peer.peerId; })[0];
        return row ? row.displayName : '';
    };

    window.L8ChatConvList = {
        render: function(container, session, handlers) {
            var list = new ConvList(container, session, handlers);
            list.render();
            return list;
        }
    };
})();
