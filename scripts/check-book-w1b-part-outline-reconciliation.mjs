import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildBookW1BOutlineMigrationMaps,
  MIGRATION_FILES,
  OUTLINE_GUARD_PATH
} from './build-book-w1b-outline-migration-drafts.mjs';

const root = process.cwd();
const read = relativePath => fs.readFile(path.join(root, relativePath), 'utf8');
const readJson = async relativePath => JSON.parse(await read(relativePath));
const digest = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const R5_FREEZE_PATH = 'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json';
const ALLOWED_ACTIONS = new Set(['retain', 'rename', 'move', 'supersede', 'split', 'merge', 'new']);

const [
  nodesRaw,
  blueprintRegistryRaw,
  contract,
  outlineGuard,
  packageJson,
  audit,
  r5Freeze,
  expectedMaps
] = await Promise.all([
  read('content/knowledge/registry/nodes.json'),
  read('content/knowledge/blueprints/blueprint-registry.json'),
  readJson('content/knowledge/migrations/five-volume-migration-contract-v1.json'),
  readJson(OUTLINE_GUARD_PATH),
  readJson('package.json'),
  read('docs/audits/BOOK-W1B-part-8-15-outline-reconciliation.md'),
  readJson(R5_FREEZE_PATH),
  buildBookW1BOutlineMigrationMaps(root)
]);

assert.equal(r5Freeze.status, 'FROZEN_SUCCESSOR_CANONICAL_AUTHORITY');
assert.equal(r5Freeze.canonicalAuthority.predecessorCount, 716);
assert.equal(r5Freeze.canonicalAuthority.successorCount, 718);
assert.equal(digest(nodesRaw), r5Freeze.canonicalAuthority.successorSha256, 'BOOK-W1B must preserve the exact KAU-R5 Canonical successor.');
assert.equal(digest(blueprintRegistryRaw), r5Freeze.blueprintAuthority.registryManifestSha256, 'BOOK-W1B must preserve the exact KAU-R5 Blueprint Registry.');

const nodes = JSON.parse(nodesRaw);
const actualMaps = [];
for (const [partCode, fileName] of MIGRATION_FILES) {
  const actual = await readJson(`content/knowledge/migrations/${fileName}`);
  assert.deepEqual(actual, expectedMaps.get(fileName), `${partCode} migration map must rebuild deterministically.`);
  actualMaps.push(actual);
}

assert.equal(actualMaps.length, 8);
assert.deepEqual(actualMaps.map(map => map.partAuthority.partCode), ['P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15']);
assert.deepEqual(actualMaps.map(map => map.partAuthority.newPublicationBookCode), [
  'BOOK-3', 'BOOK-3', 'BOOK-4', 'BOOK-4', 'BOOK-4', 'BOOK-5', 'BOOK-5', 'BOOK-5'
]);
assert(actualMaps.every(map => map.status === 'in-progress-blocked-pending-canonical-outline-authority'));
assert(actualMaps.every(map => map.blocker.w1bAcceptanceBlocked));
assert(actualMaps.every(map => !map.blocker.w1cSuccessorBlueprintGenerationAllowed));
assert(actualMaps.every(map => !map.sourceOutlineAuthority.canonicalAcceptanceEligible));

assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.existingCanonicalNodeCount, 0), 471);
assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.upgradedOutlineChapterCount, 0), 621);
assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.outlineChapterMinusExistingNodeCount, 0), 150);
assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.approvedNewCanonicalNodeCandidateCount, 0), 0);
assert.deepEqual(actualMaps.map(map => map.sourceOutlineAuthority.fullChapterListIncluded), [
  false, false, false, false, false, true, false, false
]);

const entries = actualMaps.flatMap(map => map.entries);
const governedNodes = nodes.nodes.filter(node => /^P(?:8|9|1[0-5])$/.test(node.partCode ?? ''));
assert.equal(entries.length, 471);
assert.equal(new Set(entries.map(entry => entry.oldNodeCode)).size, 471);
assert.deepEqual(
  entries.map(entry => entry.oldNodeCode).sort(),
  governedNodes.map(node => node.nodeCode).sort(),
  'All and only the 471 existing P8-P15 frozen Canonical Nodes must be accounted for.'
);
for (const entry of entries) {
  assert(ALLOWED_ACTIONS.has(entry.action));
  assert.equal(entry.action, 'move');
  assert.equal(entry.canonicalIdentityChanged, false);
  assert.equal(entry.publicationOwnershipChanged, true);
  assert.equal(entry.oldChapterCode, entry.newChapterCode);
  assert.equal(entry.newChapterCodeIsPreservationPlaceholder, true);
  assert.equal(entry.outlineMatchStatus, 'pending-explicit-human-canonical-review');
  assert.deepEqual(entry.successorNodeCodes, []);
}

assert.equal(outlineGuard.totalUpgradedOutlineChapters, 621);
assert.equal(outlineGuard.existingCanonicalNodesAcrossP8P15, 471);
assert.equal(outlineGuard.outlineChapterMinusExistingNodeCount, 150);
assert.equal(outlineGuard.records.find(record => record.partCode === 'P13').chapters.length, 87);
assert(outlineGuard.records.filter(record => record.partCode !== 'P13').every(record => record.chapters === null));

assert.equal(contract.implementationSteps[0].status, 'accepted');
assert.equal(contract.implementationSteps[1].status, 'in_progress');
assert(contract.implementationSteps.slice(2).every(step => step.status === 'pending'));
assert.equal(contract.progress.currentStep, 'BOOK-W1B');
assert.equal(contract.progress.status, 'blocked-pending-complete-outline-authority-and-human-canonical-review');
assert.equal(contract.progress.migrationMapCount, 8);
assert.equal(contract.progress.accountedExistingCanonicalNodeCount, 471);
assert.equal(contract.progress.approvedNewCanonicalNodeCandidateCount, 0);
assert.equal(contract.progress.nextPermittedStep, 'BOOK-W1B-HUMAN-CANONICAL-OUTLINE-ACCEPTANCE');
assert.equal(contract.boundaries.canonicalNodeRegistryMutationAllowedInW1B, false);
assert.equal(contract.boundaries.successorBlueprintGenerationAllowedBeforeW1BAcceptance, false);

assert(audit.includes('621 outline chapters ≠ 621 Canonical Nodes'));
assert(audit.includes('P13 is the only Part with a complete chapter list'));
assert(audit.includes('BOOK-W1B remains in progress and blocked'));
assert(audit.includes('0 approved new Canonical Node candidates'));

assert.equal(
  packageJson.scripts['check:book-w1-outline'],
  'npm run check:book-w1a && node scripts/check-book-w1b-part-outline-reconciliation.mjs'
);
assert.equal(packageJson.scripts['check:book-w1b'], 'npm run check:book-w1-outline');
assert.equal((packageJson.scripts.precheck.match(/npm run check:book-w1-outline/g) ?? []).length, 1);

console.log('✓ BOOK-W1B Part 8-15 Canonical Outline Reconciliation draft guard passed.');
console.log('  Eight deterministic migration maps account for all 471 existing P8-P15 frozen Canonical Nodes.');
console.log('  621 outline chapters are preserved as semantic constraints; the +150 delta created 0 automatic Node candidates.');
console.log('  The exact 718-node KAU-R5 successor is preserved; its two Human-approved additions remain in P7 outside W1B scope.');
console.log('  W1B acceptance and W1C remain blocked pending complete chapter authority and explicit Human Canonical decisions.');
