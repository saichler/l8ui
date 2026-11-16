// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatBubbleMobile - the mobile bubble, same contract as the desktop one:
//
//   L8ChatBubbleMobile.init({ endpoints: { msg, conv, peer, sync, stat, group, users, llmProf },
//                             tantoUserId: 'tanto' })
//
// HTTP goes through Layer8MAuth and endpoints through Layer8MConfig.

(function() {
    'use strict';

    var CHAT_SVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor"/></svg>';

    window.L8ChatBubbleMobile = {
        _session: null,
        _btn: null,
        _panel: null,
        _open: false,
        _rendered: false,

        init: function(config) {
            if (this._session) return;
            config = config || {};
            L8ChatApi.validateEndpoints(config.endpoints);
            this._session = L8ChatSession.create(config.endpoints, L8ChatApi.mobilePlatform(),
                config.tantoUserId || 'tanto');

            this._btn = document.createElement('button');
            this._btn.className = 'l8chat-m-bubble-btn';
            this._btn.title = 'Chat';
            this._btn.innerHTML = CHAT_SVG + '<span class="l8chat-bubble-badge"></span>';
            document.body.appendChild(this._btn);

            this._panel = document.createElement('div');
            this._panel.className = 'l8chat-m-panel';
            document.body.appendChild(this._panel);

            var self = this;
            this._btn.addEventListener('click', function() { self.toggle(); });
            this._session.store.on('peers', function() {
                var unread = self._session.store.peers.some(function(p) {
                    return (p.unreadConversationIds || []).length > 0;
                });
                self._btn.classList.toggle('l8chat-bubble-unread', unread);
            });
            this._session.start();
        },

        toggle: function() {
            if (this._open) this.close();
            else this.open();
        },

        open: function() {
            if (this._open) return;
            var self = this;
            this._open = true;
            if (!this._rendered) {
                this._rendered = true;
                L8ChatMobile.render(this._panel, this._session, function() { self.close(); });
            }
            this._panel.classList.add('l8chat-m-open');
            this._session.live.registerConversations();
        },

        close: function() {
            if (!this._open) return;
            this._open = false;
            this._panel.classList.remove('l8chat-m-open');
        }
    };
})();
