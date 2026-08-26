import assert from 'node:assert/strict';
import fs from 'node:fs';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v2.js';
import {onRequestPost as executeCurrentEndpoint,ICHING_CURRENT_AUTHORITY_PATHS} from '../functions/api/symbolic-method-execute-v3.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const authorities=Object.freeze({
  hexagramRegistry:read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),
  sourceRegistry:read('content/interpretation/iching/registries/iching-source-registry-v2.json'),
  perspectiveRegistry:read('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json'),
  corpus:read('content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json'),
  depthCorpus:read('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json')
});
const stableLines=item=>item.lineStructure.map(bit=>bit===1?7:8);
const changingLines=(item,position)=>item.lineStructure.map((bit,index)=>index===position-1?(bit===1?9:6):(bit===1?7:8));
const base={method:'I_CHING',question:'What can I observe before I decide?',inputMode:'MANUAL_LINES',timestamp:'2026-08-26T02:04:00.000Z',projectionVersion:'1.0.0'};
const forbiddenReviewWarnings=new Set([
 '候选解释尚未完成人工来源与双语审核，不得进入公共客户输出。','候选逐爻解释尚未完成人工来源与双语审核，不得进入公共客户输出。',
 'This candidate has not completed human source and bilingual review and cannot enter public customer output.','This line candidate has not completed human source and bilingual review and cannot enter public customer output.'
]);
let cases=0;
for(const item of authorities.hexagramRegistry.entries){
  for(const locale of ['en','zh-Hans']){
    const whole=await executeIChingProductRuntime({...base,lines:stableLines(item),sessionId:`DEPTH-${locale}-${item.hexagramId}-H`,locale},authorities);
    assert.equal(whole.runtimeVersion,'2.0.0');assert.equal(whole.readingIr.structuralProjection.primary.hexagramId,item.hexagramId);assert.equal(whole.depthSupplement.status,'AVAILABLE');assert.equal(whole.depthSupplement.depth.hexagram.coordinate,item.hexagramId);assert.equal(whole.depthSupplement.depth.lines.length,0);assert.equal(whole.execution.humanApprovedDepthOnly,true);assert.equal(whole.execution.candidateFallbackUsed,false);assert.equal(whole.execution.runtimeModelDepthGenerationUsed,false);assert.equal(whole.publicView.schemaVersion,'PHI-OS-ICHING-PRODUCT-PUBLIC-VIEW-MODEL-v2.0.0');
    const layer=whole.publicView.hierarchy.find(x=>x.id==='SYMBOLIC_INTERPRETATION');const depth=layer.data.depthInterpretation;assert.equal(depth.status,'AVAILABLE');assert.equal(depth.locale,locale);assert.equal(depth.hexagram.humanApproved,true);assert.equal(depth.publicationProjection.internalCandidateReviewStatusWarningOmitted,true);assert.ok(depth.hexagram.content.misreadingWarnings.every(x=>!forbiddenReviewWarnings.has(x)));assert.ok(depth.hexagram.content.misreadingWarnings.length>=1);assert.equal(whole.publicView.production.humanApprovedDepthBound,true);assert.equal(whole.publicView.production.runAllowed,false);cases++;
  }
  for(let position=1;position<=6;position+=1){
    for(const locale of ['en','zh-Hans']){
      const result=await executeIChingProductRuntime({...base,lines:changingLines(item,position),sessionId:`DEPTH-${locale}-${item.hexagramId}-L${position}`,locale},authorities);
      assert.equal(result.readingIr.structuralProjection.primary.hexagramId,item.hexagramId);assert.deepEqual(result.readingIr.structuralProjection.changingLines,[position]);assert.equal(result.depthSupplement.status,'AVAILABLE');assert.equal(result.depthSupplement.depth.lines.length,1);assert.equal(result.depthSupplement.depth.lines[0].linePosition,position);assert.equal(result.depthSupplement.depth.lines[0].provenance.reviewer,'TL');
      const depth=result.publicView.hierarchy.find(x=>x.id==='SYMBOLIC_INTERPRETATION').data.depthInterpretation;assert.equal(depth.lines.length,1);assert.equal(depth.lines[0].linePosition,position);assert.equal(depth.lines[0].humanApproved,true);assert.ok(depth.lines[0].content.misreadingWarnings.every(x=>!forbiddenReviewWarnings.has(x)));assert.equal(result.production.depthCoverage,'448/448');assert.equal(result.production.productionEligible,false);cases++;
    }
  }
}
assert.equal(cases,896);
assert.deepEqual(ICHING_CURRENT_AUTHORITY_PATHS,{
  hexagramRegistry:'/content/professional/core-method-runtime/iching-hexagram-registry-v1.json',sourceRegistry:'/content/interpretation/iching/registries/iching-source-registry-v2.json',perspectiveRegistry:'/content/interpretation/iching/registries/iching-interpretation-perspective-registry-v2.json',corpus:'/content/interpretation/iching/corpus/iching-public-domain-canonical-corpus-v2.json',depthCorpus:'/content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json'
});
const denied=await executeCurrentEndpoint({request:new Request('https://example.test/api/symbolic-method-execute-v3',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'I_CHING'})}),data:{},env:{CF_PAGES_COMMIT_SHA:'526547698894de0d33d09447aed0b93b83558114'}});assert.equal(denied.status,423);const body=await denied.json();assert.equal(body.production.runAllowed,false);assert.equal(body.production.humanDepthEditorialReady,true);
console.log(`✓ ICHI-DEPTH-W11 product composition passed ${cases}/896 bilingual Runtime cases (64 whole-hexagram + 384 changing-line coordinates × 2 locales).`);
console.log('✓ Product v2 consumes admitted-v2 only; candidate fallback/model depth generation remain forbidden, and internal candidate-status warnings are deterministically omitted from publication projection.');
console.log('  Current v3 API candidate remains fail-closed until trusted live activation authority is present.');
