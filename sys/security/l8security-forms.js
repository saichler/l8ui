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
        EventRecord: 'eventId',
        L8Portal: 'portalId',
        IntegrationConfig: 'integrationId',
        L8ApiKey: 'keyId'
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
                    { key: 'portal', label: 'Portal', type: 'text' },
                    { key: 'associateIds', label: 'Associate IDs', type: 'textarea' },
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
        L8ApiKey: {
            title: 'API Key',
            sections: [{
                title: 'API Key',
                fields: [
                    { key: 'name', label: 'Name', type: 'text', required: true },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    { key: 'keyId', label: 'Key ID', type: 'text', readOnly: true },
                    { key: 'userId', label: 'User ID', type: 'text', readOnly: true },
                    { key: 'status', label: 'Status', type: 'select', options: enums.API_KEY_STATUS || {}, readOnly: true }
                ]
            }, {
                title: 'Activity',
                fields: [
                    { key: 'createdAt', label: 'Created', type: 'date', readOnly: true },
                    { key: 'expiresAt', label: 'Expires', type: 'date', readOnly: true },
                    { key: 'lastUsedAt', label: 'Last Used', type: 'date', readOnly: true },
                    { key: 'revokedAt', label: 'Revoked', type: 'date', readOnly: true },
                    { key: 'revokedBy', label: 'Revoked By', type: 'text', readOnly: true }
                ]
            }]
        },
        L8Portal: {
            title: 'Portal',
            sections: [{
                title: 'Portal Info',
                fields: [
                    { key: 'portalId', label: 'Portal ID', type: 'text', required: true }
                ]
            }]
        },
        IntegrationConfig: {
            title: 'Integration Config',
            sections: [{
                title: 'Identity',
                fields: [
                    { key: 'name', label: 'Name (e.g. "smtp")', type: 'text', required: true },
                    { key: 'type', label: 'Type', type: 'select', options: { 0: 'Unspecified', 1: 'SMTP', 2: 'Webhook', 3: 'Slack', 4: 'PagerDuty', 5: 'Custom' } }
                ]
            }, {
                title: 'SMTP Settings',
                fields: [
                    { key: 'host', label: 'SMTP Host', type: 'text' },
                    { key: 'port', label: 'SMTP Port', type: 'number' },
                    { key: 'useTls', label: 'Use STARTTLS', type: 'checkbox' },
                    { key: 'fromAddress', label: 'From Email Address', type: 'text' },
                    { key: 'fromName', label: 'From Display Name', type: 'text' }
                ]
            }, {
                title: 'Credentials',
                fields: [
                    { key: 'attributes.username', label: 'SMTP Username', type: 'text' },
                    { key: 'attributes.password', label: 'SMTP Password', type: 'text' },
                    { key: 'credentialKey', label: 'Credential Key (security store)', type: 'text' }
                ]
            }, {
                title: 'Webhook / Advanced',
                fields: [
                    { key: 'url', label: 'URL', type: 'text' },
                    { key: 'retryCount', label: 'Retry Count', type: 'number' },
                    { key: 'timeoutMs', label: 'Timeout (ms)', type: 'number' }
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
