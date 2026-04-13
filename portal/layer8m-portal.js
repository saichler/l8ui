/*
 * Layer8M Portal Framework — shared mobile portal initialization.
 * Extracts all behavioral code from mobile portal app.js files into a single reusable component.
 *
 * Usage:
 *   Layer8MPortal.init({
 *       namespace: 'ESS',           // window[namespace] object with sections, nav, columns, forms, etc.
 *       mobileObject: 'MobileESS',  // name of the window object for mobile-specific methods
 *       scopeField: 'employeeId',   // field used to filter data to current user
 *       sharedModels: ['Holiday', 'BenefitPlan'],
 *       moduleNamespace: 'HCM',     // ServiceRegistry namespace for form lookups
 *       contentAreaId: 'content-area',
 *       sidebarNavId: 'l8-portal-sidebar-nav',
 *       navMenuTitle: 'Menu'
 *   });
 */
(function() {
    'use strict';

    function init(config) {
        if (!config || !config.namespace) {
            console.error('Layer8MPortal: namespace is required');
            return;
        }

        var ns = window[config.namespace];
        if (!ns) {
            console.error('Layer8MPortal: window.' + config.namespace + ' not found');
            return;
        }

        var mobileObjName = config.mobileObject || ('Mobile' + config.namespace);
        var contentAreaId = config.contentAreaId || 'content-area';
        var sidebarNavId = config.sidebarNavId || 'l8-portal-sidebar-nav';
        var moduleNs = config.moduleNamespace || config.namespace;
        var navMenuTitle = config.navMenuTitle || 'Menu';
        var portalSvgKey = config.portalSvgKey || 'default';

        ns._scopeField = config.scopeField || '';
        ns._scopeValue = '';
        ns._sharedModels = config.sharedModels || [];
        ns._moduleNs = moduleNs;

        var mobile = {
            currentSection: 'dashboard',
            _currentTable: null,

            async init() {
                // Check authentication
                if (!Layer8MAuth.requireAuth()) return;

                // Load configuration
                if (typeof Layer8MConfig !== 'undefined') await Layer8MConfig.load();
                if (typeof Layer8DConfig !== 'undefined') await Layer8DConfig.load();

                // Set user info
                var username = Layer8MAuth.getUsername();
                ns._scopeValue = config.scopeValue || username;

                var nameEl = document.getElementById('user-name');
                if (nameEl) nameEl.textContent = username;
                var avatarEl = document.getElementById('user-avatar');
                if (avatarEl) avatarEl.textContent = username.charAt(0).toUpperCase();

                // Generate illustrated page header
                var headerEl = document.querySelector('.mobile-header');
                if (headerEl && window.Layer8SectionGenerator) {
                    // Extract title from existing HTML before replacing
                    var existingTitle = config.portalTitle || '';
                    if (!existingTitle) {
                        var titleSpan = headerEl.querySelector('.header-logo-text');
                        if (titleSpan) existingTitle = titleSpan.textContent;
                    }
                    var themePickerHtml = '';
                    if (typeof Layer8DThemeSwitcher !== 'undefined') {
                        themePickerHtml = '<div class="layer8d-theme-picker">' +
                            '<button class="header-action-btn layer8d-theme-btn" onclick="Layer8DThemeSwitcher.toggleDropdown()" aria-label="Choose theme" title="Choose theme">' +
                                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                    '<circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0 0 20V2z"/>' +
                                '</svg>' +
                            '</button>' +
                            '<div class="layer8d-theme-menu"></div>' +
                        '</div>';
                    }
                    var controlsHtml = '<div class="l8-portal-m-header-controls">' +
                        '<button class="header-menu-btn" id="menu-toggle-new">' +
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                '<line x1="3" y1="6" x2="21" y2="6"></line>' +
                                '<line x1="3" y1="12" x2="21" y2="12"></line>' +
                                '<line x1="3" y1="18" x2="21" y2="18"></line>' +
                            '</svg>' +
                        '</button>' +
                        '<div style="display:flex;align-items:center;gap:8px;">' +
                            themePickerHtml +
                            '<button class="header-action-btn" id="refresh-btn-new" title="Refresh">' +
                                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                                    '<path d="M23 4v6h-6"></path>' +
                                    '<path d="M1 20v-6h6"></path>' +
                                    '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>' +
                                '</svg>' +
                            '</button>' +
                        '</div>' +
                    '</div>';
                    headerEl.innerHTML = Layer8SectionGenerator.generatePortalHeader({
                        title: existingTitle,
                        icon: config.portalIcon || '',
                        svgKey: portalSvgKey,
                        controlsHtml: controlsHtml
                    });
                    headerEl.classList.add('l8-portal-m-illustrated-header');
                }

                // Call portal-specific onUsername callback
                if (config.onUsername) {
                    config.onUsername(username);
                }

                // Load permissions
                try {
                    var token = Layer8MAuth.getBearerToken();
                    var permResp = await fetch('/permissions', {
                        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
                    });
                    if (permResp.ok) {
                        window.Layer8DPermissions = await permResp.json();
                    }
                } catch (e) { console.warn('Failed to load permissions:', e); }

                // Build sidebar navigation
                this._buildNav();

                // Setup sidebar toggle
                this._initSidebar();

                // Setup refresh button (try new ID from generated header, fallback to original)
                var refreshBtn = document.getElementById('refresh-btn-new') || document.getElementById('refresh-btn');
                if (refreshBtn) {
                    var self = this;
                    refreshBtn.addEventListener('click', function() {
                        self.loadSection(self.currentSection);
                    });
                }

                // Load dashboard
                this.loadSection('dashboard');
            },

            _buildNav: function() {
                var navContainer = document.getElementById(sidebarNavId);
                if (!navContainer || !ns.nav) return;

                var html = '<div class="l8-portal-nav-section">' +
                    '<div class="l8-portal-nav-section-title">' + navMenuTitle + '</div>';

                ns.nav.forEach(function(item) {
                    var activeClass = item.key === 'dashboard' ? ' active' : '';
                    html += '<button class="l8-portal-nav-item' + activeClass + '" data-section="' + item.key + '">' +
                        '<span class="l8-portal-nav-icon">' + item.icon + '</span>' +
                        item.label +
                    '</button>';
                });

                html += '</div>';
                navContainer.innerHTML = html;

                var self = this;
                navContainer.querySelectorAll('.l8-portal-nav-item').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        var section = this.getAttribute('data-section');
                        self.closeSidebar();
                        self.loadSection(section);
                    });
                });
            },

            _initSidebar: function() {
                var menuToggle = document.getElementById('menu-toggle-new') || document.getElementById('menu-toggle');
                var overlay = document.getElementById('sidebar-overlay');
                var self = this;
                if (menuToggle) menuToggle.addEventListener('click', function() { self.openSidebar(); });
                if (overlay) overlay.addEventListener('click', function() { self.closeSidebar(); });
            },

            openSidebar: function() {
                var sidebar = document.getElementById('sidebar');
                var overlay = document.getElementById('sidebar-overlay');
                if (sidebar) sidebar.classList.add('open');
                if (overlay) overlay.classList.add('visible');
                document.body.style.overflow = 'hidden';
            },

            closeSidebar: function() {
                var sidebar = document.getElementById('sidebar');
                var overlay = document.getElementById('sidebar-overlay');
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('visible');
                document.body.style.overflow = '';
            },

            loadSection: function(sectionKey) {
                var contentArea = document.getElementById(contentAreaId);
                if (!contentArea) return;

                this.currentSection = sectionKey;

                // Update active nav
                document.querySelectorAll('.l8-portal-nav-item').forEach(function(btn) {
                    btn.classList.toggle('active', btn.getAttribute('data-section') === sectionKey);
                });

                if (sectionKey === 'dashboard') {
                    if (ns.mobileDashboard && ns.mobileDashboard.render) {
                        ns.mobileDashboard.render(contentArea);
                    } else {
                        contentArea.innerHTML = '<div class="empty-state"><h4 class="empty-state-title">Dashboard not configured</h4></div>';
                    }
                    return;
                }

                var section = ns.sections[sectionKey];
                if (!section) {
                    contentArea.innerHTML = '<div class="empty-state"><h4 class="empty-state-title">Section not found</h4></div>';
                    return;
                }

                var services = section.services;
                var tabsHtml = '';
                tabsHtml += '<div class="l8-portal-m-service-tabs">';
                services.forEach(function(svc, i) {
                    var activeClass = i === 0 ? ' active' : '';
                    tabsHtml += '<button class="l8-portal-m-service-tab' + activeClass + '" data-service="' + svc.key + '">' +
                        (svc.icon || '') + ' ' + svc.label + '</button>';
                });
                tabsHtml += '</div>';
                tabsHtml += '<div id="l8-portal-table-container" class="l8-portal-m-table-container"></div>';

                contentArea.innerHTML = tabsHtml;

                var self = this;
                var tabs = contentArea.querySelectorAll('.l8-portal-m-service-tab');
                tabs.forEach(function(tab) {
                    tab.addEventListener('click', function() {
                        tabs.forEach(function(t) { t.classList.remove('active'); });
                        tab.classList.add('active');
                        var svcKey = tab.getAttribute('data-service');
                        var svc = services.find(function(s) { return s.key === svcKey; });
                        self._renderTable(svc);
                    });
                });

                this._renderTable(services[0]);
            },

            _renderTable: function(svc) {
                var container = document.getElementById('l8-portal-table-container');
                if (!container || !svc) return;

                container.innerHTML = '';

                if (svc.singleRecord) {
                    this._renderSingleRecord(svc, container);
                    return;
                }

                var columns = ns.columns[svc.model];
                if (!columns) {
                    container.innerHTML = '<div class="empty-state"><p class="empty-state-message">No columns for ' + svc.model + '</p></div>';
                    return;
                }

                var self = this;
                var tableConfig = {
                    columns: columns,
                    modelName: svc.model,
                    endpoint: Layer8DConfig.resolveEndpoint(svc.endpoint),
                    serverSide: true,
                    rowsPerPage: 15,
                    onCardClick: function(item) {
                        self._showDetail(svc, item);
                    }
                };

                // Apply scope filtering
                if (ns._scopeValue && ns._scopeField && ns._sharedModels.indexOf(svc.model) === -1) {
                    tableConfig.baseWhereClause = ns._scopeField + "='" + ns._scopeValue + "'";
                }

                this._currentTable = new Layer8MTable('l8-portal-table-container', tableConfig);
            },

            _renderSingleRecord: function(svc, container) {
                var where = '';
                if (ns._scopeValue && ns._scopeField) {
                    where = " where " + ns._scopeField + "='" + ns._scopeValue + "'";
                }
                var query = 'select * from ' + svc.model + where + ' limit 1 page 0';
                var body = encodeURIComponent(JSON.stringify({ text: query }));
                var endpoint = Layer8DConfig.resolveEndpoint(svc.endpoint);

                container.innerHTML = '<div class="loading">Loading</div>';

                fetch(endpoint + '?body=' + body, {
                    headers: this._getHeaders()
                }).then(function(r) { return r.ok ? r.json() : null; })
                  .then(function(data) {
                      if (!data || !data.list || data.list.length === 0) {
                          container.innerHTML = '<div class="empty-state"><p class="empty-state-message">No data found.</p></div>';
                          return;
                      }
                      var item = data.list[0];
                      var formDef = mobile._getFormDef(svc.model);
                      if (!formDef) {
                          container.innerHTML = '<div class="empty-state"><p class="empty-state-message">No form definition for ' + svc.model + '</p></div>';
                          return;
                      }
                      var html = Layer8MForms.renderForm(formDef, item, true);
                      container.innerHTML = '<div style="padding:8px 0;">' + html + '</div>';
                      Layer8MForms.initFormFields(container, formDef);
                      container.querySelectorAll('input, select, textarea').forEach(function(el) {
                          el.disabled = true;
                      });
                      Layer8MForms.wireTabSwitching(container);
                  }).catch(function() {
                      container.innerHTML = '<div class="empty-state"><p class="empty-state-message">Failed to load data.</p></div>';
                  });
            },

            _showDetail: function(svc, item) {
                var formDef = this._getFormDef(svc.model);
                if (!formDef) return;

                var pkField = ns.primaryKeys[svc.model] || 'id';
                var title = svc.label + ' Details';

                if (!svc.readOnly && ns.forms[svc.model]) {
                    var serviceConfig = {
                        label: svc.label,
                        model: svc.model,
                        endpoint: svc.endpoint,
                        idField: pkField
                    };
                    window._Layer8MNavActiveTable = this._currentTable;
                    Layer8MNavCrud.openServiceForm(serviceConfig, formDef, item);
                } else {
                    var content = Layer8MForms.renderForm(formDef, item, true);
                    Layer8MPopup.show({
                        title: title,
                        content: content,
                        size: 'large',
                        showFooter: false,
                        onShow: function(popup) {
                            Layer8MForms.initFormFields(popup.body, formDef);
                            popup.body.querySelectorAll('input, select, textarea').forEach(function(el) {
                                el.disabled = true;
                            });
                            Layer8MForms.wireTabSwitching(popup.body);
                        }
                    });
                }
            },

            _getFormDef: function(model) {
                if (typeof Layer8DServiceRegistry !== 'undefined') {
                    return Layer8DServiceRegistry.getFormDef(moduleNs, model);
                }
                return null;
            },

            _getServiceConfig: function(svc) {
                var pkField = ns.primaryKeys[svc.model] || 'id';
                return {
                    endpoint: Layer8DConfig.resolveEndpoint(svc.endpoint),
                    primaryKey: pkField,
                    modelName: svc.model
                };
            },

            _getHeaders: function() {
                var token = Layer8MAuth.getBearerToken();
                return {
                    'Authorization': token ? 'Bearer ' + token : '',
                    'Content-Type': 'application/json'
                };
            },

            logout: function() {
                Layer8MAuth.logout();
            }
        };

        // Expose on window
        window[mobileObjName] = mobile;

        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() { mobile.init(); });
        } else {
            mobile.init();
        }
    }

    window.Layer8MPortal = { init: init };
})();
