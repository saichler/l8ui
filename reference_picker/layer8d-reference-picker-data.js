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
 * Layer 8 Reference Picker - Data Management
 * Methods for L8Query building and server communication
 */
(function() {
    'use strict';

    const internal = Layer8DReferencePicker._internal;

    /**
     * Build L8Query for reference picker.
     * Key difference from edit_table/Layer8DDataSource: selects specific
     * columns (not '*'), filters on a single resolved column (not a
     * per-column filters map), and always sorts (falls back to
     * displayColumn) — assembled via the same shared
     * shared/layer8-query-builder.js used by every other L8Query builder in
     * this codebase.
     */
    // Client-side filtering (clientFilter / postFilter) must see EVERY candidate
    // row, not one server page: filtering a single page silently drops the
    // matches on the other pages and leaves the total wrong. A picker that uses
    // them loads its whole base set (in server pages of FULL_SET_PAGE rows),
    // filters it and pages it locally -- meant for small reference sets; a
    // large one must filter server-side (filterColumn).
    const FULL_SET_PAGE = 500;

    internal.isClientFiltered = function(config) {
        return !!(config.clientFilter || config.postFilter);
    };

    /**
     * @param {Object} [paging] - {pageSize, pageIndex} overriding the picker's
     *   own paging (used to load the full base set of a client-filtered picker)
     */
    internal.buildQuery = function(config, state, paging) {
        const whereConditions = [];
        const baseWhere = typeof config.baseWhereClause === 'function'
            ? config.baseWhereClause()
            : config.baseWhereClause;
        if (baseWhere) {
            whereConditions.push(baseWhere);
        }
        if (state.filterValue && state.filterValue.trim() && !config.clientFilter) {
            const filterKey = config.filterColumn || config.displayColumn;
            whereConditions.push(`${filterKey}=${state.filterValue.trim()}*`);
        }

        return Layer8QueryBuilder.assembleQuery({
            modelName: config.modelName,
            selectClause: config.selectColumns.join(','),
            whereConditions,
            pageSize: paging ? paging.pageSize : config.pageSize,
            pageIndex: paging ? paging.pageIndex : state.currentPage,
            sortClause: config.sortColumn || config.displayColumn,
            sortDescending: state.sortDirection === 'desc',
            realtime: false
        });
    };

    /**
     * Fetch data from server
     */
    internal.fetchData = async function(config, state) {
        if (!config.endpoint || !config.modelName) {
            console.error('ReferencePicker requires endpoint and modelName');
            return { data: [], totalItems: 0 };
        }

        try {
            if (internal.isClientFiltered(config)) {
                return await fetchClientFiltered(config, state);
            }
            const data = await fetchPage(config, internal.buildQuery(config, state));

            // Extract total count from metadata — see Layer8QueryBuilder.resolvePageTotal
            // for why this must only be read on the first page.
            const totalCount = Layer8QueryBuilder.resolvePageTotal(state.currentPage === 0, data.metadata, state.totalItems);
            return {
                data: data.list || [],
                totalItems: totalCount
            };
        } catch (error) {
            console.error('Error fetching reference data:', error);
            return { data: [], totalItems: 0 };
        }
    };

    /** One GET of the picker's endpoint; throws on a failed response. */
    async function fetchPage(config, query) {
        const body = encodeURIComponent(JSON.stringify({ text: query }));
        const response = await fetch(config.endpoint + '?body=' + body, {
            method: 'GET',
            headers: typeof getAuthHeaders === 'function'
                ? getAuthHeaders()
                : { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        return response.json();
    }

    /**
     * A client-filtered picker: load the whole base set, apply postFilter and
     * clientFilter to all of it, then return the current page of the result
     * with its true total.
     */
    async function fetchClientFiltered(config, state) {
        let rows = [];
        for (let pageIndex = 0; ; pageIndex++) {
            const data = await fetchPage(config,
                internal.buildQuery(config, state, { pageSize: FULL_SET_PAGE, pageIndex: pageIndex }));
            const list = data.list || [];
            rows = rows.concat(list);
            if (list.length < FULL_SET_PAGE) break;
        }
        if (config.postFilter) {
            rows = rows.filter(config.postFilter);
        }
        const term = state.filterValue ? state.filterValue.trim() : '';
        if (config.clientFilter && term) {
            rows = rows.filter(item => config.clientFilter(item, term));
        }
        const start = state.currentPage * config.pageSize;
        return {
            data: rows.slice(start, start + config.pageSize),
            totalItems: rows.length
        };
    }

    /**
     * Refresh picker data and re-render
     */
    internal.refresh = async function(picker, config, state) {
        // Show loading state
        const listEl = picker.querySelector('.layer8d-refpicker-list');
        listEl.innerHTML = '<div class="layer8d-refpicker-loading">Loading...</div>';

        // Fetch data
        const result = await internal.fetchData(config, state);
        state.data = result.data;
        state.totalItems = result.totalItems;

        // Re-render
        internal.renderList(picker, config, state);
        internal.renderPagination(picker, config, state);
        internal.updateSortIndicator(picker, state);
    };

})();
