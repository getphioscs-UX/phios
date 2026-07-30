import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createProfessionalConsent
} from '../functions/professional/consent/professional-consent-contract.js';
import {
  createProfessionalIdentity
} from '../functions/professional/access/professional-identity-contract.js';
import {
  createProfessionalCapability,
  createProfessionalCredential,
  createProfessionalCertification,
  evaluateProfessionalEligibility
} from '../functions/professional/access/professional-eligibility-contract.js';
import {
  createProfessionalAssignment,
  activateProfessionalAssignment
} from '../functions/professional/access/professional-assignment-contract.js';
import {
  evaluateProfessionalAuthorisation,
  PROFESSIONAL_ACCESS_DENIAL_REASONS
} from '../functions/professional/access/professional-authorisation-decision.js';
import {
  loadAuthorisedProfessionalWorkspace,
  ProfessionalAuthorisationError
} from '../functions/professional/access/authorised-professional-data-loader.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const hash = source => crypto.createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const now = '2026-07-30T08:00:00.000Z';

const identity = createProfessionalIdentity({
  professional_id: 'professional-1',
  subject_id: 'account-1',
  display_name: 'Professional One',
  status: 'active',
  identity_verified: true,
  verified_at: '2026-07-01T00:00:00.000Z',
  verified_by: 'identity-admin-1'
});
assert.equal(identity.authentication_secret_embedded, false);
assert.equal(identity.user_wide_access, false);

const credential = createProfessionalCredential({
  credential_id: 'credential-1',
  professional_id: 'professional-1',
  credential_type: 'experience_evidence',
  issuer: 'organization-1',
  evidence_reference: 'evidence:credential-1',
  domain: 'reality_navigation',
  capability_codes: ['runtime_review'],
  issued_at: '2026-07-01T00:00:00.000Z'
});
const certification = createProfessionalCertification({
  certification_id: 'certification-1',
  professional_id: 'professional-1',
  certification_code: 'phi-os-runtime-review',
  issuer: 'organization-1',
  verification_reference: 'verification:certification-1',
  domain: 'reality_navigation',
  capability_codes: ['runtime_review'],
  issued_at: '2026-07-01T00:00:00.000Z'
});
const capability = createProfessionalCapability({
  capability_id: 'capability-1',
  professional_id: 'professional-1',
  capability_code: 'runtime_review',
  domain: 'reality_navigation',
  basis_reference_ids: ['credential-1', 'certification-1'],
  issued_at: '2026-07-01T00:00:00.000Z'
});
assert.equal(credential.grants_workspace_access, false);
assert.equal(certification.grants_workspace_access, false);
assert.equal(capability.runtime_capability, false);

const eligibility = evaluateProfessionalEligibility({
  professional_id: 'professional-1',
  required_capability_codes: ['runtime_review'],
  capabilities: [capability],
  credentials: [credential],
  certifications: [certification]
}, { now });
assert.equal(eligibility.eligible, true);
assert.equal(eligibility.capability_is_permission, false);

const proposedAssignment = createProfessionalAssignment({
  assignment_id: 'assignment-1',
  professional_id: 'professional-1',
  client_id: 'client-1',
  service_id: 'service-1',
  purpose: 'professional_runtime_review',
  journey_ids: ['journey-1'],
  resource_scopes: ['entry', 'reading'],
  required_capability_codes: ['runtime_review'],
  starts_at: '2026-07-30T00:00:00.000Z'
});
assert.equal(proposedAssignment.payment_created_assignment, false);
assert.equal(proposedAssignment.entitlement_created_assignment, false);
const assignment = activateProfessionalAssignment(proposedAssignment, {
  explicit_assignment: true,
  professional_id: 'professional-1',
  client_id: 'client-1',
  activated_by: 'assignment-admin-1'
}, { now });

const consent = createProfessionalConsent({
  consent_id: 'consent-1',
  client_id: 'client-1',
  professional_id: 'professional-1',
  service_id: 'service-1',
  purpose: 'professional_runtime_review',
  consent_version: '1',
  duration: 'thirty_days',
  explicit_action: true,
  runtime_ids: ['runtime-1'],
  resource_scopes: ['entry', 'reading'],
  acknowledgements: {
    scope_selected: true,
    data_accuracy: true,
    future_access_revocable: true
  }
}, { now });

const request = Object.freeze({
  request_id: 'request-1',
  professional_id: 'professional-1',
  client_id: 'client-1',
  service_id: 'service-1',
  journey_id: 'journey-1',
  runtime_id: 'runtime-1',
  purpose: 'professional_runtime_review',
  resource_scopes: ['entry', 'reading'],
  requested_at: now
});
const decision = evaluateProfessionalAuthorisation({
  request,
  identity,
  eligibility,
  assignment,
  consent
}, { now });
assert.equal(decision.allowed, true);
assert.deepEqual(decision.permission_order, [
  'request',
  'identity',
  'eligibility',
  'assignment',
  'consent',
  'purpose',
  'scope'
]);
assert.equal(decision.payment_is_permission, false);
assert.equal(decision.entitlement_is_permission, false);
assert.equal(decision.provider_output_is_permission, false);

