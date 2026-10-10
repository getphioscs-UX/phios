import {promoteAdmittedMethodRelationshipComposition as promoteLegacy} from './admitted-method-relationship-composition.js';
export const CURRENT_ADMITTED_METHOD_RELATIONSHIP_COMPOSITION_SCHEMA='PHI-OS-ADMITTED-METHOD-RELATIONSHIP-COMPOSITION-v1.0.0';
const HD_SCHEMA='PHI-OS-HD-REL-R1-RELATIONSHIP-COMPOSITION-v1.0.0';
const HD_ADMISSION_REF='content/personal-reading/relationship/hd-r1/acceptance/HD-REL-R1-W8-production-admission-v1.json';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code){throw Object.assign(new Error(code),{code})}
function scanForbidden(v,path='$'){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(['compatibilityScore','compatibilityPercentage','matchPercentage','soulmate','destinedRelationship','partnerHiddenState','partnerHiddenFeeling','relationshipOutcomePredicted','guaranteedOutcomeCreated','pentaCreated','bg5Created'].includes(k)&&x===true)fail(`REL_ADMISSION_V2_FORBIDDEN_BOUNDARY:${path}.${k}`);scanForbidden(x,`${path}.${k}`)}}
export function promoteCurrentAdmittedMethodRelationshipComposition({methodId,candidate}={}){
 if(methodId!=='HD')return promoteLegacy({methodId,candidate});
 if(candidate?.schemaVersion!==HD_SCHEMA)fail('REL_ADMISSION_V2_HD_SCHEMA_MISMATCH');scanForbidden(candidate);
 const claims=Array.isArray(candidate?.claims)?candidate.claims:[];
 if(claims.some(c=>c?.methodId!=='HD'||c?.customerPublishable!==false))fail('REL_ADMISSION_V2_HD_CLAIM_STATE_INVALID');
 const admittedClaims=claims.map(c=>freeze({...c,customerPublishable:true,governance:freeze({...c.governance,humanAdmissionState:'HUMAN_ADMITTED',humanAdmissionRef:HD_ADMISSION_REF,semanticContentChangedByAdmission:false})}));
 return freeze({schemaVersion:CURRENT_ADMITTED_METHOD_RELATIONSHIP_COMPOSITION_SCHEMA,methodId:'HD',state:'HUMAN_ADMITTED_REL_W4_METHOD_COMPOSITION',candidateSchemaVersion:candidate.schemaVersion,claims:freeze(admittedClaims),claimCount:admittedClaims.length,humanAdmissionRef:HD_ADMISSION_REF,boundaries:{semanticContentChangedByAdmission:false,compatibilityScoreCreated:false,partnerHiddenStateInferred:false,guaranteedOutcomeCreated:false,productCustomerPublicationAllowed:false,relW5Eligible:true,individualAuthorityPreserved:true,pentaCreated:false,bg5Created:false}})
}
export default Object.freeze({promoteCurrentAdmittedMethodRelationshipComposition});
