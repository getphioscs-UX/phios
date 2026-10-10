
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { loadUniversalManuscriptRuntime, reviewMappingCandidate } from './lib/knowledge-manuscripts/universal-manuscript-runtime.mjs';

const root = process.cwd();
const freeze = JSON.parse(fs.readFileSync('content/knowledge/semantic/semantic-runtime-freeze.json','utf8'));
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.automaticApprovalAllowed, false);
for (const entry of freeze.files) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(entry.path).toString('utf8').replace(/\r\n?/g,'\n'),'utf8').digest('hex');
  assert.equal(actual, entry.sha256, `semantic digest mismatch: ${entry.path}`);
}

const runtime = loadUniversalManuscriptRuntime(root);
assert.equal(runtime.nodeMap.size, 716);
assert.equal(runtime.profileMap.size, 716);
assert.equal(runtime.manifests.size, 1);
assert.equal(runtime.listManuscripts().length, 1);
assert.equal(runtime.listManuscripts({bookCode:'BOOK-1'}).length, 1);
assert.equal(runtime.listManuscripts({bookCode:'BOOK-2'}).length, 0);
const inventory = [...runtime.inventories.values()][0];
assert.equal(inventory.schemaVersion, '2.0.0');
assert.ok(inventory.sections.length >= 6);
for (const [index, section] of inventory.sections.entries()) {
  assert.ok(section.startHeading);
  assert.ok(Object.hasOwn(section, 'endHeading'));
  assert.ok(Object.hasOwn(section, 'startAnchor'));
  assert.ok(Object.hasOwn(section, 'endAnchor'));
  assert.match(section.sourceRangeHash, /^[a-f0-9]{64}$/);
  assert.equal(section.previousSection, index === 0 ? null : inventory.sections[index-1].sectionCode);
  assert.equal(section.nextSection, index === inventory.sections.length-1 ? null : inventory.sections[index+1].sectionCode);
}
assert.equal(runtime.candidateRegistry.candidateCount, 78);
for (const candidate of runtime.candidateRegistry.candidates) {
  assert.equal(candidate.status, 'human_review_required');
  assert.equal(candidate.humanReviewed, false);
  assert.ok(runtime.nodeMap.has(candidate.nodeCode));
  runtime.resolveSection(candidate.sectionCode);
}
assert.equal(runtime.approvedRegistry.authority, 'human_review_only');
assert.equal(runtime.approvedRegistry.automaticWritesAllowed, false);
assert.deepEqual(runtime.approvedRegistry.mappings, []);
const sample = runtime.generateCandidate({nodeCode:'KN-B1-P5-001',sectionCode:'BOOK-1-P5-S001'});
assert.equal(sample.status, 'human_review_required');
assert.equal(sample.humanReviewed, false);
assert.ok(sample.explanationDetail.primaryReason);
assert.ok(sample.explanationDetail.supportingReason);
assert.ok(sample.explanationDetail.alternativeReason);
assert.ok(sample.explanationDetail.exclusionReason);
assert.ok(sample.explanationDetail.mergeBoundary);
const rejected = reviewMappingCandidate(sample,'reject','TL');
assert.equal(rejected.authorityStatus,'human_review_required');
assert.throws(() => reviewMappingCandidate(sample,'approve',''), /MAPPING_REVIEWER_REQUIRED/);
assert.equal(fs.existsSync('scripts/book-i-manuscript.mjs'), true);
console.log('KH-W4G.6 + KH-W4H STEP 15-21 checks passed.');
console.log('Validated semantic freeze, universal manuscript registry, inventory v2, candidate explanations, human-only approved mapping authority.');
