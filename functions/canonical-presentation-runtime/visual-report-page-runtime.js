import {VISUAL_TEMPLATES} from './visual-report-registry.js';
import {normalizeReportPresentation,requirePurchasedReportPresentation} from '../pws/commercial/report-successor-contract.js';
import {resolveReportEditorialAsset} from './report-editorial-resolver.js';
import {REPORT_EDITORIAL_COPY} from './report-editorial-copy.js';
import {GUIDED_REPORT_SUCCESSOR,PUBLICATION_VERSIONS,REPORT_PAGE_REGISTRY} from './report-publication-contract.js';
import {SECTION_LAYOUT,validateExpandedSections} from './report-section-contract.js';

export function assemblePublicationSnapshot({methodId,locale,pages,intro,temporalSnapshot,internalPages,generatedAt,layout=null}={}){
 const plan=REPORT_PAGE_REGISTRY.find(p=>p.method===methodId);
 if(!plan||!['en','zh-Hans'].includes(locale)||!temporalSnapshot||!generatedAt)throw Error('PUBLICATION_ASSEMBLY_INPUT_INVALID');
 const sequence=[...intro,...pages].map(p=>p.pageNumber);
 if(layout&&layout!==SECTION_LAYOUT)throw Error('PUBLICATION_LAYOUT_INVALID');
 if(layout===SECTION_LAYOUT){if(methodId!=='BZR'||intro.length!==6)throw Error('PUBLICATION_SECTION_METHOD_INVALID');validateExpandedSections(pages);}
 if((!layout&&sequence.length!==plan.totalPages)||sequence.some((n,i)=>n!==i+1))throw Error('PUBLICATION_PAGE_SEQUENCE_INVALID');
 const customer={schemaVersion:GUIDED_REPORT_SUCCESSOR,...PUBLICATION_VERSIONS,...(layout?{layout,pageRegistryVersion:'2.1.0'}:{}),methodId,locale,totalPages:sequence.length,customerPublishable:false,successorBaselineActivated:false,intro,pages};
 return {customer,internalOnly:{generatedAt,temporalSnapshot,internalPages,versions:PUBLICATION_VERSIONS,humanAcceptance:'PENDING',productionCutover:'NOT_ACTIVATED'}};
}
export const VISUAL_PAGE_SCHEMA = 'PHI-OS-PERSONAL-READING-VISUAL-PAGE-v1.0.0';
export const PERSONAL_READING_PARENT_SCHEMA = 'PHI-OS-PERSONAL-READING-REPORT-IR-v2.0.0';
const unique = xs => [...new Set(xs)];
export const REPORT_ACCESS_STATES=Object.freeze(['OPEN','PREVIEW','PAID_LOCKED','DATA_REQUIRED','CONDITIONAL','NOT_APPLICABLE']);
// Locale changes presentation only. Callers supply translations bound to the
// existing Page IR source/evidence; this owner never recalculates a reading.
export function presentVisualReport({report,presentation,entitlement=null,access='FREE',editorialRegistry,publicBaseUrl,localizedCopy={},reviewMode=false}={}){
 const selection=access==='PAID'?requirePurchasedReportPresentation(entitlement,presentation):normalizeReportPresentation(presentation);
 if(!['FREE','PAID'].includes(access)||report?.schemaVersion!=='PHI-OS-PERSONAL-READING-VISUAL-PAGES-v1.0.0')throw Error('VISUAL_REPORT_PRESENTATION_INVALID');
 const languages=selection.reportLocale==='bilingual'?['zh-Hans','en']:[selection.reportLocale];
 const staticPages=[1,2,3,4,5].map(page=>{
  let asset=null,error=null;try{asset=resolveReportEditorialAsset({registry:editorialRegistry,methodId:report.methodId,page,locale:selection.reportLocale,publicBaseUrl});}catch(e){if(!reviewMode)throw e;error=e.code;}
  const copy=REPORT_EDITORIAL_COPY.find(x=>x.methodId===report.methodId&&x.pageRole===['COVER','METHOD_INTRO','ORIGIN','PHIOS_LENS','HOW_TO_READ'][page-1]);
  return {pageId:`EDITORIAL-${report.methodId}-${page}`,pageNumber:page,kind:'STATIC_EDITORIAL',asset,error,copy,accessState:error?'DATA_REQUIRED':'OPEN',locale:selection.reportLocale};
 });
 const dynamic=report.pages.filter(p=>p.templateId!=='RPT-T00').map((page,index)=>{
  const bound=localizedCopy[page.pageId];
  if(bound&&(bound.sourceReportRef!==report.sourceReportRef||JSON.stringify(bound.evidenceRefs)!==JSON.stringify(page.evidenceRefs)||JSON.stringify(bound.claims)!==JSON.stringify(page.claims)))throw Error('REPORT_LOCALIZATION_SOURCE_MISMATCH');
  const translations={};for(const language of languages){
   const text=language===page.locale?{title:page.title,question:page.question,insights:page.insights,visual:page.visual,navigationPrompt:page.navigationPrompt,boundaryText:page.boundaryText}:bound?.locales?.[language];
   if(!text)throw Error('REPORT_CANONICAL_TRANSLATION_MISSING');
   if(JSON.stringify((text.insights||[]).map(x=>[x.claimRef,x.sourceRef]))!==JSON.stringify((page.insights||[]).map(x=>[x.claimRef,x.sourceRef])))throw Error('REPORT_TRANSLATION_CLAIM_MISMATCH');
   const invariant=visual=>{const {a11ySummary,labels,...rest}=visual||{};return {...rest,nodes:(rest.nodes||[]).map(({label,...node})=>node)};};
   if(JSON.stringify(invariant(text.visual))!==JSON.stringify(invariant(page.visual)))throw Error('REPORT_TRANSLATION_DATA_MISMATCH');
   translations[language]=text;
  }
  const eligibility=page.accessState&&['DATA_REQUIRED','CONDITIONAL','NOT_APPLICABLE'].includes(page.accessState)?page.accessState:null;
  const state=eligibility||(access==='PAID'||page.freePaid==='FREE'?'OPEN':'PAID_LOCKED');
  // Locked payloads contain no paid insights, data or source tables.
  return {pageId:page.pageId,pageNumber:index+6,kind:'DYNAMIC',accessState:state,locale:selection.reportLocale,templateId:page.templateId,
   ...(state==='OPEN'?{sourcePage:page,translations}:{titles:Object.fromEntries(languages.map(l=>[l,translations[l].title])),values:Object.fromEntries(languages.map(l=>[l,translations[l].question])),preview:{visualType:page.visual.type,insightCount:page.insights.length}})};
 });
 return {...report,presentation:selection,pages:[...staticPages,...dynamic],access,reviewMode,presentationSchema:'PHI-OS-REPORT-PRESENTATION-R2',customerPublishable:false,humanReview:'PENDING'};
}
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
