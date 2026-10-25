import {buildEcrHumanRuntimeReport} from './ecr-human-runtime-report-v4-1.js';

// Publication organization only. Calculation and semantic admission stay with V4.1.
export const ECR_DEEP_R2_SECTIONS=Object.freeze([
 ['01','Configuration Overview','构型概览',['OVERVIEW']],
 ['02','Birth / Design','出生与 Design',['INITIALIZATION']],
 ['03','Planetary Drivers','行星驱动',['DRIVER_FIELD']],
 ['04','Gate & Line','Gate 与 Line',['EVIDENCE']],
 ['05','Reality Grammar & Questions','现实语法与问题',['ORIENTATION']],
 ['06','Capability & Activation','能力与激活',['ORIENTATION']],
 ['07','Carrier & Environment','载体与环境',['CARRIER_ARCHITECTURE','C1']],
 ['08','Experience & Expression','体验与表达',['C2','C3']],
 ['09','Agency & Identity','行动与身份',['C4','C5']],
 ['10','Contribution & Resources','贡献与资源',['CONTINUITY']],
 ['11','Reality Comparison & PHI Card Reflection','现实对照与 PHI 牌卡反思',['CURRENT_REALITY']],
 ['12','Navigation & Continuity','导航与持续',['NAVIGATION']]
].map(([id,en,zh,predecessors])=>Object.freeze({id,en,zh,predecessors:Object.freeze(predecessors),interactive:Number(id)>10})));

export function buildEcrDeepReadingR2({ir,locale='en',reviewMode=false}={}) {
 if(!['en','zh-Hans','bilingual'].includes(locale))throw Error('ECR_R2_LANGUAGE_INVALID');
 // No customer release path is created by a review projection or client flag.
 if(reviewMode!==true)throw Error('ECR_R2_CUSTOMER_ADMISSION_REQUIRED');
 const languages=locale==='bilingual'?['zh-Hans','en']:[locale];
 const sources=Object.fromEntries(languages.map(language=>[language,buildEcrHumanRuntimeReport({ir,locale:language,reviewMode:true,sharedEntitlement:{schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:'ECR',access:{methodAllowed:true,readingDepthAllowed:true}}})]));
 return {schemaVersion:'PHI-OS-ECR-DEEP-READING-R2-REVIEW-v1',methodId:'ECR',productType:'PHI_CONFIGURATION_READING',locale,
  sourceConfigurationId:ir.configurationId,calculationIdentity:ir.initialization.calculationDigest??ir.lineage.initializationDigest,
  interpretationIdentity:'ECR-DEEP-R2-REVIEW-v1',currentRealityIdentity:ir.currentReality?.schemaVersion??null,
  publicationState:'HUMAN_REVIEW_REQUIRED',customerPublishable:false,paymentProof:false,providerCalls:0,
  sections:ECR_DEEP_R2_SECTIONS.map(section=>({...section,content:Object.fromEntries(languages.map(language=>[language,section.predecessors.map(id=>sources[language].sections.find(s=>s.sectionId===id)).filter(Boolean)])),
   semanticStatus:['04','05','06','07','08','09','10'].includes(section.id)?'MEANING_NOT_ADMITTED':'SOURCE_PROJECTION',
   ...(section.id==='04'?{fourFactorUnits:ir.semanticDepth}:{}),
   ...(section.id==='10'?{personalContribution:'UNKNOWN',professionalConclusion:'NOT_ADMITTED'}:{})})),
  pdfSectionIds:ECR_DEEP_R2_SECTIONS.filter(s=>!s.interactive).map(s=>s.id),interactiveSectionIds:['11','12'],
  lineage:ir.lineage,boundaries:{reviewIsNotEntitlement:true,rendererCalculates:false,profileFactsCreated:false,currentPriority:'UNKNOWN',k4:'UNKNOWN'}};
}
