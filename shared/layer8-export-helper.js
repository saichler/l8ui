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
 * Layer8ExportHelper - Shared export event binding for desktop and mobile tables.
 * Attaches click handlers for CSV, Excel, and PDF export buttons within a container.
 *
 * Usage:
 *   Layer8ExportHelper.attachHandlers(container, endpoint, modelName);
 */
(function() {
    'use strict';

    window.Layer8ExportHelper = {
        /**
         * Attach export event handlers for CSV, Excel, and PDF buttons.
         * @param {Element} container - DOM container with export buttons
         * @param {string} endpoint - Service endpoint (e.g., "/erp/30/Employee")
         * @param {string} modelName - Protobuf type name
         */
        attachHandlers: function(container, endpoint, modelName) {
            if (!container || !endpoint || !modelName) return;

            var parsed = (typeof Layer8CsvExport !== 'undefined')
                ? Layer8CsvExport.parseEndpoint(endpoint) : null;
            if (!parsed) return;

            var opts = {
                modelName: modelName,
                serviceName: parsed.serviceName,
                serviceArea: parsed.serviceArea,
                filename: modelName
            };

            // CSV
            container.querySelectorAll('[data-action="export-csv"]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (typeof Layer8CsvExport !== 'undefined') {
                        Layer8CsvExport.export(opts);
                    }
                });
            });

            // Excel
            container.querySelectorAll('[data-action="export-excel"]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (typeof Layer8ExcelExport !== 'undefined') {
                        Layer8ExcelExport.export(opts);
                    }
                });
            });

            // PDF
            container.querySelectorAll('[data-action="export-pdf"]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    if (typeof Layer8PdfExport !== 'undefined') {
                        Layer8PdfExport.export({
                            modelName: opts.modelName,
                            serviceName: opts.serviceName,
                            serviceArea: opts.serviceArea,
                            filename: opts.filename,
                            landscape: true
                        });
                    }
                });
            });
        }
    };
})();
