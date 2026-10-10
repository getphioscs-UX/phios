import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZiweiR5AuthoringPack} from '../functions/personal-reading/narrative/ziwei-r5-authoring-pack.js';
import {verifyZwrProSectionW5} from '../functions/personal-reading/narrative/zwr-pro-w5-semantic-verifier.js';
import {verifyZwrProReferenceQualityW6} from '../functions/personal-reading/narrative/zwr-pro-w6-reference-quality-verifier.js';
import {verifyZwrProCrossSectionDuplicationW7} from '../functions/personal-reading/narrative/zwr-pro-w7-duplication-verifier.js';
import {verifyZwrProBilingualParityW8} from '../functions/personal-reading/narrative/zwr-pro-w8-bilingual-parity.js';
import {createZwrProImmutableSnapshotW9,assertZwrProSnapshotReopenW9} from '../functions/personal-reading/narrative/zwr-pro-w9-immutable-snapshot.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const refs={
 'zh-Hans':JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-copy-zh-Hans-v1.json','utf8')),
 en:JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-copy-en-v1.json','utf8'))
};
const ids=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
const sides={};
for(const locale of ['zh-Hans','en']){
 const pack=await buildZiweiR5AuthoringPack({evidence:fixture.evidence,locale});
 const candidates=[],sectionVerifications=[];
 for(const id of ids){
  const sec=pack.sections.find(s=>s.sectionId===id),ref=refs[locale].sections.find(s=>s.id===id);
  const claimRefs=sec.claims.map(c=>c.claimId),supportRefs=[...new Set(sec.claims.flatMap(c=>c.sourceRefs))];
  const usedPalaceCodes=id==='S11'?[]:sec.technicalEvidence.palaces.map(p=>p.palaceCode);
  const usedTransformationKeys=sec.technicalEvidence.transformations.map(t=>[t.layer,t.palaceCode,t.targetStarCode,t.transformationCode].join(':'));
  const seed={schemaVersion:'ZWR-PRO-W4-CANDIDATE-v1',status:'PASS',subjectBinding:pack.subjectBinding,locale,sectionId:id,title:ref.title,paragraphs:ref.paragraphs.map((text,i)=>({role:i===0?'STRUCTURE':i===ref.paragraphs.length-1?'NAVIGATION':'MEANING',text,claimRefs,supportRefs})),usedClaimRefs:claimRefs,usedPalaceCodes,usedTransformationKeys,sourceBriefDigest:'fixture-brief-'+locale+'-'+id,authorityPackVersion:pack.schemaVersion,provider:{provider:'fixture',model:'fixture',transportCalls:0,semanticReviewCalls:0}};
  const candidate={...seed,candidateDigest:await sha256Stable(seed)};
  const semantic=await verifyZwrProSectionW5({authorityPack:pack,candidate});assert(semantic.accepted,id+' '+locale+' W5');
  const quality=await verifyZwrProReferenceQualityW6({authorityPack:pack,candidate});assert(quality.accepted,id+' '+locale+' W6');
  candidates.push(candidate);sectionVerifications.push({sectionId:id,semantic,quality});
 }
 const duplication=await verifyZwrProCrossSectionDuplicationW7({candidates,locale});assert(duplication.accepted,locale+' W7');
 sides[locale]={pack,candidates,sectionVerifications,duplication};
}
const parity=await verifyZwrProBilingualParityW8({zhCandidates:sides['zh-Hans'].candidates,enCandidates:sides.en.candidates,zhAuthorityPack:sides['zh-Hans'].pack,enAuthorityPack:sides.en.pack});
assert(parity.accepted,'W8 fixture parity required');
const pipelineSeed={schemaVersion:'ZWR-PRO-W4-W8-PIPELINE-v1',status:'PASS_W4_W8',subjectBinding:sides['zh-Hans'].pack.subjectBinding,zh:{candidates:sides['zh-Hans'].candidates,sectionVerifications:sides['zh-Hans'].sectionVerifications,duplication:sides['zh-Hans'].duplication},en:{candidates:sides.en.candidates,sectionVerifications:sides.en.sectionVerifications,duplication:sides.en.duplication},parity,productionAdmissionGranted:false};
const pipelineResult={...pipelineSeed,pipelineDigest:await sha256Stable(pipelineSeed)};
const createdAt='2026-10-05T00:00:00.000Z';
const a=await createZwrProImmutableSnapshotW9({pipelineResult,createdAt});
const b=await createZwrProImmutableSnapshotW9({pipelineResult,createdAt});
assert.equal(a.reportSnapshotId,b.reportSnapshotId,'W9 deterministic snapshot identity');
assert.equal(a.immutable,true);
assert.equal(a.providerRegenerationOnReopen,false);
assert.equal(a.productionAdmissionGranted,false);
assert.equal(a.localeSnapshots['zh-Hans'].immutable,true);
assert.equal(a.localeSnapshots.en.immutable,true);
assert.equal(a.localeSnapshots['zh-Hans'].providerRegenerationOnReopen,false);
assert.equal(a.localeSnapshots.en.providerRegenerationOnReopen,false);
assert.equal(assertZwrProSnapshotReopenW9(a).reportSnapshotId,a.reportSnapshotId);
const changed=structuredClone(pipelineResult);
changed.subjectBinding={...changed.subjectBinding,inputFingerprint:'f'.repeat(64)};
changed.zh.candidates=changed.zh.candidates.map(c=>({...c,subjectBinding:changed.subjectBinding}));
changed.en.candidates=changed.en.candidates.map(c=>({...c,subjectBinding:changed.subjectBinding}));
const c=await createZwrProImmutableSnapshotW9({pipelineResult:changed,createdAt});
assert.notEqual(c.reportSnapshotId,a.reportSnapshotId,'W9 input drift must change snapshot id');
console.log('PASS ZWR-PRO W9: bilingual verified content freezes into deterministic immutable subject-bound snapshots; reopen requires exact snapshot and performs zero provider regeneration; production remains closed.');
