import {promoteAcceptedInterpretation} from './cx-r12r3b-shared-runtime-v2.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const fail=(code,details={})=>{throw Object.assign(new Error(code),{code,...details})};

export const ADMITTED_CUSTOMER_INTERPRETATION_RUNTIME=freeze({
  schemaVersion:'PHI-OS-ADMITTED-CUSTOMER-INTERPRETATION-RUNTIME-v1.0.0',
  consumes:'PHI-OS-METHOD-INTERPRETATION-CANDIDATE-v2.0.0',
  produces:'PHI-OS-CUSTOMER-PUBLISHABLE-INTERPRETATION-v1.0.0',
  boundary:{
    createsMeaningAuthority:false,
    createsInterpretationAuthority:false,
    changesCompositionRules:false,
    rendererCreatesMeaning:false,
    aiCreatesMeaning:false
  }
});

function admittedUnit(unit){
  const {
    customerPublicationStatus:_legacyPublicationStatus,
    interpretationUnitId,
    plainLanguageExplanation,
    ruleRefs=[],
    ...rest
  }=unit;
  return {
    ...rest,
    interpretationUnitId,
    unitId:interpretationUnitId,
    summary:unit.structuralReason,
    body:plainLanguageExplanation,
    plainLanguageExplanation,
    semanticTags:[unit.methodId,unit.subject,unit.relationType,unit.priority].filter(Boolean),
    ruleRefs,
    derivationRefs:ruleRefs.map(ruleRef=>`COMPOSITION_RULE:${ruleRef}`),
    boundaryRefs:['CX-R12R4B:R1_CALCULATION_NOT_INTERPRETATION','CX-R12R4B:R3_RULESET_ADMISSION_NOT_LIVE_CUSTOMER_REVIEW','CX-R12R4B:R10_NO_EVIDENCE_REMAINS_OPEN']
  };
}

/**
 * Execute the existing R12R3B promotion function only after the unique live
 * admission resolver has admitted the current method/ruleset/locale tuple.
 */
export async function executeAdmittedCustomerInterpretation({
  canonicalProjection,
  meaningPayload,
  candidate,
  admission
}={}){
  if(admission?.admitted!==true||admission?.publicationAllowed!==true)fail('CX_R12R4B_COMPOSITION_ADMISSION_REQUIRED');
  if(candidate?.methodId!==admission.methodId)fail('CX_R12R4B_ADMISSION_METHOD_MISMATCH');
  if(candidate?.sourceReference?.projectionId!==canonicalProjection?.projectionId)fail('CX_R12R4B_PROJECTION_REFERENCE_MISMATCH');
  if(candidate?.projectionDigest!==candidate?.sourceReference?.projectionDigest)fail('CX_R12R4B_PROJECTION_DIGEST_MISMATCH');
  if(candidate?.compositionVersion!==admission.ruleSetVersion)fail('CX_R12R4B_COMPOSITION_RULESET_MISMATCH');
  if(meaningPayload?.meaningBundle?.bundleCode!==admission.meaningAuthorityVersion)fail('CX_R12R4B_MEANING_AUTHORITY_MISMATCH');

  const promoted=await promoteAcceptedInterpretation(candidate,{
    methodFidelityAccepted:true,
    customerClarityAccepted:true,
    evidenceRef:admission.reviewEvidenceRef,
    reviewerRefs:[admission.admissionRef]
  });
  if(promoted?.resultStatus!=='CUSTOMER_PUBLISHABLE'||promoted?.lifecycle?.customerPublishable!==true)fail('CX_R12R4B_CUSTOMER_PUBLICATION_NOT_ALLOWED');

  const {humanAcceptance:_historicalPromotionEvidence,...accepted}=promoted;
  const {HUMAN_REVIEWED:_historicalHumanReviewFlag,...liveFlags}=accepted.lifecycle.flags;
  const lifecycle={
    ...accepted.lifecycle,
    sequence:accepted.lifecycle.sequence.map(stage=>stage==='HUMAN_REVIEWED'?'ADMITTED_COMPOSITION_RULESET':stage),
    acceptanceBasis:'ADMITTED_COMPOSITION_RULESET',
    liveCustomerHumanReviewed:false,
    flags:{
      ...liveFlags,
      ADMITTED_COMPOSITION_RULESET:true,
      LIVE_CUSTOMER_HUMAN_REVIEWED:false
    }
  };

  return freeze({
    ...accepted,
    interpretationUnits:accepted.interpretationUnits.map(admittedUnit),
    lifecycle,
    acceptanceBasis:'ADMITTED_COMPOSITION_RULESET',
    projectionDigest:candidate.projectionDigest,
    meaningBundleCode:meaningPayload.meaningBundle.bundleCode,
    compositionRuleVersion:candidate.compositionVersion,
    admissionRef:admission.admissionRef,
    admissionEvidence:{
      scope:'COMPOSITION_RULESET',
      evidenceRef:admission.reviewEvidenceRef,
      liveCustomerHumanReviewClaimed:false
    },
    boundary:{
      liveCustomerHumanReviewClaimed:false,
      rendererCreatesMeaning:false,
      aiCreatesMeaning:false,
      realityKnown:false,
      professionalJudgmentCreated:false
    }
  });
}
