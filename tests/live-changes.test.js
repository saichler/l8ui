// Live views get a pushed change only when it belongs to the page they
// display (the server scopes notifications to each view's page). An update
// of a row on the page is applied in place from the pushed record; an add,
// or a delete of a row on the page, re-fetches the page; an update/delete of
// a row not on the page is ignored -- never a re-fetch or a re-render
// (probler/plans/websocket-page-scoped-notifications.md Phase 5).
// Layer8DWebSocket.applyChange is the shared step; the desktop and mobile
// tables and both data sources act on its result.
//
// Run: node tests/live-changes.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, console };
ctx.window.window = ctx.window;
// Stub table classes: the realtime/data files only add prototype methods.
ctx.Layer8DTable = function() {};
ctx.Layer8MTable = function() {};
vm.createContext(ctx);
for (const f of ['shared/layer8d-websocket.js', 'shared/layer8d-data-source.js',
    'm/js/layer8m-data-source.js', 'edit_table/layer8d-table-data.js', 'm/js/layer8m-table-realtime.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
}
const WS = ctx.window.Layer8DWebSocket;
ctx.Layer8DWebSocket = WS;

const failures = [];
function check(name, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
        failures.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
}
const byId = (x) => x.id;
const page = () => [{ id: 'a', n: 1 }, { id: 'b', n: 2 }];
const NONE = { index: -1, refetch: false };

// --- Layer8DWebSocket.applyChange ---

// update of a row on this page replaces it in place
let items = page();
let r = WS.applyChange(items, { action: 'update', primaryKey: 'b', record: { id: 'b', n: 9 } }, { getId: byId });
check('update on page', r, { index: 1, refetch: false });
check('update on page items', items, [{ id: 'a', n: 1 }, { id: 'b', n: 9 }]);

// update of a row not on this page: ignored, with or without its record
items = page();
r = WS.applyChange(items, { action: 'update', primaryKey: 'z', record: { id: 'z' } }, { getId: byId });
check('update off page', r, NONE);
r = WS.applyChange(items, { action: 'update', primaryKey: 'z' }, { getId: byId });
check('update off page without record', r, NONE);
check('update off page items', items, page());

// update of a row on this page without its record: re-fetch, no guessing
r = WS.applyChange(page(), { action: 'update', primaryKey: 'a' }, { getId: byId });
check('update on page without record', r, { index: 0, refetch: true });

// delete of a row on this page re-fetches; a delete of a row not here is ignored
items = page();
r = WS.applyChange(items, { action: 'delete', primaryKey: 'a' }, { getId: byId });
check('delete on page', r, { index: 0, refetch: true });
check('delete on page leaves items for the re-fetch', items, page());
r = WS.applyChange(items, { action: 'delete', primaryKey: 'q' }, { getId: byId });
check('delete off page', r, NONE);

// an add always re-fetches (its position comes from the server's sort)
items = page();
r = WS.applyChange(items, { action: 'add', primaryKey: 'c', record: { id: 'c' } }, { getId: byId });
check('add', r, { index: -1, refetch: true });
check('add leaves items for the re-fetch', items, page());
r = WS.applyChange(items, { action: 'add', primaryKey: 'c' }, { getId: byId });
check('add without record', r, { index: -1, refetch: true });

// the view's transform runs on the pushed record
items = page();
WS.applyChange(items, { action: 'update', primaryKey: 'a', record: { id: 'a', n: 5 } },
    { getId: byId, transform: (x) => ({ ...x, label: 'n=' + x.n }) });
check('transform', items[0], { id: 'a', n: 5, label: 'n=5' });
// an add the view's transform drops is ignored; an on-page row it drops leaves the page
r = WS.applyChange(page(), { action: 'add', primaryKey: 'd', record: { id: 'd' } },
    { getId: byId, transform: () => null });
check('transform drops add', r, NONE);
r = WS.applyChange(page(), { action: 'update', primaryKey: 'a', record: { id: 'a' } },
    { getId: byId, transform: () => null });
check('transform drops on-page row', r, { index: 0, refetch: true });

// unknown actions are ignored
check('unknown action', WS.applyChange(page(), { action: 'noop', primaryKey: 'a' }, { getId: byId }), NONE);

// --- callers: record what each view does ---

function spyOn(obj, calls, names) {
    names.forEach((n) => { obj[n] = (...args) => calls.push([n, ...args]); });
}
const offPage = [
    { action: 'update', primaryKey: 'zz', record: { id: 'zz' } },
    { action: 'update', primaryKey: 'zz' },
    { action: 'delete', primaryKey: 'zz' }
];

// desktop table: off-page changes do nothing; on-page update patches one row;
// add / on-page delete re-fetch the current page
{
    const t = Object.create(ctx.Layer8DTable.prototype);
    const calls = [];
    Object.assign(t, { data: page(), primaryKey: 'id', currentPage: 3, pageSize: 15 });
    spyOn(t, calls, ['fetchData', 'updateRow', 'render']);
    offPage.forEach((m) => t._handleChangeNotification(m));
    check('desktop table off page', calls, []);
    t._handleChangeNotification({ action: 'update', primaryKey: 'b', record: { id: 'b', n: 7 } });
    t._handleChangeNotification({ action: 'add', primaryKey: 'c', record: { id: 'c' } });
    t._handleChangeNotification({ action: 'delete', primaryKey: 'a' });
    check('desktop table on page', calls, [
        ['updateRow', 1, { id: 'b', n: 7 }],
        ['fetchData', 3, 15],
        ['fetchData', 3, 15]
    ]);
}

// mobile table: same decisions; an on-page update re-renders the cards
{
    const t = Object.create(ctx.Layer8MTable.prototype);
    const calls = [];
    Object.assign(t, { config: { data: page() }, currentPage: 2 });
    spyOn(t, calls, ['fetchData', 'render']);
    offPage.forEach((m) => t._handleChangeNotification(m));
    check('mobile table off page', calls, []);
    t._handleChangeNotification({ action: 'update', primaryKey: 'a', record: { id: 'a', n: 4 } });
    check('mobile table on-page update applied', t.config.data[0], { id: 'a', n: 4 });
    t._handleChangeNotification({ action: 'add', primaryKey: 'c', record: { id: 'c' } });
    t._handleChangeNotification({ action: 'delete', primaryKey: 'b' });
    check('mobile table on page', calls, [['render'], ['fetchData', 2], ['fetchData', 2]]);
}

// both data sources: an on-page update is emitted through onDataLoaded;
// add / on-page delete re-fetch; off-page changes do nothing
for (const [name, Cls] of [['desktop data source', ctx.window.Layer8DDataSource],
    ['mobile data source', ctx.window.Layer8MDataSource]]) {
    if (!Cls) { failures.push(name + ': class not loaded'); continue; }
    const emitted = [];
    const calls = [];
    const ds = new Cls({ endpoint: '/x', modelName: 'M', primaryKey: 'id', pageSize: 10,
        onDataLoaded: (result) => emitted.push({ ids: result.items.map(byId), total: result.totalCount }) });
    check(name + ' live by default', ds.realtime, true);
    ds.data = page();
    ds.totalItems = 2;
    ds.currentPage = 1;
    spyOn(ds, calls, ['fetchData']);
    offPage.forEach((m) => ds._handleChangeNotification(m));
    ds._handleChangeNotification({ action: 'update', primaryKey: 'a', record: { id: 'a', n: 3 } });
    ds._handleChangeNotification({ action: 'add', primaryKey: 'c', record: { id: 'c' } });
    ds._handleChangeNotification({ action: 'delete', primaryKey: 'b' });
    check(name + ' emissions', emitted, [{ ids: ['a', 'b'], total: 2 }]);
    check(name + ' fetches', calls, [['fetchData', 1], ['fetchData', 1]]);
}
check('opt out', new ctx.window.Layer8DDataSource({ realtime: false }).realtime, false);

if (failures.length) {
    console.error('FAIL\n  ' + failures.join('\n  '));
    process.exit(1);
}
console.log('PASS live-changes');
