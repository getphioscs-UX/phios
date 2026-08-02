import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  compileReadinessSchema,
  loadKnowledgeInventory,
  readReadiness,
  resolveKnowledgeScope,
  validateReadinessRecord
} from './lib/knowledge-production/readiness-system.mjs';
import { sha256 } from './lib/knowledge-production/checksum.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const textSha256 = value => sha256(Buffer.from(value).toString('utf8').replace(/\r\n?/g, '\n'));
const stageTitle = 'PJA-W2F-B1｜Universal Contract and Preface Pilot';
const systemScope = 'ALL_REGISTERED_CANONICAL_NODES';
const pilotScope = 'PREFACE';
const pilotExcludedNode = 'KN-PREFACE-001';
const checkerPath =
  'scripts/check-pja-w2f-b1-preface-content-population.mjs';
const reportPath =
  'docs/pja/PJA-W2F-B1-PREFACE-CONTENT-POPULATION.md';
const temporaryRelative = '.tmp/pja-w2f-b1-check';
const temporary = path.join(root, temporaryRelative);
const allowedTreatments = new Set([
  'integrate',
  'briefly_address',
  'defer',
  'faq_candidate',
  'supporting_article_candidate',
  'video_candidate',
  'exclude'
]);
const protectedFiles = [
  'content/knowledge/registry/learning-paths.json',
  'content/knowledge/registry/supporting-questions.json',
  'content/knowledge/registry/sources.json',
  'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  'content/knowledge/editorial/schemas/canonical-article.schema.json',
  'content/knowledge/editorial/schemas/canonical-production-readiness.schema.json',
  'content/knowledge/editorial/schemas/claim-review-record.schema.json',
  'content/knowledge/editorial/readiness/universal-production-readiness-contract.json',
  'docs/pja/pja-w2a-canonical-article-editorial-contract-v1.json',
  'docs/knowledge/PJA-article-renderer-contract.md',
  'scripts/check-pja-w2e-r1-production-brief-hardening.mjs',
  'scripts/initialize-canonical-production-readiness.mjs',
  'scripts/validate-canonical-production-readiness.mjs',
  'scripts/lib/knowledge-production/readiness-system.mjs',
  'scripts/import-canonical-article-package.mjs'
];

