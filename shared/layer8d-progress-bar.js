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
// Layer8DProgressBar -- generic, project-agnostic live progress bar. Not a
// new mechanism: subscribes via Layer8DWebSocket.subscribe(modelType, cb)
// exactly the way Layer8DTable's realtime option already does, filters by
// primaryKey client-side the same way, and falls back to a re-fetch when a
// notification arrives with no record attached (same fallback
// Layer8DTable._handleChangeNotification already uses). The caller owns
// what "progress" means for its own model -- this component only owns the
// subscribe/render lifecycle.
//
// Usage:
//   Layer8DProgressBar.attach(containerEl, {
//       modelType: 'ScanJob',           // protobuf type name, not ServiceName
//       primaryKey: scanJobId,
//       fetchCurrent: function() { return promise resolving the current record; },
//       getProgress: function(record) { return {percent, label, done}; },
//       onDone: function(record) {}     // optional, called once when getProgress says done
//   });
// Returns { detach: function() {} }.
window.Layer8DProgressBar = (function() {
    'use strict';

    function attach(container, config) {
        if (!container) return { detach: function() {} };

        container.innerHTML =
            '<div class="layer8d-progress-bar"><div class="layer8d-progress-bar-fill"></div></div>' +
            '<div class="layer8d-progress-bar-label"></div>';

        var fillEl = container.querySelector('.layer8d-progress-bar-fill');
        var labelEl = container.querySelector('.layer8d-progress-bar-label');
        var finished = false;
        var wsUnsubscribe = null;

        function render(record) {
            if (finished || !record) return;
            var progress = config.getProgress(record) || {};
            container.hidden = false;
            fillEl.style.width = (progress.percent || 0) + '%';
            labelEl.textContent = progress.label || '';
            if (progress.done) {
                finished = true;
                detach();
                if (typeof config.onDone === 'function') config.onDone(record);
            }
        }

        function refetch() {
            config.fetchCurrent().then(render);
        }

        function detach() {
            if (wsUnsubscribe) {
                wsUnsubscribe();
                wsUnsubscribe = null;
            }
        }

        // Initial render, from the same call that registers this session's
        // live subscription server-side (the caller's fetchCurrent query
        // must include "register" -- see
        // l8utils/plans/generic-websocket-change-notifications.md).
        refetch();

        if (typeof Layer8DWebSocket !== 'undefined') {
            wsUnsubscribe = Layer8DWebSocket.subscribe(config.modelType, function(msg) {
                if (String(msg.primaryKey) !== String(config.primaryKey)) return;
                if (msg.record) {
                    render(msg.record);
                } else {
                    refetch();
                }
            });
        }

        return { detach: detach };
    }

    return { attach: attach };
})();
