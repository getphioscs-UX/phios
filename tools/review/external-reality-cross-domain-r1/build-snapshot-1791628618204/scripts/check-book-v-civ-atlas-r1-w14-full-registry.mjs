import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));

const timeline=read('content/civilization-atlas/timeline/timeline-periods-v1.json');
const cases=read('content/civilization-atlas/cases/civilization-case-registry-v1.json');
const comparison=read('content/civilization-atlas/comparison/comparison-families-v1.json');
const snapshots=read('content/civilization-atlas/snapshots/world-snapshots-v1.json');
const trajectories=read('content/civilization-atlas/trajectories/long-duration-trajectories-v1.json');
const transitions=read('content/civilization-atlas/transitions/transition-windows-v1.json');
const loss=read('content/civilization-atlas/loss/reversal-loss-atlas-v1.json');

assert.equal(timeline.status,'ACTIVE');
assert.equal(cases.status,'ACTIVE');
assert.equal(comparison.status,'ACTIVE');
assert.equal(snapshots.status,'ACTIVE');
assert.equal(trajectories.status,'ACTIVE');
assert.equal(transitions.status,'ACTIVE');
assert.equal(loss.status,'ACTIVE');

assert.equal(timeline.periods.length,20,'W14 requires T00–T19');
assert.equal(cases.cases.length,120,'W14 requires exactly 120 civilization cases');
assert.equal(comparison.families.length,6,'W14 requires six comparison families');
assert.equal(snapshots.snapshots.length,15,'W14 requires exactly 15 world snapshots');
assert.equal(trajectories.trajectories.length,16,'W14 requires exactly 16 long-duration trajectories');
assert.equal(transitions.transitionWindows.length,32,'W14 requires exactly 32 transition windows');
assert.equal(transitions.scaleShifts.length,7,'W14 requires seven civilization scale shifts');
assert.equal(loss.families.length,6,'W14 requires six loss families');
assert.equal(loss.lossTypes.length,24,'W14 requires exactly 24 loss types');
assert.ok(loss.caseProfiles.length>=24,'W14 requires profile coverage for all 24 loss types');

const caseIds=new Set(cases.cases.map(x=>x.caseId));
const snapshotIds=new Set(snapshots.snapshots.map(x=>x.snapshotId));
const trajectoryIds=new Set(trajectories.trajectories.map(x=>x.trajectoryId));
const transitionIds=new Set(transitions.transitionWindows.map(x=>x.transitionWindowId));
const lossTypeIds=new Set(loss.lossTypes.map(x=>x.lossTypeId));
const lossFamilyIds=new Set(loss.families.map(x=>x.familyId));

assert.equal(caseIds.size,120,'duplicate case ID');
assert.equal(snapshotIds.size,15,'duplicate snapshot ID');
assert.equal(trajectoryIds.size,16,'duplicate trajectory ID');
assert.equal(transitionIds.size,32,'duplicate transition ID');
assert.equal(lossTypeIds.size,24,'duplicate loss type ID');

const comparisonFamilyIds=new Set(comparison.families.map(x=>x.familyId));
assert.equal(comparisonFamilyIds.size,6,'duplicate comparison family ID');
for(const p of timeline.periods){
  assert.equal(p.caseIds.length,6,`${p.periodId} must expose six full-registry cases`);
  for(const id of p.caseIds) assert.ok(caseIds.has(id),`${p.periodId} dangling case ${id}`);
  for(const id of p.snapshotIds) assert.ok(snapshotIds.has(id),`${p.periodId} dangling snapshot ${id}`);
  for(const id of p.transitionWindowIds) assert.ok(transitionIds.has(id),`${p.periodId} dangling transition ${id}`);
}
const comparedCases=new Set();
for(const f of comparison.families){
  assert.ok(f.caseIds.length>=1,`${f.familyId} has no cases`);
  for(const id of f.caseIds){ assert.ok(caseIds.has(id),`${f.familyId} dangling case ${id}`); comparedCases.add(id); }
  for(const r of f.crossFamilyRelations) assert.ok(comparisonFamilyIds.has(r.targetFamilyId),`${f.familyId} dangling family relation ${r.targetFamilyId}`);
}
for(const id of caseIds) assert.ok(comparedCases.has(id),`${id} is not reachable from any comparison family`);

for(let i=0;i<20;i++){
  const prefix=`CA-T${String(i).padStart(2,'0')}-`;
  assert.equal([...caseIds].filter(id=>id.startsWith(prefix)).length,6,`W14 requires six cases for T${String(i).padStart(2,'0')}`);
}
const requiredSnapshots=['WS-M3000','WS-M1500','WS-M0500','WS-0001','WS-0500','WS-1000','WS-1250','WS-1500','WS-1750','WS-1850','WS-1914','WS-1945','WS-1980','WS-2000','WS-2026'];
assert.deepEqual([...snapshotIds].sort(),requiredSnapshots.sort());

