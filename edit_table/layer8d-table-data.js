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
// Layer 8 Ecosystem - Layer8DTable Data Management
// Methods for data handling, fetching, and server communication

// Debounce utility for server-side filtering
Layer8DTable.prototype.debounce = function(func, wait) {
    return Layer8DUtils.debounce(func, wait);
};

// Build L8Query with filter and sort conditions.
// Filter/sort resolution and final query assembly are shared with
// Layer8DDataSource via shared/layer8-query-builder.js — this is one of the
// two places (Layer8DDataSource is the other) that use the per-column
// filters-map mode; Layer8DTable always selects '*'.
Layer8DTable.prototype.buildQuery = function(page, pageSize) {
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
        sortDescending
    });

    return { query, invalidFilters };
};

Layer8DTable.prototype._isLive = function() {
    return this.realtime && typeof Layer8DWebSocket !== 'undefined';
};

// The body of a fetch: a live table registers its query (one of the
// Layer8DWebSocket live slots) on every fetch, so the server always matches
// the page and filter the table currently shows.
Layer8DTable.prototype._queryBody = function(query) {
    if (!this._isLive()) return { text: query };
    var self = this;
    return Layer8DWebSocket.registerQuery(this._registerId, this, this.endpoint, query, {
        onDetach: function() { self._wsUnsubscribe = null; },
        onReconnect: function() { self.fetchData(self.currentPage, self.pageSize); }
    });
};

// Fetch data from server
Layer8DTable.prototype.fetchData = async function(page, pageSize) {
    if (!this.endpoint || !this.modelName) {
        console.error('Table requires endpoint and modelName for server-side mode');
        return;
    }

    const { query, invalidFilters } = this.buildQuery(page, pageSize);

    try {
        const body = encodeURIComponent(JSON.stringify(this._queryBody(query)));
        const response = await fetch(this.endpoint + '?body=' + body, {
            method: 'GET',
            headers: typeof getAuthHeaders === 'function' ? getAuthHeaders() : { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            let errorMsg = 'Failed to fetch data';
            try {
                const errorText = await response.text();
                if (errorText && errorText.toLowerCase().includes('access denied')) {
                    errorMsg = 'Access denied';
                } else if (errorText) {
                    errorMsg = errorText;
                }
            } catch (_) { /* ignore parse errors */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        // Extract total count from metadata — see Layer8QueryBuilder.resolvePageTotal
        // for why this must only be read on page 1.
        const totalCount = Layer8QueryBuilder.resolvePageTotal(page === 1, data.metadata, this.totalItems);
        this.totalItems = totalCount;

        // Transform data if transformer provided
        let items = data.list || [];
        if (this.transformData) {
            items = items.map(item => this.transformData(item));
        }

        // Update table
        this.setServerData(items, totalCount);
        this.setInvalidFilters(invalidFilters);

        // Listen for pushed changes while this table is live
        if (this._isLive() && !this._wsUnsubscribe) {
            this._wsUnsubscribe = Layer8DWebSocket.listen(this._registerId, this, this.modelName,
                this._handleChangeNotification.bind(this));
        }

        // Call optional callback for additional processing
        if (this.onDataLoaded) {
            this.onDataLoaded(data, items, totalCount);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        this.showError(error.message || 'Failed to load data');
    }
};

// Update base where clause and re-fetch
Layer8DTable.prototype.setBaseWhereClause = function(whereClause) {
    this.baseWhereClause = whereClause;
    this.filters = {};  // Clear filters when base clause changes
    this.currentPage = 1;
    this.fetchData(this.currentPage, this.pageSize);
};

// Show error message in table container
Layer8DTable.prototype.showError = function(message) {
    if (this.container) {
        this.container.innerHTML = `<div style="padding: 20px; color: #718096; text-align: center;">${message}</div>`;
    }
};

// Set data and re-render (for client-side pagination)
Layer8DTable.prototype.setData = function(data) {
    this.data = Array.isArray(data) ? data : Object.values(data);
    this.filteredData = [...this.data];
    if (!this.serverSide) {
        this.currentPage = 1;
    }
    this.render();
};

// Set data with server-side pagination metadata
// NOTE: totalItems should only reflect page-1 metadata. If the caller passes 0
// (e.g., from page 2+ response), preserve the previously cached value.
Layer8DTable.prototype.setServerData = function(data, totalItems) {
    this.data = Array.isArray(data) ? data : Object.values(data);
    if (totalItems > 0) {
        this.totalItems = totalItems;
    }
    this.render();
};

// Get paginated data
Layer8DTable.prototype.getPaginatedData = function() {
    if (this.serverSide) {
        // Server-side: data is already paginated
        return this.data;
    }
    // Client-side: use filteredData if filtering is enabled
    const dataSource = this.filterable ? this.filteredData : this.data;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return dataSource.slice(start, end);
};

// Get total items count
Layer8DTable.prototype.getTotalItems = function() {
    if (this.serverSide) return this.totalItems;
    return this.filterable ? this.filteredData.length : this.data.length;
};

// Get total pages
Layer8DTable.prototype.getTotalPages = function() {
    const total = this.getTotalItems();
    return Math.ceil(total / this.pageSize);
};

// Get item ID from primary key
Layer8DTable.prototype.getItemId = function(item) {
    if (this.primaryKey && item[this.primaryKey] !== undefined) {
        return item[this.primaryKey];
    }
    if (item.id !== undefined) return item.id;
    console.error('Layer8DTable: No primaryKey configured for model "' +
        (this.modelName || 'unknown') + '" and item has no "id" field. ' +
        'Set primaryKey in table config.');
    return undefined;
};

// Get nested value from object (e.g., 'user.name')
Layer8DTable.prototype.getNestedValue = function(obj, key) {
    if (!key) return '';
    const keys = key.split('.');
    let value = obj;
    for (const k of keys) {
        if (value === null || value === undefined) return '';
        value = value[k];
    }
    return value !== null && value !== undefined ? value : '';
};

// Handle incoming WebSocket change notification: apply it to the page in
// place from the pushed record. Only a change that arrives without its record
// (the server could not reconstruct it) falls back to re-fetching the page.
Layer8DTable.prototype._handleChangeNotification = function(msg) {
    var self = this;
    var change = Layer8DWebSocket.applyChange(this.data, msg, {
        getId: function(item) { return self.getItemId(item); },
        transform: this.transformData,
        pageSize: this.pageSize,
        firstPage: this.currentPage === 1
    });
    if (change.missingRecord) {
        this.fetchData(this.currentPage, this.pageSize);
        return;
    }
    if (change.totalDelta !== 0) {
        this.totalItems = Math.max(0, (this.totalItems || 0) + change.totalDelta);
        this.render();
    } else if (change.index >= 0) {
        this.updateRow(change.index, this.data[change.index]);
    }
};

// Stop listening for pushed changes and clean up
Layer8DTable.prototype.destroy = function() {
    if (this._isLive()) Layer8DWebSocket.release(this._registerId, this);
    this._wsUnsubscribe = null;
};
