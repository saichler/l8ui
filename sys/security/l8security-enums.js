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
        L8Security.enums.ACCOUNT_STATUS = factory.createStatus([
            'Unspecified', 'Active', 'Inactive', 'Locked', 'Suspended', 'Pending Activation'
        ], {
            1: 'success',
            2: 'inactive',
            3: 'error',
            4: 'warning',
            5: 'info'
        });
    }

})();
