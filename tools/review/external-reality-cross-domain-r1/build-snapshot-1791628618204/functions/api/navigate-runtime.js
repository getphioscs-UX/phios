/**
 * PHI OS Reality Navigation API.
 *
 * POST /api/navigate-runtime
 *
 * Receives a canonical Navigation Input and produces bounded, reviewable
 * Reality Navigation paths through the deterministic Rule Engine.
 *
 * This endpoint does not call Workers AI or OpenAI, does not persist Runtime
 * evidence, does not issue deterministic commands, and does not replace
 * qualified professional judgment.
 */

import {
  SCHEMA_IDS,
  isAcceptedSchema
} from '../runtime/shared/schema-registry.js';
import '../runtime/registry/index.js';

import navigateRuntimeRuleFirst from
  '../runtime/navigation/rule-navigation.js';

import {
  validateNavigationContract
} from '../runtime/navigation/navigation-contract.js';

const NAVIGATION_RUNTIME_COPY_VERSION =
  '1.1.0';

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function cleanText(value) {
  return typeof value === 'string'
    ? value
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
}

function json(
  payload,
  status = 200,
  headers = {}
) {
  return new Response(
    JSON.stringify(payload),
    {
      status,
      headers: {
        'content-type':
          'application/json; charset=utf-8',

        'cache-control':
          'no-store',

        'access-control-allow-origin':
          '*',

        'x-content-type-options':
          'nosniff',

        ...headers
      }
    }
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

function copy(
  language,
  english,
  chinese
) {
  return language === 'zh'
    ? chinese
    : english;
}

function validationIssue(
  code,
  field,
  language,
  english,
  chinese
) {
  return {
    code,
    field,
    message: copy(
      language,
      english,
      chinese
    )
  };
}

function requestNavigationInput(body) {
  if (!isObject(body)) return null;

  return (
    body.navigationInput ||
    body.navigation_input ||
    body.input ||
    null
  );
}

function requestLanguage(body) {
  const navigationInput =
    requestNavigationInput(body);

  const options =
    isObject(body?.options)
      ? body.options
      : {};

  return normalizeOutputLanguage(
    options.outputLanguage ||
    options.language ||
    options.locale ||
    navigationInput
      ?.languageContract
      ?.outputLanguage ||
    navigationInput?.outputLanguage ||
    navigationInput?.locale
  );
}

function normalizeRequestOptions(
  navigationInput,
  rawOptions = {}
) {
  const options =
    isObject(rawOptions)
      ? rawOptions
      : {};

  const outputLanguage =
    normalizeOutputLanguage(
      options.outputLanguage ||
      options.language ||
      options.locale ||
      navigationInput
        ?.languageContract
        ?.outputLanguage ||
      navigationInput?.outputLanguage ||
      navigationInput?.locale
    );

  return {
    locale:
      outputLanguage === 'zh'
        ? 'zh-Hans'
        : 'en',

    outputLanguage
  };
}

function validateNavigationInput(
  input,
  language = 'en'
) {
  const errors = [];

  if (!isObject(input)) {
    return [
      validationIssue(
        'navigation_input_required',
        'navigationInput',
        language,
        'Reality Navigation input must be an object.',
        '现实导航输入必须是一个对象。'
      )
    ];
  }

  if (
    !isAcceptedSchema(
      'navigationInput',
      cleanText(input.schemaVersion)
    )
  ) {
    errors.push(
      validationIssue(
        'navigation_schema_invalid',
        'schemaVersion',
        language,
        'Navigation input schemaVersion is invalid.',
        '现实导航输入的 schemaVersion 无效。'
      )
    );
  }

  if (
    !cleanText(
      input.runtimeEntityId
    )
  ) {
    errors.push(
      validationIssue(
        'runtime_entity_id_required',
        'runtimeEntityId',
        language,
        'Runtime Entity ID is required.',
        '缺少 Runtime Entity ID。'
      )
    );
  }

  if (
    !cleanText(
      input.runtimeEntryId
    )
  ) {
    errors.push(
      validationIssue(
        'runtime_entry_id_required',
        'runtimeEntryId',
        language,
        'Runtime Entry ID is required.',
        '缺少 Runtime Entry ID。'
      )
    );
  }

  if (!isObject(input.reading)) {
    errors.push(
      validationIssue(
        'reading_required',
        'reading',
        language,
        'Reality Reading is required.',
        '缺少现实读取资料。'
      )
    );
  } else if (
    !isAcceptedSchema(
      'realityReading',
      cleanText(
        input.reading.schemaVersion
      )
    )
  ) {
    errors.push(
      validationIssue(
        'reading_schema_invalid',
        'reading.schemaVersion',
        language,
        'Reality Reading schemaVersion is invalid.',
        '现实读取的 schemaVersion 无效。'
      )
    );
  }

  const evidenceBoundary =
    isObject(input.evidenceBoundary)
      ? input.evidenceBoundary
      : isObject(
          input?.reading?.evidenceBoundary
        )
        ? input.reading.evidenceBoundary
        : null;

  if (!evidenceBoundary) {
    errors.push(
      validationIssue(
        'evidence_boundary_required',
        'evidenceBoundary',
        language,
        'Evidence Boundary is required.',
        '缺少证据边界。'
      )
    );
  }

  if (
    input
      ?.interpretationPolicy
      ?.evidenceBeforeInterpretation !==
    true
  ) {
    errors.push(
      validationIssue(
        'evidence_before_interpretation_required',
        'interpretationPolicy.evidenceBeforeInterpretation',
        language,
        'Evidence Before Interpretation must remain enabled.',
        '必须继续启用“证据先于解释”原则。'
      )
    );
  }

  if (
    input
      ?.interpretationPolicy
      ?.preserveUnknownReality !==
    true
  ) {
    errors.push(
      validationIssue(
        'unknown_reality_preservation_required',
        'interpretationPolicy.preserveUnknownReality',
        language,
        'Unknown Reality preservation must remain enabled.',
        '必须继续保留未知现实。'
      )
    );
  }

  if (
    input
      ?.navigationPolicy
      ?.userChoiceRequired !==
    true
  ) {
    errors.push(
      validationIssue(
        'user_choice_required',
        'navigationPolicy.userChoiceRequired',
        language,
        'User choice must remain required for Reality Navigation.',
        '现实导航必须继续保留用户选择权。'
      )
    );
  }

  if (
    input
      ?.navigationPolicy
      ?.automaticPathSelectionAllowed ===
    true
  ) {
    errors.push(
      validationIssue(
        'automatic_path_selection_forbidden',
        'navigationPolicy.automaticPathSelectionAllowed',
        language,
        'Automatic Navigation path selection is not allowed.',
        '不允许自动替用户选择现实导航路径。'
      )
    );
  }

  if (
    input
      ?.navigationPolicy
      ?.deterministicCommandsAllowed ===
    true
  ) {
    errors.push(
      validationIssue(
        'deterministic_commands_forbidden',
        'navigationPolicy.deterministicCommandsAllowed',
        language,
        'Deterministic commands are not allowed.',
        '现实导航不允许输出决定性命令。'
      )
    );
  }

  return errors;
}

function buildInference() {
  return {
    provider:
      'rule_engine',

    model:
      null,

    workersAIUsed:
      false,

    openAIUsed:
      false,

    paidInferenceUsed:
      false,

    ruleFirstApplied:
      true,

    attempts:
      [],

    reason:
      'Reality Navigation was generated by the deterministic Rule Engine without model inference.'
  };
}

export async function onRequestOptions() {
  return new Response(
    null,
    {
      status: 204,
      headers: {
        'access-control-allow-origin':
          '*',

        'access-control-allow-methods':
          'GET, POST, OPTIONS',

        'access-control-allow-headers':
          'content-type',

        'access-control-max-age':
          '86400',

        'cache-control':
          'no-store'
      }
    }
  );
}

export async function onRequestGet() {
  return json({
    success:
      true,

    service:
      'PHI OS Reality Navigation API',

    version:
      '1.0.0',

    endpoint:
      '/api/navigate-runtime',

    method:
      'POST',

    inputSchema:
      SCHEMA_IDS.NAVIGATION_INPUT,

    outputSchema:
      SCHEMA_IDS.NAVIGATION,

    navigationMethod:
      'rule_first',

    supportedPathTypes: [
      'observe',
      'clarify',
      'verify',
      'reposition',
      'reconnect',
      'reconfigure',
      'recover',
      'professional_review'
    ],

    supportedLocales: [
      'en',
      'zh-Hans'
    ],

    supportedOutputLanguages: [
      'en',
      'zh'
    ],

    inference: {
      defaultProvider:
        'rule_engine',

      workersAIEnabled:
        false,

      openAIEnabled:
        false,

      paidInferenceUsed:
        false
    },

    persistence:
      'session_only',

    guardrails: {
      deterministicCommandsAllowed:
        false,

      automaticPathSelectionAllowed:
        false,

      outcomePredictionAllowed:
        false,

      interpretationAsFactAllowed:
        false,

      professionalJudgmentReplacementAllowed:
        false,

      userChoiceRequired:
        true,

      reviewConditionsRequired:
        true,

      unknownRealityPreserved:
        true
    },

    status:
      'ready'
  });
}

export async function onRequestPost({
  request
}) {
  const contentType = cleanText(
    request
      ?.headers
      ?.get('content-type')
  ).toLowerCase();

  if (
    !contentType.includes(
      'application/json'
    )
  ) {
    return json(
      {
        success:
          false,

        stage:
          'navigation_error',

        code:
          'content_type_invalid',

        error:
          'Content-Type must be application/json.'
      },
      415
    );
  }

  let body;

  try {
    body =
      await request.json();
  } catch {
    return json(
      {
        success:
          false,

        stage:
          'navigation_error',

        code:
          'json_invalid',

        error:
          'The request body is not valid JSON.'
      },
      400
    );
  }

  if (!isObject(body)) {
    return json(
      {
        success:
          false,

        stage:
          'navigation_error',

        code:
          'request_body_invalid',

        error:
          'The request body must be a JSON object.'
      },
      400
    );
  }

  const language =
    requestLanguage(body);

  const navigationInput =
    requestNavigationInput(body);

  const runtimeOptions =
    normalizeRequestOptions(
      navigationInput,
      body.options
    );

  const validationErrors =
    validateNavigationInput(
      navigationInput,
      language
    );

  if (
    validationErrors.length > 0
  ) {
    return json(
      {
        success:
          false,

        stage:
          'navigation_error',

        code:
          'navigation_input_invalid',

        error:
          copy(
            language,
            'The Reality Navigation input is incomplete or invalid.',
            '现实导航输入不完整或无效。'
          ),

        validationErrors,

        languageContract: {
          locale:
            runtimeOptions.locale,

          outputLanguage:
            runtimeOptions.outputLanguage
        }
      },
      422
    );
  }

  try {
    const navigation =
      navigateRuntimeRuleFirst(
        navigationInput,
        runtimeOptions
      );

    const contractValidation =
      validateNavigationContract(
        navigation
      );

    if (
      !contractValidation.valid
    ) {
      throw new Error(
        `Navigation output failed contract validation: ${contractValidation.errors.join(' ')}`
      );
    }

    const availablePaths =
      Array.isArray(
        navigation.availablePaths
      )
        ? navigation.availablePaths
        : [];

    const navigationReady =
      navigation
        ?.navigationReadiness
        ?.ready ===
      true;

    return json({
      success:
        true,

      stage:
        navigationReady
          ? 'navigation_ready'
          : 'navigation_partial',

      runtimeEntityId:
        cleanText(
          navigationInput.runtimeEntityId
        ),

      runtimeEntryId:
        cleanText(
          navigationInput.runtimeEntryId
        ),

      languageContract: {
        locale:
          runtimeOptions.locale,

        outputLanguage:
          runtimeOptions.outputLanguage
      },

      runtimeCopyVersion:
        NAVIGATION_RUNTIME_COPY_VERSION,

      navigationInput,

      navigation,

      pathSummary: {
        availablePathCount:
          availablePaths.length,

        pathTypes:
          availablePaths
            .map(path =>
              cleanText(
                path?.pathType
              )
            )
            .filter(Boolean),

        userChoiceRequired:
          true,

        selectedPath:
          navigation.selectedPath ||
          null
      },

      inference:
        buildInference(),

      evidencePolicy: {
        observedEvidenceSeparated:
          true,

        reportedExperienceSeparated:
          true,

        interpretationSeparated:
          true,

        professionalAssessmentSeparated:
          true,

        unknownRealityPreserved:
          true,

        interpretationCannotBecomeFact:
          true,

        navigationCannotCreateEvidence:
          true
      },

      navigationPolicy: {
        deterministicCommandsAllowed:
          false,

        automaticPathSelectionAllowed:
          false,

        outcomePredictionAllowed:
          false,

        userChoiceRequired:
          true,

        reviewConditionsRequired:
          true,

        professionalJudgmentReplacementAllowed:
          false
      },

      persistence: {
        requested:
          navigationInput
            ?.persistence
            ?.storageAllowed ===
          true,

        performed:
          false,

        mode:
          'session_only'
      }
    });
  } catch (error) {
    console.error(
      'PHI OS Reality Navigation API failed:',
      {
        name:
          cleanText(
            error?.name
          ),

        message:
          cleanText(
            error?.message
          ),

        outputLanguage:
          runtimeOptions.outputLanguage
      }
    );

    return json(
      {
        success:
          false,

        stage:
          'navigation_error',

        code:
          'navigation_runtime_failed',

        error:
          copy(
            language,

            'Reality Navigation could not be completed. The existing Reading and Evidence Boundary remain unchanged.',

            '无法完成现实导航；现有现实读取与证据边界不会因此受到改变。'
          ),

        languageContract: {
          locale:
            runtimeOptions.locale,

          outputLanguage:
            runtimeOptions.outputLanguage
        }
      },
      500
    );
  }
}

export async function onRequest(
  context
) {
  const method =
    cleanText(
      context
        ?.request
        ?.method
    ).toUpperCase() ||
    'GET';

  if (method === 'GET') {
    return onRequestGet(
      context
    );
  }

  if (method === 'POST') {
    return onRequestPost(
      context
    );
  }

  if (method === 'OPTIONS') {
    return onRequestOptions(
      context
    );
  }

  return json(
    {
      success:
        false,

      stage:
        'navigation_error',

      code:
        'method_not_allowed',

      error:
        `Method ${method} is not allowed.`
    },
    405,
    {
      allow:
        'GET, POST, OPTIONS'
    }
  );
}
