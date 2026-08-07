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
// Layer8M Data Source
// Mobile shared data fetching utility for all view types.
// Handles L8Query construction, fetch, pagination metadata, and error handling.

(function() {
    'use strict';

    class Layer8MDataSource {
        constructor(options) {
            this.endpoint = options.endpoint || null;
            this.modelName = options.modelName || null;
            this.baseWhereClause = options.baseWhereClause || null;
            this.pageSize = options.pageSize || 15;
            this.columns = options.columns || [];
            this.transformData = options.transformData || null;
            this.primaryKey = options.primaryKey || 'id';
            this.realtime = options.realtime || false;

            // State
            this.currentPage = 1;
            this.totalItems = 0;
            this.data = [];
            this.filterColumn = null;
            this.filterValue = '';
            this.sortColumn = null;
            this.sortDirection = 'asc';
            this._wsUnsubscribe = null;
            this._notificationsPaused = false;

            // Callbacks
            this._onDataLoaded = options.onDataLoaded || null;
            this._onError = options.onError || null;
            this._onMetadata = options.onMetadata || null;
            this.onItemChanged = null;
            this.onPageStructureChanged = null;
        }

        /**
         * Build L8Query string
         */
        buildQuery(page, pageSize) {
            const pageIndex = page - 1;
            const whereConditions = [];
            let isInvalid = false;

            if (this.baseWhereClause) {
                whereConditions.push(this.baseWhereClause);
            }

            if (this.filterValue) {
                if (this.filterColumn) {
                    const column = this.columns.find(c => c.key === this.filterColumn);
                    if (column) {
                        const filterKey = column.filterKey || column.key;
                        let queryValue;

                        if (column.enumValues) {
                            const enumValue = Layer8MUtils.matchEnumValue
                                ? Layer8MUtils.matchEnumValue(this.filterValue, column.enumValues)
                                : this._matchEnumValue(this.filterValue, column.enumValues);
                            if (enumValue !== null) {
                                queryValue = enumValue;
                            } else {
                                isInvalid = true;
                            }
                        } else {
                            queryValue = `${this.filterValue}*`;
                        }

                        if (queryValue !== undefined) {
                            whereConditions.push(`${filterKey}=${queryValue}`);
                        }
                    }
                } else {
                    whereConditions.push(`Id=${this.filterValue}*`);
                }
            }

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

            return { query, isInvalid };
        }

        /**
         * Fetch data from server
         */
        async fetchData(page) {
            if (!this.endpoint || !this.modelName) {
                console.error(`Layer8MDataSource: fetchData called without ${!this.endpoint ? 'endpoint' : 'modelName'}. Cannot fetch data.`);
                return null;
            }

            const { query, isInvalid } = this.buildQuery(page, this.pageSize);

            try {
                const body = encodeURIComponent(JSON.stringify({ text: query }));
                const response = await Layer8MAuth.get(this.endpoint + '?body=' + body);

                const totalCount = Layer8QueryBuilder.resolvePageTotal(page === 1, response.metadata, this.totalItems);
                this.totalItems = totalCount;

                let items = response.list || [];
                if (this.transformData) {
                    items = items.map(item => this.transformData(item)).filter(item => item !== null);
                }

                this.currentPage = page;
                this.data = items;
                this._notificationsPaused = false;

                if (this.realtime && typeof Layer8DWebSocket !== 'undefined' && !this._wsUnsubscribe) {
                    this._wsUnsubscribe = Layer8DWebSocket.subscribe(this.modelName, this._handleChangeNotification.bind(this));
                }

                const result = { items, totalCount, metadata: response.metadata, isInvalid };

                if (this._onMetadata && response.metadata) {
                    this._onMetadata(response.metadata);
                }

                if (this._onDataLoaded) {
                    this._onDataLoaded(result);
                }

                return result;
            } catch (error) {
                console.error('Layer8MDataSource fetch error:', error);
                if (error.message && error.message.toLowerCase().includes('access denied') && typeof Layer8MUtils !== 'undefined') {
                    Layer8MUtils.showError('Access Denied — you do not have permission to view this data.');
                }
                if (this._onError) {
                    this._onError(error);
                }
                return null;
            }
        }

        setBaseWhereClause(whereClause) {
            this.baseWhereClause = whereClause;
            this.filterColumn = null;
            this.filterValue = '';
            this.currentPage = 1;
            return this.fetchData(1);
        }

        setFilter(column, value) {
            this.filterColumn = column;
            this.filterValue = value;
        }

        clearFilters() {
            this.filterColumn = null;
            this.filterValue = '';
        }

        setSort(column, direction) {
            this.sortColumn = column;
            this.sortDirection = direction || 'asc';
        }

        getTotalPages() {
            return Math.ceil(this.totalItems / this.pageSize);
        }

        _matchEnumValue(input, enumValues) {
            const normalized = String(input).toLowerCase().trim();
            if (!normalized) return null;
            if (enumValues[normalized] !== undefined) return enumValues[normalized];
            for (const [key, value] of Object.entries(enumValues)) {
                if (key.toLowerCase().startsWith(normalized)) return value;
            }
            return null;
        }

        _handleChangeNotification(msg) {
            if (this._notificationsPaused) return;

            var pk = this.primaryKey;

            if (msg.action === 'update') {
                var record = msg.record;
                if (this.transformData) {
                    record = this.transformData(record);
                }
                var index = -1;
                for (var i = 0; i < this.data.length; i++) {
                    if (String(this.data[i][pk]) === String(msg.primaryKey)) {
                        index = i;
                        break;
                    }
                }
                if (index >= 0) {
                    this.data[index] = record;
                    if (this.onItemChanged) this.onItemChanged(record, index, 'update');
                }
            } else if (msg.action === 'delete' || msg.action === 'add') {
                this._notificationsPaused = true;
                if (this.onPageStructureChanged) {
                    var self = this;
                    this.onPageStructureChanged(msg.action, function() {
                        self._notificationsPaused = false;
                        self.fetchData(self.currentPage);
                    }, function() {
                        // ignore — stay paused until next manual refresh
                    });
                }
            }
        }

        destroy() {
            if (this._wsUnsubscribe) {
                this._wsUnsubscribe();
                this._wsUnsubscribe = null;
            }
        }
    }

    window.Layer8MDataSource = Layer8MDataSource;

})();
