import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const ROOT='content/production/symbolic-method/human-review';
const campaign=read(`${ROOT}/iching-human-review-campaign-v2.json`);
const rubric=read(`${ROOT}/iching-human-review-rubric-v2.json`);
const preflight=read(`${ROOT}/iching-human-review-preflight-v1.json`);
const results=read(`${ROOT}/iching-human-review-results-v2.json`);
const snapshotById=new Map(preflight.snapshots.map(item=>[item.sessionId,item]));
const campaignIds=new Set(campaign.sessions.map(item=>item.sessionId));
const criterionIds=rubric.criteria.map(item=>item.id);
const criticalIds=new Set(rubric.criteria.filter(item=>item.critical).map(item=>item.id));

assert.equal(results.planned,24);
assert.equal(results.minimumAccepted,campaign.minimumAcceptedSessionCount);
assert.equal(results.machinePreflightPassed,24);
assert.equal(results.sessions.length,24);
assert.equal(new Set(results.sessions.map(x=>x.sessionId)).size,24);

for(const row of results.sessions){
  assert.ok(campaignIds.has(row.sessionId),`${row.sessionId}: unknown campaign session`);
  const snapshot=snapshotById.get(row.sessionId);
  assert.equal(row.machinePreflightPassed,true,`${row.sessionId}: machine preflight required`);
  assert.equal(row.machineEvidenceDigest,snapshot.machineEvidenceDigest,`${row.sessionId}: machine evidence digest drift`);
  assert.equal(row.runtimeEvidence?.requestDigest,snapshot.requestDigest,`${row.sessionId}: request digest drift`);
  assert.equal(row.runtimeEvidence?.publicViewDigest,snapshot.publicViewDigest,`${row.sessionId}: public view digest drift`);
  assert.deepEqual(row.runtimeEvidence?.expectedProjection,snapshot.expectedProjection,`${row.sessionId}: expected projection drift`);
  assert.deepEqual(row.runtimeEvidence?.actualProjection,snapshot.actualProjection,`${row.sessionId}: actual projection drift`);
  if(!row.humanReviewed) continue;
  assert.ok(['ACCEPTED','REJECTED','NEEDS_FIX'].includes(row.decision),`${row.sessionId}: human decision required`);
  assert.ok(String(row.reviewerId||'').trim(),`${row.sessionId}: reviewerId required`);
  assert.ok(String(row.reviewedAt||'').trim()&&!Number.isNaN(Date.parse(row.reviewedAt)),`${row.sessionId}: reviewedAt required`);
  assert.match(String(row.deploymentSha||''),/^[a-f0-9]{40}$/,`${row.sessionId}: deployed SHA required`);
  assert.match(String(row.environmentUrl||''),/^https:\/\//,`${row.sessionId}: HTTPS review environment required`);
  assert.ok(Number.isInteger(row.viewport?.width)&&row.viewport.width>0&&Number.isInteger(row.viewport?.height)&&row.viewport.height>0,`${row.sessionId}: viewport required`);
  assert.ok(Array.isArray(row.screenshotRefs),`${row.sessionId}: screenshotRefs required`);
  for(const id of criterionIds) assert.equal(typeof row.criteria?.[id],'boolean',`${row.sessionId}: criterion ${id} must be explicit`);
  const derivedCritical=Object.entries(row.criteria).some(([id,value])=>criticalIds.has(id)&&value===false);
  assert.equal(row.criticalBoundaryFailure,derivedCritical||row.criticalBoundaryFailure===true,`${row.sessionId}: critical boundary state inconsistent`);
  if(row.decision==='ACCEPTED'){
    assert.equal(row.criticalBoundaryFailure,false,`${row.sessionId}: accepted case has critical failure`);
    for(const id of criterionIds) assert.equal(row.criteria[id],true,`${row.sessionId}: accepted criterion ${id} failed`);
    assert.ok(row.screenshotRefs.length>=1,`${row.sessionId}: accepted case requires screenshot evidence`);
  }
}

const reviewed=results.sessions.filter(x=>x.humanReviewed).length;
const accepted=results.sessions.filter(x=>x.decision==='ACCEPTED').length;
const rejected=results.sessions.filter(x=>x.decision==='REJECTED').length;
const needsFix=results.sessions.filter(x=>x.decision==='NEEDS_FIX').length;
const critical=results.sessions.filter(x=>x.criticalBoundaryFailure===true).length;
assert.equal(results.humanReviewed,reviewed);
assert.equal(results.accepted,accepted);
assert.equal(results.rejected,rejected);
assert.equal(results.needsFix,needsFix);
assert.equal(results.criticalBoundaryFailures,critical);
assert.ok(reviewed>=campaign.minimumAcceptedSessionCount,`real human review pending: ${reviewed}/${campaign.minimumAcceptedSessionCount} minimum reviewed`);
assert.ok(accepted>=campaign.minimumAcceptedSessionCount,`real human review pending: ${accepted}/${campaign.minimumAcceptedSessionCount} minimum accepted`);
assert.equal(critical,0,'critical boundary failure blocks human acceptance');
assert.equal(results.humanAcceptanceComplete,true);
assert.equal(results.productionPromotionAllowed,false,'human acceptance alone may not promote production');
assert.equal(results.publicRunAllowed,false,'human acceptance alone may not open public execution');

console.log(`✓ ICH-HR-W4 human acceptance passed: ${accepted}/24 accepted (${reviewed} reviewed), zero critical boundary failures.`);
console.log('  Public activation remains closed until verified account/D1, live browser, deployed SHA and rights gates pass.');

