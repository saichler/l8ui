// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatComposer - the message box: Enter sends, Shift+Enter adds a line, the
// paperclip uploads files that are sent with the next message (plan §6.7).

(function() {
    'use strict';

    function Composer(container, session) {
        this.el = container;
        this.s = session;
        this.attachments = [];
    }

    Composer.prototype.render = function() {
        var self = this;
        this.el.innerHTML =
            '<div class="l8chat-composer">' +
                '<div class="l8chat-composer-files"></div>' +
                '<div class="l8chat-composer-row">' +
                    '<button class="l8chat-icon-btn l8chat-attach" title="Attach a file">&#128206;</button>' +
                    '<input type="file" class="l8chat-file-input" multiple hidden>' +
                    '<textarea class="l8chat-input" rows="2" placeholder="Type a message…"></textarea>' +
                    '<button class="layer8d-btn layer8d-btn-primary l8chat-send">Send</button>' +
                '</div>' +
            '</div>';
        var input = this.el.querySelector('.l8chat-input');
        var fileInput = this.el.querySelector('.l8chat-file-input');
        this.el.querySelector('.l8chat-send').addEventListener('click', function() { self.send(); });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                self.send();
            }
        });
        this.el.querySelector('.l8chat-attach').addEventListener('click', function() { fileInput.click(); });
        fileInput.addEventListener('change', function() {
            var thread = self.s.store.thread;
            if (!thread) return;
            Array.prototype.forEach.call(fileInput.files, function(file) {
                L8ChatFiles.upload(file, thread.conversationId).then(function(attachment) {
                    self.attachments.push(attachment);
                    self.updateFiles();
                }).catch(function(err) { self.s.platform.notifyError('Upload failed', err.message); });
            });
            fileInput.value = '';
        });
    };

    Composer.prototype.updateFiles = function() {
        var self = this;
        var box = this.el.querySelector('.l8chat-composer-files');
        box.innerHTML = this.attachments.map(function(a, i) {
            return '<span class="l8chat-chip">' + L8ChatApi.escape(a.fileName) +
                ' <button class="l8chat-chip-remove" data-index="' + i + '" title="Remove">&times;</button></span>';
        }).join('');
        box.querySelectorAll('.l8chat-chip-remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                self.attachments.splice(Number(btn.getAttribute('data-index')), 1);
                self.updateFiles();
            });
        });
    };

    Composer.prototype.send = function() {
        var input = this.el.querySelector('.l8chat-input');
        var text = input.value.trim();
        if (!text && !this.attachments.length) return;
        this.s.send(text, this.attachments);
        input.value = '';
        this.attachments = [];
        this.updateFiles();
    };

    window.L8ChatComposer = {
        render: function(container, session) {
            var composer = new Composer(container, session);
            composer.render();
            return composer;
        }
    };
})();
