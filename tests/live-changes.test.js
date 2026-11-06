// Live views apply pushed changes in place, from the record in the push, with
// no re-fetch: Layer8DWebSocket.applyChange is the shared step, and the data
// source behind every non-table view must hand the view its updated items.
//
// Run: node tests/live-changes.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
for (const f of ['shared/layer8d-websocket.js', 'shared/layer8d-data-source.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
}
// layer8d-data-source.js assigns its class to window; the websocket file too.
const WS = ctx.window.Layer8DWebSocket;
ctx.Layer8DWebSocket = WS;
const DataSource = ctx.window.Layer8DDataSource;

const failures = [];
function check(name, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
        failures.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
}
const byId = (x) => x.id;
const page = () => [{ id: 'a', n: 1 }, { id: 'b', n: 2 }];

// update of a row on this page replaces it in place
let items = page();
let r = WS.applyChange(items, { action: 'update', primaryKey: 'b', record: { id: 'b', n: 9 } },
    { getId: byId, pageSize: 10, firstPage: true });
check('update index', r, { index: 1, totalDelta: 0, missingRecord: false });
check('update items', items, [{ id: 'a', n: 1 }, { id: 'b', n: 9 }]);

// update of a matching record on another page changes nothing here
items = page();
r = WS.applyChange(items, { action: 'update', primaryKey: 'z', record: { id: 'z' } },
    { getId: byId, pageSize: 10, firstPage: true });
check('update elsewhere', r, { index: -1, totalDelta: 0, missingRecord: false });
check('update elsewhere items', items, page());

// add on page 1 goes to the top and keeps the page size
items = page();
r = WS.applyChange(items, { action: 'add', primaryKey: 'c', record: { id: 'c' } },
    { getId: byId, pageSize: 2, firstPage: true });
check('add page1', r, { index: 0, totalDelta: 1, missingRecord: false });
check('add page1 items', items.map(byId), ['c', 'a']);

// add while on a later page only moves the total
items = page();
r = WS.applyChange(items, { action: 'add', primaryKey: 'c', record: { id: 'c' } },
    { getId: byId, pageSize: 2, firstPage: false });
check('add later page', r, { index: -1, totalDelta: 1, missingRecord: false });
check('add later page items', items.map(byId), ['a', 'b']);

// delete removes the row; a delete of a row on another page still moves the total
items = page();
r = WS.applyChange(items, { action: 'delete', primaryKey: 'a' }, { getId: byId, pageSize: 10, firstPage: true });
check('delete here', r, { index: 0, totalDelta: -1, missingRecord: false });
check('delete here items', items.map(byId), ['b']);
r = WS.applyChange(items, { action: 'delete', primaryKey: 'q' }, { getId: byId, pageSize: 10, firstPage: true });
check('delete elsewhere', r, { index: -1, totalDelta: -1, missingRecord: false });

// the view's transform runs on the pushed record; a dropped record is ignored
items = page();
r = WS.applyChange(items, { action: 'update', primaryKey: 'a', record: { id: 'a', n: 5 } },
    { getId: byId, transform: (x) => ({ ...x, label: 'n=' + x.n }), pageSize: 10, firstPage: true });
check('transform', items[0], { id: 'a', n: 5, label: 'n=5' });
r = WS.applyChange(items, { action: 'add', primaryKey: 'd', record: { id: 'd' } },
    { getId: byId, transform: () => null, pageSize: 10, firstPage: true });
check('transform drop', r, { index: -1, totalDelta: 0, missingRecord: false });

// an add/update without its record is reported, not guessed at
r = WS.applyChange(page(), { action: 'update', primaryKey: 'a' }, { getId: byId, pageSize: 10, firstPage: true });
check('missing record', r.missingRecord, true);

// the data source re-emits its items through onDataLoaded, live by default
const emitted = [];
const ds = new DataSource({ endpoint: '/x', modelName: 'M', primaryKey: 'id', pageSize: 10,
    onDataLoaded: (result) => emitted.push({ ids: result.items.map(byId), total: result.totalCount }) });
check('data source live by default', ds.realtime, true);
check('opt out', new DataSource({ realtime: false }).realtime, false);
ds.data = page();
ds.totalItems = 2;
ds._handleChangeNotification({ action: 'add', primaryKey: 'c', record: { id: 'c' } });
ds._handleChangeNotification({ action: 'delete', primaryKey: 'a' });
ds._handleChangeNotification({ action: 'update', primaryKey: 'zz', record: { id: 'zz' } });
check('data source emissions', emitted, [
    { ids: ['c', 'a', 'b'], total: 3 },
    { ids: ['c', 'b'], total: 2 }
]);

if (failures.length) {
    console.error('FAIL\n  ' + failures.join('\n  '));
    process.exit(1);
}
console.log('PASS live-changes');
