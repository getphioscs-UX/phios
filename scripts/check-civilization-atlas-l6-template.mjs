import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const trajectories=json('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json');
const renderer=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const css=read('assets/css/civilization-atlas.css');

const l6=slots.layers.trajectories;
assert.equal(l6.presentationMode,'TEMPLATE_COMPOSITOR');
assert.equal(l6.templateAssetRef,'VIS-B5-ATLAS-L6-TRAJECTORIES-TEMPLATE-BASE.webp');
assert.equal(l6.canonicalObjectKey,'images/figures/books/book-5/VIS-B5-ATLAS-L6-TRAJECTORIES-TEMPLATE-BASE.webp');
assert.equal(l6.rules.templateWebPRequired,true);
assert.equal(l6.rules.trajectoryCountFromRegistry,true);
assert.equal(l6.rules.oneVisualPerTrajectory,true);
assert.equal(l6.rules.graphDynamicSvg,true);
assert.equal(l6.rules.templateContainsData,false);
assert.equal(l6.rules.mobileSemanticReflow,true);
assert.deepEqual(l6.sourceVisualFamilies,['TRAJECTORY_MOTIF']);
assert.ok(l6.slots.trajectoryGraph,'L6 template must own a dynamic graph field.');

const p6=projection.layers.find(x=>x.layerId==='trajectories');
assert.equal(p6.mode,'TEMPLATE_BASE_PLUS_DYNAMIC_OVERLAY');
assert.equal(p6.poster.assetRef,'VIS-B5-ATLAS-L6-TRAJECTORIES-TEMPLATE-BASE.webp');
assert.equal(p6.poster.objectKey,'images/figures/books/book-5/VIS-B5-ATLAS-L6-TRAJECTORIES-TEMPLATE-BASE.webp');
assert.equal(p6.fallback,'REGISTRY_TRAJECTORY_READER');

assert.equal(trajectories.trajectories.length,16,'L6 must retain 16 canonical trajectories.');
assert.ok(renderer.includes('civ-trajectory-panel-grid'),'L6 detail reader must retain all trajectory panels.');
assert.ok(renderer.includes("family==='TRAJECTORY_MOTIF'"),'L6 must retain accepted TRAJECTORY_MOTIF visuals.');
assert.ok(renderer.includes('<polyline class="civ-trajectory-panel__line'),'L6 detail reader must retain dynamic SVG curves.');
assert.ok(renderer.includes('items.map(t=>'),'L6 detail reader must keep all 16 registry trajectories reachable.');
assert.ok(!renderer.includes('trajectory registry'),'L6 customer copy must not expose registry language.');

assert.ok(compositor.includes('data-template-slot="trajectoryGraph"'),'L6 template must project the dynamic graph into its registered field.');
assert.ok(compositor.includes('state.trajectoryIds?.length?state.trajectoryIds.slice(0,4):all.slice(0,1)'),'L6 template must default to one trajectory and cap desktop comparison at four.');
assert.ok(compositor.includes("poster.availability!=='VERIFIED_LIVE_R2'"),'L6 template must remain disabled until the R2 object is live-verified.');
assert.ok(css.includes('CIV-ATLAS-FR4 visual-utilization presentation contract'),'L6 FR4 presentation CSS missing.');

console.log('L6 FR4 template gate PASS: shared presentation frame + 16 semantic motifs + dynamic SVG remain separated, with R2-safe fallback.');
