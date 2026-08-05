import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import { loadCanonicalContext } from './lib/knowledge-production/repository-loader.mjs';

const root = process.cwd();
const historicalBlueprintPath = 'content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json';
const paths = {
  blueprint: 'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  policy: 'content/knowledge/governance/book-1-registry-population-policy.json',
  nodes: 'content/knowledge/registry/nodes.json',
  localized: 'content/knowledge/registry/localized-content.json',
  collections: 'content/knowledge/registry/collections.json',
  themes: 'content/knowledge/registry/themes.json',
  sources: 'content/knowledge/registry/sources.json',
  supporting: 'content/knowledge/registry/supporting-questions.json',
  nodeSchema: 'content/knowledge/registry/schemas/nodes.schema.json'
};
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async relative => JSON.parse(await read(relative));
const [pkg, blueprint, policy, nodes, localized, collections, themes, sources, supporting, nodeSchema] = await Promise.all([
  readJson('package.json'),
  readJson(historicalBlueprintPath),
  readJson(paths.policy),
  readJson(paths.nodes),
  readJson(paths.localized),
  readJson(paths.collections),
  readJson(paths.themes),
  readJson(paths.sources),
  readJson(paths.supporting),
  readJson(paths.nodeSchema)
]);

assert.equal(pkg.scripts['check:pja-w2f-b1'], 'npm run check:pja-w2f-a && node scripts/check-pja-w2f-b1-preface-content-population.mjs');
assert.equal(pkg.scripts['check:pja-w2f-b2'], 'npm run check:pja-w2f-b1 && node scripts/check-pja-w2f-b2-preface-article-production.mjs');
assert.equal(pkg.scripts['check:pja-w2f-c0'], 'npm run check:pja-w2f-b1 && node scripts/check-pja-w2f-c0-book-i-registry-population.mjs');
assert(!pkg.scripts['check:pja-w2f-b1'].includes('c0'));
assert(!pkg.scripts['check:pja-w2f-b2'].includes('c0'));
assert.equal(pkg.scripts['knowledge:sync-registry'], 'node scripts/sync-pja-w2f-c0-book-i-registry.mjs');
assert.equal(pkg.scripts['knowledge:sync-book-i-registry'], 'npm run knowledge:sync-registry --');

const preface = blueprint.nodes.filter(node => node.partCode === 'P0');
const targets = blueprint.nodes.filter(node => node.partCode !== 'P0');
assert.equal(blueprint.nodes.length, 78);
assert.equal(preface.length, 13);
assert.equal(targets.length, 65);
assert.equal(policy.nodes.length, 65);
assert.equal(nodes.nodes.length, 78);
assert.equal(localized.localizedContent.length, 78);
assert.deepEqual(new Set(nodes.nodes.map(node => node.nodeCode)), new Set(blueprint.nodes.map(node => node.nodeCode)));
assert.deepEqual(new Set(localized.localizedContent.map(item => item.nodeCode)), new Set(blueprint.nodes.map(node => node.nodeCode)));

const ajv = new Ajv2020({ allErrors: true, strict: false });
assert.equal(ajv.compile(nodeSchema)(nodes), true, JSON.stringify(ajv.errors));
const nodeByCode = new Map(nodes.nodes.map(node => [node.nodeCode, node]));
const localizedByCode = new Map(localized.localizedContent.map(item => [item.nodeCode, item]));
const collectionByCode = new Map(collections.collections.map(item => [item.collectionCode, item]));
const themeByCode = new Map(themes.themes.map(item => [item.themeCode, item]));
const sourceCodes = new Set(sources.sources.map(source => source.sourceCode));
const questionCodes = new Set((supporting.supportingQuestions || []).map(question => question.questionCode || question.supportingQuestionCode));
const forbidden = new Set(policy.forbiddenWrites);
const policyByCode = new Map(policy.nodes.map(node => [node.nodeCode, node]));

