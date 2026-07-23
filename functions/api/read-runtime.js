/*
 * PHI OS Reality Reading API
 * File: functions/api/read-runtime.js
 * Version: 1.1.0
 *
 * POST /api/read-runtime
 *
 * Receives a canonical Reading Input, normalizes the interface language and
 * provider request, then delegates all semantic routing to the Reality Reading
 * Provider Router. Runtime evidence is never persisted by this endpoint.
 */

import {
  SCHEMA_IDS,
  isAcceptedSchema
} from '../runtime/shared/schema-registry.js';
import routeRealityReading from '../runtime/reading/provider-router.js';
import '../runtime/registry/index.js';

const ALLOWED_PROVIDERS = Object.freeze([
  'auto',
  'rule_engine',
  'workers_ai',
  'openai',
  'professional_review'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}

function normalizeOutputLanguage(value) {
  const language = cleanText(value).toLowerCase().replaceAll('_', '-');

  if (language === 'zh' || language.startsWith('zh-')) return 'zh';
  return 'en';
}

function normalizeProvider(value) {
  const provider = cleanText(value)
    .toLowerCase()
    .replaceAll('-', '_');

  if (provider === 'rule' || provider === 'rule_first') {
    return 'rule_engine';
  }

  if (provider === 'workers' || provider === 'cloudflare') {
    return 'workers_ai';
  }

  return ALLOWED_PROVIDERS.includes(provider)
    ? provider
    : 'auto';
}

function normalizeRequestOptions(readingInput, rawOptions = {}) {
  const options = isObject(rawOptions) ? rawOptions : {};

  const outputLanguage = normalizeOutputLanguage(
    options.outputLanguage ||
    options.language ||
    options.locale ||
    readingInput?.languageContract?.outputLanguage ||
    readingInput?.outputLanguage ||
    readingInput?.locale
  );

  return {
    provider: normalizeProvider(
      options.provider ||
      readingInput?.inferencePreference?.provider ||
      'auto'
    ),
    deepReading: options.deepReading === true,
    locale: outputLanguage === 'zh' ? 'zh-Hans' : 'en',
    outputLanguage
  };
}

function copy(language, english, chinese) {
  return language === 'zh' ? chinese : english;
}

function validationIssue(code, field, language, english, chinese) {
  return {
    code,
    field,
    message: copy(language, english, chinese)
  };
}

function validateReadingInput(input, language = 'en') {
  const errors = [];

  if (!isObject(input)) {
    return [validationIssue(
      'reading_input_required',
      'readingInput',
      language,
      'Reality Reading input must be an object.',
      '现实读取输入必须是一个对象。'
    )];
  }

  if (!isAcceptedSchema(
    'readingInput',
    cleanText(input.schemaVersion)
  )) {
    errors.push(validationIssue(
      'reading_schema_invalid',
      'schemaVersion',
      language,
      'Reading input schemaVersion is invalid.',
      '现实读取输入的 schemaVersion 无效。'
    ));
  }

  if (!cleanText(input.runtimeEntityId)) {
    errors.push(validationIssue(
      'runtime_entity_id_required',
      'runtimeEntityId',
      language,
      'Runtime Entity ID is required.',
      '缺少 Runtime Entity ID。'
    ));
  }

  if (!cleanText(input.runtimeEntryId)) {
    errors.push(validationIssue(
      'runtime_entry_id_required',
      'runtimeEntryId',
      language,
      'Runtime Entry ID is required.',
      '缺少 Runtime Entry ID。'
    ));
  }

  if (!isObject(input.runtimeEntry)) {
    errors.push(validationIssue(
      'runtime_entry_required',
      'runtimeEntry',
      language,
      'Runtime Entry is required.',
      '缺少现实运行入口。'
    ));
  }

  if (!isObject(input.reconstruction)) {
    errors.push(validationIssue(
      'reconstruction_required',
      'reconstruction',
      language,
      'Reality Reconstruction is required.',
      '缺少现实重建资料。'
    ));
  }

  if (!isObject(input.evidenceBoundary)) {
    errors.push(validationIssue(
      'evidence_boundary_required',
      'evidenceBoundary',
      language,
      'Evidence Boundary is required.',
      '缺少证据边界。'
    ));
  }

  if (input?.interpretationPolicy?.evidenceBeforeInterpretation !== true) {
    errors.push(validationIssue(
      'evidence_before_interpretation_required',
      'interpretationPolicy.evidenceBeforeInterpretation',
      language,
      'Evidence Before Interpretation must remain enabled.',
      '必须继续启用“证据先于解释”原则。'
    ));
  }

  if (input?.interpretationPolicy?.preserveUnknownReality !== true) {
    errors.push(validationIssue(
      'unknown_reality_preservation_required',
      'interpretationPolicy.preserveUnknownReality',
      language,
      'Unknown Reality preservation must remain enabled.',
      '必须继续保留未知现实。'
    ));
  }

  return errors;
}

function requestLanguage(body) {
  const readingInput = body?.readingInput || body?.reading_input || body?.input;
  const options = isObject(body?.options) ? body.options : {};

  return normalizeOutputLanguage(
    options.outputLanguage ||
    options.language ||
    options.locale ||
    readingInput?.languageContract?.outputLanguage ||
    readingInput?.outputLanguage ||
    readingInput?.locale
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      'cache-control': 'no-store'
    }
  });
}

