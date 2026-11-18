/*
(c) 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/

// Layer8Markdown — lightweight markdown-to-HTML renderer.
// Supports: paragraphs (lines of a paragraph keep their line breaks), headers,
// bold, italic, bold-italic, strikethrough, inline code, code blocks, links
// (http, https, mailto and relative only), nested ordered/unordered lists,
// blockquotes, horizontal rules and GitHub-style tables (with column
// alignment; wide tables scroll inside their own box).
// All text is HTML-escaped before any markup is added.
// Usage: Layer8Markdown.render(markdownText) => sanitized HTML string
//        Layer8Markdown.renderInto(element, markdownText) => renders into DOM element

(function() {
    'use strict';

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // safeUrl keeps http(s), mailto, relative and in-page links; anything else
    // (javascript:, data:, ...) is dropped.
    function safeUrl(url) {
        var u = url.trim().replace(/&amp;/g, '&');
        if (/^(https?:|mailto:)/i.test(u) || /^[\/#.?]/.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u)) {
            return escapeHtml(u);
        }
        return null;
    }

    // renderInline formats one already-escaped line. Inline code is cut out
    // first so nothing inside it is formatted.
    function renderInline(line) {
        var codes = [];
        line = line.replace(/`([^`]+)`/g, function(m, code) {
            codes.push('<code class="l8md-inline-code">' + code + '</code>');
            return '\u0000' + (codes.length - 1) + '\u0000';
        });
        // Links: [text](url)
        line = line.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(m, text, url) {
            var href = safeUrl(url);
            return href ? '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + text + '</a>' : text;
        });
        // Bold-italic, bold, italic, strikethrough
        line = line.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        line = line.replace(/(?<!\w)__(.+?)__(?!\w)/g, '<strong>$1</strong>');
        line = line.replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g, '<em>$1</em>');
        line = line.replace(/(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)/g, '<em>$1</em>');
        line = line.replace(/~~(.+?)~~/g, '<del class="l8md-del">$1</del>');
        return line.replace(/\u0000(\d+)\u0000/g, function(m, i) { return codes[Number(i)]; });
    }

    function inline(text) {
        return renderInline(escapeHtml(text));
    }

    // ---- tables ----

    function splitRow(line) {
        var t = line.trim();
        if (t.charAt(0) === '|') t = t.substring(1);
        if (t.charAt(t.length - 1) === '|' && t.charAt(t.length - 2) !== '\\') t = t.substring(0, t.length - 1);
        var cells = [], cell = '';
        for (var i = 0; i < t.length; i++) {
            if (t.charAt(i) === '\\' && t.charAt(i + 1) === '|') { cell += '|'; i++; continue; }
            if (t.charAt(i) === '|') { cells.push(cell.trim()); cell = ''; continue; }
            cell += t.charAt(i);
        }
        cells.push(cell.trim());
        return cells;
    }

    function isTableRow(line) {
        return line.indexOf('|') >= 0 && line.trim() !== '';
    }

    function isDelimiterRow(line) {
        if (!isTableRow(line)) return false;
        var cells = splitRow(line);
        return cells.length > 0 && cells.every(function(c) { return /^:?-{1,}:?$/.test(c); });
    }

    function alignOf(cell) {
        var left = cell.charAt(0) === ':', right = cell.charAt(cell.length - 1) === ':';
        if (left && right) return 'center';
        if (right) return 'right';
        if (left) return 'left';
        return '';
    }

    function renderTable(header, aligns, rows) {
        var cell = function(tag, text, i) {
            var a = aligns[i] ? ' class="l8md-align-' + aligns[i] + '"' : '';
            return '<' + tag + a + '>' + inline(text || '') + '</' + tag + '>';
        };
        var html = '<div class="l8md-table-wrap"><table class="l8md-table"><thead><tr>';
        for (var h = 0; h < header.length; h++) html += cell('th', header[h], h);
        html += '</tr></thead><tbody>';
        for (var r = 0; r < rows.length; r++) {
            html += '<tr>';
            for (var c = 0; c < header.length; c++) html += cell('td', rows[r][c], c);
            html += '</tr>';
        }
        return html + '</tbody></table></div>';
    }

    // ---- block parsing ----

    var LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

    function indentOf(spaces) {
        return spaces.replace(/\t/g, '    ').length;
    }

    function render(text) {
        if (!text) return '';

        var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
        var html = [];
        var paragraph = [];
        var lists = []; // open lists, innermost last: { type, indent }

        function flushParagraph() {
            if (!paragraph.length) return;
            html.push('<p class="l8md-p">' + paragraph.map(inline).join('<br>') + '</p>');
            paragraph = [];
        }
        function closeLists(toDepth) {
            while (lists.length > toDepth) {
                html.push('</li></' + lists.pop().type + '>');
            }
        }
        function closeAll() {
            flushParagraph();
            closeLists(0);
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();

            // Code block: ``` ... ```
            if (trimmed.indexOf('```') === 0) {
                closeAll();
                var code = [];
                for (i++; i < lines.length && lines[i].trim().indexOf('```') !== 0; i++) code.push(lines[i]);
                html.push('<pre class="l8md-code-block"><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
                continue;
            }

            // Empty line ends a paragraph; a list ends only if the next line
            // does not continue it.
            if (trimmed === '') {
                flushParagraph();
                var next = i + 1 < lines.length ? lines[i + 1] : '';
                if (lists.length && !LIST_ITEM.test(next) && !/^\s{2,}\S/.test(next)) closeLists(0);
                continue;
            }

            // Table: a header row followed by a delimiter row.
            if (isTableRow(line) && i + 1 < lines.length && isDelimiterRow(lines[i + 1])) {
                closeAll();
                var header = splitRow(line);
                var aligns = splitRow(lines[i + 1]).map(alignOf);
                var rows = [];
                for (i += 2; i < lines.length && isTableRow(lines[i]); i++) rows.push(splitRow(lines[i]));
                i--;
                html.push(renderTable(header, aligns, rows));
                continue;
            }

            // Headers: # .. ######
            var headerMatch = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);
            if (headerMatch) {
                closeAll();
                var level = headerMatch[1].length;
                html.push('<h' + level + ' class="l8md-h' + level + '">' + inline(headerMatch[2]) + '</h' + level + '>');
                continue;
            }

            // Horizontal rule: --- *** ___
            if (/^([-*_])(\s*\1){2,}$/.test(trimmed)) {
                closeAll();
                html.push('<hr class="l8md-hr">');
                continue;
            }

            // Blockquote: consecutive "> " lines, rendered as markdown.
            if (trimmed.charAt(0) === '>') {
                closeAll();
                var quote = [];
                for (; i < lines.length && lines[i].trim().charAt(0) === '>'; i++) {
                    quote.push(lines[i].trim().replace(/^>\s?/, ''));
                }
                i--;
                html.push('<blockquote class="l8md-quote">' + render(quote.join('\n')) + '</blockquote>');
                continue;
            }

            // List item, nested by indentation.
            var item = line.match(LIST_ITEM);
            if (item) {
                flushParagraph();
                var indent = indentOf(item[1]);
                var type = /\d/.test(item[2]) ? 'ol' : 'ul';
                while (lists.length && indent < lists[lists.length - 1].indent) closeLists(lists.length - 1);
                var top = lists[lists.length - 1];
                if (top && indent === top.indent && type === top.type) {
                    html.push('</li><li>');
                } else if (top && indent === top.indent) {
                    closeLists(lists.length - 1);
                    html.push('<' + type + ' class="l8md-list"><li>');
                    lists.push({ type: type, indent: indent });
                } else {
                    html.push('<' + type + ' class="l8md-list"><li>');
                    lists.push({ type: type, indent: indent });
                }
                html.push(inline(item[3]));
                continue;
            }

            // A line indented under a list item continues it.
            if (lists.length && /^\s{2,}/.test(line)) {
                html.push('<br>' + inline(trimmed));
                continue;
            }

            // Paragraph text: lines of one paragraph keep their line breaks.
            closeLists(0);
            paragraph.push(trimmed);
        }

        closeAll();
        return html.join('\n');
    }

    function renderInto(element, text) {
        if (!element) return;
        element.innerHTML = render(text);
    }

    window.Layer8Markdown = {
        render: render,
        renderInto: renderInto
    };
})();