for(let i=1;i<=32;i++) assert.ok(transitionIds.has(`TW-${String(i).padStart(2,'0')}`),`missing TW-${String(i).padStart(2,'0')}`);

for(const c of cases.cases){
  assert.ok(c.title?.en&&c.title?.['zh-Hans'],`${c.caseId} missing bilingual title`);
  assert.ok(c.unknown?.state,`${c.caseId} missing unknown state`);
  for(const id of c.transitionWindows) assert.ok(transitionIds.has(id),`${c.caseId} dangling transition ${id}`);
  for(const id of c.relatedCases) assert.ok(caseIds.has(id),`${c.caseId} dangling related case ${id}`);
  for(const id of c.snapshots) assert.ok(snapshotIds.has(id),`${c.caseId} dangling snapshot ${id}`);
}
for(const s of snapshots.snapshots){
  assert.ok(s.title?.en&&s.title?.['zh-Hans'],`${s.snapshotId} missing bilingual title`);
  assert.ok(s.posterAssetRef?.startsWith('VIS-B5-ATLAS-'),`${s.snapshotId} missing stable visual ref`);
  for(const id of s.majorCaseIds) assert.ok(caseIds.has(id),`${s.snapshotId} dangling case ${id}`);
  for(const id of s.transitionWindows) assert.ok(transitionIds.has(id),`${s.snapshotId} dangling transition ${id}`);
}
for(const t of trajectories.trajectories){
  assert.ok(['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY'].includes(t.authorityClass),`${t.trajectoryId} invalid authority`);
  for(const id of t.relatedCases) assert.ok(caseIds.has(id),`${t.trajectoryId} dangling case ${id}`);
  for(const id of t.relatedTransitions) assert.ok(transitionIds.has(id),`${t.trajectoryId} dangling transition ${id}`);
}
for(const w of transitions.transitionWindows){
  for(const id of w.relatedCases) assert.ok(caseIds.has(id),`${w.transitionWindowId} dangling case ${id}`);
  for(const id of w.relatedTrajectories) assert.ok(trajectoryIds.has(id),`${w.transitionWindowId} dangling trajectory ${id}`);
}
for(const t of loss.lossTypes){
  assert.ok(lossFamilyIds.has(t.familyId),`${t.lossTypeId} dangling family`);
  assert.ok(t.exampleCaseIds.length>=1,`${t.lossTypeId} requires representative case coverage`);
  for(const id of t.exampleCaseIds) assert.ok(caseIds.has(id),`${t.lossTypeId} dangling example case ${id}`);
}
for(const p of loss.caseProfiles){
  assert.ok(caseIds.has(p.caseId),`loss profile dangling case ${p.caseId}`);
  assert.ok(lossTypeIds.has(p.lossTypeId),`loss profile dangling type ${p.lossTypeId}`);
}
for(const id of lossTypeIds) assert.ok(loss.caseProfiles.some(p=>p.lossTypeId===id),`${id} lacks case-profile coverage`);

const ws2026=snapshots.snapshots.find(x=>x.snapshotId==='WS-2026');
assert.equal(ws2026.unknown.state,'PARTIAL','WS-2026 must remain an open historical window');
const tw32=transitions.transitionWindows.find(x=>x.transitionWindowId==='TW-32');
assert.equal(tw32.authorityClass,'CONCEPTUAL_TRAJECTORY','TW-32 must remain conceptual');
assert.equal(tw32.unknown.state,'PARTIAL','TW-32 must remain partial/open');
assert.ok(transitions.scaleShifts.some(x=>x.status==='OPEN'&&x.transitionWindowIds.includes('TW-32')),'TW-32 must remain in OPEN scale shift');

const all=JSON.stringify({cases,snapshots,trajectories,transitions,loss});
for(const forbidden of ['civilizationScore','collapseScore','superiorityScore','overallWinner','declineScore']) assert.ok(!all.includes(`"${forbidden}"`),`forbidden score field ${forbidden}`);

console.log('✓ BOOK-V-CIV-ATLAS-R1-W14 Full Registry Expansion passed.');
console.log('  120 Cases · 15 World Snapshots · 16 Trajectories · 32 Transition Windows · 24 Loss Types');
console.log('  Cross-registry references close; 2026 / TW-32 remain open; no civilization ranking score is introduced.');
