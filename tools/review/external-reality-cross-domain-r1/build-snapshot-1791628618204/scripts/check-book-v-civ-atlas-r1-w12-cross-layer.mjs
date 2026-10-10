import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reconcileAtlasContextForLayer,atlasContextSummary} from '../assets/js/pages/civilization-atlas/cross-layer-context.js';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data={
  timeline:json('content/civilization-atlas/timeline/timeline-periods-v1.json'),
  cases:json('content/civilization-atlas/cases/civilization-case-registry-v1.json'),
  comparison:json('content/civilization-atlas/comparison/comparison-families-v1.json'),
  world:json('content/civilization-atlas/snapshots/world-snapshots-v1.json'),
  trajectories:json('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json'),
  transitions:json('content/civilization-atlas/transitions/transition-windows-v1.json'),
  loss:json('content/civilization-atlas/loss/reversal-loss-atlas-v1.json')
};
const preserved={primaryCaseId:'CA-T09-01',caseIds:['CA-T09-01'],compareBasket:['CA-T09-01','CA-T06-02'],time:null,timeWindowId:null,snapshotId:null,comparisonFamilyId:null,trajectoryIds:[],transitionWindowId:null,lossFamilyId:null,lossTypeId:null};
const timeline=reconcileAtlasContextForLayer('timeline',preserved,data);assert.equal(timeline.activeLayer,'timeline');assert.ok(timeline.timeWindowId);assert.deepEqual(preserved.compareBasket,['CA-T09-01','CA-T06-02']);
const comparison=reconcileAtlasContextForLayer('comparison',preserved,data);assert.equal(comparison.comparisonFamilyId,'COMMERCIAL_NETWORK');
const world=reconcileAtlasContextForLayer('world',preserved,data);assert.equal(world.snapshotId,'WS-1000');
const trajectories=reconcileAtlasContextForLayer('trajectories',preserved,data);assert.ok(trajectories.trajectoryIds.length>=1&&trajectories.trajectoryIds.length<=3);assert.ok(trajectories.trajectoryIds.includes('URBAN_DENSITY')||trajectories.trajectoryIds.includes('KNOWLEDGE_PARTICIPATION'));
const brit={...preserved,primaryCaseId:'CA-T13-01',caseIds:['CA-T13-01']};
const transition=reconcileAtlasContextForLayer('transitions',brit,data);assert.equal(transition.transitionWindowId,'TW-23');
const loss=reconcileAtlasContextForLayer('loss',brit,data);assert.equal(loss.lossTypeId,'LOSS-FORM-TRANSFORMATION');assert.ok(loss.lossFamilyId);
const already={...brit,comparisonFamilyId:'MARITIME_CIVILIZATION',snapshotId:'WS-1850',trajectoryIds:['ENERGY'],transitionWindowId:'TW-23',lossFamilyId:'SUCCESSION_ABSORPTION_FUTURE',lossTypeId:'LOSS-PARTIAL-CONTINUATION'};
assert.equal(reconcileAtlasContextForLayer('comparison',already,data).comparisonFamilyId,undefined,'existing comparison context must not be overwritten');
assert.equal(reconcileAtlasContextForLayer('world',already,data).snapshotId,undefined,'existing snapshot must not be overwritten');
assert.equal(reconcileAtlasContextForLayer('trajectories',already,data).trajectoryIds,undefined,'existing trajectory selection must not be overwritten');
const summary=atlasContextSummary({...preserved,activeLayer:'cases'},data,'zh-Hans');assert.match(summary,/CA-T09-01/);assert.match(summary,/Layer=cases/);
console.log('✓ BOOK-V-CIV-ATLAS-R1-W12 Cross-Layer Shared Context passed.');
console.log('  Case context can seed Timeline, Comparison, World, Trajectory, Transition and Loss views without overwriting existing user selections.');
