// Checkbox and toggle fields edit protobuf bool fields, whose JSON must be
// true/false (a number is rejected: "invalid value for bool field"). Both
// the desktop and the mobile forms must collect booleans.
//
// Run: NODE_PATH=<dir with playwright's node_modules> node tests/checkbox-values.test.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    const formDef = { title: 'Rule', sections: [{ title: 'Rule', fields: [
        { key: 'enabled', label: 'Enabled', type: 'checkbox' },
        { key: 'skipVerify', label: 'Skip verify', type: 'checkbox' },
        { key: 'active', label: 'Active', type: 'toggle' },
        { key: 'policy.requireCert', label: 'Require cert', type: 'checkbox' }
    ] }] };
    const record = { enabled: true, skipVerify: false, active: true, policy: { requireCert: false } };
    const want = JSON.stringify(record);
    const results = {};

    // Mobile: render with the real renderer, collect with getFormData.
    await page.goto('file://' + path.join(__dirname, 'mobile-nested-fields.html'));
    results.mobile = await page.evaluate((a) => {
        const box = document.createElement('div');
        box.innerHTML = Layer8MForms.renderForm(a.formDef, a.record);
        document.body.appendChild(box);
        return Layer8MForms.getFormData(box);
    }, { formDef, record });

    // Desktop: the same fields in the edit form, collected by collectFormData.
    await page.goto('file://' + path.join(__dirname, 'reference-ids.html'));
    results.desktop = await page.evaluate((a) => {
        const inputs = [['enabled', true], ['skipVerify', false], ['active', true], ['policy.requireCert', false]]
            .map(([k, on]) => '<input type="checkbox" name="' + k + '"' + (on ? ' checked' : '') + '>').join('');
        document.body.insertAdjacentHTML('beforeend', '<form id="layer8d-edit-form">' + inputs + '</form>');
        return Layer8DFormsData.collectFormData(a.formDef);
    }, { formDef });

    let failed = 0;
    for (const shell of ['desktop', 'mobile']) {
        const ok = JSON.stringify(results[shell]) === want;
        if (!ok) failed++;
        console.log((ok ? 'PASS ' : 'FAIL ') + shell + ' ' + JSON.stringify(results[shell]));
    }
    errors.forEach(e => console.log('PAGE ERROR ' + e));
    await browser.close();
    process.exit(failed || errors.length ? 1 : 0);
})();
