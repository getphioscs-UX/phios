import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZiweiR5AuthoringPack} from '../functions/personal-reading/narrative/ziwei-r5-authoring-pack.js';
import {verifyZwrProSectionW5} from '../functions/personal-reading/narrative/zwr-pro-w5-semantic-verifier.js';
import {verifyZwrProReferenceQualityW6} from '../functions/personal-reading/narrative/zwr-pro-w6-reference-quality-verifier.js';
import {verifyZwrProCrossSectionDuplicationW7} from '../functions/personal-reading/narrative/zwr-pro-w7-duplication-verifier.js';
import {verifyZwrProBilingualParityW8} from '../functions/personal-reading/narrative/zwr-pro-w8-bilingual-parity.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const w4=fs.readFileSync('functions/personal-reading/narrative/zwr-pro-w4-composer.js','utf8');
assert(w4.includes('composeReferenceGovernedDraftR1'),'W4 must use Report Pro governed composer');
assert(w4.includes('ZIWEI_R5_PAI_REGISTRY'),'W4 must route through admitted Zi Wei PAI registry');
assert(w4.includes('technicalAuthorityPack'),'W4 must carry customer-specific technical Authority Pack');
assert(!w4.includes('invokeOpenAIStructured'),'W4 method lane must not call OpenAI directly');
const packSource=fs.readFileSync('functions/personal-reading/narrative/ziwei-r5-authoring-pack.js','utf8');
assert(packSource.includes('subjectBinding:Object.freeze'),'Authority Pack must bind subject and input');

const refs={
 'zh-Hans':JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-copy-zh-Hans-v1.json','utf8')),
 en:JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-copy-en-v1.json','utf8'))
};
const ids=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
const results={};
for(const locale of ['zh-Hans','en']){
 const pack=await buildZiweiR5AuthoringPack({evidence:fixture.evidence,locale});
 assert.equal(pack.subjectBinding.subjectId,fixture.evidence.subjectId);
 assert.equal(pack.subjectBinding.inputFingerprint,fixture.evidence.inputFingerprint);
 const candidates=[];
 for(const id of ids){
  const sec=pack.sections.find(s=>s.sectionId===id),ref=refs[locale].sections.find(s=>s.id===id);
  const claimRefs=sec.claims.map(c=>c.claimId),supportRefs=[...new Set(sec.claims.flatMap(c=>c.sourceRefs))];
  const usedPalaceCodes=id==='S11'?[]:sec.technicalEvidence.palaces.map(p=>p.palaceCode);
  const usedTransformationKeys=sec.technicalEvidence.transformations.map(t=>[t.layer,t.palaceCode,t.targetStarCode,t.transformationCode].join(':'));
  const candidate={schemaVersion:'ZWR-PRO-W4-CANDIDATE-v1',status:'PASS',subjectBinding:pack.subjectBinding,locale,sectionId:id,title:ref.title,paragraphs:ref.paragraphs.map((text,i)=>({role:i===0?'STRUCTURE':i===ref.paragraphs.length-1?'NAVIGATION':'MEANING',text,claimRefs,supportRefs})),usedClaimRefs:claimRefs,usedPalaceCodes,usedTransformationKeys,candidateDigest:'fixture-'+locale+'-'+id};
  const w5=await verifyZwrProSectionW5({authorityPack:pack,candidate});assert(w5.accepted,id+' '+locale+' W5 '+w5.reasons.join(','));
  const w6=await verifyZwrProReferenceQualityW6({authorityPack:pack,candidate});assert(w6.accepted,id+' '+locale+' W6 '+w6.reasons.join(','));
  candidates.push(candidate);
 }
 const w7=await verifyZwrProCrossSectionDuplicationW7({candidates,locale});assert(w7.accepted,locale+' W7 '+w7.reasons.join(','));
 results[locale]={pack,candidates,w7};
}
const w8=await verifyZwrProBilingualParityW8({zhCandidates:results['zh-Hans'].candidates,enCandidates:results.en.candidates,zhAuthorityPack:results['zh-Hans'].pack,enAuthorityPack:results.en.pack});
assert(w8.accepted,'W8 '+w8.reasons.join(','));

