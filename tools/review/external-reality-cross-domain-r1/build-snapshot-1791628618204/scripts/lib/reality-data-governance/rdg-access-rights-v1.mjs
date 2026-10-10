const VISIBILITY = new Set(['SUBJECT_ONLY','ACCOUNT_SCOPED','SERVICE_SCOPED','ASSIGNED_PROFESSIONAL','INTERNAL_GOVERNANCE','ANONYMIZED_AGGREGATE','PUBLIC']);

export function evaluateVisibility(input) {
  if (!VISIBILITY.has(input.visibilityScope)) return 'UNRESOLVED';
  if (input.visibilityScope === 'PUBLIC') return input.publicClassification === true ? 'VISIBLE' : 'NOT_VISIBLE';
  if (input.visibilityScope === 'SUBJECT_ONLY') return input.actorReference === input.subjectReference ? 'VISIBLE' : 'NOT_VISIBLE';
  if (input.visibilityScope === 'ACCOUNT_SCOPED') return input.actorAccountReference && input.actorAccountReference === input.accountReference ? 'REQUIRES_PERMISSION' : 'NOT_VISIBLE';
  if (input.visibilityScope === 'SERVICE_SCOPED') return input.actorServiceReference && input.actorServiceReference === input.serviceReference ? 'REQUIRES_PERMISSION' : 'NOT_VISIBLE';
  if (input.visibilityScope === 'ASSIGNED_PROFESSIONAL') return input.professionalAssignmentValid === true ? 'REQUIRES_PERMISSION' : 'NOT_VISIBLE';
  if (input.visibilityScope === 'ANONYMIZED_AGGREGATE') return input.anonymized === true ? 'REQUIRES_PERMISSION' : 'NOT_VISIBLE';
  return input.internalGovernanceRole === true ? 'REQUIRES_PERMISSION' : 'NOT_VISIBLE';
}

export function evaluateDataPermission(input) {
  const required=['actorReference','subjectReference','purposeCode','purposeAllowed','visibilityDecision','sensitivityClass'];
  if(required.some(key=>input[key]===undefined)) return 'UNRESOLVED';
  if(input.visibilityDecision==='NOT_VISIBLE'||input.purposeAllowed!==true) return 'DENY';
  if(input.visibilityDecision==='UNRESOLVED') return 'UNRESOLVED';
  if(input.sensitivityClass==='RESTRICTED_PROFESSIONAL') {
    if(input.professionalAssignmentValid!==true||input.professionalAuthority!=='PR') return 'REQUIRE_PROFESSIONAL_ASSIGNMENT';
    if(input.consentValid!==true&&input.legalBasisReference===undefined) return 'REQUIRE_CONSENT';
    return 'ALLOW';
  }
  if(['SENSITIVE','HIGHLY_SENSITIVE'].includes(input.sensitivityClass)&&input.consentValid!==true&&input.legalBasisReference===undefined) return 'REQUIRE_CONSENT';
  return input.visibilityDecision==='VISIBLE'||input.visibilityDecision==='REQUIRES_PERMISSION' ? 'ALLOW' : 'DENY';
}

export function evaluateDeletion(input) {
  if(input.providerInitiated===true) return 'DENY';
  if(input.legalHold===true) return 'BLOCK_LEGAL_HOLD';
  if(input.identityVerified!==true||input.authorityReference===undefined||input.retentionDecision===undefined) return 'REVIEW_REQUIRED';
  if(input.retentionDecision==='ANONYMIZE') return 'ANONYMIZE';
  if(input.retentionDecision==='DELETE'&&input.lineageRequired===true) return 'TOMBSTONE_AND_DELETE';
  if(input.retentionDecision==='DELETE') return 'DELETE';
  return 'REVIEW_REQUIRED';
}

export function createDeletionTombstone(input) {
  const required=['tombstoneCode','dataReference','subjectReferenceHash','deletionReasonCode','authorityReference','deletedAt','lineageReferences','retentionProofReference'];
  for(const key of required) if(input[key]===undefined) throw new Error(`RDG_TOMBSTONE_MISSING:${key}`);
  for(const key of ['value','rawPayload','professionalNotes','authenticationSecret']) if(input[key]!==undefined) throw new Error(`RDG_TOMBSTONE_PAYLOAD_FORBIDDEN:${key}`);
  return Object.freeze(Object.fromEntries(required.map(key=>[key,input[key]])));
}
