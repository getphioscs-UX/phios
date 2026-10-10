const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

export const SMR_R2_SECTION_RULES=freeze({
  schemaVersion:'PHI-OS-SMR-R2-SECTION-INFORMATION-GAIN-RULES-v1.0.0',
  eligibilityStates:['SECTION_ELIGIBLE','SECTION_NOT_ELIGIBLE'],
  classes:['CORE','CONDITIONAL','TECHNICAL','TEMPORAL','SUPPRESSED'],
  bodyInformationFields:['newClaimRefs','newRelationRefs','newConditionRefs','newCounterEvidenceRefs','newObservationRefs'],
  sections:[
    {sectionId:'OVERVIEW',order:10,sectionClass:'CORE',selector:'FIRST_SCREEN'},
    {sectionId:'CORE_THEMES',order:20,sectionClass:'CORE',selector:'REMAINING_ELIGIBLE_CLAIMS'},
    {sectionId:'SUPPORT_TENSION',order:30,sectionClass:'CORE',selector:'RELATIONAL_CLAIMS'},
    {sectionId:'REALITY_QUESTIONS',order:40,sectionClass:'CORE',selector:'OBSERVATION_REFS'},
    {sectionId:'WORK',order:50,sectionClass:'CONDITIONAL',selector:'WORK_DOMAIN',domains:['WORK_RESOURCES'],excludedSubjectTokens:['RESOURCE','WEALTH','PROPERTY','BIRTH_YEAR_NUMBER']},
    {sectionId:'RELATIONSHIP',order:60,sectionClass:'CONDITIONAL',selector:'DOMAIN',domains:['RELATIONSHIP_EXCHANGE']},
    {sectionId:'RESOURCES',order:70,sectionClass:'CONDITIONAL',selector:'RESOURCE_DOMAIN',domains:['WORK_RESOURCES'],subjectTokens:['RESOURCE','WEALTH','PROPERTY','BIRTH_YEAR_NUMBER']},
    {sectionId:'ENVIRONMENT',order:80,sectionClass:'CONDITIONAL',selector:'DOMAIN',domains:['ENVIRONMENT_DIRECTION','REGULATION_PRESSURE']},
    {sectionId:'TIMING',order:90,sectionClass:'TEMPORAL',selector:'TEMPORAL'},
    {sectionId:'METHOD_DETAIL',order:100,sectionClass:'TECHNICAL',selector:'TECHNICAL_METHOD'},
    {sectionId:'SOURCE_LINEAGE',order:110,sectionClass:'TECHNICAL',selector:'TECHNICAL_SOURCE'},
    {sectionId:'RULE_LINEAGE',order:120,sectionClass:'TECHNICAL',selector:'TECHNICAL_RULE'},
    {sectionId:'CALCULATION_DETAIL',order:130,sectionClass:'TECHNICAL',selector:'TECHNICAL_CALCULATION'}
  ],
  boundary:{
    sectionRequiresNewInformation:true,
    emptyBodySectionSuppressed:true,
    conditionalSectionRequiresMeaningfulEvidence:true,
    timingRequiresExplicitTemporalAuthority:true,
    technicalBodyDefaultSuppressed:true,
    technicalAppendixDefaultCollapsed:true,
    rendererMayCreateEligibility:false
  }
});

export const SMR_R2_CONTRADICTION_RULES=freeze({
  schemaVersion:'PHI-OS-SMR-R2-CONTRADICTION-PRESERVATION-RULES-v1.0.0',
  states:['SUPPORT','TENSION','CONDITIONAL','COUNTERBALANCED','OPEN'],
  claimTypeState:{
    SUPPORT:'SUPPORT',
    TENSION:'TENSION',
    CONDITION:'CONDITIONAL',
    TRADEOFF:'COUNTERBALANCED',
    OPEN:'OPEN',
    TEMPORAL_ACTIVATION:'CONDITIONAL'
  },
  relationTypeState:{
    SUPPORT:'SUPPORT',REINFORCEMENT:'SUPPORT',
    TENSION:'TENSION',FRICTION:'TENSION',
    DEPENDENCY:'CONDITIONAL',OPEN:'OPEN'
  },
  preserveClaimTypes:['TENSION','CONDITION','TRADEOFF','OPEN','TEMPORAL_ACTIVATION'],
  boundary:{
    tensionMayBeDeleted:false,
    conditionMayBeDeleted:false,
    openMayBeDeleted:false,
    counterEvidenceMayBeDeleted:false,
    oneSidedCollapseAllowed:false,
    dedupMaySuppressContradiction:false,
    rendererMayReclassifyContradiction:false
  }
});

export const SMR_R2_NARRATIVE_RULES=freeze({
  schemaVersion:'PHI-OS-CUSTOMER-READING-NARRATIVE-RULES-v1.0.0',
  irSchemaVersion:'PHI-OS-CUSTOMER-READING-NARRATIVE-IR-v1.0.0',
  maxPrimaryThemes:6,
  renderableDedupDecisions:['PRIMARY_EXPLANATION','CONTEXT_DERIVATIVE'],
  prohibitedGeneratedBlocks:['GENERIC_INTRO','GENERIC_ENDING','REPEATED_METHOD_DISCLAIMER'],
  boundary:{
    admittedClaimTextOnly:true,
    genericIntroAllowed:false,
    genericEndingAllowed:false,
    repeatedMethodDisclaimerAllowed:false,
    rendererMayCreateMeaning:false,
    rendererMayRestoreSuppressedDuplicate:false,
    technicalAppendixDefaultCollapsed:true,
    customerPredictionAccuracyClaimAllowed:false
  }
});
