import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createSqliteD1Adapter, enableSqliteNumberedParameterCompatibility, loadRuntimeMigrations } from './runtime-migration-loader.mjs';
import { applyRuntimeMigrations } from '../functions/runtime/migrations/migration-runner.js';
import { executeIChingProductRuntime } from '../functions/iching-product-runtime/iching-product-runtime-v1.js';
import { normalizeVerifiedSymbolicAccountIdentity, symbolicPersistenceProviderState } from '../functions/symbolic-method-persistence/symbolic-account-identity-v1.js';
import { createSymbolicReadingPersistenceEnvelope } from '../functions/symbolic-method-persistence/symbolic-reading-envelope-v1.js';
import { createSymbolicReadingD1Store } from '../functions/symbolic-method-persistence/symbolic-reading-store-d1-v1.js';
import { onRequestPost as saveApi } from '../functions/api/symbolic-method-save.js';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const acceptance = read('content/interpretation/iching/acceptance/iching-persistence-acceptance-v1.json');
const authorities = Object.freeze({
  hexagramRegistry: read('content/professional/core-method-runtime/iching-hexagram-registry-v1.json'),
  sourceRegistry: read('content/interpretation/iching/registries/iching-source-registry-v1.json'),
  perspectiveRegistry: read('content/interpretation/iching/registries/iching-interpretation-perspective-registry-v1.json'),
  corpus: read('content/interpretation/iching/corpus/iching-public-domain-minimum-corpus-v1.json')
});

assert.equal(acceptance.baselineCommit, '40cb9e71450ebb817998cde8222225cd941c0aa0');
assert.equal(acceptance.status, 'ACCEPTED_SOURCE_PERSISTENCE_D1_READY_VERIFIED_LIVE_PROVIDER_PENDING');
for (const [name, item] of Object.entries(acceptance.artifacts)) {
  assert.ok(fs.existsSync(item.path), `missing I Ching persistence artifact: ${name}`);
  assert.equal(sha(item.path), item.sha256, `I Ching persistence artifact drift: ${name}`);
}
assert.equal(acceptance.authorityReuse.sharedSymbolicPersistenceRuntime, true);
assert.equal(acceptance.authorityReuse.existingRuntimeDbD1, true);
assert.equal(acceptance.authorityReuse.newMigrationRequired, false);
assert.equal(acceptance.authorityReuse.newIdentityProviderCreated, false);

assert.equal(normalizeVerifiedSymbolicAccountIdentity({ userId: 'u1', providerId: 'p1' }), null);
const alice = { userId: 'ich_acct_alice', providerId: 'TEST_VERIFIED_PROVIDER', verified: true, authenticated: true };
const bob = { userId: 'ich_acct_bob', providerId: 'TEST_VERIFIED_PROVIDER', verified: true, authenticated: true };
assert.equal(normalizeVerifiedSymbolicAccountIdentity(alice).userId, alice.userId);
assert.equal(symbolicPersistenceProviderState({ env: {}, data: { symbolicAccountIdentity: alice } }).providerReady, false);

const database = new DatabaseSync(':memory:');
enableSqliteNumberedParameterCompatibility(database);
database.exec('PRAGMA foreign_keys=ON;');
const db = createSqliteD1Adapter(database);
const { migrations } = loadRuntimeMigrations(process.cwd());
assert.equal(migrations.length, 5);
let tick = 0;
const clock = () => new Date(Date.UTC(2026, 7, 24, 16, 0, tick++)).toISOString();
await applyRuntimeMigrations({ db, migrations, now: clock });

