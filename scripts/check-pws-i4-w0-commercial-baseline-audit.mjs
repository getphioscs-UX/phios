import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));

const prefix = 'docs/pws/audit/pws-i4-w0-';
const inventory = json(`${prefix}commercial-inventory.json`);
const writes = json(`${prefix}write-source-map.json`);
const legacy = json(`${prefix}legacy-reconciliation-map.json`);
const risks = json(`${prefix}risk-register.json`);
const sequence = json(`${prefix}recommended-implementation-sequence.json`);
const report = read('docs/pws/audit/PWS-I4-W0-COMMERCIAL-BASELINE-AUDIT.md');

assert.equal(inventory.baseline.commit.length, 40);
assert.equal(inventory.counts.canonicalProducts, 2);
assert.equal(inventory.counts.canonicalApprovedOffers, 2);
assert.equal(inventory.counts.operationalD1Tables, 10);
assert.equal(inventory.boundaries.paymentCreatesJourney, false);
assert.equal(inventory.boundaries.paymentCreatesAssignment, false);
assert.equal(writes.decision.singleProductSource, true);
assert.equal(writes.decision.singleOfferSource, true);
assert.equal(writes.decision.singlePaymentSource, false);
assert.equal(writes.decision.singleEntitlementSource, false);
assert.equal(writes.decision.multipleProviderReady, false);
assert.equal(writes.decision.providerIndependentJourneyRuntime, true);
assert.equal(legacy.rules.mutateMigration0004, false);
assert.equal(legacy.rules.activateFromMigration, false);
assert.equal(risks.counts.P0, 0);
assert.equal(risks.risks.filter(item => item.priority === 'P1').length, risks.counts.P1);
assert.equal(risks.risks.filter(item => item.priority === 'P2').length, risks.counts.P2);
assert.equal(sequence.steps[0].workPackage, 'PWS-I4-W1');
assert.equal(sequence.nextOnly, 'PWS-I4-W1');
assert.match(report, /PWS-I4-W0-Passed/);
assert.match(report, /13 !== 12/);

const migration = read('db/migrations/0004_book_commerce.sql');
assert.equal((migration.match(/CREATE TABLE IF NOT EXISTS/g) || []).length, 10);
assert.match(migration, /CHECK \(amount_minor = 8900\)/);

console.log('✓ PWS-I4-W0 commercial baseline audit passed.');
console.log('  Product/Offer definition authority is singular; Payment and Entitlement operational authorities are not yet singular.');
console.log('  Book commerce remains bounded, Stripe-specific and separate from formal Journey activation.');
console.log('  Freeze: PWS-I4-W0-Passed.');
