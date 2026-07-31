import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { sha256 } from './lib/knowledge-production/checksum.mjs';
import { loadKnowledgeAuthority } from './lib/knowledge-readiness/authority-loader.mjs';
import {
  READINESS_CONTRACT_PATH,
  READINESS_ERROR_CODES,
  READINESS_INDEX_PATH,
  READINESS_INVENTORY_PATH,
  READINESS_SCHEMA_PATH,
  READINESS_SCHEMA_VERSION,
  readinessRelativePath
} from './lib/knowledge-readiness/readiness-config.mjs';
import {
  auditAuthorityIntegrity,
  auditThesisDuplication,
  readReadinessRecord,
  validateReadinessRecord
} from './lib/knowledge-readiness/readiness-record.mjs';
import { resolveKnowledgeScope } from './lib/knowledge-readiness/scope-resolver.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const temporaryRelative = '.tmp/pja-w2f-a-check';
const temporary = path.join(root, temporaryRelative);

async function run(script, args = [], cwd = root) {
  try {
    const result = await execFileAsync(process.execPath, [
      path.join(root, script),
      ...args
    ], {
      cwd,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: typeof error.code === 'number' ? error.code : 2,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? ''
    };
  }
}

async function gitBytes(relativePath) {
  const { stdout } = await execFileAsync('git', ['show', `HEAD:${relativePath}`], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 10 * 1024 * 1024
  });
  return stdout;
}

async function currentBytes(relativePath) {
  return fs.readFile(path.join(root, relativePath));
}

async function fileHashes(relativePaths) {
  return Object.fromEntries(await Promise.all(relativePaths.map(async relativePath => (
    [relativePath, sha256(await currentBytes(relativePath))]
  ))));
}

function codes(result) {
  return [
    ...(result.structuralErrors ?? []),
    ...(result.findings ?? [])
  ].map(item => item.code);
}

function mutatedRecord(record, mutate) {
  const clone = {
    ...record,
    normalized: structuredClone(record.normalized)
  };
  mutate(clone.normalized);
  return clone;
}

function forbiddenAuthorityValue(value) {
  if (typeof value === 'string') {
    return [
      'approved',
      'publication_ready',
      'published',
      'human_approved',
      'editorially_approved'
    ].includes(value);
  }
  if (Array.isArray(value)) return value.some(forbiddenAuthorityValue);
  if (value && typeof value === 'object') {
    return Object.values(value).some(forbiddenAuthorityValue);
  }
  return false;
}

await fs.rm(temporary, { recursive: true, force: true });
await fs.mkdir(temporary, { recursive: true });

