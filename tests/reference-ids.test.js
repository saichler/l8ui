// Reference fields hold another record's ID. In Layer 8 every ID is a
// string UUID, so the form must collect the ID exactly as picked -- on
// desktop (Layer8DFormsData.collectFormData) and mobile
// (Layer8MForms.getFormData).
//
// Run: NODE_PATH=<dir with playwright's node_modules> node tests/reference-ids.test.js
const { chromium } = require('playwright');
const path = require('path');

const IDS = [
    '4660db2e-8b36-416f-9195-b56f090c1276', // starts with digits
    '01c78cc9-8b36-416f-9195-b56f090c1276', // starts with a zero
    'a3f0c2e1-8b36-416f-9195-b56f090c1276'  // starts with a letter
];

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.join(__dirname, 'reference-ids.html'));

    let failed = 0;
    for (const id of IDS) {
        const got = await page.evaluate((id) => {
            // Desktop: the edit form with one reference field.
            document.body.insertAdjacentHTML('beforeend',
                '<form id="layer8d-edit-form"><input name="tokenId" class="reference-input" data-ref-id="' + id + '"></form>');
            const desktop = Layer8DFormsData.collectFormData({ sections: [{ fields: [{ key: 'tokenId', type: 'reference' }] }] });
            document.getElementById('layer8d-edit-form').remove();

            // Mobile: the same field in a mobile form container.
            const box = document.createElement('div');
            box.innerHTML = '<form><input name="tokenId" class="reference-input" data-ref-id="' + id + '"></form>';
            const mobile = Layer8MForms.getFormData(box);
            return { desktop: desktop.tokenId, mobile: mobile.tokenId };
        }, id);
        for (const shell of ['desktop', 'mobile']) {
            const ok = got[shell] === id;
            if (!ok) failed++;
            console.log((ok ? 'PASS ' : 'FAIL ') + shell + ' ' + id + ' -> ' + JSON.stringify(got[shell]));
        }
    }
    errors.forEach(e => console.log('PAGE ERROR ' + e));
    await browser.close();
    process.exit(failed || errors.length ? 1 : 0);
})();
