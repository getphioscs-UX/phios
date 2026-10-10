import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  evaluateQuestionRoute,
  ROUTING_BOUNDARIES
} from '../functions/pws/intelligence/rule-engine.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const [
  evidence,
  pwsI8,
  sequence,
  concepts,
  themes,
  nodes,
  localizedContent,
  assets,
  supportingQuestions,
  searchAliases,
  blueprint,
  fixtures,
  packageJson,
  engineWrapperSource,
  engineCoreSource
] = await Promise.all([
  readJson('docs/pws/contracts/pws-i9-rule-engine-foundation-v1.json'),
  readJson('docs/pws/contracts/pws-i8-free-observation-privacy-foundation-v1.json'),
  readJson('docs/pws/architecture/pws-implementation-sequence-v1.json'),
  readJson('content/registry/concepts.json'),
  readJson('content/knowledge/registry/themes.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/localized-content.json'),
  readJson('content/knowledge/registry/assets.json'),
  readJson('content/knowledge/registry/supporting-questions.json'),
  readJson('content/knowledge/registry/search-aliases.json'),
  readJson('content/knowledge/blueprints/book-1-knowledge-blueprint.json'),
  readJson('tests/fixtures/pws-i9-rule-engine-scenarios.json'),
  readJson('package.json'),
  read('functions/pws/intelligence/rule-engine.js'),
  read('assets/js/modules/pws-i9-rule-engine-core.js')
]);

assert.equal(
  evidence.freezeId,
  'PWS-I9-Rule-Engine-Foundation-v1.0.0-Frozen'
);
assert.equal(evidence.programme, 'PHASE 4 Free Explore Foundation');
assert.equal(evidence.step, 'STEP 4.2');
assert.equal(evidence.sequenceKey, 'PWS-I9-RULE-FOUNDATION');
assert.equal(evidence.version, '1.0.0');
assert.equal(evidence.status, 'frozen');
assert.deepEqual(evidence.baseline, {
  repository: 'getphioscs-UX/phios',
  branch: 'main',
  commit: 'e52a1d154291d51737d837226439bd2ddd8cd9a2',
  prerequisite: pwsI8.freezeId
});

const sequenceItem = sequence.sequence.find(
  item => item.sequenceKey === evidence.sequenceKey
);
assert.equal(sequenceItem?.ordinal, 6);
assert.equal(sequenceItem?.label, 'PWS-I9 Rule Foundation');

assert.deepEqual(evidence.requiredOutputFields, [
  'questionId',
  'detectedThemes',
  'complexityLevel',
  'matchedConcepts',
  'matchedResources',
  'observationPrompts',
  'individualAnalysisRequired',
  'professionalResponsibilityRequired',
  'routingBoundary',
  'confidence'
]);
assert.deepEqual(
  evidence.routingBoundaries,
  Object.values(ROUTING_BOUNDARIES)
);

const registries = {
  concepts,
  themes,
  nodes,
  localizedContent,
  assets,
  supportingQuestions,
  searchAliases,
  blueprint
};

const expectedFields = evidence.requiredOutputFields;
for (const scenario of fixtures.scenarios) {
  const result = evaluateQuestionRoute({
    questionId: scenario.id,
    question: scenario.question,
    locale: scenario.locale
  }, registries);

  assert.deepEqual(
    Object.keys(result),
    expectedFields,
    `Output contract mismatch: ${scenario.id}`
  );
  assert.equal(result.questionId, scenario.id);
  assert(Number.isInteger(result.complexityLevel));
  assert(result.complexityLevel >= 1 && result.complexityLevel <= 5);
  assert(result.confidence >= 0 && result.confidence <= 1);
  assert.equal(result.routingBoundary, scenario.expectedBoundary);
  assert.equal(
    result.individualAnalysisRequired,
    scenario.individualAnalysisRequired
  );
  assert.equal(
    result.professionalResponsibilityRequired,
    scenario.professionalResponsibilityRequired
  );

  if ('expectedResourceCount' in scenario) {
    assert.equal(result.matchedResources.length, scenario.expectedResourceCount);
  }
  if ('expectedConfidence' in scenario) {
    assert.equal(result.confidence, scenario.expectedConfidence);
  }
  if ('expectedMinimumComplexity' in scenario) {
    assert(result.complexityLevel >= scenario.expectedMinimumComplexity);
  }
  if (scenario.expectedResourceNodeCode) {
    assert(
      result.matchedResources.some(
        resource => resource.nodeCode === scenario.expectedResourceNodeCode
      )
    );
  }

  for (const resource of result.matchedResources) {
    const asset = assets.assets.find(
      item => item.assetCode === resource.assetCode
    );
    const localized = localizedContent.localizedContent
      .find(item => item.nodeCode === resource.nodeCode)
      ?.locales?.[resource.locale];
    assert(asset);
    assert(localized);
    for (const record of [asset, localized]) {
      assert.equal(record.contentStatus, 'content_reviewed');
      assert.equal(record.reviewStatus, 'approved');
      assert.equal(record.publicationStatus, 'published');
    }
    assert.equal(asset.assetType, 'article');
    assert.equal(asset.publicHref, resource.href);
  }
}

const unpublished = evaluateQuestionRoute({
  question: '为什么计算能力不能自动产生方向？',
  locale: 'zh-Hans'
}, registries);
assert.equal(unpublished.routingBoundary, 'free_observation');
assert.equal(unpublished.matchedResources.length, 0);

const unclassified = evaluateQuestionRoute({
  question: 'Unrelated qzxwvu object without a known topic.',
  locale: 'en'
}, registries);
assert.equal(unclassified.routingBoundary, 'unclassified');
assert.deepEqual(unclassified.detectedThemes, []);
assert.deepEqual(unclassified.matchedConcepts, []);
assert.deepEqual(unclassified.matchedResources, []);
assert.equal(unclassified.confidence, 0);

assert.equal(evidence.engine.providerInvoked, false);
assert.equal(evidence.engine.canonicalQuestionRoutePersisted, false);
assert.equal(evidence.engine.forcedClassificationAllowed, false);
for (const value of Object.values(evidence.prohibitions)) {
  assert.equal(value, false);
}
for (const value of Object.values(evidence.formalSystemSeparation)) {
  assert.equal(value, false);
}
for (const value of Object.values(evidence.preservation)) {
  assert.equal(value, false);
}

assert(
  engineWrapperSource.includes(
    '../../../assets/js/modules/pws-i9-rule-engine-core.js'
  )
);
const engineSource = `${engineWrapperSource}\n${engineCoreSource}`;

for (const forbidden of [
  'fetch(',
  '/api/',
  'openai',
  'workers-ai',
  'createassignment',
  'professionalqueue',
  'serviceid',
  'productid',
  'priceid',
  'entitlementid'
]) {
  assert.equal(
    engineSource.toLowerCase().includes(forbidden),
    false,
    `Rule Engine contains forbidden dependency: ${forbidden}`
  );
}

assert.equal(
  packageJson.scripts['check:pws-i9-rule-engine'],
  'node scripts/check-pws-i9-rule-engine-foundation.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'scripts/check-pws-i9-rule-engine-foundation.mjs'
  )
);

console.log(
  '✓ PWS-I9 Rule Engine Foundation passed: deterministic topic, complexity, ' +
  'knowledge matching and boundary routing are closed without Provider calls, ' +
  'service defaults, case judgment or forced classification.'
);
