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
/**
 * Layer8MAuth - Authentication utilities for ERP mobile app
 * Desktop Equivalent: login-auth.js patterns
 */
(function() {
    'use strict';

    let _onSessionExpired = null;

    function sanitizeServerError(text) {
        if (!text) return 'Unknown error';
        const match = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s+(.+)$/i);
        return match ? match[1] : text;
    }

    window.Layer8MAuth = {
        /**
         * Get bearer token from storage
         */
        getBearerToken() {
            return sessionStorage.getItem('bearerToken') ||
                   localStorage.getItem('bearerToken') ||
                   null;
        },

        /**
         * Set bearer token
         */
        setBearerToken(token, remember = false) {
            sessionStorage.setItem('bearerToken', token);
            if (remember) {
                localStorage.setItem('bearerToken', token);
            }
            window.bearerToken = token;
        },

        /**
         * Get authentication headers
         */
        getAuthHeaders(additionalHeaders = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...additionalHeaders
            };

            const token = this.getBearerToken();
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }

            return headers;
        },

        /**
         * Check if user is authenticated
         */
        isAuthenticated() {
            return !!this.getBearerToken();
        },

        /**
         * Get current username
         */
        getUsername() {
            return sessionStorage.getItem('currentUser') ||
                   localStorage.getItem('rememberedUser') ||
                   'User';
        },

        /**
         * Set current username
         */
        setUsername(username, remember = false) {
            sessionStorage.setItem('currentUser', username);
            if (remember) {
                localStorage.setItem('rememberedUser', username);
            }
        },

        /**
         * Make authenticated API request
         */
        async makeAuthenticatedRequest(url, options = {}) {
            const token = this.getBearerToken();

            if (!token) {
                console.error('Layer8MAuth: No bearer token');
                this._handleSessionExpired();
                return null;
            }

            const headers = this.getAuthHeaders(options.headers);

            try {
                const response = await fetch(url, { ...options, headers });

                if (response.status === 401) {
                    console.warn('Layer8MAuth: Session expired (401)');
                    this._handleSessionExpired(url);
                    return null;
                }

                return response;
            } catch (error) {
                console.error('Layer8MAuth: Request failed:', error);
                throw error;
            }
        },

        /**
         * GET request with authentication
         */
        async get(url) {
            const response = await this.makeAuthenticatedRequest(url, { method: 'GET' });
            if (!response) return null;
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(sanitizeServerError(errorText) || `Request failed: ${response.status}`);
            }
            return response.json();
        },

        /**
         * POST request with authentication
         */
        async post(url, data) {
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (!response) return null;
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(sanitizeServerError(errorText) || `Request failed: ${response.status}`);
            }
            return response.json();
        },

        /**
         * PUT request with authentication
         */
        async put(url, data) {
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            if (!response) return null;
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(sanitizeServerError(errorText) || `Request failed: ${response.status}`);
            }
            return response.json();
        },

        /**
         * PATCH request with authentication
         */
        async patch(url, data) {
            const response = await this.makeAuthenticatedRequest(url, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            if (!response) return null;
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(sanitizeServerError(errorText) || `Request failed: ${response.status}`);
            }
            return response.json();
        },

        /**
         * DELETE request with authentication
         */
        async delete(url, data = null) {
            const options = { method: 'DELETE' };
            if (data) {
                options.body = JSON.stringify(data);
            }
            const response = await this.makeAuthenticatedRequest(url, options);
            if (!response) return null;
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(sanitizeServerError(errorText) || `Request failed: ${response.status}`);
            }
            return response.json();
        },

        /**
         * Login with credentials
         * Desktop Equivalent: login-auth.js handleLogin()
         */
        async login(username, password, remember = false) {
            try {
                const response = await fetch('/authenticate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: username, pass: password })
                });

                if (!response.ok) return { success: false };

                const data = await response.json();

                // TFA required — server returns tokenHash instead of token
                // needTfa/setupTfa are enums: 2 = needs action, 1 = does not need action
                if (data.needTfa === 2 || data.setupTfa === 2) {
                    this._pendingAuth = {
                        username: username,
                        hash: data.tokenHash,
                        remember: remember
                    };
                    this.setUsername(username, remember);
                    return { success: true, needTfa: data.needTfa, setupTfa: data.setupTfa };
                }

                if (data.token) {
                    // Direct login (no TFA) — store bearer token
                    this.setBearerToken(data.token, remember);
                    this.setUsername(username, remember);
                    return { success: true };
                }

                return { success: false };
            } catch (error) {
                console.error('Layer8MAuth: Login failed:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Verify TFA code (for users with TFA already enabled)
         * Desktop Equivalent: login-tfa.js handleTfaVerify()
         */
        async verifyTfa(code) {
            if (!this._pendingAuth) {
                return { success: false, error: 'No pending authentication' };
            }

            try {
                const response = await fetch('/tfaVerify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this._pendingAuth.username,
                        code: code,
                        hash: this._pendingAuth.hash
                    })
                });

                const data = await response.json();

                if (data.ok) {
                    // TFA verify returns the bearer token
                    const remember = this._pendingAuth.remember;
                    this.setBearerToken(data.token, remember);
                    this._pendingAuth = null;
                    return { success: true };
                } else {
                    return { success: false, error: data.error || 'Invalid verification code' };
                }
            } catch (error) {
                console.error('Layer8MAuth: TFA verification failed:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Get TFA setup data (QR code and secret)
         * Desktop Equivalent: login-tfa.js showTfaSetupRequired()
         */
        async getTfaSetup() {
            if (!this._pendingAuth) {
                return { success: false, error: 'No pending authentication' };
            }

            try {
                const response = await fetch('/tfaSetup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this._pendingAuth.username })
                });

                if (!response.ok) {
                    return { success: false, error: 'Failed to fetch TFA setup data' };
                }

                const data = await response.json();

                if (data.error) {
                    return { success: false, error: data.error };
                }

                return {
                    success: true,
                    qrCode: 'data:image/png;base64,' + data.qr,
                    secret: data.secret
                };
            } catch (error) {
                console.error('Layer8MAuth: TFA setup fetch failed:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Verify TFA setup code (to enable TFA)
         * Desktop Equivalent: login-tfa.js handleTfaSetupVerify()
         */
        async verifyTfaSetup(code) {
            if (!this._pendingAuth) {
                return { success: false, error: 'No pending authentication' };
            }

            try {
                const response = await fetch('/tfaSetupVerify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: this._pendingAuth.username,
                        code: code,
                        hash: this._pendingAuth.hash
                    })
                });

                const data = await response.json();

                if (data.ok) {
                    // Clear pending auth - user must login again with TFA
                    this._pendingAuth = null;
                    return { success: true };
                } else {
                    return { success: false, error: data.error || 'Invalid verification code' };
                }
            } catch (error) {
                console.error('Layer8MAuth: TFA setup verification failed:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Clear pending auth state
         */
        clearPendingAuth() {
            this._pendingAuth = null;
        },

        /**
         * Logout and clear session
         */
        logout(redirect = true) {
            sessionStorage.removeItem('bearerToken');
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('bearerToken');
            localStorage.removeItem('rememberedUser');
            window.bearerToken = null;

            if (redirect) {
                window.location.href = '/l8ui/login/';
            }
        },

        /**
         * Set session expired callback
         */
        onSessionExpired(callback) {
            _onSessionExpired = callback;
        },

        /**
         * Handle session expiration
         */
        _handleSessionExpired(endpoint) {
            sessionStorage.removeItem('bearerToken');

            if (_onSessionExpired) {
                _onSessionExpired();
            } else {
                var detail = 'The server returned 401 Unauthorized.';
                if (endpoint) detail += ' Endpoint: ' + endpoint;
                this.showErrorAndLogout('Your session has expired.', detail);
            }
        },

        /**
         * Show error popup before logging out — gives user visibility into what went wrong
         */
        showErrorAndLogout(message, detail) {
            // Clear tokens immediately
            sessionStorage.removeItem('bearerToken');
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('bearerToken');
            localStorage.removeItem('rememberedUser');
            window.bearerToken = null;

            if (typeof Layer8MPopup !== 'undefined') {
                var escaped = typeof Layer8MUtils !== 'undefined' ? Layer8MUtils.escapeHtml : function(t) { return t; };
                Layer8MPopup.show({
                    title: 'Session Error',
                    content: '<div style="padding:16px;">' +
                        '<p style="margin-bottom:12px;font-size:15px;">' + escaped(message) + '</p>' +
                        (detail ? '<pre style="background:var(--layer8d-bg-light,#f5f5f5);padding:12px;border-radius:6px;font-size:12px;max-height:200px;overflow:auto;white-space:pre-wrap;word-break:break-word;">' + escaped(detail) + '</pre>' : '') +
                        '</div>',
                    size: 'medium',
                    showFooter: true,
                    saveButtonText: 'Go to Login',
                    showCancelButton: false,
                    onSave: function() {
                        Layer8MPopup.close();
                        window.location.href = '/l8ui/login/';
                    }
                });
            } else {
                alert(message + (detail ? '\n\n' + detail : ''));
                window.location.href = '/l8ui/login/';
            }
        },

        /**
         * Check auth and redirect if not authenticated
         */
        requireAuth() {
            if (!this.isAuthenticated()) {
                window.location.href = '/l8ui/login/';
                return false;
            }
            return true;
        },

        /**
         * Initialize auth module
         */
        init() {
            const token = this.getBearerToken();
            if (token) {
                window.bearerToken = token;
                localStorage.setItem('bearerToken', token);
            }
        }
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Layer8MAuth.init());
    } else {
        Layer8MAuth.init();
    }

})();
