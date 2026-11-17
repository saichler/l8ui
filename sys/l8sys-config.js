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
// SYS Module - Configuration
// Module definitions and service mappings for System Administration

(function() {
    'use strict';

    // Create SYS namespace
    window.L8Sys = window.L8Sys || {};

    // SYS Module Configuration
    L8Sys.modules = {
        'health': {
            label: 'Health',
            icon: '💚',
            services: [],
            customContent: '<div id="health-table-container"></div>'
        },
        'security': {
            label: 'Security',
            icon: '🔒',
            services: [
                { key: 'users', label: 'Users', icon: '👤', endpoint: '/73/users', model: 'L8User' },
                { key: 'roles', label: 'Roles', icon: '🛡️', endpoint: '/74/roles', model: 'L8Role' },
                { key: 'credentials', label: 'Credentials', icon: '🔑', endpoint: '/75/Creds', model: 'L8Credentials' },
                { key: 'events', label: 'Events', icon: '📝', endpoint: '/76/Events', model: 'EventRecord', readOnly: true, defaultSort: { column: 'occurredAt', direction: 'desc' } },
                { key: 'portals', label: 'Portals', icon: '🚪', endpoint: '/77/L8Portal', model: 'L8Portal' }
            ]
        },
        'modules': {
            label: 'Modules',
            icon: '🧩',
            services: [],
            customContent: '<div id="modules-settings-container"></div>'
        },
        'logs': {
            label: 'Logs',
            icon: '📋',
            services: [],
            customContent: '<div id="logs-table-container"></div>'
        },
        'dataimport': {
            label: 'Data Import',
            icon: '📥',
            services: [],
            customContent: '<div id="dataimport-container"></div>'
        },
        'integrations': {
            label: 'Integrations',
            icon: '🔗',
            services: [
                { key: 'IntegCfg', label: 'Integration Configs', icon: '⚙️', endpoint: '/78/IntegCfg', model: 'IntegrationConfig' }
            ]
        }
    };

    // Sub-module namespaces for service registry
    L8Sys.submodules = ['L8Security'];

})();
