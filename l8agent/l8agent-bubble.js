/*
(c) 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/
// Floating AI Chat Bubble
// Creates a fixed-position button and expandable chat panel with its own chat instance.
// Does not conflict with L8AgentChat singleton used in the AIA section.

(function() {
    'use strict';

    var CHAT_SVG = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor"/>' +
        '</svg>';

    var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>' +
        '</svg>';

    window.L8AgentBubble = {
        _open: false,
        _initialized: false,
        _chatReady: false,
        _panel: null,
        _btn: null,
        _conversationId: null,
        _loading: false,

        init: function(config) {
            if (this._initialized) return;
            this._config = config || {};
            this._chatEndpoint = config.chatEndpoint || '/120/AgntChat';
            this._createDOM();
            this._attachEvents();
            this._initialized = true;
        },

        _createDOM: function() {
            this._btn = document.createElement('button');
            this._btn.className = 'l8agent-bubble-btn';
            this._btn.title = 'AI Assistant';
            this._btn.innerHTML = CHAT_SVG;
            document.body.appendChild(this._btn);

            this._panel = document.createElement('div');
            this._panel.className = 'l8agent-bubble-panel';
            document.body.appendChild(this._panel);
        },

        _attachEvents: function() {
            var self = this;
            this._btn.addEventListener('click', function() { self.toggle(); });
        },

        toggle: function() {
            if (this._open) this.close();
            else this.open();
        },

        open: function() {
            if (this._open) return;
            this._open = true;
            this._panel.classList.add('l8agent-bubble-open');

            if (!this._chatReady) {
                this._renderChat();
                this._chatReady = true;
            }

            var input = this._panel.querySelector('.l8agent-chat-input');
            if (input) setTimeout(function() { input.focus(); }, 100);
        },

        close: function() {
            if (!this._open) return;
            this._open = false;
            this._panel.classList.remove('l8agent-bubble-open');
        },

        _renderChat: function() {
            var self = this;
            this._panel.innerHTML =
                '<div class="l8agent-chat">' +
                    '<div class="l8agent-chat-header">' +
                        '<div class="l8agent-chat-title">AI Assistant</div>' +
                        '<div class="l8agent-chat-actions">' +
                            '<button class="layer8d-btn layer8d-btn-small l8agent-bubble-new-btn">New</button>' +
                            '<button class="l8agent-bubble-close" title="Close">' + CLOSE_SVG + '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="l8agent-chat-messages"></div>' +
                    '<div class="l8agent-chat-input-area">' +
                        '<textarea class="l8agent-chat-input" placeholder="Ask a question..." rows="2"></textarea>' +
                        '<button class="layer8d-btn layer8d-btn-primary l8agent-send-btn">Send</button>' +
                    '</div>' +
                '</div>';

            this._panel.querySelector('.l8agent-bubble-close').addEventListener('click', function() {
                self.close();
            });
            this._panel.querySelector('.l8agent-send-btn').addEventListener('click', function() {
                self._send();
            });
            this._panel.querySelector('.l8agent-chat-input').addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    self._send();
                }
            });
            this._panel.querySelector('.l8agent-bubble-new-btn').addEventListener('click', function() {
                self._newConversation();
            });
        },

        _send: function() {
            if (this._loading) return;
            var input = this._panel.querySelector('.l8agent-chat-input');
            var text = input.value.trim();
            if (!text) return;

            input.value = '';
            this._addMessage('user', text);
            this._sendToServer(text);
        },

        _sendToServer: function(text) {
            var self = this;
            this._loading = true;
            this._showLoading();

            var facade = { messages: [{ message: text, isLlm: false }] };
            if (this._conversationId) facade.conversationId = this._conversationId;

            var endpoint = Layer8DConfig.resolveEndpoint(this._chatEndpoint);
            fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(facade)
            })
            .then(function(resp) { return resp.json(); })
            .then(function(data) {
                self._loading = false;
                self._hideLoading();
                if (data.error) {
                    self._addMessage('assistant', 'Error: ' + data.error);
                    return;
                }
                var msg = data;
                if (data.list && data.list.length > 0) msg = data.list[0];
                if (msg.conversationId) self._conversationId = msg.conversationId;
                self._addMessage('assistant', msg.message || 'No response');
            })
            .catch(function(err) {
                self._loading = false;
                self._hideLoading();
                self._addMessage('assistant', 'Error: ' + err.message);
            });
        },

        _addMessage: function(role, content) {
            var msgArea = this._panel.querySelector('.l8agent-chat-messages');
            var div = document.createElement('div');
            div.className = 'l8agent-msg l8agent-msg-' + role;

            var label = document.createElement('div');
            label.className = 'l8agent-msg-role';
            label.textContent = role === 'user' ? 'You' : 'AI Assistant';

            var body = document.createElement('div');
            body.className = 'l8agent-msg-body';
            if (role === 'assistant' && typeof Layer8Markdown !== 'undefined') {
                Layer8Markdown.renderInto(body, content);
            } else {
                body.textContent = content;
            }

            div.appendChild(label);
            div.appendChild(body);
            msgArea.appendChild(div);
            msgArea.scrollTop = msgArea.scrollHeight;
        },

        _newConversation: function() {
            this._conversationId = null;
            var msgArea = this._panel.querySelector('.l8agent-chat-messages');
            if (msgArea) msgArea.innerHTML = '';
        },

        _showLoading: function() {
            var msgArea = this._panel.querySelector('.l8agent-chat-messages');
            var div = document.createElement('div');
            div.className = 'l8agent-loading';
            div.id = 'l8agent-bubble-loading';
            div.innerHTML = '<span class="l8agent-dot"></span><span class="l8agent-dot"></span><span class="l8agent-dot"></span>';
            msgArea.appendChild(div);
            msgArea.scrollTop = msgArea.scrollHeight;
        },

        _hideLoading: function() {
            var el = document.getElementById('l8agent-bubble-loading');
            if (el) el.remove();
        }
    };
})();
