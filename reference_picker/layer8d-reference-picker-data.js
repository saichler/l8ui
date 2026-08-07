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
    internal.buildQuery = function(config, state) {
        const whereConditions = [];
        if (config.baseWhereClause) {
            whereConditions.push(config.baseWhereClause);
        }
        if (state.filterValue && state.filterValue.trim()) {
            const filterKey = config.filterColumn || config.displayColumn;
            whereConditions.push(`${filterKey}=${state.filterValue.trim()}*`);
        }

        return Layer8QueryBuilder.assembleQuery({
            modelName: config.modelName,
            selectClause: config.selectColumns.join(','),
            whereConditions,
            pageSize: config.pageSize,
            pageIndex: state.currentPage,
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

        const query = internal.buildQuery(config, state);

        try {
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

            const data = await response.json();

            // Extract total count from metadata — see Layer8QueryBuilder.resolvePageTotal
            // for why this must only be read on the first page.
            const totalCount = Layer8QueryBuilder.resolvePageTotal(state.currentPage === 0, data.metadata, state.totalItems);

            // Get items list
            const items = data.list || [];

            return {
                data: items,
                totalItems: totalCount
            };
        } catch (error) {
            console.error('Error fetching reference data:', error);
            return { data: [], totalItems: 0 };
        }
    };

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
