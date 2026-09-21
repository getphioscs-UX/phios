// Generated from config/reports/*.json by scripts/sync-report-section-config.mjs.
// Browser and Pages Functions share this data; JSON files remain canonical.
export const registry = {
  "reportType": "BAZI_FULL_REPORT",
  "version": "GUIDED_REPORT_SUCCESSOR_R2_ADDENDUM_B",
  "methodId": "BZR",
  "frontMatter": [
    {
      "key": "FM01",
      "sourcePage": 1,
      "fixed": true,
      "binding": "COVER",
      "pagination": "NONE"
    },
    {
      "key": "FM02",
      "sourcePage": 2,
      "fixed": true,
      "binding": "METHOD_INTRO",
      "pagination": "APPROVED_BAKED_ASSET"
    },
    {
      "key": "FM03",
      "sourcePage": 3,
      "fixed": true,
      "binding": "ORIGIN",
      "pagination": "APPROVED_BAKED_ASSET"
    },
    {
      "key": "FM04",
      "sourcePage": 4,
      "fixed": true,
      "binding": "PHIOS_LENS",
      "pagination": "APPROVED_BAKED_ASSET"
    },
    {
      "key": "FM05",
      "sourcePage": 5,
      "fixed": true,
      "binding": "HOW_TO_READ",
      "pagination": "APPROVED_BAKED_ASSET"
    },
    {
      "key": "FM06",
      "sourcePage": 6,
      "fixed": true,
      "binding": "SNAPSHOT",
      "pagination": "GLOBAL"
    }
  ],
  "sections": [
    {
      "key": "S01_OVERVIEW",
      "number": "01",
      "title": {
        "zh-Hans": "命盘总览",
        "en": "Chart Overview"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S01_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-01-OVERVIEW",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "命盘总览",
            "en": "Chart Overview"
          }
        },
        {
          "key": "S01_P2",
          "family": "STRUCTURED_ANALYSIS_PAGE",
          "executionClass": "T0_T1_T2",
          "dataModules": [
            "baziChart",
            "dayMaster",
            "fiveElements"
          ],
          "title": {
            "zh-Hans": "你的八字命盘",
            "en": "Your BaZi Chart"
          }
        },
        {
          "key": "S01_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "chartHighlights"
          ],
          "title": {
            "zh-Hans": "命盘重点摘要",
            "en": "Key Insights"
          },
          "omitWhenInsufficient": true
        }
      ]
    },
    {
      "key": "S02_PERSONALITY",
      "number": "02",
      "title": {
        "zh-Hans": "核心性格",
        "en": "Core Personality"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S02_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-02-PERSONALITY",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "核心性格",
            "en": "Core Personality"
          }
        },
        {
          "key": "S02_P2",
          "family": "NARRATIVE_ANALYSIS_PAGE",
          "executionClass": "T3",
          "dataModules": [
            "personalityNarrative"
          ],
          "title": {
            "zh-Hans": "性格特质分析",
            "en": "Personality Analysis"
          }
        },
        {
          "key": "S02_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "strengths",
            "challenges",
            "socialStyle"
          ],
          "title": {
            "zh-Hans": "优势与挑战",
            "en": "Strengths & Challenges"
          },
          "omitWhenInsufficient": true
        }
      ]
    },
    {
      "key": "S03_LIFE_STRUCTURE",
      "number": "03",
      "title": {
        "zh-Hans": "人生格局",
        "en": "Life Structure"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S03_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "人生格局",
            "en": "Life Structure"
          }
        },
        {
          "key": "S03_P2",
          "family": "STRUCTURED_ANALYSIS_PAGE",
          "executionClass": "T0_T1_T2",
          "dataModules": [
            "chartStructure",
            "usefulElements"
          ],
          "title": {
            "zh-Hans": "命格与格局",
            "en": "Chart Structure"
          }
        },
        {
          "key": "S03_P3",
          "family": "NARRATIVE_ANALYSIS_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "lifeStructureNarrative"
          ],
          "title": {
            "zh-Hans": "结构如何影响人生节奏",
            "en": "How Structure Shapes Life Pattern"
          },
          "omitWhenInsufficient": true
        }
      ]
    },
    {
      "key": "S04_CAREER",
      "number": "04",
      "title": {
        "zh-Hans": "事业发展",
        "en": "Career Development"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S04_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-04-CAREER",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "事业发展",
            "en": "Career Development"
          }
        },
        {
          "key": "S04_P2",
          "family": "NARRATIVE_ANALYSIS_PAGE",
          "executionClass": "T3",
          "dataModules": [
            "careerNarrative"
          ],
          "title": {
            "zh-Hans": "事业主题分析",
            "en": "Career Outlook"
          }
        },
        {
          "key": "S04_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "careerFields"
          ],
          "title": {
            "zh-Hans": "工作方式与注意事项",
            "en": "Work Patterns & Considerations"
          },
          "omitWhenInsufficient": true
        },
        {
          "key": "S04_P4",
          "family": "TIMING_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "careerTiming"
          ],
          "title": {
            "zh-Hans": "事业时间观察",
            "en": "Career Timing"
          },
          "optional": true,
          "condition": "ADMITTED_CAREER_TIMING"
        }
      ]
    },
    {
      "key": "S05_WEALTH",
      "number": "05",
      "title": {
        "zh-Hans": "财富运势",
        "en": "Wealth Outlook"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S05_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-05-WEALTH",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "财富运势",
            "en": "Wealth Outlook"
          }
        },
        {
          "key": "S05_P2",
          "family": "NARRATIVE_ANALYSIS_PAGE",
          "executionClass": "T3",
          "dataModules": [
            "wealthNarrative"
          ],
          "title": {
            "zh-Hans": "财富与资源分析",
            "en": "Wealth Analysis"
          }
        },
        {
          "key": "S05_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "financialAdvice"
          ],
          "title": {
            "zh-Hans": "资源机会与现实核对",
            "en": "Resources & Reality Checks"
          },
          "omitWhenInsufficient": true
        }
      ]
    },
    {
      "key": "S06_RELATIONSHIP",
      "number": "06",
      "title": {
        "zh-Hans": "感情婚姻",
        "en": "Relationships & Marriage"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S06_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-06-RELATIONSHIP",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "感情婚姻",
            "en": "Relationships & Marriage"
          }
        },
        {
          "key": "S06_P2",
          "family": "NARRATIVE_ANALYSIS_PAGE",
          "executionClass": "T3",
          "dataModules": [
            "relationshipNarrative"
          ],
          "title": {
            "zh-Hans": "感情模式分析",
            "en": "Relationship Patterns"
          }
        },
        {
          "key": "S06_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "relationshipAdvice"
          ],
          "title": {
            "zh-Hans": "相处建议",
            "en": "Relationship Advice"
          },
          "omitWhenInsufficient": true
        }
      ]
    },
    {
      "key": "S07_HEALTH",
      "number": "07",
      "title": {
        "zh-Hans": "健康养生",
        "en": "Health & Wellbeing"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S07_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-07-HEALTH",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "健康养生",
            "en": "Health & Wellbeing"
          }
        },
        {
          "key": "S07_P2",
          "family": "NARRATIVE_ANALYSIS_PAGE",
          "executionClass": "T3",
          "dataModules": [
            "healthNarrative"
          ],
          "title": {
            "zh-Hans": "压力与生活节奏",
            "en": "Pressure & Daily Rhythm"
          }
        },
        {
          "key": "S07_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "wellnessAdvice"
          ],
          "title": {
            "zh-Hans": "生活观察建议",
            "en": "Wellbeing Reflections"
          },
          "omitWhenInsufficient": true
        }
      ]
    },
    {
      "key": "S08_TIMING",
      "number": "08",
      "title": {
        "zh-Hans": "时间结构",
        "en": "Timing & Cycles"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S08_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-08-TIMING",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "时间结构",
            "en": "Timing & Cycles"
          }
        },
        {
          "key": "S08_P2",
          "family": "TIMING_PAGE",
          "executionClass": "T0_T1_T2",
          "dataModules": [
            "timingContext"
          ],
          "title": {
            "zh-Hans": "当前时间层",
            "en": "Current Timing"
          }
        },
        {
          "key": "S08_P3",
          "family": "TIMING_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "currentYearInsight"
          ],
          "title": {
            "zh-Hans": "当前流年观察",
            "en": "Current-Year Insights"
          },
          "omitWhenInsufficient": false
        }
      ]
    },
    {
      "key": "S09_GUIDANCE",
      "number": "09",
      "title": {
        "zh-Hans": "人生建议",
        "en": "Guidance & Recommendations"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S09_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-09-GUIDANCE",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "人生建议",
            "en": "Guidance & Recommendations"
          }
        },
        {
          "key": "S09_P2",
          "family": "SUMMARY_PAGE",
          "executionClass": "T3",
          "dataModules": [
            "integratedGuidance"
          ],
          "title": {
            "zh-Hans": "综合建议",
            "en": "Integrated Guidance"
          }
        },
        {
          "key": "S09_P3",
          "family": "INSIGHT_LIST_PAGE",
          "executionClass": "T2_T3",
          "dataModules": [
            "nextSteps"
          ],
          "title": {
            "zh-Hans": "下一步建议",
            "en": "Next Steps"
          },
          "omitWhenInsufficient": true
        }
      ]
    },
    {
      "key": "S10_APPENDIX",
      "number": "10",
      "title": {
        "zh-Hans": "方法与附录",
        "en": "Method & Appendix"
      },
      "enabled": true,
      "pages": [
        {
          "key": "S10_P1",
          "family": "SECTION_OPENER_PAGE",
          "executionClass": "T2",
          "visualAsset": "VIS-REPORT-BAZI-SEC-10-APPENDIX",
          "dataModules": [
            "sectionIntroduction"
          ],
          "title": {
            "zh-Hans": "方法与附录",
            "en": "Method & Appendix"
          }
        },
        {
          "key": "S10_P2",
          "family": "METHOD_APPENDIX_PAGE",
          "executionClass": "T0_T1_T2",
          "dataModules": [
            "boundaries"
          ],
          "title": {
            "zh-Hans": "如何理解这份报告",
            "en": "How to Read This Report"
          }
        },
        {
          "key": "S10_P3",
          "family": "METHOD_APPENDIX_PAGE",
          "executionClass": "T1_T2",
          "dataModules": [
            "methodology"
          ],
          "title": {
            "zh-Hans": "分析方法",
            "en": "Methodology"
          },
          "omitWhenInsufficient": false
        }
      ]
    }
  ],
  "backMatter": [
    {
      "key": "BM01",
      "family": "SUMMARY_PAGE",
      "enabled": false
    }
  ],
  "pagination": {
    "owner": "GlobalReportPagination",
    "total": "EXPANDED_PAGES",
    "legacyStaticException": "USER_SELECTED_OPTION_1"
  },
  "policy": {
    "minimumBodyPagesPerSection": 1,
    "calculatedStandardTotal": 36,
    "notes": "The attachment's 33-page sum is an arithmetic error: 6 + 10 × 3 = 36. No hard total limit; optional evidence and overflow change the total."
  }
};

