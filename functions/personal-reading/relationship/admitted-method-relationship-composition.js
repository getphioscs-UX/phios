export const ADMITTED_METHOD_RELATIONSHIP_COMPOSITION_SCHEMA='PHI-OS-ADMITTED-METHOD-RELATIONSHIP-COMPOSITION-v1.0.0';
const ADMISSION_REF='content/personal-reading/relationship/acceptance/rel-method-authority-successor-human-admission-v1.json';
const SPEC=Object.freeze({
 BZR:{schema:'PHI-OS-BZR-REL-CROSS-PERSON-STRUCTURE-v1.0.0',forbidden:['compatibilityScoreCreated','goodBadConclusionCreated','eventPredictionCreated']},
 ZWR:{schema:'PHI-OS-ZWR-REL-DUAL-READING-COMPOSITION-v1.0.0',forbidden:['crossChartStarInteractionCreated','starRelocationCreated','compatibilityScoreCreated','relationshipOutcomePredicted']},
 ECR:{schema:'PHI-OS-ECR-REL-DIRECTED-RELATION-GRAPH-v1.0.0',forbidden:['compatibilityScoreCreated','partnerHiddenStateInferred','guaranteedOutcomeCreated','currentRealityProofCreated']}
});
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
function fail(code){throw Object.assign(new Error(code),{code})}
export function promoteAdmittedMethodRelationshipComposition({methodId,candidate}={}){
 const s=SPEC[methodId];if(!s)fail('REL_ADMISSION_METHOD_NOT_SUPPORTED');if(candidate?.schemaVersion!==s.schema)fail('REL_ADMISSION_CANDIDATE_SCHEMA_MISMATCH');
 for(const k of s.forbidden)if(candidate?.boundaries?.[k]===true)fail(`REL_ADMISSION_FORBIDDEN_BOUNDARY_${k}`);
 const claims=Array.isArray(candidate?.claims)?candidate.claims:[];
 if(claims.some(c=>c?.methodId!==methodId||c?.customerPublishable!==false))fail('REL_ADMISSION_CANDIDATE_CLAIM_STATE_INVALID');
 const admittedClaims=claims.map(c=>freeze({...c,customerPublishable:true,governance:freeze({...c.governance,humanAdmissionState:'HUMAN_ADMITTED',humanAdmissionRef:ADMISSION_REF,semanticContentChangedByAdmission:false})}));
 return freeze({schemaVersion:ADMITTED_METHOD_RELATIONSHIP_COMPOSITION_SCHEMA,methodId,state:'HUMAN_ADMITTED_REL_W4_METHOD_COMPOSITION',candidateSchemaVersion:candidate.schemaVersion,claims:freeze(admittedClaims),claimCount:admittedClaims.length,humanAdmissionRef:ADMISSION_REF,boundaries:{semanticContentChangedByAdmission:false,compatibilityScoreCreated:false,partnerHiddenStateInferred:false,guaranteedOutcomeCreated:false,productCustomerPublicationAllowed:false,relW5Eligible:true}})
}
export default Object.freeze({promoteAdmittedMethodRelationshipComposition});
