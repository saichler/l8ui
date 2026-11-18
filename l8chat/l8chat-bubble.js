// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatBubble - the desktop chat: a floating button and a panel with the
// sidebar, a slide-out conversation list and the thread. The panel moves by
// dragging its header (it stays inside the window and keeps its place across
// close, reopen and reload), and maximizes to the window from the header's
// button or a double-click on the header.
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
    var COLLAPSE_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/></svg>';
    var EXPAND_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/></svg>';

    var MAXIMIZE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg>';
    var RESTORE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/></svg>';

    // Per-viewer convenience only; storage may be unavailable (private window).
    function loadCollapsed(key) {
        try { return localStorage.getItem('l8chat-collapsed-' + key) === '1'; } catch (e) { return false; }
    }
    function saveCollapsed(key, collapsed) {
        try { localStorage.setItem('l8chat-collapsed-' + key, collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
    }

    // The dragged position of the panel, a per-viewer convenience.
    function loadPosition() {
        try {
            var p = JSON.parse(localStorage.getItem('l8chat-position') || 'null');
            return p && isFinite(p.left) && isFinite(p.top) ? { left: Number(p.left), top: Number(p.top) } : null;
        } catch (e) { return null; }
    }
    function savePosition(pos) {
        try {
            if (pos) localStorage.setItem('l8chat-position', JSON.stringify(pos));
            else localStorage.removeItem('l8chat-position');
        } catch (e) { /* ignore */ }
    }

    // collapsible makes a side column fold to the left, down to a strip that
    // still shows its status / unread dots (each row's name is its tooltip).
    function collapsible(col, key) {
        var btn = col.querySelector('.l8chat-collapse');
        var apply = function(collapsed) {
            col.classList.toggle('l8chat-col-collapsed', collapsed);
            btn.innerHTML = collapsed ? EXPAND_SVG : COLLAPSE_SVG;
            btn.title = collapsed ? 'Expand' : 'Collapse';
        };
        apply(loadCollapsed(key));
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var collapsed = !col.classList.contains('l8chat-col-collapsed');
            apply(collapsed);
            saveCollapsed(key, collapsed);
        });
    }

    window.L8ChatBubble = {
        _session: null,
        _btn: null,
        _panel: null,
        _open: false,
        _rendered: false,
        _pos: null, // { left, top } once dragged; null: the default corner

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
            this._pos = loadPosition();
            this._btn.addEventListener('click', function() { self.toggle(); });
            window.addEventListener('resize', function() {
                if (self._pos && self._open && !self.isMaximized()) self._place(self._pos);
            });
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
            if (this._pos && !this.isMaximized()) this._place(this._pos);
            // Panel opened: the registrations may have been evicted by the page.
            this._session.live.registerConversations();
        },

        close: function() {
            if (!this._open) return;
            this._open = false;
            this._panel.classList.remove('l8chat-bubble-open');
        },

        isMaximized: function() {
            return this._panel.classList.contains('l8chat-bubble-max');
        },

        // setMaximized fills the window with the panel, or restores its
        // normal size; the choice stays while the panel is closed and reopened.
        setMaximized: function(max) {
            this._panel.classList.toggle('l8chat-bubble-max', max);
            // Maximized fills the window; restored goes back where it was dragged.
            if (max) this._clearPlacement();
            else if (this._pos && this._open) this._place(this._pos);
            if (this._maxBtn) {
                this._maxBtn.innerHTML = max ? RESTORE_SVG : MAXIMIZE_SVG;
                this._maxBtn.title = max ? 'Restore' : 'Maximize';
            }
        },

        // resetPosition puts the panel back in its default corner.
        resetPosition: function() {
            this._pos = null;
            savePosition(null);
            this._clearPlacement();
        },

        // _place moves the panel to pos, kept fully inside the window, and
        // returns where it went.
        _place: function(pos) {
            var w = this._panel.offsetWidth, h = this._panel.offsetHeight;
            var left = Math.min(Math.max(0, pos.left), Math.max(0, window.innerWidth - w));
            var top = Math.min(Math.max(0, pos.top), Math.max(0, window.innerHeight - h));
            var st = this._panel.style;
            st.left = left + 'px';
            st.top = top + 'px';
            st.right = 'auto';
            st.bottom = 'auto';
            return { left: left, top: top };
        },

        _clearPlacement: function() {
            var st = this._panel.style;
            st.left = st.top = st.right = st.bottom = '';
        },

        // _draggable moves the panel by its header (not its buttons).
        _draggable: function(header) {
            var self = this;
            var drag = null;
            header.addEventListener('pointerdown', function(e) {
                if (e.button !== 0 || self.isMaximized() || e.target.closest('button, select, input, a')) return;
                var r = self._panel.getBoundingClientRect();
                drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, id: e.pointerId };
                header.setPointerCapture(e.pointerId);
                self._panel.classList.add('l8chat-dragging');
                e.preventDefault();
            });
            header.addEventListener('pointermove', function(e) {
                if (!drag || e.pointerId !== drag.id) return;
                self._pos = self._place({ left: e.clientX - drag.dx, top: e.clientY - drag.dy });
            });
            var end = function(e) {
                if (!drag || e.pointerId !== drag.id) return;
                drag = null;
                self._panel.classList.remove('l8chat-dragging');
                if (header.hasPointerCapture(e.pointerId)) header.releasePointerCapture(e.pointerId);
                if (self._pos) savePosition(self._pos);
            };
            header.addEventListener('pointerup', end);
            header.addEventListener('pointercancel', end);
            header.addEventListener('dblclick', function(e) {
                if (e.target.closest('button, select, input, a')) return;
                self.setMaximized(!self.isMaximized());
            });
        },

        _render: function() {
            var self = this;
            var session = this._session;
            this._rendered = true;
            this._panel.innerHTML =
                '<div class="l8chat-panel">' +
                    '<div class="l8chat-panel-header"><span class="l8chat-panel-title">Chat</span>' +
                        '<span class="l8chat-panel-actions">' +
                            '<button class="l8chat-icon-btn l8chat-maximize"></button>' +
                            '<button class="l8chat-icon-btn l8chat-close" title="Close">' + CLOSE_SVG + '</button>' +
                        '</span></div>' +
                    '<div class="l8chat-panel-body">' +
                        '<div class="l8chat-col-sidebar"></div>' +
                        '<div class="l8chat-col-convs"></div>' +
                        '<div class="l8chat-col-thread"></div>' +
                    '</div>' +
                '</div>';
            this._panel.querySelector('.l8chat-close').addEventListener('click', function() { self.close(); });
            this._maxBtn = this._panel.querySelector('.l8chat-maximize');
            this._maxBtn.addEventListener('click', function() { self.setMaximized(!self.isMaximized()); });
            this.setMaximized(false);
            this._draggable(this._panel.querySelector('.l8chat-panel-header'));
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
            collapsible(this._panel.querySelector('.l8chat-col-sidebar'), 'sidebar');
            collapsible(convCol, 'convs');
        },

        _updateBadge: function() {
            var unread = this._session.store.peers.some(function(p) {
                return (p.unreadConversationIds || []).length > 0;
            });
            this._btn.classList.toggle('l8chat-bubble-unread', unread);
        }
    };
})();
