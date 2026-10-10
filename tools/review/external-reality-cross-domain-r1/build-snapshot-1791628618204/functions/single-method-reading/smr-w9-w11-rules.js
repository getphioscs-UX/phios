const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};

export const SMR_R2_READING_IA_RULES=freeze({
  schemaVersion:'PHI-OS-SMR-R2-READING-IA-RULES-v1.0.0',
  outputSchemaVersion:'PHI-OS-CUSTOMER-READING-IA-v2.0.0',
  sections:[
    {sectionId:'WHAT_STANDS_OUT',order:10,customerLabel:'WHAT STANDS OUT',disclosureLevel:'LEVEL_1_READING',required:true},
    {sectionId:'YOUR_CORE_THEMES',order:20,customerLabel:'YOUR CORE THEMES',disclosureLevel:'LEVEL_1_READING',required:true},
    {sectionId:'WHAT_SUPPORTS_YOU',order:30,customerLabel:'WHAT SUPPORTS YOU',disclosureLevel:'LEVEL_1_READING',required:false},
    {sectionId:'WHERE_TENSION_APPEARS',order:40,customerLabel:'WHERE TENSION APPEARS',disclosureLevel:'LEVEL_1_READING',required:false},
    {sectionId:'WHEN_THE_PATTERN_CHANGES',order:50,customerLabel:'WHEN THE PATTERN CHANGES',disclosureLevel:'LEVEL_1_READING',required:false},
    {sectionId:'WHAT_THIS_MAY_LOOK_LIKE_IN_REALITY',order:60,customerLabel:'WHAT THIS MAY LOOK LIKE IN REALITY',disclosureLevel:'LEVEL_1_READING',required:false},
    {sectionId:'WHAT_TO_OBSERVE',order:70,customerLabel:'WHAT TO OBSERVE',disclosureLevel:'LEVEL_1_READING',required:false},
    {sectionId:'WHY_THIS_READING',order:80,customerLabel:'WHY THIS READING',disclosureLevel:'LEVEL_2_WHY_THIS_READING',required:true}
  ],
  progressiveDisclosure:[
    {levelId:'LEVEL_1_READING',order:10,contains:'CUSTOMER_READING'},
    {levelId:'LEVEL_2_WHY_THIS_READING',order:20,contains:'EVIDENCE_PRIORITY_LINEAGE'},
    {levelId:'LEVEL_3_TECHNICAL_DETAIL',order:30,contains:'METHOD_DETAIL'}
  ],
  boundary:{
    bodyOrderIsCustomerReadingOrder:true,
    methodObjectDirectoryMayLeadBody:false,
    technicalDetailMayLeadBody:false,
    technicalDetailDefaultCollapsed:true,
    sectionWithoutContentMayRender:false,
    sourceTextMustComeFromNarrativeIR:true,
    rendererMayCreateMeaning:false,
    methodDetailIsSeparateDisclosureLevel:true
  }
});

export const SMR_R2_LAYOUT_RULES=freeze({
  schemaVersion:'PHI-OS-SMR-R2-READING-LAYOUT-RULES-v1.0.0',
  outputSchemaVersion:'PHI-OS-SMR-R2-READING-LAYOUT-PLAN-v1.0.0',
  firstScreenMaxBlocks:8,
  firstScreenMaxThemes:3,
  coreThemeMaxCount:5,
  bodyMaxCharactersPerParagraph:540,
  bodyRecommendedCharactersPerParagraph:320,
  maxConsecutiveTextBlocks:3,
  technicalDefaultCollapsed:true,
  chartPlacement:'LEVEL_3_METHOD_DETAIL_AFTER_READING',
  evidenceDisclosurePolicy:'SUMMARY_LEVEL_2_FULL_LINEAGE_LEVEL_3',
  desktopContentWidth:760,
  mobileStackPolicy:'SINGLE_COLUMN_NO_NESTED_SCROLL',
  printBreakPolicy:'SECTION_AWARE_AVOID_THEME_SPLIT',
  mobile:{noHorizontalOverflow:true,noNestedScroll:true,minTapTargetCssPx:44,technicalPanelsCollapsed:true,themeWallsForbidden:true},
  print:{sectionAwareBreaks:true,widowOrphanProtection:true,technicalAppendixIncluded:true,clippedChartAllowed:false,uiOnlyControlsIncluded:false},
  firstScreenForbiddenKinds:['CHART_DUMP','BIRTH_DATA_TABLE','SOURCE_REFS','TECHNICAL_IDS','TECHNICAL_DETAIL'],
  boundary:{firstScreenTechnicalAllowed:false,rendererMayExpandBlockLimits:false,layoutMayCreateMeaning:false,webMobilePrintConsumeSameIA:true}
});
