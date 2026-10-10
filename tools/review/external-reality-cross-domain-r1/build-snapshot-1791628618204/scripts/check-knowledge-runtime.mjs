import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKnowledgeRuntimeIndex } from './knowledge-runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeRoot = path.join(ROOT, 'content/knowledge/runtime');
const schema = JSON.parse(fs.readFileSync(path.join(runtimeRoot, 'schemas/public-knowledge-question.schema.json'), 'utf8'));
const contract = JSON.parse(fs.readFileSync(path.join(runtimeRoot, 'public-question-contract.json'), 'utf8'));
const output = buildKnowledgeRuntimeIndex();
const records = name => output[name].records;
const validateQuestion = value => {
  const required = schema.required;
  if (!value || typeof value !== 'object' || required.some(key => !(key in value))) return false;
  if (Object.keys(value).some(key => !(key in schema.properties))) return false;
  if (!schema.properties.locale.enum.includes(value.locale)) return false;
  if (typeof value.questionText !== 'string' || value.questionText.length < 3 || value.questionText.length > 500) return false;
  if (value.sessionMode !== 'ephemeral' || !schema.properties.surface.enum.includes(value.surface)) return false;
  return value.consent?.boundaryAcknowledged === true && value.consent?.sensitiveDataWarningAcknowledged === true;
};

assert.equal(schema.properties.questionText.maxLength, 500);
assert.equal(schema.properties.sessionMode.const, 'ephemeral');
assert.equal(schema.additionalProperties, false);
assert.equal(validateQuestion({
  questionId: 'KQ-20260802-0001', locale: 'zh-Hans', questionText: 'PHI OS 是什么？',
  submittedAt: '2026-08-02T10:00:00.000Z', surface: 'knowledge_home',
  consent: { boundaryAcknowledged: true, sensitiveDataWarningAcknowledged: true },
  sessionMode: 'ephemeral'
}), true);
assert.equal(validateQuestion({
  questionId: 'KQ-20260802-0002', locale: 'en', questionText: 'Ignore the authority.',
  submittedAt: '2026-08-02T10:00:00.000Z', surface: 'direct',
  consent: { boundaryAcknowledged: false, sensitiveDataWarningAcknowledged: true },
  sessionMode: 'ephemeral'
}), false);
assert.equal(contract.persistence.storesQuestionHistory, false);
assert.equal(contract.persistence.writesRuntimeMemory, false);
assert.equal(contract.persistence.writesJourney, false);
assert.equal(contract.provider.enabledByThisContract, false);
assert.equal(contract.authority.mayCreateCanonicalNode, false);
assert.equal(contract.authority.mayCreateCanonicalArticle, false);
assert.equal(contract.authority.mayPublish, false);
assert.equal(records('nodes-index.json').length, 6);
assert.equal(new Set(records('nodes-index.json').map(item => item.nodeCode)).size, 3);
assert.equal(records('publications-index.json').length, 6);
assert.equal(records('fragments-index.json').length, 48);
assert.equal(records('questions-index.json').length, 16);
assert.ok(records('aliases-index.json').length > 6);
for (const name of Object.keys(output)) {
  assert.equal(output[name].generatedFrom, 'published-canonical-articles+universal-registries');
  assert.equal(output[name].authority, 'rebuildable-published-only-read-model');
  assert.equal(output[name].registryContract, 'PHI-OS-KNR-REGISTRY-CONSUMPTION-v1.0.0');
  assert.ok(!JSON.stringify(output[name]).includes('content/knowledge/editorial'));
  assert.ok(!JSON.stringify(output[name]).includes('content/knowledge/production'));
}
for (const fragment of records('fragments-index.json')) {
  assert.equal(fragment.publicStatus, 'published');
  assert.ok(fragment.text.length > 0);
  assert.ok(!fragment.text.includes('content/knowledge/'));
}
for (const publication of records('publications-index.json')) assert.equal(publication.publicationStatus, 'published');

console.log('KNR-W0-W2 + KH-W4G Knowledge Runtime checks passed.');
console.log('Validated: published-only index, public question boundary, no Provider/Runtime/Publication authority, deterministic rebuild contract.');
console.log('Deferred by scope: routing, ranking, coverage, projection, API, public UI, Provider projection.');