for (const [index, blueprintNode] of blueprint.nodes.entries()) {
  const node = nodeByCode.get(blueprintNode.nodeCode);
  const identity = localizedByCode.get(blueprintNode.nodeCode)?.locales?.['zh-Hans'];
  assert(node && identity, `${blueprintNode.nodeCode}: Registry identity missing`);
  assert(collectionByCode.has(node.collectionCode));
  assert(themeByCode.has(node.themeCode));
  assert.equal(themeByCode.get(node.themeCode).collectionCode, node.collectionCode);
  for (const target of Object.values(node.relationships || {}).flat()) {
    assert.notEqual(target, node.nodeCode, `${node.nodeCode}: self reference`);
    assert(nodeByCode.has(target), `${node.nodeCode}: dangling relationship ${target}`);
  }
  for (const reference of node.sourceReferences || []) assert(sourceCodes.has(reference.sourceCode));
  for (const code of node.supportingQuestionCodes || []) assert(questionCodes.has(code));
  if (blueprintNode.partCode === 'P0') continue;
  const mapping = policyByCode.get(node.nodeCode);
  assert(mapping);
  for (const field of forbidden) assert.equal(field in node, false, `${node.nodeCode}: forbidden ${field}`);
  assert.equal(node.collectionCode, mapping.collectionCode);
  assert.equal(node.themeCode, mapping.themeCode);
  assert.equal(node.canonicalLanguage, 'zh-Hans');
  assert.deepEqual(node.sourceReferences, mapping.sourceReferences || []);
  assert.deepEqual(node.supportingQuestionCodes, []);
  assert.deepEqual(node.relationships.prerequisiteNodeCodes, index ? [blueprint.nodes[index - 1].nodeCode] : []);
  assert.deepEqual(node.relationships.nextNodeCodes, index < blueprint.nodes.length - 1 ? [blueprint.nodes[index + 1].nodeCode] : []);
  assert.deepEqual(node.relationships.relatedNodeCodes, mapping.relatedNodeCodes || []);
  assert.deepEqual(Object.keys(localizedByCode.get(node.nodeCode).locales), ['zh-Hans']);
  assert.deepEqual(identity, {
    locale: 'zh-Hans', displayTitle: mapping.localizedIdentity['zh-Hans'].displayTitle,
    displayQuestion: mapping.localizedIdentity['zh-Hans'].displayQuestion,
    slug: mapping.localizedIdentity['zh-Hans'].slug
  });
}

for (const target of targets) {
  try {
    const context = await loadCanonicalContext(root, target.nodeCode, 'zh-Hans', { requireReadiness: false });
    assert.equal(context.node.nodeCode, target.nodeCode);
  } catch (error) {
    assert.notEqual(error.code, 'NODE_NOT_FOUND', `${target.nodeCode}: NODE_NOT_FOUND`);
  }
}

const protectedRoots = ['content/knowledge/articles', 'content/knowledge/editorial/readiness', 'content/knowledge/production'];
const protectedBefore = await Promise.all(protectedRoots.map(treeDigest));
await exerciseSynchronizerFixtures();
const protectedAfter = await Promise.all(protectedRoots.map(treeDigest));
assert.deepEqual(protectedAfter, protectedBefore, 'C0 fixture test changed production-controlled content');

console.log('✓ PJA-W2F-C0 Book I Canonical Registry Population passed.');
console.log('  13 existing Preface + 65 C0 identities = 78 Registry Nodes and 78 zh-Hans identities.');
console.log('  Default/explicit dry-run, apply, second-apply no-op, conflict blocking and unresolved mapping fixtures passed.');
console.log('  All 65 resolver calls are beyond NODE_NOT_FOUND; no Readiness, Article, Approval or Publication was created.');