await fs.rm(temporary, { recursive: true, force: true });
await fs.mkdir(temporary, { recursive: true });
try {
  const [packageJson, report, editorialContract, sourceRegistry] =
    await Promise.all([
      readJson('package.json'),
      read(reportPath),
      readJson('docs/pja/pja-w2a-canonical-article-editorial-contract-v1.json'),
      readJson('content/knowledge/registry/sources.json')
    ]);

  validatePackageDependency(packageJson.scripts);
  assert(report.startsWith(`# ${stageTitle}\n`));
  assert(report.includes('System Scope: Universal Canonical Content Population Contract'));
  assert(report.includes('Pilot Scope: KN-PREFACE-002–013'));
  assert(report.includes('Preface is the pilot scope, not the system boundary.'));
  validateEditorialAuthority(editorialContract);

  const knowledge = await loadKnowledgeInventory(root);
  const schema = await compileReadinessSchema(root);
  const allNodes = resolveKnowledgeScope(knowledge, { scope: 'ALL' });
  const prefaceNodes = resolveKnowledgeScope(knowledge, { scope: pilotScope });
  const pilotNodes = prefaceNodes.filter(
    item => item.nodeCode !== pilotExcludedNode
  );

  assert.equal(systemScope, 'ALL_REGISTERED_CANONICAL_NODES');
  assert.equal(allNodes.length, knowledge.inventory.length);
  assert.equal(prefaceNodes.length, knowledge.blueprints[0].prefaceCanonicalNodes);
  assert.equal(pilotNodes.length, prefaceNodes.length - 1);
  assert(pilotNodes.every(item => item.partCode === 'P0'));
  assert.equal(
    knowledge.questions.supportingQuestions.length,
    prefaceNodes.reduce((total, item) => total + item.supportingQuestions.length, 0)
  );
  assert.equal(
    knowledge.blueprints[0].nodes.length,
    knowledge.blueprints[0].plannedCanonicalNodes
  );

  const sourceCodes = new Set(
    sourceRegistry.sources.map(source => source.sourceCode)
  );
  const questionOwners = new Map();
  for (const question of knowledge.questions.supportingQuestions) {
    const questionCode =
      question.questionCode || question.supportingQuestionCode;
    const owner = question.canonicalNodeCode || question.primaryNodeCode;
    assert(questionCode);
    assert(owner);
    assert.equal(questionOwners.has(questionCode), false);
    assert(knowledge.inventory.some(item => item.nodeCode === owner));
    questionOwners.set(questionCode, owner);
  }

  const readinessIndex = await readJson(
    'content/knowledge/editorial/readiness/canonical-production-readiness-index.json'
  );
  assert.equal(readinessIndex.entries.length, prefaceNodes.length);
  const indexByNode = new Map(
    readinessIndex.entries.map(entry => [entry.nodeCode, entry])
  );
  const thesisOwners = new Map();
  const boundaryOwners = new Map();
  const pilotAssessments = [];
  let humanFrozen = 0;
  let productionReady = 0;
  let blocked = 0;
  let assignedPilotQuestions = 0;

  for (const item of prefaceNodes) {
    const loaded = await readReadiness(root, item);
    const validation = validateReadinessRecord(item, loaded, schema);
    assert.equal(validation.schemaValid, true, `${item.nodeCode}: ${validation.errors}`);
    const indexEntry = indexByNode.get(item.nodeCode);
    assert(indexEntry);
    assert.equal(indexEntry.productionStatus, validation.status);
    assert.equal(indexEntry.exportability, validation.exportability);

    assert.equal(loaded.legacy, false);
    const record = loaded.record;
    const expectedQuestionCodes = new Set(item.supportingQuestions.map(
      question => question.questionCode || question.supportingQuestionCode
    ));
    assert.equal(
      record.supportingQuestionBoundary.length,
      expectedQuestionCodes.size,
      `${item.nodeCode}: supporting question count`
    );
    for (const mapping of record.supportingQuestionBoundary) {
      assert(expectedQuestionCodes.has(mapping.questionCode));
      assert.equal(mapping.primaryNodeCode, item.nodeCode);
      assert(allowedTreatments.has(mapping.articleTreatment));
      assignedPilotQuestions += 1;
    }
    for (const sourceCode of [
      ...record.sourceBoundary.internalCanonicalSources,
      ...record.sourceBoundary.knownSources
    ]) assert(sourceCodes.has(sourceCode), `${item.nodeCode}: ${sourceCode}`);

    const assessment = assessContentPopulationRecord(
      record,
      expectedQuestionCodes.size
    );
    pilotAssessments.push({
      nodeCode: item.nodeCode,
      validation,
      assessment
    });
    if (record.review.humanFrozen) humanFrozen += 1;
    if (validation.status === 'production_ready') {
      productionReady += 1;
      assert.equal(assessment.complete, true, item.nodeCode);
      assert.equal(record.review.status, 'approved');
      assert(record.review.reviewedBy);
      assert(record.review.reviewedAt);
    } else {
      blocked += 1;
      assert(record.productionReadiness.blockingReasons.length > 0);
      assert(record.productionReadiness.missingFields.length > 0);
      assert(assessment.pendingHumanDecisions.length > 0);
      assert.equal(record.review.humanFrozen, false);
    }

    registerUnique(
      thesisOwners,
      normalize(record.canonicalThesis.statement),
      item.nodeCode,
      'CANONICAL_THESIS_DUPLICATED'
    );
    const boundarySignature = [
      ...record.articleBoundary.mustEstablish,
      ...record.articleBoundary.requiredDistinctions || [],
      ...record.articleBoundary.mustNotClaim,
      ...record.articleBoundary.includedScope,
      ...record.articleBoundary.excludedScope
    ].map(normalize).filter(Boolean).join('|');
    registerUnique(
      boundaryOwners,
      boundarySignature,
      item.nodeCode,
      'ARTICLE_BOUNDARY_DUPLICATED'
    );
  }

  assert.equal(
    assignedPilotQuestions,
    prefaceNodes.reduce((total, item) => total + item.supportingQuestions.length, 0)
  );
  assert.equal(humanFrozen, 1);
  assert.equal(productionReady, 1);
  assert.equal(blocked, prefaceNodes.length - productionReady);
  assert.equal(
    pilotAssessments.filter(assessment => (
      assessment.validation.status === 'production_ready'
    )).length,
    1
  );

  const futureFixture = structuredClone(
    (await readReadiness(root, pilotNodes[0])).record
  );
  futureFixture.nodeCode = 'KN-B3-P14-FUTURE-FIXTURE';
  futureFixture.canonicalIdentity.nodeCode = futureFixture.nodeCode;
  futureFixture.hierarchy.nodeCode = futureFixture.nodeCode;
  const futureAssessment = assessContentPopulationRecord(futureFixture, 0);
  assert.equal(futureAssessment.complete, false);
  assert(futureAssessment.pendingHumanDecisions.includes(
    'Missing Human Editorial Freeze'
  ));

  await verifyExporter(pilotAssessments);

  for (const file of protectedFiles) {
    const [current, baseline] = await Promise.all([
      fs.readFile(path.join(root, file)),
      gitFile(file)
    ]);
    assert.equal(textSha256(current), textSha256(baseline), `Protected file changed: ${file}`);
  }

  console.log(`✓ ${stageTitle} conditionally passed.`);
  console.log('  Universal Contract applies to every registered Canonical Node; Preface is only the current pilot scope.');
  console.log(`  ${prefaceNodes.length} Preface Nodes audited; ${productionReady} human-frozen Node is production_ready and ${blocked} Nodes remain production_blocked.`);
  console.log(`  ${assignedPilotQuestions} Supporting Questions retain one canonical owner; Human Editorial Freeze and production promotion remain explicit.`);
  console.log('  Pending human Canonical decisions prevent PJA-W2F-B1-v1.0.0-Frozen.');
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}

