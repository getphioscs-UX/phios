import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {runIChingHumanReviewPreflight} from '../functions/iching-product-runtime/iching-human-review-runtime-v1.js';
import {inspectIChingHumanReviewAuthority} from '../functions/iching-product-runtime/iching-human-review-authority-v1.js';
import {onRequestGet,onRequestPost} from '../functions/api/review/iching-execute.js';
import {onRequestPost as publicExecute} from '../functions/api/symbolic-method-execute-v2.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const ROOT='content/production/symbolic-method/human-review';
const BASE='d2c485af29481179d8e4530780148a1d32981e92';
const campaign=read(`${ROOT}/iching-human-review-campaign-v2.json`);
const predecessor=read(`${ROOT}/iching-human-review-campaign-v1.json`);
const rubric=read(`${ROOT}/iching-human-review-rubric-v2.json`);
const contract=read(`${ROOT}/iching-human-review-evidence-contract-v1.json`);
const preflight=read(`${ROOT}/iching-human-review-preflight-v1.json`);
const results=read(`${ROOT}/iching-human-review-results-v2.json`);
const successor=read('content/production/symbolic-method/reconciliation/iching-human-review-current-successor-v1.json');
const authorities={
  hexagramRegistry:read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),
  sourceRegistry:read('content/interpretation/iching/registries/iching-source-registry-v2.json'),
  perspectiveRegistry:read('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),
  corpus:read('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json')
};

assert.equal(campaign.baselineCommit,BASE);
assert.equal(campaign.successorOf,`${ROOT}/iching-human-review-campaign-v1.json`);
assert.equal(campaign.historicalPredecessorMutated,false);
assert.equal(predecessor.sessions.length,24);
assert.equal(predecessor.sessions.every(x=>x.humanReviewed===false&&x.accepted===null),true);
assert.equal(campaign.targetSessionCount,24);
assert.equal(campaign.minimumAcceptedSessionCount,20);
assert.equal(campaign.sessions.length,24);
assert.equal(new Set(campaign.sessions.map(x=>x.sessionId)).size,24);
assert.deepEqual(campaign.groups,{STRUCTURE:4,SOURCE:3,REALITY:3,IDENTITY_CONTEXT:4,SENSITIVE:7,LOCALE_HANDOFF:3});
for(const [group,count] of Object.entries(campaign.groups)) assert.equal(campaign.sessions.filter(x=>x.group===group).length,count,group);
assert.equal(campaign.sessions.some(x=>x.scenario==='SOURCE_GAP'),false,'obsolete SOURCE_GAP may not survive in v2');
assert.ok(campaign.sessions.some(x=>x.scenario==='CANONICAL_TEXT_64'));
assert.ok(campaign.sessions.some(x=>x.scenario==='LINE_WITNESS_384'));
for(const session of campaign.sessions){
  assert.match(session.sessionId,/^ICH-HR2-\d{2}$/);
  assert.equal(session.lineValues.length,6);
  assert.equal(session.lineValues.every(x=>[6,7,8,9].includes(x)),true);
  assert.ok(session.questionEn&&session.questionZhHans&&session.reviewFocus);
  assert.ok(session.expected?.primaryHexagramId&&Array.isArray(session.expected?.changingLines)&&session.expected?.relatingHexagramId);
}

assert.equal(rubric.criteria.length,16);
assert.equal(rubric.criteria.filter(x=>x.critical).length,15);
assert.equal(new Set(rubric.criteria.map(x=>x.id)).size,16);
assert.equal(rubric.machinePreflightDoesNotCountAsHumanReview,true);
assert.equal(rubric.modelMaySetHumanDecision,false);
assert.equal(contract.authority.machinePreflightIsHumanAcceptance,false);
assert.equal(contract.authority.aiMayActAsReviewer,false);
assert.equal(contract.authority.reviewHarnessMayPromoteProduction,false);
assert.equal(contract.immutability.rejectedRecordMayBeFlippedInPlace,false);

