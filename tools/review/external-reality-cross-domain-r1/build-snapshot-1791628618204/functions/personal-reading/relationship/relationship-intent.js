export const RELATIONSHIP_INTENT_SCHEMA='PHI-OS-RELATIONSHIP-INTENT-v1.0.0';
const MODES=new Set(['SELF_RELATIONSHIP_PATTERN','SPECIFIC_PERSON_RELATIONSHIP']);
const TYPES=new Set(['PARTNER','SPOUSE','DATING','FORMER_PARTNER','PARENT_CHILD','SIBLING','FAMILY','FRIEND','BUSINESS_PARTNER','COLLABORATOR','COLLEAGUE','OTHER']);
const FOCUS=new Set(['ATTRACTION_CONNECTION','COMMUNICATION','UNDERSTANDING','INTIMACY_DISTANCE','DECISION_MAKING','SHARED_LIFE','FAMILY_HOME','RESOURCES_MONEY','WORK_COLLABORATION','CONFLICT_REPAIR','CURRENT_PHASE','TIMING','SPECIFIC_DECISION','OPEN_QUESTION']);
const PROHIBITED=new Set(['compatibilityScore','compatibilityPercentage','matchPercentage','relationshipVerdict','soulmate','destinedVerdict','stayLeaveDirective','partnerHiddenFeeling','diagnosis']);
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function text(v,code,{optional=false,max=2000}={}){if(v==null&&optional)return null;if(typeof v!=='string'||!v.trim())fail(code,400);const out=v.trim();if(out.length>max)fail(`${code}_TOO_LONG`,400);return out;}
function scan(v,path='$'){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(PROHIBITED.has(k))fail(`REL_W0_PROHIBITED_FIELD:${path}.${k}`,409);scan(x,`${path}.${k}`);}}
export function normalizeRelationshipIntent(input={}){
  scan(input);
  const relationshipIntentId=text(input.relationshipIntentId,'REL_W0_INTENT_ID_REQUIRED');
  const mode=input.mode;if(!MODES.has(mode))fail('REL_W0_MODE_INVALID',400);
  const relationshipType=input.relationshipType;if(!TYPES.has(relationshipType))fail('REL_W0_RELATIONSHIP_TYPE_INVALID',400);
  const focusAreas=Array.isArray(input.focusAreas)?[...new Set(input.focusAreas)]:[];
  if(focusAreas.length<1||focusAreas.length>3||focusAreas.some(x=>!FOCUS.has(x)))fail('REL_W0_FOCUS_AREAS_INVALID',400);
  const participantARef=text(input.participantARef,'REL_W0_PARTICIPANT_A_REQUIRED');
  const customerQuestion=text(input.customerQuestion,'REL_W0_CUSTOMER_QUESTION_INVALID',{optional:true,max:1200});
  const locale=input.locale==='zh-Hans'?'zh-Hans':'en';
  const purpose=text(input.purpose,'REL_W0_PURPOSE_REQUIRED');
  if(purpose!=='RELATIONSHIP_READING')fail('REL_W0_PURPOSE_NOT_ADMITTED',403);
  const consent=input.consent;if(!consent||typeof consent!=='object'||Array.isArray(consent)||consent.relationshipReadingUseAllowed!==true)fail('REL_W0_EXPLICIT_CONSENT_REQUIRED',403);
  return freeze({
    schemaVersion:RELATIONSHIP_INTENT_SCHEMA,relationshipIntentId,mode,relationshipType,focusAreas,customerQuestion,participantARef,
    participantBRequired:mode==='SPECIFIC_PERSON_RELATIONSHIP',locale,purpose,
    consent:freeze({relationshipReadingUseAllowed:true,consentRecordId:text(consent.consentRecordId,'REL_W0_CONSENT_RECORD_REQUIRED')}),
    governance:freeze({relationshipTypeInferred:false,focusInferred:false,outcomeInferred:false,compatibilityScoreAllowed:false,guaranteedOutcomeAllowed:false,soulmateVerdictAllowed:false,stayLeaveDirectiveAllowed:false,partnerHiddenStateInferenceAllowed:false,diagnosisAllowed:false})
  });
}
export const RELATIONSHIP_INTENT_VALUES=freeze({modes:[...MODES],relationshipTypes:[...TYPES],focusAreas:[...FOCUS]});
