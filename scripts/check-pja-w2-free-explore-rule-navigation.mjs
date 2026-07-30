import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  evaluateQuestionRoute
} from '../functions/pws/intelligence/rule-engine.js';
import {
  FREE_EXPLORE_MAXIMUM_RECORDS,
  FREE_EXPLORE_RETENTION_DAYS,
  FREE_EXPLORE_SCHEMA_VERSION,
  FREE_EXPLORE_STORAGE_KEY,
  clearAllFreeExploreSessions,
  clearFreeExploreSession,
  createFreeExploreSession,
  loadFreeExploreSessions,
  saveFreeExploreSession
} from '../assets/js/modules/free-explore-local.js';
import en from '../assets/js/locales/en.js';
import zhHans from '../assets/js/locales/zh-Hans.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

const [
  contract,
  pwsI8,
  pwsI9,
  fixtures,
  concepts,
  themes,
  nodes,
  localizedContent,
  assets,
  supportingQuestions,
  searchAliases,
  blueprint,
  page,
  controller,
  localModule,
  engineWrapper,
  engineCore,
  style,
  packageJson
] = await Promise.all([
  readJson('docs/pja/pja-w2-free-explore-rule-navigation-v1.json'),
  readJson(
    'docs/pws/contracts/pws-i8-free-observation-privacy-foundation-v1.json'
  ),
  readJson('docs/pws/contracts/pws-i9-rule-engine-foundation-v1.json'),
  readJson('tests/fixtures/pja-w2-free-explore-scenarios.json'),
  readJson('content/registry/concepts.json'),
  readJson('content/knowledge/registry/themes.json'),
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/localized-content.json'),
  readJson('content/knowledge/registry/assets.json'),
  readJson('content/knowledge/registry/supporting-questions.json'),
  readJson('content/knowledge/registry/search-aliases.json'),
  readJson('content/knowledge/blueprints/book-1-knowledge-blueprint.json'),
  read('explore.html'),
  read('assets/js/pages/free-explore.js'),
  read('assets/js/modules/free-explore-local.js'),
  read('functions/pws/intelligence/rule-engine.js'),
  read('assets/js/modules/pws-i9-rule-engine-core.js'),
  read('assets/css/free-explore.css'),
  readJson('package.json')
]);

assert.equal(
  contract.contractId,
  'phi-os.pja.free-explore-rule-navigation.v1'
);
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.programme, 'PJA-W2 Free Explore and Rule Navigation');
assert.equal(contract.status, 'implemented');
assert.deepEqual(contract.baseline, {
  repository: 'getphioscs-UX/phios',
  branch: 'main',
  commit: '0ad53eeb2461ff36b3e993841e162cecc9b15de6'
});
assert(contract.prerequisites.includes(pwsI8.freezeId));
assert(contract.prerequisites.includes(pwsI9.freezeId));

assert.deepEqual(contract.stages, [
  'Question',
  'Context',
  'Concept',
  'Example',
  'Reflection',
  'Navigation'
]);
assert.deepEqual(contract.allowedBeforePayment, [
  'select-question',
  'select-theme',
  'select-context',
  'select-content-preference',
  'select-understanding-depth',
  'save-local-observation'
]);
for (const value of Object.values(contract.prohibitedBeforePayment)) {
  assert.equal(value, false);
}
for (const value of Object.values(contract.preservation)) {
  assert.equal(value, false);
}

assert.equal(contract.surface.route, '/explore');
assert.equal(contract.surface.page, 'explore.html');
assert.equal(contract.surface.newTopLevelPageAdded, false);
assert.equal(contract.surface.realityAtlasPreserved, true);
assert.equal(contract.inputBoundary.presetSelectionsOnly, true);
assert.equal(contract.inputBoundary.freeTextFieldPresent, false);
assert.equal(contract.inputBoundary.fileFieldPresent, false);
assert.equal(contract.ruleProjection.forcedClassificationAllowed, false);
assert.equal(contract.ruleProjection.providerInvoked, false);
assert.equal(contract.ruleProjection.formalRoutePersisted, false);

assert.equal(
  contract.localSave.schemaVersion,
  FREE_EXPLORE_SCHEMA_VERSION
);
assert.equal(contract.localSave.storageKey, FREE_EXPLORE_STORAGE_KEY);
assert.equal(
  contract.localSave.maximumRecords,
  FREE_EXPLORE_MAXIMUM_RECORDS
);
assert.equal(
  contract.localSave.retentionDays,
  FREE_EXPLORE_RETENTION_DAYS
);
assert.equal(contract.localSave.serverSync, false);
assert.equal(contract.localSave.silentFormalization, false);

const routeFamilies = contract.navigation.allowedRouteFamilies
  .map(route => route.routeType);
