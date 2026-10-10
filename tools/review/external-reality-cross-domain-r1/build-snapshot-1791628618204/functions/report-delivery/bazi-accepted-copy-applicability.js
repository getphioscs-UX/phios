import {BAZI_COPY_INVENTORY,baziProjectionPillars} from './bazi-accepted-copy-coverage.js';
import {getAcceptedBaziCoreSection} from '../personal-reading/narrative/bazi-s02-s05-accepted-copy.generated.js';
import {getAcceptedBaziRemainingSection} from '../personal-reading/narrative/bazi-s06-s10-accepted-copy.generated.js';
import {BAZI_SECTION_REGISTRY} from '../canonical-presentation-runtime/report-section-contract.js';
export const BAZI_ACCEPTED_SECTION_IDS=Object.freeze(BAZI_SECTION_REGISTRY.sections.slice(1).map(s=>s.key));
export function canonicalBaziSectionId(id){
 if(BAZI_ACCEPTED_SECTION_IDS.includes(id))return id;
 const match=/^S(0[2-9]|10)$/.exec(String(id));if(match)return BAZI_ACCEPTED_SECTION_IDS.find(k=>k.startsWith(id+'_'));
 throw Error('BAZI_SECTION_ID_UNSUPPORTED');
}
export function inspectAcceptedBaziSectionPair(id){
 const section=canonicalBaziSectionId(id),getter=section.startsWith('S0')&&Number(section.slice(1,3))<=5?getAcceptedBaziCoreSection:getAcceptedBaziRemainingSection;
 return {section,pair:['zh-Hans','en'].map(locale=>({locale,source:getter(section,locale),paragraphPresenceOnly:true})),semanticReusableAdmission:false};
}
// Paragraphs exist; this resolver distinguishes context inapplicability from
// absent text and never upgrades reference acceptance to reusable authority.
export function resolveBaziAcceptedApplicability({projection,sectionId,locale,timingSelected=false,authorityConflict=false}={}){
 const section=canonicalBaziSectionId(sectionId);if(!['zh-Hans','en'].includes(locale))throw Error('BAZI_COPY_LOCALE_UNSUPPORTED');
 const actual=baziProjectionPillars(projection),rows=BAZI_COPY_INVENTORY.map(candidate=>{
  let status,reason;
  if(projection?.calculation?.status!=='COMPLETE'||actual.some(p=>!p)||authorityConflict){status='AUTHORITY_BLOCKED';reason=authorityConflict?'CONFLICTING_CONTROLLED_SOURCE_AUTHORITY':'INCOMPLETE_NATIVE_CALCULATION';}
  else if(candidate.id==='PRO_EDITORIAL_REFERENCE'){status='MISSING';reason='QUALITY_EXEMPLAR_IS_NOT_CUSTOMER_CONTENT';}
  else if(JSON.stringify(actual)!==JSON.stringify(candidate.pillars)){status='INAPPLICABLE';reason='NATAL_AUTHORITY_CONTEXT_DIFFERS';}
  else if(!candidate.locales.includes(locale)){status='MISSING';reason='REQUESTED_LOCALE_NOT_ACCEPTED_FOR_EDITION';}
  else if(section==='S08_TIMING'&&!timingSelected){status='AUTHORITY_BLOCKED';reason='CURRENT_TIMING_CONTEXT_NOT_SELECTED';}
  else{status='PARTIAL';reason='SOURCE_CONTEXT_MATCH_IS_NOT_REUSABLE_SUBJECT_ACCEPTANCE';}
  return {candidateId:candidate.id,source:candidate.source,section,locale,status,reason,selected:false,scope:candidate.subjectBinding};
 });
 const status=rows.every(r=>r.status==='AUTHORITY_BLOCKED')?'AUTHORITY_BLOCKED':rows.some(r=>r.status==='PARTIAL')?'PARTIAL':rows.some(r=>r.status==='INAPPLICABLE')?'INAPPLICABLE':'MISSING';
 return {section,locale,status,candidates:rows,selected:null,completeCustomerCoverage:false,releaseState:'BLOCKED_ACCEPTED_COPY_COVERAGE',distinction:'INAPPLICABLE/PARTIAL refer to existing reference text; they do not mean the repository has no paragraphs.'};
}
export function selectBaziAcceptedCustomerSection(context){const result=resolveBaziAcceptedApplicability(context);throw Object.assign(Error('BLOCKED_ACCEPTED_COPY_COVERAGE'),{code:'BLOCKED_ACCEPTED_COPY_COVERAGE',coverage:result});}
