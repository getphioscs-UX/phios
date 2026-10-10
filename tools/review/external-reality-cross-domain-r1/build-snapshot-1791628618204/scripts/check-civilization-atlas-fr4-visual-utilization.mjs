import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const bindings=json('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json');
const coverage=json('content/civilization-atlas/evidence/civ-atlas-fr4-visual-utilization-coverage-v1.json');
const decision=json('content/civilization-atlas/evidence/civ-atlas-fr4-visual-utilization-owner-decision-v1.json');
const slots=json('content/civilization-atlas/visuals/atlas-layer-template-slots-v1.json');
const projection=json('content/civilization-atlas/visuals/atlas-visual-projection-v1.json');
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const staticVisual=read('assets/js/pages/civilization-atlas/atlas-static-visual.js');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const trajectories=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');

const expected={
  TIMELINE_ANCHOR:20,CASE_HERO:120,CASE_SECONDARY:64,WORLD_SNAPSHOT_ATMOSPHERE:15,
  COMPARISON_FAMILY:6,TRAJECTORY_MOTIF:16,TRANSITION_WINDOW:32,SCALE_SHIFT:7,
  LOSS_FAMILY:6,LOSS_TYPE_VIGNETTE:24,CIVILIZATION_INFRASTRUCTURE:20,
  GEOGRAPHIC_BASE:10,HISTORICAL_FIGURE:16,MODERN_FLAG:24,WORLD_RECONFIGURATION_SNAPSHOT:12
};

assert.equal(decision.status,'OWNER_ACCEPTED_DIRECTION');
assert.equal(decision.decisions.massRedrawRequired,false);
assert.equal(decision.decisions.registeredAssetCount,392);
assert.equal(decision.decisions.genericVisualLibraryCustomerEntry,false);
assert.equal(decision.decisions.templateAssetsSeparateFromSemanticRegistry,true);

assert.equal(bindings.assets.length,392,'Canonical visual registry must retain all 392 assets.');
assert.equal(coverage.totalAssets,392);
assert.equal(coverage.unreachable,0,'No registered visual may be semantically unreachable.');
assert.equal(coverage.assets.length,392);

const ids=bindings.assets.map(a=>a.assetId);
assert.equal(new Set(ids).size,ids.length,'Duplicate visual assetId detected.');
const coverageIds=new Set(coverage.assets.map(a=>a.assetId));
for(const id of ids) assert.ok(coverageIds.has(id),`Coverage missing ${id}`);

const counts={};
for(const a of bindings.assets) counts[a.family]=(counts[a.family]||0)+1;
assert.deepEqual(counts,expected,'Visual family inventory drifted from the accepted 392-asset baseline.');

for(const row of coverage.assets){
  assert.notEqual(row.reachability,'UNREACHABLE',`${row.assetId} is unreachable`);
  assert.ok(row.customerSurface&&row.resolvedBy,`${row.assetId} missing presentation path`);
}

for(const token of [
  'More related visuals and full library','更多相关视觉与完整图库',
  'Visual Library','视觉资料库','data-atlas-visual-family','data-atlas-visual-choice'
]){
  assert.ok(!shell.includes(token)&&!staticVisual.includes(token),`Generic visual-library customer UI leaked: ${token}`);
}

const l6=slots.layers.trajectories;
assert.equal(l6.presentationMode,'STRUCTURED_READER_ONLY');
assert.equal(l6.rules.customerRuntimeLoadsTemplate,false);
assert.equal(l6.rules.graphDynamicSvg,true);
assert.deepEqual(l6.sourceVisualFamilies,['TRAJECTORY_MOTIF']);

const p6=projection.layers.find(x=>x.layerId==='trajectories');
assert.equal(p6.mode,'STRUCTURED_READER_ONLY');
assert.ok(!p6.poster,'L6 template poster must not be active in customer runtime.');
assert.equal(p6.archivedPoster?.customerRuntime,false,'Archived L6 template may remain only as non-runtime history.');

assert.ok(!trajectories.includes('trajectory registry'),'Raw trajectory registry language must not appear in customer copy.');
assert.ok(trajectories.includes('观测资料')&&trajectories.includes('Observed evidence'),'Evidence class labels must be human-readable.');
assert.ok(shell.includes('浏览其他长时段轨迹')&&shell.includes('Explore other long trends'),'L6 reader navigation must be customer-facing.');

console.log('CIV-ATLAS-FR4 visual utilization PASS: 392/392 assets have semantic presentation paths, generic gallery UI is removed, and L6 now uses the structured reader without a customer template poster.');
