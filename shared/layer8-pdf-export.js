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
 * Layer8PdfExport - Shared PDF export utility for desktop and mobile.
 * Fetches CSV data from the CsvExport backend service and converts it to
 * a minimal PDF 1.4 document with a formatted table.
 *
 * Usage:
 *   Layer8PdfExport.export({
 *       modelName: 'Employee',
 *       serviceName: 'Employee',
 *       serviceArea: 30,
 *       filename: 'Employee',
 *       landscape: true  // optional, default false
 *   });
 */
(function() {
    'use strict';

    // PDF page constants (in points, 1 pt = 1/72 inch)
    var PORTRAIT_W = 595.28, PORTRAIT_H = 841.89;  // A4
    var LANDSCAPE_W = 841.89, LANDSCAPE_H = 595.28;
    var MARGIN = 40;
    var FONT_SIZE = 8;
    var HEADER_FONT_SIZE = 9;
    var TITLE_FONT_SIZE = 14;
    var LINE_HEIGHT = 14;
    var HEADER_LINE_HEIGHT = 16;
    var CELL_PAD = 4;

    window.Layer8PdfExport = {
        /**
         * Export table data as PDF via the backend CsvExport service.
         * @param {Object} options
         * @param {string} options.modelName - Protobuf type name
         * @param {string} options.serviceName - Service name
         * @param {number} options.serviceArea - Service area number
         * @param {string} [options.filename] - Base filename (default: modelName)
         * @param {boolean} [options.landscape] - Landscape orientation (default: false)
         */
        export: async function(options) {
            if (!options.modelName || !options.serviceName || options.serviceArea == null) {
                console.error('Layer8PdfExport: modelName, serviceName, and serviceArea are required');
                return;
            }

            var filename = (options.filename || options.modelName) + '.pdf';

            try {
                var csvData = await Layer8PdfExport._fetchCsvData(options);
                if (!csvData) {
                    throw new Error('No CSV data returned');
                }

                var parsed = Layer8PdfExport._parseCsv(csvData);
                if (parsed.headers.length === 0) {
                    throw new Error('No columns found in export data');
                }

                var pdfBytes = Layer8PdfExport._buildPdf(
                    parsed.headers, parsed.rows, options.modelName, !!options.landscape
                );
                Layer8PdfExport._download(pdfBytes, filename);

                console.log('PDF export complete:', parsed.rows.length, 'rows exported to', filename);
            } catch (error) {
                console.error('PDF export error:', error);
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

            var headers = Layer8PdfExport._parseCsvLine(lines[0]);
            var rows = [];
            for (var i = 1; i < lines.length; i++) {
                rows.push(Layer8PdfExport._parseCsvLine(lines[i]));
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

        /** @private Build a minimal PDF 1.4 document with a table. */
        _buildPdf: function(headers, rows, title, landscape) {
            var pageW = landscape ? LANDSCAPE_W : PORTRAIT_W;
            var pageH = landscape ? LANDSCAPE_H : PORTRAIT_H;
            var usableW = pageW - 2 * MARGIN;
            var colCount = headers.length;

            // Calculate column widths proportionally based on header and data content
            var colWidths = Layer8PdfExport._calcColWidths(headers, rows, usableW);

            // Build pages of row indices
            var pages = [];
            var yStart = pageH - MARGIN - TITLE_FONT_SIZE - 20; // after title
            var y = yStart;

            var currentPage = [];
            for (var r = 0; r < rows.length; r++) {
                if (y - LINE_HEIGHT < MARGIN + 20) {
                    pages.push(currentPage);
                    currentPage = [];
                    y = pageH - MARGIN - HEADER_LINE_HEIGHT - 10; // leave room for repeated header
                }
                currentPage.push(r);
                y -= LINE_HEIGHT;
            }
            if (currentPage.length > 0 || pages.length === 0) {
                pages.push(currentPage);
            }

            // Build PDF objects
            var pdf = new PdfWriter();

            // Object 1: Catalog
            pdf.addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

            // Object 2: Pages (placeholder, updated later)
            var pageObjStart = 4; // font is 3, pages start at 4
            var pageRefs = [];
            for (var p = 0; p < pages.length; p++) {
                pageRefs.push((pageObjStart + p * 2) + ' 0 R');
            }
            pdf.addObject('2 0 obj\n<< /Type /Pages /Kids [' + pageRefs.join(' ') + '] /Count ' + pages.length + ' >>\nendobj');

            // Object 3: Font
            pdf.addObject('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

            // Build each page (Page object + Content stream)
            for (var p = 0; p < pages.length; p++) {
                var stream = '';
                var yPos;

                // Title on first page
                if (p === 0) {
                    yPos = pageH - MARGIN - TITLE_FONT_SIZE;
                    stream += 'BT /F1 ' + TITLE_FONT_SIZE + ' Tf ' + MARGIN + ' ' + yPos.toFixed(2) + ' Td (' + Layer8PdfExport._pdfEscape(title) + ') Tj ET\n';
                    yPos -= 20;
                } else {
                    yPos = pageH - MARGIN;
                }

                // Header row
                stream += Layer8PdfExport._drawRow(headers, colWidths, MARGIN, yPos, HEADER_FONT_SIZE, true, pageW);
                yPos -= HEADER_LINE_HEIGHT;

                // Data rows
                var pageRows = pages[p];
                for (var ri = 0; ri < pageRows.length; ri++) {
                    var row = rows[pageRows[ri]];
                    var isAlt = (pageRows[ri] % 2 === 0);
                    stream += Layer8PdfExport._drawRow(row, colWidths, MARGIN, yPos, FONT_SIZE, false, pageW, isAlt);
                    yPos -= LINE_HEIGHT;
                }

                // Footer
                var footerY = MARGIN - 5;
                var dateStr = new Date().toLocaleDateString();
                var pageStr = 'Page ' + (p + 1) + ' of ' + pages.length;
                stream += 'BT /F1 7 Tf ' + MARGIN + ' ' + footerY.toFixed(2) + ' Td (' + Layer8PdfExport._pdfEscape(dateStr) + ') Tj ET\n';
                stream += 'BT /F1 7 Tf ' + (pageW - MARGIN - 50) + ' ' + footerY.toFixed(2) + ' Td (' + pageStr + ') Tj ET\n';

                var contentObjNum = pageObjStart + p * 2 + 1;
                var pageObjNum = pageObjStart + p * 2;

                // Page object
                pdf.addObject(pageObjNum + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
                    pageW.toFixed(2) + ' ' + pageH.toFixed(2) + '] /Contents ' + contentObjNum +
                    ' 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj');

                // Content stream
                pdf.addObject(contentObjNum + ' 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream\nendobj');
            }

            return pdf.build();
        },

        /** @private Draw a table row (header or data). Returns PDF drawing commands. */
        _drawRow: function(cells, colWidths, x, y, fontSize, isHeader, pageW, isAlt) {
            var stream = '';
            var rowH = isHeader ? HEADER_LINE_HEIGHT : LINE_HEIGHT;

            // Background fill
            if (isHeader) {
                stream += '0.267 0.447 0.769 rg\n'; // #4472C4
                stream += x + ' ' + (y - rowH + 2).toFixed(2) + ' ' + (pageW - 2 * MARGIN) + ' ' + rowH + ' re f\n';
            } else if (isAlt) {
                stream += '0.95 0.95 0.95 rg\n';
                stream += x + ' ' + (y - rowH + 2).toFixed(2) + ' ' + (pageW - 2 * MARGIN) + ' ' + rowH + ' re f\n';
            }

            // Cell text
            var cx = x;
            for (var c = 0; c < colWidths.length; c++) {
                var val = (c < cells.length) ? cells[c] : '';
                // Truncate long values to fit column width
                var maxChars = Math.floor(colWidths[c] / (fontSize * 0.5));
                if (val.length > maxChars && maxChars > 3) {
                    val = val.substring(0, maxChars - 2) + '..';
                }

                if (isHeader) {
                    stream += '1 1 1 rg\n'; // white text
                } else {
                    stream += '0.133 0.133 0.133 rg\n'; // dark text
                }
                stream += 'BT /F1 ' + fontSize + ' Tf ' + (cx + CELL_PAD).toFixed(2) + ' ' + (y - fontSize).toFixed(2) + ' Td (' + Layer8PdfExport._pdfEscape(val) + ') Tj ET\n';
                cx += colWidths[c];
            }

            return stream;
        },

        /** @private Calculate proportional column widths. */
        _calcColWidths: function(headers, rows, usableW) {
            var colCount = headers.length;
            var maxLens = [];
            for (var c = 0; c < colCount; c++) {
                maxLens.push(headers[c].length);
            }

            // Sample up to 50 rows
            var sampleSize = Math.min(rows.length, 50);
            for (var r = 0; r < sampleSize; r++) {
                for (var c = 0; c < colCount; c++) {
                    var len = (c < rows[r].length) ? rows[r][c].length : 0;
                    if (len > maxLens[c]) maxLens[c] = len;
                }
            }

            // Cap individual columns
            for (var c = 0; c < colCount; c++) {
                if (maxLens[c] > 40) maxLens[c] = 40;
                if (maxLens[c] < 4) maxLens[c] = 4;
            }

            var totalLen = 0;
            for (var c = 0; c < colCount; c++) totalLen += maxLens[c];

            var widths = [];
            for (var c = 0; c < colCount; c++) {
                widths.push((maxLens[c] / totalLen) * usableW);
            }
            return widths;
        },

        /** @private Escape string for PDF text. */
        _pdfEscape: function(str) {
            if (str == null) return '';
            return String(str)
                .replace(/\\/g, '\\\\')
                .replace(/\(/g, '\\(')
                .replace(/\)/g, '\\)');
        },

        /** @private Trigger a browser file download. */
        _download: function(pdfString, filename) {
            var blob = new Blob([pdfString], { type: 'application/pdf' });
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

    /**
     * Minimal PDF writer that tracks objects and builds the final file
     * with proper cross-reference table.
     */
    function PdfWriter() {
        this.objects = [];
        this.objectData = {};
    }

    PdfWriter.prototype.addObject = function(content) {
        // Extract object number from "N 0 obj"
        var match = content.match(/^(\d+)\s+0\s+obj/);
        if (match) {
            var num = parseInt(match[1]);
            this.objects.push(num);
            this.objectData[num] = content;
        }
    };

    PdfWriter.prototype.build = function() {
        var out = '%PDF-1.4\n';
        var offsets = {};

        // Sort objects by number
        this.objects.sort(function(a, b) { return a - b; });

        for (var i = 0; i < this.objects.length; i++) {
            var num = this.objects[i];
            offsets[num] = out.length;
            out += this.objectData[num] + '\n';
        }

        // Cross-reference table
        var xrefOffset = out.length;
        var maxObj = this.objects[this.objects.length - 1];
        out += 'xref\n0 ' + (maxObj + 1) + '\n';
        out += '0000000000 65535 f \n';
        for (var n = 1; n <= maxObj; n++) {
            if (offsets[n] !== undefined) {
                out += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
            } else {
                out += '0000000000 00000 f \n';
            }
        }

        out += 'trailer\n<< /Size ' + (maxObj + 1) + ' /Root 1 0 R >>\n';
        out += 'startxref\n' + xrefOffset + '\n%%EOF';
        return out;
    };
})();