export const familyRegistry = {
  "version": "2.1.0",
  "families": {
    "SECTION_OPENER_PAGE": {
      "budget": {
        "zh": [
          50,
          110
        ],
        "en": [
          40,
          90
        ]
      },
      "blocks": [
        "number",
        "bilingualTitle",
        "intro",
        "hero"
      ],
      "overflowPolicy": "SPLIT_AT_SEMANTIC_BLOCK",
      "minFontPx": 16
    },
    "STRUCTURED_ANALYSIS_PAGE": {
      "budget": {
        "zh": [
          60,
          160
        ],
        "en": [
          40,
          120
        ]
      },
      "blocks": [
        "facts",
        "diagram",
        "explanation"
      ],
      "overflowPolicy": "SPLIT_AT_SEMANTIC_BLOCK",
      "minFontPx": 16
    },
    "NARRATIVE_ANALYSIS_PAGE": {
      "budget": {
        "zh": [
          180,
          360
        ],
        "en": [
          130,
          260
        ]
      },
      "blocks": [
        "intro",
        "interpretation",
        "reflection",
        "boundary"
      ],
      "overflowPolicy": "SPLIT_AT_SEMANTIC_BLOCK",
      "minFontPx": 16
    },
    "INSIGHT_LIST_PAGE": {
      "budget": {
        "items": [
          3,
          6
        ],
        "zhItem": [
          18,
          60
        ],
        "enItem": [
          12,
          40
        ]
      },
      "blocks": [
        "items"
      ],
      "overflowPolicy": "SPLIT_AT_SEMANTIC_BLOCK",
      "minFontPx": 16
    },
    "TIMING_PAGE": {
      "budget": {
        "observations": [
          2,
          4
        ]
      },
      "blocks": [
        "temporal",
        "narrative",
        "observations"
      ],
      "overflowPolicy": "SPLIT_AT_SEMANTIC_BLOCK",
      "minFontPx": 16
    },
    "METHOD_APPENDIX_PAGE": {
      "budget": {
        "zh": [
          120,
          240
        ],
        "en": [
          90,
          180
        ]
      },
      "blocks": [
        "method",
        "scope",
        "readerGuidance"
      ],
      "overflowPolicy": "SPLIT_AT_SEMANTIC_BLOCK",
      "minFontPx": 16
    },
    "SUMMARY_PAGE": {
      "budget": {
        "takeaways": [
          3,
          5
        ]
      },
      "blocks": [
        "narrative",
        "takeaways"
      ],
      "overflowPolicy": "SPLIT_AT_SEMANTIC_BLOCK",
      "minFontPx": 16
    }
  }
};

