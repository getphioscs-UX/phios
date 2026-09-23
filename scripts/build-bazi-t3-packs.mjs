import fs from 'node:fs';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {T3_SECTIONS} from '../functions/personal-reading/narrative/bazi-editorial-contract.js';
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json'));
const packs={},profiles=[{id:'BASELINE_NOW',...source}],matrix=[];
const campaign=generateCampaignCases();
for(const index of [1,4,5,6,8,16,24,32,40,48,72]){
 const spec=campaign[index],input=buildInputs(spec);
 const reading=await buildBaziMethodNativeReading({canonicalProjection:input.canonicalProjection,temporalProjectionOverride:input.temporalProjection,locale:'en'});
 profiles.push({id:spec.caseId,reading,temporalSnapshot:{mode:'CUSTOM',localDate:spec.targetDate,localTime:'12:00:00',timezone:'Asia/Kuala_Lumpur',utcOffset:'+08:00',instant:spec.targetDate+'T04:00:00.000Z',generatedAt:source.temporalSnapshot.generatedAt},scenario:spec.scenarioCode,variant:spec.variantCode});
}
for(const profile of profiles)for(const locale of ['en','zh-Hans']){
 let projection,error=null;
 try{projection=await projectBaziSectionPublication({reading:profile.reading,locale,temporalContext:profile.temporalSnapshot,composition:{t3:{stage:'SHADOW'}}});}catch(e){error=e.code||e.message;}
 for(const sectionKey of T3_SECTIONS){
  const section=projection?.internalSections.find(s=>s.sectionKey===sectionKey);
  const key=`${profile.id}:${locale}:${sectionKey}`;
  if(section?.t3)packs[key]=section.t3.evidencePack;
  matrix.push({profileId:profile.id,locale,sectionKey,mode:profile.temporalSnapshot.mode,scenario:profile.scenario||'CANONICAL_NOW_BENCHMARK',variant:profile.variant||'OPEN_PATTERN',state:error?'SOURCE_REJECTED':'LIVE_NOT_RUN',reason:error||null,evidenceHash:section?.t3?.evidencePack.canonicalEvidenceHash||null});
 }
 matrix.push({profileId:profile.id,locale,sectionKey:'S01_OVERVIEW',control:true,state:error?'SOURCE_REJECTED':'DETERMINISTIC_CONTROL_PASS',reason:error});
}
const fixtureClass='SYNTHETIC_EXISTING_CANONICAL_BAZI_BENCHMARK';
fs.writeFileSync('functions/personal-reading/narrative/bazi-t3-preview-packs.generated.json',JSON.stringify({fixtureClass,profileIds:profiles.map(p=>p.id),packs},null,2)+'\n');
fs.mkdirSync('docs/guided-report-successor-r2/bazi-t3',{recursive:true});
fs.writeFileSync('docs/guided-report-successor-r2/bazi-t3/shadow-matrix.json',JSON.stringify({fixtureClass,liveAccepted:false,profiles:profiles.length,locales:2,t3Sections:8,deterministicControls:1,matrix},null,2)+'\n');
console.log(JSON.stringify({profiles:profiles.length,matrixChecks:matrix.length,packs:Object.keys(packs).length,sourceRejections:matrix.filter(x=>x.state==='SOURCE_REJECTED').length,liveProviderInvoked:false}));
