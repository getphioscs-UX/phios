import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildMarketBrief,evaluateMarketReading,MARKET_ROLES,MARKET_DIMENSIONS} from '../functions/personal-reading/narrative/bazi-s04-market-reading.js';
import {buildBaZiS04T2} from '../functions/personal-reading/narrative/bazi-s04-t2-runtime.js';
import {composeReportSectionT2} from '../functions/personal-reading/narrative/narrative-writer.js';
import {createReportSemanticReview} from '../functions/personal-reading/narrative/report-section-semantic-review.js';
import {verifyReportSectionComposition} from '../functions/personal-reading/narrative/report-section-semantic-verifier.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {editFrozenMarketCandidate} from '../functions/personal-reading/narrative/bazi-s04-market-editorial.js';
import {auditFrozenCareerCandidate} from '../functions/personal-reading/narrative/bazi-s04-review-audit.js';
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json'));
const registry=JSON.parse(fs.readFileSync('content/ai-economics/providers/ai-provider-cost-registry-v1.json'));
const zh=await buildMarketBrief({...source,locale:'zh-Hans'}),en=await buildMarketBrief({...source,locale:'en'});
assert(zh.careerNarrativeIR.eligibility.eligible);assert.equal(zh.sourceSemanticDigest,en.sourceSemanticDigest);assert.deepEqual(zh.claims,en.claims);
const {briefSemanticDigest,...seed}=zh;assert.equal(await sha256Stable(seed),briefSemanticDigest);
assert.equal(zh.authorityFacts['professionalModules/tenGods/items'].find(x=>x.tenGodCode==='SHANG_GUAN').count,0);
assert.equal(zh.authorityFacts['professionalModules/timing'].currentDaYun.stemTenGod.code,'SHANG_GUAN');
assert(!Object.keys(zh.authorityFacts).some(x=>/carryingContext|supportBalance|transparentStems/.test(x)));
let calls=0;
for(const mutate of [s=>delete s.reading.professionalModules.tenGods.dayMaster,s=>delete s.reading.professionalModules.timing.currentDaYun,s=>delete s.reading.professionalModules.timing.annual,s=>s.temporalSnapshot.localDate='2000-01-01',s=>s.reading.professionalModules.relationships.items=[],s=>s.reading.professionalModules.tenGods.items.find(x=>x.tenGodCode==='QI_SHA').sources.visible[0].stemCode='JIA',s=>delete s.reading.professionalModules.fiveElements]){
 const bad=structuredClone(source);mutate(bad);const r=await buildBaZiS04T2({...bad,locale:'zh-Hans',successor:'v4',registry,providerAdapters:{OPENAI:()=>{calls++;throw Error('Must not call');}}});assert.equal(r.status,'NOT_ELIGIBLE');
}
assert.equal(calls,0);
const candidate={sourceBriefDigest:zh.briefSemanticDigest,blocks:MARKET_ROLES.map(role=>({role,function:role,text:'癸水午月七杀正官甲戌大运2026丙午流年。'+('这是测试占位文字。'.repeat(23)),claimRefs:['S04:V4:'+role],supportRefs:zh.claims[0].sourceRefs}))};
const assessments=MARKET_DIMENSIONS.map(d=>({dimension:d,passed:true,evidence:'癸水午月七杀正官甲戌大运2026丙午流年。',reason:''}));
// Synthetic reviewer metadata tests gate plumbing, never claims prose quality.
const checked=evaluateMarketReading({brief:zh,candidate,verification:{semanticReview:{editorialAssessments:assessments}}});assert(checked.accepted,JSON.stringify(checked));
for(const change of [c=>c.blocks.pop(),c=>c.blocks.reverse(),c=>c.blocks.forEach(b=>b.text='短'),c=>c.blocks[0].text+='symbolic context',c=>c.blocks[1].text+='\n\n一\n\n二\n\n三']){
 const c=structuredClone(candidate);change(c);assert(!evaluateMarketReading({brief:zh,candidate:c,verification:{semanticReview:{editorialAssessments:assessments}}}).accepted);
}
assert(!evaluateMarketReading({brief:zh,candidate,verification:{semanticReview:{editorialAssessments:assessments.slice(1)}}}).accepted);
const tampered=structuredClone(candidate);tampered.sourceBriefDigest='bad';assert((await verifyReportSectionComposition({brief:zh,candidate:tampered})).reasons.includes('SOURCE_DIGEST_MISMATCH'));
const review=createReportSemanticReview({model:'test',invoke:async request=>{assert.deepEqual(request.schema.properties.editorialAssessments.items.properties.dimension.enum,MARKET_DIMENSIONS);assert(request.schema.properties.editorialAssessments.items.properties.evidence.enum.includes(assessments[0].evidence));assert(!request.schema.required.includes('careerSentenceLabels'));return {output:{}};}});
await review({brief:zh,candidate,candidateDigest:await sha256Stable(candidate)});
let writerCalls=0;
const r=await composeReportSectionT2({brief:zh,registry,providerAdapters:{OPENAI:async request=>{writerCalls++;assert.equal(request.schema.properties.blocks.maxItems,7);assert.deepEqual(request.schema.properties.blocks.items.properties.role.enum,MARKET_ROLES);return {output:candidate};}},verifier:async()=>({accepted:false,reasons:['TEST_REJECTION']})});
assert.equal(writerCalls,1);assert.equal(r.internalOnly.repairCount,0);
let failedCalls=0;await composeReportSectionT2({brief:en,registry,providerAdapters:{OPENAI:async()=>{failedCalls++;throw Object.assign(Error('timeout'),{code:'NARRATIVE_PROVIDER_TIMEOUT'});}}});assert.equal(failedCalls,1);
const frozen=JSON.parse(fs.readFileSync('docs/acceptance/report-narrative-t2-r1/bazi/s04-csd-v4/REVIEW-EVIDENCE.json'));
for(const locale of ['zh-Hans','en']){
 const original=frozen.originals[locale],{artifactDigest,...payload}=original;assert.equal(await sha256Stable(payload),artifactDigest);
 const edit=await editFrozenMarketCandidate(original.result.candidate,locale);
 const v=await verifyReportSectionComposition({brief:original.result.brief,candidate:edit.candidate});
 assert(v.reasons.every(x=>x==='SEMANTIC_REVIEW_REQUIRED'||x.startsWith('CLAIM_MEANING_NOT_VERIFIED:')||x.startsWith('MARKET_REVIEW:')),JSON.stringify(v.reasons));
 const changed=structuredClone(original.result.candidate);changed.blocks[0].text+='x';await assert.rejects(editFrozenMarketCandidate(changed,locale),/SOURCE_MISMATCH/);
 assert.deepEqual(edit.candidate.blocks.map(({text,...metadata})=>metadata),original.result.candidate.blocks.map(({text,...metadata})=>metadata));
 assert.equal(edit.audit.writerCalls,0);assert(edit.audit.requiresFreshIndependentReview);
}
const objects=new Map(),reservations=new Set();let reviewCalls=0;
const auditInput={record:frozen.originals.en,key:'qa/rnt2/csd-v4/s04/editorial-test.json',registry,env:{PRIVATE_REPORTS:{get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k))}:null,put:async(k,v)=>{objects.set(k,v);return {key:k};}},RUNTIME_DB:{prepare:sql=>({bind:id=>({run:async()=>{if(sql.startsWith('UPDATE'))return {meta:{changes:1}};const changes=reservations.has(id)?0:1;reservations.add(id);return {meta:{changes}};}})})}},adapter:async request=>{reviewCalls++;assert.equal(request.taskType,'REPORT_SECTION_SEMANTIC_VERIFICATION');return {output:{sourceBriefDigest:request.payload.sourceBriefDigest,candidateDigest:request.payload.candidateDigest,meaningfullyUsedClaimRefs:[],reasons:['INJECTED_REJECTION'],editorialAssessments:[]}};}};
const audited=await auditFrozenCareerCandidate(auditInput);assert.equal(audited.status,200);assert.equal(audited.body.result.result.status,'FALLBACK');assert.equal(audited.body.result.result.reviewAudit.generationCalls,0);assert.equal(reviewCalls,1);
assert.equal((await auditFrozenCareerCandidate(auditInput)).body.cacheHit,true);assert.equal(reviewCalls,1);assert.equal(reservations.size,1);
console.log('PASS: V4 authority gates, source consistency, bilingual evidence parity, 7-block/length/language checks, bound review schema, tamper rejection, no retry/repair. No paid calls.');
