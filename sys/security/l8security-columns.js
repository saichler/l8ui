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
// Security Module - Column Definitions
// Table column configurations for L8User, L8Role, L8Credentials

(function() {
    'use strict';

    window.L8Security = window.L8Security || {};
    L8Security.columns = {};
    const col = window.Layer8ColumnFactory;

    var enums = L8Security.enums || {};
    var createStatusRenderer = Layer8DRenderers ? Layer8DRenderers.createStatusRenderer : null;

    var statusRenderer = enums.ACCOUNT_STATUS && createStatusRenderer
        ? createStatusRenderer(enums.ACCOUNT_STATUS, enums.ACCOUNT_STATUS_CLASSES) : null;

    // L8User columns
    L8Security.columns.L8User = [
        ...col.col('userId', 'User ID'),
        ...col.col('fullName', 'Full Name'),
        ...col.col('email', 'Email'),
        ...col.custom('accountStatus', 'Status', statusRenderer
            ? function(item) { return statusRenderer(item.accountStatus); }
            : undefined),
        ...col.custom(null, 'Assigned Roles', function(user) {
            const roleIds = Object.keys(user.roles || {}).filter(function(r) {
                return user.roles[r];
            });
            if (roleIds.length === 0) return '-';
            return roleIds.map(function(r) {
                return '<span class="layer8d-tag">' + Layer8DUtils.escapeHtml(r) + '</span>';
            }).join(' ');
        }, { sortKey: false }),
        ...col.col('portal', 'Portal'),
        ...col.date('lastLogin', 'Last Login'),
    ];

    // L8Role columns
    L8Security.columns.L8Role = [
        ...col.col('roleId', 'Role ID'),
        ...col.col('roleName', 'Role Name'),
        ...col.custom(null, 'Rules Count', function(role) {
            var count = role.rules ? Object.keys(role.rules).length : 0;
            return String(count);
        }, { sortKey: false }),
    ];

    // L8Portal columns
    L8Security.columns.L8Portal = [
        ...col.col('portalId', 'Portal ID'),
        ...col.custom(null, 'Portals', function(item) {
            var portals = item.portals || {};
            var keys = Object.keys(portals);
            if (keys.length === 0) return '-';
            return keys.map(function(k) {
                return '<span class="layer8d-tag">' + Layer8DUtils.escapeHtml(k) + '</span>';
            }).join(' ');
        }, { sortKey: false }),
    ];

    // L8Credentials columns
    L8Security.columns.L8Credentials = [
        ...col.id('id'),
        ...col.col('name', 'Name'),
        ...col.custom(null, 'Items Count', function(cred) {
            var count = cred.creds ? Object.keys(cred.creds).length : 0;
            return String(count);
        }, { sortKey: false }),
    ];

})();
