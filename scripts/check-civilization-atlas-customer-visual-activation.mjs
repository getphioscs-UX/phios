import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const bindings=json('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json');
const expected={
 TIMELINE_ANCHOR:20,CASE_HERO:120,CASE_SECONDARY:64,WORLD_SNAPSHOT_ATMOSPHERE:15,
 COMPARISON_FAMILY:6,TRAJECTORY_MOTIF:16,TRANSITION_WINDOW:32,SCALE_SHIFT:7,
 LOSS_FAMILY:6,LOSS_TYPE_VIGNETTE:24,CIVILIZATION_INFRASTRUCTURE:20,
 GEOGRAPHIC_BASE:10,HISTORICAL_FIGURE:16,MODERN_FLAG:24,WORLD_RECONFIGURATION_SNAPSHOT:12
};
assert.equal(bindings.status,'VERIFIED_DELIVERY_OWNER_ACCEPTED');
assert.equal(bindings.assets.length,392);
for(const [family,count] of Object.entries(expected)){
 assert.equal(bindings.assets.filter(a=>a.family===family).length,count,`${family} count mismatch`);
}
for(const a of bindings.assets){
 assert.equal(a.bindingState,'BOUND',`${a.assetId} not bound`);
 assert.equal(a.reviewState,'ACCEPTED',`${a.assetId} not accepted`);
 assert.equal(a.deliveryVerified,true,`${a.assetId} delivery not verified`);
 assert.equal(a.ownerUploadConfirmed,true,`${a.assetId} owner upload not confirmed`);
}

const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
for(const label of ['Timeline','World','Civilizations','Compare','Reconfiguration']) assert.ok(shell.includes(label),`Missing customer entry: ${label}`);
assert.ok(shell.includes("const CIVILIZATION_VIEWS=['cases','trajectories','transitions','loss']"));
assert.ok(shell.includes("href:'/books/reality-configuration/#atlas'"));

const visual=read('assets/js/pages/civilization-atlas/atlas-static-visual.js');
for(const token of ['period?.caseIds','snapshot?.majorCaseIds','family?.caseIds','trajectory?.relatedCases','transition?.relatedCases','lossType.exampleCaseIds']) assert.ok(visual.includes(token),`Missing context relation: ${token}`);
assert.ok(visual.includes("WORLD_SNAPSHOT_ATMOSPHERE"));
assert.ok(visual.includes("COMPARISON_FAMILY"));
assert.ok(visual.includes("Visual Library"));
assert.ok(visual.includes("392")===false,'Do not hardcode 392 in runtime UI; count must come from bindings.');

const reconfig=read('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
assert.ok(reconfig.includes("a.family==='WORLD_RECONFIGURATION_SNAPSHOT'"),'Book VI visual library must be scoped to reconfiguration snapshots.');

const snapshots=json('content/civilization-atlas/reconfiguration/world-reconfiguration-snapshots-v1.json');
assert.equal(snapshots.snapshots.length,12);
for(const s of snapshots.snapshots){
 assert.equal(s.visualAssetId,s.id);
 assert.equal(s.asset?.resolutionStatus,'PRESENT');
 assert.ok(bindings.assets.some(a=>a.family==='WORLD_RECONFIGURATION_SNAPSHOT'&&a.assetId===s.id),`Missing bound Book VI snapshot: ${s.id}`);
}

console.log('Civilization Atlas customer IA + 392 visual activation gate PASS.');
