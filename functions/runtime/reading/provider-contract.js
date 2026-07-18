/*
 * PHI OS Reality Reading provider contract
 * File: functions/runtime/reading/provider-contract.js
 * Version: 1.1.0
 *
 * Model providers are optional semantic enrichment layers after the
 * deterministic Rule Engine. They may refine bounded interpretive fields,
 * but they do not own the Evidence Boundary, canonical Runtime values,
 * Navigation readiness, provider routing, or persistence.
 */

export const READING_PROVIDER_ALLOWED_FIELDS = Object.freeze([
  'primaryPattern',
  'alternativeReading',
  'strengths',
  'risks',
  'currentTransition',
  'evidenceWatch'
]);

export const READING_PROVIDER_SUPPORTED_LOCALES = Object.freeze([
  'en',
  'zh-Hans'
]);

export const READING_PROVIDER_SUPPORTED_OUTPUT_LANGUAGES = Object.freeze([
  'en',
  'zh'
]);

const generatedText = Object.freeze({
  type: 'string',
  maxLength: 1200
});

const generatedTextList = (maximum) => ({
  type: 'array',
  items: generatedText,
  maxItems: maximum
});

export const READING_PROVIDER_ENRICHMENT_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  properties: {
    languageContract: {
      type: 'object',
      additionalProperties: false,
      properties: {
        locale: {
          type: 'string',
          enum: READING_PROVIDER_SUPPORTED_LOCALES
        },
        outputLanguage: {
          type: 'string',
          enum: READING_PROVIDER_SUPPORTED_OUTPUT_LANGUAGES
        }
      },
      required: ['locale', 'outputLanguage']
    },
    primaryPattern: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          maxLength: 160
        },
        summary: generatedText,
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1
        }
      },
      required: ['name', 'summary', 'confidence']
    },
    alternativeReading: {
      type: 'object',
      additionalProperties: false,
      properties: {
        summary: generatedText,
        supportingEvidence: {
          type: 'array',
          items: {
            type: 'string',
            maxLength: 1600
          },
          maxItems: 4
        },
        evidenceNeeded: generatedTextList(4),
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1
        }
      },
      required: [
        'summary',
        'supportingEvidence',
        'evidenceNeeded',
        'confidence'
      ]
    },
    strengths: generatedTextList(6),
    risks: generatedTextList(6),
    currentTransition: generatedText,
    evidenceWatch: generatedTextList(8)
  },
  required: [
    'languageContract',
    'primaryPattern',
    'alternativeReading',
    'strengths',
    'risks',
    'currentTransition',
    'evidenceWatch'
  ]
});
/*
 * Backward-compatible export.
 *
 * Earlier Reading providers import READING_ENRICHMENT_SCHEMA, while the
 * v1.1 provider contract uses READING_PROVIDER_ENRICHMENT_SCHEMA.
 * Both names point to the same schema.
 */
export const READING_ENRICHMENT_SCHEMA =
  READING_PROVIDER_ENRICHMENT_SCHEMA;

export const READING_PROVIDER_SYSTEM_PROMPT = `
You are the bounded semantic enrichment layer of PHI OS Reality Reading.

The deterministic Rule Engine has already produced the canonical Reading.
Return only JSON that matches the requested schema. Do not include Markdown,
commentary, or fields outside the schema.

Follow input.languageContract exactly. Set the response languageContract to
the same locale and outputLanguage. Write all newly generated prose in
Simplified Chinese when outputLanguage is "zh", and in English when it is
"en". Do not mix interface languages unless a proper noun requires it.

Language selection never authorizes evidence translation. Values under
input.allowedEvidenceQuotes are immutable evidence strings. When placing an
item in alternativeReading.supportingEvidence, copy one complete allowed
evidence string exactly, preserving its original language and wording. Never
translate, paraphrase, shorten, combine, correct, or manufacture evidence.

You may refine only primaryPattern, alternativeReading, strengths, risks,
currentTransition, and evidenceWatch. These are bounded interpretive outputs,
not Observed Evidence. If the supplied evidence does not support a field,
return an empty string, an empty array, or confidence 0 as appropriate.

Keep Observed Evidence, Reported Experience, Interpretation, Professional
Assessment, and Unknown Reality separate. A feeling is Reported Experience.
A belief, explanation, motive, causal claim, or meaning is Interpretation.
Professional Assessment requires an explicitly reported assessment by an
identifiable qualified professional. Unknown Reality must remain unknown.

Do not alter canonical IDs, enums, Grammar codes, Runtime Region codes,
coordinates, signatures, classifications, confidence thresholds, provider
routing, or Navigation readiness. Do not diagnose, predict, prescribe, advise,
prove causation, infer motives, invent context, or convert an interpretation
into evidence. The Rule Engine remains the final authority for evidence and
readiness after your enrichment is returned.
`.trim();

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueText(values, maximum = Infinity, maximumLength = 1600) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = cleanText(value);
    const key = text.toLocaleLowerCase();

    // Skip overlong evidence instead of truncating it. Truncation would turn
    // an immutable evidence quote into a new string.
    if (!text || text.length > maximumLength || seen.has(key)) continue;

    seen.add(key);
    output.push(text);

    if (output.length >= maximum) break;
  }

  return output;
}

function normalizeOutputLanguage(value) {
  const language = cleanText(value).toLowerCase().replaceAll('_', '-');

  if (language === 'zh' || language.startsWith('zh-')) return 'zh';
  return 'en';
}

