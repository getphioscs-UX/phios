import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CONSENT_DURATION_OPTIONS,
  CONSENT_REVOCATION_SCOPES,
  FINANCIAL_DATA_SCOPES,
  HUMAN_DESIGN_SCOPES,
  PROFESSIONAL_RESOURCE_SCOPES,
  authorizeProfessionalConsentAccess,
  createProfessionalConsent,
  revokeProfessionalConsent,
  validateProfessionalConsent
} from '../functions/professional/consent/professional-consent-contract.js';
import {
  JOINT_HOUSEHOLD_ROLES,
  authorizeHouseholdFinancialAccess,
  createHouseholdParticipantConsent
} from '../functions/professional/consent/joint-household-consent.js';
import {
  PROFESSIONAL_ACCESS_ACTIONS,
  createProfessionalAccessEvent
} from '../functions/professional/consent/professional-access-event-contract.js';

const root = process.cwd();
const now = '2026-07-23T12:30:00.000Z';

function normalizeText(source) {
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

async function read(relativePath) {
  return normalizeText(
    await fs.readFile(path.join(root, relativePath), 'utf8')
  );
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function sha256(relativePath) {
  return crypto
    .createHash('sha256')
    .update(await read(relativePath), 'utf8')
    .digest('hex');
}

const requiredFiles = [
  'content/registry/professional-consent-sharing.json',
  'content/registry/m4a-w3-consent-sharing.json',
  'functions/professional/consent/professional-consent-contract.js',
  'functions/professional/consent/joint-household-consent.js',
  'functions/professional/consent/professional-access-event-contract.js',
  'tests/fixtures/m4a-w3-consent-scenarios.json',
  'docs/professional/M4A-W3-CONSENT-AND-SHARING.md',
  'docs/professional/M4A-W3-INSTALL.md'
];
for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M4A-W3 deliverable: ${file}`);
}

const registry = await readJson(
  'content/registry/professional-consent-sharing.json'
);
const milestone = await readJson(
  'content/registry/m4a-w3-consent-sharing.json'
);
const fixtures = await readJson(
  'tests/fixtures/m4a-w3-consent-scenarios.json'
);
const registryIndex = await readJson('content/registry/index.json');

assert.equal(
  fixtures.schemaVersion,
  'phi-os.m4a-w3-consent-scenarios.v1'
);
assert.equal(fixtures.scenarios.length, 9);
const fixture = id => fixtures.scenarios.find(item => item.id === id);
assert.ok(fixture('runtime-explicit-scope'));
assert.ok(fixture('financial-selected-scope'));
assert.ok(fixture('human-design-specific-scope'));
assert.ok(fixture('joint-household-separate-adults'));

assert.deepEqual(registry.resourceScopes, [...PROFESSIONAL_RESOURCE_SCOPES]);
assert.deepEqual(registry.financialDataScopes, [...FINANCIAL_DATA_SCOPES]);
assert.deepEqual(registry.humanDesignScopes, [...HUMAN_DESIGN_SCOPES]);
assert.deepEqual(registry.durationOptions, [...CONSENT_DURATION_OPTIONS]);
assert.deepEqual(
  registry.revocationScopes,
  [...CONSENT_REVOCATION_SCOPES]
);
assert.deepEqual(registry.jointHouseholdRoles, [...JOINT_HOUSEHOLD_ROLES]);
assert.equal(registry.defaultPolicy.allScopesGrantedByDefault, false);
assert.equal(registry.defaultPolicy.wildcardScopeAllowed, false);
assert.equal(registry.defaultPolicy.consentAuthorisesRetention, false);
assert.equal(registry.defaultPolicy.consentAuthorisesRegulatedAdvice, false);
assert.equal(registry.jointHouseholdRules.separateAdultConsentRequired, true);
assert.equal(registry.jointHouseholdRules.oneSpouseMayAuthoriseOtherAdult, false);
for (const value of Object.values(registry.implementationBoundary)) {
  assert.equal(value, false);
}

const runtimeScenario = fixture('runtime-explicit-scope');
const runtimeConsent = createProfessionalConsent({
  ...runtimeScenario.input,
  acknowledgements: fixtures.generalAcknowledgements
}, { now });
assert.equal(validateProfessionalConsent(runtimeConsent, { now }).valid, true);
assert.equal(runtimeConsent.expires_at, '2026-07-30T12:30:00.000Z');
assert.deepEqual(runtimeConsent.financial_data_scopes, []);
assert.deepEqual(runtimeConsent.human_design_scopes, []);
assert.equal(runtimeConsent.guardrails.retention_authorised, false);
assert.equal(runtimeConsent.guardrails.regulated_advice_authorised, false);

const runtimeAccess = authorizeProfessionalConsentAccess(
  runtimeConsent,
  {
    category: 'runtime',
    scope: 'entry',
    runtime_id: 'runtime_test_1',
    professional_id: 'professional_test_1'
  },
  { now }
);
assert.equal(runtimeAccess.allowed, true);
assert.equal(runtimeAccess.user_wide_access, false);
assert.equal(runtimeAccess.raw_account_access, false);
assert.equal(runtimeAccess.retention_authorised, false);
assert.equal(runtimeAccess.regulated_advice_authorised, false);
assert.throws(
  () => authorizeProfessionalConsentAccess(runtimeConsent, {
    category: 'runtime',
    scope: 'navigation',
    runtime_id: 'runtime_test_1',
    professional_id: 'professional_test_1'
  }, { now }),
  /outside consent scope/
);
assert.throws(
  () => authorizeProfessionalConsentAccess(runtimeConsent, {
    category: 'runtime',
    scope: 'entry',
    runtime_id: 'runtime_not_granted',
    professional_id: 'professional_test_1'
  }, { now }),
  /explicitly granted Runtime IDs/
);

const financialScenario = fixture('financial-selected-scope');
const financialConsent = createProfessionalConsent({
  ...financialScenario.input,
  acknowledgements: fixtures.financialAcknowledgements
}, { now });
assert.equal(financialConsent.resource_scopes.length, 0);
assert.equal(financialConsent.expires_at, '2026-08-22T12:30:00.000Z');
assert.equal(authorizeProfessionalConsentAccess(
  financialConsent,
  {
    category: 'financial',
    scope: 'income',
    professional_id: 'professional_test_1'
  },
  { now }
).allowed, true);
assert.throws(
  () => authorizeProfessionalConsentAccess(financialConsent, {
    category: 'financial',
    scope: 'bank_balances',
    professional_id: 'professional_test_1'
  }, { now }),
  /outside consent scope/
);
assert.throws(
  () => createProfessionalConsent({
    ...financialScenario.input,
    acknowledgements: {
      ...fixtures.financialAcknowledgements,
      client_retains_final_decision: false
    }
  }, { now }),
  /Recommendation acknowledgement is required/
);

const humanDesignScenario = fixture('human-design-specific-scope');
const humanDesignConsent = createProfessionalConsent({
  ...humanDesignScenario.input,
  acknowledgements: fixtures.humanDesignAcknowledgements
}, { now });
assert.equal(authorizeProfessionalConsentAccess(
  humanDesignConsent,
  {
    category: 'human_design',
    scope: 'birth_time',
    professional_id: 'professional_test_2'
  },
  { now }
).allowed, true);
assert.throws(
  () => createProfessionalConsent({
    ...humanDesignScenario.input,
    acknowledgements: {
      ...fixtures.humanDesignAcknowledgements,
      interpretive_not_diagnostic: false
    }
  }, { now }),
  /Human Design acknowledgement is required/
);
const missingUmbrella = createProfessionalConsent({
  ...humanDesignScenario.input,
  consent_id: 'consent_human_design_missing_umbrella',
  resource_scopes: [],
  human_design_scopes: ['birth_time'],
  acknowledgements: fixtures.humanDesignAcknowledgements
}, { now });
assert.throws(
  () => authorizeProfessionalConsentAccess(missingUmbrella, {
    category: 'human_design',
    scope: 'birth_time',
    professional_id: 'professional_test_2'
  }, { now }),
  /umbrella consent is required/
);

assert.throws(
  () => createProfessionalConsent({
    ...runtimeScenario.input,
    consent_id: 'consent_no_explicit_action',
    explicit_action: false,
    acknowledgements: fixtures.generalAcknowledgements
  }, { now }),
  /explicit user action/
);
assert.throws(
  () => createProfessionalConsent({
    ...runtimeScenario.input,
    consent_id: 'consent_empty_scope',
    resource_scopes: [],
    runtime_ids: [],
    acknowledgements: fixtures.generalAcknowledgements
  }, { now }),
  /At least one explicit consent scope/
);
assert.throws(
  () => createProfessionalConsent({
    ...runtimeScenario.input,
    consent_id: 'consent_wildcard_resource',
    resource_scopes: ['*'],
    acknowledgements: fixtures.generalAcknowledgements
  }, { now }),
  /unsupported scope/
);
assert.throws(
  () => createProfessionalConsent({
    ...runtimeScenario.input,
    consent_id: 'consent_wildcard_runtime',
    runtime_ids: ['*'],
    acknowledgements: fixtures.generalAcknowledgements
  }, { now }),
  /unsupported scope/
);

const oneTimeScenario = fixture('one-time-consent');
const oneTime = createProfessionalConsent({
  ...oneTimeScenario.input,
  acknowledgements: fixtures.generalAcknowledgements
}, { now });
assert.equal(validateProfessionalConsent(oneTime, { now }).active, true);
assert.equal(validateProfessionalConsent({
  ...oneTime,
  access_count: 1
}, { now }).active, false);

const untilCompletionScenario = fixture('until-service-completion');
const untilCompletion = createProfessionalConsent({
  ...untilCompletionScenario.input,
  acknowledgements: fixtures.generalAcknowledgements
}, { now });
assert.equal(
  validateProfessionalConsent(untilCompletion, { now }).active,
  true
);
assert.equal(
  validateProfessionalConsent({
    ...untilCompletion,
    service_status: 'completed'
  }, { now }).active,
  false
);
assert.equal(
  validateProfessionalConsent(runtimeConsent, {
    now: '2026-07-31T00:00:00.000Z'
  }).active,
  false
);
assert.throws(
  () => createProfessionalConsent({
    ...runtimeScenario.input,
    consent_id: 'consent_bad_custom_expiry',
    duration: 'custom_date',
    expires_at: '2026-07-22T00:00:00.000Z',
    acknowledgements: fixtures.generalAcknowledgements
  }, { now }),
  /must be after grant time/
);

const combinedConsent = createProfessionalConsent({
  ...runtimeScenario.input,
  consent_id: 'consent_combined_1',
  financial_data_scopes: ['income'],
  acknowledgements: fixtures.financialAcknowledgements
}, { now });
const partialRevocation = revokeProfessionalConsent(
  combinedConsent,
  {
    explicit_action: true,
    revoked_by: 'client_test_1',
    reason: 'Financial scope no longer required',
    revocation_scopes: fixture('partial-revocation').revocationScopes
  },
  { now: '2026-07-24T00:00:00.000Z' }
);
assert.equal(partialRevocation.status, 'granted');
assert.equal(partialRevocation.revoked, false);
assert.equal(partialRevocation.revocation.new_access_stopped, true);
assert.equal(
  partialRevocation.revocation.delivered_report_automatically_deleted,
  false
);
assert.throws(
  () => authorizeProfessionalConsentAccess(partialRevocation, {
    category: 'financial',
    scope: 'income',
    professional_id: 'professional_test_1'
  }, { now: '2026-07-24T00:00:01.000Z' }),
  /revoked/
);
assert.equal(authorizeProfessionalConsentAccess(
  partialRevocation,
  {
    category: 'runtime',
    scope: 'entry',
    runtime_id: 'runtime_test_1',
    professional_id: 'professional_test_1'
  },
  { now: '2026-07-24T00:00:01.000Z' }
).allowed, true);

const fullRevocation = revokeProfessionalConsent(
  runtimeConsent,
  {
    explicit_action: true,
    revoked_by: 'client_test_1',
    reason: 'Service access ended',
    revocation_scopes: fixture('full-revocation').revocationScopes
  },
  { now: '2026-07-24T00:10:00.000Z' }
);
assert.equal(fullRevocation.status, 'revoked');
assert.equal(fullRevocation.revoked, true);
assert.equal(validateProfessionalConsent(fullRevocation, { now }).active, false);

const householdScenario = fixture('joint-household-separate-adults');
const householdConsents = householdScenario.participants.map(input =>
  createHouseholdParticipantConsent(input, { now })
);
assert.equal(authorizeHouseholdFinancialAccess(
  householdConsents,
  {
    data_subject_id: 'subject_main_1',
    scope: 'income'
  }
).allowed, true);
const jointAccess = authorizeHouseholdFinancialAccess(
  householdConsents,
  {
    data_subject_id: 'subject_joint_1',
    scope: 'insurance'
  }
);
assert.equal(jointAccess.allowed, true);
assert.equal(jointAccess.another_adult_consent_inferred, false);
assert.throws(
  () => authorizeHouseholdFinancialAccess(householdConsents, {
    data_subject_id: 'subject_joint_1',
    scope: 'income'
  }),
  /outside that subject consent/
);
assert.throws(
  () => authorizeHouseholdFinancialAccess(
    [householdConsents[0]],
    {
      data_subject_id: 'subject_joint_1',
      scope: 'income'
    }
  ),
  /has not granted active consent/
);
assert.throws(
  () => createHouseholdParticipantConsent({
    participant_id: 'participant_child_1',
    data_subject_id: 'subject_child_1',
    role: 'child',
    is_adult: false,
    explicit_action: true,
    financial_data_scopes: ['education_information']
  }, { now }),
  /guardian authority basis/
);

const accessEventInput = {
  event_id: 'professional_access_event_1',
  professional_id: 'professional_test_1',
  client_id: 'client_test_1',
  resource_type: 'runtime',
  resource_scope: 'reading',
  access_purpose: 'Review selected Runtime Reading',
  access_time: now,
  access_duration: 'seven_days',
  consent_id: 'consent_runtime_1',
  service_id: 'professional_runtime_reading',
  action: 'resource_accessed',
  status: 'allowed',
  raw_payload: 'must not be copied'
};
const accessEvent = createProfessionalAccessEvent(accessEventInput);
assert.equal(accessEvent.audit_only, true);
assert.equal(accessEvent.contains_sensitive_payload, false);
assert.equal(accessEvent.contains_document_content, false);
assert.equal(accessEvent.contains_financial_value, false);
assert.equal(Object.hasOwn(accessEvent, 'raw_payload'), false);
for (const forbiddenField of [
  'birth_date',
  'bank_balance',
  'document_content',
  'financial_value_amount'
]) {
  assert.equal(Object.hasOwn(accessEvent, forbiddenField), false);
}
for (const action of registry.humanDesignAccessActions) {
  assert.equal(PROFESSIONAL_ACCESS_ACTIONS.includes(action), true);
}

assert.equal(
  milestone.status,
  'consent-sharing-contract-ready-next-data-governance'
);
assert.equal(
  milestone.baseline.commit,
  '61fa3d10fc20f54052da59fa3af7beeb6482d1f9'
);
assert.equal(
  milestone.nextWorkPackage,
  'M4A-W7 Professional Data and Privacy'
);
for (const value of Object.values(milestone.completion)) {
  assert.equal(value, true);
}
for (const value of Object.values(milestone.implementationBoundary)) {
  assert.equal(value, false);
}
for (const value of Object.values(milestone.guardrails)) {
  assert.equal(value, false);
}
for (const [file, expectedHash] of Object.entries(
  milestone.frozenArtifacts
)) {
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen pre-W3 artifact changed: ${file}`
  );
}
const migrations = (await fs.readdir(path.join(root, 'db/migrations')))
  .filter(filename => filename.endsWith('.sql'))
  .sort();
