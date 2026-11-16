// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatThread - the open conversation (plan §6.4): the newest 10 messages,
// "load older" at the top-left, Tanto's answers rendered as markdown,
// attachments, my pending messages, and for Tanto conversations the LLM
// profile selector and a typing indicator while a turn runs.

(function() {
    'use strict';

    var KIND_SYSTEM = 2;
    var KIND_AGENT = 3;
    var AGENT_RUNNING = 2;

    function Thread(container, session) {
        this.el = container;
        this.s = session;
    }

    Thread.prototype.render = function() {
        var self = this;
        this.el.innerHTML =
            '<div class="l8chat-thread">' +
                '<div class="l8chat-thread-header">' +
                    '<span class="l8chat-thread-title"></span>' +
                    '<select class="l8chat-profile" title="LLM profile"></select>' +
                '</div>' +
                '<div class="l8chat-messages">' +
                    '<button class="layer8d-btn layer8d-btn-small l8chat-older">Load older</button>' +
                    '<div class="l8chat-message-list"></div>' +
                    '<div class="l8chat-typing">Tanto is typing…</div>' +
                '</div>' +
                '<div class="l8chat-composer-slot"></div>' +
            '</div>';
        this.el.querySelector('.l8chat-older').addEventListener('click', function() {
            var scroller = self.el.querySelector('.l8chat-messages');
            var before = scroller.scrollHeight;
            self.s.loadOlder().then(function() {
                scroller.scrollTop = scroller.scrollHeight - before;
            });
        });
        this.el.querySelector('.l8chat-profile').addEventListener('change', function(e) {
            var thread = self.s.store.thread;
            if (thread) self.s.setProfile(thread.conversationId, e.target.value);
        });
        L8ChatComposer.render(this.el.querySelector('.l8chat-composer-slot'), this.s);
        this.s.store.on('thread', function() { self.update(); });
        this.update();
    };

    Thread.prototype.update = function() {
        var store = this.s.store;
        var thread = store.thread;
        var root = this.el.querySelector('.l8chat-thread');
        root.classList.toggle('l8chat-thread-empty', !thread);
        if (!thread) return;
        var conv = store.conversations[thread.conversationId] || {};
        var agent = this.s.isAgentConversation(thread.conversationId);
        this.el.querySelector('.l8chat-thread-title').textContent = conv.title || '';
        this.el.querySelector('.l8chat-older').style.display = thread.hasOlder ? '' : 'none';
        this.el.querySelector('.l8chat-typing').style.display =
            agent && Number(conv.agentState) === AGENT_RUNNING ? '' : 'none';
        this.updateProfiles(agent, conv);

        var scroller = this.el.querySelector('.l8chat-messages');
        var atBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 40;
        var list = this.el.querySelector('.l8chat-message-list');
        list.innerHTML = '';
        var self = this;
        thread.messages.forEach(function(m) { list.appendChild(self.message(m)); });
        if (atBottom) scroller.scrollTop = scroller.scrollHeight;
        this.resolveNames(thread.messages);
    };

    // resolveNames looks up senders not resolved yet, then renders once more.
    Thread.prototype.resolveNames = function(messages) {
        var api = this.s.api;
        var tanto = this.s.tanto;
        var unknown = messages.map(function(m) { return m.senderId; })
            .filter(function(id, i, all) { return id && id !== tanto && all.indexOf(id) === i && api.name(id) === id; })
            .filter(function(id) { return !(id in api._names); });
        if (!unknown.length) return;
        var store = this.s.store;
        api.names(unknown).then(function() { store.emit('thread'); });
    };

    Thread.prototype.updateProfiles = function(agent, conv) {
        var select = this.el.querySelector('.l8chat-profile');
        select.style.display = agent ? '' : 'none';
        if (!agent) return;
        this.s.loadProfiles().then(function(profiles) {
            var current = conv.llmProfileId || '';
            select.innerHTML = '<option value="">Default</option>' + profiles.map(function(p) {
                return '<option value="' + L8ChatApi.escape(p.profileId) + '"' +
                    (p.profileId === current ? ' selected' : '') + '>' + L8ChatApi.escape(p.name) + '</option>';
            }).join('');
        });
    };

    Thread.prototype.message = function(m) {
        var store = this.s.store;
        var mine = m.senderId === store.me || m._pending;
        var kind = Number(m.kind);
        var div = document.createElement('div');
        div.className = 'l8chat-msg' + (mine ? ' l8chat-msg-mine' : '') + (kind === KIND_SYSTEM ? ' l8chat-msg-system' : '') +
            (kind === KIND_AGENT ? ' l8chat-msg-agent' : '');
        var meta = document.createElement('div');
        meta.className = 'l8chat-msg-meta';
        var who = mine ? 'You' : kind === KIND_SYSTEM ? 'System' :
            kind === KIND_AGENT || m.senderId === this.s.tanto ? 'Tanto (Layer8)' : this.s.api.name(m.senderId);
        meta.textContent = who +
            (m._pending ? ' · sending…' : m.sentAt ? ' · ' + new Date(Number(m.sentAt) * 1000).toLocaleTimeString() : '');
        var body = document.createElement('div');
        body.className = 'l8chat-msg-body';
        if (kind === KIND_AGENT) Layer8Markdown.renderInto(body, m.body || '');
        else body.textContent = m.body || '';
        div.appendChild(meta);
        div.appendChild(body);
        if (m.attachments && m.attachments.length) div.appendChild(L8ChatFiles.chips(m.attachments));
        return div;
    };

    window.L8ChatThread = {
        render: function(container, session) {
            var thread = new Thread(container, session);
            thread.render();
            return thread;
        }
    };
})();
