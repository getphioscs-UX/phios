import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ALLOWED_PACKAGE_STATUSES,
  BRIEF_SCHEMA_VERSION,
  CONTENT_FILES,
  PACKAGE_FILES,
  PACKAGE_SCHEMA_VERSION,
  PRODUCTION_TOOL_VERSION
} from './lib/knowledge-production/production-config.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const temporary = path.join(root, '.tmp/pja-w2e-r1-check');
const exporter = path.join(root, 'scripts/export-knowledge-production-brief.mjs');

function sectionBody(markdown, heading) {
  const start = markdown.indexOf(`${heading}\n`);
  assert.notEqual(start, -1, `Missing section: ${heading}`);
  const contentStart = start + heading.length + 1;
  const next = markdown.indexOf('\n## ', contentStart);
  return markdown.slice(contentStart, next === -1 ? markdown.length : next);
}

function subsectionBody(markdown, heading) {
  const start = markdown.indexOf(`${heading}\n`);
  assert.notEqual(start, -1, `Missing subsection: ${heading}`);
  const contentStart = start + heading.length + 1;
  const nextSubsection = markdown.indexOf('\n### ', contentStart);
  const nextSection = markdown.indexOf('\n## ', contentStart);
  const ends = [nextSubsection, nextSection].filter(value => value !== -1);
  return markdown.slice(contentStart, ends.length ? Math.min(...ends) : markdown.length);
}

function parseJsonSection(markdown, heading) {
  const body = sectionBody(markdown, heading);
  const match = body.match(/```json\n([\s\S]*?)\n```/);
  assert(match, `Missing JSON contract in ${heading}`);
  return JSON.parse(match[1]);
}

function parseJsonSubsection(markdown, heading) {
  const body = subsectionBody(markdown, heading);
  const match = body.match(/```json\n([\s\S]*?)\n```/);
  assert(match, `Missing JSON contract in ${heading}`);
  return JSON.parse(match[1]);
}

function parseBullets(markdown, heading) {
  return subsectionBody(markdown, heading)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- '))
    .map(line => line.slice(2));
}

async function exportBrief(cwd, nodeCode, output) {
  await execFileAsync(process.execPath, [
    exporter,
    nodeCode,
    '--output',
    output
  ], {
    cwd,
    windowsHide: true
  });
  return fs.readFile(path.join(cwd, output, `${nodeCode}-production-brief.md`), 'utf8');
}

