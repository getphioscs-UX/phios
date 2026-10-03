import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZiweiR5AuthoringPack} from '../functions/personal-reading/narrative/ziwei-r5-authoring-pack.js';

const source=fs.readFileSync('functions/personal-reading/narrative/ziwei-r5-authoring-pack.js','utf8');
assert(!source.includes('OPENAI_API_KEY'),'Authoring pack must not depend on API key');
assert(!source.includes('ZIWEI_R5_PAI_REGISTRY'),'Authoring pack must not import provider registry');
assert(!source.includes('composeReportSectionT3('),'Authoring pack must not call live composer');

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
for(const locale of ['zh-Hans','en']){
 const pack=await buildZiweiR5AuthoringPack({evidence:fixture.evidence,locale});
 assert.equal(pack.schemaVersion,'ZIWEI-R5-AUTHORING-PACK-v2');
 assert.equal(pack.sectionCount,10);
 assert.equal(pack.apiKeyRequired,false);
 assert.equal(pack.liveProviderRequired,false);
 assert.deepEqual(pack.sections.map(s=>s.sectionId),['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
 assert(pack.wholeChartTechnicalSnapshot?.palaces?.length===12,'whole-chart 12-palace technical snapshot required');
 assert(Array.isArray(pack.wholeChartTechnicalSnapshot?.transformations),'whole-chart transformations required');
 for(const section of pack.sections){
  assert(section.claims.length>=7,section.sectionId+' claims too thin');
  assert(section.claims.every(c=>c.sourceRefs.length>0),section.sectionId+' source lineage missing');
  assert(section.authoringContract.requiredShape.length>=9,section.sectionId+' professional Zi Wei authoring contract too thin');
  assert(section.technicalEvidence?.palaces?.length>0,section.sectionId+' palace technical evidence required');
  assert(Array.isArray(section.technicalEvidence?.relationships),section.sectionId+' relationship network required');
  assert(Array.isArray(section.technicalEvidence?.transformations),section.sectionId+' transformation rows required');
  for(const palace of section.technicalEvidence.palaces){
   assert(palace.label,'palace label required');
   assert(Array.isArray(palace.stars),'resident stars required');
   for(const star of palace.stars){
    assert(star.label&&star.starCode,'star identity required');
    assert(typeof star.stateKnown==='boolean','star-state known flag required');
    assert(star.coreFunction&&star.decisionPattern,'professional star dimensions required');
   }
  }
 }
}
const registry=JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-candidates-v1.json','utf8'));
assert.equal(registry.productionUse,false);
assert.equal(registry.productionAdmissionGranted,false);
assert.equal(registry.acceptedCountZhHans,10);
assert.deepEqual(registry.pendingExplicitAcceptZhHans,[]);
assert.equal(registry.sections.S03.decision,'ACCEPT');
assert.equal(registry.sections.S11.decision,'ACCEPT');
assert.equal(registry.sections.S02.humanAccept,true);
assert.equal(registry.zhHansReviewState,'COMPLETE_10_OF_10_HUMAN_ACCEPT');
assert.equal(registry.customerFacingNaming.methodZh,'紫微斗数');
assert(registry.customerFacingNaming.forbiddenTokens.includes('Authoring Pack'));
assert(registry.customerFacingNaming.forbiddenTokens.includes('S03'));
console.log('PASS Zi Wei R5 authoring v2: technical authoring evidence is deterministic; 10/10 zh-Hans sections human ACCEPT; customer naming boundary locked; no API key, no live provider.');
