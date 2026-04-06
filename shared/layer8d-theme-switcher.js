/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0
*/

/**
 * Layer8DThemeSwitcher — Generic multi-theme switcher.
 *
 * Supports any number of themes. Default: ['light', 'dark'].
 * A future theme builder can call registerTheme('ocean') to add more.
 * toggle() cycles through the list.
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'layer8d-theme';

    window.Layer8DThemeSwitcher = {
        themes: ['light', 'dark'],

        init: function() {
            var saved = localStorage.getItem(STORAGE_KEY);
            if (saved && this.themes.indexOf(saved) !== -1) {
                this._apply(saved);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this._apply('dark');
            } else {
                this._apply('light');
            }

            var self = this;
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                    if (!localStorage.getItem(STORAGE_KEY)) {
                        self._apply(e.matches ? 'dark' : 'light');
                    }
                });
            }
        },

        setTheme: function(name) {
            if (this.themes.indexOf(name) === -1) {
                console.warn('Layer8DThemeSwitcher: unknown theme "' + name + '"');
                return;
            }
            localStorage.setItem(STORAGE_KEY, name);
            this._apply(name);
        },

        getTheme: function() {
            return document.documentElement.getAttribute('data-theme') || 'light';
        },

        getThemes: function() {
            return this.themes.slice();
        },

        registerTheme: function(name) {
            if (this.themes.indexOf(name) === -1) {
                this.themes.push(name);
            }
        },

        toggle: function() {
            var current = this.getTheme();
            var idx = this.themes.indexOf(current);
            var next = this.themes[(idx + 1) % this.themes.length];
            this.setTheme(next);
        },

        _apply: function(name) {
            if (name === 'light') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', name);
            }
            this._updateToggleButtons(name);
            this._updateMetaThemeColor(name);
        },

        _updateToggleButtons: function(theme) {
            var buttons = document.querySelectorAll('.layer8d-theme-toggle');
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
                buttons[i].innerHTML = theme === 'dark'
                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
            }
        },

        _updateMetaThemeColor: function(theme) {
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#fcfbf8');
            }
        }
    };
})();
