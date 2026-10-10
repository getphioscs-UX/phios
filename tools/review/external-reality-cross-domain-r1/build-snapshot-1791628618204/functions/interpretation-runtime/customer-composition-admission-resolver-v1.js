import {CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER,customerCompositionAdmissionFor} from '../customer-projection/r12r3b-composition-admission-consumer-v1.js';
import {CX_R12R4B_ECR_COMPOSITION_ADMISSION_CONSUMER,ecrCompositionAdmissionFor} from '../customer-projection/r12r4b-ecr-composition-admission-consumer-v1.js';
import {CX_R12R3B_COMPOSITION_VERSION} from './cx-r12r3b-shared-runtime-v2.js';

const CANDIDATE_SCHEMA='PHI-OS-METHOD-INTERPRETATION-CANDIDATE-v2.0.0';
const LOCALE_AUTHORITY_VERSION='CX-R12R3B-CUSTOMER-LANGUAGE-v1.0.0';
const SUPPORTED_LOCALES=Object.freeze(['en','zh-Hans']);
const SUPPORTED_METHODS=Object.freeze(['AST','BZR','NUM','ZWR','ECR']);
const AST_HOUSE_SYSTEMS=Object.freeze(['PLACIDUS_V1','WHOLE_SIGN_V1']);
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const text=value=>String(value??'').trim();

export const CUSTOMER_COMPOSITION_ADMISSION_RESOLVER=freeze({
  schemaVersion:'PHI-OS-CUSTOMER-COMPOSITION-ADMISSION-RESOLVER-v1.0.0',
  authorityRef:CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER.sourceAuthorityRef,
  authoritySha256:CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER.sourceAuthoritySha256,
  successorAuthorityRef:CX_R12R4B_ECR_COMPOSITION_ADMISSION_CONSUMER.sourceAuthorityRef,
  successorAuthoritySha256:CX_R12R4B_ECR_COMPOSITION_ADMISSION_CONSUMER.sourceAuthoritySha256,
  ruleSetVersion:CX_R12R3B_COMPOSITION_VERSION,
  localeAuthorityVersion:LOCALE_AUTHORITY_VERSION,
  supportedMethods:SUPPORTED_METHODS,
  supportedLocales:SUPPORTED_LOCALES,
  boundary:{
    resolvesExistingAdmissionOnly:true,
    createsMeaningAuthority:false,
    createsInterpretationAuthority:false,
    comparesLiveProjectionToHistoricalReviewDigest:false,
    customerIdentityMatching:false
  }
});

/**
 * Resolve whether the already-admitted R12R3B composition rules may be used
 * for a live candidate. Historical review cases admit the ruleset; they are
 * never used as customer-identity or projection-digest matches.
 */
export function resolveCustomerCompositionAdmission({
  methodId,
  candidateSchemaVersion,
  meaningBundleCode,
  compositionRuleVersion,
  locale,
  projectionAuthorityVersion,
  methodParameters={}
}={}){
  const constraints=[];
  if(!SUPPORTED_METHODS.includes(methodId))constraints.push('METHOD_NOT_ADMITTED');
  if(candidateSchemaVersion!==CANDIDATE_SCHEMA)constraints.push('CANDIDATE_SCHEMA_NOT_ADMITTED');
  if(!text(meaningBundleCode))constraints.push('MEANING_BUNDLE_REQUIRED');
  if(compositionRuleVersion!==CX_R12R3B_COMPOSITION_VERSION)constraints.push('COMPOSITION_RULESET_NOT_ADMITTED');
  if(!SUPPORTED_LOCALES.includes(locale))constraints.push('LOCALE_NOT_ADMITTED');
  if(!text(projectionAuthorityVersion))constraints.push('PROJECTION_AUTHORITY_VERSION_REQUIRED');
  if(methodId==='AST'&&!AST_HOUSE_SYSTEMS.includes(methodParameters?.houseSystemId))constraints.push('AST_HOUSE_SYSTEM_NOT_ADMITTED');

  const source=methodId==='ECR'?ecrCompositionAdmissionFor(methodId):customerCompositionAdmissionFor(methodId);
  const sourceAuthorityRef=methodId==='ECR'?CX_R12R4B_ECR_COMPOSITION_ADMISSION_CONSUMER.sourceAuthorityRef:CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER.sourceAuthorityRef;
  const sourceAuthoritySha256=methodId==='ECR'?CX_R12R4B_ECR_COMPOSITION_ADMISSION_CONSUMER.sourceAuthoritySha256:CX_R12R3B_COMPOSITION_ADMISSION_CONSUMER.sourceAuthoritySha256;
  if(!source?.compositionCustomerPublishable)constraints.push('HUMAN_REVIEWED_COMPOSITION_ADMISSION_REQUIRED');
  const admitted=constraints.length===0;
  return freeze({
    schemaVersion:'PHI-OS-CUSTOMER-COMPOSITION-ADMISSION-DECISION-v1.0.0',
    admitted,
    admissionId:admitted?(methodId==='ECR'?'CX-R12R4B-R5-ECR-ADMISSION':`CX-R12R3B-PASS2B-${methodId}-ADMISSION`):null,
    admissionRef:admitted?`${sourceAuthorityRef}#methodAdmission/${methodId}`:null,
    methodId:methodId||null,
    ruleSetVersion:CX_R12R3B_COMPOSITION_VERSION,
    meaningAuthorityVersion:text(meaningBundleCode)||null,
    localeAuthorityVersion:LOCALE_AUTHORITY_VERSION,
    projectionAuthorityVersion:text(projectionAuthorityVersion)||null,
    reviewEvidenceRef:source?.humanReview?.evidenceRef||null,
    constraints,
    publicationAllowed:admitted,
    acceptanceBasis:admitted?'ADMITTED_COMPOSITION_RULESET':null,
    authority:{
      sourceAuthorityRef,
      sourceAuthoritySha256,
      historicalProjectionDigestCompared:false,
      liveCustomerHumanReviewClaimed:false
    }
  });
}