export const visualAssets = {
  "method": "BAZI",
  "version": "2.1.0",
  "global": {
    "bodyBackground": "VIS-REPORT-BAZI-BODY",
    "motifLayer": "VIS-REPORT-BAZI-MOTIF",
    "sectionStyle": "VIS-REPORT-BAZI-SECTION-STYLE"
  },
  "sections": {
    "S01_OVERVIEW": "VIS-REPORT-BAZI-SEC-01-OVERVIEW",
    "S02_PERSONALITY": "VIS-REPORT-BAZI-SEC-02-PERSONALITY",
    "S03_LIFE_STRUCTURE": "VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE",
    "S04_CAREER": "VIS-REPORT-BAZI-SEC-04-CAREER",
    "S05_WEALTH": "VIS-REPORT-BAZI-SEC-05-WEALTH",
    "S06_RELATIONSHIP": "VIS-REPORT-BAZI-SEC-06-RELATIONSHIP",
    "S07_HEALTH": "VIS-REPORT-BAZI-SEC-07-HEALTH",
    "S08_TIMING": "VIS-REPORT-BAZI-SEC-08-TIMING",
    "S09_GUIDANCE": "VIS-REPORT-BAZI-SEC-09-GUIDANCE",
    "S10_APPENDIX": "VIS-REPORT-BAZI-SEC-10-APPENDIX"
  },
  "bindings": {
    "VIS-REPORT-BAZI-MOTIF": "/assets/images/report/VIS-REPORT-BAZI-MOTIF.svg"
  },
  "fallback": "CSS_SECTION_STYLE_BODY_MOTIF",
  "allowEmptySlots": false,
  "fallbackOrder": [
    "SECTION_HERO",
    "SECTION_STYLE",
    "BODY_WITH_MOTIF",
    "BODY",
    "CSS_PREMIUM"
  ],
  "heroPlacements": [
    "hero-bottom",
    "hero-right",
    "hero-left",
    "hero-full-fade",
    "hero-corner"
  ],
  "openerRotation": [
    "hero-bottom",
    "hero-right",
    "hero-left",
    "hero-full-fade",
    "hero-bottom",
    "hero-right",
    "hero-left",
    "hero-full-fade",
    "hero-bottom",
    "hero-right"
  ],
  "bodyVariants": [
    "BODY_A",
    "BODY_B",
    "BODY_C"
  ],
  "intensity": {
    "body": 0.15,
    "narrative": 0.12,
    "insight": 0.09,
    "opener": 0.45
  },
  "assets": [
    {
      "assetId": "VIS-REPORT-BAZI-BODY",
      "method": "BAZI",
      "assetType": "BODY",
      "section": null,
      "priority": "A",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/body/VIS-REPORT-BAZI-BODY.webp",
      "fallback": "CSS_PREMIUM",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "EXISTING_AWAITING_FILE_BINDING",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-MOTIF",
      "method": "BAZI",
      "assetType": "MOTIF",
      "section": null,
      "priority": "A",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "svg",
      "objectKey": "reports/bazi/r2/visual/motif/VIS-REPORT-BAZI-MOTIF.svg",
      "fallback": "CSS_PREMIUM",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "PROVIDED_LOCAL_REVIEW_PENDING",
      "humanVisualAcceptance": "PENDING",
      "technicalNote": "SVG contains embedded PNG raster layers; accepted as decodable SVG, not claimed to be a pure vector master."
    },
    {
      "assetId": "VIS-REPORT-BAZI-SECTION-STYLE",
      "method": "BAZI",
      "assetType": "SECTION_STYLE",
      "section": null,
      "priority": "A",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SECTION-STYLE.webp",
      "fallback": "VIS-REPORT-BAZI-BODY",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-01-OVERVIEW",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S01_OVERVIEW",
      "priority": "B",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-01-OVERVIEW.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-02-PERSONALITY",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S02_PERSONALITY",
      "priority": "B",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-02-PERSONALITY.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S03_LIFE_STRUCTURE",
      "priority": "C",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-03-LIFE-STRUCTURE.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-04-CAREER",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S04_CAREER",
      "priority": "B",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-04-CAREER.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-05-WEALTH",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S05_WEALTH",
      "priority": "B",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-05-WEALTH.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-06-RELATIONSHIP",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S06_RELATIONSHIP",
      "priority": "B",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-06-RELATIONSHIP.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-07-HEALTH",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S07_HEALTH",
      "priority": "C",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-07-HEALTH.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-08-TIMING",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S08_TIMING",
      "priority": "C",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-08-TIMING.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-09-GUIDANCE",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S09_GUIDANCE",
      "priority": "C",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-09-GUIDANCE.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    },
    {
      "assetId": "VIS-REPORT-BAZI-SEC-10-APPENDIX",
      "method": "BAZI",
      "assetType": "SECTION_HERO",
      "section": "S10_APPENDIX",
      "priority": "C",
      "localeIndependent": true,
      "containsText": false,
      "preferredFormat": "webp",
      "objectKey": "reports/bazi/r2/visual/section/VIS-REPORT-BAZI-SEC-10-APPENDIX.webp",
      "fallback": "VIS-REPORT-BAZI-SECTION-STYLE",
      "safeArea": {
        "top": 0.2,
        "center": 0.55,
        "left": 0.12,
        "right": 0.12,
        "bottom": 0.12
      },
      "status": "OPTIONAL_NOT_PROVIDED",
      "humanVisualAcceptance": "PENDING"
    }
  ]
};
