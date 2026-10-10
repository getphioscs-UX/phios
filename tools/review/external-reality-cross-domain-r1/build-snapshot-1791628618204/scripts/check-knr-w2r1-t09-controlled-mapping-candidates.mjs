import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBookINodeMapping } from './book-i-manuscript.mjs';
import {
  generatePartMappingCandidates,
  MAPPING_RELATIVE
} from './lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs';
import {
  parsePartMappingCandidateArgs,
  runPartMappingCandidateCommand
} from './generate-book-i-part-mapping-candidates.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const partCounts = { P1: 12, P2: 13, P3: 15, P4: 12, P5: 13 };

for (const partCode of Object.keys(partCounts)) {
  const lower = partCode.toLowerCase();
  assert.equal(
    packageJson.scripts[`knowledge:manuscript:generate-map-${lower}`],
    `node scripts/generate-book-i-part-mapping-candidates.mjs --part ${partCode}`
  );
}
assert.equal(
  packageJson.scripts['check:knr-w2r1-t09-mapping-candidates'],
  'node scripts/check-knr-w2r1-t09-controlled-mapping-candidates.mjs'
);
assert.deepEqual(parsePartMappingCandidateArgs(['--part', 'p1']), { partCode: 'P1', mode: 'dry-run' });
assert.deepEqual(parsePartMappingCandidateArgs(['--part=P5', '--apply']), { partCode: 'P5', mode: 'apply' });
assert.throws(
  () => parsePartMappingCandidateArgs(['--part', 'P1', '--dry-run', '--apply']),
  error => error.code === 'PART_MAPPING_CANDIDATE_MODE_CONFLICT'
);

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phios-map-candidates-'));
try {
  fs.cpSync(path.join(root, 'content'), path.join(temporaryRoot, 'content'), { recursive: true });
  const mappingPath = path.join(temporaryRoot, MAPPING_RELATIVE);
  const original = fs.readFileSync(mappingPath, 'utf8');

  const blockedP2 = (() => {
    try {
      generatePartMappingCandidates({ root: temporaryRoot, partCode: 'P2', mode: 'dry-run' });
      return null;
    } catch (error) {
      return error;
    }
  })();
  assert.equal(blockedP2?.code, 'P2_MAPPING_CANDIDATE_PREVIOUS_PART_REQUIRED');
  assert.equal(fs.readFileSync(mappingPath, 'utf8'), original);

  for (const partCode of Object.keys(partCounts)) {
    const before = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    const beforeByCode = new Map(before.mappings.map(record => [record.nodeCode, JSON.stringify(record)]));
    const dryRun = generatePartMappingCandidates({ root: temporaryRoot, partCode, mode: 'dry-run' });
    assert.equal(dryRun.status, 'candidate_plan_validated');
    assert.equal(dryRun.generatedCandidateCount, partCounts[partCode]);
    assert.equal(dryRun.writes, 0);
    assert.equal(fs.readFileSync(mappingPath, 'utf8'), JSON.stringify(before, null, 2) + '\n');

    const applied = runPartMappingCandidateCommand(
      ['--part', partCode, '--apply'],
      { root: temporaryRoot }
    );
    assert.equal(applied.status, 'candidates_generated');
    assert.equal(applied.generatedCandidateCount, partCounts[partCode]);
    assert.equal(applied.writes, 1);
    assert.equal(applied.automaticHumanVerification, false);
    assert.equal(applied.automaticMappedStatus, false);
    assert.equal(applied.publicExtractionAllowed, false);
    assert.equal(applied.manuscriptBodyStored, false);

    const after = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    const context = {
      manifest: JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'content/knowledge/manuscripts/book-1/manuscript-manifest.json'), 'utf8')),
      blueprint: JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'content/knowledge/blueprints/book-1-knowledge-blueprint.json'), 'utf8')),
      inventory: JSON.parse(fs.readFileSync(path.join(temporaryRoot, 'content/knowledge/manuscripts/book-1/book-1-section-inventory.json'), 'utf8'))
    };
    validateBookINodeMapping(after, context);
    const targets = after.mappings.filter(record => record.partCode === partCode);
    assert.equal(targets.length, partCounts[partCode]);
    assert(targets.every(record => record.mappingStatus === 'candidate'));
    assert(targets.every(record => record.authorityStatus === 'automation_candidate'));
    assert(targets.every(record => record.extractionEligibility === 'private_candidate_only'));
    assert(targets.every(record => record.review.status === 'pending_tl_review'));
    assert(targets.every(record => record.review.humanVerified === false));
    assert(targets.every(record => record.ranges.length === 1));

    const targetCodes = new Set(targets.map(record => record.nodeCode));
    for (const record of after.mappings) {
      if (!targetCodes.has(record.nodeCode)) {
        assert.equal(JSON.stringify(record), beforeByCode.get(record.nodeCode));
      }
    }

    const second = generatePartMappingCandidates({ root: temporaryRoot, partCode, mode: 'apply' });
    assert.equal(second.status, 'already_candidate');
    assert.equal(second.generatedCandidateCount, 0);
    assert.equal(second.writes, 0);
  }
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}

const source = [
  fs.readFileSync(path.join(root, 'scripts/generate-book-i-part-mapping-candidates.mjs'), 'utf8'),
  fs.readFileSync(path.join(root, 'scripts/lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs'), 'utf8')
].join('\n');
assert(!/r2\.dev|presignedUrl|PutObject|GetObject|HeadObject|OPENAI|WORKERS_AI/u.test(source));
assert(!source.includes('content/knowledge/articles'));
assert(!source.includes('content/knowledge/production'));
assert(!source.includes('functions/runtime'));

console.log('✓ KNR-W2R1-T09 controlled P1–P5 Mapping Candidate Generation passed.');
console.log('  Each command advances exactly one human-verified CURRENT Part from unmapped to automation candidate.');
console.log('  Prior and later Parts remain byte-equivalent; no command grants mapped or human-confirmed authority.');
