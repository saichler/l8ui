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
// Layer8 Reference Config Resolver — shared parsing/validation of a reference
// input's `data-ref-config` attribute, plus reference-registry displayFormat/
// selectColumns overrides. Used identically by desktop
// (shared/layer8d-forms-pickers.js attachReferencePickers) and mobile
// (m/js/layer8m-forms.js initReferencePickers).
//
// Scope note: endpoint resolution (getEndpointForModel) is intentionally NOT
// included here — mobile's version checks an extra LAYER8M_NAV_CONFIG source
// desktop doesn't have, so it isn't pure duplication. Desktop's additional
// form-context (`fieldDef.referenceConfig`) override step, which mobile has
// no equivalent of, also stays out of this module — callers apply it (or
// don't) after calling resolve().

(function() {
    'use strict';

    /**
     * @param {HTMLInputElement} input - the reference-input element
     * @param {Object|null} registry - the reference registry to consult for
     *   displayFormat/selectColumns overrides. Either a plain lookup object
     *   (desktop's Layer8DReferenceRegistry, indexed as registry[modelName])
     *   or an object exposing get(modelName) (mobile's Layer8MReferenceRegistry).
     * @returns {Object|null} the resolved config, or null if invalid/missing
     *   required fields (a console.warn matching prior behavior is already
     *   logged in that case — caller should just bail).
     */
    function resolve(input, registry) {
        let config = {};
        try {
            config = JSON.parse(input.dataset.refConfig || '{}');
        } catch (e) {
            console.warn('Invalid reference config for', input.name);
            return null;
        }

        if (!config.modelName || !config.idColumn || !config.displayColumn) {
            console.warn('Reference input missing required config:', input.name);
            return null;
        }

        const lookupModel = input.dataset.lookupModel || config.modelName;
        if (lookupModel && registry) {
            const registryConfig = typeof registry.get === 'function' ? registry.get(lookupModel) : registry[lookupModel];
            if (registryConfig) {
                if (registryConfig.displayFormat && !config.displayFormat) {
                    config.displayFormat = registryConfig.displayFormat;
                }
                if (registryConfig.selectColumns && !config.selectColumns) {
                    config.selectColumns = registryConfig.selectColumns;
                }
            }
        }

        return config;
    }

    window.Layer8ReferenceConfigResolver = { resolve };

})();
