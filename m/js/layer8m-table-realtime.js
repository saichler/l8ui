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
// Layer8M Table — Real-time change notification support
// Extends Layer8MTable with WebSocket-driven card updates.

(function() {
    'use strict';

    if (typeof Layer8MTable === 'undefined') return;

    // Apply a pushed change to the page of cards in place and re-render. In
    // server mode the page lives in config.data (see _getPageData). Only a
    // change that arrives without its record falls back to re-fetching.
    Layer8MTable.prototype._handleChangeNotification = function(msg) {
        var getItemId = this.config.getItemId || function(item) { return item.id; };
        var change = Layer8DWebSocket.applyChange(this.config.data, msg, {
            getId: getItemId,
            transform: this.config.transformData,
            pageSize: this.config.rowsPerPage,
            firstPage: this.currentPage === 1
        });
        if (change.missingRecord) {
            this.fetchData(this.currentPage);
            return;
        }
        if (change.index < 0 && change.totalDelta === 0) return;
        this.config.totalCount = Math.max(0, (this.config.totalCount || 0) + change.totalDelta);
        this.render();
    };

    Layer8MTable.prototype.destroy = function() {
        if (this._wsUnsubscribe) {
            this._wsUnsubscribe();
            this._wsUnsubscribe = null;
        }
    };

})();
