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
// Security Module - EventRecord Column Definitions

(function() {
    'use strict';

    window.L8Security = window.L8Security || {};
    L8Security.columns = L8Security.columns || {};

    var enums = L8Security.enums || {};
    var renderers = window.Layer8DRenderers || {};
    var renderEnum = renderers.renderEnum;
    var renderDateTime = renderers.renderDateTime;
    var createStatusRenderer = renderers.createStatusRenderer;

    var severityRenderer = enums.SEVERITY && createStatusRenderer
        ? createStatusRenderer(enums.SEVERITY, enums.SEVERITY_CLASSES) : null;
    var stateRenderer = enums.EVENT_STATE && createStatusRenderer
        ? createStatusRenderer(enums.EVENT_STATE, enums.EVENT_STATE_CLASSES) : null;

    L8Security.columns.EventRecord = [
        {
            key: 'occurredAt', label: 'Occurred At', sortable: true,
            render: function(item) { return renderDateTime(item.occurredAt); }
        },
        {
            key: 'category', label: 'Category', sortable: true,
            render: enums.EVENT_CATEGORY && renderEnum
                ? function(item) { return renderEnum(item.category, enums.EVENT_CATEGORY); }
                : undefined
        },
        { key: 'eventType', label: 'Event Type', sortable: true, filterable: true },
        {
            key: 'severity', label: 'Severity', sortable: true,
            render: severityRenderer
                ? function(item) { return severityRenderer(item.severity); }
                : undefined
        },
        {
            key: 'state', label: 'State', sortable: true,
            render: stateRenderer
                ? function(item) { return stateRenderer(item.state); }
                : undefined
        },
        { key: 'sourceName', label: 'Source', sortable: true, filterable: true },
        { key: 'message', label: 'Message', sortable: false, filterable: true }
    ];

})();
