import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import en from '../assets/js/locales/en/free-observation.js';
import zhHans from '../assets/js/locales/zh-Hans/free-observation.js';
import {
  clearAllFreeObservations,
  clearFreeObservation,
  createFreeObservation,
  createFreeObservationUploadConsentDraft,
  FREE_OBSERVATION_MAXIMUM_RECORDS,
  FREE_OBSERVATION_RETENTION_DAYS,
  FREE_OBSERVATION_SCHEMA_VERSION,
  FREE_OBSERVATION_STORAGE_KEY,
  FREE_OBSERVATION_UPLOAD_POLICY,
  loadFreeObservations,
  prepareFreeObservationServerUpload,
  saveFreeObservation
} from '../assets/js/modules/free-observation-local.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const [
  evidence,
  masterGovernance,
  implementationSequence,
  publicNavigationBoundary,
  paymentBoundary,
  pjaBoundary,
  packageJson,
  page,
  pageController,
  localContract,
  styles,
  realityDemo
] = await Promise.all([
  readJson(
    'docs/pws/contracts/' +
    'pws-i8-free-observation-privacy-foundation-v1.json'
  ),
  readJson('content/registry/master-governance.json'),
  readJson('docs/pws/architecture/pws-implementation-sequence-v1.json'),
  readJson(
    'docs/pws/architecture/' +
    'pws-entry-public-navigation-boundary-v1.json'
  ),
  readJson('docs/pws/architecture/pws-entry-payment-boundary-v1.json'),
  readJson('docs/pja/pja-w0-cross-system-boundary-freeze-v1.json'),
  readJson('package.json'),
  read('free-observation.html'),
  read('assets/js/pages/free-observation.js'),
  read('assets/js/modules/free-observation-local.js'),
  read('assets/css/free-observation.css'),
  read('reality-demo.html')
]);

assert.equal(
  evidence.freezeId,
  'PWS-I8-Free-Observation-Privacy-Foundation-v1.0.0-Frozen'
);
assert.equal(evidence.programme, 'PHASE 4 Free Explore Foundation');
assert.equal(evidence.step, 'STEP 4.1');
assert.equal(evidence.sequenceKey, 'PWS-I8-FREE-PRIVACY-FOUNDATION');
assert.equal(evidence.version, '1.0.0');
assert.equal(evidence.status, 'frozen');
assert.deepEqual(evidence.baseline, {
  repository: 'getphioscs-UX/phios',
  branch: 'main',
  commit: '1c59299a64f7ddcd5dd2cbfe4ee56beff5f04d72'
});

const pwsI8Ownership = masterGovernance.writeSourceRule.writeSourceMap
  .find(item => (
    item.objects.includes('Consent') &&
    item.objects.includes('Privacy')
  ));
assert.equal(pwsI8Ownership?.owner, 'PWS-I8');
assert.equal(evidence.ownership.consentOwner, 'PWS-I8');
assert.equal(evidence.ownership.privacyOwner, 'PWS-I8');
assert.equal(evidence.ownership.pageWriteAuthority, 'none');
assert.equal(evidence.ownership.createsSecondSourceOfTruth, false);

const sequenceItem = implementationSequence.sequence.find(
  item => item.sequenceKey === evidence.sequenceKey
);
assert.equal(sequenceItem?.ordinal, 5);
assert.equal(sequenceItem?.label, 'PWS-I8 Free Privacy Foundation');

assert.equal(FREE_OBSERVATION_SCHEMA_VERSION, evidence.localObservation.schemaVersion);
assert.equal(FREE_OBSERVATION_STORAGE_KEY, evidence.localObservation.storageKey);
assert.equal(
  FREE_OBSERVATION_RETENTION_DAYS,
  evidence.localObservation.retentionDays
);
assert.equal(
  FREE_OBSERVATION_MAXIMUM_RECORDS,
  evidence.localObservation.maximumRecords
);
for (const value of [
  evidence.localObservation.anonymous,
  evidence.localObservation.expiredRecordsPruned,
  evidence.localObservation.userCanDeleteOne,
  evidence.localObservation.userCanClearAll
]) {
  assert.equal(value, true);
}
for (const value of [
  evidence.localObservation.identityFieldsStored,
  evidence.localObservation.freeTextAccepted,
  evidence.localObservation.filesAccepted,
  evidence.localObservation.sensitiveDataStored
]) {
  assert.equal(value, false);
}

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

