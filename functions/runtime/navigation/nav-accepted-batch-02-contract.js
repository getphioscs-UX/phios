// Bounded server contract derived only from Owner Human ACCEPT; private full text remains excluded from Pages.
export const NAV_BATCH_02_CONTRACT = Object.freeze([
  {
    "moduleId": "NAV-06",
    "sourceSHA256": "73c5635207857027ff8bdb1166cf8cb8591fc3808f13dc92216bc9c413a0fa54",
    "titleZh": "可逆性",
    "titleEn": "Reversibility",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "remainingChoiceSpace",
      "timeBoundedDecisionSpace",
      "inactionPath",
      "candidateActionOrActionClass",
      "knownExitConditions",
      "knownRecoveryConditions"
    ],
    "revisionTriggers": [
      "newContractSigned",
      "newCapitalCommitted",
      "newDependant",
      "newDebt",
      "newConsent",
      "newLegalCondition",
      "newExitOption",
      "newProfessionalInput",
      "newRecoveryResource",
      "timePassed",
      "pilotExpanded",
      "relationshipCommitmentDeepened"
    ],
    "failClosedConditions": [
      "criticalExitTermsUnknown",
      "irreversibleImpactUnverified",
      "recoveryCapacityFabricated",
      "symbolicReadingUsedAsRecoveryAuthority",
      "legalReversibilityAssumed",
      "financialReversibilityStale",
      "affectedPartiesIgnored",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "DECISION_THRESHOLD",
      "ACTION_SCALE",
      "OPTION_WEIGHT",
      "OPTION_ELIGIBILITY",
      "WAIT_ACT_BALANCE",
      "ESCALATION_REQUIREMENT"
    ],
    "version": "NAV-HUMAN-BATCH-02-v1"
  },
  {
    "moduleId": "NAV-07",
    "sourceSHA256": "a8350d328859c6469f00044ed05108cd4b9021a5a60c7127277acc7b84bde62f",
    "titleZh": "时间尺度",
    "titleEn": "Time Horizon",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "remainingChoiceSpace",
      "timeAssessment",
      "reversibilityProfile",
      "candidateOptions",
      "userRelevantHorizon"
    ],
    "revisionTriggers": [
      "newDependant",
      "newDebt",
      "newCareerStage",
      "retirementHorizonChanged",
      "familyLifecycleChanged",
      "locationChanged",
      "majorHealthCapacityChange",
      "newFinancialGoal",
      "newProfessionalInput",
      "newLongTermCommitment",
      "userChangesPriority",
      "majorExternalChange"
    ],
    "failClosedConditions": [
      "criticalHorizonUndefined",
      "futureAssumptionPresentedAsFact",
      "longTermProjectionUnsupported",
      "currentSurvivalConstraintIgnored",
      "reversibilityProfileMissingForLongLockIn",
      "userPrioritySilentlyInferred",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "OPTION_WEIGHT",
      "OPTION_ELIGIBILITY",
      "ACTION_SCALE",
      "WAIT_ACT_BALANCE",
      "DECISION_THRESHOLD",
      "VALUE_PRESERVATION"
    ],
    "version": "NAV-HUMAN-BATCH-02-v1"
  },
  {
    "moduleId": "NAV-08",
    "sourceSHA256": "676851740714c5836239cbd7e74f678532dea85905c72d6c92045f9ad6a13c4a",
    "titleZh": "导航权威边界",
    "titleEn": "Navigation Authority",
    "requiredInputs": [
      "confirmedDecisionObject",
      "currentPosition",
      "remainingChoiceSpace",
      "timeAssessment",
      "inactionAssessment",
      "reversibilityProfile",
      "timeHorizonMap",
      "decisionOwner",
      "affectedParties",
      "decisionDomain",
      "decisionOwner"
    ],
    "revisionTriggers": [
      "newAffectedParty",
      "newConsentRequirement",
      "decisionOwnerChanged",
      "professionalDomainEntered",
      "legalStatusChanged",
      "relationshipScopeChanged",
      "minorOrDependentInvolved",
      "institutionalAuthorityChanged",
      "newProfessionalInput",
      "dataSharingScopeChanged"
    ],
    "failClosedConditions": [
      "decisionOwnerUnknown",
      "affectedPartyIgnored",
      "consentRequiredButMissing",
      "professionalRequirementIgnored",
      "institutionalAuthorityUnverified",
      "methodReadingUsedAsDecisionAuthority",
      "AIRecommendationPresentedAsFinalDecision",
      "thirdPartyHiddenStateClaimed"
    ],
    "decisionEffects": [
      "ESCALATION_REQUIREMENT",
      "CONSENT_REQUIREMENT",
      "DECISION_OWNER",
      "SHARED_DECISION_SCOPE",
      "PROFESSIONAL_HANDOFF",
      "ACTION_PERMISSION_BOUNDARY"
    ],
    "version": "NAV-HUMAN-BATCH-02-v1"
  },
  {
    "moduleId": "NAV-09",
    "sourceSHA256": "467f62cecf38fc6cee28ba8caa524eac8091ef54f4d0a58289add8165fde39d5",
    "titleZh": "变化阈值",
    "titleEn": "Change Threshold",
    "requiredInputs": [
      "currentPosition",
      "previousDecisionBasis",
      "observedChange",
      "changeTimeBoundary",
      "changeSource"
    ],
    "revisionTriggers": [
      "newObservedChange",
      "changePersists",
      "changeSpreads",
      "changeReverses",
      "newEvidence",
      "userCorrectsChange",
      "financialStateUpdates",
      "professionalInput",
      "externalConditionUpdates"
    ],
    "failClosedConditions": [
      "changeSourceUnknown",
      "criticalChangeUnverified",
      "historicalChangePresentedAsCurrent",
      "symbolicReadingUsedAsChangeEvidence",
      "decisionBasisUnknown",
      "changeSignificanceFabricated",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "DECISION_REOPEN",
      "OPTION_REASSESSMENT",
      "OPTION_WEIGHT",
      "WAIT_ACT_BALANCE",
      "ESCALATION_REQUIREMENT"
    ],
    "version": "NAV-HUMAN-BATCH-02-v1"
  },
  {
    "moduleId": "NAV-10",
    "sourceSHA256": "ffd0101f699f985bf96786b68eb23db3da86b11a65b1cf889c5c279c0bd237cf",
    "titleZh": "回应等级",
    "titleEn": "Response Level",
    "requiredInputs": [
      "decisionRelevantChangeState",
      "currentPosition",
      "remainingChoiceSpace",
      "timeAssessment",
      "inactionAssessment",
      "reversibilityProfile",
      "authorityMap",
      "RESPONSE_LEVEL_UNCERTAIN"
    ],
    "revisionTriggers": [
      "problemPersists",
      "problemImproves",
      "problemSpreads",
      "localAdjustmentFails",
      "newRiskAppears",
      "newProfessionalInput",
      "newResourceAppears",
      "timeWindowChanges",
      "userChangesResponsePreference",
      "newOutcome"
    ],
    "failClosedConditions": [
      "changeSignificanceUnknown",
      "responseLevelBasedOnSymbolicReading",
      "criticalImpactUnverified",
      "professionalEscalationIgnored",
      "currentPositionStale",
      "priorResponseHistoryFabricated",
      "decisionObjectChanged"
    ],
    "decisionEffects": [
      "ACTION_SCALE",
      "WAIT_ACT_BALANCE",
      "ESCALATION_REQUIREMENT",
      "OPTION_PREPARATION",
      "STRUCTURAL_CHANGE_ADMISSION"
    ],
    "version": "NAV-HUMAN-BATCH-02-v1"
  }
]);
