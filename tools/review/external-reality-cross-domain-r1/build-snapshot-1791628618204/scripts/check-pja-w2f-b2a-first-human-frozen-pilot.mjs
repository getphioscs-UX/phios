import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { compileReadinessSchema, loadKnowledgeInventory, readReadiness, validateReadinessRecord } from './lib/knowledge-production/readiness-system.mjs';

const root = process.cwd();
const knowledge = await loadKnowledgeInventory(root);
const validator = await compileReadinessSchema(root);
const pilot = knowledge.inventory.find(item => item.nodeCode === 'KN-PREFACE-001');
assert(pilot, 'KN-PREFACE-001 must remain registered');
const loaded = await readReadiness(root, pilot);
assert.equal(loaded.legacy, false, 'Pilot must use the universal readiness contract');
const validation = validateReadinessRecord(pilot, loaded, validator);
assert.deepEqual(validation.errors, []);
assert.equal(validation.status, 'production_ready');
assert.equal(loaded.record.review.humanFrozen, true);
assert.equal(loaded.record.review.status, 'approved');
assert.equal(loaded.record.review.reviewedBy, 'TL');
assert(loaded.record.review.reviewedAt);
assert.equal(loaded.record.productionReadiness.missingFields.length, 0);
assert.equal(loaded.record.productionReadiness.blockingReasons.length, 0);
assert.equal(loaded.record.supportingQuestionBoundary.length, 2);
assert(loaded.record.sourceBoundary.sourceRequirement.length > 0);
assert.equal(loaded.record.figureBoundary.figureRequirement, 'required');

for (const item of knowledge.inventory.filter(item => item.partCode === 'P0' && item.nodeCode !== pilot.nodeCode)) {
  const other = await readReadiness(root, item);
  const result = validateReadinessRecord(item, other, validator);
  assert.equal(result.status, 'production_blocked', `${item.nodeCode} must remain blocked`);
  assert.equal(other.record.review.humanFrozen, false);
}

const articleDir = 'content/knowledge/articles';
try {
  const files = await fs.readdir(articleDir);
  assert(!files.some(file => file.includes('KN-PREFACE-001')),
    'B2A must not create a canonical article package');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

console.log('✓ PJA-W2F-B2A First Human Frozen Production Pilot passed.');
console.log('  KN-PREFACE-001 is human-frozen and production_ready.');
console.log('  KN-PREFACE-002–013 remain production_blocked; no article package was generated.');
