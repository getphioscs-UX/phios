/*
 * PHI OS Reality Reading Provider Router
 * File: functions/runtime/reading/provider-router.js
 * Version: 1.1.0
 *
 * Routing order:
 * 1. Deterministic Rule Engine
 * 2. Optional Workers AI enrichment
 * 3. Optional OpenAI enrichment
 * 4. Professional Review recommendation
 *
 * Model providers may refine interpretive fields only. They cannot change the
 * Evidence Boundary, establish new Observed Evidence, or decide Navigation
 * readiness.
 */

import readRuntimeRuleFirst from './rule-reading.js';
import runWorkersAIReading from './providers/workers-ai.js';
import runOpenAIReading from './providers/openai.js';

const ALLOWED_PROVIDERS = Object.freeze([
  'auto',
  'rule_engine',
  'workers_ai',
  'openai',
  'professional_review'
]);

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function clamp(value) {
  return Math.max(
    0,
    Math.min(1, Number(value) || 0)
  );
}

function cleanText(value) {
  return typeof value === 'string'
    ? value
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

function list(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function uniqueText(
  values,
  maximum = Infinity
) {
  const seen = new Set();
  const output = [];

  for (const value of list(values)) {
    const text = cleanText(value);
    const key = text.toLocaleLowerCase();

    if (!text || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(text);

    if (output.length >= maximum) {
      break;
    }
  }

  return output;
}

function containsChinese(value) {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(
    cleanText(value)
  );
}

function normalizeOutputLanguage(value) {
  const language = cleanText(value)
    .toLowerCase()
    .replaceAll('_', '-');

  if (
    language === 'zh' ||
    language.startsWith('zh-')
  ) {
    return 'zh';
  }

  return 'en';
}

function normalizeProvider(value) {
  const provider = cleanText(value)
    .toLowerCase()
    .replaceAll('-', '_');

  if (
    provider === 'rule' ||
    provider === 'rule_first'
  ) {
    return 'rule_engine';
  }

  if (
    provider === 'workers' ||
    provider === 'cloudflare'
  ) {
    return 'workers_ai';
  }

  return ALLOWED_PROVIDERS.includes(provider)
    ? provider
    : 'auto';
}

function normalizeRuntimeOptions(
  readingInput,
  options = {}
) {
  const outputLanguage =
    normalizeOutputLanguage(
      options.outputLanguage ||
      options.language ||
      options.locale ||
      readingInput
        ?.languageContract
        ?.outputLanguage ||
      readingInput?.outputLanguage ||
      readingInput?.locale
    );

  const locale =
    outputLanguage === 'zh'
      ? 'zh-Hans'
      : 'en';

  return {
    provider: normalizeProvider(
      options.provider ||
      readingInput
        ?.inferencePreference
        ?.provider ||
      'auto'
    ),

    deepReading:
      options.deepReading === true,

    locale,
    outputLanguage
  };
}

function copy(
  language,
  english,
  chinese
) {
  return language === 'zh'
    ? chinese
    : english;
}

function generatedTextMatchesLanguage(
  value,
  language
) {
  const text = cleanText(value);

  if (!text) {
    return false;
  }

  return language === 'zh'
    ? containsChinese(text)
    : !containsChinese(text);
}

function evidenceSourceSet(ruleReading) {
  const boundary =
    isObject(ruleReading?.evidenceBoundary)
      ? ruleReading.evidenceBoundary
      : {};

  return new Set([
    ...uniqueText(
      boundary.observedEvidence
    ),

    ...uniqueText(
      boundary.reportedExperience
    ),

    ...uniqueText(
      boundary.interpretation
    ),

    ...uniqueText(
      boundary.professionalAssessment
    ),

    ...uniqueText(
      boundary.unknownReality
    )
  ].map(value => (
    value.toLocaleLowerCase()
  )));
}

function groundedSupportingEvidence(
  values,
  ruleReading
) {
  const sources =
    evidenceSourceSet(ruleReading);

  return uniqueText(
    values,
    4
  ).filter(value => (
    sources.has(
      value.toLocaleLowerCase()
    )
  ));
}

function localizedGeneratedList(
  values,
  language,
  maximum
) {
  return uniqueText(
    values,
    maximum
  ).filter(value => (
    generatedTextMatchesLanguage(
      value,
      language
    )
  ));
}

function acceptedGeneratedText(
  value,
  language
) {
  const text = cleanText(value);

  return generatedTextMatchesLanguage(
    text,
    language
  )
    ? text
    : '';
}

function mergeEnrichment(
  ruleReading,
  providerResult,
  runtimeOptions
) {
  const enrichment =
    isObject(providerResult?.enrichment)
      ? providerResult.enrichment
      : {};

  const integrated =
    isObject(ruleReading.integratedReading)
      ? ruleReading.integratedReading
      : {};

  const language =
    runtimeOptions.outputLanguage;

  const providerPattern =
    isObject(enrichment.primaryPattern)
      ? enrichment.primaryPattern
      : {};

  const providerPatternName =
    acceptedGeneratedText(
      providerPattern.name,
      language
    );

  const providerPatternSummary =
    acceptedGeneratedText(
      providerPattern.summary,
      language
    );

  const providerPatternAccepted =
    Boolean(
      providerPatternName &&
      providerPatternSummary
    );

  const providerConfidence =
    clamp(
      providerPattern.confidence
    );

  const combinedConfidence =
    providerPatternAccepted
      ? clamp(
          (
            ruleReading.confidence *
            0.7
          ) +
          (
            providerConfidence *
            0.3
          )
        )
      : clamp(
          ruleReading.confidence
        );

  const providerAlternative =
    isObject(
      enrichment.alternativeReading
    )
      ? enrichment.alternativeReading
      : {};

  const alternativeSummary =
    acceptedGeneratedText(
      providerAlternative.summary,
      language
    );

  const supportingEvidence =
    groundedSupportingEvidence(
      providerAlternative
        .supportingEvidence,
      ruleReading
    );

  const evidenceNeeded =
    localizedGeneratedList(
      providerAlternative
        .evidenceNeeded,
      language,
      4
    );

  const strengths =
    localizedGeneratedList(
      enrichment.strengths,
      language,
      6
    );

  const risks =
    localizedGeneratedList(
      enrichment.risks,
      language,
      6
    );

  const evidenceWatch =
    localizedGeneratedList(
      enrichment.evidenceWatch,
      language,
      8
    );

  const currentTransition =
    acceptedGeneratedText(
      enrichment.currentTransition,
      language
    );

  const providerName =
    cleanText(
      providerResult?.provider
    ) ||
    'semantic_provider';

  return {
    ...ruleReading,

    readingMethod:
      `rule_first+${providerName}`,

    confidence:
      Number(
        combinedConfidence.toFixed(2)
      ),

    /*
     * Provider enrichment cannot
     * modify Evidence Boundary
     * or Navigation readiness.
     */
    evidenceBoundary:
      ruleReading.evidenceBoundary,

    navigationReadiness:
      ruleReading.navigationReadiness,

    integratedReading: {
      ...integrated,

      observedEvidence:
        integrated.observedEvidence,

      reportedExperience:
        integrated.reportedExperience,

      interpretation:
        integrated.interpretation,

      professionalAssessment:
        integrated.professionalAssessment,

      unknownReality:
        integrated.unknownReality,

      primaryPattern: {
        ...(
          isObject(
            integrated.primaryPattern
          )
            ? integrated.primaryPattern
            : {}
        ),

        name:
          providerPatternAccepted
            ? providerPatternName
            : integrated
                ?.primaryPattern
                ?.name,

        summary:
          providerPatternAccepted
            ? providerPatternSummary
            : integrated
                ?.primaryPattern
                ?.summary,

        confidence:
          providerPatternAccepted
            ? providerConfidence
            : integrated
                ?.primaryPattern
                ?.confidence,

        evidenceClass:
          'interpretation'
      },

      alternativeReading: {
        ...(
          isObject(
            integrated.alternativeReading
          )
            ? integrated.alternativeReading
            : {}
        ),

        summary:
          alternativeSummary ||
          integrated
            ?.alternativeReading
            ?.summary,

        supportingEvidence:
          supportingEvidence.length
            ? supportingEvidence
            : integrated
                ?.alternativeReading
                ?.supportingEvidence ||
              [],

        evidenceNeeded:
          evidenceNeeded.length
            ? evidenceNeeded
            : integrated
                ?.alternativeReading
                ?.evidenceNeeded ||
              [],

        evidenceClass:
          'interpretation'
      },

      strengths:
        strengths.length
          ? strengths
          : integrated.strengths,

      risks:
        risks.length
          ? risks
          : integrated.risks,

      currentTransition:
        currentTransition ||
        integrated.currentTransition,

      evidenceWatch:
        evidenceWatch.length
          ? evidenceWatch
          : integrated.evidenceWatch
    }
  };
}

function baseInference({
  runtimeOptions,
  deepReadingRequested,
  attempts = [],
  reason,
  professionalReviewRecommended = false
}) {
  return {
    provider:
      'rule_engine',

    model:
      null,

    requestedProvider:
      runtimeOptions.provider,

    workersAIUsed:
      false,

    openAIUsed:
      false,

    paidInferenceUsed:
      false,

    ruleFirstApplied:
      true,

    deepReadingRequested,

    professionalReviewRecommended,

    locale:
      runtimeOptions.locale,

    outputLanguage:
      runtimeOptions.outputLanguage,

    reason,
    attempts
  };
}

function providerInference({
  runtimeOptions,
  providerResult,
  attempts,
  provider,
  reason
}) {
  return {
    provider:
      cleanText(
        providerResult?.provider
      ) ||
      provider,

    model:
      cleanText(
        providerResult?.model
      ) ||
      null,

    requestedProvider:
      runtimeOptions.provider,

    workersAIUsed:
      provider ===
      'workers_ai',

    openAIUsed:
      provider ===
      'openai',

    paidInferenceUsed:
      provider ===
      'openai',

    ruleFirstApplied:
      true,

    deepReadingRequested:
      true,

    professionalReviewRecommended:
      false,

    locale:
      runtimeOptions.locale,

    outputLanguage:
      runtimeOptions.outputLanguage,

    reason,
    attempts
  };
}

export async function routeRealityReading({
  env = {},
  readingInput,
  options = {}
}) {
  const runtimeOptions =
    normalizeRuntimeOptions(
      readingInput,
      options
    );

  const language =
    runtimeOptions.outputLanguage;

  const ruleReading =
    readRuntimeRuleFirst(
      readingInput,
      runtimeOptions
    );

  const requestedProvider =
    runtimeOptions.provider;

  const deepReadingRequested =
    runtimeOptions.deepReading;

  const attempts = [];

  /*
   * Initial Reading:
   * Rule Engine only.
   */
  if (!deepReadingRequested) {
    return {
      reading:
        ruleReading,

      inference:
        baseInference({
          runtimeOptions,

          deepReadingRequested:
            false,

          attempts,

          reason:
            copy(
              language,

              'The initial Reality Reading was completed by the Rule Engine. No model enrichment was requested.',

              '初始现实读取已由规则引擎完成，本次没有请求模型增补。'
            )
        })
    };
  }

  /*
   * Explicit Rule Engine mode:
   * never call external providers.
   */
  if (
    requestedProvider ===
    'rule_engine'
  ) {
    return {
      reading:
        ruleReading,

      inference:
        baseInference({
          runtimeOptions,

          deepReadingRequested:
            true,

          attempts,

          reason:
            copy(
              language,

              'Rule Engine only was explicitly selected. No external model provider was called.',

              '本次已明确选择仅使用规则引擎，因此没有调用任何外部模型 Provider。'
            )
        })
    };
  }

  /*
   * Professional Review selected:
   * preserve Rule Reading.
   */
  if (
    requestedProvider ===
    'professional_review'
  ) {
    return {
      reading:
        ruleReading,

      inference:
        baseInference({
          runtimeOptions,

          deepReadingRequested:
            true,

          attempts,

          professionalReviewRecommended:
            true,

          reason:
            copy(
              language,

              'Professional Review was selected. The bounded Rule Reading was preserved without model enrichment.',

              '本次已选择专业审阅；系统保留有边界的规则读取，不进行模型增补。'
            )
        })
    };
  }

   /*
   * Models cannot resolve missing evidence during automatic routing.
   *
   * However, an explicitly selected provider may still be invoked for:
   * - Production acceptance testing;
   * - bounded semantic enrichment;
   * - provider-contract validation.
   *
   * Explicit provider selection never authorizes the model to:
   * - create evidence;
   * - fill an evidence gap with interpretation;
   * - change Evidence Boundary;
   * - change Navigation readiness.
   */
  const explicitModelProviderRequested =
    requestedProvider === 'workers_ai' ||
    requestedProvider === 'openai';

  const modelInferenceUseful =
    ruleReading
      ?.routingHints
      ?.modelInferenceUseful ===
    true;

  if (
    !modelInferenceUseful &&
    !explicitModelProviderRequested
  ) {
    return {
      reading:
        ruleReading,

      inference:
        baseInference({
          runtimeOptions,

          deepReadingRequested:
            true,

          attempts,

          reason:
            copy(
              language,

              'Model inference would not resolve the current evidence gap, so the bounded Rule Reading was preserved.',

              '模型推理无法解决当前的证据缺口，因此系统保留有边界的规则读取。'
            )
        })
    };
  }

  /*
   * Workers AI routing.
   */
  const workersAllowed =
  [
    'auto',
    'workers_ai',
    'openai'
  ].includes(
    requestedProvider
  ) &&
  readingInput
    ?.inferencePreference
    ?.workersAIPreferred !==
  false;

  if (
    workersAllowed &&
    env?.AI
  ) {
    try {
      const providerResult =
        await runWorkersAIReading(
          env,
          readingInput,
          ruleReading,
          runtimeOptions
        );

      attempts.push({
        provider:
          'workers_ai',

        success:
          true
      });

      return {
        reading:
          mergeEnrichment(
            ruleReading,
            providerResult,
            runtimeOptions
          ),

        inference:
          providerInference({
            runtimeOptions,
            providerResult,
            attempts,

            provider:
              'workers_ai',

            reason:
              copy(
                language,

                'Workers AI refined bounded interpretive fields after the Rule Reading. Evidence classification and Navigation readiness were not changed.',

                'Workers AI 在规则读取之后增补了有边界的解释字段；证据分类与现实导航就绪状态均未改变。'
              )
          })
      };
    } catch (error) {
      attempts.push({
        provider:
          'workers_ai',

        success:
          false,

        error:
          cleanText(
            error?.message
          ) ||
          'Workers AI enrichment failed.'
      });
    }
  }

  /*
   * OpenAI routing.
   *
   * OpenAI requires:
   * - an eligible request;
   * - explicit permission;
   * - a configured key.
   */
const openAIAllowed =
  [
    'auto',
    'workers_ai',
    'openai'
  ].includes(
    requestedProvider
  ) &&
  readingInput
    ?.inferencePreference
    ?.openAIAllowed ===
  true &&
  Boolean(
    env?.OPENAI_API_KEY
  );

  if (openAIAllowed) {
    try {
      const providerResult =
        await runOpenAIReading(
          env,
          readingInput,
          ruleReading,
          runtimeOptions
        );

      attempts.push({
        provider:
          'openai',

        success:
          true
      });

      return {
        reading:
          mergeEnrichment(
            ruleReading,
            providerResult,
            runtimeOptions
          ),

        inference:
          providerInference({
            runtimeOptions,
            providerResult,
            attempts,

            provider:
              'openai',

            reason:
              copy(
                language,

                'OpenAI refined bounded interpretive fields after Rule Engine routing. Evidence classification and Navigation readiness were not changed.',

                'OpenAI 在规则引擎路由之后增补了有边界的解释字段；证据分类与现实导航就绪状态均未改变。'
              )
          })
      };
    } catch (error) {
      attempts.push({
        provider:
          'openai',

        success:
          false,

        error:
          cleanText(
            error?.message
          ) ||
          'OpenAI enrichment failed.'
      });
    }
  }

  /*
   * No eligible model provider:
   * preserve Rule Reading.
   */
  return {
    reading:
      ruleReading,

    inference:
      baseInference({
        runtimeOptions,

        deepReadingRequested:
          true,

        attempts,

        professionalReviewRecommended:
          true,

        reason:
          attempts.length
            ? copy(
                language,

                'Optional model enrichment was unavailable. The bounded Rule Reading was preserved, and Professional Review remains available.',

                '可选模型增补目前不可用；系统已保留有边界的规则读取，并继续开放专业审阅。'
              )
            : copy(
                language,

                'No eligible model provider is configured. The bounded Rule Reading was preserved, and Professional Review is the next escalation layer.',

                '目前没有符合条件的模型 Provider；系统已保留有边界的规则读取，下一层升级路径为专业审阅。'
              )
      })
  };
}

export default routeRealityReading;
