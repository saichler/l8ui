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
// Module Factory Core
// Platform-agnostic pure-logic helpers shared by Layer8DModuleFactory (desktop)
// and Layer8MModuleFactory (mobile). Contains no DOM, no fetch, no platform
// coupling — just namespace resolution and required-sub-namespace validation.

(function() {
    'use strict';

    var DEFAULT_REQUIRED_PROPS = ['columns', 'forms', 'primaryKeys', 'enums'];

    // Resolve a top-level module namespace from window[ns].
    // Returns the namespace object, or null if missing. Callers should early-return
    // on null; a console.error is emitted here to match the existing desktop message.
    function resolveNamespace(ns) {
        var moduleNS = window[ns];
        if (!moduleNS) {
            console.error(ns + ' namespace not found. Ensure ' + ns.toLowerCase() + '-config.js is loaded.');
            return null;
        }
        return moduleNS;
    }

    // Validate that every required sub-namespace exists on window and has the
    // expected data properties (columns/forms/primaryKeys/enums by default).
    // Emits console.warn for any missing sub-namespace or property, and deletes
    // subNS._internal on each sub-namespace if present (cleanup of internal state).
    //
    // Does NOT throw — matches the existing desktop behavior where missing
    // sub-modules produce warnings but do not block module initialization.
    function validateNamespaces(ns, requiredNamespaces, requiredProps) {
        if (!requiredNamespaces || !requiredNamespaces.length) {
            return;
        }
        var props = requiredProps || DEFAULT_REQUIRED_PROPS;
        for (var i = 0; i < requiredNamespaces.length; i++) {
            var nsName = requiredNamespaces[i];
            var subNS = window[nsName];
            if (!subNS) {
                console.warn(ns + ' submodule ' + nsName + ' not loaded. Some features may not work.');
                continue;
            }
            for (var j = 0; j < props.length; j++) {
                if (!subNS[props[j]]) {
                    console.warn(ns + ' submodule ' + nsName + '.' + props[j] + ' not found.');
                }
            }
            if (subNS._internal) {
                delete subNS._internal;
            }
        }
    }

    window.Layer8ModuleFactoryCore = {
        resolveNamespace: resolveNamespace,
        validateNamespaces: validateNamespaces
    };

})();
