/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/
/**
 * Layer8MTable Touch Interactions
 * Adds pull-to-refresh and swipe actions to Layer8MTable/Layer8MEditTable.
 * Loaded after layer8m-table.js and layer8m-edit-table.js.
 */
(function() {
    'use strict';

    var PULL_THRESHOLD = 60;
    var SWIPE_THRESHOLD = 80;

    // ---- Pull-to-Refresh ----

    function attachPullToRefresh(table) {
        var container = document.getElementById(table.containerId);
        if (!container) return;

        var startY = 0;
        var pulling = false;
        var indicator = null;

        container.addEventListener('touchstart', function(e) {
            if (container.scrollTop > 0) return;
            startY = e.touches[0].clientY;
            pulling = true;
        }, { passive: true });

        container.addEventListener('touchmove', function(e) {
            if (!pulling) return;
            var dy = e.touches[0].clientY - startY;
            if (dy < 0) { pulling = false; return; }

            if (dy > 10 && !indicator) {
                indicator = document.createElement('div');
                indicator.className = 'l8m-pull-indicator';
                indicator.innerHTML = '<span class="l8m-pull-spinner"></span>';
                container.insertBefore(indicator, container.firstChild);
            }

            if (indicator) {
                var progress = Math.min(dy / PULL_THRESHOLD, 1);
                indicator.style.height = Math.min(dy * 0.5, 50) + 'px';
                indicator.style.opacity = progress;
            }
        }, { passive: true });

        container.addEventListener('touchend', function() {
            if (!pulling) return;
            pulling = false;

            if (indicator) {
                var h = parseFloat(indicator.style.height) || 0;
                if (h >= PULL_THRESHOLD * 0.5) {
                    indicator.classList.add('l8m-pull-refreshing');
                    table.refresh();
                    setTimeout(function() { removeIndicator(); }, 600);
                } else {
                    removeIndicator();
                }
            }

            function removeIndicator() {
                if (indicator && indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
                indicator = null;
            }
        }, { passive: true });
    }

    // ---- Swipe Actions on Cards ----

    function attachSwipeActions(table) {
        var container = document.getElementById(table.containerId);
        if (!container) return;

        var startX = 0;
        var currentCard = null;
        var actionsEl = null;

        container.addEventListener('touchstart', function(e) {
            var card = e.target.closest('.l8m-table-card');
            if (!card) return;
            startX = e.touches[0].clientX;
            closeAnyOpen(container);
            currentCard = card;
        }, { passive: true });

        container.addEventListener('touchmove', function(e) {
            if (!currentCard) return;
            var dx = e.touches[0].clientX - startX;

            if (dx < -SWIPE_THRESHOLD && !actionsEl) {
                actionsEl = buildSwipeActions(table, currentCard);
                if (actionsEl) {
                    currentCard.style.position = 'relative';
                    currentCard.appendChild(actionsEl);
                }
            }
        }, { passive: true });

        container.addEventListener('touchend', function() {
            currentCard = null;
            actionsEl = null;
        }, { passive: true });
    }

    function buildSwipeActions(table, card) {
        var itemId = card.dataset.id;
        if (!itemId) return null;

        var hasEdit = table.config && typeof table.config.onEdit === 'function';
        var hasDelete = table.config && typeof table.config.onDelete === 'function';
        if (!hasEdit && !hasDelete) return null;

        var el = document.createElement('div');
        el.className = 'l8m-swipe-actions';

        if (hasEdit) {
            var editBtn = document.createElement('button');
            editBtn.className = 'layer8d-btn layer8d-btn-primary layer8d-btn-small l8m-swipe-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeAnyOpen(card.parentNode);
                table.config.onEdit(itemId);
            });
            el.appendChild(editBtn);
        }

        if (hasDelete) {
            var delBtn = document.createElement('button');
            delBtn.className = 'layer8d-btn layer8d-btn-small l8m-swipe-btn l8m-swipe-btn-delete';
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeAnyOpen(card.parentNode);
                table.config.onDelete(itemId);
            });
            el.appendChild(delBtn);
        }

        return el;
    }

    function closeAnyOpen(container) {
        if (!container) return;
        var open = container.querySelectorAll('.l8m-swipe-actions');
        open.forEach(function(el) { el.parentNode.removeChild(el); });
    }

    // ---- Auto-attach after render ----

    var origInit = Layer8MTable.prototype.init;
    if (origInit) {
        Layer8MTable.prototype.init = function() {
            origInit.call(this);
            attachPullToRefresh(this);
            attachSwipeActions(this);
        };
    }

    // Also hook into render to re-attach swipe on card re-render
    var origRender = Layer8MTable.prototype.render;
    if (origRender) {
        Layer8MTable.prototype.render = function() {
            origRender.call(this);
            // Close any stale swipe actions after re-render
            var container = document.getElementById(this.containerId);
            if (container) closeAnyOpen(container);
        };
    }

})();
