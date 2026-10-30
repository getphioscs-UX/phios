import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const recordPath='docs/commerce/economics-20261009/bazi-numerology-shared-owner-successor-v4.json';
const registryPath='functions/canonical-presentation-runtime/report-editorial-registry.js';
const assetsPath='content/reports/shared/report-visual-assets-r2.json';
const contents=s=>JSON.parse(s.match(/export const REPORT_CONTENTS_ASSETS=Object\.freeze\((\[[\s\S]*?\])\.map\(Object\.freeze\)\);/)[1]);

export function assertNumerologyOnlySharedDelta(path,before,after){
 if(path===registryPath){
  const old=contents(before),now=contents(after);
  assert.deepEqual(now.filter(a=>a.methodId!=='NUM'),old.filter(a=>a.methodId!=='NUM'));
  assert.equal(now.length,6);assert.equal(old.length,6);
  const prior=old.find(a=>a.methodId==='NUM'),current=now.find(a=>a.methodId==='NUM');
  assert.equal(prior.active,false);assert.equal(current.active,true);
  assert.equal(current.ownerEvidence,'USER_20261030_P06_CORRECT_BIND_WITHOUT_CONTENT_REVIEW');
  assert.equal(current.visualAcceptance,'OWNER_CONFIRMED_CONTENT_20261030');
  assert.equal(current.customerPublishable,false);
  const restored={...current};for(const key of ['active','ownerEvidence','visualAcceptance'])restored[key]=prior[key];
  assert.deepEqual(restored,prior,'NUM asset identity or another P06 field changed');
  // No code, front matter or another export may change outside the literal list.
  assert.equal(after.replace(JSON.stringify(now,null,1),''),before.replace(JSON.stringify(old,null,1),''));
 }else{
  assert.equal(path,assetsPath);
  const old=JSON.parse(before),now=JSON.parse(after);
  assert.equal(old.assets.length,93);assert.equal(now.assets.length,94);
  assert.deepEqual(now.assets.filter(a=>a.methodId!=='NUM'),old.assets.filter(a=>a.methodId!=='NUM'));
  const restored=structuredClone(now);restored.assets=old.assets;restored.reports.NUM=old.reports.NUM;
  const historical=old.assets.filter(a=>a.methodId==='NUM'&&a.kind==='FIXED_MASTER_SECTION');
  assert.deepEqual(now.historicalAssetBindings,{...(old.historicalAssetBindings||{}),NUM_R20:{status:'HISTORICAL_NOT_CURRENT',assets:historical}});
  if(Object.hasOwn(old,'historicalAssetBindings'))restored.historicalAssetBindings=old.historicalAssetBindings;
  else delete restored.historicalAssetBindings;
  assert.deepEqual(restored,old,'Change outside NUM assets/report metadata');
  assert.deepEqual(now.reports.NUM.sections,Array.from({length:10},(_,i)=>'SEC-'+String(i+1).padStart(2,'0')));
  for(const a of now.assets.filter(a=>a.methodId==='NUM')){
   assert.notEqual(a.customerPublishable,true);
   if(a.publicationEligibility===undefined){
    assert.equal(a.kind,'FIXED_MASTER_SECTION');assert.equal(a.approval,'OWNER_NUM_SECTIONS_20261030');
    assert.equal(a.verification,'PUBLIC_BYTES_DECODED_OWNER_SELECTED');assert.equal(a.customerSpecific,false);
   }else assert.equal(a.publicationEligibility,'LOCAL_CANDIDATE_ONLY');
  }
 }
}

export function restoreExactSharedPredecessor(entry,bytes){
 assert.equal(hash(bytes),entry.successorSha256,'Unregistered current shared-owner drift');
 const current=bytes.toString('utf8');let restored=bytes;
 for(const edit of [...entry.reverseEdits].sort((a,b)=>b.start-a.start)){
  assert(restored.subarray(edit.start,edit.end).equals(Buffer.from(edit.currentText)),'Successor span mismatch');
  restored=Buffer.concat([restored.subarray(0,edit.start),Buffer.from(edit.predecessorText),restored.subarray(edit.end)]);
 }
 assert.equal(hash(restored),entry.predecessorSha256,'Historical predecessor bytes not recovered');
 assertNumerologyOnlySharedDelta(entry.path,restored.toString('utf8'),current);
 return restored.toString('utf8');
}

export function readBaziSharedOwnerPredecessor(path,expectedSha256){
 const bytes=fs.readFileSync(path);if(hash(bytes)===expectedSha256)return bytes.toString('utf8');
 const r=JSON.parse(fs.readFileSync(recordPath));
 assert.equal(r.status,'ENGINEERING_RECONCILIATION');assert.equal(r.changeType,'NUM_ONLY_SHARED_OWNER_SUCCESSOR');
 for(const k of ['authorityOrAcceptedTextRewritten','humanAcceptanceGranted','productionActivated','currentRendererFitAccepted'])assert.equal(r[k],false);
 for(const e of r.sourceEvidence)assert.equal(hash(fs.readFileSync(e.path)),e.sha256,'NUM provenance drift');
 const e=r.entries.find(e=>e.path===path);assert(e,'No exact shared-owner successor');
 assert.equal(e.predecessorSha256,expectedSha256);
 return restoreExactSharedPredecessor(e,bytes);
}
