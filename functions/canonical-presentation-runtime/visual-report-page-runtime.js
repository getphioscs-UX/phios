import {VISUAL_TEMPLATES} from './visual-report-registry.js';
export const VISUAL_PAGE_SCHEMA = 'PHI-OS-PERSONAL-READING-VISUAL-PAGE-v1.0.0';
export const PERSONAL_READING_PARENT_SCHEMA = 'PHI-OS-PERSONAL-READING-REPORT-IR-v2.0.0';
const unique = xs => [...new Set(xs)];
export function textSize(text,locale) { return locale==='zh-Hans' ? [...text.replace(/\s/g,'')].length : text.trim().split(/\s+/).filter(Boolean).length; }
// Subordinate presentation projection. This accepts already-bound content; it
// cannot produce a semantic claim or promote a report to customer publication.
export function createVisualPage(input) {
 const template=VISUAL_TEMPLATES[input.templateId];
 if(!template || !template.allowedVisualTypes.includes(input.visual?.type)) throw Error('VRPT_TEMPLATE_VISUAL_MISMATCH');
 if(!input.pageId || !input.question || !input.title || !input.sourceReportRef || !input.evidenceRefs?.length) throw Error('VRPT_PAGE_BINDING_REQUIRED');
 if(!['en','zh-Hans'].includes(input.locale)) throw Error('VRPT_LOCALE_UNSUPPORTED');
 if(!input.visual.dataRefs?.length || !input.visual.a11ySummary) throw Error('VRPT_VISUAL_SOURCE_REQUIRED');
 const insights=input.insights||[];
 if(insights.length>template.maxClaims || insights.some(x=>!x.sourceRef||!x.text)) throw Error('VRPT_INSIGHT_BINDING_REQUIRED');
 if(unique(insights.map(x=>x.text)).length!==insights.length) throw Error('VRPT_DUPLICATE_INSIGHT');
 // Prose placed inside a diagram is still prose; moving it into a visual
 // must not evade the density budget.
 const text=insights.map(x=>x.text).concat(input.navigationPrompt?.text||'',input.boundaryText||'',...(input.visual.nodes||[]).map(x=>x.secondary||'')).join(' ');
 const size=textSize(text,input.locale);
 return {...input,schemaVersion:VISUAL_PAGE_SCHEMA,parentSchema:PERSONAL_READING_PARENT_SCHEMA,presentationOwner:'CANONICAL_PRESENTATION_RUNTIME',executionClass:'T1_CANONICAL_ASSEMBLY',claims:insights.filter(x=>x.claimRef).map(x=>({claimRef:x.claimRef,role:'INSIGHT'})),insights,freePaid:input.freePaid||'PAID',quality:{textSize:size,textBudget:template.textBudget[input.locale],densityState:size>template.textBudget[input.locale].max?'REVIEW_REQUIRED':'WITHIN_MAXIMUM'},conditionalAdmission:{customerPublishable:false,humanReview:'PENDING'}};
}
// Page count and additional wording never count as information gain.
export function compareVisualReportDepths(free,paid) {
 if(free.sourceReportRef!==paid.sourceReportRef || free.locale!==paid.locale || JSON.stringify(free.identity)!==JSON.stringify(paid.identity)) throw Error('VRPT_FREE_PAID_IDENTITY_MISMATCH');
 const collect=(r,key)=>unique(r.pages.flatMap(p=>p[key]||[]));
 const boundUnits=r=>unique(r.pages.flatMap(p=>{
  const refs=unique([...(p.evidenceRefs||[]),...(p.visual?.dataRefs||[]),...(p.visual?.nodes||[]).flatMap(n=>n.sourceRefs||[]),...(p.visual?.edges||[]).flatMap(e=>e.sourceRefs||[])]);
  return (p.informationUnitRefs||[]).filter(unit=>refs.some(ref=>ref===unit||['/','.','#'].some(separator=>ref.startsWith(unit+separator))));
 }));
 const freeClaims=collect(free,'claimUniverseRefs'),paidClaims=collect(paid,'claimUniverseRefs');
 const missingFreeClaims=freeClaims.filter(x=>!paidClaims.includes(x));
 const freeUnits=unique([...boundUnits(free),...freeClaims]),paidUnits=unique([...boundUnits(paid),...paidClaims]);
 const additionalInformationUnits=paidUnits.filter(x=>!freeUnits.includes(x));
 return {sameIdentity:true,freeClaimsSubset:!missingFreeClaims.length,missingFreeClaims,additionalInformationUnits,informationGain:!missingFreeClaims.length&&additionalInformationUnits.length>0,state:missingFreeClaims.length?'INVALID_SUBSET':additionalInformationUnits.length?'GAIN_PRESENT_REQUIRES_HUMAN_REVIEW':'REJECT_IDENTICAL_OR_PROSE_PADDING',humanAccepted:false};
}
