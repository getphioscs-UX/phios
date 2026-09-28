import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildReconciledBaZiBrief,RECONCILIATION_SECTIONS,RECONCILIATION_VERSION} from '../functions/personal-reading/narrative/bazi-s02-s03-reconciliation.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
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
  briefs[locale]={briefDigest:briefSemanticDigest,sourceDigest:brief.sourceSemanticDigest,claimIds:brief.claims.map(c=>c.claimId),legacyBriefDigest:legacy.sectionNarrativeBriefDigest,excludedLegacyRefs:invalidLegacyRefs};
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
