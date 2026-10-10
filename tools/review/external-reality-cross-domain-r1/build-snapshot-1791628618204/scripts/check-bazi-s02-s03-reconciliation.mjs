import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildReconciledBaZiBrief,RECONCILIATION_SECTIONS,RECONCILIATION_VERSION} from '../functions/personal-reading/narrative/bazi-s02-s03-reconciliation.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {runBaZiS04PrivateReview} from '../functions/personal-reading/narrative/bazi-s04-private-review.js';
import {composeReportSectionT2} from '../functions/personal-reading/narrative/narrative-writer.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('docs/guided-report-successor-r2/bazi-source.json');
const owner=read('docs/acceptance/report-narrative-t2-r1/bazi/s05-market-v1/OWNER-ACCEPTANCE.json');
const s05=read('docs/acceptance/report-narrative-t2-r1/bazi/s05-market-v1/REVIEW-EVIDENCE.json');
const {acceptanceDigest,...ownerSeed}=owner;
assert.equal(acceptanceDigest,await sha256Stable(ownerSeed));assert.equal(owner.decision,'ACCEPT');
assert.equal(owner.sectionKey,'S05_WEALTH');assert.equal(owner.productionActivated,false);
for(const l of ['zh-Hans','en']){assert.equal(owner.locales[l].artifactDigest,s05.records[l].artifactDigest);assert.equal(owner.locales[l].candidateDigest,await sha256Stable(s05.records[l].result.candidate));assert.equal(owner.locales[l].decision,'ACCEPT');}
const old=read('functions/personal-reading/narrative/bazi-t3-preview-baseline.generated.json').packs;
const sections={};
const registry=read('content/ai-economics/providers/ai-provider-cost-registry-v1.json');
const objects=new Map(),reserved=new Set();
const env={PHIOS_ENVIRONMENT:'qa',RNT2_S04_REVIEW:'enabled',RNT2_REVIEWER_IDS:'reviewer',OPENAI_API_KEY:'TEST_ONLY',PRIVATE_REPORTS:{get:async k=>objects.has(k)?{json:async()=>JSON.parse(objects.get(k))}:null,put:async(k,v)=>{objects.set(k,v);return {key:k};}},RUNTIME_DB:{prepare:sql=>({bind:id=>({run:async()=>{if(!sql.startsWith('INSERT OR IGNORE INTO runtime_artifacts'))return {meta:{changes:1}};const changes=reserved.has(id)?0:1;reserved.add(id);return {meta:{changes}};}})})}};
for(const [sectionKey,spec] of Object.entries(RECONCILIATION_SECTIONS)){
 const briefs={};
 for(const locale of ['zh-Hans','en']){
  const brief=await buildReconciledBaZiBrief({...source,locale,sectionKey});
  const {briefSemanticDigest,...seed}=brief;assert.equal(await sha256Stable(seed),briefSemanticDigest);
  assert(brief.reconciledNarrativeIR.eligibility.eligible);assert.equal(brief.marketDomain,spec.topicCode);
  assert(!brief.careerNarrativeIR);assert.equal(brief.claims.length,7);
  assert.equal(Object.entries(brief.authorityFacts).find(([k])=>k.endsWith('/leadGroup'))[1].groupCode,spec.leadGroup);
  assert(!Object.keys(brief.authorityFacts).some(k=>/carryingContext|supportBalance|transparentStems/.test(k)));
  assert.equal(brief.authorityFacts['professionalModules/tenGods/items'].find(x=>x.tenGodCode==='SHANG_GUAN').count,0);
  assert.equal(brief.authorityFacts['professionalModules/timing'].currentDaYun.stemTenGod.code,'SHANG_GUAN');
  const legacy=old[`BASELINE_NOW:${locale}:${sectionKey}`];
  const invalidLegacyRefs=[...new Set(legacy.licensedClaims.flatMap(c=>c.sourceRefs||[]).filter(x=>/carryingContext|supportBalance|transparentStems/.test(x)))];
  assert(invalidLegacyRefs.length>0);
  let writers=0;await composeReportSectionT2({brief,registry,providerAdapters:{OPENAI:async request=>{writers++;assert(request.systemPrompt.includes('learning and expression'));assert.deepEqual(request.schema.properties.blocks.items.properties.role.enum,brief.requiredClaimRoles);throw Error('TEST_ONLY_STOP');}}});assert.equal(writers,1);
  let composed=0;const input={env,userId:'reviewer',source,registry,lane:sectionKey.slice(0,3),body:{action:'rnt2-'+sectionKey.slice(0,3).toLowerCase(),sectionKey,locale},compose:async args=>{composed++;assert.equal(args.sectionKey,sectionKey);return {status:'TEST_ONLY'};}};
  assert.equal((await runBaZiS04PrivateReview({...input,s05Acceptance:{}})).body.code,'S05_BILINGUAL_OWNER_ACCEPTANCE_REQUIRED');
  assert.equal((await runBaZiS04PrivateReview({...input,userId:'other'})).status,403);
  const qa=await runBaZiS04PrivateReview(input);assert.equal(qa.status,200);assert(qa.body.objectKey.includes('/'+sectionKey.slice(0,3).toLowerCase()+'/'));
  assert.equal((await runBaZiS04PrivateReview(input)).body.cacheHit,true);assert.equal(composed,1);
  briefs[locale]={briefDigest:briefSemanticDigest,sourceDigest:brief.sourceSemanticDigest,objectKey:qa.body.objectKey,claimIds:brief.claims.map(c=>c.claimId),legacyBriefDigest:legacy.sectionNarrativeBriefDigest,excludedLegacyRefs:invalidLegacyRefs};
 }
 assert.equal(briefs.en.sourceDigest,briefs['zh-Hans'].sourceDigest);assert.deepEqual(briefs.en.claimIds,briefs['zh-Hans'].claimIds);
 const missing=structuredClone(source);missing.reading.professionalModules.professionalTopics.topics=missing.reading.professionalModules.professionalTopics.topics.filter(t=>t.topicCode!==spec.topicCode);
 assert(!(await buildReconciledBaZiBrief({...missing,locale:'en',sectionKey})).reconciledNarrativeIR.eligibility.eligible);
 sections[sectionKey]={topicCode:spec.topicCode,customerTitle:spec.title,leadGroup:spec.leadGroup,legacyAcceptanceTransfers:false,state:'RECONCILED_BRIEF_READY_REQUIRES_NEW_BILINGUAL_REVIEW',locales:briefs};
}
await assert.rejects(()=>buildReconciledBaZiBrief({...source,locale:'en',sectionKey:'S04_CAREER'}),/SECTION_REQUIRED/);
const report={version:RECONCILIATION_VERSION,state:'RECONCILIATION_PREFLIGHT_PASS',predecessorAcceptanceDigest:acceptanceDigest,sourceSnapshot:source.temporalSnapshot.localDate,sections,providerCalls:0,productionActivated:false,next:'Wire reconciled briefs into the existing writer/reviewer and protected QA lane; request scoped authorization before any live calls.'};
if(process.argv.includes('--write')){const dir='docs/acceptance/report-narrative-t2-r1/bazi/s02-s03-reconciliation';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/PREFLIGHT.json',JSON.stringify(report,null,2)+'\n');}
console.log('PASS: S05 accepted candidate binding; S02 CAPABILITY and S03 LIFE_OPERATION source priorities; bilingual digest/claim parity; legacy aggregate exclusion; no natal Output invention; missing source fails closed. No provider calls.');
const {editFrozenReconciledCandidate}=await import('../functions/personal-reading/narrative/bazi-s02-s03-editorial.js');
const {verifyReportSectionComposition}=await import('../functions/personal-reading/narrative/report-section-semantic-verifier.js');
const {auditFrozenCareerCandidate}=await import('../functions/personal-reading/narrative/bazi-s04-review-audit.js');
for(const short of ['s02','s03']){
 const evidence=read(`docs/acceptance/report-narrative-t2-r1/bazi/${short}-market-v1/REVIEW-EVIDENCE.json`);
 for(const l of ['en','zh-Hans']){
  const record=(evidence.originals||evidence.records)[l],r=record.result;
  const edit=await editFrozenReconciledCandidate(r.candidate,l,r.brief.sectionKey);
  const verification=await verifyReportSectionComposition({brief:r.brief,candidate:edit.candidate});
  assert(verification.reasons.every(x=>x==='SEMANTIC_REVIEW_REQUIRED'||x.startsWith('CLAIM_MEANING_NOT_VERIFIED:')||x.startsWith('MARKET_REVIEW:')),JSON.stringify(verification.reasons));
  assert.deepEqual(edit.candidate.blocks.map(({text,...meta})=>meta),r.candidate.blocks.map(({text,...meta})=>meta));
  await assert.rejects(()=>editFrozenReconciledCandidate({...r.candidate,tampered:true},l,r.brief.sectionKey),/SOURCE_MISMATCH/);
  let calls=0;const input={record,key:`qa/rnt2/market-v1/${short}/test-${l}.json`,env,registry,adapter:async request=>{calls++;assert.equal(request.taskType,'REPORT_SECTION_SEMANTIC_VERIFICATION');assert(!request.systemPrompt.includes('Wealth connected to clients/market/income method'));return {output:{sourceBriefDigest:request.payload.sourceBriefDigest,candidateDigest:request.payload.candidateDigest,meaningfullyUsedClaimRefs:[],reasons:['TEST_REJECTION'],editorialAssessments:[]}};}};
  const audit=await auditFrozenCareerCandidate(input);assert.equal(audit.status,200);assert.equal(calls,1);assert.equal(audit.body.result.result.status,'FALLBACK');assert.equal(audit.body.result.result.reviewAudit.generationCalls,0);
  assert.equal((await auditFrozenCareerCandidate(input)).body.cacheHit,true);assert.equal(calls,1);
 }
}
console.log('PASS: all four frozen edits preserve references, reject source tampering, clear structural blockers and require fresh independent review; cached audits make no repeated calls.');
