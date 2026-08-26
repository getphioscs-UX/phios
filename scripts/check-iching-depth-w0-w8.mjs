import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {createIChingDepthCoverageSnapshot} from '../functions/interpretation-runtime/iching-depth-coverage-taxonomy-v1.js';
import {composeIChingDepthReadingSupplement,inspectIChingDepthAdmission,selectIChingDepthInterpretation} from '../functions/interpretation-runtime/iching-depth-editorial-runtime-v1.js';
import {onRequestGet,onRequestPost} from '../functions/api/review/iching-execute.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const arr=value=>Array.isArray(value)?value:[];
const ROOT='content/interpretation/iching';
const REVIEW='content/production/symbolic-method/human-review';
const requiredLocaleFields=['plainMeaning','situationOrStage','centralTension','constructiveExpressionOrMovement','distortionOrFailureRisk','timingOrCondition','whatToObserve','reflectionQuestions','misreadingWarnings'];

const taxonomy=read(`${ROOT}/reconciliation/iching-depth-coverage-taxonomy-successor-v1.json`);
const dimensions=read(`${ROOT}/registries/iching-depth-interpretation-dimension-registry-v1.json`);
const sources=read(`${ROOT}/registries/iching-depth-source-admission-registry-v1.json`);
const editorial=read(`${ROOT}/authority/iching-depth-editorial-authority-contract-v1.json`);
const hexagramRegistry=read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json');
const canonical=read(`${ROOT}/corpus/iching-public-domain-canonical-corpus-v2.json`);
const hexagramCandidates=read(`${ROOT}/corpus/iching-depth-hexagram-editorial-candidates-v1.json`);
const lineCandidates=read(`${ROOT}/corpus/iching-depth-line-editorial-candidates-v1.json`);
const admitted=read(`${ROOT}/corpus/iching-depth-admitted-editorial-corpus-v1.json`);
const contract=read(`${ROOT}/contracts/iching-depth-runtime-composition-contract-v1.json`);
const campaign=read(`${REVIEW}/iching-depth-human-review-campaign-v1.json`);
const rubric=read(`${REVIEW}/iching-depth-human-review-rubric-v1.json`);
const results=read(`${REVIEW}/iching-depth-human-review-results-v1.json`);
const successor=read(`${ROOT}/reconciliation/iching-depth-current-successor-v1.json`);

assert.equal(taxonomy.work,'ICHI-DEPTH-W0');
assert.equal(dimensions.work,'ICHI-DEPTH-W1');
assert.equal(editorial.work,'ICHI-DEPTH-W2');
assert.equal(sources.work,'ICHI-DEPTH-W2');
assert.equal(taxonomy.classificationRules.modelCandidateMayCountAsHumanApproved,false);
assert.equal(editorial.modelRole.modelMayApproveOwnCandidate,false);
assert.equal(editorial.modelRole.runtimeGapFillAllowed,false);

const canonicalClaims=new Map(canonical.entries.map(entry=>[entry.claimId,entry]));
const ids=new Set();
const coordinates=new Set();
function checkCandidate(entry,expectedScope){
  assert.equal(entry.schemaVersion,'PHI-OS-ICHI-DEPTH-INTERPRETATION-ENTRY-v1.0.0');
  assert.equal(entry.methodCode,'I_CHING');
  assert.equal(entry.scope,expectedScope);
  assert.equal(entry.contentClass,'PHIOS_DEPTH_EDITORIAL_INTERPRETATION');
  assert.equal(entry.review.status,'CANDIDATE');
  assert.equal(entry.review.humanApproved,false);
  assert.equal(entry.review.reviewer,null);
  assert.equal(entry.review.reviewedAt,null);
  assert.equal(entry.review.sourceFidelityChecked,false);
  assert.equal(entry.review.localeFidelityChecked,false);
  assert.equal(entry.review.boundaryChecked,false);
  assert.equal(entry.authority.runtimeModelGenerationAllowed,false);
  assert.equal(entry.authority.realityTruthCreated,false);
  assert.equal(entry.authority.fateConclusionCreated,false);
  assert.equal(entry.authority.professionalJudgmentCreated,false);
  assert.equal(entry.sourceBindings.sourceTextCopied,false);
  assert.ok(arr(entry.sourceBindings.sourceIds).length>=1);
  assert.ok(arr(entry.sourceBindings.sourceClaimRefs).length>=1);
  for(const claimId of entry.sourceBindings.sourceClaimRefs){
    const claim=canonicalClaims.get(claimId);
    assert.ok(claim,`${entry.interpretationId}: unknown source claim ${claimId}`);
    assert.equal(claim.hexagramId,entry.hexagramId);
    if(entry.scope==='LINE') assert.equal(claim.linePosition,entry.linePosition);
  }
  for(const locale of ['zh-Hans','en']){
    const projection=entry.localeProjections?.[locale];
    assert.ok(projection,`${entry.interpretationId}: ${locale} required`);
    for(const field of requiredLocaleFields){
      if(Array.isArray(projection[field])) assert.ok(projection[field].length>0&&projection[field].every(value=>String(value).trim()),`${entry.interpretationId}: ${locale} ${field}`);
      else assert.ok(String(projection[field]||'').trim(),`${entry.interpretationId}: ${locale} ${field}`);
    }
  }
  assert.ok(!ids.has(entry.interpretationId),`duplicate interpretationId ${entry.interpretationId}`);
  ids.add(entry.interpretationId);
  const coordinate=entry.scope==='LINE'?`${entry.hexagramId}:L${entry.linePosition}`:entry.hexagramId;
  assert.ok(!coordinates.has(coordinate),`duplicate coordinate ${coordinate}`);
  coordinates.add(coordinate);
}

