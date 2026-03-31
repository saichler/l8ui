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
    const col = window.Layer8ColumnFactory;

    var enums = L8Security.enums || {};
    var renderers = window.Layer8DRenderers || {};
    var renderEnum = renderers.renderEnum;
    var createStatusRenderer = renderers.createStatusRenderer;

    var severityRenderer = enums.SEVERITY && createStatusRenderer
        ? createStatusRenderer(enums.SEVERITY, enums.SEVERITY_CLASSES) : null;
    var stateRenderer = enums.EVENT_STATE && createStatusRenderer
        ? createStatusRenderer(enums.EVENT_STATE, enums.EVENT_STATE_CLASSES) : null;

    L8Security.columns.EventRecord = [
        ...col.datetime('occurredAt', 'Occurred At'),
        ...col.custom('category', 'Category', enums.EVENT_CATEGORY && renderEnum
            ? function(item) { return renderEnum(item.category, enums.EVENT_CATEGORY); }
            : undefined),
        ...col.col('eventType', 'Event Type'),
        ...col.custom('severity', 'Severity', severityRenderer
            ? function(item) { return severityRenderer(item.severity); }
            : undefined),
        ...col.custom('state', 'State', stateRenderer
            ? function(item) { return stateRenderer(item.state); }
            : undefined),
        ...col.col('sourceName', 'Source'),
        ...col.col('message', 'Message'),
    ];

})();
