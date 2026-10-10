import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const timeline=read('assets/js/pages/civilization-atlas/timeline-renderer.js');
const trajectories=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');
const css=read('assets/css/civilization-atlas.css');
const evidence=json('content/civilization-atlas/evidence/civ-atlas-fr5-i-template-decomposition-v1.json');

assert.equal(evidence.status,'IMPLEMENTED_READY_FOR_HUMAN_REVIEW');

for(const id of ['timeline','trajectories']){
  assert.equal(slots.layers[id].presentationMode,'ATMOSPHERE_PLUS_STRUCTURED_READER',`${id} template contract must be atmosphere + reader`);
  assert.deepEqual(slots.layers[id].dynamicOverlay,[],`${id} must not inject dynamic content into template geometry`);
  assert.equal(slots.layers[id].rules.templateAsAtmosphereOnly,true);
  assert.equal(slots.layers[id].rules.structuredReaderOwnsPrimaryContent,true);
  const p=projection.layers.find(x=>x.layerId===id);
  assert.equal(p.mode,'ATMOSPHERE_PLUS_STRUCTURED_READER');
  assert.equal(p.interactiveRegions,'NONE_TEMPLATE_IS_ATMOSPHERE_ONLY');
  assert.equal(p.primaryContent,'STRUCTURED_HTML_SVG_READER');
}
assert.ok(compositor.includes('civ-template-atmosphere'),'Atmosphere-only template renderer missing.');
assert.ok(compositor.includes("config.mode==='ATMOSPHERE_PLUS_STRUCTURED_READER'"),'Atmosphere decomposition branch missing.');
assert.ok(timeline.includes('civ-timeline__focus--reader'),'L2 structured timeline reader must remain primary.');
assert.ok(timeline.includes('civ-timeline__navigator'),'L2 period navigator must remain available.');
assert.ok(trajectories.includes("const displayItems=focusedId?items.filter"),'L6 detail must show only the selected trajectory.');
assert.ok(trajectories.includes("data-trajectory-overview"),'L6 must provide a route back to the 16-trajectory overview.');
assert.ok(trajectories.includes("is-detail"),'L6 detail mode class missing.');
assert.ok(css.includes('CIV-ATLAS-FR5-I template decomposition'),'FR5-I CSS missing.');
assert.ok(css.includes('.civ-template-atmosphere{'),'Atmosphere header styling missing.');
assert.ok(css.includes('.civ-trajectory-panel-grid.is-detail'),'Independent L6 analytical detail layout missing.');

console.log('CIV-ATLAS-FR5-I PASS: L2/L6 templates are atmosphere-only and structured HTML/SVG readers own the primary customer experience.');