const createdAt = new Date('2035-01-01T00:00:00.000Z');
const observation = createFreeObservation({
  focus: 'change',
  signal: 'new_difference',
  horizon: 'this_week'
}, {
  now: createdAt,
  idFactory: () => 'free_obs_acceptance'
});
assert.deepEqual(Object.keys(observation), [
  'schemaVersion',
  'observationId',
  'createdAt',
  'expiresAt',
  'selection',
  'orientation',
  'boundary'
]);
assert.deepEqual(observation.boundary, {
  anonymous: true,
  storageLocation: 'browser_local_only',
  sensitiveDataStored: false,
  formalJourneyCreated: false,
  formalEvidenceCreated: false,
  professionalQueueEntryCreated: false,
  serverUploadPerformed: false,
  providerInvoked: false
});
assert.throws(
  () => createFreeObservation({
    focus: 'personal_history',
    signal: 'new_difference',
    horizon: 'today'
  }),
  /invalid_free_observation_focus/
);

const storage = memoryStorage();
saveFreeObservation(observation, storage, { now: createdAt });
assert.equal(loadFreeObservations(storage, { now: createdAt }).length, 1);

const tampered = {
  ...observation,
  email: 'must-be-removed@example.invalid',
  personalHistory: 'must be removed',
  orientation: {
    focusKey: 'tampered',
    signalKey: 'tampered',
    nextStepKey: 'tampered'
  }
};
storage.setItem(FREE_OBSERVATION_STORAGE_KEY, JSON.stringify([tampered]));
const normalized = loadFreeObservations(storage, { now: createdAt })[0];
assert.equal('email' in normalized, false);
assert.equal('personalHistory' in normalized, false);
assert.equal(
  normalized.orientation.focusKey,
  'freeObservation.orientation.focus.change'
);

clearFreeObservation(observation.observationId, storage);
assert.equal(loadFreeObservations(storage, { now: createdAt }).length, 0);
saveFreeObservation(observation, storage, { now: createdAt });
clearAllFreeObservations(storage);
assert.equal(loadFreeObservations(storage, { now: createdAt }).length, 0);

const expiredStorage = memoryStorage();
saveFreeObservation(observation, expiredStorage, { now: createdAt });
assert.equal(
  loadFreeObservations(expiredStorage, {
    now: new Date('2035-02-01T00:00:00.000Z')
  }).length,
  0
);

const capacityStorage = memoryStorage();
for (let index = 0; index < FREE_OBSERVATION_MAXIMUM_RECORDS + 3; index += 1) {
  saveFreeObservation(createFreeObservation({
    focus: 'continuity',
    signal: 'repeating_pattern',
    horizon: 'this_month'
  }, {
    now: createdAt,
    idFactory: () => `free_obs_capacity_${index}`
  }), capacityStorage, { now: createdAt });
}
assert.equal(
  loadFreeObservations(capacityStorage, { now: createdAt }).length,
  FREE_OBSERVATION_MAXIMUM_RECORDS
);

assert.equal(FREE_OBSERVATION_UPLOAD_POLICY.serverUploadAvailable, false);
assert.equal(FREE_OBSERVATION_UPLOAD_POLICY.explicitConsentRequired, true);
assert.equal(
  FREE_OBSERVATION_UPLOAD_POLICY.canonicalConsentCreatedByBrowser,
  false
);
assert.throws(
  () => createFreeObservationUploadConsentDraft({
    explicitUserAction: true,
    purposeAcknowledged: true,
    scopeAcknowledged: true,
    retentionAcknowledged: true,
    revocationPathAcknowledged: false
  }),
  /explicit_free_observation_upload_consent_required/
);
const consentDraft = createFreeObservationUploadConsentDraft({
  explicitUserAction: true,
  purposeAcknowledged: true,
  scopeAcknowledged: true,
  retentionAcknowledged: true,
  revocationPathAcknowledged: true
}, { now: createdAt });
assert.equal(consentDraft.status, 'prepared_not_persisted');
assert.equal(consentDraft.canonicalConsentCreated, false);
assert.equal(consentDraft.revocationPathAcknowledged, true);
assert.throws(
  () => prepareFreeObservationServerUpload(observation, consentDraft),
  /free_observation_server_upload_not_available/
);

assert.equal(evidence.serverUpload.available, false);
assert.equal(evidence.serverUpload.fetchPerformed, false);
assert.equal(evidence.serverUpload.endpointCreated, false);
assert.equal(evidence.serverUpload.explicitConsentRequired, true);
assert.equal(evidence.serverUpload.browserDraftCreatesCanonicalConsent, false);
assert.deepEqual(evidence.serverUpload.requirements, [
  'separate_affirmative_action',
  'stated_purpose',
  'exact_field_scope',
  'retention_and_deletion_terms',
  'revocation_path'
]);

