// Live slots: at most 5 components hold a live registration; the oldest past
// the limit is evicted (listeners detached, register=Unregister sent for each
// of its queries); a revisit moves a component to the newest; a new instance
// under the same id takes the slot over; release() stops listening without
// unregistering.
//
// Run: node tests/live-slots.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sent = [];
const sockets = [];
const ctx = {
    window: {}, console,
    sessionStorage: { bearerToken: 'tok' },
    location: { protocol: 'http:', host: 'test' },
    fetch: (url) => { sent.push(url); return Promise.resolve({}); },
    WebSocket: function() { sockets.push(this); },
    setTimeout: () => 0,
};
ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'shared/layer8d-websocket.js'), 'utf8'), ctx);
const WS = ctx.window.Layer8DWebSocket;
WS.init();
const socket = sockets[0];
socket.onopen();
// Deliver a push the way the server does: one frame on the page's socket.
function push(modelType) {
    socket.onmessage({ data: JSON.stringify({ modelType, action: 'update', primaryKey: 'x' }) });
}

const failures = [];
function check(name, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
        failures.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
}
function sentBodies() {
    return sent.splice(0).map((u) => ({
        endpoint: u.split('?')[0],
        body: JSON.parse(decodeURIComponent(u.split('?body=')[1]))
    }));
}

// A component registers and listens the way a live view does.
function component(id, endpoint, model) {
    const c = { id, endpoint, model, detached: 0, hits: 0 };
    c.register = (text) => WS.registerQuery(id, c, endpoint, text, { onDetach: () => { c.detached++; } });
    c.listen = () => WS.listen(id, c, model, () => { c.hits++; });
    return c;
}

// The returned body carries the register fields; the text is untouched.
const a = component('a', '/erp/30/A', 'A');
check('register body', a.register('select * from A limit 10 page 0'),
    { text: 'select * from A limit 10 page 0', register: 'L8_REGISTER_REGISTER', registerId: 'a' });
a.listen();

const comps = { a };
for (const id of ['b', 'c', 'd', 'e']) {
    comps[id] = component(id, '/erp/30/' + id.toUpperCase(), id.toUpperCase());
    comps[id].register('select * from ' + id.toUpperCase());
    comps[id].listen();
}
check('five fit', WS.liveIds(), ['a', 'b', 'c', 'd', 'e']);
check('nothing unregistered yet', sentBodies(), []);

// A revisit of 'a' (same instance, new page) moves it to the newest.
a.register('select * from A limit 10 page 1');
check('revisit moves to newest', WS.liveIds(), ['b', 'c', 'd', 'e', 'a']);

// The sixth evicts the oldest ('b'): detached, and its query unregistered.
const f = component('f', '/erp/30/F', 'F');
f.register('select * from F');
check('fifo eviction', WS.liveIds(), ['c', 'd', 'e', 'a', 'f']);
check('evicted detached', comps.b.detached, 1);
check('eviction sends unregister', sentBodies(), [{ endpoint: '/erp/30/B',
    body: { text: 'select * from B', register: 'L8_REGISTER_UNREGISTER', registerId: 'b' } }]);

// The evicted component no longer receives pushes; the live ones do.
push('B');
push('A');
check('evicted component gets no pushes', comps.b.hits, 0);
check('live component gets pushes', a.hits, 1);

// A new instance under 'c' (a revisit that created a new table) takes the
// slot over: the old instance is detached, the slot moves to the newest.
const c2 = component('c', '/erp/30/C', 'C');
c2.register('select * from C where x=1');
check('takeover detaches old instance', comps.c.detached, 1);
check('takeover moves to newest', WS.liveIds(), ['d', 'e', 'a', 'f', 'c']);
check('takeover on the same endpoint sends nothing', sentBodies(), []);
push('C');
check('the replaced instance gets no pushes', comps.c.hits, 0);

// A takeover on another endpoint (one container reused for every service)
// unregisters the old instance's query there.
const d2 = component('d', '/erp/30/Other', 'Other');
d2.register('select * from Other');
check('takeover on another endpoint unregisters the old query', sentBodies(), [{ endpoint: '/erp/30/D',
    body: { text: 'select * from D', register: 'L8_REGISTER_UNREGISTER', registerId: 'd' } }]);

// release() stops listening but keeps the slot and sends nothing.
WS.release('e', comps.e);
check('release keeps the slot', WS.liveIds().includes('e'), true);
check('release sends nothing', sentBodies(), []);
push('E');
check('a released component gets no pushes', comps.e.hits, 0);
check('listen after release by the old owner is a no-op', typeof WS.listen('e', comps.e, 'E', () => {}), 'function');

// One component, several queries (the dashboard): eviction unregisters all.
const dash = { detached: 0 };
WS.registerQuery('dashboard', dash, '/erp/30/Employee', 'select count(*) from Employee', {});
WS.registerQuery('dashboard', dash, '/erp/60/SalesOrder', 'select count(*) from SalesOrder', {});
check('one slot for several queries', WS.liveIds().filter((x) => x === 'dashboard').length, 1);
for (const id of ['g', 'h', 'i', 'j', 'k']) component(id, '/erp/30/' + id, id).register('select * from ' + id);
const unregs = sentBodies().filter((s) => s.body.registerId === 'dashboard').map((s) => s.endpoint).sort();
check('evicting the dashboard unregisters every query', unregs, ['/erp/30/Employee', '/erp/60/SalesOrder']);

// touch(): a component shown again without fetching moves to the newest;
// one that lost its slot reports false (it must fetch to register again).
const t1 = {}, t2 = {};
WS.registerQuery('t1', t1, '/erp/30/T1', 'select * from T1', {});
WS.registerQuery('t2', t2, '/erp/30/T2', 'select * from T2', {});
check('touch moves to newest', WS.touch('t1', t1), true);
check('touched is newest', WS.liveIds().slice(-1), ['t1']);
check('touch by a non-owner fails', WS.touch('t2', {}), false);
check('touch of an evicted id fails', WS.touch('b', comps.b), false);
sentBodies();

// After a reconnect every live component is asked to fetch (re-register).
const reconnected = [];
WS.registerQuery('r', {}, '/erp/30/R', 'select * from R', { onReconnect: () => reconnected.push('r') });
socket.onclose();
socket.onopen();
check('reconnect asks live components to fetch again', reconnected, ['r']);

if (failures.length) {
    console.error('FAIL\n  ' + failures.join('\n  '));
    process.exit(1);
}
console.log('PASS live-slots');
