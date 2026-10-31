/*
 * Shared PWS-I9 deterministic rule core.
 *
 * This browser-neutral module is consumed by both the canonical server-side
 * import path and PJA-W2's read-only public projection.
 */
const ROUTING_BOUNDARIES = Object.freeze({
  PUBLIC_KNOWLEDGE: 'public_knowledge',
  FREE_OBSERVATION: 'free_observation',
  INDIVIDUAL_ANALYSIS: 'individual_analysis_required',
  PROFESSIONAL_RESPONSIBILITY: 'professional_responsibility_required',
  UNCLASSIFIED: 'unclassified'
});

const PERSONAL_MARKERS = Object.freeze([
  ' i ', ' me ', ' my ', ' mine ', ' myself ', ' should i ', 'what should i',
  '我', '我的', '我要', '我该', '应该怎么', '怎么办', '替我决定'
]);

const DECISION_MARKERS = Object.freeze([
  'should i', 'what should i do', 'choose', 'decide', 'recommend',
  'tell me whether', 'best for me', '该不该', '应该怎么做', '怎么选择',
  '帮我决定', '推荐给我', '最适合我'
]);

const PROFESSIONAL_MARKERS = Object.freeze([
  'diagnose', 'diagnosis', 'treatment', 'medication', 'dose', 'symptom',
  'legal advice', 'lawsuit', 'court', 'contract liability', 'tax advice',
  'investment advice', 'financial advice', 'suicide', 'self-harm',
  '诊断', '治疗', '药物', '剂量', '症状', '法律意见', '诉讼', '法院',
  '合同责任', '税务意见', '投资建议', '财务建议', '自杀', '自残'
]);

const URGENT_MARKERS = Object.freeze([
  'emergency', 'urgent', 'immediately', 'overdose', 'cannot breathe',
  'chest pain', 'suicide', 'self-harm', '紧急', '立即', '马上',
  '过量', '无法呼吸', '胸痛', '自杀', '自残'
]);

const STOP_TERMS = new Set([
  'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between',
  'cannot', 'could', 'does', 'from', 'have', 'into', 'needed', 'only',
  'should', 'than', 'that', 'their', 'there', 'these', 'they', 'this',
  'through', 'what', 'when', 'where', 'which', 'while', 'with', 'without',
  'would', 'why', 'your'
]);

const OBSERVATION_PROMPTS = Object.freeze({
  en: Object.freeze({
    public_knowledge: Object.freeze([
      'Which concept or mechanism would you like to understand first?'
    ]),
    free_observation: Object.freeze([
      'What change or pattern have you directly noticed?',
      'What remains unknown or uncertain?'
    ]),
    individual_analysis_required: Object.freeze([
      'What facts have you directly observed without interpreting them?',
      'Which decision boundary or consequence makes this personal?'
    ]),
    professional_responsibility_required: Object.freeze([
      'Record only the minimum relevant facts and avoid relying on this route for a professional decision.'
    ]),
    unclassified: Object.freeze([
      'Could you restate the question using one concrete topic or observed change?'
    ])
  }),
  'zh-Hans': Object.freeze({
    public_knowledge: Object.freeze([
      '你希望先理解哪一个概念或运行机制？'
    ]),
    free_observation: Object.freeze([
      '你直接观察到什么变化或重复模式？',
      '目前仍有哪些未知或不确定部分？'
    ]),
    individual_analysis_required: Object.freeze([
      '哪些内容是你直接观察到、尚未加入解释的事实？',
      '哪一个决定边界或现实后果使这个问题成为个体问题？'
    ]),
    professional_responsibility_required: Object.freeze([
      '请只记录最低必要事实，不要依赖此路由形成专业决定。'
    ]),
    unclassified: Object.freeze([
      '请用一个具体主题或已观察到的变化重新表达问题。'
    ])
  })
});

function text(value) {
  return typeof value === 'string'
    ? value.normalize('NFKC').replace(/\s+/g, ' ').trim()
    : '';
}

