import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ARTICLE_CONTENT_FILES,
  ARTICLE_GENERATOR_VERSION,
  ARTICLE_PACKAGE_FILES,
  evaluateArticleEligibility,
  parseProductionBrief,
  stableJson,
  validateProductionBriefContract
} from './lib/knowledge-production/article-package.mjs';
import { buildArticleDraftPackage } from './lib/knowledge-production/article-generator.mjs';
import { validateArticleDraftPackage } from './lib/knowledge-production/article-validator.mjs';
import {
  resolveArticleVersion,
  writeArticlePackage
} from './lib/knowledge-production/article-versioning.mjs';
import { sha256 } from './lib/knowledge-production/checksum.mjs';
import {
  compileReadinessSchema,
  loadKnowledgeInventory,
  readReadiness,
  resolveKnowledgeScope,
  validateReadinessRecord
} from './lib/knowledge-production/readiness-system.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const packageJson = JSON.parse(await fs.readFile(
  path.join(root, 'package.json'),
  'utf8'
));
const temporaryRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), 'phios-pja-w2f-b2-check-')
);

try {
  checkPackageCommands();
  await checkRealEligibility();
  await checkBriefCompatibility();
  await checkGenericFixture('KN-PREFACE-FIXTURE-901');
  await checkGenericFixture('KN-B3-P14-FIXTURE-901');
  await checkCliBlocking();
  await checkProtectedFiles();
  console.log('✓ PJA-W2F-B2 governed Canonical Article Production infrastructure passed.');
  console.log('  No registered Preface Node is production_ready; all real Article production remains blocked.');
  console.log('  Isolated human-frozen fixtures validate Draft, Claim, Source, Supporting Question, Media, Manifest and version contracts.');
  console.log('  Generated states remain draft, not_reviewed, not_approved and not_publication_ready.');
  console.log('  Result: Conditional Passed — eligible content population remains pending.');
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
  await fs.rm(path.join(root, '.tmp/pja-w2f-b2-check-real'), {
    recursive: true,
    force: true
  });
  await fs.rm(path.join(root, '.tmp/pja-w2f-b2-brief-contract'), {
    recursive: true,
    force: true
  });
}

function checkPackageCommands() {
  assert.equal(
    packageJson.scripts['knowledge:produce-article'],
    'node scripts/produce-canonical-article.mjs'
  );
  assert.equal(
    packageJson.scripts['knowledge:validate-article'],
    'node scripts/validate-canonical-article.mjs'
  );
  assert.equal(
    packageJson.scripts['knowledge:validate-articles'],
    'node scripts/validate-canonical-article.mjs'
  );
  const command = packageJson.scripts['check:pja-w2f-b2'];
  const chain = command.split(/\s*&&\s*/);
  assert.equal(chain.length, 2);
  assert.match(chain[0], /^npm\s+run\s+check:pja-w2f-b1$/);
  assert.match(
    chain[1],
    /^node\s+scripts\/check-pja-w2f-b2-preface-article-production\.mjs$/
  );
  assert.equal(command.includes('check:pja-w2f-b2 &&'), false);
  assert.equal(command.includes('check:pja-w2f-b3'), false);
}

async function checkRealEligibility() {
  const knowledge = await loadKnowledgeInventory(root);
  const selection = resolveKnowledgeScope(knowledge, { scope: 'PREFACE' });
  const schema = await compileReadinessSchema(root);
  assert.equal(selection.length, knowledge.inventory.length);
  let eligible = 0;
  let legacyReview = 0;
  let blocked = 0;
  for (const item of selection) {
    const loaded = await readReadiness(root, item);
    const assessment = validateReadinessRecord(item, loaded, schema);
    const result = evaluateArticleEligibility(
      item,
      loaded,
      assessment,
      'zh-Hans'
    );
    if (result.articleProductionEligibility === 'eligible') eligible += 1;
    if (result.readinessState === 'ready_for_editorial_review') {
      legacyReview += 1;
    }
    if (result.articleProductionEligibility === 'blocked') blocked += 1;
    assert.equal(result.humanEditorialFreeze, false);
    assert(result.blockingReasons.includes('HUMAN_EDITORIAL_FREEZE_REQUIRED'));
  }
  assert.equal(eligible, 0);
  assert.equal(legacyReview, 1);
  assert.equal(blocked, selection.length);
  assert.throws(
    () => resolveKnowledgeScope(knowledge, {
      nodeCode: 'KN-B1-P1-001'
    }),
    error => error.code === 'CANONICAL_NODE_NOT_FOUND'
  );
  assert.throws(
    () => resolveKnowledgeScope(knowledge, {
      nodeCode: 'KN-NOT-REGISTERED-999'
    }),
    error => error.code === 'CANONICAL_NODE_NOT_FOUND'
  );
}

