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
 * Layer8 Section Generator - Generates section HTML from configuration data.
 *
 * Usage:
 *   // Define section configuration
 *   Layer8SectionConfigs.register('hcm', {
 *       title: 'Human Capital Management',
 *       subtitle: 'Manage Your Workforce Across All HR Functions',
 *       icon: '👥',
 *       gradientId: 'hcmGradient1',
 *       svgContent: '<svg>...</svg>',  // Optional custom SVG
 *       initFn: 'initializeHCM',
 *       modules: [
 *           {
 *               key: 'core-hr',
 *               label: 'Core HR',
 *               icon: '👤',
 *               isDefault: true,
 *               services: [
 *                   { key: 'employees', label: 'Employees', icon: '👤', isDefault: true },
 *                   { key: 'positions', label: 'Positions', icon: '💼' },
 *               ]
 *           }
 *       ]
 *   });
 *
 *   // Generate HTML
 *   const html = Layer8SectionGenerator.generate('hcm');
 */
(function() {
    'use strict';

    // Configuration storage
    window.Layer8SectionConfigs = {
        _configs: {},

        register: function(sectionKey, config) {
            this._configs[sectionKey] = config;
        },

        get: function(sectionKey) {
            return this._configs[sectionKey];
        },

        getAll: function() {
            return this._configs;
        }
    };

    window.Layer8SectionGenerator = {
        /**
         * Generate complete section HTML from configuration.
         * @param {string} sectionKey - The section key
         * @returns {string} - HTML string
         */
        generate: function(sectionKey) {
            const config = Layer8SectionConfigs.get(sectionKey);
            if (!config) {
                return `<div class="section-container"><h2>Error</h2><p>Section "${sectionKey}" not configured.</p></div>`;
            }

            return `
<div class="section-container l8-section">
    ${this._generateHeader(config)}
    ${this._generateModuleTabs(config)}
    <div class="section-content">
        ${this._generateModuleContents(config)}
        ${config.customContent || ''}
    </div>
</div>
${this._generateInitScript(config)}
`;
        },

        /**
         * Render a section hero block — public, standalone, and reusable
         * outside of `generate()`. Returns just the .l8-header-frame markup
         * (no module tabs, no content panes), suitable for portals/pages
         * that build their own body shell but want the canonical Probler
         * hero look (gradient bg + animated SVG + h1.l8-title + p.l8-subtitle).
         *
         * @param {object} opts
         * @param {string} opts.title       — required, becomes <h1.l8-title>
         * @param {string} [opts.subtitle]  — optional, becomes <p.l8-subtitle>
         * @param {string} [opts.icon]      — optional. When present, renders
         *                                   a leading `.l8-icon` div. When
         *                                   omitted, the hero matches the
         *                                   classic GPUs/Hosts/Network style
         *                                   (illustration provides visual
         *                                   identity, no icon glyph).
         * @param {string} [opts.svgKey]    — optional. Resolved via
         *                                   Layer8SvgFactory.generate(svgKey)
         *                                   when no svgContent is provided.
         *                                   Logs a console.warn (NOT a silent
         *                                   fallback) when the lookup yields
         *                                   empty — falls through to the
         *                                   default illustration.
         * @param {string} [opts.svgContent]— optional raw SVG markup. Takes
         *                                   precedence over svgKey.
         * @param {string} [opts.gradientId]— optional. Defaults to
         *                                   'sectionGradient1'.
         * @returns {string} HTML string.
         *
         * Resolution order for the bg illustration:
         *   1. svgContent (if provided)
         *   2. Layer8SvgFactory.generate(svgKey) (if non-empty)
         *   3. _generateDefaultSvg(gradientId)
         */
        renderHero: function(opts) {
            opts = opts || {};
            var gradientId = opts.gradientId || 'sectionGradient1';
            var svgContent = opts.svgContent || '';

            if (!svgContent && opts.svgKey && window.Layer8SvgFactory) {
                var fromFactory = Layer8SvgFactory.generate(opts.svgKey);
                if (fromFactory && fromFactory.length > 0) {
                    svgContent = fromFactory;
                } else if (typeof console !== 'undefined' && console.warn) {
                    console.warn(
                        'Layer8SectionGenerator.renderHero: Layer8SvgFactory has no template for "'
                        + opts.svgKey + '"; using default illustration.'
                    );
                }
            }
            if (!svgContent) {
                svgContent = this._generateDefaultSvg(gradientId);
            }

            // The icon div is intentionally optional — classic sections
            // (GPUs, Hosts, Network) omit it; the SVG illustration carries
            // visual identity. Generator-driven sections (Alarms, future
            // module configs) supply an icon glyph alongside the title.
            //
            // When `icon` is present we emit the same wrapped structure
            // the legacy _generateHeader produced (icon div + sibling
            // title/subtitle div) so generator-driven callers see
            // byte-identical output. When `icon` is absent we emit the
            // flatter GPUs/Hosts/Network shape (no wrapper, just h1 + p).
            var subtitle = opts.subtitle || '';
            var title = opts.title || '';

            if (opts.icon) {
                return `
    <div class="l8-header-frame parallax-container">
        <div class="l8-header-bg parallax-layer" data-speed="0.5">
            ${svgContent}
        </div>
        <div class="l8-header-content parallax-layer" data-speed="1">
            <div class="l8-header-title">
                <div class="l8-icon">${opts.icon}</div>
                <div>
                    <h1 class="l8-title">${title}</h1>
                    <p class="l8-subtitle">${subtitle}</p>
                </div>
            </div>
        </div>
    </div>`;
            }

            return `
    <div class="l8-header-frame parallax-container">
        <div class="l8-header-bg parallax-layer" data-speed="0.5">
            ${svgContent}
        </div>
        <div class="l8-header-content parallax-layer" data-speed="1">
            <div class="l8-header-title">
                <h1 class="l8-title">${title}</h1>
                ${subtitle ? '<p class="l8-subtitle">' + subtitle + '</p>' : ''}
            </div>
        </div>
    </div>`;
        },

        /**
         * Generate the header with parallax and SVG illustration.
         * Delegates to the public renderHero primitive so generator-driven
         * sections and standalone hero callers share one implementation.
         * Output is byte-identical to the pre-refactor template literal.
         * @private
         */
        _generateHeader: function(config) {
            // Preserve generator-default icon (📊) for callers that don't
            // set one explicitly, so existing callers' rendered HTML is
            // byte-identical to the pre-refactor output.
            return this.renderHero({
                title:       config.title,
                subtitle:    config.subtitle || '',
                icon:        config.icon || '📊',
                svgContent:  config.svgContent,
                gradientId:  config.gradientId
            });
        },

        /**
         * Generate default SVG with grid background.
         * @private
         */
        _generateDefaultSvg: function(gradientId) {
            return `
            <svg class="l8-illustration" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.4" />
                        <stop offset="100%" style="stop-color:#0284c7;stop-opacity:0.2" />
                    </linearGradient>
                </defs>
                <g opacity="0.1">
                    <line x1="0" y1="30" x2="1200" y2="30" stroke="#0ea5e9" stroke-width="0.5"/>
                    <line x1="0" y1="60" x2="1200" y2="60" stroke="#0ea5e9" stroke-width="0.5"/>
                    <line x1="0" y1="90" x2="1200" y2="90" stroke="#0ea5e9" stroke-width="0.5"/>
                    <line x1="200" y1="0" x2="200" y2="120" stroke="#0ea5e9" stroke-width="0.5"/>
                    <line x1="400" y1="0" x2="400" y2="120" stroke="#0ea5e9" stroke-width="0.5"/>
                    <line x1="600" y1="0" x2="600" y2="120" stroke="#0ea5e9" stroke-width="0.5"/>
                    <line x1="800" y1="0" x2="800" y2="120" stroke="#0ea5e9" stroke-width="0.5"/>
                    <line x1="1000" y1="0" x2="1000" y2="120" stroke="#0ea5e9" stroke-width="0.5"/>
                </g>
                <circle cx="300" cy="50" r="3" fill="#0ea5e9" opacity="0.8">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="700" cy="50" r="3" fill="#0ea5e9" opacity="0.8">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite"/>
                </circle>
            </svg>`;
        },

        /**
         * Generate module tabs.
         * @private
         */
        _generateModuleTabs: function(config) {
            if (!config.modules || config.modules.length === 0) {
                return '';
            }

            const tabs = config.modules.map(mod => {
                const activeClass = mod.isDefault ? ' active' : '';
                return `
        <button class="l8-module-tab${activeClass}" data-module="${mod.key}">
            <span class="tab-icon">${mod.icon || '📁'}</span>
            <span class="tab-label">${mod.label}</span>
        </button>`;
            }).join('');

            return `
    <div class="l8-module-tabs">
        ${tabs}
    </div>`;
        },

        /**
         * Generate module contents (subnav and table containers).
         * @private
         */
        _generateModuleContents: function(config) {
            if (!config.modules || config.modules.length === 0) {
                return '';
            }

            return config.modules.map(mod => {
                const activeClass = mod.isDefault ? ' active' : '';
                return `
        <div class="l8-module-content${activeClass}" data-module="${mod.key}">
            ${this._generateSubnav(mod)}
            ${this._generateServiceViews(mod)}
        </div>`;
            }).join('');
        },

        /**
         * Generate subnav for a module.
         * @private
         */
        _generateSubnav: function(mod) {
            if (!mod.services || mod.services.length === 0) {
                return '';
            }

            const items = mod.services.map(svc => {
                const activeClass = svc.isDefault ? ' active' : '';
                return `
                <a class="l8-subnav-item${activeClass}" data-service="${svc.key}">
                    <span class="subnav-icon">${svc.icon || '📋'}</span>
                    <span class="subnav-label">${svc.label}</span>
                </a>`;
            }).join('');

            return `
            <nav class="l8-subnav">
                ${items}
            </nav>`;
        },

        /**
         * Generate service views (table containers).
         * @private
         */
        _generateServiceViews: function(mod) {
            if (!mod.services || mod.services.length === 0) {
                return '';
            }

            const views = mod.services.map(svc => {
                const activeClass = svc.isDefault ? ' active' : '';
                const containerId = `${mod.key}-${svc.key}-table-container`;
                const switcherId = `${mod.key}-${svc.key}-view-switcher`;
                return `
                <div class="l8-service-view${activeClass}" data-service="${svc.key}">
                    <div class="l8-view-switcher-slot" id="${switcherId}"></div>
                    <div class="l8-table-container" id="${containerId}"></div>
                </div>`;
            }).join('');

            return `
            <div class="l8-service-content">
                ${views}
            </div>`;
        },

        /**
         * Generate a portal page header with illustrated background and overlaid controls.
         * @param {object} config - { title, subtitle, icon, controlsHtml }
         * @returns {string} HTML string
         */
        generatePortalHeader: function(config) {
            var svgContent = '';
            if (window.Layer8SvgFactory) {
                svgContent = Layer8SvgFactory.generate(config.svgKey || 'default');
            }
            var headerConfig = {
                title: config.title || '',
                subtitle: config.subtitle || '',
                icon: config.icon || '',
                svgContent: svgContent
            };
            var headerHtml = this._generateHeader(headerConfig);
            var controlsHtml = config.controlsHtml || '';
            return '<div class="l8-portal-header-wrapper">' +
                headerHtml +
                '<div class="l8-portal-header-controls">' + controlsHtml + '</div>' +
            '</div>';
        },

        /**
         * Generate initialization script.
         * @private
         */
        _generateInitScript: function(config) {
            if (!config.initFn) {
                return '';
            }

            return `
<script>
    if (typeof ${config.initFn} === 'function') {
        ${config.initFn}();
    }
</script>`;
        }
    };
})();
