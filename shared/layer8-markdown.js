/*
(c) 2025 Sharon Aicler (saichler@gmail.com)

Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
*/

// Layer8Markdown — lightweight markdown-to-HTML renderer.
// Supports: bold, italic, inline code, code blocks, headers, lists, links, line breaks.
// Usage: Layer8Markdown.render(markdownText) => sanitized HTML string
//        Layer8Markdown.renderInto(element, markdownText) => renders into DOM element

(function() {
    'use strict';

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderInline(line) {
        // Bold: **text** or __text__
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        line = line.replace(/__(.+?)__/g, '<strong>$1</strong>');
        // Italic: *text* or _text_ (not inside words for _)
        line = line.replace(/\*(.+?)\*/g, '<em>$1</em>');
        line = line.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
        // Inline code: `text`
        line = line.replace(/`([^`]+)`/g, '<code class="l8md-inline-code">$1</code>');
        // Links: [text](url)
        line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        return line;
    }

    function render(text) {
        if (!text) return '';

        var lines = text.split('\n');
        var html = [];
        var inCodeBlock = false;
        var codeBlockLang = '';
        var codeLines = [];
        var inList = false;
        var listType = '';

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            // Code block toggle: ```
            if (line.trim().indexOf('```') === 0) {
                if (!inCodeBlock) {
                    if (inList) { html.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
                    inCodeBlock = true;
                    codeBlockLang = line.trim().substring(3).trim();
                    codeLines = [];
                } else {
                    var codeContent = escapeHtml(codeLines.join('\n'));
                    html.push('<pre class="l8md-code-block"><code>' + codeContent + '</code></pre>');
                    inCodeBlock = false;
                }
                continue;
            }

            if (inCodeBlock) {
                codeLines.push(line);
                continue;
            }

            var trimmed = line.trim();

            // Empty line — close list, add break
            if (trimmed === '') {
                if (inList) { html.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
                html.push('');
                continue;
            }

            // Headers: # ## ### #### ##### ######
            var headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                if (inList) { html.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
                var level = headerMatch[1].length;
                html.push('<h' + level + ' class="l8md-h' + level + '">' + renderInline(escapeHtml(headerMatch[2])) + '</h' + level + '>');
                continue;
            }

            // Unordered list: - item or * item
            var ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
            if (ulMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) html.push(listType === 'ol' ? '</ol>' : '</ul>');
                    html.push('<ul class="l8md-list">');
                    inList = true;
                    listType = 'ul';
                }
                html.push('<li>' + renderInline(escapeHtml(ulMatch[1])) + '</li>');
                continue;
            }

            // Ordered list: 1. item
            var olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
            if (olMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) html.push(listType === 'ol' ? '</ol>' : '</ul>');
                    html.push('<ol class="l8md-list">');
                    inList = true;
                    listType = 'ol';
                }
                html.push('<li>' + renderInline(escapeHtml(olMatch[1])) + '</li>');
                continue;
            }

            // Horizontal rule: --- or ***
            if (/^[-*]{3,}$/.test(trimmed)) {
                if (inList) { html.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
                html.push('<hr class="l8md-hr">');
                continue;
            }

            // Regular paragraph
            if (inList) { html.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
            html.push('<p class="l8md-p">' + renderInline(escapeHtml(trimmed)) + '</p>');
        }

        // Close any open blocks
        if (inCodeBlock) {
            html.push('<pre class="l8md-code-block"><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
        }
        if (inList) {
            html.push(listType === 'ol' ? '</ol>' : '</ul>');
        }

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