function normalizeLanguageContract(readingInput, ruleReading, options = {}) {
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
    outputLanguage,
    generatedTextLanguage: outputLanguage === 'zh'
      ? 'Simplified Chinese'
      : 'English',
    evidenceQuotePolicy: 'copy_exactly_do_not_translate'
  };
}

function evidenceBoundary(readingInput, ruleReading) {
  const source = isObject(ruleReading?.evidenceBoundary)
    ? ruleReading.evidenceBoundary
    : isObject(readingInput?.evidenceBoundary)
      ? readingInput.evidenceBoundary
      : {};

  return {
    observedEvidence: uniqueText(source.observedEvidence, 12),
    reportedExperience: uniqueText(source.reportedExperience, 12),
    interpretation: uniqueText(source.interpretation, 12),
    professionalAssessment: uniqueText(source.professionalAssessment, 8),
    aiInterpretation: uniqueText(source.aiInterpretation, 8),
    unknownReality: uniqueText(source.unknownReality, 12)
  };
}

function compactPattern(value) {
  const pattern = isObject(value) ? value : {};

  return {
    name: cleanText(pattern.name),
    summary: cleanText(pattern.summary),
    confidence: Math.max(0, Math.min(1, Number(pattern.confidence) || 0)),
    evidenceClass: cleanText(pattern.evidenceClass) || 'interpretation',
    classification: cleanText(pattern.classification),
    established: pattern.established === true,
    blockers: uniqueText(pattern.blockers, 8, 160)
  };
}

function compactAlternative(value) {
  const alternative = isObject(value) ? value : {};

  return {
    summary: cleanText(alternative.summary),
    supportingEvidence: uniqueText(alternative.supportingEvidence, 4),
    evidenceNeeded: uniqueText(alternative.evidenceNeeded, 4, 1200),
    confidence: Math.max(
      0,
      Math.min(1, Number(alternative.confidence) || 0)
    ),
    evidenceClass: cleanText(alternative.evidenceClass) || 'interpretation'
  };
}

export function buildReadingProviderInput(
  readingInput,
  ruleReading,
  options = {}
) {
  const integrated = isObject(ruleReading?.integratedReading)
    ? ruleReading.integratedReading
    : {};

  const languageContract = normalizeLanguageContract(
    readingInput,
    ruleReading,
    options
  );

  return JSON.stringify({
    task: 'Refine bounded interpretive fields after the Rule Reading.',
    languageContract,
    allowedEvidenceQuotes: evidenceBoundary(readingInput, ruleReading),
    ruleFirst: {
      schemaVersion: cleanText(ruleReading?.schemaVersion),
      readingMode: cleanText(ruleReading?.readingMode),
      status: cleanText(ruleReading?.status),
      confidence: Math.max(
        0,
        Math.min(1, Number(ruleReading?.confidence) || 0)
      ),
      primaryArc: cleanText(ruleReading?.primaryArc),
      initializationCoordinates: list(
        ruleReading?.initializationCoordinates
      ).slice(0, 12),
      carrierSignatures: list(ruleReading?.carrierSignatures).slice(0, 12),
      strongestSignature: ruleReading?.strongestSignature || null,
      signatureStability: ruleReading?.signatureStability || null,
      runtimeRegions: list(ruleReading?.runtimeRegions).slice(0, 9),
      primaryRuntimeRegion: ruleReading?.primaryRuntimeRegion || null,
      connectedRuntimeRegions: list(
        ruleReading?.connectedRuntimeRegions
      ).slice(0, 8),
      configurations: list(ruleReading?.configurations).slice(0, 12),
      integratedReading: {
        primaryPattern: compactPattern(integrated.primaryPattern),
        alternativeReading: compactAlternative(
          integrated.alternativeReading
        ),
        strengths: uniqueText(integrated.strengths, 6, 1200),
        risks: uniqueText(integrated.risks, 6, 1200),
        currentRuntime: cleanText(integrated.currentRuntime),
        currentTransition: cleanText(integrated.currentTransition),
        evidenceWatch: uniqueText(integrated.evidenceWatch, 8, 1200)
      },
      navigationReadiness: isObject(ruleReading?.navigationReadiness)
        ? ruleReading.navigationReadiness
        : {}
    },
    immutablePolicy: {
      evidenceBoundaryOwnedByRuleEngine: true,
      evidenceQuotesMustRemainVerbatim: true,
      evidenceQuotesMustNotBeTranslated: true,
      evidenceClassesMustRemainSeparate: true,
      canonicalRuntimeValuesMustRemainUnchanged: true,
      providerCannotCreateObservedEvidence: true,
      providerCannotDecideNavigationReadiness: true,
      providerCannotSelectAnotherProvider: true,
      providerCannotPersistRuntimeData: true
    }
  });
}

export function isReadingEvidenceGrounded(
  sourceText,
  readingInput,
  ruleReading
) {
  const candidate = cleanText(sourceText).toLocaleLowerCase();

  if (!candidate) return false;

  const boundary = evidenceBoundary(readingInput, ruleReading);

  return Object.values(boundary).some(values => (
    values.some(value => value.toLocaleLowerCase() === candidate)
  ));
}

export default {
  allowedFields: READING_PROVIDER_ALLOWED_FIELDS,
  supportedLocales: READING_PROVIDER_SUPPORTED_LOCALES,
  supportedOutputLanguages: READING_PROVIDER_SUPPORTED_OUTPUT_LANGUAGES,
  schema: READING_PROVIDER_ENRICHMENT_SCHEMA,
  systemPrompt: READING_PROVIDER_SYSTEM_PROMPT,
  buildInput: buildReadingProviderInput,
  isEvidenceGrounded: isReadingEvidenceGrounded
};
