// © 2025 Sharon Aicler (saichler@gmail.com)
//
// Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
// You may obtain a copy of the License at:
//
//     http://www.apache.org/licenses/LICENSE-2.0

// L8ChatGroupDialog - create a group (plan §6.5): the name on top, the
// selected users on the left, the users (searchable) on the right; click to
// highlight and move with → / ←, or double-click. Every DOM lookup is scoped
// to the popup body (stacked popups).

(function() {
    'use strict';

    var SEARCH_DELAY = 300;

    function open(session) {
        var popup = session.platform.popup;
        var me = session.store.me;
        var selected = {};   // userId → name
        var available = [];  // [{userId, fullName}]
        var highlight = { left: {}, right: {} };
        var timer = null;

        function body() { return popup.body(); }

        function renderLists() {
            var root = body();
            if (!root) return;
            var left = Object.keys(selected).map(function(id) {
                return item('left', id, selected[id]);
            }).join('');
            var right = available.filter(function(u) { return !selected[u.userId] && u.userId !== me; })
                .map(function(u) { return item('right', u.userId, u.fullName || u.userId); }).join('');
            root.querySelector('.l8chat-group-selected').innerHTML = left;
            root.querySelector('.l8chat-group-users').innerHTML = right;
            root.querySelectorAll('.l8chat-group-item').forEach(function(el) {
                var side = el.getAttribute('data-side');
                var id = el.getAttribute('data-id');
                el.addEventListener('click', function() {
                    highlight[side][id] = !highlight[side][id];
                    el.classList.toggle('l8chat-group-item-on', !!highlight[side][id]);
                });
                el.addEventListener('dblclick', function() { move(side, [id]); });
            });
        }

        function item(side, id, name) {
            return '<div class="l8chat-group-item' + (highlight[side][id] ? ' l8chat-group-item-on' : '') +
                '" data-side="' + side + '" data-id="' + L8ChatApi.escape(id) + '">' + L8ChatApi.escape(name) + '</div>';
        }

        function move(side, ids) {
            ids.forEach(function(id) {
                if (side === 'right') {
                    var user = available.filter(function(u) { return u.userId === id; })[0];
                    selected[id] = user ? user.fullName || id : id;
                } else {
                    delete selected[id];
                }
                delete highlight[side][id];
            });
            renderLists();
        }

        function highlighted(side) {
            return Object.keys(highlight[side]).filter(function(id) { return highlight[side][id]; });
        }

        function load(text) {
            var request = text ? session.api.searchUsers(text, 50) : session.api.listUsers(50);
            request.then(function(users) {
                available = users;
                renderLists();
            });
        }

        popup.show({
            title: 'New group',
            size: 'large',
            content:
                '<div class="l8chat-dialog l8chat-group-dialog">' +
                    '<label class="l8chat-label">Name<input type="text" class="l8chat-group-name" maxlength="80"></label>' +
                    '<div class="l8chat-group-lists">' +
                        '<div class="l8chat-group-col"><div class="l8chat-group-caption">Members</div>' +
                            '<div class="l8chat-group-selected l8chat-group-box"></div></div>' +
                        '<div class="l8chat-group-moves">' +
                            '<button class="layer8d-btn layer8d-btn-small l8chat-group-add" title="Add">&larr;</button>' +
                            '<button class="layer8d-btn layer8d-btn-small l8chat-group-remove" title="Remove">&rarr;</button>' +
                        '</div>' +
                        '<div class="l8chat-group-col"><div class="l8chat-group-caption">Users</div>' +
                            '<input type="search" class="l8chat-group-search" placeholder="Search users">' +
                            '<div class="l8chat-group-users l8chat-group-box"></div></div>' +
                    '</div>' +
                '</div>',
            showFooter: true,
            saveButtonText: 'Create',
            onShow: function() {
                var root = body();
                root.querySelector('.l8chat-group-add').addEventListener('click', function() {
                    move('right', highlighted('right'));
                });
                root.querySelector('.l8chat-group-remove').addEventListener('click', function() {
                    move('left', highlighted('left'));
                });
                root.querySelector('.l8chat-group-search').addEventListener('input', function(e) {
                    clearTimeout(timer);
                    var text = e.target.value.trim();
                    timer = setTimeout(function() { load(text); }, SEARCH_DELAY);
                });
                load('');
            },
            onSave: function() {
                var name = body().querySelector('.l8chat-group-name').value.trim();
                var members = Object.keys(selected);
                if (!name || !members.length) {
                    session.platform.notifyError('New group', 'A group needs a name and at least one member.');
                    return;
                }
                session.createGroup(name, members).then(function() { popup.close(); })
                    .catch(function(err) { session.platform.notifyError('New group', err.message); });
            }
        });
    }

    window.L8ChatGroupDialog = { open: open };
})();
