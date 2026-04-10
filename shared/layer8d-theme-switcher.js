/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0
*/

/**
 * Layer8DThemeSwitcher — Multi-theme switcher with dropdown picker.
 *
 * Supports any number of themes. Each theme has a label and preview colors.
 * Renders a dropdown menu with color swatches for each theme.
 */
(function() {
    'use strict';

    var STORAGE_KEY = 'layer8d-theme';

    var THEME_META = {
        light:  { label: 'Light',  colors: ['#fafafa', '#f5f5f3', '#0ea5e9'], metaColor: '#fafafa' },
        dark:   { label: 'Dark',   colors: ['#0f172a', '#1e293b', '#0ea5e9'], metaColor: '#0f172a' },
        ocean:  { label: 'Ocean',  colors: ['#0c1929', '#132337', '#06b6d4'], metaColor: '#0c1929' },
        sunset: { label: 'Sunset', colors: ['#1c1412', '#2a1f1b', '#f59e0b'], metaColor: '#1c1412' },
        forest: { label: 'Forest', colors: ['#0f1a14', '#162920', '#22c55e'], metaColor: '#0f1a14' },
        slate:  { label: 'Slate',  colors: ['#ffffff', '#edf2f7', '#4299e1'], metaColor: '#edf2f7' },
        'dark-s': { label: 'Dark-S', colors: ['#141414', '#1c1c1c', '#FF9E42'], metaColor: '#141414' }
    };

    window.Layer8DThemeSwitcher = {
        themes: ['light', 'dark', 'ocean', 'sunset', 'forest', 'slate', 'dark-s'],
        _open: false,

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

            document.addEventListener('click', function(e) {
                if (self._open && !e.target.closest('.layer8d-theme-picker')) {
                    self._closeDropdown();
                }
            });
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

        registerTheme: function(name, meta) {
            if (this.themes.indexOf(name) === -1) {
                this.themes.push(name);
            }
            if (meta) {
                THEME_META[name] = meta;
            }
        },

        toggleDropdown: function() {
            if (this._open) {
                this._closeDropdown();
            } else {
                this._openDropdown();
            }
        },

        _openDropdown: function() {
            var pickers = document.querySelectorAll('.layer8d-theme-picker');
            var current = this.getTheme();
            for (var i = 0; i < pickers.length; i++) {
                var menu = pickers[i].querySelector('.layer8d-theme-menu');
                if (menu) {
                    menu.innerHTML = this._buildMenuHtml(current);
                    menu.style.display = 'block';
                }
            }
            this._open = true;
        },

        _closeDropdown: function() {
            var menus = document.querySelectorAll('.layer8d-theme-menu');
            for (var i = 0; i < menus.length; i++) {
                menus[i].style.display = 'none';
            }
            this._open = false;
        },

        _buildMenuHtml: function(current) {
            var html = '';
            for (var i = 0; i < this.themes.length; i++) {
                var name = this.themes[i];
                var meta = THEME_META[name] || { label: name, colors: ['#888', '#666', '#444'] };
                var active = name === current ? ' active' : '';
                html += '<div class="layer8d-theme-option' + active + '" data-theme-name="' + name + '" onclick="Layer8DThemeSwitcher._selectTheme(\'' + name + '\')">';
                html += '<span class="layer8d-theme-swatches">';
                for (var j = 0; j < meta.colors.length; j++) {
                    html += '<span class="layer8d-theme-swatch" style="background:' + meta.colors[j] + '"></span>';
                }
                html += '</span>';
                html += '<span class="layer8d-theme-label">' + meta.label + '</span>';
                if (active) {
                    html += '<span class="layer8d-theme-check">✓</span>';
                }
                html += '</div>';
            }
            return html;
        },

        _selectTheme: function(name) {
            this.setTheme(name);
            this._closeDropdown();
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
            var buttons = document.querySelectorAll('.layer8d-theme-btn');
            var meta = THEME_META[theme] || {};
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].setAttribute('aria-label', 'Theme: ' + (meta.label || theme));
            }
        },

        _updateMetaThemeColor: function(theme) {
            var meta = document.querySelector('meta[name="theme-color"]');
            var themeMeta = THEME_META[theme];
            if (meta && themeMeta) {
                meta.setAttribute('content', themeMeta.metaColor);
            }
        }
    };
})();
