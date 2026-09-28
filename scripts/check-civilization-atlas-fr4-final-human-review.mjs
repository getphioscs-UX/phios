import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const review=json('content/civilization-atlas/evidence/civ-atlas-fr4-final-human-review-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const coverage=json('content/civilization-atlas/evidence/civ-atlas-fr4-visual-utilization-coverage-v1.json');
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const staticVisual=read('assets/js/pages/civilization-atlas/atlas-static-visual.js');

assert.equal(review.status,'READY_FOR_HUMAN_REVIEW');
assert.equal(review.implementation.l2Template,'VERIFIED_LIVE_R2');
assert.equal(review.implementation.l5Template,'VERIFIED_LIVE_R2');
assert.equal(review.implementation.l6Template,'VERIFIED_LIVE_R2');
assert.equal(review.implementation.semanticVisualAssets.registered,392);
assert.equal(review.implementation.semanticVisualAssets.reachability,'392/392');
assert.equal(review.implementation.genericVisualLibrary,'REMOVED');
assert.equal(review.productionVisualAcceptance,'PENDING_OWNER_DECISION');

for(const id of ['L2_DESKTOP','L2_MOBILE','L5_DESKTOP','L5_MOBILE','L6_DESKTOP','L6_MOBILE']){
  assert.ok(review.reviewTargets.some(x=>x.id===id),`Missing human review target: ${id}`);
}
for(const key of ['l2Desktop','l2Mobile','l5Desktop','l5Mobile','l6Desktop','l6Mobile']){
  assert.equal(review.gates[key],'PENDING_OWNER_DECISION',`${key} must remain pending until explicit owner review`);
}

const templateRefs=[
  ['timeline','VIS-B5-ATLAS-L2-TIMELINE-TEMPLATE-BASE.webp'],
  ['world','VIS-B5-ATLAS-L5-TEMPLATE-BASE.webp'],
  ['trajectories','VIS-B5-ATLAS-L6-TRAJECTORIES-TEMPLATE-BASE.webp']
];
for(const [layer,ref] of templateRefs){
  const p=projection.layers.find(x=>x.layerId===layer);
  assert.ok(p?.poster,`Missing poster for ${layer}`);
  assert.equal(p.poster.assetRef,ref);
  assert.equal(p.poster.availability,'VERIFIED_LIVE_R2',`${layer} template must be verified live`);
}

assert.equal(coverage.totalAssets,392);
assert.equal(coverage.unreachable,0);
for(const token of ['Visual Library','视觉资料库','More related visuals and full library','更多相关视觉与完整图库']){
  assert.ok(!shell.includes(token)&&!staticVisual.includes(token),`Generic gallery UI leaked: ${token}`);
}

console.log('CIV-ATLAS-FR4 final human-review readiness PASS: L2/L5/L6 live templates verified, 392/392 visuals reachable, gallery removed, owner decision still pending.');
