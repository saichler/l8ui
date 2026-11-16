// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatFiles - attachments over Layer8FileUpload (plan §5.6): files are
// stored under the conversation's ID and only their metadata travels in the
// message (ChatAttachment).

(function() {
    'use strict';

    // upload stores a file and returns its ChatAttachment.
    function upload(file, conversationId) {
        return Layer8FileUpload.upload(file, conversationId, 1).then(function(r) {
            return { attachmentId: L8ChatApi.ids.uuid4(), storagePath: r.storagePath, fileName: r.fileName || file.name,
                fileSize: r.fileSize || file.size, mimeType: r.mimeType || file.type, checksum: r.checksum || '' };
        });
    }

    // chips renders a message's attachments, each with a Download action.
    function chips(attachments) {
        var box = document.createElement('div');
        box.className = 'l8chat-attachments';
        attachments.forEach(function(a) {
            var chip = document.createElement('span');
            chip.className = 'l8chat-chip';
            var size = a.fileSize ? ' (' + Layer8FileUpload.formatSize(Number(a.fileSize)) + ')' : '';
            chip.textContent = (a.fileName || 'file') + size + ' ';
            var download = document.createElement('button');
            download.className = 'l8chat-chip-action';
            download.textContent = 'Download';
            download.addEventListener('click', function() { Layer8FileUpload.download(a.storagePath, a.fileName); });
            chip.appendChild(download);
            box.appendChild(chip);
        });
        return box;
    }

    window.L8ChatFiles = {
        upload: upload,
        chips: chips
    };
})();
