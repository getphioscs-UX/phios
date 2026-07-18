/*
 * PHI OS Reality Reconstruction API
 * File: functions/api/reconstruct-runtime.js
 * Version: 1.0.0
 *
 * Cloudflare Pages Function endpoint:
 *   POST /api/reconstruct-runtime
 *
 * Current behavior:
 *   - Validates the supplied Runtime Entry.
 *   - Runs the rule-first reconstruction engine.
 *   - Does not call OpenAI.
 *   - Does not require OPENAI_API_KEY.
 *   - Does not persist data.
 *
 * Future behavior:
 *   - May route selected tasks to Workers AI or OpenAI only when
 *     rule-first reconstruction is insufficient.
 */

import reconstructRuntime from '../runtime/reconstruction/rule-reconstruction.js';


/* =========================================================
   RESPONSE HELPERS
========================================================= */

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        ...extraHeaders
      }
    }
  );
}


function errorResponse(message, status = 400, detail = '') {
  return jsonResponse(
    {
      success: false,
      stage: 'reconstruction_error',
      error: cleanText(message) || 'Reality Reconstruction could not be completed.',
      detail: cleanText(detail),
      reconstruction: null
    },
    status
  );
}


/* =========================================================
   REQUEST VALIDATION
========================================================= */

function cleanText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeLanguage(value, runtimeEntry = {}) {
  const requested = cleanText(value).toLowerCase();
  if (requested === 'zh' || requested === 'zh-hans' || requested.startsWith('zh-')) {
    return 'zh-Hans';
  }
  if (requested === 'en' || requested.startsWith('en-')) return 'en';
  const entryLanguage = cleanText(runtimeEntry?.entrySource?.language).toLowerCase();
  return entryLanguage === 'zh' || entryLanguage.startsWith('zh-') ? 'zh-Hans' : 'en';
}


function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}


function sanitizeObject(value, maximumLength = 100000) {
  if (!isPlainObject(value)) {
    return null;
  }

  try {
    const serialized = JSON.stringify(value);

    if (
      !serialized ||
      serialized.length > maximumLength
    ) {
      return null;
    }

    return JSON.parse(serialized);
  } catch {
    return null;
  }
}


function sanitizeConversation(conversation) {
  if (!Array.isArray(conversation)) {
    return [];
  }

  return conversation
    .filter(item => {
      return (
        isPlainObject(item) &&
        (
          item.role === 'user' ||
          item.role === 'assistant'
        ) &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0
      );
    })
    .map(item => ({
      role: item.role,
      content: cleanText(item.content).slice(0, 4000)
    }))
    .slice(-20);
}

const RECONSTRUCTION_TARGETS = new Set([
  'carrier_coordinates',
  'carrier_signatures',
  'experience_style',
  'expression_style',
  'agency_style',
  'identity_style'
]);

function sanitizeReconstructionAnswers(value) {
  if (!Array.isArray(value)) return [];

  const seenTargets = new Set();

  return value
    .filter(item => isPlainObject(item))
    .map(item => ({
      target: cleanText(item.target),
      statement: cleanText(item.statement || item.content).slice(0, 2000),
      answeredAt: cleanText(item.answeredAt) || new Date().toISOString()
    }))
    .filter(item => {
      if (
        !RECONSTRUCTION_TARGETS.has(item.target) ||
        !item.statement ||
        seenTargets.has(item.target)
      ) {
        return false;
      }

      seenTargets.add(item.target);
      return true;
    })
    .slice(0, RECONSTRUCTION_TARGETS.size)
    .map((item, index) => ({
      evidenceId: `re_${String(index + 1).padStart(3, '0')}`,
      evidenceType: 'reported_experience',
      source: 'reconstruction_inquiry',
      confidence: 1,
      ...item
    }));
}

function evidenceText(value) {
  if (typeof value === 'string') return cleanText(value);
  if (!isPlainObject(value)) return '';
  return cleanText(
    value.statement ||
    value.summary ||
    value.sourceText ||
    value.question
  );
}

