// Review-only extension of the existing HD report owner; no alternate registry.
import {HD_R3_RUNTIME_SOURCE_INDEX as INDEX} from './human-design-r3-runtime-source-index.js';
import {digestCanonical} from '../canonical-presentation-runtime/report-release-runtime.js';
import {inspectHdReportChartConsistency} from './hd-report-automation-candidate.js';
export function prepareHdPremiumSectionPackets({preview,plan,normalization,acceptedReviewSelection}){
 if(preview?.customerConfirmed!==true||!preview.chart||!plan||plan.sections?.length!==17||plan.publicationAllowed!==false)throw Error('HD_PREMIUM_CONFIRMED_LOCAL_PLAN_REQUIRED');
 if(!normalization||normalization.units?.some(u=>u.publicationAllowed!==false))throw Error('HD_PREMIUM_SOURCE_REVIEW_SCOPE_REQUIRED');
 const c=preview.chart,actual=Object.fromEntries(c.activations.map(a=>[a.layer+':'+a.bodyCode,a]));
 if(!inspectHdReportChartConsistency(c).passed)throw Error('HD_PREMIUM_CHART_CONTRADICTION');
 const pilot=acceptedReviewSelection?.chartDigest===preview.chartDigest;
 normalization={...normalization,units:normalization.units.filter(u=>u.selectionAllowed!==false&&!/^QUARANTINED/.test(u.semantic))};
 return plan.sections.map((section,i)=>({sectionId:'SEC'+String(i+1).padStart(2,'0'),existingPlanSection:section,calculation:{chartDigest:preview.chartDigest,chartResultDigest:digestCanonical(c),type:c.typeCode,authority:c.authority,profile:c.profile,definition:c.definition,centers:c.definedCenters,channels:c.channels,activations:c.activations,cross:c.incarnationCross,variables:c.variables},sourceUnits:normalization.units.filter(u=>u.topic==='GATE'?[6,8,11,12,13,14].includes(i)&&c.activations.some(a=>a.gate===u.gate)&&(i!==8||[c.incarnationCross.personalitySun,c.incarnationCross.personalityEarth,c.incarnationCross.designSun,c.incarnationCross.designEarth].includes(u.gate)):u.topic==='CHANNEL'?[3,4,5,6,11,12,13,14].includes(i)&&c.channels.some(ch=>u.channel.every(g=>ch.gates.includes(g))):u.topic==='TYPE'?i===1&&u.canonicalIdentity?.typeCode===c.typeCode:u.topic==='AUTHORITY'?i===2&&u.canonicalIdentity?.authority===c.authority:u.topic==='PROFILE'?i===7&&u.canonicalIdentity?.profileCode===c.profile.profileCode:false).map(u=>({id:u.semanticId,sourceOwnerId:u.sourceOwnerId,source:u.source,semantic:u.semantic,rights:u.rights})),existingSourceOwnerIds:{type:INDEX.types[c.typeCode],authority:INDEX.authorities[c.authority],profile:INDEX.profiles[c.profile.profileCode]},localMatchedNarrative:pilot?acceptedReviewSelection.sections[i].paragraphs:[],unknown:['No verified customer observations','No partner chart','No verified Cross short name','Advanced substructure precision not globally admitted'],controls:{privateReview:true,commercial:false,providerCapUsd:5,includedFollowups:4,reserveUsd:0.5,noWithdrawnCognition:true,cognitionPolicy:'DESIGN_SUN_TONE_R610_PRIVATE_REVIEW',legacyFlagMeaning:'WITHDRAWN_DRAFT_LANGUAGE_ONLY_NOT_CLASSIFICATION_BAN',noSpecialistFallback:true},activationWitness:actual}));
}
export function admitExactReviewParagraph({paragraph,packet,confirmationDigest,rights=false,semantic=false,commercial=false}){
 if(confirmationDigest!==packet.calculation.chartDigest)throw Error('HD_PREMIUM_STALE_CONFIRMATION');
 if(paragraph.sourceId&&!packet.sourceUnits.some(x=>x.id===paragraph.sourceId))throw Error('HD_PREMIUM_SOURCE_NOT_IN_PACKET');
 // Paragraph-level factual binding also covers the existing calculated center,
 // Channel and activation arrays. Never resolve arbitrary object/prototype paths.
 for(const f of paragraph.requiredFacts||[]){if(!/^(type|authority|profile|definition|variables|cross|centers|channels|activations)(\.[A-Za-z0-9_]+)*$/.test(f.path)||f.path.split('.').some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('HD_PREMIUM_PREDICATE_PATH_NOT_ALLOWED');const value=f.path.split('.').reduce((o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined,packet.calculation);if(value===undefined||typeof value==='function'||typeof value==='symbol'||typeof value==='number'&&!Number.isFinite(value)||!Object.prototype.hasOwnProperty.call(f,'equals')||JSON.stringify(value)!==JSON.stringify(f.equals))throw Error('HD_PREMIUM_REQUIRED_FACT_MISMATCH');}
 if(paragraph.requiredGate&&paragraph.sourceGate!==paragraph.requiredGate)throw Error('HD_PREMIUM_SOURCE_GATE_IDENTITY_MISMATCH');
 if(paragraph.requiredActivation){const{layer,bodyCode,gate,line}=paragraph.requiredActivation,a=packet.activationWitness[layer+':'+bodyCode];if(!a||a.gate!==gate||a.line!==line)throw Error('HD_PREMIUM_EXACT_ACTIVATION_MISMATCH');}
 // R6.10 owner correction supersedes the blanket Cognition retirement.
 // Restored prose still needs an exact Design Sun Tone and a local-only scope.
 if(/DreamRave|Book of Destinies/i.test(paragraph.text))throw Error('HD_PREMIUM_WITHDRAWN_SOURCE');
 if(paragraph.cognitionTone!=null){
  const result=inspectHdCognitionClassification(packet);
  if(!result.ready||result.tone!==paragraph.cognitionTone)throw Error('HD_COGNITION_TONE_OR_PRECISION_HOLD');
  if(paragraph.cognitionReviewVersion!=='R610'||commercial)throw Error('HD_COGNITION_EDITORIAL_RIGHTS_NOT_ADMITTED');
 }else if(/Inner Vision|内在视觉/i.test(paragraph.text))throw Error('HD_COGNITION_TYPED_BINDING_REQUIRED');
 if(commercial&&(!rights||!semantic))throw Error('HD_PREMIUM_COMMERCIAL_ADMISSION_BLOCKED');
 if(paragraph.specialist&&!packet.controls.specialistApproved)throw Error('HD_PREMIUM_SPECIALIST_MISSING');
 return {...paragraph,sourcePacket:packet.sectionId,chartDigest:confirmationDigest,commercial:false};
}
export function inspectHdCognitionClassification(packet){
 const a=packet?.activationWitness?.['DESIGN:SUN'],s=a?.substructure,v=packet?.calculation?.variables?.fields?.designUpper;
 const tone=s?.tone,good=Number.isInteger(tone)&&tone>=1&&tone<=6;
 const near=!Number.isFinite(s?.remainingToneFraction)||Math.min(s.remainingToneFraction,1-s.remainingToneFraction)<=Math.max(s?.boundaryToleranceToneUnits||0,1e-7);
 const ready=good&&tone===v?.tone&&s?.color===v?.color&&v?.orientation===(tone<=3?'LEFT':'RIGHT')&&s?.parentCompatibility==='MATCH'&&!s?.boundarySnapApplied&&!near&&['VERIFIED','UNVERIFIED'].includes(s?.precision);
 const names=[['Smell','嗅觉'],['Taste','味觉'],['Outer Vision','外在视觉'],['Inner Vision','内在视觉'],['Feeling','感觉'],['Touch','触觉']];
 return {ready,tone:good?tone:null,label:ready?{en:names[tone-1][0],'zh-Hans':names[tone-1][1]}:null,confidence:s?.precision==='VERIFIED'?'VERIFIED':'LOCAL_DETERMINISTIC_NOT_GLOBALLY_VALIDATED',publicationAllowed:false,reason:ready?null:'MISSING_CONFLICTED_OR_BOUNDARY_TONE',lowSoundLabel:v?.color===5&&v?.orientation==='RIGHT'?'Low Sound':null,lowSoundInterpretationAdmitted:false};
}
export function assessHdAutomaticReportSupport(chart,{requiredModuleIds=[],admittedModuleIds=[]}={}){
 const missing=requiredModuleIds.filter(id=>!admittedModuleIds.includes(id)),quad=chart?.definition?.definitionCode==='QUADRUPLE_SPLIT_DEFINITION';
 const supported=!quad&&requiredModuleIds.length>0&&!missing.length;
 return {supported,unsupportedBeforePayment:!supported,reason:quad?'QUADRUPLE_SPLIT_COMPLETE_INTERPRETATION_DEFERRED':!requiredModuleIds.length?'REQUIRED_SEMANTIC_INVENTORY_MISSING':missing.length?'SEMANTIC_MODULES_NOT_ADMITTED':null,missingModuleIds:missing,customerNotice:quad?{en:'A complete automatic report is not currently supported for Quadruple Split. Please do not purchase this report yet.','zh-Hans':'目前尚不支持四分定义的自动完整报告，请暂勿购买此报告。'}:null,publicationAllowed:false};
}
// Local editorial candidate selection over the existing calculated packet fields.
// Passing this selector is not semantic, rights or customer-publication approval.
export function selectHdCommonReviewCandidates(packet,modules,confirmationDigest){
 const c=packet.calculation,selected=[];
 for(const m of modules){
  if(m.editorial!=='OWNER_REVIEW_REQUIRED'||m.publicationAllowed!==false)continue;
  const s=m.selector;let matches=false;
  if(s.path){const v=s.path.split('.').reduce((o,k)=>o?.[k],c);matches=JSON.stringify(v)===JSON.stringify(s.equals);}
  else if(s.completeChannel)matches=c.channels.some(ch=>s.completeChannel.length===2&&s.completeChannel.every(g=>ch.gates.includes(g)));
  else if(s.center){const defined=c.centers.includes(s.center),active=c.activations.some(a=>INDEX.gates[String(a.gate)]?.center===s.center);matches=s.state===(defined?'DEFINED':active?'UNDEFINED_ACTIVATED':'FULLY_OPEN');}
  if(!matches)continue;
  const requiredFacts=s.path?[{path:s.path,equals:s.equals}]:[{path:s.center?'centers':'channels',equals:s.center?c.centers:c.channels}];
  selected.push(admitExactReviewParagraph({paragraph:{...m,requiredFacts},packet,confirmationDigest}));
 }
 return selected;
}