export async function onRequestGet() {
  return json({
    success: true,
    service: 'PHI OS Reality Reading API',
    version: '1.1.0',
    endpoint: '/api/read-runtime',
    method: 'POST',
    inputSchema: SCHEMA_IDS.READING_INPUT,
    routeOrder: [
      'rule_engine',
      'workers_ai',
      'openai',
      'professional_review'
    ],
    defaultProvider: 'rule_engine',
    supportedProviders: ALLOWED_PROVIDERS,
    supportedLocales: ['en', 'zh-Hans'],
    supportedOutputLanguages: ['en', 'zh'],
    persistence: 'session_only',
    status: 'ready'
  });
}

export async function onRequestPost({ request, env = {} }) {
  const contentType = cleanText(
    request?.headers?.get('content-type')
  ).toLowerCase();

  if (!contentType.includes('application/json')) {
    return json({
      success: false,
      stage: 'reading_error',
      code: 'content_type_invalid',
      error: 'Content-Type must be application/json.'
    }, 415);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({
      success: false,
      stage: 'reading_error',
      code: 'json_invalid',
      error: 'The request body is not valid JSON.'
    }, 400);
  }

  if (!isObject(body)) {
    return json({
      success: false,
      stage: 'reading_error',
      code: 'request_body_invalid',
      error: 'The request body must be a JSON object.'
    }, 400);
  }

  const language = requestLanguage(body);
  const readingInput = body.readingInput || body.reading_input || body.input;
  const runtimeOptions = normalizeRequestOptions(
    readingInput,
    body.options
  );

  const validationErrors = validateReadingInput(
    readingInput,
    language
  );

  if (validationErrors.length > 0) {
    return json({
      success: false,
      stage: 'reading_error',
      code: 'reading_input_invalid',
      error: copy(
        language,
        'The Reality Reading input is incomplete or invalid.',
        '现实读取输入不完整或无效。'
      ),
      validationErrors,
      languageContract: {
        locale: runtimeOptions.locale,
        outputLanguage: runtimeOptions.outputLanguage
      }
    }, 422);
  }

  try {
    const routed = await routeRealityReading({
      env,
      readingInput,
      options: runtimeOptions
    });

    if (!isObject(routed?.reading)) {
      throw new Error('Reality Reading Router returned no Reading result.');
    }

    const navigationReady =
      routed.reading?.navigationReadiness?.ready === true;

    return json({
      success: true,
      stage: navigationReady ? 'reading_ready' : 'reading_partial',
      runtimeEntityId: cleanText(readingInput.runtimeEntityId),
      runtimeEntryId: cleanText(readingInput.runtimeEntryId),
      languageContract: {
        locale: runtimeOptions.locale,
        outputLanguage: runtimeOptions.outputLanguage
      },
      readingInput,
      reading: routed.reading,
      inference: isObject(routed.inference)
        ? routed.inference
        : {
            provider: 'rule_engine',
            paidInferenceUsed: false
          },
      evidencePolicy: {
        observedEvidenceSeparated: true,
        reportedExperienceSeparated: true,
        interpretationSeparated: true,
        professionalAssessmentSeparated: true,
        unknownRealityPreserved: true,
        providerCannotCreateObservedEvidence: true,
        navigationReadinessOwnedByRuleEngine: true
      },
      persistence: {
        requested: readingInput?.persistence?.storageAllowed === true,
        performed: false,
        mode: 'session_only'
      }
    });
  } catch (error) {
    console.error('PHI OS Reality Reading API failed:', {
      name: cleanText(error?.name),
      message: cleanText(error?.message),
      provider: runtimeOptions.provider,
      outputLanguage: runtimeOptions.outputLanguage
    });

    return json({
      success: false,
      stage: 'reading_error',
      code: 'reading_runtime_failed',
      error: copy(
        language,
        'Reality Reading could not be completed. The existing Runtime evidence remains unchanged.',
        '无法完成现实读取；现有 Runtime 证据不会因此受到改变。'
      ),
      languageContract: {
        locale: runtimeOptions.locale,
        outputLanguage: runtimeOptions.outputLanguage
      }
    }, 500);
  }
}

export async function onRequest(context) {
  const method = cleanText(context?.request?.method).toUpperCase() || 'GET';

  if (method === 'GET') return onRequestGet(context);
  if (method === 'POST') return onRequestPost(context);
  if (method === 'OPTIONS') return onRequestOptions(context);

  return json({
    success: false,
    stage: 'reading_error',
    code: 'method_not_allowed',
    error: `Method ${method} is not allowed.`
  }, 405, {
    allow: 'GET, POST, OPTIONS'
  });
}
