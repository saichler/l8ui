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

    // Apply a pushed change to the page of cards (see
    // Layer8DWebSocket.applyChange). In server mode the page lives in
    // config.data (see _getPageData). An update of a card on the page is
    // applied in place and re-rendered; an add or an on-page delete re-fetches
    // the page; a change to a card not on the page is ignored.
    Layer8MTable.prototype._handleChangeNotification = function(msg) {
        var getItemId = this.config.getItemId || function(item) { return item.id; };
        var change = Layer8DWebSocket.applyChange(this.config.data, msg, {
            getId: getItemId,
            transform: this.config.transformData
        });
        if (change.refetch) {
            this._refetchLive();
            return;
        }
        if (change.index < 0) return;
        this.render();
    };

    // Re-fetch the current page for a pushed change or a reconnect: it
    // registers again without becoming the newest live component (see
    // Layer8DWebSocket.registerQuery). _queryBody runs synchronously at the
    // start of fetchData, so it reads the flag.
    Layer8MTable.prototype._refetchLive = function() {
        this._liveRefetch = true;
        this.fetchData(this.currentPage);
    };

    Layer8MTable.prototype._isLive = function() {
        return this.config.realtime && typeof Layer8DWebSocket !== 'undefined';
    };

    // The body of a fetch: a live table registers its query (one of the
    // Layer8DWebSocket live slots) on every fetch.
    Layer8MTable.prototype._queryBody = function(query) {
        if (!this._isLive()) return { text: query };
        var self = this;
        var keepPosition = this._liveRefetch === true;
        this._liveRefetch = false;
        return Layer8DWebSocket.registerQuery(this._registerId, this, this.config.endpoint, query, {
            onDetach: function() { self._wsUnsubscribe = null; },
            onReconnect: function() { self._refetchLive(); },
            keepPosition: keepPosition
        });
    };

    Layer8MTable.prototype.destroy = function() {
        if (this._isLive()) Layer8DWebSocket.release(this._registerId, this);
        this._wsUnsubscribe = null;
    };

})();
