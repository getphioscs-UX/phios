import {SMR_DOMAIN_REGISTRY,SMR_METHOD_PRIORITY_REGISTRY} from './smr-native-authority.js';

export const SMR_R2_PRIORITY_RULES=Object.freeze({
  schemaVersion:'PHI-OS-SMR-R2-PRIORITY-RULE-REGISTRY-v1.0.0',
  upstreamPriority:Object.freeze({PRIMARY:34,SECONDARY:18,UNSPECIFIED:8}),
  findingCentralityPerRef:4,findingCentralityCap:12,
  evidenceDensityPerRef:2,evidenceDensityCap:16,
  sharedEvidencePerRef:3,sharedEvidenceCap:12,
  counterEvidencePerRef:3,counterEvidenceCap:9,
  questionDirectDomainMatch:16,questionTextOverlapPerToken:2,questionTextOverlapCap:8,
  semanticRepetitionPenaltyPerExtraClaim:-4,semanticRepetitionPenaltyFloor:-12,
  relationImportance:Object.freeze({CORE_PATTERN:4,SUPPORT:5,TENSION:8,CONDITION:7,TRADEOFF:8,OPEN:5,TEMPORAL_ACTIVATION:6,OBSERVATION:5}),
  customerUsefulness:Object.freeze({CORE_PATTERN:10,SUPPORT:7,TENSION:11,CONDITION:9,TRADEOFF:11,OPEN:6,TEMPORAL_ACTIVATION:8,OBSERVATION:8}),
  thresholds:Object.freeze({PRIMARY:78,SECONDARY:60,SUPPORTING:42,CONDITIONAL:28}),
  firstScreen:Object.freeze({maxClaimRefs:3,allowedClasses:Object.freeze(['PRIMARY','SECONDARY'])}),
  intentDomainMap:Object.freeze({
    DIRECTION:Object.freeze(['ENVIRONMENT_DIRECTION','ACTION_RHYTHM']),WORK:Object.freeze(['WORK_RESOURCES']),RELATIONSHIP:Object.freeze(['RELATIONSHIP_EXCHANGE']),
    PRESSURE:Object.freeze(['REGULATION_PRESSURE']),EXPRESSION:Object.freeze(['IDENTITY_EXPRESSION','COMMUNICATION_EXCHANGE']),ENVIRONMENT:Object.freeze(['ENVIRONMENT_DIRECTION','REGULATION_PRESSURE']),
    OBSERVATION:Object.freeze(['CORE_STRUCTURE']),OPEN:Object.freeze([])
  })
});

export const SMR_R2_DEDUP_RULES=Object.freeze({claimTokenJaccard:.72,claimEvidenceJaccard:.25,sameDimensionEvidenceJaccard:.5,narrativeTokenJaccard:.8});
export {SMR_DOMAIN_REGISTRY,SMR_METHOD_PRIORITY_REGISTRY};