try {
  const packageJson = JSON.parse(await currentBytes('package.json'));
  assert.equal(
    packageJson.scripts['knowledge:init-readiness'],
    'node scripts/initialize-canonical-production-readiness.mjs'
  );
  assert.equal(
    packageJson.scripts['knowledge:validate-readiness'],
    'node scripts/validate-canonical-production-readiness.mjs'
  );
  assert.equal(
    packageJson.scripts['check:pja-w2f-a'],
    'node scripts/check-pja-w2f-a-universal-production-readiness.mjs'
  );
  assert.equal(new Set(READINESS_ERROR_CODES).size, READINESS_ERROR_CODES.length);
  for (const code of [
    'KNOWLEDGE_SCOPE_INVALID',
    'CANONICAL_NODE_NOT_FOUND',
    'CANONICAL_THESIS_NOT_READY',
    'CANONICAL_THESIS_DUPLICATED',
    'SUPPORTING_QUESTION_MULTI_ASSIGNED',
    'PRODUCTION_READY_REQUIREMENTS_NOT_MET'
  ]) {
    assert(READINESS_ERROR_CODES.includes(code));
  }

  const protectedFiles = [
    'content/knowledge/registry/nodes.json',
    'content/knowledge/registry/learning-paths.json',
    'content/knowledge/registry/localized-content.json',
    'content/knowledge/registry/supporting-questions.json',
    'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
    'content/knowledge/editorial/schemas/canonical-article.schema.json',
    'content/knowledge/schemas/article-v2.schema.json',
    'content/knowledge/schemas/claim.schema.json',
    'content/knowledge/schemas/source.schema.json',
    'content/knowledge/schemas/article-review.schema.json',
    'content/knowledge/governance/policies/pja-w2c-claim-source-review-policy.json',
    'docs/knowledge/PJA-article-renderer-contract.md'
  ];
  for (const relativePath of protectedFiles) {
    assert.equal(
      sha256(await currentBytes(relativePath)),
      sha256(await gitBytes(relativePath)),
      `Protected file changed: ${relativePath}`
    );
  }
  assert.equal(
    sha256(await currentBytes(
      'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json'
    )),
    sha256(await gitBytes(
      'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json'
    )),
    'Existing KN-PREFACE-001 Readiness must be preserved byte-for-byte.'
  );

  const authority = await loadKnowledgeAuthority(root);
  assert.equal(authority.registeredNodes.length, 13);
  assert.equal(authority.supportingQuestions.supportingQuestions.length, 23);
  assert.equal(
    authority.blueprints.reduce((sum, entry) => sum + entry.value.nodes.length, 0),
    78
  );
  assert.equal(authority.membership.size, 13);
  assert.equal(authority.planned.size, 65);
  assert.deepEqual(auditAuthorityIntegrity(authority), []);

  const allScope = resolveKnowledgeScope(authority, { scope: 'ALL' });
  const prefaceScope = resolveKnowledgeScope(authority, { scope: 'PREFACE' });
  const bookScope = resolveKnowledgeScope(authority, { scope: 'BOOK-1' });
  const partOneScope = resolveKnowledgeScope(authority, { scope: 'PART-1' });
  const partFiveScope = resolveKnowledgeScope(authority, { scope: 'PART-5' });
  const partFourteenScope = resolveKnowledgeScope(authority, { scope: 'PART-14' });
  const nodePrefixScope = resolveKnowledgeScope(authority, { scope: 'KN-B1-P1' });
  assert.equal(allScope.nodes.length, 13);
  assert.equal(allScope.plannedNodes.length, 65);
  assert.equal(prefaceScope.nodes.length, 13);
  assert.equal(bookScope.nodes.length, 13);
  assert.equal(bookScope.plannedNodes.length, 65);
  assert.equal(partOneScope.nodes.length, 0);
  assert.equal(partOneScope.plannedNodes.length, 12);
  assert.equal(partFiveScope.nodes.length, 0);
  assert.equal(partFiveScope.plannedNodes.length, 13);
  assert.equal(partFourteenScope.registrationState, 'not_registered');
  assert.equal(partFourteenScope.nodes.length, 0);
  assert.equal(nodePrefixScope.plannedNodes.length, 12);
  const plannedDistribution = Object.fromEntries(
    ['P1', 'P2', 'P3', 'P4', 'P5'].map(partCode => [
      partCode,
      [...authority.planned.values()].filter(
        entry => entry.blueprintNode.partCode === partCode
      ).length
    ])
  );
  assert.deepEqual(plannedDistribution, {
    P1: 12,
    P2: 13,
    P3: 15,
    P4: 12,
    P5: 13
  });

  const futureNode = structuredClone(authority.registeredNodes[0]);
  futureNode.nodeCode = 'KN-B9-P14-FUTURE';
  futureNode.bookCode = 'BOOK-IX';
  futureNode.partCode = 'P14';
  futureNode.collectionCode = 'KC-FUTURE';
  futureNode.relationships = {
    prerequisiteNodeCodes: [],
    nextNodeCodes: [],
    relatedNodeCodes: [],
    parentNodeCodes: [],
    childNodeCodes: []
  };
  const futureMembership = {
    blueprintPath: 'test-only/future-blueprint.json',
    blueprint: {
      contract: 'TEST-ONLY-FUTURE-BLUEPRINT-v1',
      bookCode: 'BOOK-IX'
    },
    blueprintNode: {
      nodeCode: futureNode.nodeCode,
      partCode: 'P14',
      status: 'registered',
      titleZhHans: 'Test-only future Part pattern'
    },
    part: {
      partCode: 'P14',
      title: 'Test-only future Part'
    },
    bookCode: 'BOOK-IX',
    bookTitle: 'Test-only future Book'
  };
  const futureAuthority = {
    ...authority,
    registeredNodes: [...authority.registeredNodes, futureNode],
    membership: new Map(authority.membership),
    planned: new Map(authority.planned)
  };
  futureAuthority.membership.set(futureNode.nodeCode, futureMembership);
  assert.deepEqual(
    resolveKnowledgeScope(futureAuthority, { scope: 'PART-14' }).nodes.map(
      node => node.nodeCode
    ),
    [futureNode.nodeCode]
  );
  assert.deepEqual(
    resolveKnowledgeScope(futureAuthority, { scope: 'BOOK-9' }).nodes.map(
      node => node.nodeCode
    ),
    [futureNode.nodeCode]
  );

  const readinessPaths = authority.registeredNodes.map(
    node => readinessRelativePath(node.nodeCode, 'zh-Hans')
  );
  for (const relativePath of readinessPaths) {
    await fs.access(path.join(root, relativePath));
  }
  const records = [];
  const validationResults = [];
  for (const node of authority.registeredNodes) {
    const record = await readReadinessRecord(authority, node.nodeCode, 'zh-Hans');
    const result = validateReadinessRecord(authority, record);
    records.push(record);
    validationResults.push(result);
  }
  assert.equal(records.filter(record => record.legacy).length, 1);
  assert.equal(validationResults.filter(result => result.productionReady).length, 1);
  assert.equal(validationResults.filter(result => !result.productionReady).length, 12);
  assert.equal(
    validationResults.find(result => result.nodeCode === 'KN-PREFACE-001')
      .exportability,
    'exportable'
  );
  const blocked002 = validationResults.find(
    result => result.nodeCode === 'KN-PREFACE-002'
  );
  assert(codes(blocked002).includes('CANONICAL_THESIS_NOT_READY'));
  for (const record of records.filter(record => !record.legacy)) {
    assert.equal(record.raw.readinessSchemaVersion, READINESS_SCHEMA_VERSION);
    assert.equal(record.raw.canonicalThesis.statement, null);
    assert.equal(record.raw.productionReadiness.status, 'production_blocked');
    assert.equal(record.raw.review.humanFreezeCompleted, false);
    assert.equal(forbiddenAuthorityValue(record.raw), false);
  }

  const readyRecord = records.find(record => record.context.node.nodeCode === 'KN-PREFACE-001');
  const titleAsThesis = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.canonicalThesis.statement = value.canonicalIdentity.canonicalTitle;
    }
  ));
  assert(codes(titleAsThesis).includes('CANONICAL_THESIS_NOT_READY'));
  const questionAsThesis = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.canonicalThesis.statement = value.canonicalIdentity.canonicalQuestion;
    }
  ));
  assert(codes(questionAsThesis).includes('CANONICAL_THESIS_NOT_READY'));
  const missingMustEstablish = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.articleBoundary.mustEstablish = [];
    }
  ));
  assert(codes(missingMustEstablish).includes('MUST_ESTABLISH_MISSING'));
  const missingMustNotClaim = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.articleBoundary.mustNotClaim = {
        global: [],
        partSpecific: [],
        nodeSpecific: []
      };
    }
  ));
  assert(codes(missingMustNotClaim).includes('MUST_NOT_CLAIM_MISSING'));
  const wrongBook = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.hierarchy.bookCode = 'BOOK-WRONG';
    }
  ));
  assert(codes(wrongBook).includes('CANONICAL_HIERARCHY_MISMATCH'));
  const wrongPart = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.hierarchy.partCode = 'P999';
    }
  ));
  assert(codes(wrongPart).includes('CANONICAL_HIERARCHY_MISMATCH'));
  const wrongNode = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.canonicalIdentity.nodeCode = 'KN-WRONG';
    }
  ));
  assert(codes(wrongNode).includes('CANONICAL_IDENTITY_MISMATCH'));
  const wrongPrevious = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.sequenceBoundary.previousNode = 'KN-WRONG';
    }
  ));
  assert(codes(wrongPrevious).includes('PREVIOUS_NODE_MISMATCH'));
  const wrongNext = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.sequenceBoundary.nextNode = ['KN-WRONG'];
    }
  ));
  assert(codes(wrongNext).includes('NEXT_NODE_MISMATCH'));
  const missingSource = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.sourceBoundary.sourceRequirement = null;
    }
  ));
  assert(codes(missingSource).includes('SOURCE_BOUNDARY_NOT_READY'));
  const missingPublic = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.publicContentBoundary.professionalServiceBoundary = null;
    }
  ));
  assert(codes(missingPublic).includes('PUBLIC_BOUNDARY_NOT_READY'));
  const blockingReady = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.productionReadiness.blockingFindings = [{
        code: 'TEST_ONLY_BLOCKER'
      }];
    }
  ));
  assert(codes(blockingReady).includes('BLOCKING_FINDINGS_PRESENT'));
  const unknownStatus = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.productionReadiness.status = 'automatic_approval';
    }
  ));
  assert(codes(unknownStatus).includes('PRODUCTION_STATUS_INVALID'));
  const missingVersion = validateReadinessRecord(authority, mutatedRecord(
    readyRecord,
    value => {
      value.versionBinding.registryVersion = null;
    }
  ));
  assert(codes(missingVersion).includes('VERSION_BINDING_MISSING'));
  const duplicateLeft = validateReadinessRecord(authority, readyRecord);
  const duplicateRight = structuredClone(duplicateLeft);
  duplicateRight.nodeCode = 'KN-TEST-DUPLICATE';
  duplicateRight.normalized.nodeCode = duplicateRight.nodeCode;
  assert.equal(
    auditThesisDuplication([duplicateLeft, duplicateRight])[0].classification,
    'canonical_duplication'
  );
  const duplicateQuestionAuthority = {
    ...authority,
    supportingQuestions: {
      ...authority.supportingQuestions,
      supportingQuestions: [
        ...authority.supportingQuestions.supportingQuestions,
        structuredClone(authority.supportingQuestions.supportingQuestions[0])
      ]
    }
  };
  assert(
    auditAuthorityIntegrity(duplicateQuestionAuthority).some(
      item => item.code === 'SUPPORTING_QUESTION_MULTI_ASSIGNED'
    )
  );

  const schema = JSON.parse(await currentBytes(READINESS_SCHEMA_PATH));
  const contract = JSON.parse(await currentBytes(READINESS_CONTRACT_PATH));
  const index = JSON.parse(await currentBytes(READINESS_INDEX_PATH));
  const inventoryDocument = await fs.readFile(
    path.join(root, READINESS_INVENTORY_PATH),
    'utf8'
  );
  assert.equal(schema.properties.readinessSchemaVersion.const, READINESS_SCHEMA_VERSION);
  assert.equal(contract.scope.registeredCanonicalNodesOnly, true);
  assert.equal(contract.scope.blueprintPlannedNodesAreCanonicalIdentity, false);
  assert.deepEqual(contract.figureBoundaryContract.sequence, [
    'media_brief',
    'asset_registry',
    'article_figure'
  ]);
  assert.equal(contract.humanAuthorityBoundary.toolsMayApproveProductionReady, false);
  assert.equal(index.summary.canonicalNodesDetected, 13);
  assert.equal(index.summary.blueprintPlannedNodesDetected, 65);
  assert.equal(index.summary.productionReady, 1);
  assert.equal(index.summary.blocked, 12);
  assert.equal(index.registeredNodes.length, 13);
  assert.equal(index.blueprintPlannedNodes.length, 65);
  assert.match(inventoryDocument, /Parts 6–14/);
  assert.match(inventoryDocument, /Not Registered/);

  const recordHashesBefore = await fileHashes(readinessPaths);
  let command = await run('scripts/initialize-canonical-production-readiness.mjs', [
    '--scope',
    'ALL'
  ]);
  assert.equal(command.code, 0, command.stderr);
  assert(command.stdout.includes('Created: 0'));
  assert(command.stdout.includes('Existing preserved: 13'));
  assert.deepEqual(await fileHashes(readinessPaths), recordHashesBefore);

  for (const scope of ['PREFACE', 'BOOK-1', 'PART-1', 'PART-14', 'ALL']) {
    command = await run('scripts/validate-canonical-production-readiness.mjs', [
      '--scope',
      scope
    ]);
    assert.equal(command.code, 0, `${scope}: ${command.stderr}`);
  }

  const briefOutput = `${temporaryRelative}/single`;
  command = await run('scripts/export-knowledge-production-brief.mjs', [
    'KN-PREFACE-001',
    '--output',
    briefOutput
  ]);
  assert.equal(command.code, 0, command.stderr);
  assert(await fs.stat(path.join(
    root,
    briefOutput,
    'KN-PREFACE-001-production-brief.md'
  )));
  command = await run('scripts/export-knowledge-production-brief.mjs', [
    'KN-PREFACE-002',
    '--output',
    briefOutput
  ]);
  assert.notEqual(command.code, 0);
  assert(command.stderr.includes('CANONICAL_THESIS_NOT_READY'));

  command = await run('scripts/export-knowledge-production-brief.mjs', [
    '--scope',
    'PREFACE',
    '--output',
    `${temporaryRelative}/preface-batch`
  ]);
  assert.equal(command.code, 0, command.stderr);
  assert(command.stdout.includes('Exported 1; Skipped 0; Blocked 12; Failed 0'));
  command = await run('scripts/export-knowledge-production-brief.mjs', [
    '--scope',
    'PART-1',
    '--output',
    `${temporaryRelative}/part-one-batch`
  ]);
  assert.equal(command.code, 0, command.stderr);
  assert(command.stdout.includes('Exported 0; Skipped 12; Blocked 0; Failed 0'));

  const exporterSource = await fs.readFile(
    path.join(root, 'scripts/export-knowledge-production-brief.mjs'),
    'utf8'
  );
  const resolverSource = await fs.readFile(
    path.join(root, 'scripts/lib/knowledge-readiness/scope-resolver.mjs'),
    'utf8'
  );
  assert.equal(/KN-PREFACE-001|KN-B1-P1-001/.test(exporterSource), false);
  assert.equal(/\b78\b/.test(resolverSource), false);
  assert.equal(/PREFACE-\d{3}/.test(resolverSource), false);
  assert.match(exporterSource, /resolveKnowledgeScope/);
  assert.match(exporterSource, /loadCanonicalContext\(root, nodeCode, locale\)/);

  console.log('✓ PJA-W2F-A Universal Canonical Production Readiness passed.');
  console.log('  Registry drives 13 Canonical Nodes; 65 Blueprint-planned Part 1–5 Nodes remain explicitly not registered.');
  console.log('  One preserved KN-PREFACE-001 record is exportable; 12 deterministic Skeletons remain production_blocked without auto-written Thesis or Boundary.');
  console.log('  ALL, PREFACE, Book, Part, Node-prefix and future Book/Part pattern scopes share one Resolver, Schema, Initializer, Validator and Exporter path.');
  console.log('  Registry, Blueprint, Learning Paths, Supporting Questions, Article/Claim Schemas, Governance and Renderer remain byte-identical to HEAD.');
  console.log('  State: PJA-W2F-A1-v1.0.0-Frozen.');
} finally {
  await fs.rm(temporary, { recursive: true, force: true });
}