const zhS03Pack=results['zh-Hans'].pack,zhS03=structuredClone(results['zh-Hans'].candidates.find(c=>c.sectionId==='S03'));
const falsePositiveText='命宫七杀旺坐命，旁见地空、天魁；这里的旺只属于七杀。';
zhS03.paragraphs[0].text=falsePositiveText;
const fp=await verifyZwrProSectionW5({authorityPack:zhS03Pack,candidate:zhS03});
assert(fp.accepted,'W5 must not attach Qi Sha brightness to Di Kong: '+fp.reasons.join(','));
const badBrightness=structuredClone(results['zh-Hans'].candidates.find(c=>c.sectionId==='S03'));
badBrightness.paragraphs[0].text='地空旺。'+badBrightness.paragraphs[0].text;
const badBrightnessVerdict=await verifyZwrProSectionW5({authorityPack:zhS03Pack,candidate:badBrightness});
assert(!badBrightnessVerdict.accepted&&badBrightnessVerdict.reasons.some(x=>x==='UNKNOWN_BRIGHTNESS_INFERENCE:DI_KONG'),'W5 must reject explicit unknown brightness assignment');

const s04zh=structuredClone(results['zh-Hans'].candidates.find(c=>c.sectionId==='S04'));
s04zh.paragraphs[0].text='当系统已经无法继续靠旧方式运行时，需要重新建立结构。'+s04zh.paragraphs[0].text;
const s04zhVerdict=await verifyZwrProReferenceQualityW6({authorityPack:results['zh-Hans'].pack,candidate:s04zh});
assert(s04zhVerdict.accepted,'W6 must allow ordinary Chinese “运行时” grammar: '+s04zhVerdict.reasons.join(','));
const internalRuntime=structuredClone(results['zh-Hans'].candidates.find(c=>c.sectionId==='S04'));
internalRuntime.paragraphs[0].text='运行时系统会在这里处理候选状态。'+internalRuntime.paragraphs[0].text;
const internalRuntimeVerdict=await verifyZwrProReferenceQualityW6({authorityPack:results['zh-Hans'].pack,candidate:internalRuntime});
assert(!internalRuntimeVerdict.accepted&&internalRuntimeVerdict.reasons.includes('GOVERNANCE_OR_PROCESS_PROSE'),'W6 must reject internal runtime jargon');

const bad=structuredClone(results.en.candidates[0]);bad.subjectBinding={...bad.subjectBinding,subjectId:'FOREIGN'};
const bad5=await verifyZwrProSectionW5({authorityPack:results.en.pack,candidate:bad});
assert(!bad5.accepted&&bad5.reasons.includes('SUBJECT_BINDING_MISMATCH'),'W5 must reject wrong subject');
const dup=structuredClone(results.en.candidates);dup[1].paragraphs[0].text=dup[0].paragraphs[0].text;
const bad7=await verifyZwrProCrossSectionDuplicationW7({candidates:dup,locale:'en'});
assert(!bad7.accepted,'W7 must reject cross-section duplicate');
const drift=structuredClone(results.en.candidates);drift[0].usedClaimRefs=['FOREIGN'];
const bad8=await verifyZwrProBilingualParityW8({zhCandidates:results['zh-Hans'].candidates,enCandidates:drift,zhAuthorityPack:results['zh-Hans'].pack,enAuthorityPack:results.en.pack});
assert(!bad8.accepted,'W8 must reject bilingual lineage drift');

const pipeline=fs.readFileSync('functions/personal-reading/narrative/zwr-pro-w4-w8-pipeline.js','utf8');
for(const token of ['composeZwrProSectionW4','verifyZwrProSectionW5','verifyZwrProReferenceQualityW6','verifyZwrProCrossSectionDuplicationW7','verifyZwrProBilingualParityW8','productionAdmissionGranted:false'])assert(pipeline.includes(token),'pipeline missing '+token);
console.log('PASS ZWR-PRO W4-W8: governed PAI/T3 composer; subject-bound semantic verification; reference-quality gate; cross-section dedup; bilingual lineage parity; production cutover remains closed.');
