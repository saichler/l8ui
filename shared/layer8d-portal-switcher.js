/*
© 2025 Sharon Aicler (saichler@gmail.com)
Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/

// Layer8DPortalSwitcher — header dropdown for switching between portals.
// Fetches the L8Portal registry and renders available portals.
// No re-authentication needed — bearer token persists in sessionStorage.
//
// Usage:
//   Layer8DPortalSwitcher.init({
//       container: document.querySelector('.header-right'),
//       insertBefore: document.querySelector('.user-menu'),
//       apiPrefix: Layer8DConfig.getApiPrefix(),
//       currentPath: window.location.pathname
//   });

(function() {
    'use strict';

    var PORTAL_ENDPOINT = '/77/L8Portal';
    var QUERY = 'select * from L8Portal';

    /**
     * Initialize the portal switcher.
     * Tries L8Portal endpoint first, falls back to login.json portals config.
     */
    function init(config) {
        if (!config || !config.container) return;

        var apiPrefix = config.apiPrefix || '';
        var currentPath = (config.currentPath || '/app.html').replace(/^\//, '');
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
            if (Object.keys(portals).length < 2) {
                warnNoSwitcher(portals);
                return;
            }
            render(config.container, config.insertBefore, portals, currentPath);
        })
        .catch(function() {
            // L8Portal endpoint unavailable — fall back to login.json config
            var portals = getConfigPortals();
            if (Object.keys(portals).length < 2) {
                warnNoSwitcher(portals);
                return;
            }
            render(config.container, config.insertBefore, portals, currentPath);
        });
    }

    // warnNoSwitcher surfaces the most common failure mode for the portal
    // dropdown: Layer8DPortalSwitcher needs at least 2 portals registered
    // (either via the L8Portal service or the login.json `app.portals` map)
    // before it renders. Silently bailing here is a debugging trap; this
    // log keeps it visible without forcing the dropdown to render in
    // single-portal apps that intentionally don't want it.
    function warnNoSwitcher(portals) {
        if (typeof console === 'undefined' || !console.warn) return;
        var count = portals ? Object.keys(portals).length : 0;
        console.warn(
            'Layer8DPortalSwitcher: not rendering — found ' + count +
            ' portal(s); need >= 2. Register portals under `app.portals`' +
            ' in login.json (e.g. {"app.html":"Probler"}) or via the' +
            ' L8Portal service. See l8ui/shared/layer8d-portal-switcher.js.'
        );
    }

    /**
     * Read portals from login.json config (Layer8DConfig).
     */
    function getConfigPortals() {
        if (typeof Layer8DConfig !== 'undefined') {
            var cfg = Layer8DConfig.getConfig();
            if (cfg && cfg.portals) return cfg.portals;
        }
        return {};
    }

    /**
     * Extract the portals map from L8Portal response.
     * The response is either an array or a {list:[...]} wrapper.
     */
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

    /**
     * Render the portal switcher button and dropdown.
     */
    /**
     * Split a current page pathname into a directory prefix and a basename.
     * Examples:
     *   'app.html'                  → { dir: '',           basename: 'app.html' }
     *   'probler/app.html'          → { dir: 'probler/',   basename: 'app.html' }
     *   'foo/bar/k8s-explorer.html' → { dir: 'foo/bar/',   basename: 'k8s-explorer.html' }
     *
     * Used so the switcher works for apps served under a path prefix
     * (e.g. /probler/app.html) — portal hops navigate to a sibling file
     * in the SAME directory, not the origin root, and "current portal"
     * highlighting compares basenames not full paths.
     */
    function splitPath(p) {
        var idx = p.lastIndexOf('/');
        if (idx === -1) return { dir: '', basename: p };
        return { dir: p.substring(0, idx + 1), basename: p.substring(idx + 1) };
    }

    function render(container, insertBefore, portals, currentPath) {
        var split = splitPath(currentPath);
        var wrapper = document.createElement('div');
        wrapper.className = 'l8-portal-switcher';
        wrapper.style.cssText = 'position:relative;display:inline-flex;align-items:center;';

        // Button
        var btn = document.createElement('button');
        btn.className = 'l8-portal-switcher-btn';
        btn.title = 'Switch Portal';
        btn.innerHTML = '<span style="display:inline-grid;grid-template-columns:6px 6px;gap:2px;">'
            + '<span style="width:6px;height:6px;background:var(--layer8d-primary);border-radius:1px;opacity:0.9;"></span>'
            + '<span style="width:6px;height:6px;background:var(--layer8d-primary);border-radius:1px;opacity:0.5;"></span>'
            + '<span style="width:6px;height:6px;background:var(--layer8d-primary);border-radius:1px;opacity:0.5;"></span>'
            + '<span style="width:6px;height:6px;background:var(--layer8d-primary);border-radius:1px;opacity:0.5;"></span>'
            + '</span>';
        btn.style.cssText = 'background:var(--layer8d-bg-light);border:1px solid var(--layer8d-border);'
            + 'padding:6px 8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;'
            + 'gap:6px;font-size:13px;line-height:1;transition:background 0.15s;';
        btn.addEventListener('mouseenter', function() { btn.style.background = 'var(--layer8d-bg-input)'; });
        btn.addEventListener('mouseleave', function() {
            btn.style.background = 'var(--layer8d-bg-light)';
        });

        // Dropdown
        var dropdown = document.createElement('div');
        dropdown.className = 'l8-portal-switcher-dropdown';
        dropdown.style.cssText = 'display:none;position:absolute;top:calc(100% + 6px);right:0;'
            + 'background:var(--layer8d-bg-white, #fff);border:1px solid var(--layer8d-border, #e2e8f0);'
            + 'border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);min-width:200px;z-index:9999;'
            + 'overflow:hidden;';

        var portalKeys = Object.keys(portals);
        for (var i = 0; i < portalKeys.length; i++) {
            var path = portalKeys[i];
            var label = portals[path];
            // Compare basenames so an app served at /probler/app.html still
            // matches a portal entry registered as 'app.html'.
            var isCurrent = (path === currentPath) || (path === split.basename);

            var item = document.createElement('div');
            item.style.cssText = 'padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;'
                + 'font-size:13px;color:var(--layer8d-text-dark, #1a202c);'
                + 'transition:background 0.12s;'
                + (isCurrent ? 'background:var(--layer8d-bg-light, #f7fafc);font-weight:600;' : '');

            var dot = document.createElement('span');
            dot.style.cssText = 'width:8px;height:8px;border-radius:50%;flex-shrink:0;'
                + (isCurrent
                    ? 'background:var(--layer8d-primary, #0ea5e9);'
                    : 'background:var(--layer8d-border, #e2e8f0);');

            var text = document.createElement('span');
            text.textContent = label;

            item.appendChild(dot);
            item.appendChild(text);

            if (!isCurrent) {
                item.dataset.path = path;
                item.dataset.dir = split.dir;
                item.addEventListener('mouseenter', function() {
                    this.style.background = 'var(--layer8d-bg-light, #f7fafc)';
                });
                item.addEventListener('mouseleave', function() {
                    this.style.background = '';
                });
                item.addEventListener('click', function() {
                    var targetPath = this.dataset.path;
                    var dir = this.dataset.dir || '';
                    // Hop to the sibling portal in the same directory as the
                    // current page. Without this, apps served under a path
                    // prefix (e.g. /probler/app.html) would navigate to the
                    // wrong absolute URL ('/k8s-explorer.html') and the
                    // server would return 401/404.
                    window.location.href = '/' + dir + targetPath;
                });
            }

            dropdown.appendChild(item);
        }

        wrapper.appendChild(btn);
        wrapper.appendChild(dropdown);

        // Toggle dropdown
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = dropdown.style.display !== 'none';
            dropdown.style.display = isOpen ? 'none' : 'block';
        });

        // Close on click outside
        document.addEventListener('click', function() {
            dropdown.style.display = 'none';
        });

        // Insert into container
        if (insertBefore) {
            container.insertBefore(wrapper, insertBefore);
        } else {
            container.appendChild(wrapper);
        }
    }

    window.Layer8DPortalSwitcher = { init: init };
})();