assert.equal(preflight.caseCount,24);
assert.equal(preflight.machinePreflightIsHumanAcceptance,false);
assert.deepEqual(preflight.canonicalCoverage,{hexagrams:'64/64',lineWitnesses:'384/384'});
const fresh=await runIChingHumanReviewPreflight(campaign,authorities);
assert.deepEqual(fresh,preflight.snapshots,'I Ching human-review machine preflight drift');

for(const snapshot of fresh){
  const session=campaign.sessions.find(x=>x.sessionId===snapshot.sessionId);
  assert.deepEqual(snapshot.actualProjection,snapshot.expectedProjection,`${snapshot.sessionId}: projection mismatch`);
  assert.equal(snapshot.sourceCoverage.primary,'SOURCE_COMMENTARY_AVAILABLE',`${snapshot.sessionId}: primary source unavailable`);
  assert.equal(snapshot.sourceCoverage.relating,'SOURCE_COMMENTARY_AVAILABLE',`${snapshot.sessionId}: relating source unavailable`);
  assert.equal(snapshot.sourceCoverage.partialCorpus,false,`${snapshot.sessionId}: obsolete partial corpus`);
  assert.equal(snapshot.boundaries.aiSelected,false);
  assert.equal(snapshot.boundaries.rerolledInsideCalculation,false);
  assert.equal(snapshot.boundaries.noSourceVoting,true);
  assert.equal(snapshot.boundaries.noUniversalMeaning,true);
  assert.equal(snapshot.boundaries.noPrediction,true);
  assert.equal(snapshot.boundaries.noDiagnosis,true);
  assert.equal(snapshot.boundaries.noHiddenStateCertainty,true);
  assert.equal(snapshot.boundaries.decisionAuthority,'USER');
  assert.equal(snapshot.boundaries.ichingMayDecide,false);
  assert.equal(snapshot.boundaries.realityMayContradictReading,true);
  assert.equal(snapshot.boundaries.sourceGapMayBeFilledByModel,false);
  assert.equal(snapshot.boundaries.automaticPersistence,false);
  assert.equal(snapshot.boundaries.providerUsed,false);
  assert.equal(snapshot.boundaries.publicRunAllowed,false);
  assert.equal(snapshot.boundaries.productionCapabilityPromoted,false);
  for(const claimId of session.expected.requiredClaimIds||[]) assert.ok(snapshot.sourceClaims.some(x=>x.claimId===claimId),`${session.sessionId}: required claim ${claimId}`);
  if(session.expected.requiredSourceLocator) assert.ok(snapshot.sourceClaims.some(x=>x.sourceLocator===session.expected.requiredSourceLocator),`${session.sessionId}: required locator`);
  for(const sourceId of session.expected.requiredSourceIds||[]) assert.ok(snapshot.sourceIds.includes(sourceId),`${session.sessionId}: required source ${sourceId}`);
  if(session.expected.minimumSourceCount) assert.ok(snapshot.sourceIds.length>=session.expected.minimumSourceCount,`${session.sessionId}: minimum source count`);
  if(session.expected.rcc) assert.deepEqual(snapshot.rcc,session.expected.rcc,`${session.sessionId}: RCC fixture drift`);
  if(typeof session.expected.currentRealityContextUsed==='boolean') assert.equal(snapshot.contextDisclosure.currentRealityContextUsed,session.expected.currentRealityContextUsed);
  if(typeof session.expected.complexHandoffVisible==='boolean') assert.equal(snapshot.boundaries.complexHandoffVisible,session.expected.complexHandoffVisible);
}
const source64=fresh.find(x=>x.scenario==='CANONICAL_TEXT_64');
assert.equal(source64.actualProjection.primaryHexagramId,'HEXAGRAM-64');
assert.ok(source64.sourceClaims.some(x=>x.claimId==='ICH-CLM-ZHOUYI-CN-64-H'));
const line384=fresh.find(x=>x.scenario==='LINE_WITNESS_384');
const selectedLine=line384.sourceClaims.filter(x=>x.hexagramRole==='PRIMARY'&&x.scope==='LINE');
assert.deepEqual(selectedLine.map(x=>x.linePosition),[6]);
assert.equal(selectedLine[0].claimId,'ICH-CLM-ZHOUYI-CN-64-L6');
assert.equal(selectedLine[0].sourceLocator,'ebook-25501.txt#hexagram-64-line-6');

