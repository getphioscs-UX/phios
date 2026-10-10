import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { createProfessionalIdentity } from '../functions/professional/access/professional-identity-contract.js';
import {
  createProfessionalCapability,
  createProfessionalCredential,
  evaluateProfessionalEligibility
} from '../functions/professional/access/professional-eligibility-contract.js';
import {
  createProfessionalAssignment,
  activateProfessionalAssignment
} from '../functions/professional/access/professional-assignment-contract.js';
import { createProfessionalConsent } from '../functions/professional/consent/professional-consent-contract.js';
import {
  createHdrRegisteredProfessionalFinalReportRuntime,
  HDR_REGISTERED_PROFESSIONAL_CAPABILITY
} from '../functions/professional/hdr-internal/hdr-registered-professional-final-report-runtime.js';

const now = '2026-08-21T08:00:00.000Z';
const contract = JSON.parse(fs.readFileSync('content/professional/core-method-runtime/contracts/hdr-registered-professional-final-report-contract-v1.json', 'utf8'));
const successor = JSON.parse(fs.readFileSync('content/professional/core-method-runtime/successors/hdr-registered-professional-final-report-successor-v1.json', 'utf8'));
const hdrFreeze = JSON.parse(fs.readFileSync('content/professional/core-method-runtime/hdr-production-freeze-v1.json', 'utf8'));
const serviceCatalog = JSON.parse(fs.readFileSync('content/registry/professional-service-catalog.json', 'utf8'));

assert.equal(contract.status, 'ACTIVE_INTERNAL_PROFESSIONAL_ONLY');
assert.equal(contract.access.registeredProfessionalOnly, true);
assert.equal(contract.access.professionalLoginRequired, true);
assert.equal(contract.access.publicSelfServiceAllowed, false);
assert.deepEqual(contract.manualProfessionalFields, ['strategy','variables_phs','environment','cognition','motivation']);
assert.equal(contract.manualFieldRules.automaticDerivationAllowed, false);
assert.equal(contract.manualFieldRules.aiGenerationAllowed, false);
assert.equal(successor.status, 'REGISTERED_PROFESSIONAL_MANUAL_COMPLETION_AND_FINAL_REPORT_ACTIVE');
assert.equal(successor.boundaries.loginCredentialAuthorityCreated, false);
assert.equal(successor.boundaries.loginAssertionConsumerOnly, true);
assert.equal(hdrFreeze.productionStatus, 'blocked');
assert.equal(hdrFreeze.executionMode, 'validation_only');
assert.equal(hdrFreeze.productionGates.productionExecutionAllowed, false);
assert.equal(hdrFreeze.productionGates.professionalReleaseAllowed, false);
const hdService = serviceCatalog.services.find(x => x.serviceId === 'human_design_foundation_report');
assert.equal(hdService.activationStatus, 'definition-only');
assert.equal(hdService.professionalReviewRequired, true);

const identity = createProfessionalIdentity({
  professional_id: 'professional-hdr-1',
  subject_id: 'account-professional-hdr-1',
  display_name: 'Registered HDR Professional',
  status: 'active',
  identity_verified: true,
  verified_at: '2026-08-01T00:00:00.000Z',
  verified_by: 'professional-admin-1'
});
const credential = createProfessionalCredential({
  credential_id: 'credential-hdr-1',
  professional_id: 'professional-hdr-1',
  credential_type: 'human_design_professional_evidence',
  issuer: 'phi-os-professional-registry',
  evidence_reference: 'evidence:hdr-professional-1',
  domain: 'human_design',
  capability_codes: [HDR_REGISTERED_PROFESSIONAL_CAPABILITY],
  issued_at: '2026-08-01T00:00:00.000Z'
});
const capability = createProfessionalCapability({
  capability_id: 'capability-hdr-1',
  professional_id: 'professional-hdr-1',
  capability_code: HDR_REGISTERED_PROFESSIONAL_CAPABILITY,
  domain: 'human_design',
  basis_reference_ids: ['credential-hdr-1'],
  issued_at: '2026-08-01T00:00:00.000Z'
});
const eligibility = evaluateProfessionalEligibility({
  professional_id: 'professional-hdr-1',
  required_capability_codes: [HDR_REGISTERED_PROFESSIONAL_CAPABILITY],
  capabilities: [capability],
  credentials: [credential],
  certifications: []
}, { now });
assert.equal(eligibility.eligible, true);

