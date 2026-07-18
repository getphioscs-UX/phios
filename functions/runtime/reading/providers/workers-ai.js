/*
 * PHI OS Workers AI Reality Reading provider
 * File: functions/runtime/reading/providers/workers-ai.js
 * Version: 1.1.0
 *
 * Workers AI is an optional semantic enrichment layer after the deterministic
 * Rule Engine. This provider cannot create Observed Evidence, modify the
 * Evidence Boundary, decide Navigation readiness, route another provider, or
 * persist Runtime material.
 */

import {
  READING_PROVIDER_ENRICHMENT_SCHEMA,
  READING_PROVIDER_SYSTEM_PROMPT,
  buildReadingProviderInput,
  isReadingEvidenceGrounded
} from '../provider-contract.js';

const DEFAULT_WORKERS_AI_MODEL =
  '@cf/meta/llama-3.1-8b-instruct-fast';

const MAX_GENERATED_TEXT_LENGTH = 1200;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value, maximumLength = MAX_GENERATED_TEXT_LENGTH) {
  if (typeof value !== 'string') return '';

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximumLength);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function containsChinese(value) {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(
    cleanText(value)
  );
}

function normalizeOutputLanguage(value) {
  const language = cleanText(value, 40)
    .toLowerCase()
    .replaceAll('_', '-');

  if (language === 'zh' || language.startsWith('zh-')) return 'zh';
  return 'en';
}

function runtimeLanguage(readingInput, ruleReading, options = {}) {
  const runtimeOptions = isObject(options) ? options : {};

  const outputLanguage = normalizeOutputLanguage(
    runtimeOptions.outputLanguage ||
    runtimeOptions.language ||
    runtimeOptions.locale ||
    ruleReading?.outputLanguage ||
    ruleReading?.locale ||
    readingInput?.languageContract?.outputLanguage ||
    readingInput?.outputLanguage ||
    readingInput?.locale
  );

  return {
    locale: outputLanguage === 'zh' ? 'zh-Hans' : 'en',
    outputLanguage
  };
}

function generatedTextMatchesLanguage(value, outputLanguage) {
  const text = cleanText(value);

  if (!text) return false;

  return outputLanguage === 'zh'
    ? containsChinese(text)
    : !containsChinese(text);
}

function acceptedGeneratedText(value, outputLanguage, maximumLength) {
  const text = cleanText(value, maximumLength);

  return generatedTextMatchesLanguage(text, outputLanguage)
    ? text
    : '';
}

function uniqueGeneratedText(
  values,
  outputLanguage,
  maximumItems,
  maximumLength = MAX_GENERATED_TEXT_LENGTH
) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = acceptedGeneratedText(
      value,
      outputLanguage,
      maximumLength
    );

    const key = text.toLocaleLowerCase();

    if (!text || seen.has(key)) continue;

    seen.add(key);
    output.push(text);

    if (output.length >= maximumItems) break;
  }

  return output;
}

function groundedEvidence(
  values,
  readingInput,
  ruleReading,
  maximumItems = 4
) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = cleanText(value, 1600);
    const key = text.toLocaleLowerCase();

    if (
      !text ||
      seen.has(key) ||
      !isReadingEvidenceGrounded(text, readingInput, ruleReading)
    ) {
      continue;
    }

    seen.add(key);
    output.push(text);

    if (output.length >= maximumItems) break;
  }

  return output;
}

