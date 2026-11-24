// L8Chat live registrations vs. page-scoped server notifications.
//
// The server pushes a paged registration (one with a limit) only the changes
// that belong to its displayed page (l8utils Subscription.wants); it never
// pages an aggregate. The "my conversations" registration must get every
// change to any of the user's conversations, so it has to be unpaged: an
// aggregate (count) with no limit / page. With 'limit 1 page 0' a new
// conversation was pushed only if its id sorted before the one row on the
// page, so new conversations stopped appearing live.
//
// Run: node tests/l8chat-registrations.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = {
    window: {}, console,
    sessionStorage: { bearerToken: 'tok' },
    location: { protocol: 'http:', host: 'test' },
    fetch: () => Promise.resolve({}),
    WebSocket: function() {},
    setTimeout: () => 0,
    setInterval: () => 0,
};
ctx.window.window = ctx.window;
ctx.window.addEventListener = () => {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'shared/layer8d-websocket.js'), 'utf8'), ctx);
ctx.Layer8DWebSocket = ctx.window.Layer8DWebSocket;   // the browser's window global
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'l8chat/l8chat-core-live.js'), 'utf8'), ctx);

const failures = [];
function check(name, ok, detail) {
    if (!ok) failures.push(`${name}${detail ? ': ' + detail : ''}`);
}

// A session whose api records the live queries the way L8ChatApi.query sends them.
const registered = [];
const session = {
    store: { me: 'u1' },
    api: {
        query: (key, text, live) => {
            if (live) registered.push({ key, id: live.id, text });
            return Promise.resolve([]);
        },
    },
};
const live = ctx.window.L8ChatLive.create(session);

live.registerConversations().then(() => {
    const conv = registered.find((r) => r.id === 'l8chat-conv');
    check('"my conversations" is registered', !!conv);
    if (conv) {
        const t = conv.text;
        check('it is scoped to the user', /where members\.userId=u1\b/.test(t), t);
        check('it is an aggregate, which the server never page-scopes', /^select count\(/i.test(t), t);
        check('it has no limit / page (a paged registration gets only its page\'s changes)',
            !/\blimit\b|\bpage\b/i.test(t), t);
    }

    if (failures.length) {
        console.error('FAIL\n  ' + failures.join('\n  '));
        process.exit(1);
    }
    console.log('l8chat-registrations: all checks passed');
}).catch((e) => {
    console.error('FAIL', e);
    process.exit(1);
});
