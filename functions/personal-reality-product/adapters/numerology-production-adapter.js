import {buildMethodProductEnvelope,section,visual,list,text,localeOf,fail} from '../product-envelope-core.js';
export function adaptNumerologyPersonalRealityProduct({reading,locale=reading?.locale||'en'}={}){
 if(reading?.schemaVersion!=='PHI-OS-NUM-INTEGRATED-READING-IR-v1.0.0'||reading.customerPublishable!==true)fail('PPR_R2_NUM_INTEGRATED_READING_REQUIRED');
 const l=localeOf(locale),s=reading.sections||{},themes=list(s.standoutThemes),snapshot=list(s.snapshot);
 const sections=[
  section({sectionId:'CORE_NUMBERS',title:text(l,'Core numbers','核心数字'),payload:snapshot,sourceRefs:[reading.sourceProjectionId].filter(Boolean)}),
  section({sectionId:'STANDOUT_THEMES',title:text(l,'Standout themes','主要主题'),payload:themes,sourceRefs:[reading.sourceMeaningBundleCode].filter(Boolean)}),
  section({sectionId:'RELATIONSHIPS',title:text(l,'How the numbers work together','数字如何共同作用'),payload:list(s.relationships),sourceRefs:[reading.sourceMeaningBundleCode].filter(Boolean)}),
  section({sectionId:'INTEGRATED_READING',title:text(l,'Integrated reading','综合读取'),payload:list(s.integratedNarrative),sourceRefs:[reading.sourceMeaningBundleCode].filter(Boolean)}),
  section({sectionId:'TIMING',title:text(l,'Cycles and timing','周期与时间'),payload:s.timing||null,sourceRefs:[reading.sourceProjectionId].filter(Boolean)}),
  section({sectionId:'REALITY_REFLECTION',title:text(l,'Reality reflection','现实对照'),payload:list(s.realityReflection),kind:'REFLECTION',sourceRefs:[reading.sourceMeaningBundleCode].filter(Boolean)}),
  section({sectionId:'DEPTH',title:text(l,'Deeper numerology structure','数字结构深化'),payload:{expansion:s.expansion||null,depth:s.depth||null},sourceRefs:[reading.sourceProjectionId].filter(Boolean)})
 ];
 return buildMethodProductEnvelope({methodId:'NUM',productType:'NUMEROLOGY_PROFESSIONAL_READING',locale:l,state:'CUSTOMER_PUBLISHABLE',publication:{customerPublishable:true,authorityRef:'content/professional/num-production/full-production/admission/num-fp-w18-full-production-gate-v1.json',depthAuthorityRef:'content/professional/num-production/depth-d1-d8/admission/num-d8-full-production-cutover-v1.json',status:reading.publicationState},hero:{eyebrow:text(l,'NUMEROLOGY · INTEGRATED READING','数字学 · 综合读取'),title:text(l,'Your numbers work as a structure','你的数字形成一套结构'),summary:list(s.integratedNarrative)[0]||null,highlights:themes.slice(0,3).map(x=>x.title).filter(Boolean)},navigation:sections.map(x=>x.sectionId),sections,visuals:[visual({visualId:'NUM_CHART',type:'NUMEROLOGY_ROLE_CHART',title:text(l,'Numerology chart','数字命盘'),payload:snapshot,sourceRefs:[reading.sourceProjectionId].filter(Boolean)})],lineage:{projectionId:reading.sourceProjectionId||null,meaningBundleCode:reading.sourceMeaningBundleCode||null,semanticDepth:reading.semanticDepth||null},boundaries:{...reading.boundaries,currentRealityKnown:false,liveIndividualHumanReviewClaimed:false},sourceProduct:reading});
}
export default Object.freeze({adaptNumerologyPersonalRealityProduct});
