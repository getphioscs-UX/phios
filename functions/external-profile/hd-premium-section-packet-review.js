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
 return plan.sections.map((section,i)=>({sectionId:'SEC'+String(i+1).padStart(2,'0'),existingPlanSection:section,calculation:{chartDigest:preview.chartDigest,chartResultDigest:digestCanonical(c),type:c.typeCode,authority:c.authority,profile:c.profile,definition:c.definition,centers:c.definedCenters,channels:c.channels,activations:c.activations,cross:c.incarnationCross,variables:c.variables},sourceUnits:normalization.units.filter(u=>u.topic==='GATE'?[6,8,11,12,13,14].includes(i)&&c.activations.some(a=>a.gate===u.gate)&&(i!==8||[c.incarnationCross.personalitySun,c.incarnationCross.personalityEarth,c.incarnationCross.designSun,c.incarnationCross.designEarth].includes(u.gate)):u.topic==='CHANNEL'?[3,4,5,6,11,12,13,14].includes(i)&&c.channels.some(ch=>u.channel.every(g=>ch.gates.includes(g))):u.topic==='TYPE'?i===1&&u.canonicalIdentity?.typeCode===c.typeCode:u.topic==='AUTHORITY'?i===2&&u.canonicalIdentity?.authority===c.authority:u.topic==='PROFILE'?i===7&&u.canonicalIdentity?.profileCode===c.profile.profileCode:false).map(u=>({id:u.semanticId,sourceOwnerId:u.sourceOwnerId,source:u.source,semantic:u.semantic,rights:u.rights})),existingSourceOwnerIds:{type:INDEX.types[c.typeCode],authority:INDEX.authorities[c.authority],profile:INDEX.profiles[c.profile.profileCode]},localMatchedNarrative:pilot?acceptedReviewSelection.sections[i].paragraphs:[],unknown:['No verified customer observations','No partner chart','No verified Cross short name','Advanced substructure precision not globally admitted'],controls:{privateReview:true,commercial:false,providerCapUsd:5,includedFollowups:4,reserveUsd:0.5,noWithdrawnCognition:true,noSpecialistFallback:true},activationWitness:actual}));
}
export function admitExactReviewParagraph({paragraph,packet,confirmationDigest,rights=false,semantic=false,commercial=false}){
 if(confirmationDigest!==packet.calculation.chartDigest)throw Error('HD_PREMIUM_STALE_CONFIRMATION');
 if(paragraph.sourceId&&!packet.sourceUnits.some(x=>x.id===paragraph.sourceId))throw Error('HD_PREMIUM_SOURCE_NOT_IN_PACKET');
 // Paragraph-level factual binding also covers the existing calculated center,
 // Channel and activation arrays. Never resolve arbitrary object/prototype paths.
 for(const f of paragraph.requiredFacts||[]){if(!/^(type|authority|profile|definition|variables|cross|centers|channels|activations)(\.[A-Za-z0-9_]+)*$/.test(f.path)||f.path.split('.').some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('HD_PREMIUM_PREDICATE_PATH_NOT_ALLOWED');const value=f.path.split('.').reduce((o,k)=>o!=null&&Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined,packet.calculation);if(value===undefined||typeof value==='function'||typeof value==='symbol'||typeof value==='number'&&!Number.isFinite(value)||!Object.prototype.hasOwnProperty.call(f,'equals')||JSON.stringify(value)!==JSON.stringify(f.equals))throw Error('HD_PREMIUM_REQUIRED_FACT_MISMATCH');}
 if(paragraph.requiredGate&&paragraph.sourceGate!==paragraph.requiredGate)throw Error('HD_PREMIUM_SOURCE_GATE_IDENTITY_MISMATCH');
 if(paragraph.requiredActivation){const{layer,bodyCode,gate,line}=paragraph.requiredActivation,a=packet.activationWitness[layer+':'+bodyCode];if(!a||a.gate!==gate||a.line!==line)throw Error('HD_PREMIUM_EXACT_ACTIVATION_MISMATCH');}
 if(/Inner Vision|内在视觉|DreamRave|Book of Destinies/i.test(paragraph.text))throw Error('HD_PREMIUM_WITHDRAWN_SOURCE');
 if(commercial&&(!rights||!semantic))throw Error('HD_PREMIUM_COMMERCIAL_ADMISSION_BLOCKED');
 if(paragraph.specialist&&!packet.controls.specialistApproved)throw Error('HD_PREMIUM_SPECIALIST_MISSING');
 return {...paragraph,sourcePacket:packet.sectionId,chartDigest:confirmationDigest,commercial:false};
}
