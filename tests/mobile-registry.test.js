// The mobile nav finds a service's columns, form and transform in the
// project's mobile module registries. A registry made with
// Layer8MModuleRegistry.create() must be found under any name, without
// editing l8ui; a registry a project assigns to one of the older window
// globals by hand must still be found.
//
// Run: NODE_PATH=<dir with playwright's node_modules> node tests/mobile-registry.test.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(__dirname, 'mobile-registry.html'));

    const got = await page.evaluate(() => {
        const cols = [{ key: 'thingId', label: 'Thing', primary: true }];
        const form = { title: 'Thing', sections: [] };
        const transform = (item) => item;
        // A project registry under a name l8ui has never heard of.
        Layer8MModuleRegistry.create('MobileZzProject', {
            'Things': { columns: { ZzThing: cols }, forms: { ZzThing: form }, transforms: { ZzThing: transform } }
        });
        // An older project that builds its registry global by hand.
        window.MobileSYS = {
            getColumns: (m) => m === 'LegacyThing' ? [{ key: 'legacy' }] : null,
            getFormDef: (m) => m === 'LegacyThing' ? { title: 'Legacy' } : null
        };
        const nav = Layer8MNavData;
        return {
            columns: nav.getServiceColumns({ model: 'ZzThing', idField: 'thingId' }) === cols,
            form: nav.getServiceFormDef({ model: 'ZzThing', label: 'Things' }) === form,
            transform: nav.getServiceTransformData({ model: 'ZzThing' }) === transform,
            legacyColumns: nav.getServiceColumns({ model: 'LegacyThing', idField: 'id' })[0].key === 'legacy',
            legacyForm: nav.getServiceFormDef({ model: 'LegacyThing', label: 'Legacy' }).title === 'Legacy'
        };
    });

    let failed = 0;
    Object.entries(got).forEach(([name, ok]) => {
        if (!ok) failed++;
        console.log((ok ? 'PASS ' : 'FAIL ') + name);
    });
    errors.forEach(e => console.log('PAGE ERROR ' + e));
    await browser.close();
    process.exit(failed || errors.length ? 1 : 0);
})();
