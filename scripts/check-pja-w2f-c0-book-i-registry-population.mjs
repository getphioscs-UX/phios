import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const readJson = async relative => JSON.parse(
  await fs.readFile(path.join(root, relative), 'utf8')
);
const digest = async file => crypto.createHash('sha256')
  .update(await fs.readFile(file)).digest('hex');

const paths = {
  blueprint: 'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  policy: 'content/knowledge/governance/book-1-registry-population-policy.json',
  nodes: 'content/knowledge/registry/nodes.json',
  localized: 'content/knowledge/registry/localized-content.json',
  collections: 'content/knowledge/registry/collections.json',
  themes: 'content/knowledge/registry/themes.json',
  sources: 'content/knowledge/registry/sources.json',
  supporting: 'content/knowledge/registry/supporting-questions.json'
};
const [blueprint, policy, nodes, localized, collections, themes, sources, supporting] =
  await Promise.all(Object.values(paths).map(readJson));

assert.equal(policy.stage, 'PJA-W2F-C0');
assert.equal(policy.status, 'population-policy-frozen');
const blueprintNodeCount = blueprint.nodes.length;
const existingPrefaceCount = blueprint.parts
  .filter(part => part.partCode === 'P0')
  .reduce((total, part) => total + part.nodes.length, 0);
const populationCount = blueprintNodeCount - existingPrefaceCount;
assert.equal(blueprintNodeCount, blueprint.plannedCanonicalNodes);
assert.equal(policy.nodes.length, populationCount);
assert.equal(nodes.nodes.length, blueprintNodeCount);
assert.equal(new Set(nodes.nodes.map(item => item.nodeCode)).size, blueprintNodeCount);
assert.equal(localized.localizedContent.length, blueprintNodeCount);
assert.equal(
  new Set(localized.localizedContent.map(item => item.nodeCode)).size,
  blueprintNodeCount
);

const blueprintCodes = new Set(blueprint.nodes.map(item => item.nodeCode));
const registryCodes = new Set(nodes.nodes.map(item => item.nodeCode));
assert.deepEqual([...registryCodes].sort(), [...blueprintCodes].sort());
const policyByNode = new Map(policy.nodes.map(item => [item.nodeCode, item]));
const nodeByCode = new Map(nodes.nodes.map(item => [item.nodeCode, item]));
const localizedByCode = new Map(localized.localizedContent.map(item => [item.nodeCode, item]));
const collectionCodes = new Set(collections.collections.map(item => item.collectionCode));
const themeCodes = new Set(themes.themes.map(item => item.themeCode));
const sourceCodes = new Set(sources.sources.map(item => item.sourceCode));
const questionCodes = new Set((supporting.supportingQuestions || []).map(item => (
  item.questionCode || item.supportingQuestionCode
)));

const forbidden = new Set(policy.forbiddenWrites);
for (let index = 0; index < blueprint.nodes.length; index += 1) {
  const blueprintNode = blueprint.nodes[index];
  const node = nodeByCode.get(blueprintNode.nodeCode);
  assert(node, `Missing Registry Node ${blueprintNode.nodeCode}`);
  assert(collectionCodes.has(node.collectionCode), `Unknown collection ${node.collectionCode}`);
  assert(themeCodes.has(node.themeCode), `Unknown theme ${node.themeCode}`);
  for (const field of forbidden) assert.equal(field in node, false, `${node.nodeCode} extends schema with ${field}`);
  for (const reference of node.sourceReferences || []) {
    assert(sourceCodes.has(reference.sourceCode), `${node.nodeCode} has unknown Source ${reference.sourceCode}`);
    assert.equal(reference.sourceCode.startsWith('SRC-BOOK1-P'), false, 'Fabricated part Source detected');
  }
  for (const questionCode of node.supportingQuestionCodes || []) {
    assert(questionCodes.has(questionCode), `${node.nodeCode} has unknown Supporting Question ${questionCode}`);
  }
  const localizedRecord = localizedByCode.get(node.nodeCode)?.locales?.['zh-Hans'];
  assert(localizedRecord, `${node.nodeCode} lacks zh-Hans identity`);
  if (blueprintNode.partCode !== 'P0') {
    const previous = blueprint.nodes[index - 1]?.nodeCode;
    const next = blueprint.nodes[index + 1]?.nodeCode;
    assert.deepEqual(node.relationships.prerequisiteNodeCodes, previous ? [previous] : []);
    assert.deepEqual(node.relationships.nextNodeCodes, next ? [next] : []);
    const mapping = policyByNode.get(node.nodeCode);
    assert(mapping, `${node.nodeCode} lacks population policy mapping`);
    assert.equal(node.canonicalQuestionKey, mapping.canonicalQuestionKey);
    assert.equal(localizedRecord.displayTitle, mapping.localizedIdentity['zh-Hans'].displayTitle);
    assert.equal(localizedRecord.displayQuestion, mapping.localizedIdentity['zh-Hans'].displayQuestion);
    assert.equal(localizedRecord.slug, mapping.localizedIdentity['zh-Hans'].slug);
    assert.deepEqual(node.sourceReferences, []);
    assert.deepEqual(node.supportingQuestionCodes, []);
    assert.equal(localizedRecord.contentStatus, 'not_started');
    assert.equal(localizedRecord.reviewStatus, 'not_reviewed');
    assert.equal(localizedRecord.publicationStatus, 'not_published');
    assert.equal(localizedRecord.articleAssetCode, null);
  }
}

const articleRoot = path.join(root, 'content/knowledge/articles');
try {
  const articleText = (await fs.readdir(articleRoot, { recursive: true })).join('\n');
  assert.equal(/KN-B1-P[1-5]-/i.test(articleText), false, 'C0 created Book I Article Packages');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pja-w2f-c0-'));
for (const relative of Object.values(paths)) {
  const destination = path.join(temp, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(root, relative), destination);
}
const scriptRelative = 'scripts/sync-pja-w2f-c0-book-i-registry.mjs';
await fs.mkdir(path.join(temp, 'scripts'), { recursive: true });
await fs.copyFile(path.join(root, scriptRelative), path.join(temp, scriptRelative));
const tracked = ['nodes', 'localized', 'collections', 'themes'].map(key => path.join(temp, paths[key]));
const before = await Promise.all(tracked.map(digest));
const secondApply = spawnSync(process.execPath, [scriptRelative, 'BOOK-1', '--apply'], {
  cwd: temp, encoding: 'utf8'
});
assert.equal(secondApply.status, 0, secondApply.stderr || secondApply.stdout);
const after = await Promise.all(tracked.map(digest));
assert.deepEqual(after, before, 'Second apply produced Registry drift');
const output = JSON.parse(secondApply.stdout.slice(0, secondApply.stdout.indexOf('\nPJA-W2F-C0')));
assert.equal(output.nodesToAdd, 0);
assert.equal(output.localizationToAdd, 0);
assert.equal(output.conflicts.length, 0);
await fs.rm(temp, { recursive: true, force: true });

console.log('✓ PJA-W2F-C0 Book I Canonical Registry Population passed.');
console.log(`  Blueprint ${blueprintNodeCount}; Registry ${nodes.nodes.length}; Blueprint-only ${blueprintNodeCount - registryCodes.size}; zh-Hans Identity ${localized.localizedContent.length}.`);
console.log('  Sources fabricated 0; Questions fabricated 0; Schema extensions 0.');
console.log('  Articles, Readiness, Approval and Publication remain unchanged.');
console.log('  Idempotency passed: second apply produced no file drift.');
