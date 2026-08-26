import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const write=(path,value)=>fs.writeFileSync(path,`${JSON.stringify(value,null,2)}\n`);
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

const ROOT='content/interpretation/iching/corpus';
const REVIEW='content/production/symbolic-method/human-review';
const hexagram=read(`${ROOT}/iching-depth-hexagram-editorial-candidates-v1.json`);
const line=read(`${ROOT}/iching-depth-line-editorial-candidates-v1.json`);
const results=read(`${REVIEW}/iching-depth-human-review-results-v1.json`);
const rubric=read(`${REVIEW}/iching-depth-human-review-rubric-v1.json`);
const target=`${ROOT}/iching-depth-admitted-editorial-corpus-v1.json`;
const candidates=new Map([...hexagram.entries,...line.entries].map(entry=>[entry.interpretationId,entry]));
const criterionIds=rubric.criteria.map(item=>item.id);
const accepted=[];

for(const row of results.sessions){
  if(row.decision!=='ACCEPTED') continue;
  const candidate=candidates.get(row.interpretationId);
  assert.ok(candidate,`${row.sessionId}: candidate missing`);
  assert.equal(row.humanReviewed,true,`${row.sessionId}: real human review required`);
  assert.ok(String(row.reviewerId||'').trim(),`${row.sessionId}: reviewer required`);
  assert.ok(String(row.reviewedAt||'').trim()&&!Number.isNaN(Date.parse(row.reviewedAt)),`${row.sessionId}: review timestamp required`);
  assert.match(String(row.deploymentSha||''),/^[a-f0-9]{40}$/,`${row.sessionId}: deployment SHA required`);
  assert.match(String(row.environmentUrl||''),/^https:\/\//,`${row.sessionId}: HTTPS review environment required`);
  assert.ok(Number.isInteger(row.viewport?.width)&&row.viewport.width>0&&Number.isInteger(row.viewport?.height)&&row.viewport.height>0,`${row.sessionId}: viewport required`);
  assert.ok(Array.isArray(row.screenshotRefs)&&row.screenshotRefs.length>0,`${row.sessionId}: screenshot evidence required`);
  assert.equal(row.candidateDigest,digest(candidate),`${row.sessionId}: candidate digest drift`);
  assert.deepEqual(new Set(row.sourceClaimIds),new Set(candidate.sourceBindings.sourceClaimRefs),`${row.sessionId}: source claim evidence drift`);
  for(const id of criterionIds) assert.equal(row.criteria?.[id],true,`${row.sessionId}: criterion ${id} must pass`);
  assert.equal(row.criticalBoundaryFailure,false,`${row.sessionId}: critical boundary failure blocks admission`);
  accepted.push({
    ...structuredClone(candidate),
    review:{
      status:'HUMAN_APPROVED',
      humanApproved:true,
      reviewer:String(row.reviewerId).trim(),
      reviewedAt:row.reviewedAt,
      sourceFidelityChecked:true,
      localeFidelityChecked:true,
      boundaryChecked:true
    }
  });
}

const hexagramCount=accepted.filter(entry=>entry.scope==='HEXAGRAM').length;
const lineCount=accepted.filter(entry=>entry.scope==='LINE').length;
write(target,{
  schemaVersion:'PHI-OS-ICHI-DEPTH-ADMITTED-EDITORIAL-CORPUS-v1.0.0',
  phase:'ICHI-DEPTH',
  work:'ICHI-DEPTH-W5',
  baselineCommit:'71ec2e6abcc88eb7692cf80d48edd490ab664c13',
  status:accepted.length===448?'448_OF_448_HUMAN_APPROVED_PENDING_PUBLIC_ACTIVATION_GATES':'PARTIAL_HUMAN_APPROVAL_PUBLIC_DEPTH_CLOSED',
  corpusVersion:'1.0.0',
  methodCode:'I_CHING',
  candidateSources:[
    `${ROOT}/iching-depth-hexagram-editorial-candidates-v1.json`,
    `${ROOT}/iching-depth-line-editorial-candidates-v1.json`
  ],
  reviewResults:`${REVIEW}/iching-depth-human-review-results-v1.json`,
  coverage:{hexagram:`${hexagramCount}/64`,line:`${lineCount}/384`,total:`${accepted.length}/448`},
  publicRuntimeBound:false,
  productionAuthorityChanged:false,
  entries:accepted
});

console.log(`✓ ICHI-DEPTH-W7 admitted ${accepted.length}/448 real-human-approved editorial entries (${hexagramCount}/64 hexagram, ${lineCount}/384 line).`);
console.log('  Admission does not activate public runtime or production authority.');
