import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PUBLIC_EXTRACTION_BOUNDARY,
  validatePrivateManuscriptContract,
  validateSectionInventory,
  validateApprovedMappings,
  createExtractionCandidate,
  bindPjaC1,
  freezePjaC2,
  evaluatePjaC3
} from './lib/knowledge-manuscripts/phase-e-manuscript-binding.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const privateContracts = validatePrivateManuscriptContract(root);
assert.ok(privateContracts.length >= 1);
assert.ok(privateContracts.every(item => item.valid && /^[a-f0-9]{64}$/.test(item.sourceHash)));
const inventories = validateSectionInventory(root);
assert.ok(inventories.every(item => item.valid && item.sectionCount > 0));
const approved = await validateApprovedMappings(root);
assert.equal(approved.length, readJson('content/knowledge/manuscripts/approved-mapping-registry.json').mappings.length);
assert.deepEqual(PUBLIC_EXTRACTION_BOUNDARY, {
  maySummarize: true, mayParaphrase: true, mayQuote: false,
  requiresHumanReview: true, mappedDoesNotCreatePublicFragment: true
});
const candidateRegistry = readJson('content/knowledge/manuscripts/phase-e/extraction-candidate-registry.json');
assert.equal(candidateRegistry.automaticApprovalAllowed, false);
assert.ok(candidateRegistry.candidates.every(item => item.status === 'candidate' && item.humanReviewRequired === true));
const c1 = readJson('content/knowledge/manuscripts/phase-e/pja-c1-manuscript-binding-registry.json');
const c2 = readJson('content/knowledge/manuscripts/phase-e/pja-c2-canonical-content-freeze-registry.json');
const c3 = readJson('content/knowledge/manuscripts/phase-e/pja-c3-production-readiness-registry.json');
assert.equal(c1.readinessMutationAllowed, false);
assert.equal(c2.automaticFreezeAllowed, false);
assert.equal(c3.automaticPromotionAllowed, false);
const blocked = evaluatePjaC3({});
assert.equal(blocked.productionReady, false);
assert.equal(blocked.status, 'blocked');
assert.throws(() => createExtractionCandidate({ mapping: { authorityStatus: 'candidate' }, section: {} }), /EXTRACTION_REQUIRES_APPROVED_MAPPING/);
assert.throws(() => bindPjaC1({ mapping: { authorityStatus: 'candidate' }, extractionCandidate: {} }), /PJA_C1_APPROVED_MAPPING_REQUIRED/);
assert.throws(() => freezePjaC2({ c1: { status: 'bound' }, extraction: { status: 'candidate' } }), /PJA_C2_HUMAN_APPROVED_EXTRACTION_REQUIRED/);
const freeze = readJson('content/knowledge/manuscripts/phase-e/pja-manuscript-binding-freeze-v2.json');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.invariants.humanApprovalRequired, true);
assert.equal(freeze.invariants.mappingDoesNotPromoteReadiness, true);
assert.equal(freeze.invariants.candidateDoesNotCreatePublicFragment, true);
assert.equal(freeze.invariants.automaticPublicationForbidden, true);
console.log('✓ KH-W4H Phase E Private Manuscript and PJA Revalidation passed.');
console.log(`  ${privateContracts.length} private manuscript contract(s) and ${inventories.reduce((n, x) => n + x.sectionCount, 0)} section inventory entries validated.`);
console.log(`  ${approved.length} human-approved mapping(s); no automatic mapping, extraction, readiness, or publication promotion.`);
