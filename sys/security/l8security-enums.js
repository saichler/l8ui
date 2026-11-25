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
// Security Module - Enum Definitions
// Action code mappings for role rules

(function() {
    'use strict';

    // Create Security namespace
    window.L8Security = window.L8Security || {};
    L8Security.enums = {};

    // Action code to name mapping
    L8Security.enums.ACTION_NAMES = {
        '-999': 'ALL',
        '1': 'POST',
        '2': 'PUT',
        '3': 'PATCH',
        '4': 'DELETE',
        '5': 'GET'
    };

    // Action name to code mapping
    L8Security.enums.ACTION_CODES = {
        'ALL': '-999',
        'POST': '1',
        'PUT': '2',
        'PATCH': '3',
        'DELETE': '4',
        'GET': '5'
    };

    // L8User AccountStatus enum
    var factory = window.Layer8EnumFactory;
    if (factory) {
        var ACCOUNT_STATUS = factory.create([
            ['Unspecified', null, ''],
            ['Active', 'active', 'layer8d-status-active'],
            ['Inactive', 'inactive', 'layer8d-status-inactive'],
            ['Locked', 'locked', 'layer8d-status-terminated'],
            ['Suspended', 'suspended', 'layer8d-status-warning'],
            ['Pending Activation', 'pending', 'layer8d-status-pending']
        ]);
        L8Security.enums.ACCOUNT_STATUS = ACCOUNT_STATUS.enum;
        L8Security.enums.ACCOUNT_STATUS_CLASSES = ACCOUNT_STATUS.classes;
    }

    // L8ApiKey L8ApiKeyStatus enum
    var API_KEY_STATUS = Layer8EnumFactory.create([
        ['Unspecified', null, ''],
        ['Active', 'active', 'layer8d-status-active'],
        ['Revoked', 'revoked', 'layer8d-status-terminated']
    ]);
    L8Security.enums.API_KEY_STATUS = API_KEY_STATUS.enum;
    L8Security.enums.API_KEY_STATUS_CLASSES = API_KEY_STATUS.classes;
    L8Security.enums.API_KEY_STATUS_ACTIVE = API_KEY_STATUS.values.active;
    L8Security.enums.API_KEY_STATUS_REVOKED = API_KEY_STATUS.values.revoked;

    // Shared renderers (desktop and mobile)
    L8Security.render = L8Security.render || {};

    // apiKeyStatus shows Expired for an ACTIVE key whose expiresAt (Unix seconds) has passed.
    L8Security.render.apiKeyStatus = function(value, item) {
        var status = Number(value);
        var expiresAt = Number(item && item.expiresAt) || 0;
        if (status === L8Security.enums.API_KEY_STATUS_ACTIVE && expiresAt > 0 && expiresAt < Date.now() / 1000) {
            return Layer8DRenderers.createStatusRenderer({ 1: 'Expired' }, { 1: 'layer8d-status-inactive' })(1);
        }
        return Layer8DRenderers.createStatusRenderer(L8Security.enums.API_KEY_STATUS,
            L8Security.enums.API_KEY_STATUS_CLASSES)(status);
    };

})();
