// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatConvDialog - a new named conversation with the selected peer (plan §6.6).

(function() {
    'use strict';

    function open(session) {
        if (!session.store.selectedPeer) return;
        var popup = session.platform.popup;
        popup.show({
            title: 'New conversation',
            size: 'small',
            content: '<div class="l8chat-dialog"><label class="l8chat-label">Name' +
                '<input type="text" class="l8chat-conv-name" maxlength="80"></label></div>',
            showFooter: true,
            saveButtonText: 'Create',
            onShow: function() {
                var input = popup.body().querySelector('.l8chat-conv-name');
                if (input) input.focus();
            },
            onSave: function() {
                var name = popup.body().querySelector('.l8chat-conv-name').value.trim();
                if (!name) return;
                session.createConversation(name).then(function() { popup.close(); })
                    .catch(function(err) { session.platform.notifyError('Create conversation', err.message); });
            }
        });
    }

    window.L8ChatConvDialog = { open: open };
})();
