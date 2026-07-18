import { sanitizeConversation } from '../_lib/utils.js';
import { buildRuntimeEntry } from '../_lib/runtime-entry.js';
import routeRuntimeEntry from '../runtime/entry/provider-router.js';

const EVIDENCE_DEPTHS = Object.freeze({
  quick: Object.freeze({ minimum: 3, maximum: 4 }),
  guided: Object.freeze({ minimum: 5, maximum: 7 }),
  deep: Object.freeze({ minimum: 7, maximum: 10 })
});

function evidenceDepth(value) {
  const key = cleanText(value).toLowerCase();
  return {
    key: EVIDENCE_DEPTHS[key] ? key : 'guided',
    ...(EVIDENCE_DEPTHS[key] || EVIDENCE_DEPTHS.guided)
  };
}

const FIELD_LABELS = Object.freeze({
  observed_change: {
    en: 'observed change',
    'zh-Hans': '可观察变化'
  },
  timeline: {
    en: 'timeline',
    'zh-Hans': '时间线'
  },
  trigger: {
    en: 'trigger',
    'zh-Hans': '触发条件'
  },
  context: {
    en: 'context',
    'zh-Hans': '现实情境'
  },
  affected_realities: {
    en: 'affected Reality',
    'zh-Hans': '受影响的现实领域'
  },
  evidence: {
    en: 'supporting evidence',
    'zh-Hans': '支持证据'
  },
  counter_evidence: {
    en: 'counter-evidence',
    'zh-Hans': '反向证据'
  },
  dependency: {
    en: 'dependency',
    'zh-Hans': '依赖关系'
  },
  current_tension: {
    en: 'current tension',
    'zh-Hans': '当前张力'
  },
  desired_transition: {
    en: 'desired transition',
    'zh-Hans': '期望转变'
  }
});