function normalized(value) {
  return ` ${text(value).toLowerCase()} `;
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function includesMarker(corpus, markers) {
  return markers.some(marker => corpus.includes(marker.toLowerCase()));
}

function termsFrom(value) {
  const source = text(value).toLowerCase();
  if (!source) return [];

  const latin = source.match(/[a-z0-9][a-z0-9_-]{1,}/g) || [];
  const han = source.match(/[\u3400-\u9fff]{2,}/g) || [];
  return unique([source, ...latin, ...han]);
}

function meaningfulTerm(term) {
  if (/^[a-z0-9_-]+$/.test(term)) {
    return term.length >= 4 && !STOP_TERMS.has(term);
  }
  return term.length >= 2;
}

function matchScore(corpus, terms) {
  let score = 0;
  for (const term of unique(terms.map(value => text(value).toLowerCase()))) {
    if (!meaningfulTerm(term) || !corpus.includes(term)) continue;
    score += term.includes(' ') || /[\u3400-\u9fff]/.test(term) ? 3 : 1;
  }
  return score;
}

function stableQuestionId(question) {
  let hash = 0x811c9dc5;
  for (const character of text(question)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return `question_ephemeral_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function approvedPublishedRecord(record) {
  return (
    record?.contentStatus === 'content_reviewed' &&
    record?.reviewStatus === 'approved' &&
    record?.publicationStatus === 'published'
  );
}

function registryCollections(registries = {}) {
  return {
    concepts: list(registries.concepts?.concepts || registries.concepts),
    themes: list(registries.themes?.themes || registries.themes),
    nodes: list(registries.nodes?.nodes || registries.nodes),
    localizedContent: list(
      registries.localizedContent?.localizedContent ||
      registries.localizedContent
    ),
    assets: list(registries.assets?.assets || registries.assets),
    supportingQuestions: list(
      registries.supportingQuestions?.supportingQuestions ||
      registries.supportingQuestions
    ),
    searchAliases: list(
      registries.searchAliases?.searchAliases ||
      registries.searchAliases
    ),
    blueprintNodes: list(
      registries.blueprint?.nodes ||
      registries.blueprintNodes
    )
  };
}

function conceptMatches(corpus, concepts) {
  return concepts
    .map(concept => ({
      id: concept.id,
      score: matchScore(corpus, [
        concept.id?.replaceAll('_', ' '),
        concept.en,
        concept['zh-Hans']
      ])
    }))
    .filter(match => match.id && match.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);
}

function nodeTerms(node, localizedByNode, questionsByNode, aliasesByNode) {
  const localized = localizedByNode.get(node.nodeCode);
  const terms = [
    node.titleZhHans,
    node.canonicalQuestionKey?.replaceAll('-', ' '),
    localized?.locales?.en?.displayQuestion,
    localized?.locales?.['zh-Hans']?.displayQuestion
  ];

  for (const question of questionsByNode.get(node.nodeCode) || []) {
    terms.push(
      question.locales?.en?.displayQuestion,
      question.locales?.['zh-Hans']?.displayQuestion
    );
  }

  for (const alias of aliasesByNode.get(node.nodeCode) || []) {
    terms.push(
      alias.alias,
      alias.value,
      alias.locales?.en,
      alias.locales?.['zh-Hans']
    );
  }

  return terms.flatMap(termsFrom);
}

function matchNodes(corpus, registries) {
  const canonicalByCode = new Map(
    registries.nodes.map(node => [node.nodeCode, node])
  );
  const localizedByNode = new Map(
    registries.localizedContent.map(record => [record.nodeCode, record])
  );
  const questionsByNode = new Map();
  const aliasesByNode = new Map();

  for (const question of registries.supportingQuestions) {
    const values = questionsByNode.get(question.canonicalNodeCode) || [];
    values.push(question);
    questionsByNode.set(question.canonicalNodeCode, values);
  }

  for (const alias of registries.searchAliases) {
    const nodeCode = alias.canonicalNodeCode || alias.nodeCode;
    const values = aliasesByNode.get(nodeCode) || [];
    values.push(alias);
    aliasesByNode.set(nodeCode, values);
  }

  const allNodes = new Map();
  for (const node of registries.blueprintNodes) {
    allNodes.set(node.nodeCode, {
      ...node,
      canonicalNode: canonicalByCode.get(node.nodeCode) || null
    });
  }
  for (const node of registries.nodes) {
    if (!allNodes.has(node.nodeCode)) {
      allNodes.set(node.nodeCode, { ...node, canonicalNode: node });
    }
  }

  return [...allNodes.values()]
    .map(node => ({
      node,
      score: matchScore(
        corpus,
        nodeTerms(node, localizedByNode, questionsByNode, aliasesByNode)
      )
    }))
    .filter(match => match.score >= 2)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

function publishedResources(nodeMatches, registries, locale) {
  const localizedByNode = new Map(
    registries.localizedContent.map(record => [record.nodeCode, record])
  );
  const assetByCode = new Map(
    registries.assets.map(asset => [asset.assetCode, asset])
  );

  return nodeMatches.flatMap(({ node }) => {
    const localized = localizedByNode.get(node.nodeCode)?.locales?.[locale];
    if (!approvedPublishedRecord(localized)) return [];

    const asset = assetByCode.get(localized.articleAssetCode);
    if (
      asset?.assetType !== 'article' ||
      asset?.locale !== locale ||
      !approvedPublishedRecord(asset) ||
      !asset.publicHref
    ) {
      return [];
    }

    return [{
      resourceType: 'article',
      nodeCode: node.nodeCode,
      assetCode: asset.assetCode,
      locale,
      title: localized.displayQuestion,
      href: asset.publicHref
    }];
  });
}

function detectedThemes(nodeMatches, registries, corpus) {
  const themeCodes = nodeMatches
    .map(({ node }) => node.canonicalNode?.themeCode || node.themeCode)
    .filter(Boolean);

  const titleMatches = registries.themes
    .map(theme => ({
      code: theme.themeCode,
      score: matchScore(corpus, [
        theme.canonicalKey?.replaceAll('-', ' '),
        theme.titles?.en,
        theme.titles?.['zh-Hans']
      ])
    }))
    .filter(match => match.score >= 2)
    .sort((left, right) => right.score - left.score)
    .map(match => match.code);

  return unique([...themeCodes, ...titleMatches]).slice(0, 4);
}

function matchedConceptIds(corpus, nodeMatches, registries) {
  const direct = conceptMatches(corpus, registries.concepts).map(match => match.id);
  const nodeText = nodeMatches.map(({ node }) => node.titleZhHans || '').join(' ');
  const associated = conceptMatches(normalized(nodeText), registries.concepts)
    .map(match => match.id);
  return unique([...direct, ...associated]).slice(0, 6);
}

function routingDecision({
  corpus,
  concepts,
  themes,
  nodeMatches,
  resources
}) {
  const personal = includesMarker(corpus, PERSONAL_MARKERS);
  const decision = includesMarker(corpus, DECISION_MARKERS);
  const professional = includesMarker(corpus, PROFESSIONAL_MARKERS);
  const urgent = includesMarker(corpus, URGENT_MARKERS);
  const hasKnowledgeMatch = concepts.length > 0 || themes.length > 0 ||
    nodeMatches.length > 0;

  if (urgent) {
    return {
      complexityLevel: 5,
      individualAnalysisRequired: true,
      professionalResponsibilityRequired: true,
      routingBoundary: ROUTING_BOUNDARIES.PROFESSIONAL_RESPONSIBILITY
    };
  }

  if (professional && personal) {
    return {
      complexityLevel: 4,
      individualAnalysisRequired: true,
      professionalResponsibilityRequired: true,
      routingBoundary: ROUTING_BOUNDARIES.PROFESSIONAL_RESPONSIBILITY
    };
  }

  if (personal && decision) {
    return {
      complexityLevel: 3,
      individualAnalysisRequired: true,
      professionalResponsibilityRequired: false,
      routingBoundary: ROUTING_BOUNDARIES.INDIVIDUAL_ANALYSIS
    };
  }

  if (resources.length > 0) {
    return {
      complexityLevel: concepts.length > 1 || themes.length > 1 ? 2 : 1,
      individualAnalysisRequired: false,
      professionalResponsibilityRequired: false,
      routingBoundary: ROUTING_BOUNDARIES.PUBLIC_KNOWLEDGE
    };
  }

  if (hasKnowledgeMatch) {
    return {
      complexityLevel: 2,
      individualAnalysisRequired: false,
      professionalResponsibilityRequired: false,
      routingBoundary: ROUTING_BOUNDARIES.FREE_OBSERVATION
    };
  }

  return {
    complexityLevel: 1,
    individualAnalysisRequired: false,
    professionalResponsibilityRequired: false,
    routingBoundary: ROUTING_BOUNDARIES.UNCLASSIFIED
  };
}

function routeConfidence({ decision, concepts, themes, nodeMatches, resources }) {
  if (decision.routingBoundary === ROUTING_BOUNDARIES.UNCLASSIFIED) return 0;
  if (
    decision.routingBoundary ===
    ROUTING_BOUNDARIES.PROFESSIONAL_RESPONSIBILITY
  ) {
    return decision.complexityLevel === 5 ? 0.98 : 0.9;
  }
  if (
    decision.routingBoundary === ROUTING_BOUNDARIES.INDIVIDUAL_ANALYSIS
  ) {
    return 0.84;
  }

  const evidence = (
    concepts.length +
    themes.length +
    nodeMatches.length * 2 +
    resources.length * 3
  );
  return Math.min(0.96, Number((0.35 + evidence * 0.07).toFixed(2)));
}

export function evaluateQuestionRoute(input = {}, suppliedRegistries = {}) {
  const question = text(input.question);
  if (!question) throw new TypeError('question_required');

  const locale = input.locale === 'en' ? 'en' : 'zh-Hans';
  const corpus = normalized(question);
  const registries = registryCollections(suppliedRegistries);
  const nodeMatches = matchNodes(corpus, registries);
  const concepts = matchedConceptIds(corpus, nodeMatches, registries);
  const themes = detectedThemes(nodeMatches, registries, corpus);
  const resources = publishedResources(nodeMatches, registries, locale);
  const decision = routingDecision({
    corpus,
    concepts,
    themes,
    nodeMatches,
    resources
  });
  const confidence = routeConfidence({
    decision,
    concepts,
    themes,
    nodeMatches,
    resources
  });

  return Object.freeze({
    questionId: text(input.questionId) || stableQuestionId(question),
    detectedThemes: Object.freeze(themes),
    complexityLevel: decision.complexityLevel,
    matchedConcepts: Object.freeze(concepts),
    matchedResources: Object.freeze(resources.map(Object.freeze)),
    observationPrompts: Object.freeze([
      ...OBSERVATION_PROMPTS[locale][decision.routingBoundary]
    ]),
    individualAnalysisRequired: decision.individualAnalysisRequired,
    professionalResponsibilityRequired:
      decision.professionalResponsibilityRequired,
    routingBoundary: decision.routingBoundary,
    confidence
  });
}

export { ROUTING_BOUNDARIES };
