/*
 * System Module Dependency Graph
 * Single source of truth for module/sub-module/service dependencies.
 * Used by the toggle tree and module filter to enforce enable/disable rules.
 */
(function() {
    'use strict';

    window.L8SysDependencyGraph = {
        // Tier 1: Cross-module dependencies
        // Icons are real inline SVG (stroke="currentColor") instead of an
        // emoji glyph -- emoji render with their own fixed built-in colors
        // on every theme and can't be recolored via CSS.
        modules: {
            financial:     { label: 'Financial Management',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', depends: [] },
            hcm:           { label: 'Human Capital Mgmt',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', depends: ['financial'] },
            scm:           { label: 'Supply Chain Mgmt',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>', depends: ['financial', 'hcm'] },
            sales:         { label: 'Sales & Distribution',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>', depends: ['financial', 'hcm', 'scm'] },
            manufacturing: { label: 'Manufacturing',         icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg>', depends: ['financial', 'hcm', 'scm', 'sales'] },
            crm:           { label: 'Customer Relations',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>', depends: ['financial', 'hcm'] },
            projects:      { label: 'Project Management',    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z"/></svg>', depends: ['financial', 'hcm', 'crm'] },
            bi:            { label: 'Business Intelligence', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>', depends: ['hcm'] },
            documents:     { label: 'Document Management',   icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>', depends: ['hcm'] },
            ecommerce:     { label: 'E-Commerce',            icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>', depends: ['financial', 'hcm', 'scm'] },
            compliance:    { label: 'Compliance & Risk',     icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>', depends: ['financial', 'hcm'] }
        },

        // Tier 2: Intra-module sub-module dependencies
        // First sub-module is always the foundation (required by all others)
        subModules: {
            financial: {
                'general-ledger':      { depends: [], foundation: true },
                'accounts-payable':    { depends: ['general-ledger'] },
                'accounts-receivable': { depends: ['general-ledger'] },
                'cash':                { depends: ['general-ledger'] },
                'fixed-assets':        { depends: ['general-ledger'] },
                'budgeting':           { depends: ['general-ledger'] },
                'tax':                 { depends: ['general-ledger'] }
            },
            hcm: {
                'core-hr':      { depends: [], foundation: true },
                'payroll':      { depends: ['core-hr'] },
                'benefits':     { depends: ['core-hr'] },
                'time':         { depends: ['core-hr'] },
                'talent':       { depends: ['core-hr'] },
                'learning':     { depends: ['core-hr'] },
                'compensation': { depends: ['core-hr'] }
            },
            scm: {
                'procurement':     { depends: [], foundation: true },
                'inventory':       { depends: ['procurement'] },
                'warehouse':       { depends: ['inventory'] },
                'logistics':       { depends: ['procurement'] },
                'demand-planning': { depends: ['inventory'] },
                'supply-planning': { depends: ['procurement', 'inventory'] }
            },
            sales: {
                'customers': { depends: [], foundation: true },
                'pricing':   { depends: ['customers'] },
                'orders':    { depends: ['customers', 'pricing'] },
                'shipping':  { depends: ['orders'] },
                'billing':   { depends: ['orders'] },
                'analytics': { depends: ['customers'] }
            },
            manufacturing: {
                'engineering': { depends: [], foundation: true },
                'production':  { depends: ['engineering'] },
                'shopfloor':   { depends: ['production'] },
                'quality':     { depends: ['production'] },
                'planning':    { depends: ['engineering'] },
                'costing':     { depends: ['production'] }
            },
            crm: {
                'leads':        { depends: [], foundation: true },
                'opportunities': { depends: ['leads'] },
                'accounts':     { depends: ['leads'] },
                'marketing':    { depends: ['leads'] },
                'service':      { depends: ['accounts'] },
                'fieldservice': { depends: ['accounts', 'service'] }
            },
            projects: {
                'planning':    { depends: [], foundation: true },
                'resources':   { depends: ['planning'] },
                'timeexpense': { depends: ['planning'] },
                'billing':     { depends: ['planning'] },
                'analytics':   { depends: ['planning'] }
            },
            bi: {
                'reporting':      { depends: [], foundation: true },
                'dashboards':     { depends: ['reporting'] },
                'analytics':      { depends: ['reporting'] },
                'datamanagement': { depends: [] }
            },
            documents: {
                'storage':     { depends: [], foundation: true },
                'workflow':    { depends: ['storage'] },
                'integration': { depends: ['storage'] },
                'compliance':  { depends: ['storage'] }
            },
            ecommerce: {
                'catalog':    { depends: [], foundation: true },
                'customers':  { depends: [] },
                'orders':     { depends: ['catalog', 'customers'] },
                'promotions': { depends: ['catalog'] }
            },
            compliance: {
                'regulatory': { depends: [], foundation: true },
                'controls':   { depends: ['regulatory'] },
                'risk':       { depends: ['regulatory'] },
                'audit':      { depends: ['regulatory', 'controls'] }
            }
        },

        // Tier 3: Intra-sub-module service dependencies (only non-trivial ones)
        // Services not listed here are independent within their sub-module
        services: {}
    };

})();
