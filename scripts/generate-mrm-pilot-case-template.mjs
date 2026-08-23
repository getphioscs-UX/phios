import {readJson} from './lib/runtime-maturity/pilot-campaign-lib.mjs';
const product=String(process.argv[2]||'').toUpperCase();
const candidates=readJson('content/runtime-maturity/pilot/campaign/first-batch-pilot-candidate-registry-v1.json');
const candidate=candidates.candidates.find(c=>c.product===product);
if(!candidate){ console.error('Usage: node scripts/generate-mrm-pilot-case-template.mjs <DAR|RRP|FINANCIAL>'); process.exit(2); }
const now='REPLACE_WITH_EXECUTION_TIMESTAMP';
const record={
  pilotCaseId:`REPLACE_WITH_REAL_${product}_PILOT_CASE_ID`,
  campaignCaseId:candidate.campaignCaseId,
  product,
  customerReference:'REPLACE_WITH_OPAQUE_CUSTOMER_REFERENCE',
  consentReference:'REPLACE_WITH_OPAQUE_VALID_CONSENT_REFERENCE',
  consentPurposeScopes:candidate.product==='DAR'?['WILL_ASSEMBLY']:candidate.product==='FINANCIAL'?['FINANCIAL_PLANNING','PROFESSIONAL_REVIEW','REPORT']:['REPLACE_WITH_CURRENT_RRP_PURPOSE_SCOPE'],
  caseVersion:'1',
  runtimeCapabilities:candidate.candidatePromotionCapabilities.map(capabilityCode=>({runtimeCode:capabilityCode.split('-')[0],capabilityCode,runtimeVersion:'1.0.0'})),
  stageEvidence:candidate.requiredStageEvidence.map(stageCode=>({stageCode,stageAuthority:'REPLACE_WITH_CANONICAL_STAGE_AUTHORITY',runtimeVersion:'REPLACE_WITH_EXACT_RUNTIME_VERSION',inputReference:'private:REPLACE_INPUT_REFERENCE',inputDigest:'REPLACE_SHA256',outputReference:'private:REPLACE_OUTPUT_REFERENCE',outputDigest:'REPLACE_SHA256',executedAt:now,evidenceState:'CURRENT'})),
  inputReferences:[{reference:'private:REPLACE_INPUT_REFERENCE',digest:'REPLACE_SHA256'}],
  outputReferences:[{reference:'private:REPLACE_OUTPUT_REFERENCE',digest:'REPLACE_SHA256'}],
  humanInterventions:[],
  unexpectedEvents:[],
  releaseReferences:[],
  completionState:'IN_PROGRESS',
  evidenceReferences:[],
  privacyEnvelope:{privateStorageReference:'private:REPLACE_EVIDENCE_STORE_REFERENCE',retentionClass:'REPLACE_WITH_RDG_RETENTION_CLASS',rawPayloadStoredInRepository:false,consentCheckedAt:now},
  realCaseAttestation:{attestationId:'REPLACE_WITH_ATTESTATION_ID',attestedByRole:'PILOT_OPERATOR',attestedAt:now,sourceSystemReference:'private:REPLACE_REAL_SOURCE_SYSTEM_REFERENCE',synthetic:null},
  productBindings:Object.fromEntries((candidate.requiredProductBindings||[]).map(k=>[k,k==='selectedMethodCodes'?[]:`REPLACE_WITH_${k.toUpperCase()}`]))
};
console.log(JSON.stringify(record,null,2));