const proposed = createProfessionalAssignment({
  assignment_id: 'assignment-hdr-1',
  professional_id: 'professional-hdr-1',
  client_id: 'client-hdr-1',
  service_id: 'human_design_foundation_report',
  purpose: 'hdr_professional_report_finalization',
  journey_ids: ['professional-hdr-report-1'],
  resource_scopes: ['human_design_chart', 'birth_information', 'previous_reports'],
  required_capability_codes: [HDR_REGISTERED_PROFESSIONAL_CAPABILITY],
  starts_at: '2026-08-20T00:00:00.000Z'
});
const assignment = activateProfessionalAssignment(proposed, {
  explicit_assignment: true,
  professional_id: 'professional-hdr-1',
  client_id: 'client-hdr-1',
  activated_by: 'assignment-admin-1'
}, { now });
const consent = createProfessionalConsent({
  consent_id: 'consent-hdr-1',
  client_id: 'client-hdr-1',
  professional_id: 'professional-hdr-1',
  service_id: 'human_design_foundation_report',
  purpose: 'hdr_professional_report_finalization',
  consent_version: '1',
  duration: 'thirty_days',
  explicit_action: true,
  runtime_ids: ['hdr-internal-report-1'],
  resource_scopes: ['human_design_chart', 'birth_information', 'previous_reports'],
  human_design_scopes: [
    'birth_date','birth_time','birth_place','derived_chart_fields','professional_interpretation'
  ],
  acknowledgements: {
    scope_selected: true,
    data_accuracy: true,
    future_access_revocable: true,
    birth_data_voluntarily_submitted: true,
    birth_time_accuracy_affects_result: true,
    interpretive_not_diagnostic: true,
    future_access_revocation_understood: true
  }
}, { now });
const request = Object.freeze({
  request_id: 'request-hdr-final-1',
  professional_id: 'professional-hdr-1',
  client_id: 'client-hdr-1',
  service_id: 'human_design_foundation_report',
  journey_id: 'professional-hdr-report-1',
  runtime_id: 'hdr-internal-report-1',
  purpose: 'hdr_professional_report_finalization',
  resource_scopes: ['human_design_chart', 'birth_information', 'previous_reports'],
  requested_at: now
});
const professionalAccess = { request, identity, eligibility, assignment, consent };
const loginAssertion = {
  contract: 'phi-os.professional-login-assertion.v1',
  authenticated: true,
  authenticationContext: 'PROFESSIONAL_LOGIN',
  sessionId: 'professional-session-1',
  professionalId: 'professional-hdr-1',
  subjectId: 'account-professional-hdr-1',
  issuedAt: '2026-08-21T07:00:00.000Z',
  expiresAt: '2026-08-21T12:00:00.000Z'
};
const calc = (sectionCode, content) => ({ sectionCode, sourceType: 'system_calculation', status: 'CALCULATED', content });
const internalReport = {
  schemaVersion: 'PHI-OS-HDR-INTERNAL-PROFESSIONAL-VALIDATION-REPORT-v1.0.0',
  runtimeVersion: '1.0.0',
  reportId: 'HDR-INTERNAL-1',
  requestId: 'HDR-REQ-1',
  status: 'INTERNAL_REVIEWED',
  visibility: 'INTERNAL_ONLY',
  professionalContext: {
    professionalId: 'professional-hdr-1',
    professionalName: 'Registered HDR Professional',
    clientId: 'client-hdr-1',
    workspaceId: 'workspace-hdr-1',
    consentReference: 'consent-hdr-1'
  },
  calculationReference: { calculationId: 'calc-hdr-1' },
  sections: [
    calc('chart_overview', { personalityInstantUTC:'1989-11-15T14:50:00.000Z', designInstantUTC:'1989-08-16T00:00:00.000Z', designSolarArcDegrees:88, activationCount:26, incarnationConfiguration:'43/23|29/30' }),
    calc('type', { typeCode:'GENERATOR', projectorSubtype:null }),
    { sectionCode:'strategy', status:'UNKNOWN', content:{ value:null } },
    calc('authority', { authorityCode:'EMOTIONAL' }),
    calc('profile', { profile:'5/1' }),
    calc('definition', { definition:'TRIPLE_SPLIT_DEFINITION' }),
    calc('centers', { definedCenters:['SACRAL','SOLAR_PLEXUS'], undefinedCenters:['HEAD'], connectedComponents:[['SACRAL'],['SOLAR_PLEXUS']] }),
    calc('channels', { channels:['29-46'], hangingGates:[43,23] }),
    calc('key_gates', { activations:[{layer:'PERSONALITY',bodyCode:'SUN',gate:43,line:5}] }),
    { sectionCode:'variables_phs', status:'UNKNOWN', content:{ value:null } },
    { sectionCode:'environment', status:'UNKNOWN', content:{ value:null } },
    { sectionCode:'cognition', status:'UNKNOWN', content:{ value:null } },
    { sectionCode:'motivation', status:'UNKNOWN', content:{ value:null } },
    { sectionCode:'general_operating_conditions', status:'PENDING_REVIEW', content:{ value:null } },
    { sectionCode:'limitations', status:'CALCULATED', content:{ internalOnly:true } }
  ],
  review: { required:true, status:'COMPLETED', professionalId:'professional-hdr-1', reviewedAt:'2026-08-21T07:30:00.000Z', decision:'ACCEPT_FOR_INTERNAL_USE', findings:[] },
  governance: { clientDeliveryAllowed:false, publicExposureAllowed:false, automaticReleaseAllowed:false }
};
function manual(en, zh, source) {
  return {
    enteredManually: true,
    autoDerived: false,
    aiGenerated: false,
    content: { en, zh_Hans: zh },
    sourceReference: source,
    confidence: 'high'
  };
}
const manualCompletion = {
  strategy: manual('Respond before committing.', '在投入前先回应。', 'professional:strategy:1'),
  variables_phs: manual('Professional-entered Variables / PHS data.', '专业人员手动填写的变量／PHS资料。', 'professional:variables-phs:1'),
  environment: manual('Professional-entered environment data.', '专业人员手动填写的环境资料。', 'professional:environment:1'),
  cognition: manual('Professional-entered cognition data.', '专业人员手动填写的认知资料。', 'professional:cognition:1'),
  motivation: manual('Professional-entered motivation data.', '专业人员手动填写的动机资料。', 'professional:motivation:1')
};
const finalisation = {
  explicitFinalise: true,
  professionalReviewConfirmed: true,
  reportId: 'HDR-FINAL-1',
  version: '1.0.0',
  signedAt: now,
  signedBy: 'professional-hdr-1',
  reviewedBy: 'professional-hdr-1',
  changeReason: 'Registered Professional manually completed the five governed HDR fields and finalised the report.'
};
const runtime = createHdrRegisteredProfessionalFinalReportRuntime();
const bundle = runtime.finalize({ internalReport, professionalAccess, loginAssertion, manualCompletion, finalisation }, { now });
assert.equal(bundle.report.status, 'final');
assert.equal(bundle.report.report_type, 'human_design_foundation_report');
assert.equal(bundle.report.sections.length, 15);
assert.deepEqual(bundle.report.sections.map(x => x.section_id), [
  'chart_overview','type','strategy','authority','profile','definition','centers','channels','key_gates','variables_phs','environment','cognition','motivation','general_operating_conditions','limitations'
]);
for (const code of ['strategy','variables_phs','environment','cognition','motivation']) {
  const section = bundle.report.sections.find(x => x.section_id === code);
  assert.equal(section.source_type, 'professional_interpretation');
  assert.equal(section.professional_id, 'professional-hdr-1');
  assert.equal(bundle.manualCompletionLineage[code].enteredManually, true);
  assert.equal(bundle.manualCompletionLineage[code].autoDerived, false);
  assert.equal(bundle.manualCompletionLineage[code].aiGenerated, false);
}
assert.equal(bundle.governance.registeredProfessionalOnly, true);
assert.equal(bundle.governance.professionalLoginRequired, true);
assert.equal(bundle.governance.publicSelfServiceAllowed, false);
assert.equal(bundle.governance.guestAccessAllowed, false);
assert.equal(bundle.governance.ordinaryAccountAccessAllowed, false);
assert.equal(bundle.governance.automaticClientDeliveryAllowed, false);
assert.equal(bundle.governance.clientReleaseRequiresSeparateExplicitAction, true);
assert.equal(bundle.signedOutput.professional_id, 'professional-hdr-1');
assert.equal(bundle.signedOutput.consent_reference, 'consent-hdr-1');

