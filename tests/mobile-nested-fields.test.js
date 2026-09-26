// A form field whose key has dots ("policy.names") edits a nested field of
// the record. Desktop collects it as { policy: { names } }; the mobile form
// must collect the same nested object, not a flat "policy.names" key.
//
// Run: NODE_PATH=<dir with playwright's node_modules> node tests/mobile-nested-fields.test.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(__dirname, 'mobile-nested-fields.html'));

    const got = await page.evaluate(() => {
        const formDef = { title: 'Token', sections: [{ title: 'Token', fields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'policy.names', label: 'Names', type: 'tags' },
            { key: 'policy.types', label: 'Types', type: 'multiselect', options: { 1: 'TCP', 2: 'SSH' } },
            { key: 'policy.maxTunnels', label: 'Max', type: 'number' },
            { key: 'policy.ports', label: 'Ports', type: 'text' },
            { key: 'policy.limits.burst', label: 'Burst', type: 'number' }
        ] }] };
        const record = { name: 'laptop', policy: { names: ['x1', 'x1-web'], types: [2], maxTunnels: 3, ports: '22000-22009', limits: { burst: 5 } } };
        const box = document.createElement('div');
        box.innerHTML = Layer8MForms.renderForm(formDef, record);
        document.body.appendChild(box);
        return Layer8MForms.getFormData(box);
    });

    const want = { name: 'laptop', policy: { names: ['x1', 'x1-web'], types: [2], maxTunnels: 3, ports: '22000-22009', limits: { burst: 5 } } };
    const flat = Object.keys(got).filter(k => k.includes('.'));
    const checks = {
        'no flat dotted keys': flat.length === 0,
        'nested object equals the record': JSON.stringify(got.policy) === JSON.stringify(want.policy),
        'top-level field kept': got.name === 'laptop'
    };
    let failed = 0;
    Object.entries(checks).forEach(([name, ok]) => {
        if (!ok) failed++;
        console.log((ok ? 'PASS ' : 'FAIL ') + name);
    });
    console.log('collected: ' + JSON.stringify(got));
    errors.forEach(e => console.log('PAGE ERROR ' + e));
    await browser.close();
    process.exit(failed || errors.length ? 1 : 0);
})();
