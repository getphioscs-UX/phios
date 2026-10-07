import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
export const acceptancePath='content/knowledge/structured/acceptance/master-a-v2-production-acceptance.json';
export const freezePath='content/knowledge/structured/freeze/master-a-v2-production-freeze.json';
export const admissionPath='content/knowledge/structured/successors/master-a-v2-batch6/production-admitted-successor-v1.json';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function assertMasterAProductionAdmission(){
 const acceptance=read(acceptancePath),freeze=read(freezePath),successor=read(admissionPath);
 assert.equal(acceptance.recordVersion,1);assert.equal(freeze.recordVersion,1);
 assert.equal(acceptance.decision,'HUMAN ACCEPT');assert.equal(acceptance.authorization.source,'EXPLICIT_USER_MESSAGE');
 assert.equal(acceptance.authorization.work,'MASTER-A-V2-FINAL');
 for(const record of [acceptance,freeze,successor]){
  assert.equal(record.status,'MASTER_A_V2_PRODUCTION_ADMITTED');
  assert.equal(record.boundaries.activeNewStructuredObjects,0);
  for(const key of ['withheldObjectsActivated','newPublicRoutes','newRuntimeOwners','rawManuscriptRestored','providerRequests','commit','push','deploy'])assert.equal(record.boundaries[key],false);
 }
 assert.equal(freeze.acceptance.sha256,sha(acceptancePath));
 assert.equal(successor.acceptance.sha256,sha(acceptancePath));assert.equal(successor.freeze.sha256,sha(freezePath));
 for(const item of freeze.frozenArtifacts)assert.equal(sha(item.path),item.sha256,'MASTER_A_FROZEN_ARTIFACT_DRIFT:'+item.path);
 assert.equal(acceptance.bookVIII.canonicalTitle,'世界将如何继续');assert.equal(acceptance.bookVIII.bookIX,false);
 assert.equal(acceptance.sourceGap.classification,'INTENTIONALLY_WITHHELD');assert.equal(acceptance.sourceGap.sourceRecreated,false);
 assert.equal(acceptance.fullRepositoryPass,false);assert.equal(acceptance.unrelatedDebt.actualError,'ZERO_COST_COMMAND_MISSING:check:book-i-v3-final-source');
 return {status:acceptance.status,acceptanceSha256:sha(acceptancePath),freezeSha256:sha(freezePath),frozenArtifacts:freeze.frozenArtifacts.length};
}