assert.equal(results.planned,24);
assert.equal(results.minimumAccepted,20);
assert.equal(results.machinePreflightPassed,24);
assert.equal(results.sessions.length,24);
assert.equal(results.humanReviewed,0);
assert.equal(results.accepted,0);
assert.equal(results.criticalBoundaryFailures,0);
assert.equal(results.humanAcceptanceComplete,false);
assert.equal(results.productionPromotionAllowed,false);
assert.equal(results.publicRunAllowed,false);
for(const snapshot of fresh){
  const row=results.sessions.find(x=>x.sessionId===snapshot.sessionId);
  assert.ok(row);
  assert.equal(row.machinePreflightPassed,true);
  assert.equal(row.machineEvidenceDigest,snapshot.machineEvidenceDigest);
  assert.equal(row.humanReviewed,false);
  assert.equal(row.decision,null);
  assert.equal(row.reviewerId,null);
  assert.equal(row.reviewedAt,null);
  assert.equal(row.criticalBoundaryFailure,null);
  assert.deepEqual(row.criteria,{});
}

assert.equal(inspectIChingHumanReviewAuthority({}).authorized,false);
const trustedAuthority={methodCode:'I_CHING',state:'HUMAN_REVIEW',runAllowed:true,campaignVersion:'2.0.0',reviewerId:'TL-HUMAN-REVIEWER',deploymentSha:BASE};
const trustedContext={data:{symbolicHumanReviewAuthority:{I_CHING:trustedAuthority}},env:{CF_PAGES_COMMIT_SHA:BASE}};
const inspected=inspectIChingHumanReviewAuthority(trustedContext);
assert.equal(inspected.authorized,true);
assert.equal(inspected.state,'HUMAN_REVIEW');
assert.equal(inspected.productionRunAllowed,false);
assert.equal(inspected.publicExecutionAuthorityCreated,false);
assert.equal(inspected.automaticPersistence,false);
assert.equal(inspected.clientMayGrantAuthority,false);
const accessRequest=new Request('https://review.example/api/review/iching-execute',{headers:{'cf-access-authenticated-user-email':'reviewer@example.com','cf-access-jwt-assertion':'signed-by-access-edge'}});
const accessAuthority=inspectIChingHumanReviewAuthority({request:accessRequest,env:{CF_PAGES_COMMIT_SHA:BASE,ICHING_HUMAN_REVIEW_ENABLED:'1',ICHING_HUMAN_REVIEW_DEPLOYMENT_SHA:BASE,ICHING_HUMAN_REVIEWER_EMAILS:'reviewer@example.com'}});
assert.equal(accessAuthority.authorized,true);
assert.equal(accessAuthority.authenticationMode,'CLOUDFLARE_ACCESS_POLICY_AND_ALLOWLIST');

