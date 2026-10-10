import {
  ARTICLE_DRAFT_SCHEMA_VERSION,
  ARTICLE_GENERATOR_VERSION,
  ARTICLE_STATES,
  stableArticleCode,
  stableJson,
  stableMediaBriefCode,
  stablePackageCode,
  validateProductionBriefContract
} from './article-package.mjs';
import { buildClaimLedger } from './claim-ledger.mjs';
import { buildSourceLedger } from './source-ledger.mjs';
import {
  attachManifest,
  buildPackageManifest
} from './package-manifest.mjs';

const safeText = value => String(value ?? '').trim();

function distinctionText(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return safeText(value);
  return [
    value.left,
    value.right ? `与 ${value.right}` : null,
    value.reason ? `必须区分：${value.reason}` : null
  ].filter(Boolean).join(' ');
}

function makeSections(brief, claims, coverage) {
  const sections = [
    {
      sectionCode: 'S01',
      semanticRole: 'opening',
      heading: brief.canonicalIdentity.canonicalQuestion,
      content:
        `本文从这一问题进入：${brief.canonicalIdentity.canonicalQuestion}` +
        `核心判断将围绕“${brief.canonicalProposition}”展开，并保持既定范围。`
    },
    {
      sectionCode: 'S02',
      semanticRole: 'canonical_problem',
      heading: '问题为何需要被建立',
      content:
        `这篇文章承担的任务是：${brief.whyThisNodeExists}。` +
        '它只完成当前节点规定的理解任务，不扩张为后续节点的完整说明。'
    },
    {
      sectionCode: 'S03',
      semanticRole: 'mechanism_development',
      heading:
        safeText(brief.articleBoundary.mustEstablish[0]).slice(0, 48) ||
        '机制如何形成',
      content: brief.articleBoundary.mustEstablish.map(
        item => `需要建立的机制是：${safeText(item)}。`
      ).join('\n\n')
    },
    {
      sectionCode: 'S04',
      semanticRole: 'required_distinctions',
      heading:
        distinctionText(brief.articleBoundary.requiredDistinctions[0])
          .slice(0, 48) ||
        '必须保持的区分',
      content: brief.articleBoundary.requiredDistinctions.map(
        item => `必须澄清：${distinctionText(item)}。`
      ).join('\n\n')
    }
  ];
  const integrated = coverage.filter(item => item.coverageState === 'covered');
  if (integrated.length) {
    sections.push({
      sectionCode: 'S05',
      semanticRole: 'supporting_question_integration',
      heading: '相关问题如何进入本文',
      content: integrated.map(item => (
        `${item.questionText} 本文按既定处理方式将其纳入当前机制说明。`
      )).join('\n\n')
    });
  }
  sections.push({
    sectionCode: 'S06',
    semanticRole: 'boundary_and_qualification',
    heading: '范围与限定',
    content: [
      ...brief.articleBoundary.includedScope.map(item => `本文包括：${safeText(item)}。`),
      ...brief.articleBoundary.excludedScope.map(item => `本文不包括：${safeText(item)}。`),
      ...brief.articleBoundary.mustNotClaim.map(item => `本文不作以下声称：${safeText(item)}。`)
    ].join('\n\n')
  });
  sections.push({
    sectionCode: 'S07',
    semanticRole: 'continuity_handoff',
    heading: '继续进入下一问题',
    content:
      brief.sequenceBoundary.handoffBoundary ||
      (
        brief.sequenceBoundary.nextNode
          ? '当前机制完成后，文章只保留进入下一节点所需的连续性。'
          : '当前节点在此完成，不扩张出新的核心命题。'
      )
  });
  const claimCodes = claims.map(claim => claim.claimCode);
  return sections.map(section => ({
    ...section,
    claimCodes: section.sectionCode === 'S06'
      ? claims
          .filter(claim => claim.claimClass === 'Boundary Claim')
          .map(claim => claim.claimCode)
      : section.sectionCode === 'S01'
        ? claimCodes.slice(0, 1)
        : [],
    supportingQuestionCodes: section.sectionCode === 'S05'
      ? integrated.map(item => item.supportingQuestionCode)
      : []
  }));
}

function buildSupportingCoverage(brief) {
  return brief.supportingQuestions.map(question => {
    const treatment = question.treatment;
    const covered = ['integrate', 'briefly_address'].includes(treatment)
      && question.eligibility === 'eligible';
    return {
      supportingQuestionCode: question.supportingQuestionCode,
      canonicalNodeCode: brief.canonicalIdentity.canonicalNodeCode,
      questionText: question.questionText,
      treatment,
      eligibility: question.eligibility,
      articlePlacement: covered ? 'S05' : null,
      coverageState: covered
        ? 'covered'
        : treatment === 'exclude'
          ? 'excluded'
          : 'deferred',
      notes: covered
        ? 'Covered through semantic binding; an independent heading is not required.'
        : 'Preserved outside the current article body according to the frozen treatment.'
    };
  });
}

