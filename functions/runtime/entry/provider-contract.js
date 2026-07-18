import { FIELD_NAMES, sanitizeConversation } from '../../_lib/utils.js';

/*
 * PHI OS Runtime Entry provider contract
 *
 * Model providers are optional semantic extractors after the Rule Engine.
 * They may propose bounded candidates quoted from user material, but they do
 * not own Evidence classification, field completeness, Entry completion, or
 * provider routing. The Entry router must validate and merge every candidate.
 */

export const ENTRY_PROVIDER_ALLOWED_FIELDS = Object.freeze([
  'timeCandidate',
  'triggerCandidates',
  'contextCandidates',
  'affectedRealityCandidates',
  'counterEvidenceCandidates',
  'dependencyCandidates',
  'reportedExperienceCandidates',
  'interpretationCandidates',
  'professionalAssessmentCandidates',
  'currentTensionCandidate',
  'desiredTransitionCandidate',
  'questionCandidates',
  'unresolvedFields'
]);

const quotedCandidate = Object.freeze({
  type: 'object',
  additionalProperties: false,
  properties: {
    sourceText: {
      type: 'string'
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1
    }
  },
  required: [
    'sourceText',
    'confidence'
  ]
});

export const ENTRY_PROVIDER_ENRICHMENT_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,

  properties: {
    language: {
      type: 'string',
      enum: [
        'en',
        'zh-Hans'
      ]
    },

    acknowledgement: {
      type: 'string'
    },

    timeCandidate: {
      type: 'object',
      additionalProperties: false,

      properties: {
        sourceText: {
          type: 'string'
        },

        precision: {
          type: 'string',
          enum: [
            'exact_date',
            'month',
            'year',
            'relative',
            'unknown'
          ]
        },

        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1
        }
      },

      required: [
        'sourceText',
        'precision',
        'confidence'
      ]
    },

    triggerCandidates: {
      type: 'array',
      items: quotedCandidate,
      maxItems: 3
    },

    contextCandidates: {
      type: 'array',
      items: quotedCandidate,
      maxItems: 5
    },

    affectedRealityCandidates: {
      type: 'array',

      items: {
        type: 'object',
        additionalProperties: false,

        properties: {
          domain: {
            type: 'string'
          },

          sourceText: {
            type: 'string'
          },

          role: {
            type: 'string',
            enum: [
              'primary',
              'connected',
              'possible'
            ]
          },

          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1
          }
        },

        required: [
          'domain',
          'sourceText',
          'role',
          'confidence'
        ]
      },

      maxItems: 4
    },

    counterEvidenceCandidates: {
      type: 'array',
      items: quotedCandidate,
      maxItems: 4
    },

    dependencyCandidates: {
      type: 'array',

      items: {
        type: 'object',
        additionalProperties: false,

        properties: {
          sourceText: {
            type: 'string'
          },

          effect: {
            type: 'string'
          },

          status: {
            type: 'string',
            enum: [
              'reported',
              'unclear'
            ]
          },

          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1
          }
        },

        required: [
          'sourceText',
          'effect',
          'status',
          'confidence'
        ]
      },

      maxItems: 4
    },

    reportedExperienceCandidates: {
      type: 'array',
      items: quotedCandidate,
      maxItems: 5
    },

    interpretationCandidates: {
      type: 'array',
      items: quotedCandidate,
      maxItems: 5
    },

    professionalAssessmentCandidates: {
      type: 'array',
      items: quotedCandidate,
      maxItems: 3
    },

    currentTensionCandidate: quotedCandidate,

    desiredTransitionCandidate: quotedCandidate,

    questionCandidates: {
      type: 'array',

      items: {
        type: 'object',
        additionalProperties: false,

        properties: {
          target: {
            type: 'string',
            enum: FIELD_NAMES
          },

          question: {
            type: 'string'
          },

          reason: {
            type: 'string'
          }
        },

        required: [
          'target',
          'question',
          'reason'
        ]
      },

      maxItems: 3
    },

    unresolvedFields: {
      type: 'array',

      items: {
        type: 'string',
        enum: FIELD_NAMES
      },

      maxItems: FIELD_NAMES.length
    }
  },

  required: [
    'language',
    'acknowledgement',
    'timeCandidate',
    'triggerCandidates',
    'contextCandidates',
    'affectedRealityCandidates',
    'counterEvidenceCandidates',
    'dependencyCandidates',
    'reportedExperienceCandidates',
    'interpretationCandidates',
    'professionalAssessmentCandidates',
    'currentTensionCandidate',
    'desiredTransitionCandidate',
    'questionCandidates',
    'unresolvedFields'
  ]
});