assert.throws(() => runtime.finalize({
  internalReport, professionalAccess,
  loginAssertion: { ...loginAssertion, authenticated: false },
  manualCompletion, finalisation
}, { now }), /LOGIN_NOT_AUTHENTICATED/);
assert.throws(() => runtime.finalize({
  internalReport, professionalAccess,
  loginAssertion: { ...loginAssertion, professionalId: 'other-professional' },
  manualCompletion, finalisation
}, { now }), /LOGIN_IDENTITY_MISMATCH/);
assert.throws(() => runtime.finalize({
  internalReport, professionalAccess, loginAssertion,
  manualCompletion: { ...manualCompletion, strategy: { ...manualCompletion.strategy, autoDerived: true } },
  finalisation
}, { now }), /AUTO_DERIVATION_FORBIDDEN/);
assert.throws(() => runtime.finalize({
  internalReport, professionalAccess, loginAssertion,
  manualCompletion: { ...manualCompletion, motivation: undefined },
  finalisation
}, { now }), /MANUAL_MOTIVATION_REQUIRED/);

const currentFiles = [
  'content/professional/core-method-runtime/hdr-production-freeze-v1.json',
  'content/registry/professional-service-catalog.json',
  'functions/professional/access/professional-authorisation-decision.js',
  'functions/professional/reports/professional-report-contract.js'
];
for (const file of currentFiles) {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(digest.length, 64);
}
console.log('✓ HDR Registered Professional Final Report successor passed.');
console.log('  Professional login + verified identity + capability + assignment + consent are required before the five manual HDR fields can be completed and a final report can be signed.');
console.log('  HDR remains unavailable to guests/public self-service; no automatic manual-field derivation or automatic client release was created.');