function buildMediaBrief(brief, articleCode) {
  const contract = brief.figureContract;
  const required = contract.mediaBriefRequired === true ||
    contract.figureRequirement === 'required' ||
    contract.figureRequirement === 'brief_required_asset_reference_deferred';
  return {
    schemaVersion: 'PHI-OS-KNOWLEDGE-MEDIA-BRIEF-v1.0.0',
    mediaBriefCode: stableMediaBriefCode(
      brief.canonicalIdentity.canonicalNodeCode,
      brief.canonicalIdentity.locale
    ),
    canonicalNodeCode: brief.canonicalIdentity.canonicalNodeCode,
    articleCode,
    locale: brief.canonicalIdentity.locale,
    mediaBriefState: required ? 'required' : 'not_required',
    figurePurpose: required
      ? contract.figurePurpose || 'Visualize the frozen Canonical mechanism.'
      : null,
    conceptToVisualize: required ? brief.mechanism : null,
    mustEstablish: required ? brief.articleBoundary.mustEstablish : [],
    mustNotImply: required ? brief.articleBoundary.mustNotClaim : [],
    recommendedFormat: required
      ? contract.recommendedFormat || 'governed_diagram'
      : null,
    accessibilityRequirement: required
      ? contract.accessibilityRequirement ||
        'Provide reviewed alt text before Asset registration.'
      : null,
    assetState: 'not_created',
    assetCode: null,
    assetRegistryRequired:
      contract.assetRegistryRequiredBeforeArticleReference !== false,
    articleFigureState: required ? 'deferred' : 'not_required',
    figures: []
  };
}

function renderMarkdown(article, mediaBrief) {
  const paragraphs = article.sections.map(section => (
    `## ${section.heading}\n\n${section.content}`
  ));
  if (mediaBrief.articleFigureState === 'deferred') {
    paragraphs.splice(
      Math.min(3, paragraphs.length),
      0,
      '## 图示说明\n\n图示将在媒体简报完成、资产登记并通过审核后加入。'
    );
  }
  return `# ${article.title}\n\n${article.lead}\n\n${paragraphs.join('\n\n')}\n`;
}

export function buildArticleDraftPackage(brief, {
  articleVersion = '1.0.0',
  generatedAt = new Date().toISOString(),
  generatorVersion = ARTICLE_GENERATOR_VERSION
} = {}) {
  validateProductionBriefContract(brief);
  const nodeCode = brief.canonicalIdentity.canonicalNodeCode;
  const locale = brief.canonicalIdentity.locale;
  const articleCode = stableArticleCode(nodeCode, locale);
  const coverage = buildSupportingCoverage(brief);
  const claimLedger = buildClaimLedger(brief, articleCode);
  const sourceLedger = buildSourceLedger(brief, claimLedger.claims);
  const mediaBrief = buildMediaBrief(brief, articleCode);
  const sections = makeSections(brief, claimLedger.claims, coverage);
  const article = {
    schemaVersion: ARTICLE_DRAFT_SCHEMA_VERSION,
    articleCode,
    canonicalNodeCode: nodeCode,
    canonicalTitle: brief.canonicalIdentity.canonicalTitle,
    locale,
    articleVersion,
    productionBriefVersion: brief.productionBriefVersion,
    productionBriefHash: brief.productionBriefHash,
    articleState: ARTICLE_STATES.article,
    reviewState: ARTICLE_STATES.review,
    approvalState: ARTICLE_STATES.approval,
    publicationState: ARTICLE_STATES.publication,
    title: brief.canonicalIdentity.canonicalTitle,
    lead:
      `本文回答“${brief.canonicalIdentity.canonicalQuestion}”，` +
      '并只在已冻结的 Canonical 边界内建立理解。',
    sections,
    canonicalMechanism: brief.mechanism,
    requiredDistinctions: brief.articleBoundary.requiredDistinctions,
    boundaryStatement: {
      mustNotClaim: brief.articleBoundary.mustNotClaim,
      includedScope: brief.articleBoundary.includedScope,
      excludedScope: brief.articleBoundary.excludedScope
    },
    supportingQuestionCoverage: coverage.map(item => ({
      supportingQuestionCode: item.supportingQuestionCode,
      coverageState: item.coverageState,
      articlePlacement: item.articlePlacement
    })),
    claimCodes: claimLedger.claims.map(claim => claim.claimCode),
    sourceCodes: sourceLedger.sources.map(source => source.sourceCode),
    figureReferences: [],
    continuity: {
      previousNode: brief.sequenceBoundary.previousNode,
      nextNode: brief.sequenceBoundary.nextNode,
      handoffBoundary: brief.sequenceBoundary.handoffBoundary
    },
    contractCoverage: {
      mustEstablish: brief.articleBoundary.mustEstablish,
      requiredDistinctions: brief.articleBoundary.requiredDistinctions,
      mustNotClaim: brief.articleBoundary.mustNotClaim,
      includedScope: brief.articleBoundary.includedScope,
      excludedScope: brief.articleBoundary.excludedScope
    },
    generatedAt,
    generatorVersion
  };
  const coverageLedger = {
    schemaVersion:
      'PHI-OS-SUPPORTING-QUESTION-COVERAGE-v1.0.0',
    canonicalNodeCode: nodeCode,
    articleCode,
    locale,
    questions: coverage
  };
  const content = new Map([
    ['article.md', renderMarkdown(article, mediaBrief)],
    ['article.json', stableJson(article)],
    ['claim-ledger.json', stableJson(claimLedger)],
    ['source-ledger.json', stableJson(sourceLedger)],
    [
      'supporting-question-coverage.json',
      stableJson(coverageLedger)
    ],
    ['media-brief.json', stableJson(mediaBrief)]
  ]);
  const packageCode = stablePackageCode(nodeCode, locale, articleVersion);
  const manifest = buildPackageManifest({
    brief,
    articleCode,
    articleVersion,
    packageCode,
    generatorVersion,
    generatedAt,
    content
  });
  return {
    article,
    claimLedger,
    sourceLedger,
    coverageLedger,
    mediaBrief,
    manifest,
    files: attachManifest(content, manifest)
  };
}
