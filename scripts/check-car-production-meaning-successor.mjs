import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readJson, validateProductionBrief } from './lib/car-production/car-production-v1.mjs';

const root = process.cwd();
const legacyCode = 'CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-001';
const successorCode = 'CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-002';
const legacy = readJson(root, `content/production/car/briefs/${legacyCode}.json`);
const successor = readJson(root, `content/production/car/briefs/${successorCode}.json`);
const freeze = readJson(root, `content/production/car/freezes/${successorCode}.freeze.json`);
const registry = readJson(root, 'content/production/car/registries/canonical-asset-brief-production-registry-v1.json');
const authority = readJson(root, 'content/production/canonical-meaning/authority/CM-KNOWLEDGE-AUTHORITY-KN-PREFACE-001-v1.json');
const published = readJson(root, 'content/production/car/published/PUBLISHED-ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-001.json');
const publishedCandidate = readJson(root, 'content/production/car/candidates/CAR-CAND-KN-PREFACE-001-MECHANISM-ZH-HANS-001/candidate.v1.json');

assert.deepEqual(legacy.meaningReferences, ['CM-DECISION-INTERNAL-RESPONSE']);
assert.equal(legacy.briefDigest, 'f2c1d2c970d2e851091f69952a1ac63dcc911d9c98eec8ab7732fee5009e7633');
assert.deepEqual(successor.meaningReferences, authority.mappings.map(record => record.meaningCode).sort());
assert.equal(validateProductionBrief({ root, brief: successor }).meaningAuthorityMode, 'cm_knowledge_production_authority');
assert.equal(freeze.briefDigest, successor.briefDigest);
assert.equal(freeze.frozen, true);
assert.equal(freeze.meaningAuthorityMode, 'cm_knowledge_production_authority');
assert.equal(registry.briefs.some(record => record.briefCode === legacyCode && record.state === 'validated_frozen'), true);
assert.equal(registry.briefs.some(record => record.briefCode === successorCode && record.briefDigest === successor.briefDigest && record.state === 'validated_frozen'), true);
assert.equal(published.carPublicationRecord.candidateCode, publishedCandidate.candidateCode);
assert.equal(publishedCandidate.assetBriefCode, legacyCode);
assert.notEqual(publishedCandidate.assetBriefDigest, successor.briefDigest);

const checker = fs.readFileSync('scripts/check-car-production-meaning-successor.mjs', 'utf8');
for (const name of ['writeFileSync', 'writeFile', 'rename', 'mkdir', 'publishAsset']) assert.equal(new RegExp(`(?:fs\\.)?${name}\\s*\\(`).test(checker), false, `CAR_SUCCESSOR_CHECKER_WRITER_FORBIDDEN:${name}`);

console.log('✓ CAR Production consumes the active CM → KN-PREFACE-001 Production Authority.');
console.log('✓ CAB ...-001 remains immutable historical lineage; CAB ...-002 is the validated/frozen successor.');
console.log('✓ Existing Published Figure remains bound to ...-001 and is not silently promoted into the successor lineage.');
