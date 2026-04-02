/*
 * Layer8D Portal Framework — shared desktop portal initialization.
 * Extracts all behavioral code from portal app.js files into a single reusable component.
 *
 * Usage:
 *   Layer8DPortal.init({
 *       namespace: 'ESS',           // window[namespace] object with sections, nav, columns, forms, etc.
 *       scopeField: 'employeeId',   // field used to filter data to current user
 *       scopeValue: username,       // resolved at init time (typically = username)
 *       sharedModels: ['Holiday', 'BenefitPlan'],  // models NOT filtered by scope
 *       moduleNamespace: 'HCM',     // ServiceRegistry namespace for form lookups
 *       portalTitle: 'Employee Self-Service',
 *       contentAreaId: 'l8-portal-content-area',
 *       navMenuSelector: '.l8-portal-nav-menu',
 *       headerRightSelector: '.l8-portal-header-right',
 *       logoutBtnSelector: '.l8-portal-logout-btn',
 *       usernameSelector: '.l8-portal-username'
 *   });
 */
(function() {
    'use strict';

    function init(config) {
        if (!config || !config.namespace) {
            console.error('Layer8DPortal: namespace is required');
            return;
        }

        var ns = window[config.namespace];
        if (!ns) {
            console.error('Layer8DPortal: window.' + config.namespace + ' not found');
            return;
        }

        var contentAreaId = config.contentAreaId || 'l8-portal-content-area';
        var navMenuSelector = config.navMenuSelector || '.l8-portal-nav-menu';
        var moduleNs = config.moduleNamespace || config.namespace;

        // Expose portal methods on the namespace
        ns._scopeField = config.scopeField || '';
        ns._scopeValue = '';
        ns._sharedModels = config.sharedModels || [];
        ns._moduleNs = moduleNs;
        ns._currentTable = null;
        ns.currentSection = 'dashboard';

        // Logout
        function logout() {
            sessionStorage.removeItem('bearerToken');
            localStorage.removeItem('bearerToken');
            localStorage.removeItem('rememberedUser');
            window.location.href = 'l8ui/login/index.html';
        }
        window.logout = logout;

        // Auth headers
        function getAuthHeaders() {
            var bearerToken = sessionStorage.getItem('bearerToken');
            return {
                'Authorization': bearerToken ? 'Bearer ' + bearerToken : '',
                'Content-Type': 'application/json'
            };
        }
        window.getAuthHeaders = getAuthHeaders;

        // Load section
        ns.loadSection = function(sectionKey) {
            var contentArea = document.getElementById(contentAreaId);
            if (!contentArea) return;

            ns.currentSection = sectionKey;

            // Update active nav
            var navLinks = document.querySelectorAll('.l8-portal-nav-link');
            navLinks.forEach(function(link) {
                link.classList.toggle('active', link.getAttribute('data-section') === sectionKey);
            });

            if (sectionKey === 'dashboard') {
                if (ns.dashboard && ns.dashboard.render) {
                    ns.dashboard.render(contentArea);
                } else {
                    contentArea.innerHTML = '<p style="padding:16px;">Dashboard not configured.</p>';
                }
                return;
            }

            var section = ns.sections[sectionKey];
            if (!section) {
                contentArea.innerHTML = '<p>Section not found.</p>';
                return;
            }

            var services = section.services;
            var tabsHtml = '<div class="l8-portal-service-tabs">';
            services.forEach(function(svc, i) {
                var activeClass = i === 0 ? ' active' : '';
                tabsHtml += '<button class="l8-portal-service-tab' + activeClass + '" data-service="' + svc.key + '" data-model="' + svc.model + '">' +
                    '<span class="l8-portal-tab-icon">' + (svc.icon || '') + '</span> ' + svc.label + '</button>';
            });
            tabsHtml += '</div>';

            contentArea.innerHTML = '<div class="l8-portal-section">' +
                '<div class="l8-header-frame">' +
                    '<div class="l8-header-content">' +
                        '<div class="l8-header-title">' +
                            '<span class="l8-icon">' + (section.icon || '') + '</span>' +
                            '<div>' +
                                '<h1 class="l8-title">' + section.label + '</h1>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                tabsHtml +
                '<div id="l8-portal-table-container"></div>' +
            '</div>';

            var tabs = contentArea.querySelectorAll('.l8-portal-service-tab');
            tabs.forEach(function(tab) {
                tab.addEventListener('click', function() {
                    tabs.forEach(function(t) { t.classList.remove('active'); });
                    tab.classList.add('active');
                    var svcKey = tab.getAttribute('data-service');
                    var svc = services.find(function(s) { return s.key === svcKey; });
                    ns._renderTable(svc);
                });
            });

            ns._renderTable(services[0]);
        };

        // Get form definition via ServiceRegistry
        ns._getFormDef = function(model) {
            return Layer8DServiceRegistry.getFormDef(moduleNs, model);
        };

        // Build serviceConfig for Layer8DFormsModal
        ns._getServiceConfig = function(svc) {
            var pkField = ns.primaryKeys[svc.model] || 'id';
            return {
                endpoint: Layer8DConfig.resolveEndpoint(svc.endpoint),
                primaryKey: pkField,
                modelName: svc.model
            };
        };

        // Render table or single record
        ns._renderTable = function(svc) {
            var container = document.getElementById('l8-portal-table-container');
            if (!container || !svc) return;

            container.innerHTML = '';

            if (svc.singleRecord) {
                ns._renderSingleRecord(svc, container);
                return;
            }

            var columns = ns.columns[svc.model];
            if (!columns) {
                container.innerHTML = '<p>No column definitions for ' + svc.model + '.</p>';
                return;
            }

            var pkField = ns.primaryKeys[svc.model] || 'id';

            var table = new Layer8DTable({
                containerId: 'l8-portal-table-container',
                columns: columns,
                modelName: svc.model,
                endpoint: Layer8DConfig.resolveEndpoint(svc.endpoint),
                serverSide: true,
                readOnly: svc.readOnly || false,
                pageSize: 15,
                getItemId: function(item) { return item[pkField] || ''; },
                onRowClick: function(item) {
                    ns._showDetail(svc, item);
                }
            });

            // Apply scope filtering
            if (ns._scopeValue && ns._scopeField && ns._sharedModels.indexOf(svc.model) === -1) {
                table.setBaseWhereClause(ns._scopeField + "='" + ns._scopeValue + "'");
            }

            table.init();
            ns._currentTable = table;
        };

        // Render single record inline
        ns._renderSingleRecord = function(svc, container) {
            var where = '';
            if (ns._scopeValue && ns._scopeField) {
                where = " where " + ns._scopeField + "='" + ns._scopeValue + "'";
            }
            var query = 'select * from ' + svc.model + where + ' limit 1 page 0';
            var body = encodeURIComponent(JSON.stringify({ text: query }));
            var endpoint = Layer8DConfig.resolveEndpoint(svc.endpoint);

            container.innerHTML = '<p style="padding:16px;">Loading...</p>';

            fetch(endpoint + '?body=' + body, {
                headers: getAuthHeaders()
            }).then(function(r) { return r.ok ? r.json() : null; })
              .then(function(data) {
                  if (!data || !data.list || data.list.length === 0) {
                      container.innerHTML = '<p style="padding:16px;">No data found.</p>';
                      return;
                  }
                  var item = data.list[0];
                  var formDef = ns._getFormDef(svc.model);
                  if (!formDef) {
                      container.innerHTML = '<p style="padding:16px;">No form definition for ' + svc.model + '.</p>';
                      return;
                  }
                  var serviceConfig = ns._getServiceConfig(svc);
                  Layer8DFormsInline.renderViewForm(container, serviceConfig, formDef, item);
              }).catch(function() {
                  container.innerHTML = '<p style="padding:16px;">Failed to load data.</p>';
              });
        };

        // Show detail popup
        ns._showDetail = function(svc, item) {
            var formDef = ns._getFormDef(svc.model);
            if (!formDef) return;

            var serviceConfig = ns._getServiceConfig(svc);
            var pkField = ns.primaryKeys[svc.model] || 'id';
            var itemId = item[pkField];

            if (!svc.readOnly && ns.forms[svc.model]) {
                Layer8DFormsModal.openEditForm(serviceConfig, formDef, itemId, function() {
                    if (ns._currentTable) ns._currentTable.refresh();
                });
            } else {
                Layer8DFormsModal.openViewForm(serviceConfig, formDef, item);
            }
        };

        // Refresh current table (used by actions)
        ns.refreshCurrentTable = function() {
            if (ns._currentTable) ns._currentTable.refresh();
        };

        // DOMContentLoaded initialization
        document.addEventListener('DOMContentLoaded', async function() {
            // Load config
            if (typeof Layer8DConfig !== 'undefined') {
                await Layer8DConfig.load();
            }

            // Check bearer token
            var bearerToken = sessionStorage.getItem('bearerToken');
            if (!bearerToken) {
                window.location.href = 'l8ui/login/index.html';
                return;
            }

            localStorage.setItem('bearerToken', bearerToken);
            window.bearerToken = bearerToken;

            // Set username
            var username = sessionStorage.getItem('currentUser') || 'User';
            ns._scopeValue = config.scopeValue || username;

            var usernameEl = document.querySelector(config.usernameSelector || '.l8-portal-username');
            if (usernameEl) usernameEl.textContent = username;

            // Call portal-specific onUsername callback (for setting display name, etc.)
            if (config.onUsername) {
                config.onUsername(username);
            }

            // Initialize portal switcher (non-blocking)
            if (typeof Layer8DPortalSwitcher !== 'undefined') {
                Layer8DPortalSwitcher.init({
                    container: document.querySelector(config.headerRightSelector || '.l8-portal-header-right'),
                    insertBefore: document.querySelector(config.logoutBtnSelector || '.l8-portal-logout-btn'),
                    apiPrefix: Layer8DConfig.getApiPrefix(),
                    currentPath: window.location.pathname
                });
            }

            // Load permissions
            try {
                var permResp = await fetch('/permissions', {
                    headers: { 'Authorization': 'Bearer ' + bearerToken, 'Content-Type': 'application/json' }
                });
                if (permResp.ok) {
                    window.Layer8DPermissions = await permResp.json();
                }
            } catch (e) { console.warn('Failed to load permissions:', e); }

            // Build nav links
            var navMenu = document.querySelector(navMenuSelector);
            if (navMenu && ns.nav) {
                var navHtml = '';
                ns.nav.forEach(function(item) {
                    var activeClass = item.key === 'dashboard' ? ' active' : '';
                    navHtml += '<li><a href="#" data-section="' + item.key + '" class="l8-portal-nav-link' + activeClass + '">' +
                        '<span class="l8-portal-nav-icon">' + item.icon + '</span>' +
                        '<span>' + item.label + '</span>' +
                    '</a></li>';
                });
                navMenu.innerHTML = navHtml;

                navMenu.querySelectorAll('.l8-portal-nav-link').forEach(function(link) {
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        var section = this.getAttribute('data-section');
                        ns.loadSection(section);
                    });
                });
            }

            // Load default section
            ns.loadSection('dashboard');
        });
    }

    window.Layer8DPortal = { init: init };
})();
