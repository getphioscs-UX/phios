import {stableStringify,sha256Stable} from '../interpretation-runtime/mir7-utils.js';

const snapshotMatches=(record,snapshot)=>{
 if(!snapshot||typeof snapshot!=='object')return false;
 for(const [key,value] of Object.entries(snapshot)){
  if(stableStringify(record?.[key])!==stableStringify(value))return false;
 }
 return true;
};

// Trusted registry records only. Exact-content binding accepts both the legacy
// acceptedContent form and the R7 acceptedRecordSnapshot form.
export function isEcrHumanAdmitted(record){
 if(!record||record.status!=='ACCEPTED')return false;
 const {humanReview,...content}=record;
 if(humanReview?.decision!=='ACCEPT'||!humanReview.reviewer||!humanReview.reviewedAt||!humanReview.evidenceRef)return false;
 if(humanReview.acceptedContent===stableStringify(content))return true;
 return humanReview.exactContentBinding===true&&snapshotMatches(record,humanReview.acceptedRecordSnapshot);
}

export function resolveEcrSemanticComposition({gate,line,driverId,layer},policy,tagEvidence=[]){
 const factorSets=[['gateBases',gate],['lineModifiers',line],['planetaryDriverRoles',driverId],['layerRoles',layer]];
 const factors=factorSets.map(([group,key])=>policy[group]?.find(f=>f.key===key));
 const missing=factorSets.filter((_,i)=>!isEcrHumanAdmitted(factors[i])||!factors[i].meaningRef||!factors[i].sourceRefs?.length).map(([group,key])=>`${group}:${key}`);
 const result={factorRefs:factors.filter(Boolean).map(f=>f.factorId),semanticTags:[],runtimeOwners:[],semanticCoordinates:[],customerMeaningRefs:[],status:'UNKNOWN',missingAdmissions:missing,customerSurfaceAllowed:false};
 if(missing.length)return result;

 const gateEvidence=tagEvidence.find(e=>e.gate===gate&&e.reviewState==='ACCEPTED'&&e.humanReview?.decision==='ACCEPT'&&e.humanReview?.exactContentBinding===true&&snapshotMatches(e,e.humanReview.acceptedRecordSnapshot));
 if(!gateEvidence)return {...result,missingAdmissions:['OPERATIONAL_GATE_TAG_EVIDENCE']};

 const tags=[...new Set(gateEvidence.outputTags||[])].sort();
 if(!tags.length)return {...result,missingAdmissions:['OPERATIONAL_GATE_TAG_EVIDENCE']};

 // R7-W5 intentionally does not permit direct tag -> owner assignment.
 // Runtime-owner resolution remains separate and fail-closed until an
 // activation-specific owner-evidence record exists. Tags may still feed
 // admitted downstream selectors such as Phi Cards.
 return {...result,status:'ADMITTED_TAG_COMPOSITION',semanticTags:tags,runtimeOwners:[],semanticCoordinates:[],customerMeaningRefs:[],missingAdmissions:[],customerSurfaceAllowed:true};
}

