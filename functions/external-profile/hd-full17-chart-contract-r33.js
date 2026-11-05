import {digestCanonical} from '../canonical-presentation-runtime/report-release-runtime.js';
import {prepareHdPremiumSectionPackets,admitExactReviewParagraph} from './hd-premium-section-packet-review.js';
const get=(v,p)=>p.split('.').reduce((o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined,v);
const fail=(code,report)=>{throw Object.assign(Error(code),{code,status:409,report});};
export const HD_FULL17_CONTRACT_VERSION='HD-R611-EXTERNAL-FULL17-INPUT-R33-1';
// Required paths come from the ACTUAL chapter and paragraph contracts. The
// adapter never fills fields from the reference chart or performs calculation.
export function inspectHdFull17InputR33({chart,source={},chapterContracts,referenceSelection}){
 if(chapterContracts?.length!==17||referenceSelection?.sections?.length!==17)fail('HD_EXISTING_FULL17_CONTRACT_REQUIRED');
 const expected=Array.from({length:17},(_,i)=>'SEC'+String(i+1).padStart(2,'0'));if(JSON.stringify(chapterContracts.map(s=>s.sectionId))!==JSON.stringify(expected)||JSON.stringify(referenceSelection.sections.map(s=>s.id))!==JSON.stringify(expected))fail('HD_EXISTING_FULL17_SECTION_ORDER_REQUIRED');
 const external=chart?.core&&chart?.structure;
 const facts=external?{type:chart.core.type?.value==='Generator'?'GENERATOR':chart.core.type?.value,authority:chart.core.authority?.value==='Emotional Authority'?'EMOTIONAL':chart.core.authority?.value,profile:{profileCode:chart.core.profile?.value},definition:{definitionCode:chart.core.definition?.value==='Triple Split Definition'?'TRIPLE_SPLIT_DEFINITION':chart.core.definition?.value},centers:[...(chart.structure.definedCenters||[])].sort(),channels:chart.structure.channels,activations:chart.structure.activations,cross:chart.core.incarnationCross?.value?{configurationCode:chart.core.incarnationCross.value}:undefined,variables:source.full17OwnerChart?.variables}:chart;
 if(!facts)fail('HD_CHART_SOURCE_REQUIRED');
 const sections=referenceSelection.sections.map((s,i)=>{const requiredPaths=new Set(),eligible=[],held=[];for(const p of s.paragraphs){const reasons=[];if(!p.requiredFacts?.length)reasons.push('NO_EXACT_PARAGRAPH_FACT_PREDICATES');for(const r of p.requiredFacts||[]){requiredPaths.add(r.path);const actual=get(facts,r.path);if(actual===undefined||actual===null)reasons.push('MISSING:'+r.path);else if(JSON.stringify(actual)!==JSON.stringify(r.equals))reasons.push('MISMATCH:'+r.path);}
   if(p.requiredActivation){const a=(facts.activations||[]).find(a=>a.layer===p.requiredActivation.layer&&a.bodyCode===p.requiredActivation.bodyCode);if(!a||a.gate!==p.requiredActivation.gate||a.line!==p.requiredActivation.line)reasons.push('PLANETARY_ACTIVATION_WITNESS_REQUIRED');}
   (reasons.length?held:eligible).push({paragraphId:p.id,sourceParagraphSHA256:p.paragraphSHA256,reasons});}
  return {sectionId:s.id,chapterKey:chapterContracts[i].sectionKey,requiredCalculatedFields:chapterContracts[i].requiredCalculatedFields,requiredPaths:[...requiredPaths],factEligible:eligible,held,fullChapterFactualCoverage:held.length===0};});
 const proofMissing=['chartSourceVersion','sourceUseConsentRef','commercialRightsEvidenceRef','precisionEvidenceRef'].filter(k=>!source[k]);
 const activations=facts.activations||[],bodyMissing=activations.filter(a=>!a.bodyCode).length;
 const unclassified=chart?.structure?.unclassifiedCenters||[];
 const ownerShape=source.full17OwnerChart;
 const requiredOwnerFields=[...new Set(chapterContracts.flatMap(s=>s.requiredCalculatedFields||[]))];
 const renderMissing=ownerShape?requiredOwnerFields.filter(k=>ownerShape[k]==null):['EXTERNAL_TO_R611_OWNER_CHART_NOT_PROVIDED'];
 const ready=sections.every(s=>s.fullChapterFactualCoverage)&&!proofMissing.length&&!bodyMissing&&!unclassified.length&&!renderMissing.length;
 return {version:HD_FULL17_CONTRACT_VERSION,sourceDigest:digestCanonical(chart),sections,proofMissing,requiredOwnerFields,activationCount:activations.length,activationsWithoutPlanetaryIdentity:bodyMissing,unclassifiedCenters:unclassified,renderMissing,referenceParagraphs:referenceSelection.sections.reduce((n,s)=>n+s.paragraphs.length,0),factEligibleCount:sections.reduce((n,s)=>n+s.factEligible.length,0),minimumInputPolicy:'The current 503-paragraph corpus determines exact field/witness coverage; this is not a universal 26-activation requirement for all future approved corpora.',full17PublisherInputReady:ready,customerPublicationAllowed:false};
}
export function buildHdFull17PublisherInputsR33({job,verifiedSource,chapterContracts,referenceSelection,normalization}){
 const source=verifiedSource||{},chart=source.chart,report=inspectHdFull17InputR33({chart,source,chapterContracts,referenceSelection});
 for(const k of ['ownerAccountId','personId','personVersion','inputDigest'])if(job?.[k]===undefined||job[k]===null||job[k]===''||source.subjectBinding?.[k]!==job[k])fail('HD_FULL17_SUBJECT_CONSENT_BINDING_REQUIRED',report);
 if(!report.full17PublisherInputReady)fail('HD_FULL17_SOURCE_INPUT_INCOMPLETE',report);
 if(source.full17OwnerChartSourceDigest!==report.sourceDigest)fail('HD_FULL17_OWNER_CHART_SOURCE_MISMATCH',report);
 const c=source.full17OwnerChart,preview={version:source.chartSourceVersion,source:'AUTHORIZED_EXTERNAL_CHART',customerConfirmed:true,chart:c,chartDigest:digestCanonical(c),inputIdentity:source.subjectBinding};
 // Existing packet selection and existing Publisher inputs. No fabricated
 // internal-calculation confirmation token or old personal plan is reused.
 const plan={publicationAllowed:false,sections:chapterContracts.map(s=>({sectionId:s.sectionId,sectionKey:s.sectionKey}))};
 const packets=prepareHdPremiumSectionPackets({preview,plan,normalization}),sections=referenceSelection.sections.map((s,i)=>({...s,paragraphs:s.paragraphs.map(p=>admitExactReviewParagraph({paragraph:p,packet:packets[i],confirmationDigest:preview.chartDigest,commercial:false}))}));
 return {preview,plan,packets,selection:{candidateId:'HD-R611-SUBJECT-R33',sections},publisherOwner:'tools/review/hd-r6/import-20261027/r611/render.py',report,publicationAllowed:false,commercialAdmission:false};
}
