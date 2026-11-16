// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatBubble - the desktop chat: a floating button and a panel with the
// sidebar, a slide-out conversation list and the thread.
//
//   L8ChatBubble.init({ endpoints: { msg, conv, peer, sync, stat, group, users, llmProf },
//                       tantoUserId: 'tanto' })
//
// Every endpoint is the adopter's; a missing one throws at init.

(function() {
    'use strict';

    var CHAT_SVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor"/></svg>';
    var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>';

    window.L8ChatBubble = {
        _session: null,
        _btn: null,
        _panel: null,
        _open: false,
        _rendered: false,

        init: function(config) {
            if (this._session) return;
            config = config || {};
            L8ChatApi.validateEndpoints(config.endpoints);
            this._session = L8ChatSession.create(config.endpoints, L8ChatApi.desktopPlatform(),
                config.tantoUserId || 'tanto');

            this._btn = document.createElement('button');
            this._btn.className = 'l8chat-bubble-btn';
            this._btn.title = 'Chat';
            this._btn.innerHTML = CHAT_SVG + '<span class="l8chat-bubble-badge"></span>';
            document.body.appendChild(this._btn);

            this._panel = document.createElement('div');
            this._panel.className = 'l8chat-bubble-panel';
            document.body.appendChild(this._panel);

            var self = this;
            this._btn.addEventListener('click', function() { self.toggle(); });
            this._session.store.on('peers', function() { self._updateBadge(); });
            this._session.start();
        },

        toggle: function() {
            if (this._open) this.close();
            else this.open();
        },

        open: function() {
            if (this._open) return;
            this._open = true;
            if (!this._rendered) this._render();
            this._panel.classList.add('l8chat-bubble-open');
            // Panel opened: the registrations may have been evicted by the page.
            this._session.live.registerConversations();
        },

        close: function() {
            if (!this._open) return;
            this._open = false;
            this._panel.classList.remove('l8chat-bubble-open');
        },

        _render: function() {
            var self = this;
            var session = this._session;
            this._rendered = true;
            this._panel.innerHTML =
                '<div class="l8chat-panel">' +
                    '<div class="l8chat-panel-header"><span class="l8chat-panel-title">Chat</span>' +
                        '<button class="l8chat-icon-btn l8chat-close" title="Close">' + CLOSE_SVG + '</button></div>' +
                    '<div class="l8chat-panel-body">' +
                        '<div class="l8chat-col-sidebar"></div>' +
                        '<div class="l8chat-col-convs"></div>' +
                        '<div class="l8chat-col-thread"></div>' +
                    '</div>' +
                '</div>';
            this._panel.querySelector('.l8chat-close').addEventListener('click', function() { self.close(); });
            var convCol = this._panel.querySelector('.l8chat-col-convs');
            L8ChatSidebar.render(this._panel.querySelector('.l8chat-col-sidebar'), session, {
                onPeer: function(peer) {
                    convCol.classList.add('l8chat-col-convs-open');
                    session.openPeer(peer).then(function(defaultId) {
                        var list = session.store.conversationsOf(peer.peerKey);
                        var target = list.filter(function(c) { return c.conversationId === defaultId; })[0] || list[0];
                        if (target) return session.openConversation(target.conversationId);
                    }).catch(function(err) { session.platform.notifyError('Chat', err.message); });
                }
            });
            L8ChatConvList.render(convCol, session, {
                onOpen: function(conversationId) { session.openConversation(conversationId); }
            });
            L8ChatThread.render(this._panel.querySelector('.l8chat-col-thread'), session);
        },

        _updateBadge: function() {
            var unread = this._session.store.peers.some(function(p) {
                return (p.unreadConversationIds || []).length > 0;
            });
            this._btn.classList.toggle('l8chat-bubble-unread', unread);
        }
    };
})();