async function checkBriefCompatibility() {
  const output = '.tmp/pja-w2f-b2-brief-contract';
  const result = await runNode([
    'scripts/export-knowledge-production-brief.mjs',
    'KN-PREFACE-001',
    '--output',
    output
  ]);
  assert.equal(result.code, 0, result.output);
  const brief = parseProductionBrief(await fs.readFile(
    path.join(root, output, 'KN-PREFACE-001-production-brief.md'),
    'utf8'
  ));
  assert.equal(
    brief.canonicalIdentity.canonicalNodeCode,
    'KN-PREFACE-001'
  );
  assert(brief.articleBoundary.mustEstablish.length > 0);
  assert(brief.articleBoundary.requiredDistinctions.length > 0);
  assert(brief.articleBoundary.mustNotClaim.length > 0);
  assert(brief.articleBoundary.includedScope.length > 0);
  assert(brief.articleBoundary.excludedScope.length > 0);
  assert.equal(brief.futurePublicationGate.informationalOnly, true);
  assert.equal(
    brief.packageManifestContract.checksumAlgorithm,
    'sha256'
  );
  await fs.rm(path.join(root, output), { recursive: true, force: true });
}

function fixtureBrief(nodeCode) {
  const base = {
    briefSchemaVersion: 'PHI-OS-KNOWLEDGE-PRODUCTION-BRIEF-v1.1.0',
    productionBriefVersion: '1.0.0',
    canonicalIdentity: {
      canonicalNodeCode: nodeCode,
      canonicalTitle: '受治理文章生产测试',
      canonicalQuestion: '冻结输入如何形成受治理的文章草稿？',
      locale: 'zh-Hans',
      domainCode: 'KD-FIXTURE',
      themeCode: 'TH-FIXTURE',
      nodeType: 'mechanism_question',
      slug: 'governed-article-production-fixture'
    },
    canonicalProposition:
      '受治理的文章草稿只能由已冻结输入形成，并且不得取得审核或发布权威。',
    whyThisNodeExists:
      '建立从冻结输入到可审核草稿之间的确定性生产边界',
    mechanism:
      '读取冻结 Brief，保持边界，生成分离的 Ledger，并验证 Package',
    articleBoundary: {
      mustEstablish: [
        '冻结输入先于草稿生成',
        '草稿状态与审批状态必须分离'
      ],
      requiredDistinctions: [
        'Production Ready ≠ Article Approved',
        'Media Brief ≠ Registered Asset'
      ],
      mustNotClaim: [
        '不得声称测试草稿已经获得人类批准',
        '不得声称测试草稿已经发布'
      ],
      includedScope: [
        '受治理草稿结构',
        '可追溯 Package'
      ],
      excludedScope: [
        '正式发布',
        '个人建议'
      ]
    },
    sequenceBoundary: {
      previousNode: null,
      nextNode: null,
      entryBoundary: 'Fixture entry',
      completionBoundary: 'Draft package validated',
      handoffBoundary: '交由未来人类审核'
    },
    claimBoundary: {
      claims: [
        {
          claimId: `CLM-${nodeCode}-001`,
          statement: '受治理的草稿不等于获得批准的文章。',
          claimType: 'phi_os_interpretation',
          sourceRequired: true,
          sourceCodes: ['SRC-FIXTURE-001'],
          qualification: '仅验证内部生产契约。',
          articleSection: 'S01'
        },
        {
          claimId: `CLM-${nodeCode}-002`,
          statement: '测试草稿不得取得发布权威。',
          claimType: 'boundary_statement',
          sourceRequired: false,
          sourceCodes: [],
          qualification: '状态边界。',
          articleSection: 'S06'
        }
      ]
    },
    supportingQuestions: [
      {
        supportingQuestionCode: 'SQ-FIXTURE-001',
        canonicalNodeCode: nodeCode,
        questionText: '草稿为什么不能自动批准？',
        treatment: 'integrate',
        eligibility: 'eligible'
      },
      {
        supportingQuestionCode: 'SQ-FIXTURE-002',
        canonicalNodeCode: nodeCode,
        questionText: '未来发布如何执行？',
        treatment: 'defer',
        eligibility: 'eligible'
      }
    ],
    supportingQuestionFieldSemantics: {
      canonicalNodeCode: 'Canonical ownership',
      sourceNodeCode: 'Origin only'
    },
    sourcePlan: {
      sourceReferences: [
        {
          sourceCode: 'SRC-FIXTURE-001',
          sourceType: 'internal_canonical_source',
          title: 'Fixture Canonical Source',
          author: 'Fixture Authority'
        },
        {
          sourceCode: 'SRC-FIXTURE-001',
          publicationDate: null
        }
      ],
      sourceVerificationRules: 'Human verification required',
      noFabricationRules: {
        sourceCodesMayBeInvented: false
      }
    },
    figureContract: {
      figureRequirement: 'brief_required_asset_reference_deferred',
      mediaBriefRequired: true,
      articleFigureBlockAllowed: false,
      assetRegistryRequiredBeforeArticleReference: true,
      figurePurpose: 'Show the governed sequence',
      recommendedFormat: 'diagram',
      accessibilityRequirement: 'Reviewed alt text required'
    },
    editorialContract: {
      articlePurpose: 'public_knowledge_explanation',
      audience: 'public_reader',
      languagePolicy: {
        canonicalLocale: 'zh-Hans',
        localizationRequiresHumanReview: true
      },
      canonicalContinuity: 'Registry authority',
      articleCompletionBoundary: 'Current node only',
      aiAuthorityBoundary: 'No approval authority',
      humanApprovalAuthority: 'Human editorial authority only'
    },
    draftRules: {
      allowedStatus: ['draft', 'ready_for_human_review', 'changes_required'],
      forbiddenStatus: ['approved', 'publication_ready', 'published'],
      humanApprovalRequirement: true
    },
    futurePublicationGate: {
      claimGate: {
        humanReviewRequired: true
      },
      target: {
        reviewStatus: 'approved',
        publicationStatus: 'published'
      },
      informationalOnly: true
    },
    packageManifestContract: {
      packageType: 'canonical_article_package',
      packageSchemaVersion: 'PHI-OS-KNOWLEDGE-PACKAGE-v1.0.0',
      requiredFields: [
        'packageType',
        'packageSchemaVersion',
        'nodeCode',
        'locale',
        'status',
        'files'
      ],
      allowedStatus: ['draft', 'ready_for_human_review', 'changes_required'],
      checksumAlgorithm: 'sha256',
      checksumInput: 'original_file_bytes',
      requiredFiles: ARTICLE_PACKAGE_FILES,
      generatedPackageMayNotUseFinalPublicationStates: true
    }
  };
  return {
    ...base,
    productionBriefHash: sha256(Buffer.from(stableJson(base)))
  };
}

