/** PHI OS ICHI-W9 validation-only I Ching -> Reality Journey handoff preparation. */
function plain(v,m){if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(m);}
export function prepareIChingRealityJourneyHandoff({projection,interpretation,userSelectedRelevance,consentState}={}){
  plain(projection,'ICHING_PROJECTION_REQUIRED');plain(interpretation,'ICHING_INTERPRETATION_REQUIRED');
  if(projection.schemaVersion!=='PHI-OS-CANONICAL-PROJECTION-v1.0.0'||projection.projectionType!=='HEXAGRAM'||projection.projectionSource?.methodCode!=='I_CHING')throw new TypeError('INVALID_ICHING_PROJECTION_HANDOFF');
  if(interpretation.schemaVersion!=='PHI-OS-ICHING-PHIOS-INTERPRETATION-COMPOSITION-v1.0.0')throw new TypeError('INVALID_ICHING_INTERPRETATION_HANDOFF');
  if(consentState!=='GRANTED')throw new TypeError('ICHING_REALITY_JOURNEY_EXPLICIT_CONSENT_REQUIRED');
  if(!Array.isArray(userSelectedRelevance)||userSelectedRelevance.length===0)throw new TypeError('ICHING_USER_SELECTED_RELEVANCE_REQUIRED');
  for(const item of userSelectedRelevance){plain(item,'ICHING_RELEVANCE_ITEM_REQUIRED');if(item.selected!==true||typeof item.note!=='string'||!item.note.trim())throw new TypeError('ICHING_RELEVANCE_MUST_BE_EXPLICIT_USER_SELECTION');}
  return Object.freeze({schemaVersion:'PHI-OS-ICHI-REALITY-JOURNEY-HANDOFF-v1.0.0',sourceType:'SYMBOLIC_METHOD_INTERPRETATION',methodCode:'I_CHING',handoffLabel:'Send to Reality Journey',projection:structuredClone(projection),interpretation:structuredClone(interpretation),userSelectedRelevance:Object.freeze(userSelectedRelevance.map(x=>Object.freeze(structuredClone(x)))),consentState:'GRANTED',authority:Object.freeze({fateConclusionIncluded:false,preCreatedRealityTruth:false,automaticRealityDiagnosis:false,canonicalCaseCreated:false,realityModelPersisted:false,userDecisionAuthority:true}),persistencePerformed:false,activationPerformed:false});
}