let authorisedReads = 0;
const loaded = await loadAuthorisedProfessionalWorkspace({
  request,
  identity,
  eligibility,
  assignment,
  consent,
  read_authorised_resources: async selectors => {
    authorisedReads += 1;
    assert.deepEqual(selectors.resource_scopes, ['entry', 'reading']);
    return {
      client: { client_id: 'client-1', display_name: 'Client One' },
      journey: { journey_id: 'journey-1', runtime_id: 'runtime-1' },
      resources: {
        entry: [{ record_id: 'entry-record-1' }],
        reading: [{ record_id: 'reading-record-1' }],
        navigation: [{ record_id: 'must-not-leak' }]
      }
    };
  }
}, { now, audit_id: 'audit-1' });
assert.equal(authorisedReads, 1);
assert.equal(loaded.read_performed_after_authorisation, true);
assert.equal(loaded.workspace.read_only, true);
assert.equal(loaded.workspace.runtime_mutation_allowed, false);
assert.equal(loaded.workspace.evidence_promotion_allowed, false);
assert.equal(loaded.workspace.automatic_signing_allowed, false);
assert.equal(Object.isFrozen(loaded.workspace.resources.entry), true);
assert.equal(
  Object.hasOwn(loaded.workspace.resources, 'navigation'),
  false
);
assert.equal(loaded.audit.contains_customer_payload, false);
assert.equal(Object.hasOwn(loaded.audit, 'payload'), false);
assert.equal(Object.hasOwn(loaded.audit, 'resources'), false);

let deniedReads = 0;
await assert.rejects(
  () => loadAuthorisedProfessionalWorkspace({
    request: { ...request, purpose: 'different_purpose' },
    identity,
    eligibility,
    assignment,
    consent,
    read_authorised_resources: async () => {
      deniedReads += 1;
      return {};
    }
  }, { now }),
  error => {
    assert.equal(error instanceof ProfessionalAuthorisationError, true);
    assert.equal(error.decision.allowed, false);
    assert.equal(
      error.decision.denial_reasons.some(
        reason => reason.code === 'assignment_purpose_denied'
      ),
      true
    );
    assert.equal(
      error.decision.denial_reasons.some(
        reason => reason.code === 'consent_purpose_denied'
      ),
      true
    );
    assert.equal(error.audit.contains_customer_payload, false);
    return true;
  }
);
assert.equal(deniedReads, 0);

assert.throws(
  () => createProfessionalAssignment({
    assignment_id: 'assignment-wildcard',
    professional_id: 'professional-1',
    client_id: 'client-1',
    service_id: 'service-1',
    purpose: 'professional_runtime_review',
    journey_ids: ['*'],
    resource_scopes: ['entry'],
    required_capability_codes: ['runtime_review']
  }, { now }),
  /explicit values/
);
for (const code of [
  'professional_identity_unverified',
  'professional_eligibility_denied',
  'assignment_inactive',
  'assignment_scope_denied',
  'consent_invalid',
  'consent_purpose_denied',
  'consent_scope_denied'
]) assert.equal(
  PROFESSIONAL_ACCESS_DENIAL_REASONS.includes(code),
  true,
  `Missing denial reason: ${code}`
);

const registryIndex = JSON.parse(await read('content/registry/index.json'));
const runtimeContracts = JSON.parse(
  await read('content/registry/runtime-contracts.json')
);
const migrations = JSON.parse(
  await read('content/registry/runtime-migrations.json')
);
assert.equal(Object.keys(registryIndex.registries).length, 48);
assert.equal(runtimeContracts.contracts.length, 20);
assert(migrations.migrations.length >= 4);
assert.deepEqual(
  migrations.migrations.slice(0, 4).map(item => item.version),
  [1, 2, 3, 4]
);

for (const file of [
  'docs/pws/audit/pws-object-conflict-matrix.md',
  'docs/pws/audit/pws-state-conflict-matrix.md',
  'docs/pws/audit/pws-api-conflict-matrix.md',
  'docs/pws/audit/pws-pja-duplication-map.md',
  'docs/pws/audit/pws-canonical-source-decision.md'
]) {
  const audit = await read(file);
  for (const field of [
    'conflictId',
    'affectedObject',
    'currentPaths',
    'proposedCanonicalPath',
    'legacyHandling',
    'migrationNeed',
    'riskLevel',
    'resolutionStage'
  ]) assert.equal(
    audit.includes(field),
    true,
    `${file} is missing conflict field: ${field}`
  );
}

for (const [file, expected] of Object.entries({
  'professional-workspace.html':
    'fc4f5fc7260a5b344acd0eb377c200f6c91102419fe66538abf94c537bfb0d14',
  'professional-consent-sharing.html':
    '3dc7c01f2ec214d661a371de4ec4ce732d041b9014e160b11a86fb079dece359',
  'professional-reports.html':
    '9020e828a181e531c028014c715072bc99744b12ff98166f002390a0074c7993',
  'professional-appointments.html':
    'cc4a3d2fda5dd9b6d4cd1651349973ed890d219b0e7ab647b8ebcd8197585572',
  'services.html':
    '79d47c96c79e9947ceaac34b425e8aba2da33506c08349f2fde324b21f24ed25',
  'reality-entry.html':
    '940f4d5821bc63a34a075bf2e0b76cf5f4d7517be014ac44e325f09ad7ce00c3',
  'reality-navigation.html':
    '0d78b63ef0f3f510df2ecf4c4bf114c232af5d6ded337e72cd50114443f4bb05'
})) {
  assert.equal(hash(await read(file)), expected, `Page changed: ${file}`);
}

console.log('✓ PWS-ENTRY-W1 Professional authorisation and loader passed.');
console.log('  Identity → eligibility → Assignment → Consent → purpose → scope.');
console.log('  Denied access performs no read; audit records remain payload-free.');
console.log('  Runtime registries, migrations and public page behavior are frozen.');
