import {VERSIONS} from './bazi-deep-manuscript-contract.js';
import {
  reportEconomics,
  reportGenerationCeiling,
  reportFollowupReserve
} from '../../pws/commercial/commerce-economics-policy.js';

const MODEL = Object.freeze({
  version: 'GPT-5.6-SOL-CAPACITY-ADMISSION-V1',
  modelId: 'gpt-5.6-sol',
  contextTokens: 1050000,
  maxOutputTokens: 128000,
  responsesApiSupported: true,
  structuredOutputSupported: true,
  reasoningSupported: true,
  constraintsVerified: true,
  pricingVerified: true,
  verifiedAt: '2026-10-06',
  reviewAfter: '2026-11-06',
  verificationSource: 'CURRENT_OFFICIAL_OPENAI_DOCUMENTATION',
  pricing: Object.freeze({
    currency: 'USD',
    perTokens: 1000000,
    longContextInputThresholdTokens: 272000,
    short: Object.freeze({
      input: 4,
      cachedInput: 0.4,
      output: 20
    }),
    long: Object.freeze({
      input: 8,
      cachedInput: 0.8,
      output: 30
    }),
    cacheWriteMultiplier: 1.25,
    scope:
      'Standard processing, no residency/FedRAMP uplift, no tools. Cached tokens assumed zero before telemetry.'
  }),
  outputAccounting:
    'Visible + reasoning + non-visible formatting share max_output_tokens; reasoning billed as output.'
});

const POLICY = Object.freeze({
  version: 'BAZI-DEEP-MANUSCRIPT-R2-1',

  /*
    Governance freeze is admitted.
    Provider/live activation remains a separate runtime env decision.
  */
  productionActivated: false,
  REPORT_PROVIDER_LIVE_ALLOWED: false,

  expectedTokensPerLocale: 1800,

  costTiers: Object.freeze({
    normalCostTarget: null,
    standardRecoveryWarning: null,
    highCostDeliveryThreshold: null
  }),

  humanAcceptReceipt: Object.freeze({
    path:
      'config/reports/bazi-deep-manuscript-r2/production-admission.json',
    statement:
      'HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2'
  }),

  controlledExperimentApproval: null,

  modelManifestPath:
    'content/reports/bazi/deep-manuscript/gpt-5.6-sol-capacity-admission-v1.json',

  reasoningEffort: 'medium',
  reasoningReserveTokens: 25000,
  structuredOutputReserveTokens: 600,
  safetyFactor: 1.2,

  batchOverrides: Object.freeze({
    B03: Object.freeze({
      reasoningReserveTokens: 30000,
      safetyFactor: 1.25
    })
  }),

  capacityThresholds: Object.freeze({
    nearLimitRatio: 0.85,
    elevatedOutputRatio: 0.5
  }),

  productionAdmissionPath:
    'config/reports/bazi-deep-manuscript-r2/production-admission.json'
});

const APPROVAL = Object.freeze({
  statement:
    'HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2',
  productionFrozen: true,
  versions: Object.freeze({
    authority: 'BDM-AUTHORITY-1',
    batch: 'BDM-BATCH-2',
    prompt: 'BDM-PROMPT-2',
    schema: 'BDM-SCHEMA-1',
    checkpoint: 'BDM-CHECKPOINT-1',
    compiler: 'BDM-PUBLICATION-3',
    diagram: 'BDM-DIAGRAM-3',
    pagePlan: 'BDM-PAGES-3',
    renderer: 'BDM-RENDERER-3',
    printShell: 'PHI-OS-REPORT-PRINT-SHELL-V2'
  })
});

const ADMISSION = Object.freeze({
  schemaVersion:
    'BAZI_DEEP_MANUSCRIPT_R2_PRODUCTION_ADMISSION_V1',

  methodCode: 'BZR',
  productId: 'COM-REPORT-BAZI-FULL',

  decision:
    'HUMAN_ACCEPTED_PRODUCTION_ADMISSION',

  approval: APPROVAL,

  humanAcceptance: Object.freeze({
    decision: 'ACCEPT',
    statement:
      'Human ACCEPT BaZi R2 BILINGUAL / EN / ZH_HANS visual publication',
    decisionAuthority:
      'EXPLICIT_USER_IN_THIS_CONVERSATION'
  }),

  productionPolicy: Object.freeze({
    modelId: 'gpt-5.6-sol',
    normalCalls: 3,
    maxStandardRecoveryCalls: 2,
    deliveryRescue: true,
    paidDeliveryGuarantee: true,
    semanticVerifierCalls: 0,
    semanticReviewCalls: 0,
    editorialRewriteCalls: 0
  }),

  economics: Object.freeze({
    priceMYR: 59,
    lifecycleProviderCapUSD: 4,
    generationAndRepairCeilingUSD: 3.6,
    followupReserveUSD: 0.4,
    includedFollowupQuestions: 4,
    costScope:
      'REPORT_REPAIR_BILINGUAL_AND_FOUR_FOLLOWUPS'
  }),

  acceptedReference: Object.freeze({
    referenceSubjectId: 'BDM-REFERENCE-GENG',
    manuscriptDigest:
      '2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9',
    publicationDigest:
      'b5c09e6e3f612f4261f21b2507bfa5ff88d23937740ddb1e69bf73b390c4574d'
  }),

  boundaries: Object.freeze({
    referenceSubjectContentReusableForOtherCustomers: false,
    customerNativeAuthorityRequired: true,
    customerNativeBirthInputRequired: true,
    customerNativeCalculationRequired: true,
    templateSubstitutionForbidden: true,
    publicationProviderCalls: 0,
    reopenProviderCalls: 0
  })
});

function stableVersions(v) {
  return JSON.stringify(
    Object.entries(v || {}).sort()
  );
}

export function buildBaziProductionGenerationConfig() {
  if (
    APPROVAL.statement !==
    'HUMAN ACCEPT BAZI DEEP MANUSCRIPT R2'
  ) {
    throw Error(
      'BAZI_PRODUCTION_ACCEPTANCE_STATEMENT_INVALID'
    );
  }

  if (APPROVAL.productionFrozen !== true) {
    throw Error(
      'BAZI_PRODUCTION_FREEZE_NOT_ACCEPTED'
    );
  }

  if (
    stableVersions(APPROVAL.versions) !==
    stableVersions(VERSIONS)
  ) {
    throw Error(
      'BAZI_PRODUCTION_VERSION_MISMATCH'
    );
  }

  if (
    MODEL.modelId !== 'gpt-5.6-sol' ||
    MODEL.pricingVerified !== true ||
    MODEL.constraintsVerified !== true
  ) {
    throw Error(
      'BAZI_PRODUCTION_MODEL_NOT_VERIFIED'
    );
  }

  const economics = reportEconomics('BZR');

  if (
    economics.productId !==
      'COM-REPORT-BAZI-FULL' ||
    economics.amountMinor !== 5900 ||
    economics.providerCapUsd !== 4 ||
    economics.includedFollowups !== 4
  ) {
    throw Error(
      'BAZI_PRODUCTION_ECONOMICS_MISMATCH'
    );
  }

  if (
    reportGenerationCeiling('BZR') !== 3.6 ||
    reportFollowupReserve('BZR') !== 0.4
  ) {
    throw Error(
      'BAZI_PRODUCTION_BUDGET_PARTITION_MISMATCH'
    );
  }

  return Object.freeze({
    model: MODEL,
    policy: POLICY,
    approval: APPROVAL,
    admission: ADMISSION
  });
}