assert.deepEqual(migrations, milestone.migrationInventory);

assert.equal(
  registryIndex.registries.professional_consent_sharing,
  './professional-consent-sharing.json'
);
assert.equal(
  registryIndex.registries.m4a_w3_consent_sharing,
  './m4a-w3-consent-sharing.json'
);

const w1 = await readJson(
  'content/registry/m4a-w1-professional-service-definition.json'
);
assert.equal(w1.nextWorkPackage, 'M4A-W3 Consent and Sharing');
const runtimePrivacy = await readJson(
  'content/registry/runtime-security-privacy.json'
);
assert.equal(
  runtimePrivacy.professional_boundary.automatic_account_access,
  false
);
assert.equal(
  runtimePrivacy.professional_boundary.user_wide_grant_allowed,
  false
);
assert.equal(
  runtimePrivacy.professional_boundary.explicit_runtime_ids_required,
  true
);
assert.equal(
  runtimePrivacy.professional_boundary.revocation_supported,
  true
);

const authoredText = (
  await Promise.all(requiredFiles.map(file => read(file)))
).join('\n');
assert.doesNotMatch(
  authoredText,
  /\b\d{6}-?\d{2}-?\d{4}\b/,
  'M4A-W3 must not contain an identity number'
);
assert.doesNotMatch(
  authoredText,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  'M4A-W3 must not contain a client email address'
);
assert.doesNotMatch(
  authoredText,
  /\b\d{10,16}\b/,
  'M4A-W3 must not contain a full account, policy or phone number'
);

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m4a-consent-sharing'],
  'node scripts/check-m4a-consent-sharing.mjs'
);
assert.equal(
  packageJson.scripts.check.includes(
    'node scripts/check-m4a-consent-sharing.mjs'
  ),
  true
);

console.log(
  '✓ M4A-W3 Consent and Sharing passed: explicit scope, duration, revocation, audit, Human Design, Financial Data and Joint Household consent are contract-closed.'
);
console.log(
  '  No wildcard or default grant; one adult cannot authorise another adult, and acknowledgement does not activate retention or regulated advice.'
);
console.log(
  '  Next required gate: M4A-W7 Professional Data and Privacy before W8 infrastructure or W2 Workspace.'
);
