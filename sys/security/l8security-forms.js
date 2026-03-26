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
// Security Module - Form Definitions & Primary Keys
// Minimal form definitions for details view; CRUD uses custom handlers

(function() {
    'use strict';

    window.L8Security = window.L8Security || {};
    var enums = L8Security.enums || {};

    // Primary keys per model
    L8Security.primaryKeys = {
        L8User: 'userId',
        L8Role: 'roleId',
        L8Credentials: 'id',
        EventRecord: 'eventId'
    };

    // Minimal form definitions (used by details view / service registry)
    L8Security.forms = {
        L8User: {
            title: 'User',
            sections: [{
                title: 'User Info',
                fields: [
                    { key: 'userId', label: 'User ID', type: 'text', required: true },
                    { key: 'fullName', label: 'Full Name', type: 'text', required: true },
                    { key: 'email', label: 'Email', type: 'text' },
                    { key: 'accountStatus', label: 'Account Status', type: 'select', options: L8Security.enums && L8Security.enums.ACCOUNT_STATUS ? L8Security.enums.ACCOUNT_STATUS : {} },
                    { key: 'fa', label: 'First-Factor Auth', type: 'checkbox' },
                    { key: 'mustChangePassword', label: 'Must Change Password', type: 'select', options: { 0: 'Unspecified', 1: 'No', 2: 'Yes' } }
                ]
            }, {
                title: 'Account Activity',
                fields: [
                    { key: 'lastLogin', label: 'Last Login', type: 'date', readOnly: true },
                    { key: 'lastFailedLogin', label: 'Last Failed Login', type: 'date', readOnly: true },
                    { key: 'failedLoginCount', label: 'Failed Login Count', type: 'number', readOnly: true },
                    { key: 'passwordChangedAt', label: 'Password Changed At', type: 'date', readOnly: true },
                    { key: 'lockoutUntil', label: 'Lockout Until', type: 'date', readOnly: true },
                    { key: 'faVerified', label: 'Auth Verified', type: 'select', options: { 0: 'Unspecified', 1: 'Not Verified', 2: 'Verified' }, readOnly: true }
                ]
            }]
        },
        L8Role: {
            title: 'Role',
            sections: [{
                title: 'Role Info',
                fields: [
                    { key: 'roleId', label: 'Role ID', type: 'text', required: true },
                    { key: 'roleName', label: 'Role Name', type: 'text', required: true }
                ]
            }]
        },
        L8Credentials: {
            title: 'Credentials',
            sections: [{
                title: 'Credentials Info',
                fields: [
                    { key: 'id', label: 'ID', type: 'text', required: true },
                    { key: 'name', label: 'Name', type: 'text', required: true }
                ]
            }]
        },
        EventRecord: {
            title: 'Event',
            sections: [{
                title: 'Event Details',
                fields: [
                    { key: 'eventId', label: 'Event ID', type: 'text', readOnly: true },
                    { key: 'category', label: 'Category', type: 'select', options: enums.EVENT_CATEGORY || {}, readOnly: true },
                    { key: 'eventType', label: 'Event Type', type: 'text', readOnly: true },
                    { key: 'severity', label: 'Severity', type: 'select', options: enums.SEVERITY || {}, readOnly: true },
                    { key: 'state', label: 'State', type: 'select', options: enums.EVENT_STATE || {}, readOnly: true }
                ]
            }, {
                title: 'Source',
                fields: [
                    { key: 'sourceId', label: 'Source ID', type: 'text', readOnly: true },
                    { key: 'sourceName', label: 'Source Name', type: 'text', readOnly: true },
                    { key: 'sourceType', label: 'Source Type', type: 'text', readOnly: true }
                ]
            }, {
                title: 'Message',
                fields: [
                    { key: 'message', label: 'Message', type: 'textarea', readOnly: true }
                ]
            }, {
                title: 'Timestamps',
                fields: [
                    { key: 'occurredAt', label: 'Occurred At', type: 'datetime', readOnly: true },
                    { key: 'receivedAt', label: 'Received At', type: 'datetime', readOnly: true },
                    { key: 'processedAt', label: 'Processed At', type: 'datetime', readOnly: true }
                ]
            }]
        }
    };

})();
