import {freezeNavContract} from './nav-contract-freeze.js';
// Bounded server contract derived only from Owner Human ACCEPT; private full text remains excluded from Pages.
export const NAV_BATCH_05_CONTRACT = freezeNavContract([
  {
    "moduleId": "NAV-21",
    "sourceSHA256": "a71f6bf941ab1437a50c62b301b3c187212e29f447d9ff9a4a35a56aee0dec93",
    "titleZh": "不可交换条件",
    "titleEn": "Non-Exchangeable Condition",
    "requiredInputs": [
      "confirmedDecisionObject",
      "goalValueAlignmentMap",
      "preservationRequirements",
      "decisionOwner",
      "affectedParties",
      "materialRequirements",
      "responsibilityRequirements"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "goalValueAlignmentMap",
      "preservationRequirements",
      "decisionOwner",
      "affectedParties",
      "materialRequirements",
      "responsibilityRequirements"
    ],
    "revisionTriggers": [
      "userChangesNonNegotiable",
      "responsibilityChanges",
      "dependantChanges",
      "legalRequirementChanges",
      "consentChanges",
      "materialMinimumChanges",
      "professionalInputChanges",
      "optionRedesigned",
      "timeHorizonChanges",
      "currentRealityChanges"
    ],
    "failClosedConditions": [
      "nonExchangeableAssertedWithoutAuthority",
      "criticalConsentIgnored",
      "responsibilityBoundaryIgnored",
      "thresholdInvented",
      "preferenceMisclassifiedAsHardConstraint",
      "symbolicReadingUsedAsNonExchangeableAuthority",
      "affectedPartyIgnored",
      "hardConstraintHiddenInsideWeightedScore",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "OPTION_REJECTION_GATE",
      "PRESERVATION_FLOOR",
      "DECISION_THRESHOLD",
      "CONSENT_REQUIREMENT",
      "ESCALATION_REQUIREMENT"
    ],
    "version": "NAV-HUMAN-BATCH-05-v1"
  },
  {
    "moduleId": "NAV-22",
    "sourceSHA256": "df91babf2fc0bca6c25fdd8dffbe72b91c029833b7b8f4695281813f0d6a2500",
    "titleZh": "最低可接受状态",
    "titleEn": "Minimum Acceptable State",
    "requiredInputs": [
      "confirmedDecisionObject",
      "preservationRequirements",
      "nonExchangeableConditions",
      "materialRequirements",
      "responsibilityRequirements",
      "candidateOptionOrDirection",
      "currentPosition"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "preservationRequirements",
      "nonExchangeableConditions",
      "materialRequirements",
      "responsibilityRequirements",
      "candidateOptionOrDirection",
      "currentPosition"
    ],
    "revisionTriggers": [
      "essentialCostChanged",
      "dependantChanged",
      "housingChanged",
      "liquidityChanged",
      "careResponsibilityChanged",
      "legalRequirementChanged",
      "consentChanged",
      "recoveryResourceChanged",
      "userToleranceChanged",
      "optionRedesigned",
      "timeHorizonChanged",
      "professionalInput"
    ],
    "failClosedConditions": [
      "criticalMinimumUnknown",
      "hardMinimumAssertedWithoutAuthority",
      "thresholdInvented",
      "temporaryMinimumWithoutDuration",
      "recoveryMinimumIgnored",
      "sharedDecisionMinimumSetWithoutAuthority",
      "symbolicReadingUsedAsMinimumAuthority",
      "minimumAndIdealConflated",
      "currentRealityStale",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "DOWNSIDE_ACCEPTABILITY",
      "SCENARIO_FILTER",
      "EXIT_REQUIREMENT",
      "RECOVERY_REQUIREMENT",
      "DECISION_THRESHOLD",
      "ACTION_SCALE"
    ],
    "version": "NAV-HUMAN-BATCH-05-v1"
  },
  {
    "moduleId": "NAV-23",
    "sourceSHA256": "bb43761a2d4fca120eee637d72959c9b653241c50f002e83c47bb1cdb55f0c40",
    "titleZh": "情景空间",
    "titleEn": "Scenario Space",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "remainingChoiceSpace",
      "timeHorizonMap",
      "minimumAcceptableState",
      "candidateOptions",
      "materialUnknowns"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "remainingChoiceSpace",
      "timeHorizonMap",
      "minimumAcceptableState",
      "candidateOptions",
      "materialUnknowns",
      "reversibilityProfile",
      "capacityQualification",
      "waitingQualification",
      "valuePreservationRequirements"
    ],
    "revisionTriggers": [
      "newEvidenceArrives",
      "assumptionInvalidated",
      "currentPositionChanges",
      "minimumStateChanges",
      "newOptionAppears",
      "optionRemoved",
      "timeWindowChanges",
      "externalConditionChanges",
      "professionalInput",
      "userRejectsScenario",
      "scenarioVariableChanges"
    ],
    "failClosedConditions": [
      "scenarioPresentedAsForecast",
      "probabilityInvented",
      "criticalScenarioAssumptionHidden",
      "minimumStateNotApplied",
      "continuationScenarioMissing",
      "waitingScenarioIgnoredWhenRelevant",
      "symbolicReadingUsedAsScenarioProbability",
      "unsupportedUpsideStacking",
      "catastrophicFantasyUsedAsStressScenario",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ROBUSTNESS",
      "OPTION_WEIGHT",
      "DECISION_THRESHOLD",
      "RECOVERY_REQUIREMENT",
      "EXIT_ROUTE_REQUIREMENT",
      "INFORMATION_VALUE"
    ],
    "version": "NAV-HUMAN-BATCH-05-v1"
  },
  {
    "moduleId": "NAV-24",
    "sourceSHA256": "d69d5f49efbd0256b3962a6dde12599803bf8ddf52fd2dfe59e3369ce0e09816",
    "titleZh": "基线、上行与下行情景",
    "titleEn": "Baseline / Upside / Downside",
    "requiredInputs": [
      "scenarioSpace",
      "candidateOptions",
      "decisionSensitiveVariables",
      "minimumAcceptableState",
      "currentPosition",
      "timeHorizonMap"
    ],
    "additionalContextInputs": [
      "scenarioSpace",
      "candidateOptions",
      "decisionSensitiveVariables",
      "minimumAcceptableState",
      "currentPosition",
      "timeHorizonMap"
    ],
    "revisionTriggers": [
      "baselineConditionChanged",
      "decisionSensitiveVariableChanged",
      "newEvidenceArrived",
      "minimumStateChanged",
      "optionRedesigned",
      "timeWindowChanged",
      "professionalInputChanged",
      "externalConditionChanged",
      "scenarioAssumptionInvalidated"
    ],
    "failClosedConditions": [
      "baselinePresentedAsForecast",
      "baselineUnsupported",
      "upsideStackedWithoutEvidence",
      "downsideCatastrophized",
      "scenarioVariablesAsymmetric",
      "minimumStateNotApplied",
      "currentPathExcludedFromFairComparison",
      "waitingPathExcludedWhenRelevant",
      "probabilityInvented",
      "symbolicReadingUsedAsScenarioLikelihood",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ROBUSTNESS",
      "DOWNSIDE_ACCEPTABILITY",
      "UPSIDE_DEPENDENCE",
      "DECISION_THRESHOLD",
      "EXIT_REQUIREMENT",
      "RECOVERY_REQUIREMENT",
      "INFORMATION_VALUE"
    ],
    "version": "NAV-HUMAN-BATCH-05-v1"
  },
  {
    "moduleId": "NAV-25",
    "sourceSHA256": "1b5abb4415eeb01bd8dec1d62215e6d7634534cb04f0ab40f513078ffb0a8409",
    "titleZh": "退出与恢复路径",
    "titleEn": "Exit / Recovery Route",
    "requiredInputs": [
      "candidateOption",
      "baselineUpsideDownsideSet",
      "minimumAcceptableState",
      "reversibilityProfile",
      "currentPosition",
      "capacityQualificationState"
    ],
    "additionalContextInputs": [
      "candidateOption",
      "baselineUpsideDownsideSet",
      "minimumAcceptableState",
      "reversibilityProfile",
      "currentPosition",
      "capacityQualificationState"
    ],
    "revisionTriggers": [
      "exitCostChanged",
      "contractChanged",
      "minimumStateChanged",
      "liquidityChanged",
      "recoveryResourceChanged",
      "newProfessionalInput",
      "newLegalConstraint",
      "newSupportAppeared",
      "optionScaleChanged",
      "downsideScenarioChanged",
      "triggerReached"
    ],
    "failClosedConditions": [
      "criticalExitTriggerUnknown",
      "exitRouteInvented",
      "recoveryCapacityFabricated",
      "minimumStateNotConnected",
      "contractOrLegalExitAssumed",
      "thirdPartySupportAssumedWithoutConsent",
      "symbolicReadingUsedAsExitAuthority",
      "scenarioTreatedAsActualTrigger",
      "recoveryDependencyHidden",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "DECISION_THRESHOLD",
      "ACTION_SCALE",
      "CONTINGENCY_REQUIREMENT",
      "RECOVERY_READINESS",
      "EXIT_READINESS"
    ],
    "version": "NAV-HUMAN-BATCH-05-v1"
  }
]);
