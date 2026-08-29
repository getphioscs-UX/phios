import {freezeDeep,NUM_DEPTH_PRODUCTION_ACTIVE} from './num-depth-rules.js';
export const NUM_D8_COMPOSER_SCHEMA='PHI-OS-NUM-D8-DEPTH-COMPOSITION-CANDIDATE-v1.1.0';
const PRIORITY={NAME_CORE:100,DATE_CORE:95,ROLE_RELATIONSHIP:88,LONG_CYCLE:78,CURRENT_TIMING:74,SECONDARY:68,ENERGY_PATTERN:62,RAW_EVIDENCE:10};
const stable=x=>JSON.stringify(x,Object.keys(x||{}).sort());
export function composeNumDepthCandidate({nameRoleMeanings=[],hiddenPassionMeanings=[],karmicLessonMeanings=[],secondaryChart=null,longCycleMeanings=[],alternativeTiming=null,relationship=null}={}){
 const units=[];const add=(family,key,priority,payload,evidenceRef)=>units.push({family,key,priority,payload,evidenceRef});
 for(const x of nameRoleMeanings)add('NAME_CORE',`NAME:${x.role}:${x.value}`,PRIORITY.NAME_CORE,x,{workCode:x.workCode,role:x.role,value:x.value,sourceClaimId:x.sourceClaimId});
 for(const x of hiddenPassionMeanings)add('SECONDARY',`HP:${x.value}`,PRIORITY.SECONDARY,x,{workCode:x.workCode,role:'HIDDEN_PASSION',value:x.value,sourceClaimId:x.sourceClaimId});
 for(const x of karmicLessonMeanings)add('SECONDARY',`KL:${x.value}`,PRIORITY.SECONDARY,x,{workCode:x.workCode,role:'KARMIC_LESSON',value:x.value,sourceClaimId:x.sourceClaimId});
 for(const x of longCycleMeanings)add('LONG_CYCLE',`CYCLE:${x.role}:${x.value}`,PRIORITY.LONG_CYCLE,x,{workCode:x.workCode,role:x.role,value:x.value,sourceClaimId:x.sourceClaimId});
 if(alternativeTiming)for(const u of alternativeTiming.units||[]){const canonical=u.meaning?.canonicalClaimPattern||u.pattern;add('CURRENT_TIMING',`ENERGY:${canonical}`,PRIORITY.CURRENT_TIMING,u,{workCode:'NUM-D6',role:u.role,observedPattern:u.pattern,canonicalPattern:canonical,sourceClaimId:u.meaning?.sourceClaimId||null});}
 if(relationship)for(const r of relationship.roleComparisons||[])if(r.availability!=='MISSING_INPUT')add('ROLE_RELATIONSHIP',`REL:${r.role}:${r.leftValue}:${r.rightValue}`,PRIORITY.ROLE_RELATIONSHIP,r,{workCode:'NUM-D7',role:r.role,leftValue:r.leftValue,rightValue:r.rightValue});
 const byKey=new Map();for(const u of units){if(!byKey.has(u.key)){byKey.set(u.key,{family:u.family,key:u.key,priority:u.priority,payload:u.payload,evidenceCount:1,evidenceRefs:[u.evidenceRef]});continue;}const row=byKey.get(u.key);row.evidenceCount++;const sig=stable(u.evidenceRef);if(!row.evidenceRefs.some(x=>stable(x)===sig))row.evidenceRefs.push(u.evidenceRef);}
 const deduped=[...byKey.values()].sort((a,b)=>b.priority-a.priority||a.key.localeCompare(b.key));const lineagePreserved=deduped.every(x=>x.evidenceRefs.length>=1&&x.evidenceRefs.length<=x.evidenceCount);
 return freezeDeep({schemaVersion:NUM_D8_COMPOSER_SCHEMA,workCode:'NUM-D8',publicationState:'CUSTOMER_PUBLISHABLE',customerPublishable:NUM_DEPTH_PRODUCTION_ACTIVE,runtimeUseAllowed:NUM_DEPTH_PRODUCTION_ACTIVE,sections:{priorityUnits:deduped,secondaryChart,alternativeTiming,relationship},deduplication:{before:units.length,after:deduped.length,duplicateCount:units.length-deduped.length,sameValueDifferentRolePreserved:true,canonicalEnergyAliasDedup:true,sourceLineagePreserved:lineagePreserved},boundaries:{unadmittedClaimsOnDefaultCustomerSurface:false,fortunePredictionCreated:false,compatibilityScoreCreated:false,schoolSilentMergeCreated:false}});
}
export default Object.freeze({composeNumDepthCandidate});
