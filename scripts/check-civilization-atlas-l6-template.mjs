import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const trajectories=json('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json');
const renderer=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');
const css=read('assets/css/civilization-atlas.css');

const l6=slots.layers.trajectories;
assert.equal(l6.presentationMode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.equal(l6.rules.templateWebPRequired,false);
assert.equal(l6.rules.overviewPosterOptional,true);
assert.equal(l6.rules.trajectoryCountFromRegistry,true);
assert.equal(l6.rules.oneVisualPerTrajectory,true);
assert.equal(l6.rules.graphDynamicSvg,true);
assert.deepEqual(l6.sourceVisualFamilies,['TRAJECTORY_MOTIF']);

const p6=projection.layers.find(x=>x.layerId==='trajectories');
assert.equal(p6.mode,'SYSTEM_COMPOSED_FROM_ASSETS');
assert.ok(!Object.prototype.hasOwnProperty.call(p6,'poster'),'L6 must not retain a required template poster.');
assert.equal(p6.optionalOverviewAssetRef,'VIS-B5-ATLAS-L6-TRAJECTORIES.webp');

assert.equal(trajectories.trajectories.length,16,'L6 must retain 16 canonical trajectories.');
assert.ok(renderer.includes('civ-trajectory-panel-grid'),'L6 must render all trajectories as visual panels.');
assert.ok(renderer.includes("family==='TRAJECTORY_MOTIF'"),'L6 must use accepted TRAJECTORY_MOTIF visuals.');
assert.ok(renderer.includes('<polyline class="civ-trajectory-panel__line'),'L6 must render dynamic SVG curves.');
assert.ok(renderer.includes("authorityClass==='CONCEPTUAL_TRAJECTORY'"),'L6 conceptual line authority missing.');
assert.ok(renderer.includes("authorityClass==='HISTORICAL_RECONSTRUCTION'"),'L6 reconstruction line authority missing.');
assert.ok(renderer.includes('items.map(t=>'),'L6 must project all registry trajectories, not a five-item subset.');
assert.ok(!renderer.includes('slice(0,5)'),'L6 must not regress to the old five-trajectory picker.');

assert.ok(css.includes('L6 system-composed trajectory panels'),'L6 panel CSS missing.');
assert.ok(css.includes('.civ-trajectory-panel__graph{position:absolute'),'L6 graph must overlay each visual asset.');
assert.ok(css.includes('.civ-trajectory-panel__line.is-conceptual'),'L6 conceptual graph style missing.');
assert.ok(css.includes('.civ-trajectory-panel__line.is-reconstructed'),'L6 reconstructed graph style missing.');

console.log('L6 system-composed gate PASS: all 16 trajectory motif assets drive runtime panels with Registry-backed dynamic SVG curves.');
