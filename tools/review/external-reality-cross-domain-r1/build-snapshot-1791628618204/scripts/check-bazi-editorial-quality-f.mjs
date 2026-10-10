import assert from 'node:assert/strict';
import fs from 'node:fs';
import {withEditorialMeaningBrief,MEANING_CANON_VERSION,QUALITY_VERSION,STYLE_CONTRACTS,editorialQualityMetrics,validateEditorialQuality} from '../functions/personal-reading/narrative/bazi-editorial-quality.js';
import {checkBaziShadowStage} from '../functions/personal-reading/narrative/bazi-t3-shadow-stages.js';
import {canShowT3} from '../functions/personal-reading/narrative/bazi-t3-composition.js';
import {T3_SECTIONS} from '../functions/personal-reading/narrative/bazi-editorial-contract.js';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
const packs=JSON.parse(fs.readFileSync('functions/personal-reading/narrative/bazi-t3-preview-packs.generated.json')).packs;
for(const locale of ['en','zh-Hans']){
 const source=packs[`BASELINE_NOW:${locale}:S02_PERSONALITY`],before=JSON.stringify(source),pack=await withEditorialMeaningBrief(source);
 assert.equal(source.explanatoryAuthorityVersion,'BAZI_EXPLANATORY_AUTHORITY_V2');assert(source.licensedClaims.some(c=>c.relationType==='LIFE_DOMAIN_EXPLANATION'));assert(source.licensedClaims.some(c=>c.relationType==='OPERATING_CONDITION'));
 assert.equal(JSON.stringify(source),before);assert.deepEqual(pack.licensedClaims,source.licensedClaims);
 assert.equal(pack.meaningCanon.version,MEANING_CANON_VERSION);assert.deepEqual(pack.sectionNarrativeBrief.styleContract,STYLE_CONTRACTS[locale]);
 for(const theme of pack.meaningCanon.themes)for(const key of ['customerMeaning','roleInWholeChart','supportingContext','tension','contrast','openCondition','allowedReflection','prohibitedInference'])assert(key in theme);
 assert.deepEqual(await withEditorialMeaningBrief(source),pack);
 if(source.sectionNarrativeBrief?.editorialRevision==='BAZI_S02_EDITORIAL_SCOPE_R2')assert.equal(pack.canonicalEvidenceHash,source.canonicalEvidenceHash,'serialized current briefs retain their exact evidence binding');
 else assert.notEqual(pack.canonicalEvidenceHash,source.canonicalEvidenceHash);
 assert.deepEqual(await withEditorialMeaningBrief(pack),pack,'reopening a revised brief is idempotent');
 assert.equal(pack.sectionNarrativeBrief.editorialRevision,'BAZI_S02_EDITORIAL_SCOPE_R2');
 assert.equal(pack.sectionNarrativeBrief.scopeDistribution.sharedScope.field,'boundaryNote');
 assert.deepEqual(pack.sectionNarrativeBrief.scopeDistribution.localConditions.map(c=>c.claimId),pack.sectionNarrativeBrief.orderedMeaningIds);
 assert.equal((await withEditorialMeaningBrief(packs[`BASELINE_NOW:${locale}:S03_LIFE_STRUCTURE`])).sectionNarrativeBrief.editorialRevision,undefined,'S02 revision must not revise later sections implicitly');
 assert.equal(pack.sectionNarrativeBrief.orderedMeaningIds[0],source.primaryThemes[0].id);
 const bad={lead:{text:'The functionalGroupId repeats 23.1% and 23.1%. This is not a prediction. This is not a prediction.'}};
 const result=validateEditorialQuality(bad,pack);assert.equal(result.status,'REJECT');assert(result.issues.includes('TECHNICAL_DENSITY'));assert(result.issues.includes('NUMBER_REPETITION'));assert(result.issues.includes('BOUNDARY_DENSITY'));
}
const m=editorialQualityMetrics('Learning and expression remain distinct themes here.',{otherSections:['Learning and expression remain distinct themes here.'],sectionTerms:['learning']});assert.equal(m.CROSS_SECTION_SIMILARITY,1);assert.equal(m.SECTION_SPECIFICITY,1);
for(const [locale,text] of [['en','The first pair provides context, without establishing any real-life effect. A different pair provides context, without establishing any real-life effect.'],['zh-Hans','自我位置与表达保留为背景，但不能据此认定现实作用。环境与自我位置是另一背景，但不能据此认定现实作用。']]){
 const result=validateEditorialQuality({interpretation:[{text}]},await withEditorialMeaningBrief(packs[`BASELINE_NOW:${locale}:S02_PERSONALITY`]));
 assert(result.issues.includes('TEMPLATE_PHRASE_REPETITION'));assert(result.issues.includes('BOUNDARY_DENSITY'));
 assert.equal(typeof result.metrics.SECTION_SPECIFICITY,'number');assert.equal(result.metrics.CROSS_SECTION_SIMILARITY,null,'no other section is not evidence of zero similarity');
}
const gateArgs={profileId:'BASELINE_NOW',sectionKey:'S03_LIFE_STRUCTURE',stagedProfiles:{HIGH:'high',LOW:'low',MIXED:'mixed'},passed:async()=>true};
assert.equal((await checkBaziShadowStage(gateArgs)).allowed,false);
assert.equal((await checkBaziShadowStage({...gateArgs,humanAccepted:async(_p,_l,s)=>s===T3_SECTIONS[0]})).allowed,true);
for(const action of ['matrix-status','parity'])assert.equal((await checkBaziShadowStage({...gateArgs,action})).allowed,false);
const snapshot={editorialQualityVersion:QUALITY_VERSION,locale:'en',sectionKey:'S02_PERSONALITY',snapshotDigest:'a'.repeat(64),sectionNarrativeBriefDigest:'b'.repeat(64)};
const acceptance={version:QUALITY_VERSION,humanReviews:[{...snapshot,briefDigest:snapshot.sectionNarrativeBriefDigest,decision:'ACCEPT',reviewer:'SYNTHETIC TEST ONLY',reviewedAt:'2026-09-23'}]};
assert.equal(canShowT3({stage:'QA',environment:'qa',snapshot,acceptance}),true);
assert.equal(canShowT3({stage:'QA',environment:'qa',snapshot:{...snapshot,snapshotDigest:'c'.repeat(64)},acceptance}),false);
assert.equal(canShowT3({stage:'PRODUCTION',environment:'production',snapshot,acceptance}),false);
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json'));
let implicitCalls=0;
const projection=await projectBaziSectionPublication({reading:source.reading,temporalContext:source.temporalSnapshot,locale:'en',composition:{registry:{models:[{providerId:'test',modelId:'test',capabilityClass:'DEEP',planningCostRank:1,status:'AVAILABLE'}]},providerAdapters:{test:async()=>{implicitCalls++;throw Error('IMPLICIT_PROVIDER_CALL');}},t3:{stage:'QA',environment:'qa'}}});
assert.equal(implicitCalls,0,'rendering cannot start provider generation');
assert(projection.internalSections.filter(s=>s.t3).every(s=>s.t3.internalOnly.fallbackReason==='ACCEPTED_SNAPSHOT_REQUIRED'));
console.log('PASS F: immutable admitted meaning projection, deterministic brief/style/metrics, human-before-next-section, digest-bound QA snapshots and Production T3 closed. No provider calls.');