assert.equal(hexagramCandidates.work,'ICHI-DEPTH-W3');
assert.equal(hexagramCandidates.entries.length,64);
hexagramCandidates.entries.forEach(entry=>checkCandidate(entry,'HEXAGRAM'));
assert.equal(new Set(hexagramCandidates.entries.map(entry=>entry.hexagramId)).size,64);
assert.equal(lineCandidates.work,'ICHI-DEPTH-W4');
assert.equal(lineCandidates.entries.length,384);
lineCandidates.entries.forEach(entry=>checkCandidate(entry,'LINE'));
assert.equal(new Set(lineCandidates.entries.map(entry=>`${entry.hexagramId}:L${entry.linePosition}`)).size,384);

assert.equal(contract.work,'ICHI-DEPTH-W5-W6');
assert.equal(contract.selectionRules.runtimeCandidateFallbackAllowed,false);
assert.equal(contract.selectionRules.runtimeModelGapFillAllowed,false);
const admission=inspectIChingDepthAdmission(admitted);
assert.equal(admission.admitted,admitted.entries.length);
assert.equal(admission.publicDepthReady,false);
const unavailable=selectIChingDepthInterpretation({hexagramId:'HEXAGRAM-01',changingLines:[1],locale:'zh-Hans',admittedCorpus:admitted});
assert.equal(unavailable.status,'CONTROLLED_UNAVAILABLE');
assert.equal(unavailable.authority.candidateFallbackUsed,false);
assert.equal(unavailable.authority.runtimeModelGenerationUsed,false);

const approve=entry=>({...structuredClone(entry),review:{status:'HUMAN_APPROVED',humanApproved:true,reviewer:'TL-FIXTURE',reviewedAt:'2026-08-26T00:00:00.000Z',sourceFidelityChecked:true,localeFidelityChecked:true,boundaryChecked:true}});
const fixtureCorpus={...structuredClone(admitted),entries:[approve(hexagramCandidates.entries[0]),approve(lineCandidates.entries[0])]};
const available=selectIChingDepthInterpretation({hexagramId:'HEXAGRAM-01',changingLines:[1],locale:'en',admittedCorpus:fixtureCorpus});
assert.equal(available.status,'AVAILABLE');
assert.equal(available.lines.length,1);
const supplement=composeIChingDepthReadingSupplement({
  readingIr:{schemaVersion:'PHI-OS-ICHING-READING-IR-v1.0.0',methodCode:'I_CHING',structuralProjection:{projectionCode:'CHECK-FIXTURE',primary:{hexagramId:'HEXAGRAM-01'},changingLines:[1]}},
  selection:available
});
assert.equal(supplement.status,'AVAILABLE');
assert.equal(supplement.authority.existingReadingIrMutated,false);
assert.equal(supplement.authority.publicProductionEligible,false);

assert.equal(campaign.work,'ICHI-DEPTH-W7');
assert.equal(campaign.reviewRoute,'/review/iching/?mode=depth');
assert.equal(campaign.existingReviewAuthorityReused,true);
assert.equal(campaign.targetSessionCount,448);
assert.equal(campaign.sessions.length,448);
assert.equal(new Set(campaign.sessions.map(item=>item.sessionId)).size,448);
assert.equal(results.sessions.length,448);
assert.equal(results.minimumAccepted,448);
assert.equal(results.productionPromotionAllowed,false);
assert.equal(results.publicRunAllowed,false);
assert.equal(rubric.acceptanceRule.publicDepthReadyRequiresAccepted,448);
assert.equal(rubric.acceptanceRule.criticalBoundaryFailuresAllowed,0);