export const ENTRY_PROVIDER_SYSTEM_PROMPT = `
You are the bounded semantic extraction layer of PHI OS Runtime Entry.

The deterministic Rule Engine has already processed the conversation. Return
only the requested JSON enrichment.

Set language to the requestedLanguage when it is en or zh-Hans. Otherwise,
detect the language of the latest user message.

Extract only material explicitly present in user messages. Every sourceText
must be a short verbatim excerpt from a user message. If no valid candidate
exists, return an empty string or an empty array.

You may propose candidates for time, trigger, context, affected Reality,
counter-evidence, dependency, reported experience, interpretation, explicit
professional assessment, current tension, desired transition, and the next
clarifying question.

You must not add or rewrite Observed Evidence. The Rule Engine exclusively owns
Observed Evidence and the observed change.

Keep these evidence classes strictly separate:

1. Observed Evidence
2. Reported Experience
3. Interpretation
4. Professional Assessment
5. Unknown Reality

A feeling is Reported Experience.

A belief, explanation, motive, causal claim, or meaning is Interpretation.

Professional Assessment requires an explicitly reported assessment by an
identifiable qualified professional. Never infer one.

Never calculate a calendar date from relative time. Preserve expressions such
as "three months ago", "recently", or "last year" exactly as written.

Use exact_date only when the user explicitly wrote a complete calendar date.

Never diagnose, predict, prescribe, advise, prove causation, infer motives,
invent context, or fill a field because it seems plausible.

Never decide field completeness, Entry completion, confidence thresholds,
provider routing, or whether another model should be called.

Use the language of the user's latest message for acknowledgement and
questions.

Keep all JSON property names, schema field names, enum values, roles, statuses,
and precision values in their canonical English machine-readable form.
`.trim();

function cleanText(value) {
  return typeof value === 'string'
    ? value
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

function boundedUserConversation(conversation) {
  return sanitizeConversation(conversation)
    .filter(item => item.role === 'user')
    .map(item => ({
      role: 'user',
      content: cleanText(item.content)
    }))
    .filter(item => item.content)
    .slice(-8);
}

export function buildEntryProviderInput(entryInput, ruleEntry) {
  return JSON.stringify({
    task:
      'Extract bounded candidates for unresolved Runtime Entry fields.',

    requestedLanguage:
      cleanText(
        entryInput?.language ||
        entryInput?.locale
      ) || 'auto',

    mode:
      cleanText(entryInput?.mode) ||
      'guided',

    entryRound:
      ruleEntry?.assessment?.entryRound ||
      Number(entryInput?.entryRound) ||
      0,

    userConversation:
      boundedUserConversation(
        entryInput?.conversation
      ),

    ruleFirst: {
      extractedFields:
        ruleEntry?.extractedFields ||
        {},

      evidenceBoundary:
        ruleEntry?.evidenceBoundary ||
        {},

      fieldCompleteness:
        ruleEntry?.fieldCompleteness ||
        {},

      missingFields:
        ruleEntry?.assessment?.missingFields ||
        [],

      nextQuestionTarget:
        ruleEntry?.assessment?.nextQuestionTarget ||
        'none'
    },

    immutablePolicy: {
      observedEvidenceOwnedByRuleEngine: true,
      relativeDatesMustRemainRelative: true,
      evidenceClassesMustRemainSeparate: true,
      providerCannotCompleteEntry: true,
      sourceTextMustRemainVerbatim: true,
      canonicalSchemaLanguage: 'en'
    }
  });
}

export function isSourceTextGrounded(sourceText, conversation) {
  const candidate =
    cleanText(sourceText)
      .toLowerCase();

  if (!candidate) {
    return false;
  }

  return boundedUserConversation(conversation)
    .some(item => (
      cleanText(item.content)
        .toLowerCase()
        .includes(candidate)
    ));
}

export default {
  schema:
    ENTRY_PROVIDER_ENRICHMENT_SCHEMA,

  systemPrompt:
    ENTRY_PROVIDER_SYSTEM_PROMPT,

  buildInput:
    buildEntryProviderInput,

  isSourceTextGrounded
};
