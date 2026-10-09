import {freezeNavContract} from './nav-contract-freeze.js';
// Bounded server contract derived only from Owner Human ACCEPT; private full text remains excluded from Pages.
export const NAV_BATCH_04_CONTRACT = freezeNavContract([
  {
    "moduleId": "NAV-16",
    "sourceSHA256": "69242220283e6d0bf03b4042e80241c990e97c4a9117b048992c57d7024ab3ae",
    "titleZh": "边际收益递减",
    "titleEn": "Diminishing Return",
    "requiredInputs": [
      "currentPath",
      "currentOutcomeState",
      "maintenanceCostState",
      "capacityQualificationState",
      "additionalInputHistory",
      "observedOutcomeChange",
      "timeBoundary"
    ],
    "additionalContextInputs": [
      "currentPath",
      "currentOutcomeState",
      "maintenanceCostState",
      "capacityQualificationState",
      "additionalInputHistory",
      "observedOutcomeChange",
      "timeBoundary",
      "priorInput",
      "priorOutcome",
      "currentInput",
      "currentOutcome"
    ],
    "revisionTriggers": [
      "newInputAdded",
      "inputScaleChanged",
      "newOutcomeObserved",
      "delayedOutcomeAppears",
      "capacityChanged",
      "maintenanceCostChanged",
      "externalConditionChanged",
      "newProfessionalInput",
      "alternativeUseAppears",
      "measurementMethodChanged"
    ],
    "failClosedConditions": [
      "inputBaselineMissing",
      "outcomeBaselineMissing",
      "returnTrendFabricated",
      "lagIgnored",
      "preservationValueIgnored",
      "attributionPresentedAsCertainWithoutEvidence",
      "symbolicReadingUsedAsReturnAuthority",
      "costDoubleCounted",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_WEIGHT",
      "ADDITIONAL_INPUT_ELIGIBILITY",
      "ACTION_SCALE",
      "WAIT_ACT_BALANCE",
      "STRUCTURAL_CHANGE_ADMISSION",
      "RESOURCE_REALLOCATION"
    ],
    "version": "NAV-HUMAN-BATCH-04-v1"
  },
  {
    "moduleId": "NAV-17",
    "sourceSHA256": "fea15f19862301d70b5883065842644bc7e32efabdaaf31d84d881e4731a1c0a",
    "titleZh": "结构性替代",
    "titleEn": "Structural Alternative",
    "requiredInputs": [
      "currentStructure",
      "currentDecisionObject",
      "currentPosition",
      "currentResponseLevel",
      "localAdjustmentHistory",
      "continuationQualificationState",
      "maintenanceCostState",
      "capacityQualificationState",
      "marginalReturnState"
    ],
    "additionalContextInputs": [
      "currentStructure",
      "currentDecisionObject",
      "currentPosition",
      "currentResponseLevel",
      "localAdjustmentHistory",
      "continuationQualificationState",
      "maintenanceCostState",
      "capacityQualificationState",
      "marginalReturnState"
    ],
    "revisionTriggers": [
      "localAdjustmentSucceeds",
      "localAdjustmentFails",
      "newAlternativeAppears",
      "capacityChanges",
      "maintenanceCostChanges",
      "returnPatternChanges",
      "contractChanges",
      "authorityChanges",
      "financialRunwayChanges",
      "affectedPartyChanges",
      "professionalInput"
    ],
    "failClosedConditions": [
      "currentStructureUndefined",
      "parameterAndStructureConflated",
      "localAdjustmentHistoryFabricated",
      "alternativeInventedWithoutFeasibilityBasis",
      "symbolicReadingUsedAsStructuralAuthority",
      "transitionCostIgnored",
      "affectedPartyIgnored",
      "capacityStateMissing",
      "marginalReturnStateMissing",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_SPACE_EXPANSION",
      "STRUCTURAL_ALTERNATIVE_ADMISSION",
      "OPTION_COMPARISON_REQUIREMENT",
      "ACTION_SCALE",
      "DECISION_THRESHOLD"
    ],
    "version": "NAV-HUMAN-BATCH-04-v1"
  },
  {
    "moduleId": "NAV-18",
    "sourceSHA256": "841c46067f3340bb6b6327f38b3d8cc1aa899cc180565bc1e1552b85066de066",
    "titleZh": "等待成本",
    "titleEn": "Waiting Cost",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "timeAssessment",
      "inactionAssessment",
      "remainingChoiceSpace",
      "currentDefaultPath",
      "knownWaitingBenefits",
      "knownWaitingCosts",
      "knownTimeSensitiveOptions"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "timeAssessment",
      "inactionAssessment",
      "remainingChoiceSpace",
      "currentDefaultPath",
      "knownWaitingBenefits",
      "knownWaitingCosts",
      "knownTimeSensitiveOptions"
    ],
    "revisionTriggers": [
      "reviewDateReached",
      "deadlineChanged",
      "newInformationArrived",
      "expectedInformationDelayed",
      "financialRunwayChanged",
      "optionClosed",
      "newOptionOpened",
      "capacityImproved",
      "capacityDeclined",
      "structuralAlternativeAppeared",
      "userChangesWaitBoundary",
      "professionalInput"
    ],
    "failClosedConditions": [
      "waitingPurposeUnknown",
      "waitingCostFabricated",
      "deadlineInvented",
      "opportunityLossPresentedAsCertainWithoutEvidence",
      "symbolicTimingUsedAsUrgencyAuthority",
      "expectedInformationUndefined",
      "reviewBoundaryMissingForMaterialDelay",
      "currentPositionStale",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "WAIT_ACT_BALANCE",
      "OPTION_WEIGHT",
      "ACTION_TIMING",
      "REVIEW_TRIGGER",
      "ACTION_SCALE",
      "STRUCTURAL_ALTERNATIVE_PRIORITY"
    ],
    "version": "NAV-HUMAN-BATCH-04-v1"
  },
  {
    "moduleId": "NAV-19",
    "sourceSHA256": "16e38fd0242c2e8b31ad4e2d2f86949becc12ee2925dba7609f759bbd679bece",
    "titleZh": "价值保留",
    "titleEn": "Value Preservation",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "currentDirectionState",
      "structuralAlternativeState",
      "currentValueProduced",
      "knownResponsibilities",
      "knownCriticalConditions"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "currentDirectionState",
      "structuralAlternativeState",
      "currentValueProduced",
      "knownResponsibilities",
      "knownCriticalConditions",
      "maintenanceCostState",
      "timeHorizonMap",
      "reversibilityProfile",
      "crossDomainPropagationMap"
    ],
    "revisionTriggers": [
      "userValueChanged",
      "responsibilityChanged",
      "dependantChanged",
      "financialMinimumChanged",
      "relationshipStateChanged",
      "alternativeDesignChanged",
      "carrierChanged",
      "currentBenefitDisappeared",
      "newBenefitAppeared",
      "professionalInput",
      "timeHorizonChanged"
    ],
    "failClosedConditions": [
      "criticalValueUnknown",
      "mustPreserveInferredWithoutAuthority",
      "currentCarrierConflatedWithValue",
      "responsibilityRequirementIgnored",
      "materialMinimumIgnored",
      "profileUsedAsFinalValueAuthority",
      "symbolicReadingUsedAsValueAuthority",
      "currentBenefitFabricated",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "OPTION_WEIGHT",
      "STRUCTURAL_ALTERNATIVE_DESIGN",
      "TRANSITION_REQUIREMENT",
      "ACTION_SCALE",
      "DECISION_THRESHOLD"
    ],
    "version": "NAV-HUMAN-BATCH-04-v1"
  },
  {
    "moduleId": "NAV-20",
    "sourceSHA256": "b48e054f1ec2dab35accb06f4d20cca60e768f2285ace26e0b54ecec9491b1fb",
    "titleZh": "目标与价值",
    "titleEn": "Goal vs Value",
    "requiredInputs": [
      "confirmedDecisionObject",
      "userStatedGoal",
      "preservationRequirements",
      "currentPosition"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "userStatedGoal",
      "preservationRequirements",
      "currentPosition",
      "structuralAlternatives",
      "timeHorizonMap",
      "currentRealityProjection",
      "knownResponsibilities"
    ],
    "revisionTriggers": [
      "goalChanged",
      "goalAchieved",
      "goalFailed",
      "userValueChanged",
      "currentRealityChanged",
      "newResponsibility",
      "carrierChanged",
      "newOptionAppeared",
      "goalNoLongerProducesExpectedValue",
      "timeHorizonChanged"
    ],
    "failClosedConditions": [
      "goalUnknown",
      "valueAssertedWithoutHumanAuthority",
      "goalAndValueConflated",
      "responsibilityMisclassifiedAsPreference",
      "materialRequirementMisclassifiedAsValue",
      "profileUsedAsFinalValueAuthority",
      "symbolicReadingUsedAsHiddenValueAuthority",
      "goalValueConflictSuppressed",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_WEIGHT",
      "GOAL_REDESIGN",
      "OPTION_DESIGN",
      "VALUE_PRESERVATION",
      "STRUCTURAL_ALTERNATIVE_COMPARISON",
      "DECISION_THRESHOLD"
    ],
    "version": "NAV-HUMAN-BATCH-04-v1"
  }
]);
