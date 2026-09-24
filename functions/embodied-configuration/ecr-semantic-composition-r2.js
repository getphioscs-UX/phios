import {stableStringify} from '../interpretation-runtime/mir7-utils.js';
// Trusted registry records only. Exact content binding prevents an old review
// from admitting a subsequently changed rule. This does not manufacture reviews.
export function isEcrHumanAdmitted(record){
 if(!record||record.status!=='ACCEPTED')return false;
 const {humanReview,...content}=record;
 return humanReview?.decision==='ACCEPT'&&Boolean(humanReview.reviewer&&humanReview.reviewedAt&&humanReview.evidenceRef)
  &&humanReview.acceptedContent===stableStringify(content);
}
const includesAll=(set,values)=>values.every(v=>set.has(v));
export function resolveEcrSemanticComposition({gate,line,driverId,layer},policy,ownerAddresses){
 const factorSets=[['gateBases',gate],['lineModifiers',line],['planetaryDriverRoles',driverId],['layerRoles',layer]];
 const factors=factorSets.map(([group,key])=>policy[group]?.find(f=>f.key===key));
 const missing=factorSets.filter((_,i)=>!isEcrHumanAdmitted(factors[i])||!factors[i].meaningRef||!factors[i].sourceRefs?.length).map(([group,key])=>`${group}:${key}`);
 const result={factorRefs:factors.filter(Boolean).map(f=>f.factorId),semanticTags:[],runtimeOwners:[],semanticCoordinates:[],customerMeaningRefs:[],status:'UNKNOWN',missingAdmissions:missing,customerSurfaceAllowed:false};
 if(missing.length)return result;
 const ids=new Set(result.factorRefs),sourceTags=new Set(factors.flatMap(f=>f.semanticTags||[]));
 // Reusable semantic-tag rules compose admitted factors without enumerating
 // every Gate/Line/driver/layer combination. Optional identity constraints may
 // narrow a rule, but are not a parallel direct Gate/Line owner table.
 const matches=(policy.tagRules||[]).filter(r=>isEcrHumanAdmitted(r)&&r.requiredTags?.length>0&&includesAll(ids,r.requiredFactorIds||[])&&includesAll(sourceTags,r.requiredTags));
 if(!matches.length)return {...result,missingAdmissions:['COMPOSITION_TAG_RULE']};
 const tags=[...new Set(matches.flatMap(r=>r.outputTags||[]))].sort();
 const tagSet=new Set(tags),knownOwners=new Set(ownerAddresses);
 const ownerRules=(policy.runtimeOwnerRules||[]).filter(r=>isEcrHumanAdmitted(r)&&r.requiredTags?.length&&includesAll(tagSet,r.requiredTags)&&knownOwners.has(r.primaryOwner)&&(r.secondaryOwners||[]).every(o=>knownOwners.has(o))&&r.customerMeaningRef);
 if(!ownerRules.length)return {...result,semanticTags:tags,missingAdmissions:['RUNTIME_OWNER_RULE']};
 const coordinates=(policy.personalCoordinateRules||[]).filter(r=>isEcrHumanAdmitted(r)&&r.requiredTags?.length&&includesAll(tagSet,r.requiredTags)).flatMap(r=>r.coordinateRefs||[]);
 return {...result,status:'ADMITTED_COMPOSITION',semanticTags:tags,runtimeOwners:[...new Set(ownerRules.flatMap(r=>[r.primaryOwner,...(r.secondaryOwners||[])]))].sort(),semanticCoordinates:[...new Set(coordinates)].sort(),customerMeaningRefs:[...new Set(ownerRules.map(r=>r.customerMeaningRef))],missingAdmissions:[],customerSurfaceAllowed:true};
}
