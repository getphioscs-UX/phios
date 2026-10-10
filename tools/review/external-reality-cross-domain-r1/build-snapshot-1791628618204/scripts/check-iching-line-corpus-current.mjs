import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v1.js';
import {onRequestPost as executeCurrentEndpoint, ICHING_CURRENT_AUTHORITY_PATHS} from '../functions/api/symbolic-method-execute-v2.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const P=Object.freeze({
  hex:'content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sourceV1:'content/interpretation/iching/registries/iching-source-registry-v1.json',
  sourceV2:'content/interpretation/iching/registries/iching-source-registry-v2.json',
  perspectiveV1:'content/interpretation/iching/registries/iching-interpretation-perspective-registry-v1.json',
  perspectiveV2:'content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',
  corpusV1:'content/interpretation/iching/corpus/iching-public-domain-minimum-corpus-v1.json',
  corpusV2:'content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json',
  rights:'content/interpretation/iching/rights/iching-zhouyi-ancient-text-rights-decision-v1.json',
  readiness:'content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v2.json',
  freeze:'content/interpretation/iching/freeze/iching-canonical-text-384-runtime-freeze-v1.json'
});
for(const path of Object.values(P)) assert.ok(fs.existsSync(path),`missing ${path}`);

const hex=read(P.hex),sourceV1=read(P.sourceV1),sources=read(P.sourceV2),perspectiveV1=read(P.perspectiveV1),perspectives=read(P.perspectiveV2),corpusV1=read(P.corpusV1),corpus=read(P.corpusV2),rights=read(P.rights),readiness=read(P.readiness),freeze=read(P.freeze);
assert.equal(corpus.baselineCommit,'90f87b962cc0f9a77996d2bb6deca5bfa38a1634');
assert.equal(corpus.successorOf,P.corpusV1);
assert.equal(corpus.historicalPredecessorMutated,false);
assert.equal(sources.successorOf,P.sourceV1);
assert.equal(perspectives.successorOf,P.perspectiveV1);
assert.deepEqual(sources.sources.slice(0,sourceV1.sources.length),sourceV1.sources);
assert.deepEqual(perspectives.perspectives.slice(0,perspectiveV1.perspectives.length),perspectiveV1.perspectives);
assert.deepEqual(corpus.entries.slice(0,corpusV1.entries.length),corpusV1.entries);
assert.equal(sha(P.sourceV1),'2388788a68801129d18033bf6a6190654b87632f7617015b272334b4f31c7379');
assert.equal(sha(P.perspectiveV1),'61eb8ced23f6bbd863af13b3b788abec071d258be913775359cc08206dcb473d');
assert.equal(sha(P.corpusV1),'4e679964fe7ae923647fab155cde842720ba858f87b8b3a38489c6c9f7518ca8');

assert.equal(corpus.coverage.coveredHexagramCount,64);
assert.equal(corpus.coverage.complete,true);
assert.equal(corpus.lineCoverage.uniqueCanonicalLinePositionCount,384);
assert.equal(corpus.lineCoverage.canonicalLinePositionCount,384);
assert.equal(corpus.lineCoverage.complete,true);
assert.equal(corpus.lineCoverage.supplementaryUseNineAndUseSixExcludedFromCanonical384,true);
assert.equal(corpus.sourcePolicy.claimsAreEditorialParaphrases,false);
assert.equal(corpus.sourcePolicy.modelGeneratedGapFillAllowed,false);

const SOURCE='ICH-SRC-ZHOUYI-ANCIENT-CN-WITNESS-25501';
const PERSPECTIVE='ICH-PERSPECTIVE-ZHOUYI-ANCIENT-CANONICAL-TEXT';
const source=sources.sources.find(item=>item.sourceId===SOURCE);
const perspective=perspectives.perspectives.find(item=>item.perspectiveId===PERSPECTIVE);
assert.ok(source);assert.ok(perspective);
assert.equal(source.ingestionStatus,'64_HEXAGRAM_384_LINE_CANONICAL_UNITS_INGESTED');
assert.equal(source.digitalWitnessSha256,'5f5e0c3fcfdd9af3fe61c1e9357fab0431477f49ed5e207dcace080e655006f5');
assert.equal(source.projectGutenbergTrademarkUseClaimed,false);
assert.equal(perspective.isEditorialInterpretation,false);
assert.equal(perspective.mayClaimRealityTruth,false);
assert.equal(perspective.mayCreateProfessionalJudgment,false);
assert.equal(rights.admittedUnits.canonicalLineTexts,384);
assert.equal(rights.commercialBoundary.legalGuaranteeCreatedByThisRecord,false);
assert.equal(rights.runtimeBoundary.humanInterpretiveReviewCompleted,false);