async function checkGenericFixture(nodeCode) {
  const brief = fixtureBrief(nodeCode);
  assert.equal(validateProductionBriefContract(brief), true);
  const invalid = structuredClone(brief);
  invalid.mechanism = '';
  assert.throws(
    () => validateProductionBriefContract(invalid),
    error => error.code === 'PRODUCTION_BRIEF_CONTRACT_INVALID'
  );
  const generatedAt = '2000-01-01T00:00:00.000Z';
  const first = buildArticleDraftPackage(brief, { generatedAt });
  const second = buildArticleDraftPackage(brief, { generatedAt });
  assert.deepEqual([...first.files], [...second.files]);
  assert.equal(first.sourceLedger.sources.length, 1);
  assert.equal(first.coverageLedger.questions.length, 2);
  assert.equal(first.coverageLedger.questions[0].coverageState, 'covered');
  assert.equal(first.coverageLedger.questions[1].coverageState, 'deferred');
  assert.equal(first.mediaBrief.mediaBriefState, 'required');
  assert.equal(first.mediaBrief.assetCode, null);
  assert.equal(first.mediaBrief.articleFigureState, 'deferred');
  assert.deepEqual(first.article.figureReferences, []);
  assert.equal(first.article.articleState, 'draft');
  assert.equal(first.article.reviewState, 'not_reviewed');
  assert.equal(first.article.approvalState, 'not_approved');
  assert.equal(first.article.publicationState, 'not_publication_ready');
  assert.equal(first.manifest.generatorVersion, ARTICLE_GENERATOR_VERSION);
  assert.deepEqual(first.manifest.requiredFiles, ARTICLE_PACKAGE_FILES);
  assert.deepEqual(
    first.manifest.files.map(file => file.path),
    ARTICLE_CONTENT_FILES
  );
  const outputRoot = path.join(
    temporaryRoot,
    nodeCode.toLowerCase().replaceAll('-', '_')
  );
  const version = await resolveArticleVersion({
    root,
    nodeCode,
    locale: 'zh-Hans',
    productionBriefHash: brief.productionBriefHash,
    outputRoot: path.relative(root, outputRoot)
  });
  assert.equal(version.articleVersion, '1.0.0');
  await writeArticlePackage(version.targetDirectory, first.files);
  const eligibility = {
    articleProductionEligibility: 'eligible'
  };
  let validation = await validateArticleDraftPackage({
    packageDirectory: version.targetDirectory,
    nodeCode,
    locale: 'zh-Hans',
    brief,
    eligibility
  });
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  const same = await resolveArticleVersion({
    root,
    nodeCode,
    locale: 'zh-Hans',
    productionBriefHash: brief.productionBriefHash,
    outputRoot: path.relative(root, outputRoot)
  });
  assert.equal(same.existingSameInput, true);
  assert.equal(same.articleVersion, '1.0.0');
  await assert.rejects(
    writeArticlePackage(same.targetDirectory, first.files, {
      existingSameInput: true,
      existingArticle: same.existingArticle
    }),
    error => error.code === 'ARTICLE_DRAFT_ALREADY_EXISTS'
  );
  await writeArticlePackage(same.targetDirectory, first.files, {
    force: true,
    existingSameInput: true,
    existingArticle: same.existingArticle
  });
  const changedBrief = {
    ...brief,
    productionBriefHash: sha256(Buffer.from(`${brief.productionBriefHash}:changed`))
  };
  const changed = await resolveArticleVersion({
    root,
    nodeCode,
    locale: 'zh-Hans',
    productionBriefHash: changedBrief.productionBriefHash,
    outputRoot: path.relative(root, outputRoot)
  });
  assert.equal(changed.articleVersion, '1.0.1');
  assert.notEqual(changed.targetDirectory, same.targetDirectory);
  const reviewed = JSON.parse(await fs.readFile(
    path.join(same.targetDirectory, 'article.json'),
    'utf8'
  ));
  reviewed.reviewState = 'in_review';
  await fs.writeFile(
    path.join(same.targetDirectory, 'article.json'),
    stableJson(reviewed)
  );
  const protectedDraft = await resolveArticleVersion({
    root,
    nodeCode,
    locale: 'zh-Hans',
    productionBriefHash: brief.productionBriefHash,
    outputRoot: path.relative(root, outputRoot)
  });
  await assert.rejects(
    writeArticlePackage(protectedDraft.targetDirectory, first.files, {
      force: true,
      existingSameInput: true,
      existingArticle: protectedDraft.existingArticle
    }),
    error => error.code === 'ARTICLE_REVIEWED_DRAFT_PROTECTED'
  );
  const checksumFixture = path.join(outputRoot, 'checksum-fixture');
  await fs.mkdir(checksumFixture, { recursive: true });
  for (const [name, content] of first.files) {
    await fs.writeFile(path.join(checksumFixture, name), content);
  }
  await fs.appendFile(
    path.join(checksumFixture, 'article.md'),
    '\nTampered.\n'
  );
  validation = await validateArticleDraftPackage({
    packageDirectory: checksumFixture,
    nodeCode,
    locale: 'zh-Hans',
    brief,
    eligibility
  });
  assert.equal(validation.valid, false);
  assert(validation.errors.some(error => (
    error === 'PACKAGE_CHECKSUM_MISMATCH:article.md'
  )));
}

