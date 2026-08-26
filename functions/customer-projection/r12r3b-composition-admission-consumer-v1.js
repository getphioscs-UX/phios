/**
 * Runtime projection of the accepted CX-R12R3B composition admission.
 *
 * This module is not a meaning or interpretation authority. Its only purpose is
 * to let the customer projection layer consume the already-accepted PASS2B
 * admission in environments where repository JSON cannot be read at runtime.
 * The R12R4A checker binds this projection to the canonical JSON digest.
 */
const AUTHORITY_REF='content/customer-experience-rebuild/admission/cx-r12r3b-human-reviewed-composition-admission-v1.json';
const AUTHORITY_SHA256='e08b0c18085e9958fdab9fa0cba2a68a5314c8523115151588b723a91ef477b6';
const EVIDENCE_REF='content/customer-experience-rebuild/review/cx-r12r3b-human-review-results-v1.json';
const METHODS=Object.freeze({
  AST:Object.freeze({acceptedCases:24,requiredCases:24}),
  BZR:Object.freeze({acceptedCases:24,requiredCases:24}),
  NUM:Object.freeze({acceptedCases:24,requiredCases:24}),
  ZWR:Object.freeze({acceptedCases:24,requiredCases:24})
});

export const CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER=Object.freeze({
  schemaVersion:'PHI-OS-CX-R12R3B-COMPOSITION-ADMISSION-CONSUMER-v1.0.0',
  sourceAuthorityRef:AUTHORITY_REF,
  sourceAuthoritySha256:AUTHORITY_SHA256,
  evidenceRef:EVIDENCE_REF,
  status:'CONSUMES_HUMAN_REVIEWED_COMPOSITION_ADMISSION',
  methods:METHODS,
  boundary:Object.freeze({
    createsMeaningAuthority:false,
    createsInterpretationAuthority:false,
    changesAtomicMeaning:false,
    changesCompositionRules:false,
    presentationCutoverOnly:true
  })
});

export function customerCompositionAdmissionFor(methodId){
  const method=METHODS[methodId];
  if(!method||method.acceptedCases!==method.requiredCases)return null;
  return Object.freeze({
    methodId,
    sourceAuthorityRef:AUTHORITY_REF,
    sourceAuthoritySha256:AUTHORITY_SHA256,
    compositionCustomerPublishable:true,
    humanReview:Object.freeze({
      methodFidelityAccepted:true,
      customerClarityAccepted:true,
      evidenceRef:EVIDENCE_REF,
      reviewerRefs:Object.freeze([AUTHORITY_REF])
    })
  });
}
