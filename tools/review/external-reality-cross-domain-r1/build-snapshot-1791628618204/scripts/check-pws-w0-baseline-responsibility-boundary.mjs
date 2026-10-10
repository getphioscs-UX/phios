import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256Hex } from '../functions/runtime/migrations/migration-runner.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const exists = async file => fs.access(path.join(root, file)).then(() => true, () => false);
const hash = source => crypto.createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const contract = JSON.parse(await read(
  'content/registry/pws-w0-baseline-responsibility-boundary.json'
));
assert.equal(contract.milestone, 'PWS-W0');
assert.equal(contract.status, 'baseline-and-responsibility-boundary-frozen');
assert.equal(contract.baseline.commit, 'ad34f1047d59b9271754573b0c45bba3003a1c14');
assert.equal(contract.journeyContract.sharedWithCustomerJourney, true);
assert.equal(contract.journeyContract.independentProfessionalRealityStoreAllowed, false);
assert.equal(contract.journeyContract.customerJourneyMutationAllowed, false);
assert.deepEqual(contract.dataLayers, [
  'customer_original_material',
  'customer_formal_record',
  'professional_working_notes',
  'candidate_revision',
  'formally_signed_output',
  'professional_responsibility_period'
]);

for (const required of [
  'authenticatedProfessionalRequired',
  'assignedProfessionalRequired',
  'activeExplicitConsentRequired',
  'resourceScopeRequired',
  'purposeRequired',
  'consentVersionRequired',
  'revokedOrExpiredConsentClosesAccess'
]) assert.equal(contract.accessBoundary[required], true, `Missing access boundary: ${required}`);
assert.equal(contract.accessBoundary.accessBeforeConsentAllowed, false);
assert.equal(contract.accessBoundary.clientListMayContainUnauthorisedClients, false);
assert.equal(contract.responsibilityLifecycle.purchaseCreatesResponsibility, false);
assert.equal(contract.responsibilityLifecycle.entitlementCreatesResponsibility, false);
assert.equal(contract.responsibilityLifecycle.accessAfterResponsibilityEndsAllowed, false);
assert.equal(contract.projectionBoundary.runtimeViewReadOnly, true);
assert.equal(contract.projectionBoundary.professionalNotesSeparateFromFormalRecord, true);
assert.equal(contract.projectionBoundary.candidateRevisionIsNotFormalReading, true);
assert.equal(contract.projectionBoundary.professionalObservationIsNotObservedEvidence, true);
assert.equal(contract.projectionBoundary.externalReaderInterpretationIsNotRuntimeEvidence, true);
assert.equal(contract.projectionBoundary.automaticSigningAllowed, false);

for (const [file, expected] of Object.entries(contract.protectedArtifacts)) {
  assert.equal(hash(await read(file)), expected, `Protected PWS artifact changed: ${file}`);
}

const registry = JSON.parse(await read('content/registry/runtime-migrations.json'));
assert.deepEqual(registry.migrations.slice(0, 4).map(item => item.version), [1, 2, 3, 4]);
const migration = registry.migrations[3];
assert.equal(migration.file, 'db/migrations/0004_book_commerce.sql');
assert.equal(migration.schema_id, 'phi-os.book-commerce-schema.v1');
assert.equal(migration.immutable, true);
assert.equal(await sha256Hex(await read(migration.file)), migration.checksum);
const commerceSchema = JSON.parse(await read('content/registry/book-commerce-schema.json'));
assert.equal(commerceSchema.migration, migration.file);
assert.equal(commerceSchema.schemaId, migration.schema_id);
assert.equal(commerceSchema.tables.length, 10);

for (const misplaced of [
  'PDS-W10-DELETE-MANIFEST.txt',
  'functions/professional/external-readers/index.html',
  'functions/professional/human-design/index.html'
]) assert.equal(await exists(misplaced), false, `Misplaced W9 artifact remains: ${misplaced}`);

const index = JSON.parse(await read('content/registry/index.json'));
assert.equal(
  index.registries.pws_w0_baseline_responsibility_boundary,
  './pws-w0-baseline-responsibility-boundary.json'
);

console.log('✓ PWS-W0 baseline and professional responsibility boundary frozen.');
console.log('  Shared Journey, consent, assignment, data-layer and signing boundaries are explicit.');
console.log('  Existing immutable migration 0004 is registered; no migration SQL changed.');