async function copyJson(relativePath, targetRoot) {
  const target = path.join(targetRoot, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(path.join(root, relativePath), target);
}

await fs.rm(temporary, { recursive: true, force: true });
await fs.mkdir(temporary, { recursive: true });

try {
  const output = '.tmp/pja-w2e-r1-check/preface';
  const brief = await exportBrief(root, 'KN-PREFACE-001', output);
  const readiness = JSON.parse(await fs.readFile(
    path.join(root, 'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json')
  ));

  assert.equal(brief.includes('not_defined'), false);

  const briefIdentity = parseJsonSection(brief, '## 1. Brief Identity');
  assert.equal(briefIdentity.briefSchemaVersion, BRIEF_SCHEMA_VERSION);
  assert.equal(briefIdentity.generatorVersion, PRODUCTION_TOOL_VERSION);

  const identity = parseJsonSection(brief, '## 2. Canonical Node Identity');
  assert.equal(identity.nodeCode, 'KN-PREFACE-001');
  assert.equal(identity.domainCode, null);
  assert.equal(identity.previousNode, null);
  assert.deepEqual(identity.nextNode, ['KN-PREFACE-002']);

  const localized = parseJsonSection(brief, '## 3. Localized Identity');
  assert.equal(localized.localizedSummary, null);
  assert(Array.isArray(localized.searchAliases));

  const mustEstablish = parseBullets(brief, '### Must Establish');
  const requiredDistinctions = parseBullets(brief, '### Required Distinctions');
  const mustNotClaim = parseBullets(brief, '### Must Not Claim');
  assert.deepEqual(mustEstablish, readiness.requiredMechanisms.map(
    item => `${item.label}: ${item.requirement}`
  ));
  assert.deepEqual(requiredDistinctions, readiness.requiredDistinctions.map(
    item => `${item.left} ≠ ${item.right}: ${item.reason}`
  ));
  assert.deepEqual(mustNotClaim, readiness.prohibitedClaims);
  assert.equal(mustEstablish.some(item => mustNotClaim.includes(item)), false);
  assert.equal(requiredDistinctions.some(item => mustEstablish.includes(item)), false);

  const continuity = parseJsonSubsection(
    brief,
    '### Previous / Next / Supporting Question Boundary'
  );
  assert.equal(continuity.previousNode, null);
  assert.deepEqual(continuity.nextNode, ['KN-PREFACE-002']);
  assert.equal(
    continuity.supportingQuestionFieldSemantics.canonicalNodeCode,
    'Sole Canonical ownership of the Supporting Question.'
  );
  assert.match(
    continuity.supportingQuestionFieldSemantics.sourceNodeCode,
    /never Canonical ownership/
  );
  for (const question of continuity.supportingQuestions) {
    assert.equal(question.canonicalNodeCode, 'KN-PREFACE-001');
    assert.notEqual(question.sourceNodeCode, question.canonicalNodeCode);
  }

  const editorial = parseJsonSection(brief, '## 6. Editorial Contract');
  for (const field of [
    'articlePurpose',
    'audience',
    'languagePolicy',
    'canonicalContinuity',
    'articleCompletionBoundary',
    'aiAuthorityBoundary',
    'humanApprovalBoundary'
  ]) {
    assert.notEqual(editorial[field], undefined, `Editorial Contract missing ${field}`);
  }
  assert.equal(editorial.humanApprovalBoundary.aiMayApprove, false);
  assert.equal(editorial.humanApprovalBoundary.automatedValidatorMayApprove, false);

  const structuredArticle = parseJsonSection(brief, '## 7. Structured Article Contract');
  assert.deepEqual(structuredArticle.figureRules.sequence, [
    'media_brief',
    'asset_registry',
    'article_figure'
  ]);
  assert.equal(structuredArticle.figureRules.mediaBriefRequired, true);
  assert.equal(structuredArticle.figureRules.figureBlockState, 'deferred');
  assert.equal(structuredArticle.figureRules.figureBlockRequiredInCurrentArticle, false);
  assert.equal(structuredArticle.figureRules.assetRegistryRequiredBeforeArticleReference, true);

  const claimGovernance = parseJsonSection(brief, '## 8. Claim Governance');
  assert.equal(typeof claimGovernance.externalFactRules, 'object');
  assert.deepEqual(claimGovernance.externalFactRules.currentDraftRules, {
    generatedPackageStatus: 'draft',
    claimStatus: 'draft',
    reviewStatus: 'not_reviewed',
    publicationStatus: 'not_published',
    sourcePresenceEqualsClaimSupport: false,
    automatedApprovalAllowed: false
  });
  assert.equal(
    claimGovernance.externalFactRules.futurePublicationRules.humanPublicationTargetOnly,
    true
  );
  assert.equal(
    claimGovernance.externalFactRules.futurePublicationRules.requiredHighAndCriticalClaimStatus,
    'approved'
  );
  assert.equal(
    claimGovernance.externalFactRules.futurePublicationRules.requiredPublicationStatus,
    'published'
  );

  const review = parseJsonSection(brief, '## 10. Review Governance');
  assert.deepEqual(review.stateSeparation, {
    productionReadyIsArticleApproved: false,
    articleApprovedIsPublicationReady: false,
    publicationReadyIsPublished: false
  });
  assert.equal(review.currentDraftState.packageStatus, 'draft');
  assert.equal(review.currentDraftState.reviewStatus, 'not_reviewed');
  assert.equal(review.currentDraftState.publicationStatus, 'not_published');
  assert.equal(review.futurePublicationTarget.targetOnly, true);
  assert.equal(review.futurePublicationTarget.generatedPackageMayAssumeTargetReached, false);

  const nodeInputs = parseJsonSection(brief, '## 11. Node-specific Inputs');
  const sourceCodes = nodeInputs.availableSourceReferences.map(source => source.sourceCode);
  assert.equal(new Set(sourceCodes).size, sourceCodes.length);
  assert.equal(sourceCodes.filter(code => code === 'SRC-PREFACE-S01').length, 1);
  const primarySource = nodeInputs.availableSourceReferences.find(
    source => source.sourceCode === 'SRC-PREFACE-S01'
  );
  assert.deepEqual(primarySource.relationships, ['primary']);
  assert.equal(typeof primarySource.title, 'string');
  assert.deepEqual(nodeInputs.requiredFigures, []);
  assert.equal(nodeInputs.deferredFigureBriefs.length, 1);
  assert.deepEqual(nodeInputs.figureContract, structuredArticle.figureRules);

  const packageContract = parseJsonSection(brief, '## 12. Package Output Contract');
  assert.equal(packageContract.manifestFile, 'package-manifest.json');
  assert.equal(packageContract.packageSchemaVersion, PACKAGE_SCHEMA_VERSION);
  assert.deepEqual(packageContract.allowedStatus, ALLOWED_PACKAGE_STATUSES);
  assert.deepEqual(packageContract.requiredFiles, PACKAGE_FILES);
  assert.deepEqual(packageContract.manifestFileList.exactFiles, CONTENT_FILES);
  assert.equal(packageContract.manifestFileList.unknownFilesAllowed, false);
  assert.equal(packageContract.checksum.algorithm, 'SHA-256');
  assert.equal(packageContract.checksum.input, 'original_file_bytes');
  assert.deepEqual(packageContract.checksum.requiredFor, CONTENT_FILES);
  assert.equal(packageContract.stateBoundary.approvalGranted, false);
  assert.equal(packageContract.stateBoundary.publishedGranted, false);
  assert.deepEqual(new Set(packageContract.requiredFields), new Set([
    'packageType',
    'packageSchemaVersion',
    'nodeCode',
    'locale',
    'articleSchemaVersion',
    'claimSchemaVersion',
    'sourceDossierSchemaVersion',
    'reviewSchemaVersion',
    'mediaBriefSchemaVersion',
    'files',
    'generatedAt',
    'generatorType',
    'status'
  ]));

  const exporterSource = await fs.readFile(exporter, 'utf8');
  assert.equal(/KN-PREFACE|KN-B1|KN-B2|KN-B3/.test(exporterSource), false);
  assert.match(exporterSource, /const nodeCode = positionals\[0\]/);
  assert.match(exporterSource, /loadCanonicalContext\(root, nodeCode, locale\)/);

  const universalRoot = path.join(temporary, 'universal-root');
  for (const file of [
    'content/knowledge/registry/nodes.json',
    'content/knowledge/registry/localized-content.json',
    'content/knowledge/registry/supporting-questions.json',
    'content/knowledge/registry/sources.json',
    'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
    'content/knowledge/schemas/article-v2.schema.json',
    'content/knowledge/governance/policies/pja-w2c-claim-source-review-policy.json',
    'docs/pja/pja-w2a-canonical-article-editorial-contract-v1.json'
  ]) {
    await copyJson(file, universalRoot);
  }
  const nodes = JSON.parse(await fs.readFile(
    path.join(root, 'content/knowledge/registry/nodes.json')
  ));
  const blueprint = JSON.parse(await fs.readFile(
    path.join(root, 'content/knowledge/blueprints/book-1-knowledge-blueprint.json')
  ));
  const partOneBlueprint = blueprint.nodes.find(node => node.nodeCode === 'KN-B1-P1-001');
  assert(partOneBlueprint, 'Blueprint fixture requires KN-B1-P1-001');
  const partOneNode = structuredClone(nodes.nodes[0]);
  partOneNode.nodeCode = partOneBlueprint.nodeCode;
  partOneNode.canonicalQuestionKey = 'test-only-part-1-universal-contract';
  partOneNode.supportingQuestionCodes = [];
  partOneNode.legacyNodeCodes = [];
  partOneNode.relationships = {
    prerequisiteNodeCodes: [],
    nextNodeCodes: [],
    relatedNodeCodes: [],
    parentNodeCodes: [],
    childNodeCodes: []
  };
  nodes.nodes.push(partOneNode);
  await fs.writeFile(
    path.join(universalRoot, 'content/knowledge/registry/nodes.json'),
    `${JSON.stringify(nodes, null, 2)}\n`
  );
  const localizedContent = JSON.parse(await fs.readFile(
    path.join(root, 'content/knowledge/registry/localized-content.json')
  ));
  const partOneLocalized = structuredClone(localizedContent.localizedContent[0]);
  partOneLocalized.nodeCode = partOneNode.nodeCode;
  partOneLocalized.locales['zh-Hans'].displayQuestion = 'Test-only Part 1 Canonical Question';
  partOneLocalized.locales['zh-Hans'].slug = partOneNode.canonicalQuestionKey;
  localizedContent.localizedContent.push(partOneLocalized);
  await fs.writeFile(
    path.join(universalRoot, 'content/knowledge/registry/localized-content.json'),
    `${JSON.stringify(localizedContent, null, 2)}\n`
  );
  const fixture = structuredClone(readiness);
  fixture.articleIdentity.nodeCode = partOneNode.nodeCode;
  fixture.articleIdentity.canonicalQuestionKey = partOneNode.canonicalQuestionKey;
  fixture.articleIdentity.slug = partOneNode.canonicalQuestionKey;
  fixture.canonicalQuestion = 'Test-only Part 1 Canonical Question';
  fixture.publicQuestion = fixture.canonicalQuestion;
  fixture.publicTitle = fixture.canonicalQuestion;
  fixture.centralThesis = 'Test-only structural thesis for universal exporter regression; not Canonical content.';
  fixture.visualRequirement.visualRequired = false;
  fixture.visualRequirement.assetCreated = false;
  fixture.visualRequirement.assetCode = null;
  const fixturePath = path.join(
    universalRoot,
    'content/knowledge/editorial/readiness/kn-b1-p1-001-production-readiness.json'
  );
  await fs.mkdir(path.dirname(fixturePath), { recursive: true });
  await fs.writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
  const partBrief = await exportBrief(
    universalRoot,
    partOneNode.nodeCode,
    'dist/briefs'
  );
  const partIdentity = parseJsonSection(partBrief, '## 2. Canonical Node Identity');
  const partBriefIdentity = parseJsonSection(partBrief, '## 1. Brief Identity');
  assert.equal(partIdentity.nodeCode, partOneNode.nodeCode);
  assert.equal(partBriefIdentity.briefSchemaVersion, briefIdentity.briefSchemaVersion);
  assert.equal(partBrief.includes('KN-PREFACE-001'), false);

  console.log('✓ PJA-W2E-R1 Production Brief Contract Hardening passed.');
  console.log('  Typed null/array values replace sentinels; Must Establish, Required Distinctions and Must Not Claim are independent.');
  console.log('  Draft and future publication authority, Source merging, Figure sequencing, Manifest and Editorial contracts are structurally enforced.');
  console.log('  Preface and Blueprint-derived future Part 1 structural fixtures share one node-agnostic Production Brief Contract.');
  console.log('  State: PJA-W2E-R1-v1.0.0-Frozen.');
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
