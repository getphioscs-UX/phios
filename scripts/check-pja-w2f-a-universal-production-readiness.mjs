import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  compileReadinessSchema,
  initializeReadinessRecord,
  loadKnowledgeInventory,
  READINESS_ERROR_CODES,
  READINESS_INDEX_PATH,
  READINESS_SCHEMA_VERSION,
  readReadiness,
  resolveKnowledgeScope,
  validateReadinessRecord
} from './lib/knowledge-production/readiness-system.mjs';
import { sha256 } from './lib/knowledge-production/checksum.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const textSha256 = value => sha256(Buffer.from(value).toString('utf8').replace(/\r\n?/g, '\n'));
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const protectedFiles = [
  'content/knowledge/registry/learning-paths.json',
  'content/knowledge/registry/supporting-questions.json',
  'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  'content/knowledge/schemas/article-v2.schema.json',
  'content/knowledge/schemas/claim.schema.json',
  'docs/knowledge/PJA-article-renderer-contract.md',
  'scripts/import-canonical-article-package.mjs'
];
const W2E_CHECK = 'check:pja-w2e';
const W2E_R1_CHECK = 'check:pja-w2e-r1';
const W2F_A_CHECK = 'check:pja-w2f-a';
const W2F_B1_CHECK = 'check:pja-w2f-b1';
const W2E_CHECKER = 'scripts/check-pja-w2e-production-tools.mjs';
const W2E_R1_CHECKER = 'scripts/check-pja-w2e-r1-production-brief-hardening.mjs';
const W2F_A_CHECKER = 'scripts/check-pja-w2f-a-universal-production-readiness.mjs';

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['knowledge:init-readiness'],
  'node scripts/initialize-canonical-production-readiness.mjs'
);
assert.equal(
  packageJson.scripts['knowledge:validate-readiness'],
  'node scripts/validate-canonical-production-readiness.mjs'
);
validateCheckDependencyContract(packageJson.scripts);
testCheckDependencyContract(packageJson.scripts);
validatePrecheckDependencyContract(packageJson.scripts.precheck);
assert.equal(READINESS_ERROR_CODES.length, 40);

const knowledge = await loadKnowledgeInventory(root);
const blueprint = knowledge.blueprints[0];
const productionInventory = resolveKnowledgeScope(knowledge, {
  scope: 'PREFACE'
});
const registeredIdentityCount = knowledge.inventory.length;
const prefacePilotCount = productionInventory.length;
const registryPresentProductionDeferredCount = registeredIdentityCount - prefacePilotCount;
assert.equal(knowledge.inventory.length, blueprint.plannedCanonicalNodes);
assert.equal(registeredIdentityCount, 78);
assert.equal(prefacePilotCount, 13);
assert.equal(registryPresentProductionDeferredCount, 65);
assert.equal(
  knowledge.questions.supportingQuestions.length,
  productionInventory.reduce((total, item) => total + item.supportingQuestions.length, 0)
);
assert.equal(blueprint.nodes.length, blueprint.plannedCanonicalNodes);
assert.equal(
  resolveKnowledgeScope(knowledge, { scope: 'ALL' }).length,
  blueprint.plannedCanonicalNodes
);
assert.equal(
  productionInventory.length,
  blueprint.prefaceCanonicalNodes
);
assert.equal(
  resolveKnowledgeScope(knowledge, { scope: 'BOOK-1' }).length,
  blueprint.plannedCanonicalNodes
);
assert(resolveKnowledgeScope(knowledge, { scope: 'PART-1' }).length > 0);
assert.equal(
  resolveKnowledgeScope(knowledge, { nodeCode: 'KN-B1-P1-001' }).length,
  1
);

