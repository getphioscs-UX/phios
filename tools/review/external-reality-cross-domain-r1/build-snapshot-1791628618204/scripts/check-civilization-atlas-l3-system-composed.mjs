import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const cases=read('assets/js/pages/civilization-atlas/cases-renderer.js');

const l3=slots.layers.cases;
assert.equal(l3.presentationMode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.equal(l3.rules.templateWebPRequired,false);
assert.equal(l3.rules.fixedCardCount,false);
assert.equal(l3.rules.cardCountComesFromRegistry,true);
assert.deepEqual(l3.sourceVisualFamilies,['CASE_HERO','CASE_SECONDARY']);

const p3=projection.layers.find(x=>x.layerId==='cases');
assert.equal(p3.mode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.ok(!Object.prototype.hasOwnProperty.call(p3,'poster'),'L3 must not retain a poster/template delivery dependency.');
assert.deepEqual(p3.sourceVisualFamilies,['CASE_HERO','CASE_SECONDARY']);

assert.ok(shell.includes("presentationMode==='SYSTEM_COMPOSED_FROM_ASSETS'"),'Shell must recognize system-composed presentation mode.');
assert.ok(shell.includes('civ-system-composed-layer'),'System-composed L3 must render as the primary surface, not hidden controls.');
assert.ok(compositor.includes("slotConfig?.presentationMode==='SYSTEM_COMPOSED_FROM_ASSETS'"),'Template compositor must skip L3.');

assert.ok(cases.includes("'CASE_HERO'"),'L3 must use CASE_HERO visuals.');
assert.ok(cases.includes("'CASE_SECONDARY'"),'L3 must use CASE_SECONDARY visuals.');
assert.ok(cases.includes('civ-case-grid'),'L3 must be HTML/CSS registry layout.');
assert.ok(cases.includes('data-case-search'),'L3 search must remain dynamic.');
assert.ok(cases.includes('data-compare-case'),'L3 compare basket must remain dynamic.');

console.log('L3 system-composed gate PASS: Case Registry uses accepted case assets + HTML/CSS and has no Template WebP dependency.');
