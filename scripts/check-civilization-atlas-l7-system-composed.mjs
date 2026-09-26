import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const registry=json('content/civilization-atlas/transitions/transition-windows-v1.json');
const renderer=read('assets/js/pages/civilization-atlas/transition-renderer.js');

const l7=slots.layers.transitions;
assert.equal(l7.presentationMode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.equal(l7.rules.templateWebPRequired,false);
assert.deepEqual(l7.sourceVisualFamilies,['TRANSITION_WINDOW','SCALE_SHIFT']);

const p7=projection.layers.find(x=>x.layerId==='transitions');
assert.equal(p7.mode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.ok(!Object.prototype.hasOwnProperty.call(p7,'poster'),'L7 must not retain a required template poster.');

assert.equal(registry.transitionWindows.length,32,'L7 must retain 32 transition windows.');
assert.equal(registry.scaleShifts.length,7,'L7 must retain seven civilization scale shifts.');
assert.ok(renderer.includes("'TRANSITION_WINDOW'"),'L7 must use accepted transition-window visuals.');
assert.ok(renderer.includes("'SCALE_SHIFT'"),'L7 must use accepted scale-shift visuals.');
assert.ok(renderer.includes('civ-transition-story'),'L7 must render the transition story dynamically.');
assert.ok(renderer.includes('civ-scale-shift-card'),'L7 must render scale shifts as dynamic visual cards.');
console.log('L7 system-composed gate PASS: 32 transition windows + 7 scale shifts render dynamically with no full-page Template WebP dependency.');
