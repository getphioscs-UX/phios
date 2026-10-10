import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const successorPath = 'content/interpretation/iching/reconciliation/iching-product-runtime-checker-successor-v2.json';
const successor = read(successorPath);
const predecessor = read(successor.predecessor.path);
const acceptance = read(successor.historicalAcceptance.path);
const campaign = read('content/production/symbolic-method/human-review/iching-human-review-campaign-v1.json');
const pcm = read('content/governance/production-capability-matrix/registries/production-capability-registry-v6.json');
const publicCatalog = read('content/web-production/px2/successors/public-method-catalog-v2.json');
const pkg = read('package.json');

assert.equal(successor.baselineCommit, '40cb9e71450ebb817998cde8222225cd941c0aa0');
assert.equal(successor.status, 'CURRENT_SOURCE_RUNTIME_RECONCILED_TO_SHARED_PERSISTENCE_ACTIVATION_NOT_GRANTED');
assert.equal(sha(successor.predecessor.path), successor.predecessor.sha256);
assert.equal(successor.predecessor.mutated, false);
assert.equal(predecessor.status, 'CURRENT_CHECKER_RECONCILED_SOURCE_RUNTIME_COMPLETE_ACTIVATION_NOT_GRANTED');
assert.equal(sha(successor.historicalAcceptance.path), successor.historicalAcceptance.sha256);
assert.equal(successor.historicalAcceptance.preserved, true);

const shared = successor.sharedContextApiEvolution;
assert.equal(predecessor.sharedApiEvolution.currentSha256, shared.predecessorCurrentSha256);
assert.equal(sha(shared.path), shared.currentSha256);
assert.equal(sha(shared.governedSuccessorAuthority), shared.governedSuccessorAuthoritySha256);
const sharedSource = text(shared.path);
assert.match(sharedSource, /METHODS=new Set\(\['I_CHING','TAROT'\]\)/);
assert.match(sharedSource, /symbolicPersistenceProviderState\(context\)/);
assert.match(sharedSource, /verifiedIdentityBound:persistence\.verifiedIdentityBound/);
assert.match(sharedSource, /persistenceProviderBound:persistence\.d1Bound/);
assert.match(sharedSource, /runAllowed:false/);
assert.equal(shared.iChingSourceReadinessPreserved, true);
assert.equal(shared.verifiedIdentityAndD1RequiredForSave, true);
assert.equal(shared.automaticPersistenceCreated, false);
assert.equal(shared.productionExecutionAuthorityChanged, false);

assert.equal(acceptance.status, 'ACCEPTED_SOURCE_RUNTIME_COMPLETE_PRODUCTION_ACTIVATION_NOT_GRANTED');
assert.equal(acceptance.machineAcceptance.sourceRuntimeComplete, true);
assert.equal(acceptance.production.humanReviewSessionsAccepted, 0);
assert.equal(acceptance.production.humanReviewSessionsRequired, 24);
assert.equal(campaign.sessions.length, 24);
assert.equal(campaign.sessions.filter(session => session.humanReviewed === true).length, 0);

const ich = pcm.capabilities.find(item => item.methodRuntime?.methodCode === 'I_CHING');
assert.ok(ich);
assert.notEqual(ich.capabilityAvailability, 'AVAILABLE');
assert.equal(ich.userExecutable, false);
assert.equal(ich.productionAccepted, false);
const publicIch = publicCatalog.methods.find(item => item.methodCode === 'I_CHING');
assert.ok(publicIch);
assert.equal(publicIch.runAllowed, false);

for (const value of Object.values(successor.sourceRuntime)) assert.equal(value, true);
for (const value of Object.values(successor.productionBoundary)) assert.equal(value, false);
assert.equal(successor.rules.historicalSuccessorMutationAllowed, false);
assert.equal(successor.rules.historicalAcceptanceMutationAllowed, false);
assert.equal(successor.rules.sharedPersistenceMayGrantExecutionAuthority, false);
assert.equal(successor.rules.checkerReconciliationMayGrantProductionActivation, false);

assert.equal(pkg.scripts['check:iching-product-runtime-historical'], 'node scripts/check-iching-product-runtime.mjs');
assert.equal(pkg.scripts['check:iching-product-runtime-current'], 'node scripts/check-iching-product-runtime-current-v2.mjs');

console.log('✓ ICH-PROD-W11 current product checker reconciliation passed.');
console.log('  I Ching source Runtime now consumes the governed shared verified-identity + D1 persistence context without mutating historical product evidence.');
console.log('  Production remains fail-closed until human review, live identity/provider, live browser and deployed SHA gates pass.');
