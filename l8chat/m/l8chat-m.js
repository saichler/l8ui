// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatMobile - the mobile chat: a full-screen drill-down, peers →
// conversations → thread, over the same session and views as the desktop.

(function() {
    'use strict';

    var BACK_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>';
    var CLOSE_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>';

    var SCREENS = ['peers', 'convs', 'thread'];

    // render builds the drill-down in container. onClose closes the host panel.
    function render(container, session, onClose) {
        var screen = 'peers';
        container.innerHTML =
            '<div class="l8chat-m">' +
                '<div class="l8chat-m-header">' +
                    '<button class="l8chat-m-back" title="Back">' + BACK_SVG + '</button>' +
                    '<span class="l8chat-m-title">Chat</span>' +
                    '<button class="l8chat-m-close" title="Close">' + CLOSE_SVG + '</button>' +
                '</div>' +
                '<div class="l8chat-m-screen l8chat-m-peers"></div>' +
                '<div class="l8chat-m-screen l8chat-m-convs"></div>' +
                '<div class="l8chat-m-screen l8chat-m-thread"></div>' +
            '</div>';

        function show(name) {
            screen = name;
            SCREENS.forEach(function(s) {
                container.querySelector('.l8chat-m-' + s).classList.toggle('l8chat-m-active', s === name);
            });
            container.querySelector('.l8chat-m-back').style.visibility = name === 'peers' ? 'hidden' : 'visible';
            var title = 'Chat';
            var peer = session.store.selectedPeer;
            if (name === 'convs' && peer) title = session.peerName(peer.kind, peer.peerId, '');
            if (name === 'thread' && session.store.thread) {
                var conv = session.store.conversations[session.store.thread.conversationId];
                title = conv ? conv.title : '';
            }
            container.querySelector('.l8chat-m-title').textContent = title || 'Chat';
        }

        container.querySelector('.l8chat-m-back').addEventListener('click', function() {
            show(screen === 'thread' ? 'convs' : 'peers');
        });
        container.querySelector('.l8chat-m-close').addEventListener('click', onClose);

        L8ChatSidebar.render(container.querySelector('.l8chat-m-peers'), session, {
            onPeer: function(peer) {
                session.openPeer(peer).then(function() { show('convs'); })
                    .catch(function(err) { session.platform.notifyError('Chat', err.message); });
                show('convs');
            }
        });
        L8ChatConvList.render(container.querySelector('.l8chat-m-convs'), session, {
            onOpen: function(conversationId) {
                session.openConversation(conversationId).then(function() { show('thread'); });
                show('thread');
            }
        });
        L8ChatThread.render(container.querySelector('.l8chat-m-thread'), session);
        show('peers');
    }

    window.L8ChatMobile = { render: render };
})();