assert.deepEqual(routeFamilies, [
  'articles',
  'videos',
  'figures',
  'books',
  'atlas',
  'free-observation',
  'reality-journey-pass-information',
  'professional-service-information'
]);
assert.deepEqual(contract.navigation.alwaysAvailable, [
  'continue-free-explore',
  'leave',
  'save-return-later'
]);
assert.equal(contract.navigation.specificPaidServiceDefault, false);
assert.equal(contract.navigation.professionalServiceInformationLast, true);
assert.equal(
  contract.navigation.allowedRouteFamilies
    .find(route => route.routeType === 'videos')?.rendered,
  false
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

for (const scenario of fixtures.ruleScenarios) {
  const result = evaluateQuestionRoute({
    questionId: scenario.id,
    question: scenario.question,
    locale: scenario.locale
  }, registries);

  assert.equal(
    result.routingBoundary,
    scenario.expectedBoundary,
    scenario.id
  );

  if ('expectedResourceCount' in scenario) {
    assert.equal(
      result.matchedResources.length,
      scenario.expectedResourceCount,
      scenario.id
    );
  }
  if (scenario.expectedResourceNodeCode) {
    assert(
      result.matchedResources.some(
        resource => resource.nodeCode === scenario.expectedResourceNodeCode
      ),
      scenario.id
    );
  }
  if ('individualAnalysisRequired' in scenario) {
    assert.equal(
      result.individualAnalysisRequired,
      scenario.individualAnalysisRequired,
      scenario.id
    );
  }
  if ('professionalResponsibilityRequired' in scenario) {
    assert.equal(
      result.professionalResponsibilityRequired,
      scenario.professionalResponsibilityRequired,
      scenario.id
    );
  }

  for (const resource of result.matchedResources) {
    const asset = assets.assets.find(
      record => record.assetCode === resource.assetCode
    );
    const localized = localizedContent.localizedContent
      .find(record => record.nodeCode === resource.nodeCode)
      ?.locales?.[resource.locale];

    for (const record of [asset, localized]) {
      assert.equal(record?.contentStatus, 'content_reviewed');
      assert.equal(record?.reviewStatus, 'approved');
      assert.equal(record?.publicationStatus, 'published');
    }
  }
}

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

const storage = new MemoryStorage();
const now = new Date('2026-07-30T08:00:00.000Z');

for (const [index, scenario] of fixtures.localSaveScenarios.entries()) {
  const session = createFreeExploreSession(
    scenario.selection,
    scenario.routeSummary,
    {
      now,
      currentStage: scenario.currentStage,
      idFactory: () => `free_explore_fixture_${index}`
    }
  );

  assert.equal(session.currentStage, scenario.currentStage);
  assert.deepEqual(session.selection, scenario.selection);
  assert.deepEqual(session.routeSummary, scenario.routeSummary);
  assert.equal(session.boundary.anonymous, true);
  assert.equal(session.boundary.storageLocation, 'browser_local_only');
  assert.equal(session.boundary.sensitiveDataStored, false);
  assert.equal(session.boundary.fullLifeStoryCollected, false);
  assert.equal(session.boundary.formalEvidenceCreated, false);
  assert.equal(session.boundary.formalReconstructionCreated, false);
  assert.equal(session.boundary.individualReadingCreated, false);
  assert.equal(session.boundary.professionalAssignmentCreated, false);
  assert.equal(session.boundary.providerInvoked, false);

  saveFreeExploreSession(session, storage, { now });
}

let stored = JSON.parse(storage.getItem(FREE_EXPLORE_STORAGE_KEY));
stored[0].unexpected = 'discard-me';
stored[0].boundary.providerInvoked = true;
stored[0].boundary.formalEvidenceCreated = true;
storage.setItem(FREE_EXPLORE_STORAGE_KEY, JSON.stringify(stored));

const normalized = loadFreeExploreSessions(storage, { now });
assert.equal(normalized.length, fixtures.localSaveScenarios.length);
assert.equal(Object.hasOwn(normalized[0], 'unexpected'), false);
assert.equal(normalized[0].boundary.providerInvoked, false);
assert.equal(normalized[0].boundary.formalEvidenceCreated, false);

assert.throws(
  () => createFreeExploreSession({
    ...fixtures.localSaveScenarios[1].selection,
    question: 'unregistered-question'
  }, fixtures.localSaveScenarios[1].routeSummary),
  /invalid_free_explore_question/
);

clearFreeExploreSession(normalized[0].sessionId, storage);
assert.equal(loadFreeExploreSessions(storage, { now }).length, 1);
clearAllFreeExploreSessions(storage);
assert.equal(loadFreeExploreSessions(storage, { now }).length, 0);

for (let index = 0; index < 10; index += 1) {
  const session = createFreeExploreSession(
    fixtures.localSaveScenarios[0].selection,
    null,
    {
      now,
      currentStage: 0,
      idFactory: () => `free_explore_limit_${index}`
    }
  );
  saveFreeExploreSession(session, storage, { now });
}
assert.equal(
  loadFreeExploreSessions(storage, { now }).length,
  FREE_EXPLORE_MAXIMUM_RECORDS
);

const expired = loadFreeExploreSessions(storage, {
  now: new Date('2026-08-30T08:00:01.000Z')
});
assert.equal(expired.length, 0);

const stagePositions = [
  'free-explore-question-title',
  'free-explore-context-title',
  'free-explore-concept-title',
  'free-explore-example-title',
  'free-explore-reflection-title',
  'free-explore-navigation-title'
].map(id => page.indexOf(`id="${id}"`));
assert(stagePositions.every(position => position >= 0));
assert.deepEqual([...stagePositions].sort((a, b) => a - b), stagePositions);
assert(page.indexOf('id="free-explore"') < page.indexOf('id="atlas-overview"'));
assert(page.includes('data-pja-w2-version="1.0.0"'));
assert(page.includes('data-rule-engine="PWS-I9"'));
assert(page.includes('data-storage-boundary="browser-local-only"'));
assert(page.includes('/assets/css/free-explore.css'));
assert(page.includes('/assets/js/pages/free-explore.js'));
assert.equal(/<textarea\b/i.test(page), false);
assert.equal(/<input[^>]+type=["'](?:text|email|tel|file|password)/i.test(page), false);

for (const name of [
  'question',
  'theme',
  'context',
  'contentPreference',
  'depth',
  'reflection'
]) {
  assert(page.includes(`name="${name}"`), `Missing preset field: ${name}`);
}

for (const route of [
  'articles',
  'figures',
  'books',
  'atlas',
  'free-observation',
  'reality-journey-pass-information',
  'professional-service-information'
]) {
  assert(
    page.includes(`data-route-type="${route}"`),
    `Missing navigation route: ${route}`
  );
}
assert.equal(page.includes('data-route-type="videos"'), false);
assert(
  page.indexOf('data-route-type="professional-service-information"') >
  page.indexOf('data-route-type="free-observation"')
);
assert(page.includes('data-free-restart'));
assert(page.includes('data-free-save'));
assert(page.includes('class="free-explore__always-action" href="/"'));

for (const forbidden of [
  '/api/',
  'openai',
  'workers-ai',
  'createassignment',
  'professionalqueue'
]) {
  assert.equal(
    controller.toLowerCase().includes(forbidden),
    false,
    `Free Explore controller contains forbidden dependency: ${forbidden}`
  );
}
for (const registryPath of pwsI9.knowledgeSources) {
  assert(
    controller.includes(`/${registryPath}`),
    `Controller does not read frozen registry: ${registryPath}`
  );
}
assert(controller.includes("from '../modules/pws-i9-rule-engine-core.js'"));
assert(controller.includes('credentials: \'same-origin\''));
assert(localModule.includes('browser_local_only'));
assert.equal(localModule.includes('fetch('), false);

assert(
  engineWrapper.includes(
    '../../../assets/js/modules/pws-i9-rule-engine-core.js'
  )
);
for (const forbidden of [
  'fetch(',
  '/api/',
  'openai',
  'workers-ai',
  'createassignment',
  'professionalqueue'
]) {
  assert.equal(
    engineCore.toLowerCase().includes(forbidden),
    false,
    `Shared Rule Engine contains forbidden dependency: ${forbidden}`
  );
}

for (const dictionary of [en, zhHans]) {
  assert(dictionary.freeExplore);
  assert.equal(
    Object.keys(dictionary.freeExplore.progress).length >= 8,
    true
  );
  assert.deepEqual(
    Object.keys(dictionary.freeExplore.question.options),
    [
      'phi_os_needed',
      'explanation_reality',
      'navigation_position',
      'computation_direction',
      'personal_decision_boundary'
    ]
  );
}

assert(style.includes('@media (max-width: 900px)'));
assert(style.includes('@media (max-width: 600px)'));
assert(style.includes('@media (prefers-reduced-motion: reduce)'));
assert(style.includes('min-height: 3rem'));

assert.equal(
  packageJson.scripts['check:pja-w2'],
  'node scripts/check-pja-w2-free-explore-rule-navigation.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'scripts/check-pja-w2-free-explore-rule-navigation.mjs'
  )
);

console.log(
  '✓ PJA-W2 Free Explore passed: six-stage bilingual rule navigation, ' +
  'published-only knowledge projection, local preset-only drafts and ' +
  'non-commercial exits remain available without formal case creation.'
);
