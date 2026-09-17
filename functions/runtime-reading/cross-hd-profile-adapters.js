import {HD_R3_PRODUCTION_AUTHORITY} from '../external-profile/human-design-r3-production-authority.js';
import {PROFILE_PRODUCTION_AUTHORITY} from '../profile/profile-production-authority.js';
import {buildProfileSignalEnvelope} from '../profile/profile-foundation-runtime.js';
import {buildCustomerClaimIR} from '../single-method-reading/customer-claim-ir.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
const schema='PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0';
const text=(v,locale)=>v?.[locale==='zh-Hans'?'zhHans':'en'];
const hdAuthority='functions/external-profile/human-design-r3-reading-ir-v2.js';
const hdAdmission='functions/external-profile/human-design-r3-production-authority.js';
const profileAuthority='functions/profile/profile-foundation-runtime.js';
const profileAdmission='functions/profile/profile-production-authority.js';
function fail(message){throw new Error(message);}
function finish(methodId,units,semanticDigest,locale,extra={}){
 if(!units.length)fail('CROSS_SUCCESSOR_NO_GOVERNED_CLAIMS');
 const envelope=deepFreeze({schemaVersion:schema,methodId,locale,readingAuthorityRef:methodId==='HD'?hdAuthority:profileAuthority,productionAdmissionRef:methodId==='HD'?hdAdmission:profileAdmission,semanticDigest,acceptedUnits:units,interpretationUnitRefs:units.map(u=>u.interpretationUnitId),findingRefs:units.map(u=>u.interpretationUnitId),priorityRefs:[],supportRefs:[],tensionRefs:[],openRefs:units.filter(u=>u.relationType==='OPEN').map(u=>u.interpretationUnitId),temporalClaims:[],boundaryFlags:[],productionAdmission:{customerPublishable:true,scope:'METHOD_ONLY_NOT_CROSS'},successorAdapterId:`CROSS-${methodId}-ACCEPTED-ENVELOPE-v1`,boundary:{acceptedAuthorityOnly:true,newMeaningCreated:false,renderedProseConsumed:false,rawSymbolInference:false},...extra});
 const base=buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope});
 const claimCollection=deepFreeze({...base,claims:base.claims.map((c,i)=>({...c,confidenceClass:units[i].evidenceClass?.confidence||c.confidenceClass,conditions:[...c.conditions,{kind:'METHOD_EVIDENCE_SCOPE',...units[i].evidenceClass}],counterEvidenceRefs:units[i].counterEvidenceRefs||[]}))});
 return deepFreeze({envelope,claimCollection});
}
export async function adaptHdCrossEnvelope({product,locale=product?.locale||'en'}={}){
 if(!HD_R3_PRODUCTION_AUTHORITY.customerPublicationAllowed||product?.activeCustomerReadingVersion!=='HD_PRO_R3'||product.publicationDecision?.customerPublishable!==true||product.publicationDecision?.productionAdmitted!==true||product.boundaries?.customerSuppliedExternalContext!==true||product.boundaries?.phiosCalculated!==false)fail('CROSS_HD_CUSTOMER_PUBLISHABLE_AUTHORITY_REQUIRED');
 if(locale!==product.locale)fail('CROSS_HD_LOCALE_MISMATCH');
 const {professionalProductDigest,...seed}=product;
 if((await sha256Stable(seed)).slice(0,24)!==professionalProductDigest)fail('CROSS_HD_PRODUCT_DIGEST_MISMATCH');
 // Consume governed pre-editorial Reading IR findings; never customerReading,
 // rendered HTML, raw chart symbols, or the historical reference PDF.
 const findings=[...new Map(product.readingIr.sections.flatMap(s=>s.findings||[]).filter(f=>f.finding).map(f=>[f.findingId,f])).values()];
 const units=findings.map(f=>{
  const r=f.technicalRefs;if(!r?.claimIds?.length||!r.sourceRefs?.length||!r.compositionRuleIds?.length||!r.structureRefs?.length||!text(f.finding,locale))fail('CROSS_HD_CLAIM_LINEAGE_REQUIRED');
  const advanced=r.compositionRuleIds.includes('HD-R3-COMP-VARIABLE_CORE');
  return {interpretationUnitId:f.findingId,title:text(f.finding,locale),summary:text(f.finding,locale),subject:advanced?'ADVANCED_MODIFIER':f.semanticRole,projectionRefs:r.claimIds,meaningRefs:r.sourceRefs,derivationRefs:r.compositionRuleIds,boundaryRefs:[product.publicationDecision.humanReviewEvidence,text(f.whatWouldContradictIt,locale)].filter(Boolean),relationType:'DEPENDENCY',evidenceClass:{sourceClass:'GOVERNED_SYMBOLIC_INTERPRETATION',confidence:'METHOD_CONDITIONAL',chartDigest:product.chartDigest,hdProfileIsIndependentPhiOsProfile:false},upstreamDomains:f.domains};
 });
 return finish('HD',units,professionalProductDigest,locale,{reportBlueprintRef:'content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/report/hd-pro-r3-report-blueprint-authority-v1.json'});
}
export async function adaptProfileCrossEnvelope({signals,mode,locale='en'}={}){
 if(!PROFILE_PRODUCTION_AUTHORITY.customerPublicationAllowed||!Object.hasOwn(PROFILE_PRODUCTION_AUTHORITY.modes,mode))fail('CROSS_PROFILE_CUSTOMER_PUBLISHABLE_AUTHORITY_REQUIRED');
 if(!Array.isArray(signals)||!signals.length)fail('CROSS_PROFILE_SIGNALS_REQUIRED');
 const participants=new Set(signals.map(s=>s.participantRef));if(participants.size!==1)fail('CROSS_PROFILE_PARTICIPANT_MISMATCH');
 const units=[];
 for(const s of signals){
  if(s.schemaVersion!=='PHI-OS-PROFILE-SIGNAL-ENVELOPE-v1'||!s.sourceRef||!s.provenance?.length)fail('CROSS_PROFILE_SIGNAL_LINEAGE_REQUIRED');
  const canonical=await buildProfileSignalEnvelope(s);if(canonical.semanticDigest!==s.semanticDigest||canonical.profileSignalId!==s.profileSignalId)fail('CROSS_PROFILE_SIGNAL_DIGEST_MISMATCH');
  const low=mode==='QUICK_PROFILE'||['UNKNOWN','APPROXIMATE'].includes(s.confidence)||s.precisionBoundary?.some(b=>/LOW_RESPONSE|PARTIAL_RESPONSE/.test(b));
  // An evidence observation, not a new trait interpretation or confidence score.
  const observed=JSON.stringify(s.value);const title=`${s.domainId}${s.facetId?` · ${s.facetId}`:''}`;
  const summary=locale==='zh-Hans'?`来源 ${s.sourceClass} 在 ${s.assessmentDate||'未注明日期'} 记录的原始结果：${observed}。此项仅保留来源观察，不推导人格结论。`:`Source ${s.sourceClass} recorded this original result on ${s.assessmentDate||'an unspecified date'}: ${observed}. This preserves source evidence without inferring a personality conclusion.`;
  units.push({interpretationUnitId:s.profileSignalId,title,summary,subject:s.domainId.replaceAll('::','_'),projectionRefs:[s.profileSignalId,s.sourceRef],meaningRefs:[`${profileAuthority}#buildProfileSignalEnvelope`],derivationRefs:[`${profileAuthority}#buildProfileSignalEnvelope`],boundaryRefs:[...s.precisionBoundary,'PHI_OS_PROFILE_IS_NOT_HD_PROFILE','NO_CROSS_SOURCE_SCIENTIFIC_VALIDATION'],relationType:low?'OPEN':'DEPENDENCY',evidenceClass:{sourceClass:s.sourceClass,confidence:low?'LOW_CONFIDENCE_HYPOTHESIS':s.confidence,providerFamily:s.providerFamily||null,sourceRef:s.sourceRef,assessmentDate:s.assessmentDate,mode,provenance:s.provenance,precisionBoundary:s.precisionBoundary,rawValue:s.value}});
 }
 return finish('PROFILE',units,await sha256Stable(signals.map(s=>s.semanticDigest)),locale,{entryMode:mode,participantRef:[...participants][0]});
}
