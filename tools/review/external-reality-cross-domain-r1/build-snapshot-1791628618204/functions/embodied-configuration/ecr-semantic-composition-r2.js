import {stableStringify} from '../interpretation-runtime/mir7-utils.js';

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
