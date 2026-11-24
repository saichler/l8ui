// Reference picker client-side filtering (clientFilter / postFilter) must see
// every candidate row, not one server page: filtering a single page silently
// dropped the matches on the other pages and kept the unfiltered total. A
// client-filtered picker loads the whole base set, filters it, and pages it
// locally with the true total. A plain picker still pages on the server.
//
// Run: node tests/reference-picker-client-filter.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1234 rows on the server, served in the pages the query asks for.
const ROWS = Array.from({ length: 1234 }, (_, i) => ({ id: 'r' + i, n: i }));
const queries = [];
const ctx = {
    window: {}, console,
    getAuthHeaders: () => ({}),
    fetch: (url) => {
        const text = JSON.parse(decodeURIComponent(url.split('?body=')[1])).text;
        queries.push(text);
        const m = / limit (\d+) page (\d+)/.exec(text);
        const size = Number(m[1]), page = Number(m[2]);
        const list = ROWS.slice(page * size, page * size + size);
        return Promise.resolve({ ok: true, json: () => Promise.resolve(
            { list, metadata: { keyCount: { counts: { Total: ROWS.length } } } }) });
    },
};
ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'shared/layer8-query-builder.js'), 'utf8'), ctx);
ctx.Layer8QueryBuilder = ctx.window.Layer8QueryBuilder;
ctx.Layer8DReferencePicker = { _internal: {} };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'reference_picker/layer8d-reference-picker-data.js'), 'utf8'), ctx);
const internal = ctx.Layer8DReferencePicker._internal;

const failures = [];
function check(name, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
        failures.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
}
const base = { endpoint: '/x', modelName: 'M', selectColumns: ['id', 'n'], displayColumn: 'n', pageSize: 10 };
const state = (over) => Object.assign({ currentPage: 0, filterValue: '', sortDirection: 'asc', totalItems: 0 }, over);

(async () => {
    // clientFilter: matches are spread over every server page (n % 100 === 7).
    const cf = Object.assign({}, base, { clientFilter: (item, term) => String(item.n % 100) === term });
    let r = await internal.fetchData(cf, state({ filterValue: '7' }));
    const all7 = ROWS.filter((x) => x.n % 100 === 7).map((x) => x.id);
    check('clientFilter: true total over the whole set', r.totalItems, all7.length);
    check('clientFilter: first page of the matches', r.data.map((x) => x.id), all7.slice(0, 10));
    r = await internal.fetchData(cf, state({ filterValue: '7', currentPage: 1 }));
    check('clientFilter: second page of the matches', r.data.map((x) => x.id), all7.slice(10, 20));
    check('clientFilter: no server-side filter on the search term',
        queries.some((q) => / where /.test(q)), false);

    // postFilter applies to the whole set too, even with no search term.
    const pf = Object.assign({}, base, { postFilter: (item) => item.n >= 1200 });
    r = await internal.fetchData(pf, state({}));
    check('postFilter: true total', r.totalItems, 34);
    check('postFilter: first page', r.data.map((x) => x.id), ROWS.slice(1200, 1210).map((x) => x.id));

    // A plain picker still fetches one server page with the server total.
    queries.length = 0;
    r = await internal.fetchData(base, state({}));
    check('plain: one request', queries.length, 1);
    check('plain: server paging', / limit 10 page 0/.test(queries[0]), true);
    check('plain: server total', r.totalItems, 1234);
    check('plain: one page of rows', r.data.length, 10);

    if (failures.length) {
        console.error('FAIL\n  ' + failures.join('\n  '));
        process.exit(1);
    }
    console.log('PASS reference-picker-client-filter');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