const product = await executeIChingProductRuntime({
  method: 'I_CHING',
  question: 'What should I observe before deciding?',
  inputMode: 'MANUAL_LINES',
  lines: [9, 9, 9, 9, 9, 9],
  sessionId: 'ICH-PERSIST-001',
  timestamp: '2026-08-24T16:00:00.000Z',
  projectionVersion: '1.0.0',
  contextDisclosure: { currentRealityContextUsed: false, contextUseWasExplicit: false }
}, authorities);
const envelope = createSymbolicReadingPersistenceEnvelope({
  method: 'I_CHING',
  question: product.readingIr.question,
  reading: product.publicView,
  methodEvidence: product.publicView.hierarchy.find(item => item.id === 'METHOD_EVIDENCE').data,
  projection: product.publicView.hierarchy.find(item => item.id === 'PROJECTION').data,
  userNotes: 'Review after observing current evidence.'
});
assert.equal(envelope.methodCode, 'I_CHING');
assert.equal(envelope.governance.canonicalRawReadingIrPersisted, false);
assert.equal(envelope.governance.publicIrProjectionPersisted, true);
assert.equal(envelope.contextConsent.currentRealityContextUsed, false);
assert.equal(JSON.stringify(envelope).includes('ICHING_READING_IR_REQUIRED'), false);

let sequence = 0;
const store = createSymbolicReadingD1Store({ db, clock, createId: prefix => `${prefix}_ich_${++sequence}` });
const saved = await store.save({ identity: alice, envelope });
assert.match(saved.recordId, /symbolic_reading/);
assert.equal((await store.list({ identity: alice })).length, 1);
assert.equal((await store.list({ identity: bob })).length, 0);
assert.equal((await store.read({ identity: alice, readingId: saved.recordId })).reading.methodCode, 'I_CHING');
assert.equal(await store.read({ identity: bob, readingId: saved.recordId }), null);
await store.update({ identity: alice, readingId: saved.recordId, patch: { userNotes: 'Updated I Ching note', reviewState: 'REVIEW_LATER' } });
assert.equal((await store.read({ identity: alice, readingId: saved.recordId })).reviewState, 'REVIEW_LATER');

const request = body => new Request('https://phios.local/api/symbolic-method-save', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body)
});
let response = await saveApi({
  request: request({ method: 'I_CHING', question: product.readingIr.question, reading: product.publicView }),
  env: { RUNTIME_DB: db },
  data: { ckaAccess: { accountState: 'GUEST' } }
});
assert.equal(response.status, 401);
response = await saveApi({
  request: request({ method: 'I_CHING', question: product.readingIr.question, reading: product.publicView }),
  env: { RUNTIME_DB: db },
  data: { ckaAccess: { accountState: 'ACCOUNT', retentionPolicyAccepted: true } }
});
assert.equal(response.status, 503);
response = await saveApi({
  request: request({ method: 'I_CHING', question: product.readingIr.question, reading: product.publicView }),
  env: { RUNTIME_DB: db },
  data: {
    ckaAccess: { accountState: 'ACCOUNT', retentionPolicyAccepted: true, permission: true, privacy: true, entitlement: true, roles: ['ELIGIBLE_CUSTOMER'] },
    symbolicAccountIdentity: alice
  }
});
assert.equal(response.status, 200);
assert.equal((await response.json()).governance.runtimeDbD1Used, true);

for (const key of ['iChingEnvelopeCreated','verifiedServerIdentityRequired','explicitRetentionRequired','d1SaveListReadUpdate','crossAccountIsolation','guestFailClosed']) {
  assert.equal(acceptance.accepted[key], true);
}
assert.equal(acceptance.accepted.rawPrivateRealityContextPersisted, false);
assert.equal(acceptance.accepted.canonicalRealityCreated, false);
for (const value of Object.values(acceptance.productionBoundary)) assert.equal(value, false);
database.close();

console.log('✓ ICH-PROD-W15 I Ching persistence source acceptance passed.');
console.log('  Genuine I Ching public view → shared envelope → verified server identity → existing RUNTIME_DB D1 save/list/read/update is account-isolated and guest-fail-closed.');
console.log('  A real global account identity provider and deployed verified-account run are still required before Production activation.');
