/*
 * © 2026 Sharon Aicler (saichler@gmail.com)
 *
 * Layer 8 Ecosystem is licensed under the Apache License, Version 2.0.
 * You may obtain a copy of the License at:
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Layer8DExplorerRender — DOM rendering helpers for Layer8DExplorer.
//
// Split out from layer8d-explorer.js to keep that file under the 500-line
// maintainability guideline. Each helper takes the explorer instance as
// its first argument and reads/writes its state directly. Not part of the
// public API — consumers use Layer8DExplorer.
//
// Must load before layer8d-explorer.js (which calls into this).
(function() {
    'use strict';

    function buildVirtualGroups(exp) {
        var out = [];
        if (exp.favorites.length > 0) {
            out.push({
                key: '__favorites',
                label: 'Favorites',
                icon: '★',
                _virtual: 'favorites',
                items: exp.favorites.map(function(f) {
                    // Each favorite resolves to its real (group, item) pair
                    // so click behavior mirrors navigating directly.
                    return {
                        key: f.key,
                        label: f.label || f.key,
                        icon: f.icon || '',
                        _resolvesTo: { group: f.group || '', item: f.key },
                        _favoritePayload: f
                    };
                })
            });
        }
        if (exp.recents.length > 0) {
            out.push({
                key: '__recents',
                label: 'Recent',
                icon: '⏲',
                _virtual: 'recents',
                items: exp.recents.map(function(r) {
                    return {
                        key: r.key,
                        label: r.label || r.key,
                        icon: r.icon || '',
                        _resolvesTo: r.kind === 'object'
                            ? { object: true, payload: r }
                            : { group: r.group || '', item: r.key }
                    };
                })
            });
        }
        return out;
    }

    function renderGroup(exp, group) {
        var hasItems = group.items && group.items.length > 0;
        var isCollapsed = hasItems && exp.collapsed[group.key] === true;
        var isVirtual = !!group._virtual;

        var wrap = document.createElement('div');
        wrap.className = 'layer8d-explorer-group';
        if (isVirtual) wrap.classList.add('layer8d-explorer-group-virtual');
        wrap.setAttribute('data-group', group.key);
        if (isVirtual) wrap.setAttribute('data-virtual', group._virtual);
        if (isCollapsed) wrap.classList.add('collapsed');

        var header = document.createElement('button');
        header.type = 'button';
        header.className = 'layer8d-explorer-group-header';
        header.setAttribute('data-group', group.key);
        header.setAttribute('data-leaf', hasItems ? 'false' : 'true');
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'treeitem');
        if (hasItems) header.setAttribute('aria-expanded', String(!isCollapsed));

        var chevron = document.createElement('span');
        chevron.className = 'layer8d-explorer-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.textContent = hasItems ? '▾' : '';
        header.appendChild(chevron);

        if (group.icon) {
            var icon = document.createElement('span');
            icon.className = 'layer8d-explorer-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = group.icon;
            header.appendChild(icon);
        }

        var label = document.createElement('span');
        label.className = 'layer8d-explorer-label';
        label.textContent = group.label;
        header.appendChild(label);

        var countBadge = document.createElement('span');
        countBadge.className = 'layer8d-explorer-count';
        countBadge.setAttribute('data-count-for', group.key);
        countBadge.style.display = 'none';
        header.appendChild(countBadge);

        var statusDot = document.createElement('span');
        statusDot.className = 'layer8d-explorer-status';
        statusDot.setAttribute('data-status-for', group.key);
        statusDot.style.display = 'none';
        header.appendChild(statusDot);

        wrap.appendChild(header);

        if (hasItems) {
            var list = document.createElement('ul');
            list.className = 'layer8d-explorer-items';
            list.setAttribute('role', 'group');
            for (var i = 0; i < group.items.length; i++) {
                list.appendChild(renderItem(exp, group, group.items[i]));
            }
            wrap.appendChild(list);
        }
        return wrap;
    }

    function renderItem(exp, group, item) {
        var isVirtualFavs = group._virtual === 'favorites';
        var isVirtualRecents = group._virtual === 'recents';
        var isVirtual = isVirtualFavs || isVirtualRecents;

        var li = document.createElement('li');
        li.className = 'layer8d-explorer-item';
        li.setAttribute('data-group', group.key);
        li.setAttribute('data-item', item.key);
        if (item._resolvesTo) {
            li.setAttribute('data-resolves-to', JSON.stringify(item._resolvesTo));
        }
        li.setAttribute('role', 'treeitem');
        li.setAttribute('tabindex', '0');

        if (item.icon) {
            var icon = document.createElement('span');
            icon.className = 'layer8d-explorer-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = item.icon;
            li.appendChild(icon);
        }

        var label = document.createElement('span');
        label.className = 'layer8d-explorer-item-label';
        label.textContent = item.label;
        li.appendChild(label);

        if (!isVirtual) {
            // Count badge + status dot only on real (non-virtual) items;
            // showing them on Favorites/Recents would double-decorate.
            var countBadge = document.createElement('span');
            countBadge.className = 'layer8d-explorer-count';
            countBadge.setAttribute('data-count-for', item.key);
            countBadge.style.display = 'none';
            li.appendChild(countBadge);

            var statusDot = document.createElement('span');
            statusDot.className = 'layer8d-explorer-status';
            statusDot.setAttribute('data-status-for', item.key);
            statusDot.style.display = 'none';
            li.appendChild(statusDot);
        }

        // Favorite toggle (★ / ✕). Only shown when consumer registers an
        // onToggleFavorite handler. Recents items get no pin button.
        if (exp.favoritesEnabled && !isVirtualRecents) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'layer8d-explorer-fav';
            btn.setAttribute('data-fav-toggle', '1');
            btn.setAttribute('tabindex', '-1');
            if (isVirtualFavs) {
                btn.textContent = '✕';
                btn.title = 'Remove from Favorites';
                btn.classList.add('layer8d-explorer-fav-pinned');
            } else {
                var pinned = isFavorite(exp, group.key, item.key);
                btn.textContent = pinned ? '★' : '☆';
                btn.title = pinned ? 'Pinned to Favorites' : 'Pin to Favorites';
                if (pinned) btn.classList.add('layer8d-explorer-fav-pinned');
            }
            li.appendChild(btn);
        }

        return li;
    }

    function isFavorite(exp, groupKey, itemKey) {
        for (var i = 0; i < exp.favorites.length; i++) {
            var f = exp.favorites[i];
            if (!f) continue;
            if (f.key === itemKey && (!f.group || f.group === groupKey)) return true;
        }
        return false;
    }

    window.Layer8DExplorerRender = {
        buildVirtualGroups: buildVirtualGroups,
        renderGroup: renderGroup,
        renderItem: renderItem,
        isFavorite: isFavorite
    };
})();
