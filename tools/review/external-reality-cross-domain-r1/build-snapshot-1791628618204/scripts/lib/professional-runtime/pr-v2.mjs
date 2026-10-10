import crypto from 'node:crypto';

const OUTCOME_KINDS = Object.freeze([
  'PROFESSIONAL_OBSERVATION',
  'PROFESSIONAL_RECOMMENDATION',
  'PROFESSIONAL_REVIEW',
  'PROFESSIONAL_APPROVAL',
  'PROFESSIONAL_SIGNATURE',
  'PROFESSIONAL_AUDIT',
  'PROFESSIONAL_RELEASE'
]);

const STATES = Object.freeze(['DRAFT', 'REVIEWED', 'APPROVED', 'SIGNED', 'RELEASED']);
const INDEPENDENT_REVIEW_ROLES = new Set(['PEER_REVIEW', 'SECOND_PROFESSIONAL', 'SUPERVISOR']);
const REVIEW_ROLES = new Set(['PRIMARY_PROFESSIONAL_REVIEW', ...INDEPENDENT_REVIEW_ROLES]);
const REVIEW_PASS = new Set(['PASS', 'PASS_WITH_LIMITATIONS']);

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}
function required(value, field) {
  const result = clean(value);
  if (!result) throw new TypeError(`${field} is required.`);
  return result;
}
function unique(values, field, { allowEmpty = false } = {}) {
  const result = [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))];
  if (!allowEmpty && result.length === 0) throw new TypeError(`${field} requires at least one value.`);
  if (result.includes('*')) throw new TypeError(`${field} cannot contain wildcard scope.`);
  return Object.freeze(result);
}
function iso(value, field = 'time') {
  const text = required(value, field);
  const ms = Date.parse(text);
  if (!Number.isFinite(ms)) throw new TypeError(`${field} must be ISO date-time.`);
  return new Date(ms).toISOString();
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
}
export function stableDigest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freeze(child);
  return value;
}
function ref(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${field} reference is required.`);
  return value;
}
function assertReference(record, { dataTypes = [], authorities = [], referenceKinds = [] }, field) {
  ref(record, field);
  required(record.reference, `${field}.reference`);
  if (dataTypes.length && !dataTypes.includes(clean(record.dataType))) throw new TypeError(`${field} dataType is not governed.`);
  if (authorities.length && !authorities.includes(clean(record.authority))) throw new TypeError(`${field} authority is not governed.`);
  if (referenceKinds.length && !referenceKinds.includes(clean(record.referenceKind))) throw new TypeError(`${field} referenceKind is not governed.`);
  return true;
}
function digestRecord(record, omit = []) {
  const copy = structuredClone(record);
  for (const key of omit) delete copy[key];
  return stableDigest(copy);
}
function event(previousDigest, {eventType, who, when, whatEvidence = [], whatVersion, whatChanged, whatApproved = null}) {
  const record = {
    dataType: 'OUTCOME_RECORD',
    outcomeKind: 'PROFESSIONAL_AUDIT',
    eventType: required(eventType, 'eventType'),
    who: required(who, 'who'),
    when: iso(when, 'when'),
    whatEvidence: unique(whatEvidence, 'whatEvidence', {allowEmpty: true}),
    whatVersion: required(whatVersion, 'whatVersion'),
    whatChanged: required(whatChanged, 'whatChanged'),
    whatApproved: clean(whatApproved) || null,
    previousEventDigest: clean(previousDigest) || null
  };
  record.eventDigest = digestRecord(record, ['eventDigest']);
  return freeze(record);
}

export function buildProfessionalCase(input = {}) {
  const caseId = required(input.caseId, 'caseId');
  const customerId = required(input.customer?.customerId, 'customer.customerId');
  const professionalId = required(input.professional?.professionalId, 'professional.professionalId');
  const scope = unique(input.scope, 'scope');
  const consent = ref(input.consent, 'consent');
  const service = ref(input.service, 'service');
  const assignment = ref(input.assignmentReference, 'assignmentReference');
  if (clean(input.status) !== 'ACTIVE') throw new TypeError('Professional Case must be ACTIVE for production work.');
  if (clean(consent.state) !== 'ACTIVE') throw new TypeError('Professional Case requires active consent.');
  if (clean(assignment.state) !== 'active') throw new TypeError('Professional Case requires active PWS Assignment.');
  if (clean(consent.purpose) !== clean(service.purpose)) throw new TypeError('Consent purpose must match service purpose.');
  const consentScopes = unique(consent.scopes, 'consent.scopes');
  if (scope.some(item => !consentScopes.includes(item))) throw new TypeError('Case scope exceeds consent scope.');
  if (assignment.professionalId && clean(assignment.professionalId) !== professionalId) throw new TypeError('Assignment professional mismatch.');
  if (assignment.customerId && clean(assignment.customerId) !== customerId) throw new TypeError('Assignment customer mismatch.');
  if (assignment.serviceId && clean(assignment.serviceId) !== required(service.serviceId, 'service.serviceId')) throw new TypeError('Assignment service mismatch.');
  const record = {
    objectClass: 'PR_CASE_CONTEXT',
    caseId,
    customer: { customerId },
    professional: { professionalId },
    scope,
    consent: {
      reference: required(consent.reference, 'consent.reference'),
      state: 'ACTIVE',
      purpose: required(consent.purpose, 'consent.purpose'),
      scopes: consentScopes
    },
    service: {
      serviceId: required(service.serviceId, 'service.serviceId'),
      purpose: required(service.purpose, 'service.purpose')
    },
    status: 'ACTIVE',
    assignmentReference: {
      assignmentId: required(assignment.assignmentId, 'assignmentReference.assignmentId'),
      state: 'active'
    },
    workspaceReference: required(input.workspaceReference, 'workspaceReference'),
    createdAt: iso(input.createdAt, 'createdAt'),
    pwsCaseObjectCreated: false
  };
  record.caseDigest = digestRecord(record, ['caseDigest']);
  return freeze(record);
}

export function authorizeProfessionalAccess(caseContext, input = {}) {
  if (caseContext?.objectClass !== 'PR_CASE_CONTEXT' || caseContext.status !== 'ACTIVE') throw new TypeError('Active PR Case Context required.');
  const professionalId = required(input.professionalId, 'professionalId');
  const customerId = required(input.customerId, 'customerId');
  const purpose = required(input.purpose, 'purpose');
  const scopes = unique(input.scopes, 'scopes');
  if (professionalId !== caseContext.professional.professionalId) throw new TypeError('Professional access professional mismatch.');
  if (customerId !== caseContext.customer.customerId) throw new TypeError('Professional access customer mismatch.');
  if (purpose !== caseContext.service.purpose || purpose !== caseContext.consent.purpose) throw new TypeError('Professional access purpose mismatch.');
  if (scopes.some(scope => !caseContext.scope.includes(scope) || !caseContext.consent.scopes.includes(scope))) {
    throw new TypeError('Professional access scope exceeds case or consent.');
  }
  if (input.accountRoleUsedAsAuthority === true) throw new TypeError('Account role cannot grant Professional authority.');
  return freeze({
    decision: 'ALLOW_MINIMUM_NECESSARY_PROFESSIONAL_ACCESS',
    professionalId, customerId, purpose, scopes,
    assignmentReference: caseContext.assignmentReference.assignmentId,
    consentReference: caseContext.consent.reference,
    purposeBound: true, consentBound: true, scopeBound: true
  });
}

export function validateProfessionalCapabilityBoundary(caseContext, input = {}) {
  const professionalId = caseContext?.professional?.professionalId;
  const capability = ref(input.capabilityDecision, 'capabilityDecision');
  const credential = input.credentialRequired === false ? null : ref(input.credentialDecision, 'credentialDecision');
  if (input.accountRole || input.accountRoleUsedAsCapability === true) throw new TypeError('Account role cannot satisfy capability.');
  if (clean(capability.capabilityAuthority) !== 'runtime/capability') throw new TypeError('Capability must come from runtime/capability authority.');
  if (clean(capability.professionalId) !== professionalId || clean(capability.state) !== 'ACTIVE') throw new TypeError('Active Professional capability decision required.');
  const capabilityScope = unique(capability.scope, 'capabilityDecision.scope');
  if (caseContext.scope.some(scope => !capabilityScope.includes(scope))) throw new TypeError('Professional capability does not cover case scope.');
  if (credential) {
    if (clean(credential.credentialAuthority) !== 'runtime/credential') throw new TypeError('Credential must come from runtime/credential authority.');
    if (clean(credential.professionalId) !== professionalId || clean(credential.state) !== 'ACTIVE') throw new TypeError('Active Professional credential decision required.');
  }
  return freeze({
    decision: 'PROFESSIONAL_CAPABILITY_BOUNDARY_SATISFIED',
    professionalId,
    capabilityReferences: unique(capability.capabilityCodes, 'capabilityDecision.capabilityCodes'),
    credentialReferences: credential ? unique(credential.credentialCodes, 'credentialDecision.credentialCodes') : Object.freeze([]),
    alrCapabilityReferences: unique(input.alrCapabilityReferences, 'alrCapabilityReferences', {allowEmpty: true}),
    alrPermissionEffect: 'NONE',
    accountRolePermissionEffect: 'NONE'
  });
}

export function buildProfessionalEvidencePackage(input = {}) {
  const spec = [
    ['rawDataReferences', {dataTypes:['REALITY_INPUT_RECORD'], authorities:['ICR']}],
    ['realityReferences', {dataTypes:['RUNTIME_STATE_RECORD'], authorities:['RMO']}],
    ['evidenceReferences', {dataTypes:['REALITY_EVIDENCE_RECORD'], authorities:['RRE']}],
    ['readoutReferences', {dataTypes:['REALITY_READOUT_RECORD'], authorities:['RRE']}],
    ['meaningReferences', {dataTypes:['MEANING_PROJECTION_RECORD'], authorities:['CMR']}],
    ['journeyReferences', {dataTypes:['NAVIGATION_RECORD'], authorities:['JR']}],
    ['unknownReferences', {dataTypes:['REALITY_READOUT_RECORD','RUNTIME_STATE_RECORD'], authorities:['RRE','RMO']}]
  ];
  for (const [key, rules] of spec) for (const item of input[key] || []) assertReference(item, rules, key);
  for (const item of input.metricReferences || []) {
    assertReference(item, {referenceKinds:['GOVERNED_METRIC_REFERENCE'], authorities:['METRIC_AUTHORITY','UPSTREAM_METRIC_AUTHORITY']}, 'metricReferences');
  }
  for (const item of input.knowledgeReferences || []) {
    assertReference(item, {referenceKinds:['PUBLISHED_KNOWLEDGE_REFERENCE'], authorities:['KNOWLEDGE_AUTHORITY']}, 'knowledgeReferences');
  }
  const record = {
    objectClass: 'PR_EVIDENCE_PACKAGE',
    packageReference: required(input.packageReference, 'packageReference'),
    rawDataReferences: Object.freeze(structuredClone(input.rawDataReferences || [])),
    realityReferences: Object.freeze(structuredClone(input.realityReferences || [])),
    evidenceReferences: Object.freeze(structuredClone(input.evidenceReferences || [])),
    readoutReferences: Object.freeze(structuredClone(input.readoutReferences || [])),
    metricReferences: Object.freeze(structuredClone(input.metricReferences || [])),
    meaningReferences: Object.freeze(structuredClone(input.meaningReferences || [])),
    knowledgeReferences: Object.freeze(structuredClone(input.knowledgeReferences || [])),
    journeyReferences: Object.freeze(structuredClone(input.journeyReferences || [])),
    unknownReferences: Object.freeze(structuredClone(input.unknownReferences || [])),
    rawDataCountsAsEvidence: false,
    metricCountsAsJudgment: false,
    readoutCountsAsJudgment: false
  };
  record.packageDigest = digestRecord(record, ['packageDigest']);
  return freeze(record);
}

export function createProfessionalObservation(caseContext, evidencePackage, input = {}) {
  const professionalId = caseContext?.professional?.professionalId;
  if (!professionalId) throw new TypeError('Professional Case required.');
  const record = {
    dataType: 'OUTCOME_RECORD',
    outcomeKind: 'PROFESSIONAL_OBSERVATION',
    observationReference: required(input.observationReference, 'observationReference'),
    caseReference: caseContext.caseId,
    professionalId,
    authoredBy: { type: 'HUMAN_PROFESSIONAL', professionalId },
    observation: required(input.observation, 'observation'),
    evidencePackageReference: evidencePackage.packageReference,
    evidencePackageDigest: evidencePackage.packageDigest,
    systemReadoutReferences: Object.freeze(evidencePackage.readoutReferences.map(item => item.reference)),
    systemReadoutModified: false,
    professionalJudgmentCreated: false,
    createdAt: iso(input.createdAt, 'createdAt')
  };
  record.observationDigest = digestRecord(record, ['observationDigest']);
  return freeze(record);
}

export function createProfessionalJudgment(caseContext, evidencePackage, observation, capabilityBoundary, input = {}) {
  const professionalId = caseContext?.professional?.professionalId;
  if (input.aiAttribution === true || input.providerAttribution === true) throw new TypeError('Professional Judgment must be human Professional attributable.');
  if (observation?.outcomeKind !== 'PROFESSIONAL_OBSERVATION') throw new TypeError('Professional Observation required.');
  if (capabilityBoundary?.decision !== 'PROFESSIONAL_CAPABILITY_BOUNDARY_SATISFIED') throw new TypeError('Professional capability boundary required.');
  const limitations = unique(input.limitations, 'limitations');
  const scope = unique(input.scope, 'scope');
  if (scope.some(item => !caseContext.scope.includes(item))) throw new TypeError('Judgment exceeds case scope.');
  const record = {
    dataType: 'PROFESSIONAL_JUDGMENT_RECORD',
    judgmentReference: required(input.judgmentReference, 'judgmentReference'),
    caseReference: caseContext.caseId,
    professionalId,
    authoredBy: { type: 'HUMAN_PROFESSIONAL', professionalId },
    judgment: required(input.judgment, 'judgment'),
    scope,
    evidencePackageReference: evidencePackage.packageReference,
    evidencePackageDigest: evidencePackage.packageDigest,
    observationReference: observation.observationReference,
    observationDigest: observation.observationDigest,
    capabilityReferences: capabilityBoundary.capabilityReferences,
    credentialReferences: capabilityBoundary.credentialReferences,
    limitations,
    readoutCreated: false,
    metricCreated: false,
    createdAt: iso(input.createdAt, 'createdAt')
  };
  record.judgmentDigest = digestRecord(record, ['judgmentDigest']);
  return freeze(record);
}

export function createProfessionalRecommendation(caseContext, evidencePackage, judgment, capabilityBoundary, input = {}) {
  if (judgment?.dataType !== 'PROFESSIONAL_JUDGMENT_RECORD') throw new TypeError('Professional Judgment required.');
  const scope = unique(input.scope, 'scope');
  if (scope.some(item => !caseContext.scope.includes(item) || !judgment.scope.includes(item))) throw new TypeError('Recommendation exceeds Judgment or Case scope.');
  const limitations = unique(input.limitations, 'limitations');
  const evidenceReferences = unique(input.evidenceReferences || evidencePackage.evidenceReferences.map(item => item.reference), 'evidenceReferences');
  const record = {
    dataType: 'OUTCOME_RECORD',
    outcomeKind: 'PROFESSIONAL_RECOMMENDATION',
    recommendationReference: required(input.recommendationReference, 'recommendationReference'),
    caseReference: caseContext.caseId,
    professionalId: caseContext.professional.professionalId,
    recommendation: required(input.recommendation, 'recommendation'),
    judgmentReference: judgment.judgmentReference,
    judgmentDigest: judgment.judgmentDigest,
    scope,
    capabilityReferences: capabilityBoundary.capabilityReferences,
    credentialReferences: capabilityBoundary.credentialReferences,
    evidenceReferences,
    limitations,
    alternativeReferences: unique(input.alternativeReferences, 'alternativeReferences', {allowEmpty: true}),
    newJudgmentCreated: false,
    metricCreated: false,
    createdAt: iso(input.createdAt, 'createdAt')
  };
  record.recommendationDigest = digestRecord(record, ['recommendationDigest']);
  return freeze(record);
}

export function createProfessionalDecisionPackage(caseContext, observation, judgment, recommendation, input = {}) {
  const boundary = unique(input.boundary, 'boundary');
  const unknown = Object.freeze(structuredClone(Array.isArray(input.unknown) ? input.unknown : []));
  const alternative = Object.freeze(structuredClone(Array.isArray(input.alternative) ? input.alternative : []));
  const auditTrail = [event(null, {
    eventType:'DRAFT_CREATED',
    who:caseContext.professional.professionalId,
    when:input.createdAt,
    whatEvidence:[observation.observationReference, judgment.judgmentReference, recommendation.recommendationReference],
    whatVersion:required(input.version, 'version'),
    whatChanged:'Professional Decision Package created in DRAFT state.'
  })];
  const record = {
    objectClass: 'PR_DECISION_PACKAGE',
    packageReference: required(input.packageReference, 'packageReference'),
    caseReference: caseContext.caseId,
    professionalId: caseContext.professional.professionalId,
    version: required(input.version, 'version'),
    state: 'DRAFT',
    observation: {reference:observation.observationReference,digest:observation.observationDigest},
    judgment: {reference:judgment.judgmentReference,digest:judgment.judgmentDigest},
    recommendation: {reference:recommendation.recommendationReference,digest:recommendation.recommendationDigest},
    unknown, alternative, boundary,
    review: null, approval: null, signature: null, release: null,
    auditTrail: Object.freeze(auditTrail)
  };
  record.packageDigest = digestRecord(record, ['packageDigest']);
  return freeze(record);
}

function transition(packageRecord, expected, next, patch, auditInput) {
  if (packageRecord?.state !== expected) throw new TypeError(`Professional lifecycle requires ${expected} before ${next}.`);
  const ordinal = STATES.indexOf(expected);
  if (STATES[ordinal + 1] !== next) throw new TypeError('Professional lifecycle state skipping is forbidden.');
  const previous = packageRecord.auditTrail.at(-1)?.eventDigest || null;
  const audit = event(previous, auditInput);
  const nextRecord = {
    ...structuredClone(packageRecord),
    ...structuredClone(patch),
    state: next,
    auditTrail: [...packageRecord.auditTrail, audit]
  };
  nextRecord.packageDigest = digestRecord(nextRecord, ['packageDigest']);
  return freeze(nextRecord);
}

export function reviewProfessionalDecision(packageRecord, input = {}) {
  const role = required(input.role, 'role');
  if (!REVIEW_ROLES.has(role)) throw new TypeError('Unsupported Professional review role.');
  const reviewerProfessionalId = required(input.reviewerProfessionalId, 'reviewerProfessionalId');
  if (INDEPENDENT_REVIEW_ROLES.has(role) && reviewerProfessionalId === packageRecord.professionalId) {
    throw new TypeError('Independent Professional reviewer must differ from primary Professional.');
  }
  const outcome = required(input.outcome, 'outcome');
  if (!['PASS','PASS_WITH_LIMITATIONS','CHANGES_REQUIRED','NOT_SUPPORTED'].includes(outcome)) throw new TypeError('Unsupported review outcome.');
  if (!REVIEW_PASS.has(outcome)) throw new TypeError('Review outcome blocks lifecycle advancement.');
  const review = {
    dataType:'OUTCOME_RECORD', outcomeKind:'PROFESSIONAL_REVIEW',
    reviewReference:required(input.reviewReference,'reviewReference'),
    reviewerProfessionalId, role, independent:INDEPENDENT_REVIEW_ROLES.has(role), outcome,
    limitations:unique(input.limitations,'review.limitations',{allowEmpty:true}),
    reviewedPackageDigest:packageRecord.packageDigest,
    reviewedAt:iso(input.reviewedAt,'reviewedAt')
  };
  review.reviewDigest=digestRecord(review,['reviewDigest']);
  return transition(packageRecord,'DRAFT','REVIEWED',{review}, {
    eventType:'REVIEW_COMPLETED',who:reviewerProfessionalId,when:input.reviewedAt,
    whatEvidence:[packageRecord.judgment.reference, packageRecord.recommendation.reference],
    whatVersion:packageRecord.version,whatChanged:`Review completed: ${outcome}.`
  });
}

export function approveProfessionalDecision(packageRecord, input = {}) {
  if (packageRecord?.state !== 'REVIEWED') throw new TypeError('Professional lifecycle requires REVIEWED before APPROVED.');
  const approverProfessionalId=required(input.approverProfessionalId,'approverProfessionalId');
  const approval={
    dataType:'OUTCOME_RECORD',outcomeKind:'PROFESSIONAL_APPROVAL',
    approvalReference:required(input.approvalReference,'approvalReference'),
    approverProfessionalId,decision:'APPROVED',
    approvedPackageDigest:packageRecord.packageDigest,
    approvedAt:iso(input.approvedAt,'approvedAt')
  };
  approval.approvalDigest=digestRecord(approval,['approvalDigest']);
  return transition(packageRecord,'REVIEWED','APPROVED',{approval},{
    eventType:'APPROVED',who:approverProfessionalId,when:input.approvedAt,
    whatEvidence:[packageRecord.review.reviewReference,packageRecord.judgment.reference],
    whatVersion:packageRecord.version,whatChanged:'Professional Decision Package approved.',
    whatApproved:approval.approvalReference
  });
}

export function signProfessionalDecision(packageRecord, input = {}) {
  if (packageRecord?.state !== 'APPROVED') throw new TypeError('Professional lifecycle requires APPROVED before SIGNED.');
  const signerProfessionalId=required(input.signerProfessionalId,'signerProfessionalId');
  const signature={
    dataType:'OUTCOME_RECORD',outcomeKind:'PROFESSIONAL_SIGNATURE',
    signatureReference:required(input.signatureReference,'signatureReference'),
    signerProfessionalId,
    signedPackageDigest:packageRecord.packageDigest,
    signedAt:iso(input.signedAt,'signedAt'),
    attributable:true
  };
  signature.signatureDigest=digestRecord(signature,['signatureDigest']);
  return transition(packageRecord,'APPROVED','SIGNED',{signature},{
    eventType:'SIGNED',who:signerProfessionalId,when:input.signedAt,
    whatEvidence:[packageRecord.approval.approvalReference],
    whatVersion:packageRecord.version,whatChanged:'Professional Decision Package signed.',
    whatApproved:packageRecord.approval.approvalReference
  });
}

export function releaseProfessionalDecision(packageRecord, input = {}) {
  if (packageRecord?.state !== 'SIGNED') throw new TypeError('Professional lifecycle requires SIGNED before RELEASED.');
  const releasedBy=required(input.releasedBy,'releasedBy');
  const release={
    dataType:'OUTCOME_RECORD',outcomeKind:'PROFESSIONAL_RELEASE',
    releaseReference:required(input.releaseReference,'releaseReference'),
    releasedBy, releasedAt:iso(input.releasedAt,'releasedAt'),
    signedPackageDigest:packageRecord.packageDigest,
    reportCreated:false, journeyMutation:false
  };
  release.releaseDigest=digestRecord(release,['releaseDigest']);
  return transition(packageRecord,'SIGNED','RELEASED',{release},{
    eventType:'RELEASED',who:releasedBy,when:input.releasedAt,
    whatEvidence:[packageRecord.signature.signatureReference,packageRecord.approval.approvalReference],
    whatVersion:packageRecord.version,whatChanged:'Professional Decision Package released.',
    whatApproved:packageRecord.approval.approvalReference
  });
}

export function validateProfessionalRuntimeProductionSlice(slice = {}) {
  const requiredStages=['case','evidence','observation','judgment','recommendation','reviewed','approved','signed','released'];
  for (const stage of requiredStages) if (!slice[stage]) throw new TypeError(`Production Slice stage missing: ${stage}.`);
  if (slice.released.state !== 'RELEASED') throw new TypeError('Production Slice must finish RELEASED.');
  if (slice.judgment.dataType !== 'PROFESSIONAL_JUDGMENT_RECORD') throw new TypeError('Production Slice Judgment authority invalid.');
  if (slice.observation.outcomeKind !== 'PROFESSIONAL_OBSERVATION') throw new TypeError('Production Slice Observation invalid.');
  if (slice.recommendation.outcomeKind !== 'PROFESSIONAL_RECOMMENDATION') throw new TypeError('Production Slice Recommendation invalid.');
  return 'VALID_PR_V2_PRODUCTION_SLICE';
}

export const PR_V2_CONSTANTS = Object.freeze({
  OUTCOME_KINDS, STATES,
  professionalJudgmentDataType:'PROFESSIONAL_JUDGMENT_RECORD',
  professionalOutcomeDataType:'OUTCOME_RECORD'
});