async function checkCliBlocking() {
  const cases = [
    {
      args: ['scripts/produce-canonical-article.mjs', 'KN-PREFACE-001',
        '--output', '.tmp/pja-w2f-b2-check-real'],
      code: 1,
      token: 'HUMAN_EDITORIAL_FREEZE_REQUIRED'
    },
    {
      args: ['scripts/produce-canonical-article.mjs', 'KN-PREFACE-002',
        '--output', '.tmp/pja-w2f-b2-check-real'],
      code: 1,
      token: 'NODE_NOT_PRODUCTION_READY'
    },
    {
      args: ['scripts/produce-canonical-article.mjs', 'KN-B1-P1-001',
        '--output', '.tmp/pja-w2f-b2-check-real'],
      code: 2,
      token: 'BLUEPRINT_PLANNED_NOT_REGISTERED'
    },
    {
      args: ['scripts/produce-canonical-article.mjs',
        'KN-NOT-REGISTERED-999',
        '--output', '.tmp/pja-w2f-b2-check-real'],
      code: 2,
      token: 'CANONICAL_NODE_NOT_FOUND'
    },
    {
      args: ['scripts/produce-canonical-article.mjs', 'KN-PREFACE-001',
        '--locale', 'en', '--output', '.tmp/pja-w2f-b2-check-real'],
      code: 1,
      token: 'LOCALE_NOT_READY'
    }
  ];
  for (const fixture of cases) {
    const result = await runNode(fixture.args);
    assert.equal(result.code, fixture.code, result.output);
    assert(result.output.includes(fixture.token), result.output);
  }
  const knowledge = await loadKnowledgeInventory(root);
  const batch = await runNode([
    'scripts/produce-canonical-article.mjs',
    '--scope',
    'PREFACE',
    '--output',
    '.tmp/pja-w2f-b2-check-real'
  ]);
  assert.equal(batch.code, 0, batch.output);
  assert(batch.output.includes(`Blocked: ${knowledge.inventory.length}`));
  assert(batch.output.includes('Produced: 0'));
  assert.equal(
    await fs.access(path.join(root, '.tmp/pja-w2f-b2-check-real'))
      .then(() => true, () => false),
    false
  );
  const source = await Promise.all([
    'scripts/produce-canonical-article.mjs',
    'scripts/validate-canonical-article.mjs',
    'scripts/lib/knowledge-production/article-package.mjs',
    'scripts/lib/knowledge-production/article-generator.mjs',
    'scripts/lib/knowledge-production/article-validator.mjs'
  ].map(file => fs.readFile(path.join(root, file), 'utf8')));
  const implementation = source.join('\n');
  assert.equal(/KN-PREFACE-00[1-9]|KN-B1-P[1-5]-00/.test(implementation), false);
  assert.equal(/\b13\b/.test(implementation), false);
}