function assessContentPopulationRecord(record, expectedQuestionCount) {
  const thesisComplete = [
    record.canonicalThesis.statement,
    record.canonicalThesis.mechanism,
    record.canonicalThesis.necessity,
    record.canonicalThesis.systemRole
  ].every(hasText)
    && (!record.sequenceBoundary.previousNode
      || hasText(record.canonicalThesis.continuity.fromPreviousNode))
    && (!record.sequenceBoundary.nextNode
      || hasText(record.canonicalThesis.continuity.toNextNode));
  const articleBoundaryComplete = [
    record.articleBoundary.mustEstablish,
    record.articleBoundary.requiredDistinctions,
    record.articleBoundary.mustNotClaim,
    record.articleBoundary.includedScope,
    record.articleBoundary.excludedScope
  ].every(hasItems);
  const claimBoundaryComplete = [
    record.claimBoundary.requiredClaimFamilies,
    record.claimBoundary.allowedClaimTypes,
    record.claimBoundary.internalCanonicalClaims,
    record.claimBoundary.prohibitedClaims,
    record.claimBoundary.qualificationRequirements
  ].every(hasItems);
  const supportingQuestionTreatmentComplete =
    record.supportingQuestionBoundary.length === expectedQuestionCount
    && record.supportingQuestionBoundary.every(mapping => (
      allowedTreatments.has(mapping.articleTreatment)
      && hasText(mapping.primaryNodeCode)
    ))
    && (
      expectedQuestionCount === 0
      || record.localizationReadiness.supportingQuestions !== 'not_ready'
    );
  const sourcePlanComplete = [
    record.sourceBoundary.sourceRequirement,
    record.sourceBoundary.preferredSourceTypes,
    record.sourceBoundary.prohibitedSourceTypes
  ].every(hasItems)
    && hasText(record.sourceBoundary.citationSensitivity);
  const figureDecisionComplete =
    record.figureBoundary.figureRequirement !== 'not_assessed'
    && (
      record.figureBoundary.figureRequirement === 'none'
      || (
        hasText(record.figureBoundary.visualMechanism)
        && hasItems(record.figureBoundary.prohibitedVisualClaims)
        && hasItems(record.figureBoundary.accessibilityRequirements)
        && hasItems(record.figureBoundary.assetSourceBoundary)
      )
    );
  const publicBoundaryComplete = [
    record.publicContentBoundary.publicKnowledgeBoundary,
    record.publicContentBoundary.paidBookBoundary,
    record.publicContentBoundary.runtimeJourneyBoundary,
    record.publicContentBoundary.professionalServiceBoundary,
    record.publicContentBoundary.enterpriseBoundary,
    record.publicContentBoundary.developerBoundary
  ].every(hasItems);
  const editorialContractComplete =
    thesisComplete
    && articleBoundaryComplete
    && hasText(record.locale)
    && hasText(record.sequenceBoundary.currentNodeTransformation)
    && hasText(record.sequenceBoundary.partContribution)
    && hasText(record.sequenceBoundary.bookContribution)
    && hasText(record.sequenceBoundary.systemContribution);
  const humanEditorialFreezeComplete =
    record.review.humanFrozen === true
    && record.review.status === 'approved'
    && hasText(record.review.reviewedBy)
    && hasText(record.review.reviewedAt);

  const decisions = [
    ['Missing Canonical Thesis', thesisComplete],
    ['Missing Article Boundary', articleBoundaryComplete],
    ['Missing Claim Boundary', claimBoundaryComplete],
    ['Missing Supporting Question Treatment', supportingQuestionTreatmentComplete],
    ['Missing Source Plan', sourcePlanComplete],
    ['Missing Figure Decision', figureDecisionComplete],
    ['Missing Public / Paid / Runtime / Professional Boundary', publicBoundaryComplete],
    ['Missing Editorial Contract', editorialContractComplete],
    ['Missing Human Editorial Freeze', humanEditorialFreezeComplete]
  ];
  const pendingHumanDecisions = decisions
    .filter(([, complete]) => !complete)
    .map(([decision]) => decision);
  return {
    complete: pendingHumanDecisions.length === 0,
    pendingHumanDecisions
  };
}