for (const value of Object.values(evidence.formalSystemSeparation)) {
  assert.equal(value, false);
}
assert.equal(
  publicNavigationBoundary.freeObservationBoundary.createsFormalJourney,
  false
);
assert.equal(
  publicNavigationBoundary.freeObservationBoundary.createsFormalEvidence,
  false
);
assert.equal(
  publicNavigationBoundary.freeObservationBoundary
    .createsProfessionalResponsibility,
  false
);
assert.equal(
  paymentBoundary.operatingLayers.beforePayment.freeExploration
    .runtimePersistenceUsed,
  false
);
assert.equal(
  paymentBoundary.operatingLayers.beforePayment.freeExploration.paidProviderUsed,
  false
);

for (const requiredFragment of [
  'data-public-header-placeholder',
  'data-public-footer-placeholder',
  'assets/css/free-observation.css',
  'assets/js/pages/free-observation.js',
  'name="observationFocus"',
  'name="observationSignal"',
  'name="observationHorizon"',
  'data-save-observation',
  'data-delete-observation',
  'data-free-observation-clear-all',
  'data-free-observation-upload',
  'freeObservation.upload.state'
]) {
  if (requiredFragment === 'data-delete-observation') {
    assert(pageController.includes(requiredFragment));
  } else if (requiredFragment === 'data-free-observation-upload') {
    assert(
      page.includes('free-observation-upload'),
      'The inactive upload boundary is missing.'
    );
  } else {
    assert(page.includes(requiredFragment), `Missing page fragment: ${requiredFragment}`);
  }
}
assert.equal(
  /<textarea\b|<input\b[^>]*\btype=["'](?:text|email|file|password|tel|date|number)["']/i
    .test(page),
  false,
  'Free Observation exposes a sensitive or free-form input.'
);
assert.equal(/href=["']\/services/i.test(page), false);
assert(page.includes('href="/articles"'));
assert(page.includes('href="/reality-demo"'));
assert(page.includes('href="/reality-journey"'));
assert(page.includes('href="/"'));
assert.equal((realityDemo.match(/href="\/free-observation"/g) || []).length, 2);

const browserSources = `${localContract}\n${pageController}`;
assert.equal(/\bfetch\s*\(/.test(browserSources), false);
assert.equal(/["'`]\/api\//.test(browserSources), false);
assert.equal(/from\s+["'][^"']*runtime/i.test(browserSources), false);
assert.equal(/from\s+["'][^"']*provider/i.test(browserSources), false);

function flattenKeys(value, prefix = '', result = []) {
  for (const [key, child] of Object.entries(value || {})) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') result.push(next);
    else flattenKeys(child, next, result);
  }
  return result.sort();
}
assert.deepEqual(flattenKeys(en), flattenKeys(zhHans));
assert(styles.includes('@media (max-width: 900px)'));
assert(styles.includes('@media (max-width: 620px)'));
assert(styles.includes('@media (prefers-reduced-motion: reduce)'));
assert(styles.includes('min-height: 44px'));

const freeObservationCapability = pjaBoundary.pageCapabilities.find(
  item => item.capabilityId === 'free-observation-privacy'
);
assert.deepEqual(freeObservationCapability, {
  capabilityId: 'free-observation-privacy',
  pages: ['free-observation.html'],
  sourceObjects: ['Consent'],
  dependencyOwners: ['PWS-I8'],
  activationState: 'local_only_privacy_projection',
  writeAuthority: 'none'
});

const migrationFiles = (await fs.readdir(path.join(root, 'db/migrations')))
  .filter(file => file.endsWith('.sql'))
  .sort();
assert.deepEqual(migrationFiles, [
  '0001_platform_foundation.sql',
  '0002_initial_runtime.sql',
  '0003_financial_professional_infrastructure.sql',
  '0004_book_commerce.sql',
  '0005_pws_universal_registry.sql'
]);

assert.equal(
  packageJson.scripts['check:pws-i8-free-observation'],
  'node scripts/check-pws-i8-free-observation-privacy-foundation.mjs'
);
const pwsI8Precheck =
  'node scripts/check-pws-i8-free-observation-privacy-foundation.mjs';
const pwsI9Precheck =
  'node scripts/check-pws-i9-rule-engine-foundation.mjs';
assert(
  packageJson.scripts.precheck.includes(pwsI8Precheck) &&
  packageJson.scripts.precheck.indexOf(pwsI8Precheck) <
    packageJson.scripts.precheck.indexOf(pwsI9Precheck),
  'PWS-I8 Free Observation acceptance must precede PWS-I9.'
);
assert.deepEqual(evidence.acceptance, {
  anonymousObservationDefaultsToLocalStorage: true,
  serverUploadRequiresExplicitConsent: true,
  freeObservationCreatesFormalJourney: false,
  freeObservationCreatesProfessionalQueueEntry: false,
  userCanClear: true,
  sensitiveDataStored: false,
  command: 'npm run check:pws-i8-free-observation'
});

console.log(
  'PWS-I8 Free Observation Privacy Foundation OK ' +
  '(local-only, clearable, consent-gated upload unavailable, no formal writes).'
);
