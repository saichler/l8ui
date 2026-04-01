/*
 * Layer8D Portal Dashboard Helper — reusable data-fetching helpers for portal dashboards.
 * Portal-specific dashboards define their own cards and data loaders using these helpers.
 *
 * Usage:
 *   Layer8DPortalDashboard.fetchCount(endpoint, query, function(total, list) { ... });
 *   Layer8DPortalDashboard.renderCards(container, cards);
 *   Layer8DPortalDashboard.renderQuickActions(container, actions);
 */
(function() {
    'use strict';

    /**
     * Fetch data from an endpoint with an L8Query and return total count + list.
     * Works for both desktop (getAuthHeaders) and mobile (Layer8MAuth).
     */
    function fetchCount(endpoint, query, callback) {
        var body = encodeURIComponent(JSON.stringify({ text: query }));
        var headers;
        if (typeof getAuthHeaders === 'function') {
            headers = getAuthHeaders();
        } else if (typeof Layer8MAuth !== 'undefined') {
            var token = Layer8MAuth.getBearerToken();
            headers = {
                'Authorization': token ? 'Bearer ' + token : '',
                'Content-Type': 'application/json'
            };
        } else {
            headers = { 'Content-Type': 'application/json' };
        }

        fetch(Layer8DConfig.resolveEndpoint(endpoint) + '?body=' + body, {
            headers: headers
        }).then(function(r) { return r.ok ? r.json() : null; })
          .then(function(data) {
              if (!data) { callback(0, null); return; }
              var total = 0;
              if (data.metadata && data.metadata.keyCount && data.metadata.keyCount.counts) {
                  total = data.metadata.keyCount.counts.Total || 0;
              }
              callback(total, data.list);
          }).catch(function() { callback(0, null); });
    }

    /**
     * Build a scoped where clause fragment for a field=value filter.
     * @param {string} scopeField - field name (e.g., 'employeeId')
     * @param {string} scopeValue - value (e.g., 'hcm')
     * @param {boolean} isPrefix - true if this should produce "field='val' and " (for AND chaining)
     * @returns {string}
     */
    function scopeWhere(scopeField, scopeValue, isPrefix) {
        if (!scopeField || !scopeValue) return '';
        if (isPrefix) {
            return scopeField + "='" + scopeValue + "' and ";
        }
        return " where " + scopeField + "='" + scopeValue + "'";
    }

    window.Layer8DPortalDashboard = {
        fetchCount: fetchCount,
        scopeWhere: scopeWhere
    };
})();
