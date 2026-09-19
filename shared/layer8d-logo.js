/*
© 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * Layer8DLogo -- keeps the default l8ui/images/logo.svg's three cube faces
 * in sync with the active theme's --layer8d-primary-light/-primary/-dark
 * triad (layer8d-theme-tokens.css).
 *
 * An <img>/<link> loads an external SVG as its own standalone document, so
 * CSS custom properties defined on this page's :root never reach it -- a
 * plain src/href swap can't recolor it per theme. Instead this fetches the
 * SVG source once, replaces its three known default hex fills with the
 * active theme's resolved colors, and sets the result as a data: URI.
 *
 * Only the bundled default logo.svg is recolored this way. A project can
 * still configure any other logo via login.json's login.logo (raster or a
 * custom SVG) -- those are applied as a plain URL, unchanged, since there's
 * no way to know their color structure.
 */
(function() {
    'use strict';

    var LOGO_PATH = '/l8ui/images/logo.svg';
    // Matches the default logo whether referenced as an absolute path
    // ("/l8ui/images/logo.svg", login.json's convention) or a relative one
    // ("l8ui/images/logo.svg", "../l8ui/images/logo.svg" -- app.html/
    // m/app.html's hardcoded favicon/header hrefs).
    var LOGO_PATH_RE = /(^|\/)l8ui\/images\/logo\.svg([?#]|$)/;
    var DEFAULT_HEX = { light: '#7dd3fc', primary: '#0ea5e9', dark: '#0284c7' };

    var _svgTextPromise = null;
    var _targets = [];

    function fetchSvgText() {
        if (!_svgTextPromise) {
            _svgTextPromise = fetch(LOGO_PATH).then(function(res) {
                return res.text();
            });
        }
        return _svgTextPromise;
    }

    function themeHex(varName, fallback) {
        var v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return v || fallback;
    }

    function colorize(svgText) {
        var light = themeHex('--layer8d-primary-light', DEFAULT_HEX.light);
        var primary = themeHex('--layer8d-primary', DEFAULT_HEX.primary);
        var dark = themeHex('--layer8d-primary-dark', DEFAULT_HEX.dark);
        return svgText
            .split(DEFAULT_HEX.light).join(light)
            .split(DEFAULT_HEX.primary).join(primary)
            .split(DEFAULT_HEX.dark).join(dark);
    }

    function toDataUri(svgText) {
        return 'data:image/svg+xml,' + encodeURIComponent(svgText);
    }

    function isDefaultLogo(url) {
        return LOGO_PATH_RE.test(url);
    }

    function applyOne(target) {
        if (!isDefaultLogo(target.url)) {
            target.el[target.attr] = target.url;
            return;
        }
        fetchSvgText().then(function(raw) {
            target.el[target.attr] = toDataUri(colorize(raw));
        }).catch(function() {
            target.el[target.attr] = target.url;
        });
    }

    window.Layer8DLogo = {
        /**
         * Point el's src/href at url, recoloring it live with the active
         * theme (and every later theme switch) if url is the bundled
         * default logo.svg.
         */
        register: function(el, url, attr) {
            if (!el || !url) return;
            attr = attr || (el.tagName === 'LINK' ? 'href' : 'src');
            var target = { el: el, url: url, attr: attr };
            _targets.push(target);
            applyOne(target);
        },

        refresh: function() {
            _targets.forEach(applyOne);
        }
    };

    if (window.Layer8DThemeSwitcher && window.Layer8DThemeSwitcher.onChange) {
        window.Layer8DThemeSwitcher.onChange(function() {
            window.Layer8DLogo.refresh();
        });
    }
})();