const assets={fetch:async request=>{const path=new URL(request.url).pathname.slice(1);return fs.existsSync(path)?new Response(fs.readFileSync(path),{status:200,headers:{'content-type':'application/json'}}):new Response('not found',{status:404});}};
const denied=await onRequestGet({request:new Request('https://review.example/api/review/iching-execute'),env:{ASSETS:assets}});
assert.equal(denied.status,403);
const baseContext={data:trustedContext.data,env:{...trustedContext.env,ASSETS:assets}};
const opened=await onRequestGet({...baseContext,request:new Request('https://review.example/api/review/iching-execute')});
assert.equal(opened.status,200);const openedBody=await opened.json();assert.equal(openedBody.review.state,'HUMAN_REVIEW');assert.equal(openedBody.review.productionRunAllowed,false);assert.equal(openedBody.campaign.sessions.length,24);
const executed=await onRequestPost({...baseContext,request:new Request('https://review.example/api/review/iching-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sessionId:'ICH-HR2-06',question:'CLIENT OVERRIDE',lines:[6,6,6,6,6,6]})})});
assert.equal(executed.status,200);const executedBody=await executed.json();assert.equal(executedBody.execution.fixedCampaignInput,true);assert.equal(executedBody.execution.requestBodyMayOverrideQuestion,false);assert.equal(executedBody.execution.requestBodyMayOverrideLines,false);assert.deepEqual(executedBody.machineEvidence.lineValues,[8,7,8,7,8,9]);assert.equal(executedBody.machineEvidence.actualProjection.primaryHexagramId,'HEXAGRAM-64');assert.equal(executedBody.review.productionRunAllowed,false);
const publicClosed=await publicExecute({request:new Request('https://review.example/api/symbolic-method-execute-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'I_CHING'})}),data:baseContext.data,env:baseContext.env});
assert.equal(publicClosed.status,423,'human-review authority must not open public execution');

const html=fs.readFileSync('review/iching/index.html','utf8');
const client=fs.readFileSync('assets/js/pages/iching-human-review.js','utf8');
const api=fs.readFileSync('functions/api/review/iching-execute.js','utf8');
for(const token of ['data-iching-human-review="v2"','data-case-list','data-review-form','data-export-results','/assets/js/pages/iching-human-review.js']) assert.ok(html.includes(token),`review html missing ${token}`);
for(const token of ["const ENDPOINT='/api/review/iching-execute'","question:'CLIENT_OVERRIDE_FORBIDDEN'",'machineEvidenceDigest','localStorage']){
  if(token==='localStorage') assert.equal(client.includes(token),false,'review harness may not persist browser history'); else assert.ok(client.includes(token),`review client missing ${token}`);
}
for(const token of ['fixedCampaignInputOnly:true','automaticPersistence:false','publicExecutionAuthorityCreated:false','productionRunAllowed:false']) assert.ok(api.includes(token),`review API missing ${token}`);

assert.equal(successor.baselineCommit,BASE);
assert.equal(successor.predecessor.preserved,true);
assert.equal(sha(successor.predecessor.path),successor.predecessor.sha256,'frozen v1 campaign drift');
for(const item of successor.artifacts) assert.equal(sha(item.path),item.sha256,`ICH-HR artifact drift: ${item.path}`);
assert.equal(successor.humanState.humanAcceptanceComplete,false);
assert.equal(successor.productionBoundary.publicRunAllowed,false);
assert.equal(successor.productionBoundary.productionCapabilityPromoted,false);

const pkg=read('package.json');
assert.equal(pkg.scripts['generate:iching-human-review-preflight'],'node scripts/generate-iching-human-review-preflight.mjs');
assert.equal(pkg.scripts['check:iching-human-review-readiness'],'node scripts/check-iching-human-review-readiness.mjs');
assert.equal(pkg.scripts['check:iching-human-acceptance'],'node scripts/check-iching-human-acceptance.mjs');
assert.ok(pkg.scripts.check.includes('npm run check:iching-human-review-readiness'));
const pending=spawnSync(process.execPath,['scripts/check-iching-human-acceptance.mjs'],{cwd:process.cwd(),encoding:'utf8'});
assert.notEqual(pending.status,0,'human acceptance must fail closed before real sign-off');
assert.match(`${pending.stdout}\n${pending.stderr}`,/real human review pending/);

console.log('✓ ICH-HR-W0 v2 successor passed: frozen v1 preserved; 24 fixed cases reconcile with the 64/384 current corpus.');
console.log('✓ ICH-HR-W1 evidence contract and 16-criterion rubric passed; 15 critical boundaries are fail-closed.');
console.log('✓ ICH-HR-W2 controlled review harness passed: Access/trusted authority only, fixed inputs, no persistence or public activation.');
console.log('✓ ICH-HR-W3 machine preflight passed: 24/24 deterministic projections and source witnesses ready for real human review.');
console.log('○ ICH-HR-W4 acceptance checker is correctly pending: 0/20 minimum human acceptances; public runAllowed remains false.');
