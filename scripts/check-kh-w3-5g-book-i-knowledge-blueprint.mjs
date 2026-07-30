import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const digest = async file => crypto
  .createHash('sha256')
  .update(await fs.readFile(file))
  .digest('hex');

const blueprintPath =
  'content/knowledge/blueprints/book-1-knowledge-blueprint.json';
const [blueprint, completion, registeredNodes] = await Promise.all([
  readJson(blueprintPath),
  readJson(
    'docs/knowledge/kh-w3-5g-book-i-knowledge-blueprint-freeze-v1.json'
  ),
  readJson('content/knowledge/registry/nodes.json')
]);

assert.equal(completion.completionId, 'KH-W3.5G-Completed');
assert.equal(completion.status, 'knowledge_hub_planning_frozen');
assert.equal(completion.baseline.commit, '7dc7235');
assert.equal(
  blueprint.contract,
  'PHI-OS-BOOK-I-KNOWLEDGE-BLUEPRINT-v1.3.0'
);
assert.equal(blueprint.status, 'planning-freeze');
assert.equal(blueprint.canonicalLanguage, 'zh-Hans');
assert.equal(blueprint.prefaceCanonicalNodes, 13);
assert.equal(blueprint.newNodesBeyondPreface, 65);
assert.equal(blueprint.plannedCanonicalNodes, 78);
assert.equal(blueprint.activeProductionLimit, 8);
assert.equal(blueprint.nodes.length, 78);
assert.equal(new Set(blueprint.nodes.map(node => node.nodeCode)).size, 78);

const expectedCounts = {
  P0: 13,
  P1: 12,
  P2: 13,
  P3: 15,
  P4: 12,
  P5: 13
};
assert.deepEqual(
  Object.fromEntries(
    Object.entries(Object.groupBy(blueprint.nodes, node => node.partCode))
      .map(([partCode, nodes]) => [partCode, nodes.length])
  ),
  expectedCounts
);
assert.deepEqual(
  Object.fromEntries(
    blueprint.parts.map(part => [part.partCode, part.canonicalNodeCount])
  ),
  expectedCounts
);
for (const part of blueprint.parts) {
  assert.deepEqual(
    part.nodes,
    blueprint.nodes
      .filter(node => node.partCode === part.partCode)
      .map(node => node.nodeCode)
  );
}

const requiredNow = blueprint.nodes
  .filter(node => node.articleRequiredNow)
  .map(node => node.nodeCode);
const wave1 = blueprint.releaseRecommendation.wave1;
assert.equal(wave1.length, 8);
assert.equal(new Set(wave1).size, 8);
assert(wave1.every(nodeCode => requiredNow.includes(nodeCode)));
assert.equal(requiredNow.length, 13);
assert.equal(
  blueprint.nodes.filter(node => node.articleRequiredNow === false).length,
  65
);
assert(
  blueprint.nodes.every(node =>
    node.sourceRole === 'canonical-mechanism' &&
    node.publicLanguagePlan.includes('zh-Hans') &&
    node.publicLanguagePlan.includes('en')
  )
);

const prefaceCodes = blueprint.nodes
  .filter(node => node.partCode === 'P0')
  .map(node => node.nodeCode);
assert.deepEqual(
  prefaceCodes,
  registeredNodes.nodes.map(node => node.nodeCode)
);
assert(
  blueprint.nodes
    .filter(node => node.partCode === 'P0')
    .every(node => node.status === 'registered')
);
assert(
  blueprint.nodes
    .filter(node => node.partCode !== 'P0')
    .every(node => node.status === 'planned')
);

assert.deepEqual(
  completion.canonicalNodePlan.map(item => item.canonicalNodes),
  [13, 12, 13, 15, 12, 13]
);
assert.deepEqual(completion.totals, {
  prefaceRegisteredNodes: 13,
  plannedNodesBeyondPreface: 65,
  bookICanonicalNodes: 78,
  maximumActiveArticles: 8,
  activeArticlesInWave1: 8,
  articleCandidatesMarkedRequiredNow: 13
});
assert(
  Object.values(completion.frozenBoundaries).every(value => value === false)
);
assert.equal(completion.handoff.knowledgeHubPlanning, 'frozen');
assert.deepEqual(completion.handoff.returnTo, ['PWS', 'PJA']);
assert.equal(await digest(blueprintPath), completion.blueprint.sha256);

console.log('✓ KH-W3.5G Book I Knowledge Blueprint passed.');
console.log('  Preface 13 + Parts 12/13/15/12/13 = 78 Canonical Nodes.');
console.log('  Exactly 8 Articles are active in wave 1; planning flags cannot bypass that limit.');
console.log('  Knowledge Hub Planning is frozen and does not block paid Journey or PWS.');
console.log('  State: KH-W3.5G-Completed; return to PWS / PJA execution.');
