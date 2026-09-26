import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const rejection=json('content/civilization-atlas/evidence/b6-web-fr2-human-rejection-v1.json');
const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const page=read('assets/js/pages/civilization-atlas.js');
const css=read('assets/css/civilization-atlas.css');

assert.equal(rejection.status,'HUMAN_REJECTED');
assert.equal(rejection.successor,'B6-WEB-FR3-TEMPLATE-COMPOSITOR');
assert.equal(slots.status,'OWNER_AUTHORED_FR3');
assert.equal(slots.coordinateSystem,'NORMALIZED_0_TO_1');
assert.equal(slots.authority.runtimeGeometryInferenceAllowed,false);
assert.equal(slots.authority.ocrWriteBackAllowed,false);
assert.equal(slots.authority.registryRemainsDataAuthority,true);

for(const layer of ['timeline','cases','comparison','world','trajectories','transitions','loss']){
  const slotLayer=slots.layers[layer];
  const projectionLayer=(projection.layers||[]).find(x=>x.layerId===layer);
  assert.ok(slotLayer,`Missing FR3 presentation layer: ${layer}`);
  assert.ok(projectionLayer,`Projection missing presentation layer: ${layer}`);
  if(slotLayer.presentationMode==='SYSTEM_COMPOSED_FROM_ASSETS'){
    assert.equal(projectionLayer.mode,'SYSTEM_COMPOSED_FROM_ASSETS',`${layer} projection mode drift`);
    assert.ok(Array.isArray(slotLayer.sourceVisualFamilies)&&slotLayer.sourceVisualFamilies.length>0,`${layer} missing source visual families`);
  }else{
    assert.ok(slotLayer.referenceSize?.width>0&&slotLayer.referenceSize?.height>0,`Missing reference geometry: ${layer}`);
  }
}
const trajectoryLayer=slots.layers.trajectories;
if(trajectoryLayer.presentationMode==='TEMPLATE_COMPOSITOR'){
  const graph=trajectoryLayer.slots?.trajectoryGraph;
  assert.ok(graph,'Template-composed L6 must define trajectoryGraph.');
  for(const key of ['left','top','width','height']) assert.ok(Number.isFinite(graph[key])&&graph[key]>=0&&graph[key]<=1,`Invalid trajectoryGraph ${key}`);
  assert.ok(trajectoryLayer.dynamicOverlay?.includes('trajectoryGraph'),'Template-composed L6 must explicitly admit dynamic trajectoryGraph overlay.');
}else{
  assert.equal(trajectoryLayer.presentationMode,'SYSTEM_COMPOSED_FROM_ASSETS','L6 presentation mode drift.');
  assert.equal(trajectoryLayer.rules?.templateWebPRequired,false,'System-composed L6 must not require a template WebP.');
}

assert.ok(compositor.includes('function trajectoryOverlay'),'FR3 compositor must implement dynamic L6 graph overlay.');
if(slots.layers.trajectories.presentationMode==='TEMPLATE_COMPOSITOR'){
  assert.ok(compositor.includes('data-template-slot="trajectoryGraph"'),'L6 overlay must target the registered graph slot.');
}
assert.ok(compositor.includes('slotStyle(slot)'),'Dynamic overlay must use registered normalized slot geometry.');
assert.ok(compositor.includes('posterFor(config,state)'),'Compositor must use existing visual projection owner.');
assert.ok(!compositor.toLowerCase().includes('ocr'),'Compositor must not use OCR.');

const templateIndex=shell.indexOf('data-atlas-template-projection');
const controlsIndex=shell.indexOf('civ-template-controls');
assert.ok(templateIndex>=0&&controlsIndex>templateIndex,'Library template must render before interactive fallback controls.');
assert.ok(shell.includes('Open interactive data and controls')||shell.includes('打开互动资料与控制'));

assert.ok(page.includes("renderAtlasVisualProjection(root.querySelector('[data-atlas-template-projection]')"),'Atlas page must render the FR3 compositor.');
assert.ok(page.includes('atlas-layer-template-slots-v1.json'),'Atlas page must load the owner-authored slot contract.');
assert.ok(page.includes("root.dataset.atlasProjection='LIBRARY_TEMPLATE_COMPOSITOR'"),'Atlas runtime must identify the FR3 projection mode.');

assert.ok(css.includes('FR3 Library template compositor'),'FR3 compositor CSS missing.');
assert.ok(css.includes('.civ-template-slot{position:absolute'),'Dynamic slots must be absolute overlays inside the template.');
assert.ok(css.includes('.civ-template-trajectory-line'),'L6 dynamic graph styling missing.');
assert.ok(css.includes('width:max(100%,64rem)'),'Responsive template must preserve readable desktop composition instead of squeezing to mobile width.');

console.log('B6-WEB-FR3 template compositor gate PASS: Library L2–L8 layouts are primary templates and L6 owns a registered dynamic graph slot.');
