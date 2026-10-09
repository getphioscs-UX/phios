// Bounded server contract derived only from Owner Human ACCEPT; private full text remains excluded from Pages.
export const NAV_BATCH_01_CONTRACT = Object.freeze([
  {
    "moduleId": "NAV-01",
    "sourceSHA256": "710077b59a6a1bc57f378d02ee6993c2a92eef4eb1ae9d34cdb730e18ace0250",
    "titleZh": "决策对象",
    "titleEn": "Decision Object",
    "requiredInputs": [
      "userQuestion",
      "userStatedConcern",
      "userStatedGoalOrDesiredChange"
    ],
    "revisionTriggers": [
      "userGoalChanged",
      "newConstraintAppeared",
      "newResponsibilityAppeared",
      "newEvidenceChangesProblemScope",
      "currentSituationMateriallyChanged",
      "professionalInputReframesIssue",
      "userRejectsPriorDecisionObject",
      "multipleDecisionObjectsDetected",
      "timeWindowChanged"
    ],
    "failClosedConditions": [
      "questionTooBroad",
      "multipleUnresolvedDecisionObjects",
      "userIntentContradictory",
      "decisionOwnerUnknown",
      "thirdPartyDecisionMisrepresentedAsUserDecision",
      "highImpactQuestionWithoutClearScope"
    ],
    "decisionEffects": [
      "DECISION_SCOPE_FORMATION"
    ],
    "version": "NAV-HUMAN-BATCH-01-v1"
  },
  {
    "moduleId": "NAV-02",
    "sourceSHA256": "207406579172ffd001d375f630ea12fc6d8428bfadd5541fc8a3ea0ef3852f5d",
    "titleZh": "当前位置",
    "titleEn": "Current Position",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentTimeBoundary",
      "knownMaterialConditions",
      "knownResponsibilities",
      "knownConstraints",
      "knownAvailableResources"
    ],
    "revisionTriggers": [
      "incomeChanged",
      "liquidityChanged",
      "debtChanged",
      "newDependant",
      "relationshipResponsibilityChanged",
      "healthCapacityChanged",
      "jobStatusChanged",
      "locationChanged",
      "legalOrInstitutionalConditionChanged",
      "newProfessionalInput",
      "newExternalEvidence",
      "majorTimeWindowChange",
      "newOutcome",
      "userCorrectsExistingPosition",
      "sourceExpired"
    ],
    "failClosedConditions": [
      "decisionObjectNotConfirmed",
      "currentPositionHasCriticalConflict",
      "criticalMaterialInputsMissing",
      "majorSourceStaleness",
      "identityOrPersonMismatch",
      "financialObjectBelongsToDifferentPerson",
      "relationshipParticipantScopeAmbiguous",
      "professionalInputOwnershipUnclear"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "OPTION_WEIGHT",
      "DECISION_THRESHOLD",
      "ACTION_SCALE",
      "WAIT_ACT_BALANCE",
      "ESCALATION_REQUIREMENT"
    ],
    "version": "NAV-HUMAN-BATCH-01-v1"
  },
  {
    "moduleId": "NAV-03",
    "sourceSHA256": "5120ec346fc8fbbb26053b6a349219689aedda2e9a73aff6a4ce7a6554ed68ea",
    "titleZh": "已关闭与仍开放的条件",
    "titleEn": "Closed vs Open Conditions",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "currentTimeBoundary",
      "knownExistingCommitments",
      "knownIrreversibleEvents",
      "knownChangeableConditions",
      "knownUnknowns"
    ],
    "revisionTriggers": [
      "newResourceAppeared",
      "newPermissionGranted",
      "contractChanged",
      "legalConditionChanged",
      "financialCapacityChanged",
      "newProfessionalAdvice",
      "relationshipConsentChanged",
      "locationChanged",
      "institutionalRuleChanged",
      "newTechnologyOrCapability",
      "timeWindowChanged",
      "newEvidence",
      "userCorrectsCondition"
    ],
    "failClosedConditions": [
      "criticalConditionStateUnknown",
      "legalConstraintUnverified",
      "materialOptionMisclassified",
      "currentPositionStale",
      "closedConditionTreatedAsOption",
      "theoreticalPossibilityTreatedAsAvailable",
      "personOrAssetOwnershipMismatch"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "OPTION_SPACE_BOUNDARY",
      "WAIT_ACT_BALANCE",
      "ACTION_SCALE",
      "ESCALATION_REQUIREMENT"
    ],
    "version": "NAV-HUMAN-BATCH-01-v1"
  },
  {
    "moduleId": "NAV-04",
    "sourceSHA256": "640fbdc7df282f56c54bc4027bb1c9adf5694434bc0b2f77abb5c9aa2760422c",
    "titleZh": "时间",
    "titleEn": "Time",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "remainingChoiceSpace",
      "currentDateOrDecisionTime",
      "knownDeadlines",
      "knownTimeWindows",
      "knownTimeDependentConditions"
    ],
    "revisionTriggers": [
      "deadlineChanged",
      "windowExtended",
      "windowClosed",
      "newEvidenceDate",
      "financialRunwayChanged",
      "newOffer",
      "newContractTerm",
      "newProfessionalInput",
      "familyTimingChanged",
      "locationTimingChanged",
      "healthTimingChanged",
      "majorExternalEvent",
      "userChangesPreferredTiming"
    ],
    "failClosedConditions": [
      "criticalDeadlineUnknown",
      "deadlineSourceConflict",
      "staleTimeInput",
      "windowAssumedFromInterpretiveReading",
      "currentPositionChangedSinceTimeAssessment",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "OPTION_WEIGHT",
      "WAIT_ACT_BALANCE",
      "ACTION_SCALE",
      "DECISION_THRESHOLD",
      "ESCALATION_REQUIREMENT"
    ],
    "version": "NAV-HUMAN-BATCH-01-v1"
  },
  {
    "moduleId": "NAV-05",
    "sourceSHA256": "8eca73140b7ec6dfe50e598e26edc452b6938a95a84706ea2b614f729e578145",
    "titleZh": "不行动",
    "titleEn": "Inaction",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "remainingChoiceSpace",
      "timeBoundedDecisionSpace",
      "currentDefaultPath",
      "knownContinuationConditions"
    ],
    "revisionTriggers": [
      "newCostAppears",
      "newOpportunityAppears",
      "windowCloses",
      "currentStateImproves",
      "currentStateWorsens",
      "newMonitoringEvidence",
      "newFinancialData",
      "newProfessionalInput",
      "userChangesDefaultPath",
      "reviewDateReached"
    ],
    "failClosedConditions": [
      "defaultPathUnknown",
      "inactionConsequencesFabricated",
      "criticalContinuationCostUnknown",
      "monitoringPresentedAsVerifiedOutcome",
      "symbolicReadingUsedAsRiskAuthority",
      "timeAssessmentStale",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_WEIGHT",
      "WAIT_ACT_BALANCE",
      "ACTION_SCALE",
      "DECISION_THRESHOLD"
    ],
    "version": "NAV-HUMAN-BATCH-01-v1"
  }
]);
