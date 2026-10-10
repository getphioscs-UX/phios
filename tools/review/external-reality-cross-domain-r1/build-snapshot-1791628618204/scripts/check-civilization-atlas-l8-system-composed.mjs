import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const registry=json('content/civilization-atlas/loss/reversal-loss-atlas-v1.json');
const renderer=read('assets/js/pages/civilization-atlas/loss-renderer.js');

const l8=slots.layers.loss;
assert.equal(l8.presentationMode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.equal(l8.rules.templateWebPRequired,false);
assert.deepEqual(l8.sourceVisualFamilies,['LOSS_FAMILY','LOSS_TYPE_VIGNETTE','CASE_HERO']);

const p8=projection.layers.find(x=>x.layerId==='loss');
assert.equal(p8.mode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.ok(!Object.prototype.hasOwnProperty.call(p8,'poster'),'L8 must not retain a required template poster.');

assert.equal(registry.families.length,6,'L8 must retain six Loss families.');
assert.equal(registry.lossTypes.length,24,'L8 must retain 24 Loss types.');
assert.ok(renderer.includes("'LOSS_FAMILY'"),'L8 must use accepted Loss family visuals.');
assert.ok(renderer.includes("'LOSS_TYPE_VIGNETTE'"),'L8 must use accepted Loss type visuals.');
assert.ok(renderer.includes('casesRegistry'),'L8 example cases must resolve through the canonical case registry.');
console.log('L8 system-composed gate PASS: six Loss families + 24 Loss types + case examples render dynamically with no full-page Template WebP dependency.');