async function verifyExporter(pilotAssessments) {
  const output = `${temporaryRelative}/briefs`;
  const readyNodes = pilotAssessments.filter(
    assessment => assessment.validation.status === 'production_ready'
  );
  for (const assessment of readyNodes) {
    const command = await execFileAsync(process.execPath, [
      'scripts/export-knowledge-production-brief.mjs',
      assessment.nodeCode,
      '--output', output,
      '--force'
    ], { cwd: root, windowsHide: true });
    assert(command.stdout.includes('BRIEF EXPORTED'));
  }
  await assert.rejects(
    execFileAsync(process.execPath, [
      'scripts/export-knowledge-production-brief.mjs',
      'KN-PREFACE-002',
      '--output', output,
      '--force'
    ], { cwd: root, windowsHide: true }),
    error => (
      error.stderr.includes('CANONICAL_THESIS_NOT_READY')
      || error.stderr.includes('PRODUCTION_READY_REQUIREMENTS_NOT_MET')
    )
  );
}

function validatePackageDependency(scripts) {
  const command = scripts['check:pja-w2f-b1'];
  assert.equal(typeof command, 'string');
  const chain = command.split(/\s*&&\s*/).map(segment => segment.trim());
  assert.equal(chain.length, 2);
  const predecessor = tokenize(chain[0]);
  const checker = tokenize(chain[1]);
  assert.deepEqual(predecessor, ['npm', 'run', 'check:pja-w2f-a']);
  assert.equal(['node', 'node.exe'].includes(
    path.basename(checker[0]).toLowerCase()
  ), true);
  assert.equal(checker[1], checkerPath);
  assert.equal(command.includes('check:pja-w2f-b1 &&'), false);
}

function validateEditorialAuthority(contract) {
  assert.equal(
    contract.editorialContract.frozenRules.aiHasPublicationAuthority,
    false
  );
  assert.equal(
    contract.editorialContract.frozenRules
      .contentCompletionEqualsReviewCompletion,
    false
  );
  assert.equal(
    contract.editorialContract.frozenRules
      .canonicalNodeDeterminesArticleIdentity,
    true
  );
  assert.equal(
    contract.editorialContract.frozenRules
      .blueprintPresenceCreatesCanonicalIdentity,
    false
  );
}

function tokenize(segment) {
  return [...segment.matchAll(/"([^"]*)"|'([^']*)'|([^\s]+)/g)]
    .map(match => match[1] ?? match[2] ?? match[3]);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function normalize(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLowerCase()
    : '';
}

function registerUnique(map, value, nodeCode, errorCode) {
  if (!value) return;
  assert.equal(map.has(value), false, `${errorCode}: ${nodeCode}`);
  map.set(value, nodeCode);
}

async function read(relative) {
  return (await fs.readFile(path.join(root, relative), 'utf8'))
    .replace(/\r\n?/g, '\n');
}

async function readJson(relative) {
  return JSON.parse(await read(relative));
}

async function gitFile(relative) {
  const { stdout } = await execFileAsync('git', ['show', `HEAD:${relative}`], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 20 * 1024 * 1024
  });
  return stdout;
}
