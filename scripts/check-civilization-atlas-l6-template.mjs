import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const trajectories=json('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const css=read('assets/css/civilization-atlas.css');

const l6=slots.layers.trajectories;
assert.equal(l6.presentationMode,'TEMPLATE_COMPOSITOR');
assert.equal(l6.templateAssetRef,'VIS-B5-ATLAS-L6-TRAJECTORIES.webp');
assert.equal(l6.rules.currentWebPReusableAsTemplate,true);
assert.equal(l6.rules.regenerateTemplateBaseRequired,false);
assert.equal(l6.rules.graphOnlyDynamic,true);
assert.deepEqual(l6.dynamicOverlay,['trajectoryGraph']);
assert.equal(l6.rules.staticGraphPixelsMaskedBeforeDynamicOverlay,true);

const p6=projection.layers.find(x=>x.layerId==='trajectories');
assert.equal(p6.mode,'TEMPLATE_BASE_PLUS_DYNAMIC_OVERLAY');
assert.equal(p6.poster.assetRef,'VIS-B5-ATLAS-L6-TRAJECTORIES.webp');

assert.equal(trajectories.trajectories.length,16,'L6 must retain 16 canonical trajectories.');
assert.ok(compositor.includes('function trajectoryOverlay'),'L6 trajectory overlay missing.');
assert.ok(compositor.includes("authority==='CONCEPTUAL_TRAJECTORY'"),'Conceptual trajectory line style missing.');
assert.ok(compositor.includes("authority==='HISTORICAL_RECONSTRUCTION'"),'Historical reconstruction line style missing.');
assert.ok(compositor.includes('data-template-slot="trajectoryGraph"'),'L6 must write only into the registered graph slot.');
assert.ok(css.includes('.civ-template-slot--trajectory{'),'L6 graph mask missing.');
assert.ok(css.includes('.civ-template-trajectory-line.is-reconstructed'),'L6 reconstructed line style missing.');
assert.ok(css.includes('.civ-template-trajectory-line.is-conceptual'),'L6 conceptual line style missing.');

console.log('L6 template gate PASS: existing trajectory WebP remains the layout template and only the registered graph slot is dynamically redrawn.');
