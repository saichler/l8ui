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
// Security Module - Event Enum Definitions
// EventCategory, EventState, Severity mappings for EventRecord

(function() {
    'use strict';

    window.L8Security = window.L8Security || {};
    L8Security.enums = L8Security.enums || {};

    var factory = window.Layer8EnumFactory;
    if (!factory) return;

    // EventCategory enum (from l8events.proto)
    var EVENT_CATEGORY = factory.simple([
        'Unspecified', 'Audit', 'System', 'Monitoring', 'Security',
        'Integration', 'Custom', 'Network', 'Kubernetes', 'Performance',
        'Syslog', 'Trap', 'Compute', 'Storage', 'Power', 'GPU',
        'Topology', 'Automation'
    ]);
    L8Security.enums.EVENT_CATEGORY = EVENT_CATEGORY.enum;

    // EventState enum
    var EVENT_STATE = factory.create([
        ['Unspecified', null, ''],
        ['New', 'new', 'layer8d-status-pending'],
        ['Processed', 'processed', 'layer8d-status-active'],
        ['Discarded', 'discarded', 'layer8d-status-inactive'],
        ['Archived', 'archived', 'layer8d-status-terminated']
    ]);
    L8Security.enums.EVENT_STATE = EVENT_STATE.enum;
    L8Security.enums.EVENT_STATE_CLASSES = EVENT_STATE.classes;

    // Severity enum
    var SEVERITY = factory.create([
        ['Unspecified', null, ''],
        ['Info', 'info', 'layer8d-status-info'],
        ['Warning', 'warning', 'layer8d-status-pending'],
        ['Minor', 'minor', 'layer8d-status-inactive'],
        ['Major', 'major', 'layer8d-status-terminated'],
        ['Critical', 'critical', 'layer8d-status-terminated']
    ]);
    L8Security.enums.SEVERITY = SEVERITY.enum;
    L8Security.enums.SEVERITY_CLASSES = SEVERITY.classes;

})();
