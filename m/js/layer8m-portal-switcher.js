/*
© 2025 Sharon Aicler (saichler@gmail.com)
Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/

// Layer8MPortalSwitcher — mobile bottom-sheet for switching between portals.
// Fetches the L8Portal registry and falls back to login.json portals config.
// No re-authentication needed — bearer token persists in sessionStorage.
// Mobile navigates to '/m/<portal>' so users stay on the mobile UI after switching.
//
// Usage:
//   Layer8MPortalSwitcher.init({
//       container: document.querySelector('.header-actions'),
//       insertBefore: document.getElementById('refresh-btn'),
//       apiPrefix: Layer8MConfig.getApiPrefix(),
//       currentPath: window.location.pathname
//   });

(function() {
    'use strict';

    var PORTAL_ENDPOINT = '/77/L8Portal';
    var QUERY = 'select * from L8Portal';

    function init(config) {
        if (!config || !config.container) return;

        var apiPrefix = config.apiPrefix || '';
        var currentPath = normalizeCurrentPath(config.currentPath || '/m/app.html');
        var bearerToken = sessionStorage.getItem('bearerToken');
        if (!bearerToken) return;

        var body = encodeURIComponent(JSON.stringify({ text: QUERY }));
        var url = apiPrefix + PORTAL_ENDPOINT + '?body=' + body;

        fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + bearerToken,
                'Content-Type': 'application/json'
            }
        })
        .then(function(resp) { return resp.ok ? resp.json() : null; })
        .then(function(data) {
            var portals = data ? extractPortals(data) : {};
            if (Object.keys(portals).length < 2) {
                portals = getConfigPortals();
            }
            if (Object.keys(portals).length < 2) return;
            render(config.container, config.insertBefore, portals, currentPath);
        })
        .catch(function() {
            var portals = getConfigPortals();
            if (Object.keys(portals).length < 2) return;
            render(config.container, config.insertBefore, portals, currentPath);
        });
    }

    // Strip leading '/' and optional 'm/' prefix so mobile and desktop paths compare against the same portal key.
    function normalizeCurrentPath(path) {
        var stripped = path.replace(/^\//, '');
        if (stripped.indexOf('m/') === 0) stripped = stripped.substring(2);
        return stripped;
    }

    function getConfigPortals() {
        if (typeof Layer8MConfig !== 'undefined') {
            var cfg = Layer8MConfig.getConfig();
            if (cfg && cfg.app && cfg.app.portals) return cfg.app.portals;
        }
        return {};
    }

    function extractPortals(data) {
        var items = Array.isArray(data) ? data : (data.list || []);
        var merged = {};
        for (var i = 0; i < items.length; i++) {
            var p = items[i].portals || {};
            var keys = Object.keys(p);
            for (var j = 0; j < keys.length; j++) {
                merged[keys[j]] = p[keys[j]];
            }
        }
        return merged;
    }

    function render(container, insertBefore, portals, currentPath) {
        var btn = document.createElement('button');
        btn.className = 'header-action-btn layer8m-portal-btn';
        btn.setAttribute('aria-label', 'Switch Portal');
        btn.setAttribute('title', 'Switch Portal');
        btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
            + '<rect x="3" y="3" width="7" height="7" rx="1"/>'
            + '<rect x="14" y="3" width="7" height="7" rx="1"/>'
            + '<rect x="3" y="14" width="7" height="7" rx="1"/>'
            + '<rect x="14" y="14" width="7" height="7" rx="1"/>'
            + '</svg>';

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openSheet(portals, currentPath);
        });

        if (insertBefore && insertBefore.parentNode === container) {
            container.insertBefore(btn, insertBefore);
        } else {
            container.appendChild(btn);
        }
    }

    function openSheet(portals, currentPath) {
        var existing = document.querySelector('.layer8m-portal-sheet-overlay');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.className = 'layer8m-portal-sheet-overlay';

        var sheet = document.createElement('div');
        sheet.className = 'layer8m-portal-sheet';

        var header = document.createElement('div');
        header.className = 'layer8m-portal-sheet-header';
        header.textContent = 'Switch Portal';
        sheet.appendChild(header);

        var list = document.createElement('div');
        list.className = 'layer8m-portal-sheet-list';

        var keys = Object.keys(portals);
        for (var i = 0; i < keys.length; i++) {
            var path = keys[i];
            var label = portals[path];
            var isCurrent = (path === currentPath);

            var item = document.createElement('div');
            item.className = 'layer8m-portal-sheet-item' + (isCurrent ? ' is-current' : '');
            item.dataset.path = path;

            var dot = document.createElement('span');
            dot.className = 'layer8m-portal-sheet-dot';

            var text = document.createElement('span');
            text.className = 'layer8m-portal-sheet-label';
            text.textContent = label;

            item.appendChild(dot);
            item.appendChild(text);

            if (!isCurrent) {
                item.addEventListener('click', function() {
                    window.location.href = '/m/' + this.dataset.path;
                });
            }

            list.appendChild(item);
        }

        sheet.appendChild(list);
        overlay.appendChild(sheet);
        document.body.appendChild(overlay);

        // Trigger slide-up animation on next frame
        requestAnimationFrame(function() { overlay.classList.add('is-open'); });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeSheet(overlay);
        });
    }

    function closeSheet(overlay) {
        overlay.classList.remove('is-open');
        setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 200);
    }

    window.Layer8MPortalSwitcher = { init: init };
})();
