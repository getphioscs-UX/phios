import assert from 'node:assert/strict';
import {base, readJson, getFixtures, digestObject} from './fdr-check-lib.mjs';
const c=readJson(`${base}/contracts/financial-reality-snapshot-contract-v1.json`), ec=readJson(`${base}/contracts/financial-change-event-contract-v1.json`), types=readJson(`${base}/registries/financial-change-event-type-registry-v1.json`);
assert.deepEqual(c.timepointContract.examples,['t0','t1','t2']); assert.equal(c.rules.appendOnly,true); assert.equal(c.rules.historicalSnapshotImmutable,true); assert.equal(c.rules.silentHistoryMutationAllowed,false); assert.equal(c.rules.snapshotOverwriteAllowed,false); assert.equal(c.rules.priorSnapshotDigestMustMatchPredecessor,true); assert.equal(ec.rules.appendOnly,true); assert.equal(ec.rules.eventMayMutateHistoricalSnapshot,false);
const seenSnapshots=new Set(), seenEvents=new Set(); let t012=false; const eventTypes=new Set();
for(const {scenario,data} of getFixtures()){
 const byId=new Map((data.changeEvents||[]).map(e=>[e.eventId,e]));
 for(let i=0;i<data.snapshots.length;i++){
  const s=data.snapshots[i]; assert.equal(s.sequence,i,`${scenario} snapshot sequence gap`); assert.equal(s.timepoint,`t${i}`,`${scenario} timepoint mismatch`); assert.ok(!seenSnapshots.has(s.snapshotId),`duplicate snapshotId ${s.snapshotId}`);seenSnapshots.add(s.snapshotId); assert.equal(digestObject(s),s.digest,`${scenario} snapshot digest mismatch`); assert.equal(digestObject(s.snapshotPayload),s.snapshotPayload.digest,`${scenario} reality digest mismatch`);
  if(i===0) assert.equal(s.previousSnapshotDigest,null,`${scenario} t0 predecessor must be null`); else {assert.equal(s.previousSnapshotDigest,data.snapshots[i-1].digest,`${scenario} predecessor digest mismatch`);assert.ok(s.financialRealityVersion>data.snapshots[i-1].financialRealityVersion,`${scenario} version must advance`);}
  for(const eid of s.changeEventReferences){const e=byId.get(eid); assert.ok(e,`${scenario} missing event ${eid}`); assert.equal(e.toSnapshotId,s.snapshotId,`${scenario} event target mismatch`); if(i>0)assert.equal(e.fromSnapshotId,data.snapshots[i-1].snapshotId,`${scenario} event source mismatch`);}
 }
 if(data.snapshots.length>=3&&data.snapshots.slice(0,3).map(x=>x.timepoint).join(',')==='t0,t1,t2') t012=true;
 for(const e of data.changeEvents||[]){assert.ok(!seenEvents.has(e.eventId),`duplicate eventId ${e.eventId}`);seenEvents.add(e.eventId); assert.equal(digestObject(e),e.digest,`${scenario} event digest mismatch`); assert.ok(types.eventTypes.includes(e.eventType)); eventTypes.add(e.eventType); assert.equal(e.validationState,'VALIDATED');}
}
assert.equal(t012,true,'No fixture proves t0/t1/t2 history'); assert.deepEqual([...eventTypes].sort(),types.eventTypes.slice().sort(),'W20 event fixture coverage incomplete');
console.log(`✓ FDR versioning passed: immutable t0/t1/t2 chain verified; ${seenSnapshots.size} snapshots and ${seenEvents.size} validated change events are digest-bound and append-only.`);