function mergeEvidence(...collections) {
  const seen = new Set();

  return collections
    .flatMap(value => Array.isArray(value) ? value : [])
    .filter(item => {
      const key = evidenceText(item).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function attachReconstructionEvidence(runtimeEntry, answers) {
  if (!isPlainObject(runtimeEntry) || !answers.length) return runtimeEntry;

  const boundary = isPlainObject(runtimeEntry.evidenceBoundary)
    ? runtimeEntry.evidenceBoundary
    : {};

  return {
    ...runtimeEntry,
    reconstructionEvidence: answers,
    evidenceBoundary: {
      ...boundary,
      reportedExperience: mergeEvidence(
        boundary.reportedExperience,
        answers
      )
    }
  };
}


function validateRuntimeEntry(runtimeEntry) {
  const errors = [];

  if (!isPlainObject(runtimeEntry)) {
    return {
      valid: false,
      errors: ['Runtime Entry must be an object.']
    };
  }

  if (!cleanText(runtimeEntry.runtimeEntityId)) {
    errors.push('runtimeEntityId is required.');
  }

  if (!cleanText(runtimeEntry.runtimeEntryId)) {
    errors.push('runtimeEntryId is required.');
  }

  const rawStatement =
    cleanText(
      runtimeEntry?.realityChange?.rawStatement
    );

  const normalizedStatement =
    cleanText(
      runtimeEntry?.realityChange?.normalizedStatement
    );

  if (!rawStatement && !normalizedStatement) {
    errors.push(
      'Runtime Entry requires a Reality Change statement.'
    );
  }

  if (
    runtimeEntry.schemaVersion &&
    typeof runtimeEntry.schemaVersion !== 'string'
  ) {
    errors.push(
      'schemaVersion must be a string when supplied.'
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}


function normalizeRuntimeEntry(runtimeEntry) {
  const source = sanitizeObject(runtimeEntry);

  if (!source) {
    return null;
  }

  return {
    ...source,

    schemaVersion:
      cleanText(source.schemaVersion) ||
      '1.0',

    runtimeEntityId:
      cleanText(source.runtimeEntityId),

    runtimeEntryId:
      cleanText(source.runtimeEntryId),

    status:
      cleanText(source.status) ||
      'ready_for_reconstruction',

    realityChange: {
      ...(isPlainObject(source.realityChange)
        ? source.realityChange
        : {}),

      rawStatement:
        cleanText(
          source?.realityChange?.rawStatement
        ),

      normalizedStatement:
        cleanText(
          source?.realityChange?.normalizedStatement
        ),

      changeType:
        cleanText(
          source?.realityChange?.changeType
        ) ||
        'unclear',

      confidence:
        clampScore(
          source?.realityChange?.confidence
        )
    },

    timing: {
      ...(isPlainObject(source.timing)
        ? source.timing
        : {}),

      statedTiming:
        cleanText(
          source?.timing?.statedTiming
        ),

      normalizedTiming:
        cleanText(
          source?.timing?.normalizedTiming
        ),

      certainty:
        cleanText(
          source?.timing?.certainty
        ) ||
        'unknown'
    },

    affectedDomains:
      Array.isArray(source.affectedDomains)
        ? source.affectedDomains.slice(0, 12)
        : [],

    initialContext:
      isPlainObject(source.initialContext)
        ? source.initialContext
        : {
            summary: '',
            involvedEntities: [],
            relevantConditions: []
          },

    entryEvidence:
      Array.isArray(source.entryEvidence)
        ? source.entryEvidence.slice(0, 20)
        : [],

    userInterpretation:
      isPlainObject(source.userInterpretation)
        ? source.userInterpretation
        : {
            summary: '',
            confidence: 0
          },

    emergingTension:
      isPlainObject(source.emergingTension)
        ? source.emergingTension
        : {
            summary: '',
            competingForces: [],
            confidence: 0
          },

    knownReality:
      Array.isArray(source.knownReality)
        ? source.knownReality.slice(0, 20)
        : [],

    unknownReality:
      Array.isArray(source.unknownReality)
        ? source.unknownReality.slice(0, 20)
        : [],

    missingEvidence:
      Array.isArray(source.missingEvidence)
        ? source.missingEvidence.slice(0, 20)
        : [],

    reconstructionDirection:
      isPlainObject(source.reconstructionDirection)
        ? source.reconstructionDirection
        : {
            focus: '',
            rationale: '',
            priorityEvidence: []
          },

    entryAssessment:
      isPlainObject(source.entryAssessment)
        ? source.entryAssessment
        : {
            maturityScore: 0,
            requiredFieldsPresent: [],
            missingRequiredFields: [],
            questionCount: 0,
            entryComplete: true,
            completionReason: ''
          },

    consent:
      isPlainObject(source.consent)
        ? {
            storageAllowed:
              source.consent.storageAllowed === true,

            reconstructionAllowed:
              source.consent.reconstructionAllowed !== false
          }
        : {
            storageAllowed: false,
            reconstructionAllowed: true
          }
  };
}


function clampScore(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, numberValue)
  );
}


/* =========================================================
   METADATA
========================================================= */

function createRequestMetadata(request) {
  const cf = request?.cf || {};

  return {
    receivedAt:
      new Date().toISOString(),

    country:
      cleanText(cf.country),

    region:
      cleanText(cf.region),

    city:
      cleanText(cf.city),

    timeZone:
      cleanText(cf.timezone),

    colo:
      cleanText(cf.colo),

    userAgent:
      cleanText(
        request.headers.get('user-agent') || ''
      ).slice(0, 300)
  };
}


/* =========================================================
   CORS / PREFLIGHT
========================================================= */

export async function onRequestOptions() {
  return new Response(
    null,
    {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods':
          'POST, OPTIONS',
        'access-control-allow-headers':
          'content-type',
        'access-control-max-age':
          '86400'
      }
    }
  );
}


/* =========================================================
   MAIN ENDPOINT
========================================================= */

export async function onRequestPost(context) {
  const request = context?.request;

  if (!request) {
    return errorResponse(
      'The request object is unavailable.',
      500
    );
  }

  const contentType =
    request.headers.get('content-type') || '';

  if (
    !contentType
      .toLowerCase()
      .includes('application/json')
  ) {
    return errorResponse(
      'Content-Type must be application/json.',
      415
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      'The request body is not valid JSON.',
      400
    );
  }

  if (!isPlainObject(body)) {
    return errorResponse(
      'The request body must be a JSON object.',
      400
    );
  }

  const suppliedEntry =
    body.runtimeEntry ||
    body.runtime_entry ||
    body.entry;

  const reconstructionAnswers =
    sanitizeReconstructionAnswers(
      body.reconstructionAnswers ||
      body.reconstruction_answers
    );

  const normalizedEntry =
    attachReconstructionEvidence(
      normalizeRuntimeEntry(suppliedEntry),
      reconstructionAnswers
    );

  if (!normalizedEntry) {
    return errorResponse(
      'No valid Runtime Entry was supplied.',
      400
    );
  }

  const validation =
    validateRuntimeEntry(normalizedEntry);

  if (!validation.valid) {
    return errorResponse(
      'The Runtime Entry is incomplete.',
      422,
      validation.errors.join(' ')
    );
  }

  if (
    normalizedEntry
      ?.consent
      ?.reconstructionAllowed === false
  ) {
    return errorResponse(
      'Reality Reconstruction has not been authorized for this Runtime Entry.',
      403
    );
  }

  const conversation =
    sanitizeConversation(
      body.conversation
    );

  const language = normalizeLanguage(
    body.outputLanguage || body.language || body.locale,
    normalizedEntry
  );

  const requestMetadata =
    createRequestMetadata(request);

  try {
    const reconstruction =
      reconstructRuntime(
        normalizedEntry,
        { language }
      );

    const responsePayload = {
      success: true,

      stage:
        reconstruction
          ?.nextStage
          ?.ready
          ? 'reconstruction_ready'
          : 'reconstruction_partial',

      runtimeEntityId:
        normalizedEntry.runtimeEntityId,

      runtimeEntryId:
        normalizedEntry.runtimeEntryId,

      runtimeEntry:
        normalizedEntry,

      language,

      reconstruction,

      reconstructionAnswers,

      conversationContext: {
        messageCount:
          conversation.length,

        userMessageCount:
          conversation.filter(
            item =>
              item.role === 'user'
          ).length,

        assistantMessageCount:
          conversation.filter(
            item =>
              item.role === 'assistant'
          ).length,

        reconstructionAnswerCount:
          reconstructionAnswers.length
      },

      inference: {
        provider:
          'rule_engine',

        model:
          null,

        openAIUsed:
          false,

        workersAIUsed:
          false,

        paidInferenceUsed:
          false
      },

      persistence: {
        requested:
          normalizedEntry
            ?.consent
            ?.storageAllowed === true,

        performed:
          false,

        reason:
          'Sprint 3 Reconstruction is session-only and does not persist Runtime data.'
      },

      requestMetadata
    };

    return jsonResponse(
      responsePayload,
      200,
      {
        'access-control-allow-origin': '*'
      }
    );

  } catch (error) {
    console.error(
      'PHI OS Reconstruction API error:',
      error?.stack ||
      error?.message ||
      String(error)
    );

    return errorResponse(
      error?.message ||
      'Reality Reconstruction could not be completed.',
      500
    );
  }
}


/* =========================================================
   METHOD GUARD
========================================================= */

export async function onRequestGet() {
  return jsonResponse(
    {
      success: true,
      service:
        'PHI OS Reality Reconstruction API',

      endpoint:
        '/api/reconstruct-runtime',

      method:
        'POST',

      reconstructionMethod:
        'rule_first',

      openAIRequired:
        false,

      storage:
        'session_only',

      status:
        'ready'
    },
    200,
    {
      'access-control-allow-origin': '*'
    }
  );
}


export async function onRequest(context) {
  const method =
    context?.request?.method || 'GET';

  if (method === 'POST') {
    return onRequestPost(context);
  }

  if (method === 'OPTIONS') {
    return onRequestOptions(context);
  }

  if (method === 'GET') {
    return onRequestGet(context);
  }

  return jsonResponse(
    {
      success: false,
      error:
        `Method ${method} is not allowed. Use POST.`
    },
    405,
    {
      'allow': 'GET, POST, OPTIONS',
      'access-control-allow-origin': '*'
    }
  );
}