function respond(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      ...headers
    }
  });
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/```(?:\w+)?/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function cleanStatement(value) {
  const cleaned = cleanText(value).replace(/^(?:有|yes)[。.!]?\s*/i, '');
  return /^(?:有|yes)[。.!]?$/i.test(cleaned) ? '' : cleaned;
}

function isPlainObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function itemText(item) {
  if (typeof item === 'string') return cleanText(item);
  if (!isPlainObject(item)) return '';

  return cleanText(
    item.statement ||
    item.question ||
    item.summary ||
    item.sourceText ||
    item.evidenceNeed ||
    item.domain ||
    item.source ||
    ''
  );
}

function mergeUniqueItems(...collections) {
  const seen = new Set();
  const output = [];

  for (const item of collections.flatMap(list)) {
    const value = itemText(item);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
}

function mergeSummary(previous, current, language) {
  const values = mergeUniqueItems(
    [cleanText(previous)],
    [cleanText(current)]
  ).map(itemText);

  return values.join(language === 'zh-Hans' ? '；' : '; ');
}

function previousRuntimeEntry(body) {
  const currentReading = isPlainObject(body?.currentReading)
    ? body.currentReading
    : {};

  return isPlainObject(currentReading.runtimeEntry)
    ? currentReading.runtimeEntry
    : isPlainObject(currentReading?.latest?.runtimeEntry)
      ? currentReading.latest.runtimeEntry
      : null;
}

function revisionStatements(body, conversation) {
  if (body?.mode !== 'revision') return [];

  const boundStatements = list(body?.answerBindings)
    .filter(binding =>
      isPlainObject(binding) &&
      (
        binding.revision === true ||
        cleanText(binding.target) === 'revision'
      )
    )
    .map(binding => cleanText(binding.content))
    .filter(Boolean);

  const latestUserStatement = [...list(conversation)]
    .reverse()
    .find(item => item?.role === 'user')
    ?.content;

  return mergeUniqueItems(
    boundStatements,
    boundStatements.length > 0
      ? []
      : [cleanText(latestUserStatement)]
  ).map(itemText);
}

function mergeRuntimeEntry(previous, current, language, options = {}) {
  if (!isPlainObject(previous)) return current;

  const preserveRealityChange = options.preserveRealityChange === true;
  const preserveCompletion =
    options.preserveCompletion === true &&
    previous?.entryAssessment?.entryComplete === true;
  const supplementalStatements = mergeUniqueItems(
    options.supplementalStatements
  ).map(itemText);

  const timingEstablished = Boolean(
    cleanText(current?.timing?.normalizedTiming) ||
    cleanText(current?.timing?.statedTiming)
  );

  const affectedDomains = mergeUniqueItems(
    previous.affectedDomains,
    current.affectedDomains
  );

  const entryEvidence = mergeUniqueItems(
    previous.entryEvidence,
    current.entryEvidence,
    supplementalStatements.map(statement => ({
      evidenceType: 'user_statement',
      source: 'entry_revision',
      statement,
      observedAt: '',
      reportedAt: new Date().toISOString(),
      confidence: 1
    }))
  ).map((item, index) => ({
    ...item,
    evidenceId: `ev_${String(index + 1).padStart(3, '0')}`
  }));

  const previousBoundary = isPlainObject(previous.evidenceBoundary)
    ? previous.evidenceBoundary
    : {};

  const currentBoundary = isPlainObject(current.evidenceBoundary)
    ? current.evidenceBoundary
    : {};

  return {
    ...previous,
    ...current,

    status:
      preserveCompletion
        ? 'ready_for_reconstruction'
        : current.status,

    entrySource: {
      ...previous.entrySource,
      ...current.entrySource
    },

    realityChange: {
      ...previous.realityChange,
      ...current.realityChange,
      rawStatement:
        preserveRealityChange
          ? cleanText(previous?.realityChange?.rawStatement)
          : cleanText(current?.realityChange?.rawStatement) ||
            cleanText(previous?.realityChange?.rawStatement),
      normalizedStatement:
        preserveRealityChange
          ? cleanText(previous?.realityChange?.normalizedStatement)
          : cleanText(current?.realityChange?.normalizedStatement) ||
            cleanText(previous?.realityChange?.normalizedStatement)
    },

    timing: timingEstablished
      ? {
          ...previous.timing,
          ...current.timing
        }
      : previous.timing,

    affectedDomains,

    initialContext: {
      ...previous.initialContext,
      ...current.initialContext,
      summary: mergeSummary(
        previous?.initialContext?.summary,
        current?.initialContext?.summary,
        language
      ),
      relevantConditions: mergeUniqueItems(
        previous?.initialContext?.relevantConditions,
        current?.initialContext?.relevantConditions
      )
    },

    entryEvidence,

    knownReality: mergeUniqueItems(
      previous.knownReality,
      current.knownReality,
      supplementalStatements.map(statement => ({
        statement,
        supportedBy: [],
        confidence: 1
      }))
    ),

    userInterpretation: {
      ...previous.userInterpretation,
      ...current.userInterpretation,
      summary: mergeSummary(
        previous?.userInterpretation?.summary,
        current?.userInterpretation?.summary,
        language
      )
    },

    desiredTransition:
      cleanStatement(current.desiredTransition) ||
      cleanStatement(previous.desiredTransition),

    counterEvidence: mergeUniqueItems(
      previous.counterEvidence,
      current.counterEvidence
    ).map(itemText),

    dependencies: mergeUniqueItems(
      previous.dependencies,
      current.dependencies
    ),

    emergingTension: {
      ...previous.emergingTension,
      ...current.emergingTension,
      summary: mergeSummary(
        previous?.emergingTension?.summary,
        current?.emergingTension?.summary,
        language
      ),
      competingForces: mergeUniqueItems(
        previous?.emergingTension?.competingForces,
        current?.emergingTension?.competingForces
      )
    },

    evidenceBoundary: {
      ...previousBoundary,
      ...currentBoundary,
      observedEvidence: mergeUniqueItems(
        previousBoundary.observedEvidence,
        currentBoundary.observedEvidence
      ),
      reportedExperience: mergeUniqueItems(
        previousBoundary.reportedExperience,
        currentBoundary.reportedExperience,
        supplementalStatements
      ),
      interpretation: mergeUniqueItems(
        previousBoundary.interpretation,
        currentBoundary.interpretation
      ),
      professionalAssessment: mergeUniqueItems(
        previousBoundary.professionalAssessment,
        currentBoundary.professionalAssessment
      ),
      counterEvidence: mergeUniqueItems(
        previousBoundary.counterEvidence,
        currentBoundary.counterEvidence
      ).map(itemText),
      dependencies: mergeUniqueItems(
        previousBoundary.dependencies,
        currentBoundary.dependencies
      ),
      unknownReality: preserveCompletion
        ? list(previousBoundary.unknownReality)
        : list(currentBoundary.unknownReality)
    },

    unknownReality: preserveCompletion
      ? list(previous.unknownReality)
      : list(current.unknownReality),

    missingEvidence: preserveCompletion
      ? list(previous.missingEvidence)
      : list(current.missingEvidence),

    entryAssessment: {
      ...previous.entryAssessment,
      ...current.entryAssessment,
      entryComplete:
        preserveCompletion ||
        current?.entryAssessment?.entryComplete === true
    }
  };
}

function normalizeLanguage(value, conversation = []) {
  const requested = cleanText(value).toLowerCase();

  if (
    requested === 'zh' ||
    requested === 'zh-hans' ||
    requested.startsWith('zh-')
  ) {
    return 'zh-Hans';
  }

  if (
    requested === 'en' ||
    requested.startsWith('en-')
  ) {
    return 'en';
  }

  const latestUserText = [...conversation]
    .reverse()
    .find(item => item.role === 'user')
    ?.content || '';

  return /[\u3400-\u9fff]/.test(latestUserText)
    ? 'zh-Hans'
    : 'en';
}

function message(language, key) {
  const messages = {
    noEntry: {
      en: 'No valid Reality Entry was received.',
      'zh-Hans': '没有收到有效的 Reality Entry。'
    },

    ready: {
      en:
        'Your Reality Entry is sufficiently stable for Reconstruction. ' +
        'Unresolved fields remain preserved as Unknown Reality.',

      'zh-Hans':
        '你的 Reality Entry 已足够稳定，可以进入现实重建；' +
        '尚未确定的字段仍保留为 Unknown Reality。'
    },

    fallbackQuestion: {
      en:
        'What part of this change still needs the most clarification?',

      'zh-Hans':
        '这项变化中，目前最需要进一步澄清的是哪一部分？'
    },

    error: {
      en:
        'Runtime Entry could not be completed.',

      'zh-Hans':
        'Reality Entry 暂时无法完成。'
    }
  };

  return (
    messages[key]?.[language] ||
    messages[key]?.en ||
    ''
  );
}

function unknownStatement(field, language) {
  const label =
    FIELD_LABELS[field]?.[language] ||
    FIELD_LABELS[field]?.en ||
    field.replaceAll('_', ' ');

  return language === 'zh-Hans'
    ? `${label}仍未建立。`
    : `${label} remains unestablished.`;
}

function localizedReconstructionDirection(base, routedEntry, language) {
  const change = cleanText(routedEntry?.extractedFields?.observedChange) ||
    (language === 'zh-Hans' ? '用户报告的变化' : 'the reported change');

  if (language !== 'zh-Hans') return base.reconstructionDirection;

  const localizedPriorityEvidence = (
    routedEntry?.assessment?.missingFields || []
  ).map(field => unknownStatement(field, language)).slice(0, 4);

  return {
    ...base.reconstructionDirection,
    focus: `围绕「${change}」重建事件顺序、依赖关系与证据。`,
    rationale: '当前现实入口必须区分已有支持的现实与解释，并保留尚未解决的其他可能。',
    priorityEvidence: localizedPriorityEvidence
  };
}

function chooseReply(entry, language) {
  if (entry?.assessment?.entryComplete) {
    return message(language, 'ready');
  }

  const target =
    entry?.assessment?.nextQuestionTarget;

  const candidate =
    (entry?.questionCandidates || [])
      .find(item => item?.target === target) ||
    entry?.questionCandidates?.[0];

  return [
    cleanText(entry?.acknowledgement),

    cleanText(candidate?.question)
  ]
    .filter(Boolean)
    .join('\n\n');
}

function runtimeEvidenceBoundary(entry, language) {
  const missingFields =
    entry?.assessment?.missingFields || [];

  const fields = entry?.extractedFields || {};
  const cleanList = value => mergeUniqueItems(value).map(itemText).map(cleanStatement).filter(Boolean);

  return {
    observedEvidence: cleanList(
      entry?.evidenceBoundary?.observedEvidence
    ),

    reportedExperience: cleanList(
      entry?.evidenceBoundary?.reportedExperience
    ),

    interpretation: cleanList(
      entry?.evidenceBoundary?.interpretation
    ),

    professionalAssessment: cleanList(
      entry?.evidenceBoundary?.professionalAssessment
    ),

    counterEvidence: cleanList(fields.counterEvidence),

    dependencies: list(fields.dependencies)
      .map(item => ({
        source: cleanStatement(itemText(item)),
        effect: cleanText(item?.effect),
        status: cleanText(item?.status) || 'reported'
      }))
      .filter(item => item.source),

    unknownReality:
      missingFields.map(field =>
        unknownStatement(field, language)
      )
  };
}

function buildCompatibleRuntimeEntry({
  routedEntry,
  body,
  conversation,
  language
}) {
  const forced =
    routedEntry.assessment.maximumRoundsReached === true;

  const base = buildRuntimeEntry({
    model: routedEntry,
    scores: routedEntry.fieldCompleteness,

    request: {
      ...body,
      language,
      conversation,
      entryRound:
        routedEntry.assessment.entryRound
    },

    forced
  });

  const boundary =
    runtimeEvidenceBoundary(
      routedEntry,
      language
    );

  const now =
    new Date().toISOString();

  const current = {
    ...base,

    reconstructionDirection:
      localizedReconstructionDirection(
        base,
        routedEntry,
        language
      ),

    entrySource: {
      ...base.entrySource,
      language
    },

    entryEvidence:
      boundary.observedEvidence.map(
        (statement, index) => ({
          evidenceId:
            `ev_${String(index + 1).padStart(3, '0')}`,

          evidenceType:
            'user_statement',

          source:
            'entry_conversation',

          statement,

          observedAt:
            '',

          reportedAt:
            now,

          confidence:
            routedEntry.fieldCompleteness.evidence
        })
      ),

    knownReality:
      boundary.observedEvidence.map(
        statement => ({
          statement,
          supportedBy: [],
          confidence:
            routedEntry.fieldCompleteness.evidence
        })
      ),

    unknownReality:
      boundary.unknownReality.map(
        question => ({
          question,
          significance: 'high'
        })
      ),

    evidenceBoundary:
      boundary,

    counterEvidence:
      boundary.counterEvidence,

    dependencies:
      boundary.dependencies,

    desiredTransition:
      cleanStatement(
        routedEntry?.extractedFields?.desiredTransition
      ),

    emergingTension: {
      summary: cleanStatement(
        routedEntry?.extractedFields?.currentTension
      ),
      competingForces: [
        cleanStatement(routedEntry?.extractedFields?.currentTension),
        cleanStatement(routedEntry?.extractedFields?.desiredTransition)
      ].filter(Boolean),
      confidence: routedEntry?.extractedFields?.currentTension
        ? routedEntry.fieldCompleteness.current_tension
        : 0
    },

    entryMethod:
      routedEntry.entryMethod,

    entryAssessment: {
      ...base.entryAssessment,

      maturityScore:
        routedEntry.assessment.entryCompleteness,

      missingRequiredFields: [
        ...routedEntry.assessment.missingFields
      ],

      questionCount:
        routedEntry.assessment.entryRound,

      entryComplete:
        routedEntry.assessment.entryComplete
    }
  };

  const isRevision =
    body.mode === 'revision' &&
    cleanText(
      body.answerTarget ||
      body.lastQuestionTarget
    ) === 'revision';

  return mergeRuntimeEntry(
    previousRuntimeEntry(body),
    current,
    language,
    {
      preserveRealityChange: isRevision,
      preserveCompletion: isRevision,
      supplementalStatements:
        revisionStatements(body, conversation)
    }
  );
}

function auditInference({
  requestId,
  language,
  entryRound,
  inference
}) {
  console.log(JSON.stringify({
    event:
      'phi_os_inference',

    stage:
      'entry',

    requestId,
    language,
    entryRound,

    provider:
      inference.provider,

    model:
      inference.model,

    workersAIUsed:
      inference.workersAIUsed,

    openAIUsed:
      inference.openAIUsed,

    externalInferenceUsed:
      inference.externalInferenceUsed,

    usage:
      inference.usage || null,

    attempts:
      inference.attempts || []
  }));
}

export function onRequestGet() {
  return respond({
    success: true,

    service:
      'PHI OS Runtime Entry API',

    endpoint:
      '/api/reconstruct-reality',

    method:
      'POST',

    routeOrder: [
      'rule_engine',
      'workers_ai',
      'openai',
      'professional_review'
    ],

    supportedLanguages: [
      'en',
      'zh-Hans'
    ],

    minimumEntryRounds:
      EVIDENCE_DEPTHS.quick.minimum,

    maximumEntryRounds:
      EVIDENCE_DEPTHS.deep.maximum,

    status:
      'ready'
  });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,

    headers: {
      'access-control-allow-origin':
        '*',

      'access-control-allow-methods':
        'GET, POST, OPTIONS',

      'access-control-allow-headers':
        'content-type',

      'access-control-max-age':
        '86400'
    }
  });
}

export async function onRequestPost({
  request,
  env
}) {
  let body = {};
  let language = 'en';

  try {
    const contentType =
      request.headers
        .get('content-type')
        ?.toLowerCase() || '';

    if (
      !contentType.includes(
        'application/json'
      )
    ) {
      return respond({
        success: false,
        language,
        error:
          'Content-Type must be application/json.'
      }, 415);
    }

    body =
      await request.json();

    const conversation =
      sanitizeConversation(
        body.conversation
      );

    language =
      normalizeLanguage(
        body.language || body.locale,
        conversation
      );

    const hasUserMessage =
      conversation.some(
        item =>
          item.role === 'user'
      );

    if (!hasUserMessage) {
      return respond({
        success: false,
        language,
        error:
          message(language, 'noEntry')
      }, 400);
    }

    const userAnswerCount =
      conversation.filter(
        item =>
          item.role === 'user'
      ).length;

    const depth = evidenceDepth(body.evidenceDepth);

    const entryRound =
      Math.min(
        depth.maximum,

        Math.max(
          0,

          Number(body.entryRound) ||
            userAnswerCount
        )
      );

    const requestId =
      crypto.randomUUID();

    const entryInput = {
      conversation,
      entryRound,

      mode:
        body.mode === 'revision'
          ? 'revision'
          : 'guided',

      language,
      evidenceDepth: depth.key,

      answerTarget:
        cleanText(
          body.answerTarget ||
          body.lastQuestionTarget
        ),

      askedTargets:
        Array.isArray(body.askedTargets)
          ? body.askedTargets
          : [],

      answerBindings:
        Array.isArray(body.answerBindings)
          ? body.answerBindings
          : [],

      currentReading:
        body.currentReading || null,

      runtimeEntityId:
        cleanText(
          body.runtimeEntityId
        ),

      runtimeEntryId:
        cleanText(
          body.runtimeEntryId
        )
    };

    const routed =
      await routeRuntimeEntry({
        env,
        entryInput,

        options: {
          workersAIAllowed:
            body
              ?.inferencePreference
              ?.workersAIAllowed !== false,

          openAIAllowed:
            body
              ?.inferencePreference
              ?.openAIAllowed !== false
        }
      });

    const runtimeEntry =
      buildCompatibleRuntimeEntry({
        routedEntry:
          routed.entry,

        body,
        conversation,
        language
      });

    const ready =
      runtimeEntry
        ?.entryAssessment
        ?.entryComplete === true;

    const reply =
      ready
        ? message(language, 'ready')
        : chooseReply(
            routed.entry,
            language
          );

    auditInference({
      requestId,
      language,

      entryRound:
        routed.entry
          .assessment
          .entryRound,

      inference:
        routed.inference
    });

    return respond({
      success:
        true,

      requestId,
      language,

      stage:
        ready
          ? 'entry_ready'
          : 'entry_collecting',

      entry_round:
        routed.entry
          .assessment
          .entryRound,

      entryComplete:
        ready,

      input_closed:
        ready,

      reply,

      assistant_message:
        reply,

      runtimeEntry,

      assessment: {
        field_completeness:
          routed.entry
            .fieldCompleteness,

        next_question_target:
          ready
            ? 'none'
            : routed.entry
                .assessment
                .nextQuestionTarget,

        entry_completeness:
          Math.max(
            Number(
              runtimeEntry
                ?.entryAssessment
                ?.maturityScore
            ) || 0,
            routed.entry
              .assessment
              .entryCompleteness
          ),

        minimum_rounds_met:
          routed.entry
            .assessment
            .minimumRoundsMet,

        maximum_rounds_reached:
          routed.entry
            .assessment
            .maximumRoundsReached,

        missing_fields:
          routed.entry
            .assessment
            .missingFields
      },

      inference:
        routed.inference,

      conversation
    });
  } catch (error) {
    return respond({
      success:
        false,

      language,

      stage:
        'entry_error',

      error:
        cleanText(error?.message) ||
        message(language, 'error')
    }, 500);
  }
}

export function onRequest(context) {
  const method =
    context?.request?.method ||
    'GET';

  if (method === 'GET') {
    return onRequestGet(context);
  }

  if (method === 'POST') {
    return onRequestPost(context);
  }

  if (method === 'OPTIONS') {
    return onRequestOptions(context);
  }

  return respond({
    success: false,
    error:
      `Method ${method} is not allowed.`
  }, 405, {
    allow:
      'GET, POST, OPTIONS'
  });
}
