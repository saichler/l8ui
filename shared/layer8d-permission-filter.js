/*
 * Layer8DPermissionFilter - Role-based permission filter for navigation.
 * Hides nav entries (sidebar modules, sub-module tabs, service items) when the
 * logged-in user lacks GET (action 5) access to all models within that scope.
 *
 * Works alongside Layer8DModuleFilter (module enable/disable). Both must pass
 * for an item to be visible.
 *
 * Generic l8ui component — project-specific model resolution is provided via
 * registerResolver().
 */
(function() {
    'use strict';

    window.Layer8DPermissionFilter = {
        _resolvers: [],

        /**
         * Is the permission system active?
         * Empty/null Layer8DPermissions = permissive mode (show everything).
         */
        _isActive: function() {
            var p = window.Layer8DPermissions;
            return p && typeof p === 'object' && Object.keys(p).length > 0;
        },

        /**
         * Check if user has GET (action 5) access to a model.
         * Permissive when no permissions loaded.
         * @param {string} modelName - protobuf type name
         * @returns {boolean}
         */
        canView: function(modelName) {
            if (!this._isActive()) return true;
            var perms = window.Layer8DPermissions[modelName];
            if (!perms) return false;
            return perms.indexOf(5) !== -1;
        },

        /**
         * Check if user has GET access to ANY model in a list.
         * @param {string[]} modelNames
         * @returns {boolean}
         */
        canViewAny: function(modelNames) {
            if (!this._isActive()) return true;
            if (!modelNames || modelNames.length === 0) return true;
            for (var i = 0; i < modelNames.length; i++) {
                if (this.canView(modelNames[i])) return true;
            }
            return false;
        },

        /**
         * Register a resolver that maps (sectionKey, moduleKey, serviceKey) to a
         * model name. Multiple resolvers can be registered; first non-null wins.
         * @param {function} resolver - (sectionKey, moduleKey, serviceKey) => modelName|null
         */
        registerResolver: function(resolver) {
            this._resolvers.push(resolver);
        },

        /**
         * Resolve a model name for a section/module/service path.
         * @private
         */
        _resolve: function(sectionKey, moduleKey, serviceKey) {
            for (var i = 0; i < this._resolvers.length; i++) {
                var model = this._resolvers[i](sectionKey, moduleKey, serviceKey);
                if (model) return model;
            }
            return null;
        },

        /**
         * Desktop: Apply permission filter to sidebar module links.
         * @param {Object} moduleModels - { sectionKey: [modelName, ...] }
         */
        applyToSidebar: function(moduleModels) {
            if (!this._isActive()) return;
            var self = this;
            document.querySelectorAll('.nav-link[data-section]').forEach(function(link) {
                var section = link.getAttribute('data-section');
                if (section === 'dashboard' || section === 'system') return;
                var models = moduleModels[section];
                if (!models || models.length === 0) return;
                if (!self.canViewAny(models)) {
                    var li = link.closest('li');
                    if (li) li.style.display = 'none';
                }
            });
        },

        /**
         * Desktop: Apply permission filter to section tabs and sub-nav items.
         * Uses registered resolvers to look up models for each service.
         * @param {string} sectionKey
         */
        applyToSection: function(sectionKey) {
            if (!this._isActive()) return;
            var self = this;

            // Filter sub-nav service items
            document.querySelectorAll(
                '.l8-subnav-item[data-service], .hcm-subnav-item[data-service]'
            ).forEach(function(item) {
                var serviceKey = item.getAttribute('data-service');
                var moduleContent = item.closest('[data-module]');
                if (!moduleContent) return;
                var moduleKey = moduleContent.getAttribute('data-module');
                var model = self._resolve(sectionKey, moduleKey, serviceKey);
                if (model && !self.canView(model)) {
                    item.style.display = 'none';
                }
            });

            // Filter module tabs — hide if ALL services in that module are denied
            document.querySelectorAll(
                '.l8-module-tab[data-module], .hcm-module-tab[data-module]'
            ).forEach(function(tab) {
                var moduleKey = tab.getAttribute('data-module');
                var moduleContent = document.querySelector(
                    '.l8-module-content[data-module="' + moduleKey + '"]'
                );
                if (!moduleContent) return;
                var visibleServices = moduleContent.querySelectorAll(
                    '.l8-subnav-item:not([style*="display: none"]), .hcm-subnav-item:not([style*="display: none"])'
                );
                if (visibleServices.length === 0) {
                    tab.style.display = 'none';
                }
            });

            // If the active tab is now hidden, activate the first visible one
            this._fixActiveTab();
        },

        /**
         * Ensure a visible tab is active after filtering.
         * @private
         */
        _fixActiveTab: function() {
            var activeTabs = document.querySelectorAll('.l8-module-tab.active');
            activeTabs.forEach(function(tab) {
                if (tab.style.display === 'none') {
                    tab.classList.remove('active');
                    var mk = tab.dataset.module;
                    var mc = document.querySelector('.l8-module-content[data-module="' + mk + '"]');
                    if (mc) mc.classList.remove('active');
                }
            });
            var hasActive = document.querySelector('.l8-module-tab.active:not([style*="display: none"])');
            if (!hasActive) {
                var first = document.querySelector('.l8-module-tab:not([style*="display: none"])');
                if (first) {
                    first.classList.add('active');
                    var mk = first.dataset.module;
                    var mc = document.querySelector('.l8-module-content[data-module="' + mk + '"]');
                    if (mc) mc.classList.add('active');
                }
            }
        },

        // --- Mobile helpers ---

        /**
         * Check if a mobile service config is viewable.
         * @param {Object} serviceConfig - { model: 'ModelName', ... }
         * @returns {boolean}
         */
        canViewService: function(serviceConfig) {
            if (!this._isActive()) return true;
            return serviceConfig && serviceConfig.model ? this.canView(serviceConfig.model) : true;
        },

        /**
         * Filter a list of mobile service configs, return only viewable ones.
         * @param {Object[]} services
         * @returns {Object[]}
         */
        filterServices: function(services) {
            if (!this._isActive()) return services;
            var self = this;
            return services.filter(function(svc) { return self.canViewService(svc); });
        },

        /**
         * Check if ANY service in a mobile sub-module is viewable.
         * @param {string} moduleKey
         * @param {string} subModuleKey
         * @returns {boolean}
         */
        canViewSubModule: function(moduleKey, subModuleKey) {
            if (!this._isActive()) return true;
            var mc = window.LAYER8M_NAV_CONFIG && LAYER8M_NAV_CONFIG[moduleKey];
            if (!mc || !mc.services || !mc.services[subModuleKey]) return true;
            var self = this;
            return mc.services[subModuleKey].some(function(svc) { return self.canViewService(svc); });
        },

        /**
         * Check if ANY service in a mobile module is viewable.
         * @param {string} moduleKey
         * @returns {boolean}
         */
        canViewModule: function(moduleKey) {
            if (!this._isActive()) return true;
            var mc = window.LAYER8M_NAV_CONFIG && LAYER8M_NAV_CONFIG[moduleKey];
            if (!mc) return true;
            if (mc.section) return true;
            if (!mc.subModules) return true;
            var self = this;
            return mc.subModules.some(function(sm) { return self.canViewSubModule(moduleKey, sm.key); });
        }
    };

})();
