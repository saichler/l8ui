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
// Layer8 Query Builder — shared, transport-agnostic L8Query string assembly.
// No fetch, no DOM, no auth headers — pure string building only.
//
// Scope note: five places in this codebase independently build L8Query
// strings (Layer8DTable, Layer8DDataSource, Layer8MDataSource, and both
// reference pickers). Two of them — Layer8DTable and Layer8DDataSource — are
// byte-identical in their filter/sort/query-assembly logic, so
// buildColumnFilterConditions() below is a direct, lossless extraction of
// that shared logic. The other three genuinely differ in how they resolve
// filters (single free-text filter vs. per-column filter map) and sort keys,
// so this module does NOT force them into one shape — it only provides
// assembleQuery(), the final "select X from Y where ... limit ... page ...
// sort-by ... register=true" string template, which IS identical across all
// five once each caller has resolved its own where-conditions/sort-clause.
// In particular: Layer8MDataSource's single-filter mode has its own
// hardcoded-`Id`-column fallback that desktop's per-column filter map has no
// equivalent of — that is a genuine behavioral difference, not duplication,
// and is intentionally left in Layer8MDataSource rather than merged here.

(function() {
    'use strict';

    /**
     * Resolves a per-column filters map (as used by Layer8DTable and
     * Layer8DDataSource) into L8Query "key=value" condition strings, matching
     * a column's enumValues/enumOptions/boolean/text-wildcard type.
     *
     * @param {Object<string,*>} filters - { columnKey: filterValue }
     * @param {Array<Object>} columns - column defs (key, filterKey, enumValues, enumOptions, type)
     * @param {Function} matchEnumValue - e.g. Layer8DUtils.matchEnumValue / Layer8MUtils.matchEnumValue
     * @returns {{ conditions: string[], invalidFilters: string[] }}
     */
    function buildColumnFilterConditions(filters, columns, matchEnumValue) {
        const conditions = [];
        const invalidFilters = [];

        for (const [columnKey, filterValue] of Object.entries(filters || {})) {
            if (!filterValue) continue;

            const column = (columns || []).find(c => c.key === columnKey);
            if (!column) continue;

            const filterKey = column.filterKey || column.key;

            let queryValue;
            if (column.enumValues) {
                const enumValue = matchEnumValue(filterValue, column.enumValues);
                if (enumValue === null) {
                    invalidFilters.push(columnKey);
                    continue;
                }
                queryValue = enumValue;
            } else if (column.enumOptions) {
                queryValue = filterValue;
            } else if (column.type === 'boolean') {
                queryValue = filterValue;
            } else {
                queryValue = `${filterValue}*`;
            }

            conditions.push(`${filterKey}=${queryValue}`);
        }

        return { conditions, invalidFilters };
    }

    /**
     * Assembles the final L8Query string. All pieces are pre-resolved by the
     * caller — this function only concatenates them in the fixed order every
     * existing query-builder in this codebase already follows.
     *
     * @param {Object} parts
     * @param {string} parts.modelName
     * @param {string} parts.selectClause - '*' or a pre-joined column list
     * @param {string[]} [parts.whereConditions] - already-resolved condition strings
     * @param {number} parts.pageSize
     * @param {number} parts.pageIndex - 0-based
     * @param {string} [parts.sortClause] - pre-resolved sort key, WITHOUT the
     *   'sort-by ' prefix or ' descending' suffix (pass '' to omit sorting)
     * @param {boolean} [parts.sortDescending]
     * @param {boolean} [parts.realtime]
     * @returns {string}
     */
    function assembleQuery(parts) {
        let query = `select ${parts.selectClause} from ${parts.modelName}`;

        if (parts.whereConditions && parts.whereConditions.length > 0) {
            query += ` where ${parts.whereConditions.join(' and ')}`;
        }

        query += ` limit ${parts.pageSize} page ${parts.pageIndex}`;

        if (parts.sortClause) {
            const desc = parts.sortDescending ? ' descending' : '';
            query += ` sort-by ${parts.sortClause}${desc}`;
        }

        if (parts.realtime) {
            query += ' register=true';
        }

        return query;
    }

    /**
     * Resolves the total-item count for a fetched page, honoring the rule
     * that the server only computes aggregate metadata (key counts) on the
     * first page — later pages must reuse the previously-cached total
     * instead of overwriting it with the absent/zero metadata a later page
     * returns. This exact guard has independently regressed 4 times across
     * this codebase's history (see layer8d-table-pagination-metadata.md) —
     * every fetchData() that reads `metadata.keyCount.counts` should resolve
     * its total through this one function rather than re-deriving the guard.
     *
     * @param {boolean} isFirstPage - true when this fetch is for the first page
     *   (callers use different first-page conventions: page === 1 for
     *   Layer8DTable/Layer8DDataSource/Layer8MDataSource, page === 0 for the
     *   reference pickers — resolve that before calling this function)
     * @param {Object} [responseMetadata] - the raw `metadata` field from the response
     * @param {number} cachedTotal - the previously known total (0 if none yet)
     * @returns {number}
     */
    function resolvePageTotal(isFirstPage, responseMetadata, cachedTotal) {
        if (isFirstPage && responseMetadata?.keyCount?.counts) {
            return responseMetadata.keyCount.counts.Total || 0;
        }
        return cachedTotal || 0;
    }

    window.Layer8QueryBuilder = {
        buildColumnFilterConditions,
        assembleQuery,
        resolvePageTotal
    };

})();
