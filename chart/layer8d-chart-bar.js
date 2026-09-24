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
// Layer8D Chart Bar Renderer
// Renders vertical and horizontal bar charts with optional stacking/grouping.

(function() {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';

    function createEl(tag, attrs) {
        const el = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, v);
        }
        return el;
    }

    window.Layer8DChartBar = {
        render(chart, w, h) {
            const pad = chart.getPadding();
            const data = chart.chartData;
            const horizontal = chart.viewConfig.horizontal === true;

            if (horizontal) {
                this._renderHorizontal(chart, w, h, pad, data);
            } else {
                this._renderVertical(chart, w, h, pad, data);
            }
        },

        _renderVertical(chart, w, h, pad, data) {
            const svg = chart.svgEl;
            const plotW = w - pad.left - pad.right;
            const plotH = h - pad.top - pad.bottom;
            const dom = this._domain(data);
            // Pixels from the bottom of the plot for a value.
            const posOf = (v) => plotH * ((v - dom.min) / dom.span);
            const zeroY = pad.top + plotH - posOf(0);
            const barW = Math.max(8, Math.min(60, (plotW / data.length) * 0.7));
            const gap = (plotW - barW * data.length) / (data.length + 1);

            // Y-axis grid lines
            const ticks = this._getTicks(dom.min, dom.max);
            ticks.forEach(tick => {
                const y = pad.top + plotH - posOf(tick);
                svg.appendChild(createEl('line', {
                    x1: pad.left, y1: y, x2: w - pad.right, y2: y,
                    stroke: Layer8DChart.DEFAULTS.gridColor, 'stroke-dasharray': '3,3'
                }));
                const label = createEl('text', {
                    x: pad.left - 8, y: y + 4, 'text-anchor': 'end',
                    fill: Layer8DChart.DEFAULTS.textColor, 'font-size': Layer8DChart.DEFAULTS.fontSize - 1
                });
                label.textContent = this._formatNumber(tick);
                svg.appendChild(label);
            });

            // X-axis line, drawn at zero rather than at the bottom: with
            // negative values present, zero is no longer the plot floor.
            svg.appendChild(createEl('line', {
                x1: pad.left, y1: zeroY, x2: w - pad.right, y2: zeroY,
                stroke: Layer8DChart.DEFAULTS.gridColor
            }));

            // Bars
            data.forEach((d, i) => {
                const x = pad.left + gap + i * (barW + gap);
                const valueY = pad.top + plotH - posOf(Number(d.value) || 0);
                const y = Math.min(zeroY, valueY);
                const barH = Math.abs(valueY - zeroY);
                const color = chart.getColor(i);

                const rect = createEl('rect', {
                    x: x, y: y, width: barW, height: barH,
                    fill: color, rx: 3, class: 'layer8d-chart-bar'
                });

                rect.addEventListener('mouseenter', (e) => {
                    rect.setAttribute('opacity', '0.8');
                    chart.showTooltip(e.pageX, e.pageY,
                        `<strong>${d.label}</strong><br>${this._formatNumber(d.value)}`);
                });
                rect.addEventListener('mouseleave', () => {
                    rect.setAttribute('opacity', '1');
                    chart.hideTooltip();
                });
                if (chart.onItemClick && d.items) {
                    rect.style.cursor = 'pointer';
                    rect.addEventListener('click', () => chart.onItemClick(d.items[0], d.label));
                }

                svg.appendChild(rect);

                // X-axis label
                const label = createEl('text', {
                    x: x + barW / 2, y: h - pad.bottom + 16, 'text-anchor': 'middle',
                    fill: Layer8DChart.DEFAULTS.textColor, 'font-size': Layer8DChart.DEFAULTS.fontSize - 1
                });
                label.textContent = d.label.length > 10 ? d.label.substring(0, 9) + '...' : d.label;
                svg.appendChild(label);
            });
        },

        _renderHorizontal(chart, w, h, pad, data) {
            const svg = chart.svgEl;
            const plotW = w - pad.left - pad.right;
            const plotH = h - pad.top - pad.bottom;
            const dom = this._domain(data);
            // Pixels from the left edge of the plot for a value.
            const posOf = (v) => plotW * ((v - dom.min) / dom.span);
            const zeroX = pad.left + posOf(0);
            const barH = Math.max(8, Math.min(40, (plotH / data.length) * 0.7));
            const gap = (plotH - barH * data.length) / (data.length + 1);

            // X-axis grid lines
            const ticks = this._getTicks(dom.min, dom.max);
            ticks.forEach(tick => {
                const x = pad.left + posOf(tick);
                svg.appendChild(createEl('line', {
                    x1: x, y1: pad.top, x2: x, y2: h - pad.bottom,
                    stroke: Layer8DChart.DEFAULTS.gridColor, 'stroke-dasharray': '3,3'
                }));
                const label = createEl('text', {
                    x: x, y: h - pad.bottom + 16, 'text-anchor': 'middle',
                    fill: Layer8DChart.DEFAULTS.textColor, 'font-size': Layer8DChart.DEFAULTS.fontSize - 1
                });
                label.textContent = this._formatNumber(tick);
                svg.appendChild(label);
            });

            // Y-axis line at zero, not at the left edge -- see _renderVertical.
            svg.appendChild(createEl('line', {
                x1: zeroX, y1: pad.top, x2: zeroX, y2: h - pad.bottom,
                stroke: Layer8DChart.DEFAULTS.gridColor
            }));

            // Bars
            data.forEach((d, i) => {
                const y = pad.top + gap + i * (barH + gap);
                const valueX = pad.left + posOf(Number(d.value) || 0);
                const bx = Math.min(zeroX, valueX);
                const bw = Math.abs(valueX - zeroX);
                const color = chart.getColor(i);

                const rect = createEl('rect', {
                    x: bx, y: y, width: bw, height: barH,
                    fill: color, rx: 3, class: 'layer8d-chart-bar'
                });

                rect.addEventListener('mouseenter', (e) => {
                    rect.setAttribute('opacity', '0.8');
                    chart.showTooltip(e.pageX, e.pageY,
                        `<strong>${d.label}</strong><br>${this._formatNumber(d.value)}`);
                });
                rect.addEventListener('mouseleave', () => {
                    rect.setAttribute('opacity', '1');
                    chart.hideTooltip();
                });

                svg.appendChild(rect);

                // Y-axis label
                const label = createEl('text', {
                    x: pad.left - 8, y: y + barH / 2 + 4, 'text-anchor': 'end',
                    fill: Layer8DChart.DEFAULTS.textColor, 'font-size': Layer8DChart.DEFAULTS.fontSize - 1
                });
                label.textContent = d.label.length > 12 ? d.label.substring(0, 11) + '...' : d.label;
                svg.appendChild(label);
            });
        },

        /**
         * Value domain for a bar chart, always including zero.
         *
         * The old code took `Math.max(...values, 1)` alone and pinned the
         * baseline to the bottom of the plot, so a negative value produced a
         * negative rect height. SVG rejects that outright ("<rect> attribute
         * height: A negative value is not valid"), the bar never drew, and the
         * console filled with errors -- every variance, delta or profit/loss
         * series silently lost its negative bars.
         */
        _domain(data) {
            const values = data.map(d => Number(d.value) || 0);
            let max = Math.max(...values, 0);
            let min = Math.min(...values, 0);
            if (max === min) max = min + 1;   // all-zero data still needs a span
            return { min: min, max: max, span: max - min };
        },

        _getTicks(min, max) {
            // Backwards compatible: _getTicks(maxVal) means a 0..maxVal domain.
            if (max === undefined) { max = min; min = 0; }
            const count = 5;
            const span = max - min;
            if (span <= 0) return [max];
            const rawStep = span / count;
            const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
            const step = Math.max(mag, Math.ceil(rawStep / mag) * mag);
            const ticks = [];
            for (let t = Math.ceil(min / step) * step; t <= max + step * 0.001; t += step) {
                ticks.push(Math.abs(t) < step * 1e-9 ? 0 : t);
            }
            if (min < 0 && max > 0 && ticks.indexOf(0) === -1) ticks.push(0);
            if (ticks.length === 0) ticks.push(max);
            return ticks;
        },

        _formatNumber(n) {
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
            if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
            return String(Math.round(n * 100) / 100);
        }
    };

})();
