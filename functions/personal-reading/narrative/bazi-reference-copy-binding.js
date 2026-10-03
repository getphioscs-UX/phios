import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {BAZI_REFERENCE_COPY_BINDING} from './bazi-reference-copy-binding.generated.js';
export function baziReferenceSemanticPayload(reading,temporalContext){
 return {methodId:reading?.methodId,sourceNatalProjectionId:reading?.evidence?.sourceNatalProjectionId,structuralModel:reading?.structuralModel,professionalModules:reading?.professionalModules,temporalContext:reading?.temporalContext,observation:{localDate:temporalContext?.localDate??null,localTime:temporalContext?.localTime??null,timezone:temporalContext?.timezone??null,utcOffset:temporalContext?.utcOffset??null}};
}
export async function assertBaziReferenceCopyBinding({reading,temporalContext}){
 const fingerprint=await sha256Stable(baziReferenceSemanticPayload(reading,temporalContext));
 if(fingerprint!==BAZI_REFERENCE_COPY_BINDING.semanticFingerprint)throw Object.assign(new Error('BCR_ACCEPTED_REFERENCE_SUBJECT_OR_TIME_MISMATCH'),{code:'BCR_ACCEPTED_REFERENCE_SUBJECT_OR_TIME_MISMATCH'});
 return {state:'HISTORICAL_REFERENCE_SEMANTIC_BINDING_VERIFIED',fingerprint,personIdentityVerified:false,productionAdmission:false};
}
