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
// Layer8D Data Source
// Shared data fetching utility for all view types (table, chart, kanban, etc.)
// Handles L8Query construction, fetch, pagination metadata, and error handling.

(function() {
    'use strict';

    class Layer8DDataSource {
        constructor(options) {
            this.endpoint = options.endpoint || null;
            this.modelName = options.modelName || null;
            this.baseWhereClause = options.baseWhereClause || null;
            this.pageSize = options.pageSize || 10;
            this.columns = options.columns || [];
            this.transformData = options.transformData || null;
            this.primaryKey = options.primaryKey || 'id';
            // Live by default; pass realtime: false to opt out.
            this.realtime = options.realtime !== false;

            // State
            this.currentPage = 1;
            this.totalItems = 0;
            this.data = [];
            this.filters = {};
            this.sortColumn = null;
            this.sortDirection = 'asc';
            this._wsUnsubscribe = null;

            // Callbacks
            this._onDataLoaded = options.onDataLoaded || null;
            this._onError = options.onError || null;
            this._onMetadata = options.onMetadata || null;
        }

        /**
         * Build L8Query string with filter and sort conditions
         * @param {number} page - 1-based page number
         * @param {number} pageSize - items per page
         * @returns {{ query: string, invalidFilters: string[] }}
         */
        buildQuery(page, pageSize) {
            const pageIndex = page - 1;
            const { conditions, invalidFilters } = Layer8QueryBuilder.buildColumnFilterConditions(
                this.filters, this.columns, Layer8DUtils.matchEnumValue
            );
            const whereConditions = this.baseWhereClause ? [this.baseWhereClause, ...conditions] : conditions;

            let sortClause = '', sortDescending = false;
            if (this.sortColumn) {
                const column = this.columns.find(c => c.key === this.sortColumn);
                sortClause = column?.sortKey || column?.filterKey || this.sortColumn;
                sortDescending = this.sortDirection === 'desc';
            }

            const query = Layer8QueryBuilder.assembleQuery({
                modelName: this.modelName,
                selectClause: '*',
                whereConditions,
                pageSize,
                pageIndex,
                sortClause,
                sortDescending,
                realtime: this.realtime
            });

            return { query, invalidFilters };
        }

        /**
         * Fetch data from server
         * @param {number} page - 1-based page number
         * @returns {Promise<{items: Array, totalCount: number, metadata: Object, invalidFilters: string[]}>}
         */
        async fetchData(page) {
            if (!this.endpoint || !this.modelName) {
                console.error('DataSource requires endpoint and modelName');
                return null;
            }

            const pageSize = this.pageSize;
            const { query, invalidFilters } = this.buildQuery(page, pageSize);

            try {
                const body = encodeURIComponent(JSON.stringify({ text: query }));
                const response = await fetch(this.endpoint + '?body=' + body, {
                    method: 'GET',
                    headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '');
                    if (errorText && errorText.toLowerCase().includes('access denied')) {
                        const err = new Error('Access Denied — you do not have permission to view this data.');
                        err.accessDenied = true;
                        throw err;
                    }
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();

                const totalCount = Layer8QueryBuilder.resolvePageTotal(page === 1, data.metadata, this.totalItems);
                this.totalItems = totalCount;

                let items = data.list || [];
                if (this.transformData) {
                    items = items.map(item => this.transformData(item));
                }

                this.currentPage = page;
                this.data = items;

                if (this.realtime && typeof Layer8DWebSocket !== 'undefined' && !this._wsUnsubscribe) {
                    this._wsUnsubscribe = Layer8DWebSocket.subscribe(this.modelName, this._handleChangeNotification.bind(this));
                }

                const result = { items, totalCount, metadata: data.metadata, invalidFilters };

                if (this._onMetadata && data.metadata) {
                    this._onMetadata(data.metadata);
                }

                if (this._onDataLoaded) {
                    this._onDataLoaded(result);
                }

                return result;
            } catch (error) {
                console.error('DataSource fetch error:', error);
                if (error.accessDenied && typeof Layer8DNotification !== 'undefined') {
                    Layer8DNotification.error('Access Denied', ['You do not have permission to view this data.']);
                }
                if (this._onError) {
                    this._onError(error);
                }
                return null;
            }
        }

        /**
         * Update base where clause and re-fetch from page 1
         */
        setBaseWhereClause(whereClause) {
            this.baseWhereClause = whereClause;
            this.filters = {};
            this.currentPage = 1;
            return this.fetchData(1);
        }

        /**
         * Set a filter value for a column
         */
        setFilter(columnKey, value) {
            this.filters[columnKey] = value;
        }

        /**
         * Clear all filters
         */
        clearFilters() {
            this.filters = {};
        }

        /**
         * Set sort column and direction
         */
        setSort(column, direction) {
            this.sortColumn = column;
            this.sortDirection = direction || 'asc';
        }

        /**
         * Get total pages based on current totalItems
         */
        getTotalPages() {
            return Math.ceil(this.totalItems / this.pageSize);
        }

        /**
         * Handle incoming WebSocket change notification
         */
        _handleChangeNotification(msg) {
            // Apply the change to the loaded items in place and hand the view
            // its updated items through the same callback a fetch uses, so
            // every view re-renders live without a re-fetch. Only a change that
            // arrives without its record falls back to re-fetching.
            var pk = this.primaryKey;
            var change = Layer8DWebSocket.applyChange(this.data, msg, {
                getId: function(item) { return item[pk]; },
                transform: this.transformData,
                pageSize: this.pageSize,
                firstPage: this.currentPage === 1
            });
            if (change.missingRecord) {
                this.fetchData(this.currentPage);
                return;
            }
            if (change.index < 0 && change.totalDelta === 0) return;
            this.totalItems = Math.max(0, this.totalItems + change.totalDelta);
            if (this._onDataLoaded) {
                this._onDataLoaded({
                    items: this.data, totalCount: this.totalItems, metadata: null, invalidFilters: []
                });
            }
        }

        /**
         * Unsubscribe from WebSocket and clean up
         */
        destroy() {
            if (this._wsUnsubscribe) {
                this._wsUnsubscribe();
                this._wsUnsubscribe = null;
            }
        }
    }

    window.Layer8DDataSource = Layer8DDataSource;

})();
