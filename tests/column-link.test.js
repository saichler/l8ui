// Layer8ColumnFactory.link() makes a column whose cell is a link that calls
// the column's onClick with the row's item. Clicking it must call onClick --
// not the row's own click, and not navigate -- in the desktop table, the
// mobile table and the mobile edit table.
//
// Run: NODE_PATH=<dir with playwright's node_modules> node tests/column-link.test.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(__dirname, 'column-link.html'));

    await page.evaluate(() => {
        window.calls = [];
        const rows = [{ id: 'row-1', name: 'first', agentId: 'agent-1' }, { id: 'row-2', name: 'second', agentId: 'agent-2' }];
        const columns = () => [
            ...Layer8ColumnFactory.col('name', 'Name'),
            ...Layer8ColumnFactory.link('agentId', 'Agent', (item) => calls.push('link:' + item.id))
        ].map(c => Object.assign({}, c, c.key === 'name' ? { primary: true } : {}));

        const desktop = new Layer8DTable({
            containerId: 'desktop', columns: columns(), primaryKey: 'id', showActions: false,
            onRowClick: (item) => calls.push('row:' + item.id)
        });
        desktop.init();
        desktop.setData(rows);

        new Layer8MTable('mobile', {
            columns: columns(), data: rows, getItemId: (i) => i.id,
            onCardClick: (item) => calls.push('card:' + item.id)
        });
        new Layer8MEditTable('mobile-edit', {
            columns: columns(), data: rows, getItemId: (i) => i.id,
            onRowClick: (item) => calls.push('editcard:' + item.id)
        });
    });

    const results = {};
    for (const [name, box] of [['desktop', '#desktop'], ['mobile', '#mobile'], ['mobile-edit', '#mobile-edit']]) {
        await page.evaluate(() => { calls = []; });
        const before = page.url();
        const link = page.locator(box + ' a.layer8d-link').nth(1);   // the second row's link
        const found = await link.count();
        if (found) await link.click();
        await page.waitForTimeout(100);
        results[name] = { found: found > 0, calls: await page.evaluate(() => calls.slice()), navigated: page.url() !== before };
    }

    let failed = 0;
    for (const [name, r] of Object.entries(results)) {
        const ok = r.found && JSON.stringify(r.calls) === JSON.stringify(['link:row-2']) && !r.navigated;
        if (!ok) failed++;
        console.log((ok ? 'PASS ' : 'FAIL ') + name + ' ' + JSON.stringify(r));
    }
    errors.forEach(e => console.log('PAGE ERROR ' + e));
    await browser.close();
    process.exit(failed || errors.length ? 1 : 0);
})();