async function runNode(args) {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, {
      cwd: root,
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    });
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error) {
    return {
      code: error.code,
      output: `${error.stdout || ''}${error.stderr || ''}`
    };
  }
}

async function checkProtectedFiles() {
  const protectedPaths = [
    'content/knowledge/registry',
    'content/knowledge/blueprints',
    'content/knowledge/editorial/readiness',
    'content/knowledge/editorial/schemas',
    'content/knowledge/schemas',
    'content/knowledge/governance',
    'content/knowledge/articles',
    'scripts/export-knowledge-production-brief.mjs',
    'scripts/lib/knowledge-production/readiness-system.mjs',
    'scripts/lib/knowledge-production/repository-loader.mjs',
    'scripts/lib/knowledge-production/production-config.mjs',
    'scripts/lib/knowledge-production/package-validator.mjs',
    'scripts/check-pja-w2e-r1-production-brief-hardening.mjs',
    'scripts/check-pja-w2f-a-universal-production-readiness.mjs',
    'scripts/check-pja-w2f-b1-preface-content-population.mjs',
    'docs/pja/PJA-W2F-A-CANONICAL-READINESS-INVENTORY.md',
    'docs/pja/PJA-W2F-A-UNIVERSAL-PRODUCTION-READINESS.md',
    'docs/pja/PJA-W2F-B1-PREFACE-CONTENT-POPULATION.md'
  ];
  const { stdout } = await execFileAsync(
    'git',
    ['status', '--porcelain=v1', '--', ...protectedPaths],
    { cwd: root, windowsHide: true }
  );
  assert.equal(stdout.trim(), '', `Protected files changed:\n${stdout}`);
  const productionDirectory = path.join(
    root,
    'content/knowledge/production/articles'
  );
  const productionEntries = await fs.readdir(
    productionDirectory
  ).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
  assert.equal(productionEntries.length, 0);
}