const schema = await compileReadinessSchema(root);
const statusCounts = {
  production_ready: 0,
  ready_for_editorial_review: 0,
  production_blocked: 0
};
const thesisStatements = new Map();
for (const item of productionInventory) {
  const loaded = await readReadiness(root, item);
  const result = validateReadinessRecord(item, loaded, schema);
  assert.equal(result.schemaValid, true, `${item.nodeCode}: ${result.errors}`);
  statusCounts[result.status] += 1;
  const statement = loaded.legacy
    ? loaded.record.centralThesis
    : loaded.record.canonicalThesis.statement;
  if (statement) {
    assert.equal(thesisStatements.has(statement), false, 'CANONICAL_THESIS_DUPLICATED');
    thesisStatements.set(statement, item.nodeCode);
  }
  if (!loaded.legacy) {
    if (item.nodeCode === 'KN-PREFACE-001') {
      assert.equal(loaded.record.review.humanFrozen, true);
      assert.equal(loaded.record.productionReadiness.status, 'production_ready');
      assert(loaded.record.canonicalThesis.statement.length > 0);
    } else {
      assert.equal(loaded.record.review.humanFrozen, false);
      assert.equal(loaded.record.productionReadiness.status, 'production_blocked');
      assert.equal(loaded.record.canonicalThesis.statement, null);
    }
  }
}
assert.equal(
  Object.values(statusCounts).reduce((total, count) => total + count, 0),
  productionInventory.length
);
assert.equal(statusCounts.production_ready, productionInventory.filter(
  item => item.nodeCode === 'KN-PREFACE-001'
).length);
assert.equal(
  statusCounts.production_blocked,
  productionInventory.length - statusCounts.production_ready
);

const index = await readJson(READINESS_INDEX_PATH);
assert.equal(index.sourceOfTruth, false);
assert.equal(index.entries.length, productionInventory.length);
assert.deepEqual(
  index.entries.map(entry => entry.nodeCode),
  productionInventory.map(item => item.nodeCode)
);
assert((await read('docs/pja/PJA-W2F-A-CANONICAL-READINESS-INVENTORY.md'))
  .includes(`Registry-present, production-deferred: ${registryPresentProductionDeferredCount}`));

const questionOwners = new Map();
for (const question of knowledge.questions.supportingQuestions) {
  const code = question.questionCode || question.supportingQuestionCode;
  const owner = question.canonicalNodeCode || question.primaryNodeCode;
  assert(knowledge.inventory.some(item => item.nodeCode === owner));
  assert.equal(questionOwners.has(code), false, 'SUPPORTING_QUESTION_MULTI_ASSIGNED');
  questionOwners.set(code, owner);
}

const fixtureCatalog = await readJson(
  'tests/fixtures/knowledge/readiness/fixture-catalog.json'
);
assert.equal(fixtureCatalog.validCases.length, 11);
assert.equal(fixtureCatalog.invalidCases.length, 25);
assert.equal(fixtureCatalog.productionAuthority, false);

const synthetic = makeSyntheticKnowledge();
for (const scope of [
  'PART-1', 'PART-2', 'PART-3', 'PART-4', 'PART-5',
  'BOOK-1', 'BOOK-2', 'BOOK-3', 'KN-B3-P14'
]) {
  assert(resolveKnowledgeScope(synthetic, { scope }).length > 0, scope);
}
assert.equal(resolveKnowledgeScope(synthetic, { scope: 'ALL' }).length, 8);
const futureItem = synthetic.inventory.at(-1);
const futureRecord = initializeReadinessRecord(futureItem, synthetic);
assert.equal(schema(futureRecord), true, JSON.stringify(schema.errors));
assert.equal(futureRecord.hierarchy.bookCode, 'BOOK-III');
assert.equal(futureRecord.hierarchy.partCode, 'P14');
assert.equal(futureRecord.productionReadiness.status, 'production_blocked');

const productionReady = structuredClone(futureRecord);
completeForHumanFixture(productionReady);
let result = validateReadinessRecord(
  futureItem,
  { record: productionReady, legacy: false },
  schema
);
assert.equal(result.schemaValid, true, result.errors);
assert.equal(result.status, 'production_ready');

const invalidMutations = [
  record => { record.canonicalThesis.statement = record.canonicalIdentity.localizedQuestion; },
  record => { record.hierarchy.bookCode = 'BOOK-WRONG'; },
  record => { record.hierarchy.partCode = 'P99'; },
  record => { record.nodeCode = 'KN-WRONG-001'; },
  record => { record.sequenceBoundary.previousNode = 'KN-WRONG-001'; },
  record => { record.sequenceBoundary.nextNode = 'KN-WRONG-002'; },
  record => { record.productionReadiness.status = 'unknown'; },
  record => { record.locale = 'xx-invalid'; },
  record => { record.versionBinding = {}; },
  record => { record.review.blockingFindings = ['Blocking fixture']; }
];
for (const mutate of invalidMutations) {
  const invalid = structuredClone(productionReady);
  mutate(invalid);
  result = validateReadinessRecord(
    futureItem,
    { record: invalid, legacy: false },
    schema
  );
  assert.equal(result.schemaValid, false);
}