function stripJsonFence(value) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text.startsWith('```')) return text;

  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function parseJsonValue(value) {
  if (isObject(value)) return value;

  const text = stripJsonFence(value);

  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function extractResponsePayload(result) {
  const candidates = [
    result?.response,
    result?.result?.response,
    result?.result,
    result
  ];

  for (const candidate of candidates) {
    const parsed = parseJsonValue(candidate);

    if (!parsed) continue;

    if (isObject(parsed.enrichment)) {
      return parsed.enrichment;
    }

    return parsed;
  }

  throw new Error('Workers AI returned no valid JSON enrichment.');
}

function validateLanguageContract(value, expectedLanguage) {
  if (!isObject(value)) {
    throw new Error('Workers AI omitted the language contract.');
  }

  const locale = cleanText(value.locale, 20);
  const outputLanguage = normalizeOutputLanguage(value.outputLanguage);

  if (
    locale !== expectedLanguage.locale ||
    outputLanguage !== expectedLanguage.outputLanguage
  ) {
    throw new Error('Workers AI returned the wrong output language.');
  }
}

function normalizeEnrichment(
  payload,
  readingInput,
  ruleReading,
  expectedLanguage
) {
  if (!isObject(payload)) {
    throw new Error('Workers AI enrichment must be an object.');
  }

  validateLanguageContract(
    payload.languageContract,
    expectedLanguage
  );

  const outputLanguage = expectedLanguage.outputLanguage;

  const primaryPattern = isObject(payload.primaryPattern)
    ? payload.primaryPattern
    : {};

  const alternativeReading = isObject(payload.alternativeReading)
    ? payload.alternativeReading
    : {};

  const enrichment = {
    languageContract: expectedLanguage,

    primaryPattern: {
      name: acceptedGeneratedText(
        primaryPattern.name,
        outputLanguage,
        160
      ),
      summary: acceptedGeneratedText(
        primaryPattern.summary,
        outputLanguage,
        MAX_GENERATED_TEXT_LENGTH
      ),
      confidence: clamp(primaryPattern.confidence)
    },

    alternativeReading: {
      summary: acceptedGeneratedText(
        alternativeReading.summary,
        outputLanguage,
        MAX_GENERATED_TEXT_LENGTH
      ),
      supportingEvidence: groundedEvidence(
        alternativeReading.supportingEvidence,
        readingInput,
        ruleReading,
        4
      ),
      evidenceNeeded: uniqueGeneratedText(
        alternativeReading.evidenceNeeded,
        outputLanguage,
        4
      ),
      confidence: clamp(alternativeReading.confidence)
    },

    strengths: uniqueGeneratedText(
      payload.strengths,
      outputLanguage,
      6
    ),

    risks: uniqueGeneratedText(
      payload.risks,
      outputLanguage,
      6
    ),

    currentTransition: acceptedGeneratedText(
      payload.currentTransition,
      outputLanguage,
      MAX_GENERATED_TEXT_LENGTH
    ),

    evidenceWatch: uniqueGeneratedText(
      payload.evidenceWatch,
      outputLanguage,
      8
    )
  };

  const primaryPatternComplete = Boolean(
    enrichment.primaryPattern.name &&
    enrichment.primaryPattern.summary
  );

  if (!primaryPatternComplete) {
    enrichment.primaryPattern = {
      name: '',
      summary: '',
      confidence: 0
    };
  }

  const hasUsableEnrichment = Boolean(
    primaryPatternComplete ||
    enrichment.alternativeReading.summary ||
    enrichment.alternativeReading.evidenceNeeded.length ||
    enrichment.strengths.length ||
    enrichment.risks.length ||
    enrichment.currentTransition ||
    enrichment.evidenceWatch.length
  );

  if (!hasUsableEnrichment) {
    throw new Error(
      'Workers AI returned no grounded enrichment in the requested language.'
    );
  }

  return enrichment;
}

function resolveModel(env) {
  return cleanText(
    env?.WORKERS_AI_READING_MODEL ||
    env?.WORKERS_AI_MODEL ||
    DEFAULT_WORKERS_AI_MODEL,
    200
  ) || DEFAULT_WORKERS_AI_MODEL;
}

export async function runWorkersAIReading(
  env,
  readingInput,
  ruleReading,
  options = {}
) {
  if (!env?.AI || typeof env.AI.run !== 'function') {
    throw new Error('Workers AI binding is not configured.');
  }

  if (!isObject(readingInput)) {
    throw new Error('Workers AI requires a valid Reading Input.');
  }

  if (!isObject(ruleReading)) {
    throw new Error('Workers AI requires the Rule Reading first.');
  }

  const languageContract = runtimeLanguage(
    readingInput,
    ruleReading,
    options
  );

  const model = resolveModel(env);

  const result = await env.AI.run(model, {
    messages: [
      {
        role: 'system',
        content: READING_PROVIDER_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: buildReadingProviderInput(
          readingInput,
          ruleReading,
          languageContract
        )
      }
    ],

    response_format: {
      type: 'json_schema',
      json_schema: READING_PROVIDER_ENRICHMENT_SCHEMA
    },

    temperature: 0.1,
    max_tokens: 1800,
    stream: false
  });

  const payload = extractResponsePayload(result);

  const enrichment = normalizeEnrichment(
    payload,
    readingInput,
    ruleReading,
    languageContract
  );

  return {
    provider: 'workers_ai',
    model,
    enrichment,

    metadata: {
      structuredOutputRequested: true,
      evidenceGroundingApplied: true,
      locale: languageContract.locale,
      outputLanguage: languageContract.outputLanguage,
      persistencePerformed: false
    }
  };
}

export default runWorkersAIReading;
