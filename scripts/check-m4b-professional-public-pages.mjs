import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const [services, hd, readers, css, en, zh, registry, pricing, shell] = await Promise.all([
  read('services.html'), read('professional/human-design/index.html'),
  read('professional/external-readers/index.html'), read('assets/css/public-experience.css'),
  read('assets/js/locales/en/public.js'), read('assets/js/locales/zh-Hans/public.js'),
  JSON.parse(await read('content/registry/m4b-professional-public-pages.json')),
  JSON.parse(await read('content/registry/professional-pricing-policy.json')),
  read('assets/js/public-shell.js')
]);
for (const key of ['runtimeReading','humanDesign','consultation','navigationFollowup','longTermReview']) {
  assert.ok(services.includes(`servicesPublic.${key}`));
}
for (const key of ['whatTitle','useTitle','examineTitle','cannotTitle','optionsTitle','processTitle','materialsTitle','boundaryTitle','priceTitle','book']) {
  assert.ok(hd.includes(`humanDesignPublic.${key}`));
}
for (const reader of ['Human Design','BaZi','Zi Wei','Gene Keys','Astrology']) assert.ok(readers.includes(reader));
assert.equal((readers.match(/data-i18n="externalReadersPublic.available"/g) || []).length, 1);
assert.equal((readers.match(/data-i18n="externalReadersPublic.planned"/g) || []).length, 4);
for (const name of ['Automated Runtime Reading','Professional Runtime Reading','Human Design Foundation Report','Human Design Runtime Interpretation','Reality-Specific Interpretation','Integrated Runtime Review']) assert.ok(services.includes(name));
const disclaimer = 'Professional interpretation is not the same as observed evidence.';
const readerDisclaimer = 'External Readers are used as interpretive perspectives, not as diagnostic, deterministic or evidentiary systems.';
for (const page of [services, hd, readers]) {
  assert.ok(page.includes('servicesPublic.disclaimerOne'));
  assert.ok(page.includes('servicesPublic.disclaimerTwo'));
}
assert.ok(en.includes(disclaimer)); assert.ok(en.includes(readerDisclaimer));
assert.ok(zh.includes('专业解释并不等同于观察证据。'));
assert.ok(zh.includes('不属于诊断、确定性判断或证据系统'));
assert.equal(pricing.amountsPublished, false); assert.equal(pricing.checkoutEnabled, false);
assert.equal(registry.readerAvailability.human_design, 'available');
assert.equal(registry.readerAvailability.bazi, 'planned');
assert.equal(registry.boundaries.readerInterpretationWritesRuntimeMemory, false);
assert.ok(css.includes('@media (max-width: 768px)')); assert.ok(css.includes('@media (max-width: 520px)'));
for (const forbidden of ['human-design','bazi','ziwei','gene-keys','astrology']) {
  assert.equal((shell.match(new RegExp(`href=["'][^"']*${forbidden}`, 'g')) || []).length, 0);
}
console.log('✓ M4B-W7 Professional Public Pages passed: five public services, Human Design, Reader availability, comparison and unified disclaimers are aligned.');
console.log('  Prices and checkout remain unpublished; External Readers remain interpretation-only and outside the main navigation.');