const assets={fetch:async request=>{const path=new URL(request.url).pathname.slice(1);return fs.existsSync(path)?new Response(fs.readFileSync(path),{status:200,headers:{'content-type':'application/json'}}):new Response('not found',{status:404});}};
const deploymentSha='71ec2e6abcc88eb7692cf80d48edd490ab664c13';
const trustedAuthority={methodCode:'I_CHING',state:'HUMAN_REVIEW',runAllowed:true,campaignVersion:'2.0.0',reviewerId:'TL-HUMAN-REVIEWER',deploymentSha};
const context={data:{symbolicHumanReviewAuthority:{I_CHING:trustedAuthority}},env:{CF_PAGES_COMMIT_SHA:deploymentSha,ASSETS:assets}};
const opened=await onRequestGet({...context,request:new Request('https://review.example/api/review/iching-execute?mode=depth')});
assert.equal(opened.status,200);
const openedBody=await opened.json();
assert.equal(openedBody.review.mode,'DEPTH');
assert.equal(openedBody.campaign.sessions.length,448);
const executed=await onRequestPost({...context,request:new Request('https://review.example/api/review/iching-execute?mode=depth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sessionId:'ICHI-DEPTH-HR-001'})})});
assert.equal(executed.status,200);
const executedBody=await executed.json();
assert.equal(executedBody.candidate.interpretationId,campaign.sessions[0].interpretationId);
assert.match(executedBody.candidateDigest,/^[a-f0-9]{64}$/);
assert.equal(executedBody.execution.productionRunAllowed,false);
assert.equal(executedBody.execution.automaticPersistence,false);

const depthClient=fs.readFileSync('assets/js/pages/iching-depth-human-review.js','utf8');
const reviewPage=fs.readFileSync('review/iching/index.html','utf8');
const groupedWorkspace=fs.readFileSync('tools/review/iching-depth-editorial-review.html','utf8');
const groupedWorkspaceGenerator=fs.readFileSync('scripts/generate-iching-depth-review-workspace.mjs','utf8');
assert.ok(depthClient.includes("const ENDPOINT='/api/review/iching-execute?mode=depth'"));
assert.ok(depthClient.includes("link.download='iching-depth-human-review-results-v1.json'"));
assert.equal(depthClient.includes('localStorage'),false);
assert.ok(reviewPage.includes('/assets/js/pages/iching-human-review.js'));
assert.ok(groupedWorkspace.includes('OFFLINE_REVIEW_WORKSPACE_NOT_ROUTE_AUTHORITY'));
assert.ok(groupedWorkspace.includes('通过所选卦组'));
assert.ok(groupedWorkspace.includes('通过全部 preflight-passing units'));
assert.ok(groupedWorkspace.includes('iching-depth-human-review-results-v1.json'));
assert.equal(groupedWorkspace.includes('localStorage'),false);
assert.ok(groupedWorkspaceGenerator.includes("groups.length!==64||groups.some(group=>group.units.length!==7)"));
assert.ok(groupedWorkspaceGenerator.includes("candidateDigest:digest(candidate)"));
const groupedPayloadMatch=groupedWorkspace.match(/<script id="review-data" type="application\/json">([\s\S]*?)<\/script>/);
assert.ok(groupedPayloadMatch,'grouped review payload missing');
const groupedPayload=JSON.parse(groupedPayloadMatch[1]);
assert.equal(groupedPayload.authority.state,'OFFLINE_REVIEW_WORKSPACE_NOT_ROUTE_AUTHORITY');
assert.equal(groupedPayload.authority.canonicalReviewRoute,'/review/iching/?mode=depth');
assert.equal(groupedPayload.authority.publicRunAllowed,false);
assert.equal(groupedPayload.groups.length,64);
assert.equal(groupedPayload.groups.flatMap(group=>group.units).length,448);
assert.ok(groupedPayload.groups.every(group=>group.units.length===7));
assert.equal(fs.existsSync('review/iching-depth/index.html'),false,'second I Ching depth review page authority forbidden');

const snapshot=createIChingDepthCoverageSnapshot({hexagramRegistry,corpus:canonical,editorialEntries:admitted.entries});
assert.equal(snapshot.coverage.canonicalHexagramText.coverage,'64/64');
assert.equal(snapshot.coverage.canonicalLineText.coverage,'384/384');
assert.equal(snapshot.coverage.phiosDepthHexagram.coverage,admission.coverage.hexagram);
assert.equal(snapshot.coverage.phiosDepthLine.coverage,admission.coverage.line);
assert.equal(snapshot.readiness.publicProductionEligible,false);

assert.equal(successor.work,'ICHI-DEPTH-W0-W8');
assert.equal(successor.candidateCoverage.hexagram,'64/64');
assert.equal(successor.candidateCoverage.line,'384/384');
assert.equal(successor.productionBoundary.publicRunAllowed,false);
assert.equal(successor.productionBoundary.fullyActivated,false);
for(const artifact of successor.artifacts) assert.equal(sha(artifact.path),artifact.sha256,`ICHI-DEPTH artifact drift: ${artifact.path}`);

console.log('✓ ICHI-DEPTH-W0-W2 taxonomy, schema, source and human editorial authority passed.');
console.log('✓ ICHI-DEPTH-W3-W4 candidate coverage passed: 64/64 hexagrams + 384/384 lines, bilingual and source-bound.');
console.log(`✓ ICHI-DEPTH-W5-W6 admitted-only selection/composition passed: ${admission.coverage.total} currently admitted; candidate/model gap-fill is closed.`);
console.log('✓ ICHI-DEPTH-W7 reuses the single protected /review/iching/ authority and adds a non-route 64-group article-approval workspace for all 448 evidence rows.');
console.log('✓ ICHI-DEPTH-W8 current gate passed: engineering chain is complete; public depth remains fail-closed until 448/448 real human approvals and external activation gates.');