// R3.1 local author-led extension. No registry, customer adapter or new meaning
// is created here. Trusted candidate records are reviewed separately from cases.
export async function ecrReusableVersionDigest(module){
 const {authorReview,rightsReview,exactVersionDigest,...content}=module;
 return sha256Stable(content);
}
export async function inspectEcrReusableCandidate(module){
 const required=['moduleId','sectionId','locale','calculationDependencies','canonicalFactorRefs','admittedMeaningRefs','editorialText','applicabilityConditions','contradictions','prohibitedInferences','personalEvidenceRequired','authorReview','rightsState','exactVersionDigest'];
 const errors=required.filter(k=>!Object.hasOwn(module,k)).map(k=>'MISSING:'+k);
 for(const k of ['calculationDependencies','canonicalFactorRefs','admittedMeaningRefs','contradictions','prohibitedInferences','personalEvidenceRequired'])if(!Array.isArray(module[k]))errors.push('ARRAY_REQUIRED:'+k);
 const digest=await ecrReusableVersionDigest(module),bound=digest===module.exactVersionDigest;
 if(!bound)errors.push('EXACT_VERSION_CHANGED');
 if(!/^(0[1-9]|10)$/.test(module.sectionId||'')||!['zh-Hans','en'].includes(module.locale))errors.push('SECTION_OR_LOCALE_INVALID');
 if(!module.editorialText?.trim()||!module.calculationDependencies?.length||!module.applicabilityConditions?.contexts?.length||!module.prohibitedInferences?.length)errors.push('MEANING_SCOPE_REQUIRED');
 if(module.caseSpecific!==false)errors.push('PERSONAL_CASE_NOT_REUSABLE');
 if(Object.keys(module.applicabilityConditions||{}).some(k=>k!=='contexts'))errors.push('UNSUPPORTED_APPLICABILITY_CONDITION');
 for(const d of module.calculationDependencies||[])if(!Number.isInteger(d.gate)||d.gate<1||d.gate>64||!Number.isInteger(d.line)||d.line<1||d.line>6||!d.bodyCode||!/^D(?:[1-9]|1[0-2])$/.test(d.driverId||'')||!['PERSONALITY','DESIGN'].includes(d.layer)||!d.mappingVersion)errors.push('COMPLETE_FOUR_FACTOR_BINDING_REQUIRED');
 const receipt=r=>r?.decision==='ACCEPT'&&r?.exactVersionDigest===digest&&r?.reviewer&&r?.reviewedAt&&r?.evidenceRef;
 const semanticAccepted=Boolean(bound&&module.authorReview?.status==='REUSABLE_MEANING_ACCEPTED'&&receipt(module.authorReview));
 const rightsCleared=Boolean(module.rightsState==='CLEARED'&&receipt(module.rightsReview));
 return {valid:errors.length===0,semanticAccepted,rightsCleared,digest,errors,customerPublishable:false};
}
export async function resolveEcrReusableModules({ir,modules=[],policy,tagEvidence=[],context='BASELINE_CONFIGURATION_READING',locale,personalEvidence=[],personalEvidenceConsent=false}={}){
 const selected=[],rejected=[];
 const verified=ir?.schemaVersion==='PHI-OS-ECR-HUMAN-RUNTIME-CONFIGURATION-v4.1'&&ir.initialization?.activations?.length===26&&ir.initialization.activations.every(a=>a.status==='CALCULATED')&&Boolean(ir.initialization.calculationDigest);
 for(const module of modules){
  const review=await inspectEcrReusableCandidate(module),reasons=[...review.errors];
  if(!verified)reasons.push('VERIFIED_CALCULATION_REQUIRED');
  if(!review.semanticAccepted)reasons.push('INDEPENDENT_REUSABLE_ACCEPTANCE_REQUIRED');
  if(!review.rightsCleared)reasons.push('RIGHTS_CLEARANCE_REQUIRED');
  if(!review.valid||!policy||!Array.isArray(tagEvidence)){rejected.push({moduleId:module.moduleId,reasons:[...new Set([...reasons,...(!policy?['ADMITTED_SOURCE_POLICY_REQUIRED']:[])])]});continue;}
  if(module.locale!==locale)reasons.push('LANGUAGE_MISMATCH');
  if(!module.applicabilityConditions?.contexts?.includes(context))reasons.push('CONTEXT_NOT_ALLOWED');
  for(const dep of module.calculationDependencies||[]){
   const driver=ir?.driverField?.drivers?.find(d=>d.driverId===dep.driverId&&d.bodyBinding?.includes(dep.bodyCode));
   const a=ir?.initialization?.activations?.find(a=>a.bodyCode===dep.bodyCode&&a.layer===dep.layer);
   if(!driver||!a||a.p64?.gate!==dep.gate||a.p64?.line!==dep.line||a.p64?.mappingVersion!==dep.mappingVersion){reasons.push('CALCULATION_COMBINATION_MISMATCH');continue;}
   const composition=resolveEcrSemanticComposition({gate:dep.gate,line:dep.line,driverId:dep.driverId,layer:dep.layer},policy,tagEvidence);
   if(!composition.customerSurfaceAllowed||composition.factorRefs.some(ref=>!module.canonicalFactorRefs.includes(ref)))reasons.push('CANONICAL_FACTORS_NOT_ADMITTED_OR_BOUND');
   const admitted=['gateBases','lineModifiers','planetaryDriverRoles','layerRoles'].flatMap(k=>policy[k]||[]).filter(f=>composition.factorRefs.includes(f.factorId)&&isEcrHumanAdmitted(f)).map(f=>f.meaningRef);
   if(admitted.some(ref=>!module.admittedMeaningRefs.includes(ref)))reasons.push('SOURCE_MEANING_BINDING_MISSING');
  }
  for(const condition of module.contradictions||[]){
   if(!condition||typeof condition!=='object'||!condition.bodyCode||!condition.layer||!Number.isInteger(condition.gate)||!Number.isInteger(condition.line)){reasons.push('UNSUPPORTED_CONTRADICTION');continue;}
   if(ir?.initialization?.activations?.some(a=>a.bodyCode===condition.bodyCode&&a.layer===condition.layer&&a.p64?.gate===condition.gate&&a.p64?.line===condition.line))reasons.push('DECLARED_CONTRADICTION_MATCHED');
  }
  for(const kind of module.personalEvidenceRequired||[])if(!personalEvidenceConsent||!personalEvidence.some(e=>e.kind===kind&&e.authorizedForEcr===true&&e.evidenceRef))reasons.push('AUTHORIZED_PERSONAL_EVIDENCE_REQUIRED');
  if(reasons.length)rejected.push({moduleId:module.moduleId,reasons:[...new Set(reasons)]});
  else selected.push({moduleId:module.moduleId,locale:module.locale,editorialText:module.editorialText,exactVersionDigest:module.exactVersionDigest,provenance:'ADMITTED_INTERPRETATION',interpretationScope:'CONDITIONAL_REUSABLE_MODULE',prohibitedInferences:module.prohibitedInferences});
 }
 return {selected,rejected,customerPublishable:false,sourceCalculationDigest:ir?.initialization?.calculationDigest||null,providerCalls:0};
}
