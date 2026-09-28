import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const timeline=read('assets/js/pages/civilization-atlas/timeline-renderer.js');
const trajectories=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');

for(const id of ['timeline','trajectories']){
  const slot=slots.layers[id];
  const proj=projection.layers.find(x=>x.layerId===id);
  assert.equal(slot.presentationMode,'STRUCTURED_READER_ONLY',`${id} must be structured-reader-only`);
  assert.equal(slot.rules.customerRuntimeLoadsTemplate,false,`${id} template must not load in customer runtime`);
  assert.equal(slot.rules.templateWebPRequired,false,`${id} template must not be required`);
  assert.ok(!slot.templateAssetRef,`${id} active templateAssetRef must be removed`);
  assert.ok(!slot.canonicalObjectKey,`${id} active canonicalObjectKey must be removed`);
  assert.equal(proj.mode,'STRUCTURED_READER_ONLY',`${id} projection mode must be structured-reader-only`);
  assert.ok(!proj.poster,`${id} active poster must be removed`);
  assert.equal(proj.archivedPoster?.customerRuntime,false,`${id} archived poster must be non-runtime only`);
}
assert.ok(compositor.includes("config?.mode==='STRUCTURED_READER_ONLY'"),'Projection runtime must hard-bypass template rendering for structured-reader-only layers.');
assert.ok(shell.includes("structuredReaderOnly=presentationMode==='STRUCTURED_READER_ONLY'"),'Shell must promote structured readers to direct primary content.');
assert.ok(shell.includes('civ-structured-reader-primary'),'Structured-reader-only layers must render directly, not inside template controls.');
assert.ok(timeline.includes('civ-timeline__focus--reader'),'L2 timeline reader missing.');
assert.ok(timeline.includes('civ-timeline__track'),'L2 period navigator missing.');
assert.ok(trajectories.includes('civ-trajectory-panel-grid'),'L6 trajectory reader missing.');
assert.ok(trajectories.includes('<polyline class="civ-trajectory-panel__line'),'L6 dynamic SVG graph missing.');
assert.ok(trajectories.includes("data-trajectory-overview"),'L6 back-to-overview control missing.');

console.log('CIV-ATLAS-FR5-J PASS: L2/L6 template bases are removed from customer runtime; structured HTML/SVG readers are the only active presentation owners.');
