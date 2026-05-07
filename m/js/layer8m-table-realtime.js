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

    Layer8MTable.prototype._handleChangeNotification = function(msg) {
        if (this._notificationsPaused) return;

        if (msg.action === 'update') {
            var record = msg.record;
            if (this.config.transformData) {
                record = this.config.transformData(record);
            }
            var getItemId = this.config.getItemId;
            for (var i = 0; i < this.filteredData.length; i++) {
                var itemId = getItemId ? getItemId(this.filteredData[i]) : this.filteredData[i].id;
                if (String(itemId) === String(msg.primaryKey)) {
                    this.filteredData[i] = record;
                    this._updateCard(i, record);
                    return;
                }
            }
        } else if (msg.action === 'delete' || msg.action === 'add') {
            this._notificationsPaused = true;
            var self = this;
            setTimeout(function() {
                self._notificationsPaused = false;
                self.fetchData(self.currentPage);
            }, 500);
        }
    };

    Layer8MTable.prototype._updateCard = function(index, item) {
        var container = document.getElementById(this.containerId);
        if (!container) return;
        var cards = container.querySelectorAll('.mobile-table-card');
        var existingCard = cards[index];
        if (!existingCard) return;

        var tempDiv = document.createElement('div');
        if (this.config.renderCard) {
            tempDiv.innerHTML = this.config.renderCard(item, index, this);
        } else {
            tempDiv.innerHTML = this._renderDefaultCard(item, index);
        }
        var newCard = tempDiv.firstElementChild;
        if (!newCard) return;

        existingCard.replaceWith(newCard);
        newCard.classList.add('layer8m-card-changed');
        setTimeout(function() {
            newCard.classList.remove('layer8m-card-changed');
        }, 2000);
    };

    Layer8MTable.prototype.destroy = function() {
        if (this._wsUnsubscribe) {
            this._wsUnsubscribe();
            this._wsUnsubscribe = null;
        }
    };

})();
