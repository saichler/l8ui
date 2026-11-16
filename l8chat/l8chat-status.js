// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatStatus - presence dots and the status picker (online, away, custom
// text and color). Offline is set by the server when heartbeats stop.

(function() {
    'use strict';

    function presenceClass(status) {
        switch (Number(status && status.presence)) {
            case L8ChatLive.ONLINE: return 'l8chat-dot-online';
            case L8ChatLive.AWAY: return 'l8chat-dot-away';
            case L8ChatLive.CUSTOM: return 'l8chat-dot-custom';
        }
        return 'l8chat-dot-offline';
    }

    // dot returns the HTML of a status dot (a custom status shows its color).
    function dot(status) {
        var style = '';
        if (status && Number(status.presence) === L8ChatLive.CUSTOM && status.customColor) {
            style = ' style="background:' + L8ChatApi.escape(status.customColor) + '"';
        }
        var title = status && status.customText ? status.customText : presenceName(status);
        return '<span class="l8chat-dot ' + presenceClass(status) + '"' + style + ' title="' +
            L8ChatApi.escape(title) + '"></span>';
    }

    function presenceName(status) {
        switch (Number(status && status.presence)) {
            case L8ChatLive.ONLINE: return 'Online';
            case L8ChatLive.AWAY: return 'Away';
            case L8ChatLive.CUSTOM: return 'Custom';
        }
        return 'Offline';
    }

    // openPicker shows the status menu under anchor.
    function openPicker(anchor, session) {
        var existing = document.querySelector('.l8chat-status-picker');
        if (existing) {
            existing.remove();
            return;
        }
        var current = session.chosenStatus || {};
        var menu = document.createElement('div');
        menu.className = 'l8chat-status-picker';
        menu.innerHTML =
            '<button class="l8chat-status-option" data-presence="' + L8ChatLive.ONLINE + '">' +
                '<span class="l8chat-dot l8chat-dot-online"></span>Online</button>' +
            '<button class="l8chat-status-option" data-presence="' + L8ChatLive.AWAY + '">' +
                '<span class="l8chat-dot l8chat-dot-away"></span>Away</button>' +
            '<div class="l8chat-status-custom">' +
                '<input type="text" class="l8chat-status-text" maxlength="60" placeholder="Custom status" value="' +
                    L8ChatApi.escape(current.customText || '') + '">' +
                '<input type="color" class="l8chat-status-color" value="' +
                    L8ChatApi.escape(current.customColor || '#6366f1') + '">' +
                '<button class="layer8d-btn layer8d-btn-small layer8d-btn-primary l8chat-status-set">Set</button>' +
            '</div>';
        anchor.parentNode.appendChild(menu);
        menu.querySelectorAll('.l8chat-status-option').forEach(function(btn) {
            btn.addEventListener('click', function() {
                session.setStatus(Number(btn.getAttribute('data-presence')));
                menu.remove();
            });
        });
        menu.querySelector('.l8chat-status-set').addEventListener('click', function() {
            var text = menu.querySelector('.l8chat-status-text').value.trim();
            if (!text) return;
            session.setStatus(L8ChatLive.CUSTOM, text, menu.querySelector('.l8chat-status-color').value);
            menu.remove();
        });
    }

    window.L8ChatStatus = {
        dot: dot,
        presenceName: presenceName,
        openPicker: openPicker
    };
})();
