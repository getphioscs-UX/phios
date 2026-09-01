export const RELATIONSHIP_PARTICIPANT_READING_SET_SCHEMA='PHI-OS-RELATIONSHIP-PARTICIPANT-READING-SET-v1.0.0';
const ACCEPTED_READING_SCHEMA='PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0';
const METHOD_IDS=new Set(['AST','BZR','ZWR','NUM','ECR','HD']);
const FORBIDDEN_KEYS=new Set(['relationshipClaim','relationshipMeaning','compatibilityScore','compatibilityPercentage','matchPercentage','relationshipVerdict','soulmate','partnerHiddenState']);
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function scan(v,path='$'){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){if(FORBIDDEN_KEYS.has(k))fail(`REL_W3_RELATIONSHIP_MEANING_FORBIDDEN:${path}.${k}`,409);scan(x,`${path}.${k}`);}}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;}
async function digest(v){const d=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(v)));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function accepted(x,methodId,label){if(x==null)return null;scan(x);if(x.schemaVersion!==ACCEPTED_READING_SCHEMA||x.methodId!==methodId||x.boundary?.acceptedAuthorityOnly!==true)fail(`REL_W3_${label}_ACCEPTED_READING_REQUIRED:${methodId}`,400);return x;}
function matrixEntry(matrix,methodId){const row=matrix?.methods?.find?.(x=>x.methodId===methodId);if(!row)fail(`REL_W3_CAPABILITY_ROW_REQUIRED:${methodId}`,409);return row;}
export async function buildRelationshipParticipantReadingSet({relationshipIntentId,participantARef,participantBRef=null,participantAInputDigest,participantBInputDigest=null,methodPairs=[],capabilityMatrix}={}){
  if(typeof relationshipIntentId!=='string'||!relationshipIntentId.trim())fail('REL_W3_INTENT_ID_REQUIRED',400);
  if(typeof participantARef!=='string'||!participantARef.trim())fail('REL_W3_PARTICIPANT_A_REQUIRED',400);
  if(participantBRef!=null&&participantBRef===participantARef)fail('REL_W3_DISTINCT_PARTICIPANTS_REQUIRED',400);
  if(typeof participantAInputDigest!=='string'||!participantAInputDigest)fail('REL_W3_A_INPUT_DIGEST_REQUIRED',400);
  if(participantBRef&&(!participantBInputDigest||typeof participantBInputDigest!=='string'))fail('REL_W3_B_INPUT_DIGEST_REQUIRED',400);
  if(!Array.isArray(methodPairs))fail('REL_W3_METHOD_PAIRS_ARRAY_REQUIRED',400);
  const aReadings=[],bReadings=[],pairs=[],suppressed=[];const seen=new Set();
  for(const raw of methodPairs){const methodId=raw?.methodId;if(!METHOD_IDS.has(methodId)||seen.has(methodId))fail('REL_W3_METHOD_PAIR_INVALID',400);seen.add(methodId);const cap=matrixEntry(capabilityMatrix,methodId);const a=accepted(raw.A,methodId,'A');const b=accepted(raw.B,methodId,'B');if(a)aReadings.push(a);if(b)bReadings.push(b);
    if(!participantBRef&&b)fail(`REL_W3_PERSON_B_READING_WITHOUT_PARTICIPANT_B:${methodId}`,400);const both=Boolean(participantBRef&&a&&b);const relationshipEligible=both&&cap.relationshipCompositionSupported==='SUPPORTED'&&cap.customerPublishable===true;
    const reasons=[];if(!a)reasons.push('PERSON_A_ACCEPTED_READING_MISSING');if(participantBRef&&!b)reasons.push('PERSON_B_ACCEPTED_READING_MISSING');if(cap.relationshipCompositionSupported!=='SUPPORTED')reasons.push(`RELATIONSHIP_COMPOSITION_${cap.relationshipCompositionSupported}`);if(cap.customerPublishable!==true)reasons.push('METHOD_NOT_CUSTOMER_PUBLISHABLE');
    if(reasons.length)suppressed.push(freeze({methodId,reasonCodes:reasons}));
    pairs.push(freeze({methodId,participantAReadingRef:a?.readingAuthorityRef??null,participantBReadingRef:b?.readingAuthorityRef??null,participantASemanticDigest:a?.semanticDigest??null,participantBSemanticDigest:b?.semanticDigest??null,relationshipEligible,relationshipMeaningCreated:false}));
  }
  const core={schemaVersion:RELATIONSHIP_PARTICIPANT_READING_SET_SCHEMA,relationshipIntentId,participants:{A:{participantRef:participantARef,inputDigest:participantAInputDigest,methodReadings:aReadings},B:participantBRef?{participantRef:participantBRef,inputDigest:participantBInputDigest,methodReadings:bReadings}:null},methodPairs:pairs,participantPrecision:{A:'PRESERVED_FROM_INPUT_AND_METHOD_READING',B:participantBRef?'PRESERVED_FROM_INPUT_AND_METHOD_READING':'NOT_APPLICABLE'},suppressedCapabilities:suppressed,governance:{independentReadingFreeze:true,personAUsesPersonBFacts:false,personBUsesPersonAFacts:false,relationshipMeaningCreated:false,uncertaintyCrossFilled:false,relationshipEligibilityRequiresBothAcceptedReadings:true,relationshipEligibilityRequiresCapabilitySupported:true}};
  const semanticDigest=await digest(core);return freeze({...core,semanticDigest});
}
