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
 * Layer8ExcelExport - Shared Excel export utility for desktop and mobile.
 * Fetches CSV data from the CsvExport backend service and converts it to
 * an HTML-table-based .xls file that Excel, LibreOffice, and Google Sheets
 * can open natively.
 *
 * Usage:
 *   Layer8ExcelExport.export({
 *       modelName: 'Employee',
 *       serviceName: 'Employee',
 *       serviceArea: 30,
 *       filename: 'Employee'
 *   });
 */
(function() {
    'use strict';

    window.Layer8ExcelExport = {
        /**
         * Export table data as Excel via the backend CsvExport service.
         * @param {Object} options
         * @param {string} options.modelName - Protobuf type name
         * @param {string} options.serviceName - Service name
         * @param {number} options.serviceArea - Service area number
         * @param {string} [options.filename] - Base filename (default: modelName)
         */
        export: async function(options) {
            if (!options.modelName || !options.serviceName || options.serviceArea == null) {
                console.error('Layer8ExcelExport: modelName, serviceName, and serviceArea are required');
                return;
            }

            var filename = (options.filename || options.modelName) + '.xls';

            try {
                var csvData = await Layer8ExcelExport._fetchCsvData(options);
                if (!csvData) {
                    throw new Error('No CSV data returned');
                }

                var parsed = Layer8ExcelExport._parseCsv(csvData);
                if (parsed.headers.length === 0) {
                    throw new Error('No columns found in export data');
                }

                var htmlTable = Layer8ExcelExport._buildExcelHtml(parsed.headers, parsed.rows, options.modelName);
                Layer8ExcelExport._download(htmlTable, filename);

                console.log('Excel export complete:', parsed.rows.length, 'rows exported to', filename);
            } catch (error) {
                console.error('Excel export error:', error);
                if (typeof Layer8DPopup !== 'undefined') {
                    Layer8DPopup.alert('Export Failed', 'Unable to export data: ' + error.message);
                } else {
                    alert('Export failed: ' + error.message);
                }
            }
        },

        /** @private Fetch CSV data from the CsvExport backend service. */
        _fetchCsvData: async function(options) {
            var requestBody = {
                modelType: options.modelName,
                serviceName: options.serviceName,
                serviceArea: options.serviceArea
            };

            var headers = typeof getAuthHeaders === 'function'
                ? getAuthHeaders()
                : { 'Content-Type': 'application/json' };
            headers['Content-Type'] = 'application/json';

            var endpoint = Layer8DConfig.resolveEndpoint('/0/CsvExport');
            var response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                var text = await response.text();
                throw new Error(text || 'Export failed');
            }

            var data = await response.json();
            return data.csvData || null;
        },

        /** @private Parse CSV string into headers and rows. */
        _parseCsv: function(csvData) {
            var lines = csvData.split('\n').filter(function(line) { return line.trim() !== ''; });
            if (lines.length === 0) return { headers: [], rows: [] };

            var headers = Layer8ExcelExport._parseCsvLine(lines[0]);
            var rows = [];
            for (var i = 1; i < lines.length; i++) {
                rows.push(Layer8ExcelExport._parseCsvLine(lines[i]));
            }
            return { headers: headers, rows: rows };
        },

        /** @private Parse a single CSV line handling quoted fields. */
        _parseCsvLine: function(line) {
            var fields = [];
            var current = '';
            var inQuotes = false;

            for (var i = 0; i < line.length; i++) {
                var ch = line[i];
                if (inQuotes) {
                    if (ch === '"') {
                        if (i + 1 < line.length && line[i + 1] === '"') {
                            current += '"';
                            i++;
                        } else {
                            inQuotes = false;
                        }
                    } else {
                        current += ch;
                    }
                } else {
                    if (ch === '"') {
                        inQuotes = true;
                    } else if (ch === ',') {
                        fields.push(current);
                        current = '';
                    } else {
                        current += ch;
                    }
                }
            }
            fields.push(current);
            return fields;
        },

        /** @private Build an HTML document that Excel can open as a spreadsheet. */
        _buildExcelHtml: function(headers, rows, title) {
            var html = '<!DOCTYPE html>\n';
            html += '<html xmlns:o="urn:schemas-microsoft-com:office:office" ';
            html += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
            html += 'xmlns="http://www.w3.org/TR/REC-html40">\n';
            html += '<head>\n<meta charset="UTF-8">\n';
            html += '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>';
            html += '<x:ExcelWorksheet><x:Name>' + Layer8ExcelExport._escapeXml(title) + '</x:Name>';
            html += '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>';
            html += '</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->\n';
            html += '<style>\n';
            html += '  table { border-collapse: collapse; width: 100%; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }\n';
            html += '  th { background-color: #4472C4; color: #ffffff; font-weight: bold; padding: 8px 12px; border: 1px solid #2F5496; text-align: left; }\n';
            html += '  td { padding: 6px 12px; border: 1px solid #D0D0D0; vertical-align: top; }\n';
            html += '  tr:nth-child(even) td { background-color: #D9E2F3; }\n';
            html += '  tr:nth-child(odd) td { background-color: #FFFFFF; }\n';
            html += '</style>\n</head>\n<body>\n<table>\n';

            html += '  <thead>\n    <tr>\n';
            for (var h = 0; h < headers.length; h++) {
                html += '      <th>' + Layer8ExcelExport._escapeXml(headers[h]) + '</th>\n';
            }
            html += '    </tr>\n  </thead>\n';

            html += '  <tbody>\n';
            for (var r = 0; r < rows.length; r++) {
                html += '    <tr>\n';
                for (var c = 0; c < headers.length; c++) {
                    var val = (c < rows[r].length) ? rows[r][c] : '';
                    html += '      <td>' + Layer8ExcelExport._escapeXml(val) + '</td>\n';
                }
                html += '    </tr>\n';
            }
            html += '  </tbody>\n</table>\n</body>\n</html>';
            return html;
        },

        /** @private Escape string for XML/HTML content. */
        _escapeXml: function(str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        },

        /** @private Trigger a browser file download. */
        _download: function(htmlContent, filename) {
            var blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };
})();
