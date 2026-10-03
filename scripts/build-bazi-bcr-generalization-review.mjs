import fs from 'node:fs';
import {generateCampaignCases,buildInputs} from './lib/bazi-fp-w17-campaign.mjs';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';
const dir='docs/acceptance/bazi-paid-report/bcr-generalization';fs.mkdirSync(dir,{recursive:true});
const definitions=['BALANCED_MULTI_FACTOR','DOMINANT_RESOURCE_OUTPUT','STRONG_PRESSURE_COUNTERWEIGHT','CAREER_COMPLEX','WEALTH_COMPLEX','RELATIONSHIP_COMPLEX','TIMING_TRANSITION_HEAVY','UNKNOWN_PARTIAL_TIMING'];
const pool=[];
for(const spec of generateCampaignCases()){
 const input=buildInputs(spec),full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',...input,locale:'en'});
 const modules=buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'});
 pool.push({spec,input,full,modules});
}

console.log('96 governed fixtures loaded; no provider calls.');
// Selection is transparent and retains the source fixture unchanged. Category
// qualification is provisional until its measured structural evidence is reviewed.
const count=(c,g)=>c.modules.tenGods.functionGroups.find(x=>x.groupCode===g)?.count||0;
const complete=c=>c.spec.includeHour&&c.spec.currentLuckState==='ACTIVE'&&c.spec.annualAvailable;
const scorers=[c=>-Math.max(...c.modules.tenGods.functionGroups.map(x=>x.count)),c=>Math.min(count(c,'RESOURCE'),count(c,'OUTPUT'))*10+count(c,'RESOURCE')+count(c,'OUTPUT'),c=>Math.min(count(c,'OFFICER'),count(c,'RESOURCE')+count(c,'PEER'))*10+count(c,'OFFICER'),c=>count(c,'OFFICER')+count(c,'OUTPUT')+count(c,'RESOURCE'),c=>count(c,'WEALTH')*10+count(c,'OUTPUT'),c=>c.modules.relationships?.relations?.length||c.full.readingIR?.findings?.length||0];
const used=new Set(),chosen=scorers.map(score=>{const candidates=pool.map((c,i)=>({c,i,score:score(c)})).filter(x=>complete(x.c)&&!used.has(x.i)).sort((a,b)=>b.score-a.score||a.i-b.i);const x=candidates[0];used.add(x.i);return x.i});
chosen.push(pool.findIndex(c=>c.spec.currentLuckState==='TRANSITION_DAY'));chosen.push(pool.findIndex(c=>!c.spec.annualAvailable));
const artifacts=[];
for(let i=0;i<8;i++){
 const c=pool[chosen[i]],caseId='BCR-GEN-'+String(i+1).padStart(2,'0'),locales=[];
 for(const locale of ['zh-Hans','en']){
  const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',...c.input,locale});
  const reading={schemaVersion:'PHI-OS-METHOD-NATIVE-CUSTOMER-READING-v1.0.0',methodId:'BZR',summary:{...full.report,reportDigest:full.report.reportDigest},structuralModel:{pillars:full.report.pillars,daYunTimeline:full.report.daYunTimeline},readingSections:full.report.sections,temporalContext:{state:'EXPLICIT',targetContext:c.input.temporalProjection.targetContext,unknownCodes:c.input.temporalProjection.unknown.map(x=>x.code)},evidence:{sourceNatalProjectionId:c.input.canonicalProjection.projectionId},publicationDecision:full.publicationDecision,professionalModules:buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'})};
  const temporalSnapshot={mode:'CUSTOM',localDate:c.spec.targetDate,localTime:'12:00:00',timezone:'Asia/Kuala_Lumpur',utcOffset:'+08:00',generatedAt:'2026-10-03T04:49:36.000Z'};
  let snapshot=null,error=null;try{snapshot=await buildBaziCustomerPublication({reading,locale,temporalSnapshot,full:true,compositionR1:true})}catch(e){error=e.message}
  const frozen=snapshot?.pages.flatMap(p=>p.compositionNodes||[]).filter(n=>n.paragraphs?.some(b=>/甲戌|Jia-Xu|己巳|Ji-Si/.test(b.text))).map(n=>n.sourceNodeId)||[];
  const evidence={caseId,category:definitions[i],sourceCaseId:c.spec.caseId,scope:'GOVERNED_SYNTHETIC_DOWNSTREAM_FIXTURE_NOT_REAL_BIRTH_CALCULATION',categoryQualification:'PROVISIONAL_REQUIRES_STRUCTURAL_REVIEW',selectionEvidence:{functionGroups:c.modules.tenGods.functionGroups,scenario:c.spec.scenarioCode,variant:c.spec.variantCode},input:c.input,readingDigest:full.report.reportDigest,temporalSnapshot,pageCount:snapshot?.totalPages,checks:{generationError:error,historicalSampleMarkers:frozen,providerCalls:0},status:error?'GENERATION_BLOCKED':frozen.length?'FACTUAL_BINDING_REJECTED':'REQUIRES_FACTUAL_AND_EDITORIAL_REVIEW',humanDecision:null};
  const path=`${dir}/${caseId}-${locale}.json`;fs.writeFileSync(path,JSON.stringify(evidence,null,2));locales.push({locale,path,status:evidence.status,error,frozenMarkers:frozen.length});
 }
 artifacts.push({caseId,category:definitions[i],sourceCaseId:c.spec.caseId,locales});
}
fs.writeFileSync(dir+'/manifest.json',JSON.stringify({work:'BCR-GEN-01-08',providerCalls:0,artifacts,productionAdmission:false,humanAcceptance:false},null,2));console.log(JSON.stringify(artifacts,null,2));
