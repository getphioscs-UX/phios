// Bounded server contract derived only from Owner Human ACCEPT; private full text remains excluded from Pages.
export const NAV_BATCH_03_CONTRACT = Object.freeze([
  {
    "moduleId": "NAV-11",
    "sourceSHA256": "69b011bcbc56c136d37331d16e0c5ac5007eb18e2ce8cbe0831d28ecc9d729c8",
    "titleZh": "继续资格",
    "titleEn": "Continuation Qualification",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "decisionRelevantChangeState",
      "currentDefaultPath",
      "currentOutcomeState",
      "currentResponseLevel"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "decisionRelevantChangeState",
      "currentDefaultPath",
      "currentOutcomeState",
      "currentResponseLevel",
      "whyCurrentPathWasOriginallyChosen",
      "whatValueItWasSupposedToProduce",
      "whatConditionsOriginallySupportedIt"
    ],
    "revisionTriggers": [
      "costChanged",
      "capacityChanged",
      "valueProducedChanged",
      "responsibilityChanged",
      "futureOptionsChanged",
      "newOutcome",
      "newProfessionalInput",
      "newExternalCondition",
      "userChangesGoal",
      "responseLevelChanged"
    ],
    "failClosedConditions": [
      "currentPathUnknown",
      "intendedValueUnknown",
      "currentFunctionAssumedWithoutEvidence",
      "hiddenCostIgnored",
      "symbolicReadingUsedAsContinuationAuthority",
      "decisionRelevantChangeMissing",
      "currentPositionStale",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_WEIGHT",
      "DEFAULT_PATH_PRIORITY",
      "WAIT_ACT_BALANCE",
      "REASSESSMENT_REQUIREMENT",
      "STRUCTURAL_CHANGE_ADMISSION"
    ],
    "version": "NAV-HUMAN-BATCH-03-v1"
  },
  {
    "moduleId": "NAV-12",
    "sourceSHA256": "c6e8823504b4f5c9d5203e48fbd8d6414ce55ca672181319fbaa0490cff77a7b",
    "titleZh": "维持成本",
    "titleEn": "Maintenance Cost",
    "requiredInputs": [
      "currentPath",
      "currentOutcomeState",
      "continuationQualificationState",
      "currentMaintenanceInputs",
      "knownMaintenanceCosts",
      "knownCostBearer",
      "knownTimeBoundary"
    ],
    "additionalContextInputs": [
      "currentPath",
      "currentOutcomeState",
      "continuationQualificationState",
      "currentMaintenanceInputs",
      "knownMaintenanceCosts",
      "knownCostBearer",
      "knownTimeBoundary",
      "priorMaintenanceBaseline"
    ],
    "revisionTriggers": [
      "costChanged",
      "resourceUseChanged",
      "timeUseChanged",
      "capacityChanged",
      "hiddenSubsidyAppeared",
      "hiddenSubsidyEnded",
      "newCostBearer",
      "futureOptionLossChanged",
      "financialProjectionUpdated",
      "professionalInput",
      "userChangesValuePriority"
    ],
    "failClosedConditions": [
      "maintenanceCostFabricated",
      "costIncreaseClaimWithoutBaseline",
      "costBearerIgnored",
      "hiddenSubsidyKnownButOmitted",
      "symbolicReadingUsedAsMaterialCost",
      "financialDataStale",
      "currentPathUnknown",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_WEIGHT",
      "DEFAULT_PATH_PRIORITY",
      "WAIT_ACT_BALANCE",
      "ACTION_SCALE",
      "STRUCTURAL_CHANGE_ADMISSION"
    ],
    "version": "NAV-HUMAN-BATCH-03-v1"
  },
  {
    "moduleId": "NAV-13",
    "sourceSHA256": "9dd0da995fe33971c3944555b13ee57ec70c09dce8c18ecf5a6396a8305f43ee",
    "titleZh": "默认方向失效",
    "titleEn": "Default Direction Loss",
    "requiredInputs": [
      "currentDefaultDirection",
      "originalDirectionBasis",
      "currentPosition",
      "decisionRelevantChangeState",
      "continuationQualificationState",
      "maintenanceCostState"
    ],
    "additionalContextInputs": [
      "currentDefaultDirection",
      "originalDirectionBasis",
      "currentPosition",
      "decisionRelevantChangeState",
      "continuationQualificationState",
      "maintenanceCostState",
      "currentValueProduced",
      "currentConstraints",
      "currentCapacity",
      "futureOptionEffects"
    ],
    "revisionTriggers": [
      "originalBasisChanged",
      "currentValueChanged",
      "maintenanceCostChanged",
      "capacityChanged",
      "newAlternativeAppeared",
      "futureOptionSpaceChanged",
      "responsibilityChanged",
      "timeHorizonChanged",
      "newProfessionalInput",
      "userRechoosesCurrentDirection"
    ],
    "failClosedConditions": [
      "currentDirectionUnknown",
      "originalBasisFabricated",
      "maintenanceCostStateMissing",
      "continuationQualificationMissing",
      "symbolicReadingUsedAsDefaultAuthority",
      "alternativeExistenceInvented",
      "currentRealityStale",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "DEFAULT_PATH_PRIORITY",
      "OPTION_COMPARISON_REQUIREMENT",
      "STRUCTURAL_ALTERNATIVE_ADMISSION",
      "WAIT_ACT_BALANCE"
    ],
    "version": "NAV-HUMAN-BATCH-03-v1"
  },
  {
    "moduleId": "NAV-14",
    "sourceSHA256": "b71542badd1e1741491b9bfcab7d0877d7dc758055c879f985eabcba29576efc",
    "titleZh": "跨领域扩散",
    "titleEn": "Cross-Domain Propagation",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "decisionRelevantChangeState",
      "currentResponseLevel",
      "affectedDomain",
      "observedSecondaryEffects",
      "timeBoundary"
    ],
    "additionalContextInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "decisionRelevantChangeState",
      "currentResponseLevel",
      "affectedDomain",
      "observedSecondaryEffects",
      "timeBoundary"
    ],
    "revisionTriggers": [
      "newDomainAffected",
      "secondaryEffectAppears",
      "secondaryEffectResolves",
      "propagationLoopAppears",
      "propagationInterrupted",
      "newEvidence",
      "userCorrectsRelationship",
      "professionalInput",
      "currentRealityUpdated",
      "decisionObjectChanged"
    ],
    "failClosedConditions": [
      "propagationFabricated",
      "correlationPresentedAsCausation",
      "criticalAffectedDomainIgnored",
      "symbolicReadingUsedAsPropagationEvidence",
      "thirdPartyImpactAssumedWithoutEvidence",
      "doubleCountedCrossDomainCost",
      "currentRealityStale",
      "decisionObjectScopeAmbiguous"
    ],
    "decisionEffects": [
      "PRIORITY_REASSESSMENT",
      "RESPONSE_LEVEL",
      "OPTION_WEIGHT",
      "ACTION_SCALE",
      "ESCALATION_REQUIREMENT",
      "STRUCTURAL_CHANGE_ADMISSION"
    ],
    "version": "NAV-HUMAN-BATCH-03-v1"
  },
  {
    "moduleId": "NAV-15",
    "sourceSHA256": "aecda0f17762b7054ea4a627322125e3e77499f5b3c53b0890abcad83252f860",
    "titleZh": "容量约束",
    "titleEn": "Capacity Constraint",
    "requiredInputs": [
      "candidateOptionOrResponse",
      "currentPosition",
      "maintenanceCostState",
      "crossDomainPropagationState",
      "timeAssessment",
      "reversibilityProfile",
      "knownResponsibilities",
      "knownAvailableResources",
      "requiredCapacity",
      "availableCapacity"
    ],
    "additionalContextInputs": [
      "candidateOptionOrResponse",
      "currentPosition",
      "maintenanceCostState",
      "crossDomainPropagationState",
      "timeAssessment",
      "reversibilityProfile",
      "knownResponsibilities",
      "knownAvailableResources",
      "requiredCapacity",
      "availableCapacity"
    ],
    "revisionTriggers": [
      "incomeChanged",
      "liquidityChanged",
      "workloadChanged",
      "careResponsibilityChanged",
      "newSkillAcquired",
      "newSupportAppeared",
      "recoveryStateChanged",
      "delegationAvailable",
      "institutionalResourceChanged",
      "actionScaleChanged",
      "newProfessionalInput",
      "timeWindowChanged"
    ],
    "failClosedConditions": [
      "requiredCapacityUnknown",
      "availableCapacityFabricated",
      "criticalResponsibilityIgnored",
      "borrowedCapacityAssumedWithoutConsent",
      "profileUsedAsCapacityEvidence",
      "symbolicReadingUsedAsCapacityAuthority",
      "financialCapacityStale",
      "recoveryCapacityInvented",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_ELIGIBILITY",
      "ACTION_SCALE",
      "WAIT_ACT_BALANCE",
      "PREPARATION_REQUIREMENT",
      "DECISION_THRESHOLD",
      "ESCALATION_REQUIREMENT"
    ],
    "version": "NAV-HUMAN-BATCH-03-v1"
  }
]);