async function exerciseSynchronizerFixtures() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pja-w2f-c0-'));
  try {
    for (const relative of Object.values(paths).filter(file => !file.endsWith('.schema.json'))) await copy(relative, temp);
    await copy(historicalBlueprintPath, temp);
    await fs.copyFile(
      path.join(temp, historicalBlueprintPath),
      path.join(temp, paths.blueprint)
    );
    await copy(paths.nodeSchema, temp);
    await copy('scripts/sync-pja-w2f-c0-book-i-registry.mjs', temp);
    const tempNodesPath = path.join(temp, paths.nodes);
    const tempLocalizedPath = path.join(temp, paths.localized);
    const fixtureNodes = JSON.parse(await fs.readFile(tempNodesPath, 'utf8'));
    const fixtureLocalized = JSON.parse(await fs.readFile(tempLocalizedPath, 'utf8'));
    fixtureNodes.nodes = fixtureNodes.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-'));
    fixtureLocalized.localizedContent = fixtureLocalized.localizedContent.filter(item => item.nodeCode.startsWith('KN-PREFACE-'));
    await fs.writeFile(tempNodesPath, `${JSON.stringify(fixtureNodes, null, 2)}\n`);
    await fs.writeFile(tempLocalizedPath, `${JSON.stringify(fixtureLocalized, null, 2)}\n`);
    const tracked = [tempNodesPath, tempLocalizedPath, path.join(temp, paths.collections), path.join(temp, paths.themes)];
    const baselineHashes = await Promise.all(tracked.map(fileDigest));
    for (const args of [[], ['--dry-run']]) {
      const dry = run(temp, args);
      assert.equal(dry.status, 0, dry.stderr || dry.stdout);
      assert.deepEqual(await Promise.all(tracked.map(fileDigest)), baselineHashes, 'dry-run wrote files');
    }
    const apply = run(temp, ['--apply']);
    assert.equal(apply.status, 0, apply.stderr || apply.stdout);
    const appliedHashes = await Promise.all(tracked.map(fileDigest));
    const secondApply = run(temp, ['--apply']);
    assert.equal(secondApply.status, 0, secondApply.stderr || secondApply.stdout);
    assert(secondApply.stdout.includes('apply no-op'));
    assert.deepEqual(await Promise.all(tracked.map(fileDigest)), appliedHashes, 'second apply drifted');
    const secondDry = run(temp, ['--dry-run']);
    assert.equal(secondDry.status, 0);
    assert.deepEqual(parseReport(secondDry.stdout).filesThatWouldChange, []);
    assert.equal(parseReport(secondDry.stdout).unresolvedSourceMappings.length, 65);
    assert.equal(parseReport(secondDry.stdout).unresolvedSupportingQuestionMappings.length, 65);

    const brokenThemes = JSON.parse(await fs.readFile(path.join(temp, paths.themes), 'utf8'));
    brokenThemes.themes = brokenThemes.themes.filter(theme => theme.themeCode !== 'TH-BOOK1-P1-01');
    await fs.writeFile(path.join(temp, paths.themes), `${JSON.stringify(brokenThemes, null, 2)}\n`);
    const beforeConflict = await Promise.all(tracked.map(fileDigest));
    const conflict = run(temp, ['--apply']);
    assert.notEqual(conflict.status, 0);
    assert(parseReport(conflict.stdout).conflicts.some(item => item.code === 'THEME_NOT_FOUND'));
    assert.deepEqual(await Promise.all(tracked.map(fileDigest)), beforeConflict, 'conflict partially applied');
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

function run(cwd, args) {
  return spawnSync(process.execPath, ['scripts/sync-pja-w2f-c0-book-i-registry.mjs', ...args], { cwd, encoding: 'utf8' });
}
function parseReport(stdout) { return JSON.parse(stdout.slice(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1)); }
async function copy(relative, destinationRoot) {
  const destination = path.join(destinationRoot, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(root, relative), destination);
}
async function fileDigest(file) { return crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'); }
async function treeDigest(relative) {
  const base = path.join(root, relative);
  const entries = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else entries.push(`${path.relative(base, absolute)}:${await fileDigest(absolute)}`);
    }
  }
  try { await walk(base); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return crypto.createHash('sha256').update(entries.sort().join('\n')).digest('hex');
}