const [exporter, resolver] = await Promise.all([
  read('scripts/export-knowledge-production-brief.mjs'),
  read('scripts/lib/knowledge-production/readiness-system.mjs')
]);
assert(!/KN-PREFACE-00[2-9]|KN-B1-P[1-5]-00/.test(exporter));
assert(!/\[\s*['"]KN-PREFACE/.test(resolver));
assert(!resolver.includes('78'));
assert(resolver.includes('blueprintFiles'));

const commands = [
  ['scripts/initialize-canonical-production-readiness.mjs', ['--scope', 'PREFACE']],
  ['scripts/validate-canonical-production-readiness.mjs', ['--scope', 'PREFACE']],
  ['scripts/export-knowledge-production-brief.mjs', [
    '--scope', 'PREFACE', '--output', '.tmp/pja-w2f-batch'
  ]]
];
for (const [script, args] of commands) {
  const { stdout } = await execFileAsync(process.execPath, [script, ...args], {
    cwd: root,
    windowsHide: true
  });
  if (script.includes('initialize')) {
    assert(stdout.includes(`Existing preserved: ${productionInventory.length}`));
  }
}
await fs.rm(path.join(root, '.tmp/pja-w2f-batch'), {
  recursive: true,
  force: true
});

for (const file of protectedFiles) {
  const [current, baseline] = await Promise.all([
    fs.readFile(path.join(root, file)),
    gitFile(file)
  ]);
  assert.equal(textSha256(current), textSha256(baseline), `Protected file changed: ${file}`);
}
const legacyCurrent = await fs.readFile(
  path.join(root, 'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json')
);
const legacyBaseline = await gitFile(
  'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json'
);
assert.equal(textSha256(legacyCurrent), textSha256(legacyBaseline));

console.log('✓ PJA-W2F-A Universal Canonical Production Readiness passed.');
console.log(`  ${registeredIdentityCount} Canonical Node identities are registered; Readiness remains limited to the ${prefacePilotCount}-Node Preface pilot.`);
console.log(`  ${registryPresentProductionDeferredCount} P1–P5 identities have no Editorial Production Readiness record and remain production-deferred; universal fixtures cover P1–P14 and Books I–III.`);
console.log(`  ${productionInventory.length - statusCounts.production_ready} Preface Skeletons remain blocked and the human-frozen pilot is preserved.`);
console.log('  No Skeleton is production_ready; Thesis, boundary and human authority gates remain blocking.');
console.log('  Scope, hierarchy, continuity, Supporting Question, duplication, future-pattern and batch-export behavior passed.');

function contractError(code, detail) {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  return error;
}

function parseCommandChain(command, scriptName) {
  if (typeof command !== 'string' || command.trim() === '') {
    throw contractError('CHECK_DEPENDENCY_SCRIPT_MISSING', scriptName);
  }
  const withoutPortableAnd = command.replaceAll('&&', '');
  if (/[\r\n;&|<>`]|\$\(/.test(withoutPortableAnd)) {
    throw contractError('CHECK_DEPENDENCY_NON_PORTABLE', scriptName);
  }
  const segments = command.split(/\s*&&\s*/).map(segment => segment.trim());
  if (segments.some(segment => segment === '')) {
    throw contractError('CHECK_DEPENDENCY_COMMAND_INVALID', scriptName);
  }
  return segments.map(segment => {
    const tokens = [...segment.matchAll(/"([^"]*)"|'([^']*)'|([^\s]+)/g)]
      .map(match => match[1] ?? match[2] ?? match[3]);
    if (tokens.length === 0) {
      throw contractError('CHECK_DEPENDENCY_COMMAND_INVALID', scriptName);
    }
    return { segment, tokens };
  });
}

function npmRunTarget(command) {
  const [executable, action, target] = command.tokens;
  return executable === 'npm' && action === 'run' ? target : null;
}

function executesNodeChecker(command, checkerPath) {
  const [executable, target] = command.tokens;
  return ['node', 'node.exe'].includes(path.basename(executable).toLowerCase())
    && target === checkerPath;
}

function assertNoReverseDependency(scripts) {
  const r1Chain = parseCommandChain(scripts[W2E_R1_CHECK], W2E_R1_CHECK);
  if (r1Chain.some(command => npmRunTarget(command) === W2F_A_CHECK)) {
    throw contractError(
      'CHECK_DEPENDENCY_REVERSE',
      `${W2E_R1_CHECK} must not invoke ${W2F_A_CHECK}`
    );
  }
}

function buildCheckGraph(scripts) {
  const entries = Object.entries(scripts)
    .filter(([name]) => name.startsWith('check:pja-'));
  const knownChecks = new Set(entries.map(([name]) => name));
  return new Map(entries.map(([name, command]) => [
    name,
    parseCommandChain(command, name)
      .map(npmRunTarget)
      .filter(target => knownChecks.has(target))
  ]));
}

function assertAcyclicCheckGraph(graph) {
  const visiting = new Set();
  const visited = new Set();
  const visit = (name, chain = []) => {
    if (visiting.has(name)) {
      throw contractError(
        'CHECK_DEPENDENCY_CYCLE',
        [...chain, name].join(' -> ')
      );
    }
    if (visited.has(name)) return;
    visiting.add(name);
    for (const dependency of graph.get(name) || []) {
      visit(dependency, [...chain, name]);
    }
    visiting.delete(name);
    visited.add(name);
  };
  for (const name of graph.keys()) visit(name);
}

function validateCheckDependencyContract(scripts) {
  const chain = parseCommandChain(scripts[W2F_A_CHECK], W2F_A_CHECK);
  const runTargets = chain.map(npmRunTarget).filter(Boolean);
  const predecessorIndexes = chain
    .map((command, index) => npmRunTarget(command) === W2E_R1_CHECK ? index : -1)
    .filter(index => index >= 0);
  const checkerIndexes = chain
    .map((command, index) => executesNodeChecker(command, W2F_A_CHECKER) ? index : -1)
    .filter(index => index >= 0);

  if (runTargets.includes(W2F_A_CHECK)) {
    throw contractError('CHECK_DEPENDENCY_SELF', W2F_A_CHECK);
  }
  if (runTargets.includes(W2F_B1_CHECK)
    || runTargets.some(target => target.startsWith(`${W2F_B1_CHECK}:`))) {
    throw contractError('CHECK_DEPENDENCY_FUTURE_STAGE', W2F_B1_CHECK);
  }
  assertNoReverseDependency(scripts);
  if (predecessorIndexes.length !== 1) {
    throw contractError(
      predecessorIndexes.length === 0
        ? 'CHECK_DEPENDENCY_PREDECESSOR_MISSING'
        : 'CHECK_DEPENDENCY_DUPLICATED',
      W2E_R1_CHECK
    );
  }
  if (runTargets.includes(W2E_CHECK)) {
    throw contractError('CHECK_DEPENDENCY_DUPLICATED', W2E_CHECK);
  }
  if (checkerIndexes.length !== 1) {
    throw contractError(
      checkerIndexes.length === 0
        ? 'CHECK_DEPENDENCY_CHECKER_MISSING'
        : 'CHECK_DEPENDENCY_DUPLICATED',
      W2F_A_CHECKER
    );
  }
  if (predecessorIndexes[0] > checkerIndexes[0]) {
    throw contractError(
      'CHECK_DEPENDENCY_ORDER_INVALID',
      `${W2E_R1_CHECK} must run before ${W2F_A_CHECKER}`
    );
  }
  assertAcyclicCheckGraph(buildCheckGraph(scripts));
}

function validatePrecheckDependencyContract(precheck) {
  const chain = parseCommandChain(precheck, 'precheck');
  const checkerPaths = [W2E_CHECKER, W2E_R1_CHECKER, W2F_A_CHECKER];
  const indexes = checkerPaths.map(checkerPath => chain
    .map((command, index) => executesNodeChecker(command, checkerPath) ? index : -1)
    .filter(index => index >= 0));
  for (let index = 0; index < checkerPaths.length; index += 1) {
    if (indexes[index].length !== 1) {
      throw contractError(
        indexes[index].length === 0
          ? 'CHECK_DEPENDENCY_CHECKER_MISSING'
          : 'CHECK_DEPENDENCY_DUPLICATED',
        `precheck:${checkerPaths[index]}`
      );
    }
  }
  if (!(indexes[0][0] < indexes[1][0] && indexes[1][0] < indexes[2][0])) {
    throw contractError(
      'CHECK_DEPENDENCY_ORDER_INVALID',
      `precheck:${checkerPaths.join(' -> ')}`
    );
  }
  if (chain.some(command => command.tokens
    .some(token => token.includes('check-pja-w2f-b1')))) {
    throw contractError('CHECK_DEPENDENCY_FUTURE_STAGE', 'precheck');
  }
}

function testCheckDependencyContract(scripts) {
  const validVariant = {
    ...scripts,
    [W2F_A_CHECK]:
      `npm   run   "${W2E_R1_CHECK}" && node '${W2F_A_CHECKER}'`
  };
  assert.doesNotThrow(() => validateCheckDependencyContract(validVariant));

  const invalidFixtures = [
    {
      code: 'CHECK_DEPENDENCY_REVERSE',
      scripts: {
        ...validVariant,
        [W2E_R1_CHECK]:
          `npm run ${W2F_A_CHECK} && node scripts/check-pja-w2e-r1-production-brief-hardening.mjs`
      }
    },
    {
      code: 'CHECK_DEPENDENCY_SELF',
      scripts: {
        ...validVariant,
        [W2F_A_CHECK]:
          `npm run ${W2E_R1_CHECK} && npm run ${W2F_A_CHECK} && node ${W2F_A_CHECKER}`
      }
    },
    {
      code: 'CHECK_DEPENDENCY_FUTURE_STAGE',
      scripts: {
        ...validVariant,
        [W2F_A_CHECK]:
          `npm run ${W2E_R1_CHECK} && npm run ${W2F_B1_CHECK} && node ${W2F_A_CHECKER}`
      }
    },
    {
      code: 'CHECK_DEPENDENCY_PREDECESSOR_MISSING',
      scripts: {
        ...validVariant,
        [W2F_A_CHECK]: `node ${W2F_A_CHECKER}`
      }
    },
    {
      code: 'CHECK_DEPENDENCY_NON_PORTABLE',
      scripts: {
        ...validVariant,
        [W2F_A_CHECK]:
          `npm run ${W2E_R1_CHECK}; node ${W2F_A_CHECKER}`
      }
    }
  ];
  for (const fixture of invalidFixtures) {
    assert.throws(
      () => validateCheckDependencyContract(fixture.scripts),
      error => error.code === fixture.code,
      fixture.code
    );
  }

  const cyclicScripts = {
    ...validVariant,
    [W2E_R1_CHECK]:
      `npm run ${W2F_A_CHECK} && node scripts/check-pja-w2e-r1-production-brief-hardening.mjs`
  };
  assert.throws(
    () => assertAcyclicCheckGraph(buildCheckGraph(cyclicScripts)),
    error => error.code === 'CHECK_DEPENDENCY_CYCLE',
    'CHECK_DEPENDENCY_CYCLE'
  );
}

async function gitFile(file) {
  const { stdout } = await execFileAsync('git', ['show', `HEAD:${file}`], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024
  });
  return stdout;
}

function makeSyntheticKnowledge() {
  const definitions = [
    ['BOOK-I', 1, 'P1', 'KN-B1-P1-001'],
    ['BOOK-I', 1, 'P1', 'KN-B1-P1-006'],
    ['BOOK-I', 1, 'P2', 'KN-B1-P2-001'],
    ['BOOK-I', 1, 'P3', 'KN-B1-P3-001'],
    ['BOOK-I', 1, 'P4', 'KN-B1-P4-001'],
    ['BOOK-I', 1, 'P5', 'KN-B1-P5-013'],
    ['BOOK-II', 2, 'P6', 'KN-B2-P6-001'],
    ['BOOK-III', 3, 'P14', 'KN-B3-P14-001']
  ];
  const inventory = definitions.map(([bookCode, bookNumber, partCode, nodeCode], index) => {
    const question = `Fixture question ${index + 1}?`;
    const node = {
      nodeCode,
      canonicalQuestionKey: `fixture-${index + 1}`,
      canonicalLanguage: 'zh-Hans',
      registryStatus: 'fixture_registered',
      themeCode: `TH-FIXTURE-${index + 1}`,
      nodeType: 'mechanism_question',
      relationships: {
        prerequisiteNodeCodes: index ? [definitions[index - 1][3]] : [],
        nextNodeCodes: index < definitions.length - 1
          ? [definitions[index + 1][3]]
          : []
      },
      sourceReferences: []
    };
    const blueprint = {
      bookCode,
      bookTitleZhHans: `${bookCode} fixture`,
      contract: `${bookCode}-FIXTURE-v1.0.0`
    };
    const blueprintNode = {
      nodeCode,
      partCode,
      titleZhHans: `Fixture title ${index + 1}`,
      status: 'fixture_registered'
    };
    return {
      index,
      node,
      nodeCode,
      membership: { blueprint, blueprintNode, bookNumber },
      blueprintNode,
      blueprint,
      part: { partCode, title: `${partCode} fixture` },
      bookCode,
      bookNumber,
      partCode,
      localizedRecord: {
        nodeCode,
        locales: {
          'zh-Hans': {
            locale: 'zh-Hans',
            displayQuestion: question,
            slug: `fixture-${index + 1}`
          }
        }
      },
      supportingQuestions: [],
      previousNode: index ? definitions[index - 1][3] : null,
      nextNode: index < definitions.length - 1
        ? definitions[index + 1][3]
        : null,
      learningPaths: []
    };
  });
  return {
    inventory,
    nodes: { version: 'fixture-v1.0.0' },
    localized: {},
    questions: { supportingQuestions: [] },
    learningPaths: { learningPaths: [] },
    blueprints: [],
    parts: []
  };
}

function completeForHumanFixture(record) {
  record.canonicalThesis = {
    thesisVersion: '1.0.0',
    statement: 'Fixture thesis establishes a bounded future-node mechanism.',
    mechanism: 'Fixture mechanism.',
    necessity: 'Fixture necessity.',
    systemRole: 'Fixture system role.',
    continuity: {
      fromPreviousNode: 'Fixture previous contribution.',
      toNextNode: 'Fixture next preparation.'
    }
  };
  record.articleBoundary = {
    boundaryVersion: '1.0.0',
    mustEstablish: ['Fixture mechanism'],
    mustNotClaim: ['No factual or production authority'],
    includedScope: ['Fixture scope'],
    excludedScope: ['Production content'],
    assumptions: ['Fixture-only'],
    unresolvedQuestions: []
  };
  record.claimBoundary.requiredClaimFamilies = ['fixture'];
  record.claimBoundary.allowedClaimTypes = ['phi_os_interpretation'];
  record.sourceBoundary.sourceRequirement = ['Fixture source review'];
  record.figureBoundary.figureRequirement = 'none';
  record.publicContentBoundary.publicKnowledgeBoundary = ['Fixture public boundary'];
  record.publicContentBoundary.paidBookBoundary = ['No paid content'];
  record.publicContentBoundary.runtimeJourneyBoundary = ['No Runtime'];
  record.publicContentBoundary.professionalServiceBoundary = ['No advice'];
  record.publicContentBoundary.enterpriseBoundary = ['No implementation'];
  record.publicContentBoundary.developerBoundary = ['No internal docs'];
  record.sequenceBoundary.previousNodeContribution = 'Fixture previous';
  record.sequenceBoundary.currentNodeTransformation = 'Fixture transformation';
  record.sequenceBoundary.nextNodePreparation = 'Fixture next';
  record.sequenceBoundary.partContribution = 'Fixture part';
  record.sequenceBoundary.bookContribution = 'Fixture book';
  record.sequenceBoundary.systemContribution = 'Fixture system';
  record.localizationReadiness.canonicalThesis = 'production_ready';
  record.localizationReadiness.articleBoundary = 'production_ready';
  record.localizationReadiness.supportingQuestions = 'production_ready';
  record.localizationReadiness.searchAliases = 'production_ready';
  record.localizationReadiness.terminologyReview = 'approved';
  record.localizationReadiness.languageStatus = 'production_ready';
  record.productionReadiness = {
    readinessVersion: '1.0.0',
    status: 'production_ready',
    missingFields: [],
    blockingReasons: []
  };
  record.review = {
    status: 'approved',
    humanFrozen: true,
    reviewedBy: 'FIXTURE-HUMAN',
    reviewedAt: '2000-01-01T00:00:00Z',
    blockingFindings: []
  };
}