const current=corpus.entries.filter(item=>item.sourceId===SOURCE);
const judgments=current.filter(item=>item.scope==='HEXAGRAM');
const lines=current.filter(item=>item.scope==='LINE');
assert.equal(judgments.length,64);
assert.equal(lines.length,384);
assert.equal(new Set(judgments.map(item=>item.hexagramId)).size,64);
const coordinates=new Set(lines.map(item=>`${item.hexagramId}:${item.linePosition}`));
assert.equal(coordinates.size,384);
for(const entry of current){
  assert.equal(entry.perspectiveId,PERSPECTIVE);
  assert.equal(entry.provenance.editorialInterpretation,false);
  assert.equal(entry.provenance.originalTextVendored,true);
  assert.ok(entry.claim.length>2);
}
for(const item of hex.entries){
  assert.ok(judgments.some(entry=>entry.hexagramId===item.hexagramId),`missing hexagram text ${item.hexagramId}`);
  for(let position=1;position<=6;position+=1){
    const entry=lines.find(candidate=>candidate.hexagramId===item.hexagramId&&candidate.linePosition===position);
    assert.ok(entry,`missing ${item.hexagramId} line ${position}`);
    assert.match(entry.claim,new RegExp(`^(初[六九]|[六九][二三四五]|上[六九])：`));
    assert.ok(entry.claim.slice(0,2).includes(item.lineStructure[position-1]===1?'九':'六'),`polarity mismatch ${item.hexagramId} line ${position}`);
  }
}

const authorities=Object.freeze({hexagramRegistry:hex,sourceRegistry:sources,perspectiveRegistry:perspectives,corpus});
const at='2026-08-25T00:00:00.000Z';
let runtimeCases=0;
for(const item of hex.entries){
  for(let position=1;position<=6;position+=1){
    const manualLines=item.lineStructure.map((bit,index)=>index===position-1?(bit===1?9:6):(bit===1?7:8));
    const result=await executeIChingProductRuntime({method:'I_CHING',question:'What can I observe before I decide?',inputMode:'MANUAL_LINES',lines:manualLines,sessionId:`ICH-LINE-${String(item.number).padStart(2,'0')}-${position}`,timestamp:at,projectionVersion:'1.0.0',selectedSourceIds:[SOURCE],selectedPerspectiveIds:[PERSPECTIVE]},authorities);
    assert.equal(result.ok,true);
    assert.equal(result.readingIr.structuralProjection.primary.hexagramId,item.hexagramId);
    assert.deepEqual(result.readingIr.structuralProjection.changingLines,[position]);
    const selected=result.readingIr.sourceInterpretation.commentaryCandidates.filter(candidate=>candidate.scope==='LINE');
    assert.equal(selected.length,1,`runtime line selection mismatch ${item.hexagramId}:${position}`);
    assert.equal(selected[0].linePosition,position);
    assert.equal(selected[0].sourceId,SOURCE);
    assert.equal(selected[0].selectedBecauseChanging,true);
    assert.equal(selected[0].realityTruth,false);
    assert.equal(selected[0].fateConclusion,false);
    assert.equal(result.readingIr.agency.decisionAuthority,'USER');
    assert.equal(result.readingIr.authority.sourceGapMayBeFilledByModel,false);
    assert.equal(result.publicView.production.runAllowed,false);
    runtimeCases+=1;
  }
}
assert.equal(runtimeCases,384);

assert.deepEqual(ICHING_CURRENT_AUTHORITY_PATHS,{
  hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v2.json',
  perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',
  corpus:'/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'
});
const denied=await executeCurrentEndpoint({request:new Request('https://example.test/api/symbolic-method-execute-v2',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'I_CHING'})}),data:{},env:{CF_PAGES_COMMIT_SHA:'90f87b962cc0f9a77996d2bb6deca5bfa38a1634'}});
assert.equal(denied.status,423);
assert.equal((await denied.json()).production.runAllowed,false);
assert.equal(readiness.contentReadiness.sourceBoundCanonicalLineWitnessCoverage,'384/384');
assert.equal(readiness.contentReadiness.humanInterpretiveReviewComplete,false);
assert.equal(readiness.currentAuthority.fullyActivated,false);
assert.equal(readiness.currentAuthority.publicRunAllowed,false);
assert.equal(freeze.frozenCoverage.canonicalLineTextWitness,'384/384');
assert.equal(freeze.frozenCoverage.runtimeChangingLineCases,'384/384');
for(const item of freeze.frozenScope) assert.equal(sha(item.path),item.sha256,`I Ching 384 freeze drift: ${item.path}`);
for(const value of Object.values(freeze.authorityBoundary)) assert.equal(value,false);

console.log('✓ ICHI-W17/W18 canonical text successor passed: 64/64 hexagram texts and 384/384 unique line positions are source-bound.');
console.log('✓ 384/384 changing-line Runtime cases selected the exact bound line; no model gap-fill, fate, reality-truth or professional authority was created.');
console.log('  Content witness coverage is complete. Human interpretation review and live activation gates remain fail-closed.');
