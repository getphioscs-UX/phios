import fs from 'node:fs/promises';

const BASELINE = '256a3940c2d1a0b6f8d093e37624d0a550452ce8';
const nodesPath = 'content/knowledge/registry/nodes.json';
const blueprintPath = 'content/knowledge/blueprints/book-2-knowledge-blueprint.json';
const packagePath = 'package.json';

const chapterNodes = [
  {
    "partCode": "P5",
    "chapterCode": "5.1",
    "nodeCode": "KN-B1-P5-001",
    "titleEn": "Runtime Visibility",
    "titleZhHans": "为什么某些 Reality 会进入意识",
    "canonicalQuestionKey": "book-2-p5-01-runtime-visibility",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.2",
    "nodeCode": "KN-B1-P5-002",
    "titleEn": "Experience Emergence",
    "titleZhHans": "Reality 如何形成体验",
    "canonicalQuestionKey": "book-2-p5-02-experience-emergence",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.3",
    "nodeCode": "KN-B1-P5-014",
    "titleEn": "Awareness Formation",
    "titleZhHans": "体验如何进入觉察",
    "canonicalQuestionKey": "book-2-p5-03-awareness-formation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.4",
    "nodeCode": "KN-B1-P5-003",
    "titleEn": "Dream Runtime",
    "titleZhHans": "现实如何在觉察之外继续运行",
    "canonicalQuestionKey": "book-2-p5-04-dream-runtime",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.5",
    "nodeCode": "KN-B1-P5-015",
    "titleEn": "Continuous Conscious Process",
    "titleZhHans": "为什么 Consciousness 是过程而不是对象",
    "canonicalQuestionKey": "book-2-p5-05-continuous-conscious-process",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.6",
    "nodeCode": "KN-B1-P5-016",
    "titleEn": "Subjective Reality",
    "titleZhHans": "为什么不同人体验不同 Reality",
    "canonicalQuestionKey": "book-2-p5-06-subjective-reality",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.7",
    "nodeCode": "KN-B1-P5-004",
    "titleEn": "Conscious Illusion",
    "titleZhHans": "为什么意识误以为自己创造 Reality",
    "canonicalQuestionKey": "book-2-p5-07-conscious-illusion",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.8",
    "nodeCode": "KN-B1-P5-017",
    "titleEn": "Self Observation",
    "titleZhHans": "自我如何开始观察自己",
    "canonicalQuestionKey": "book-2-p5-08-self-observation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.9",
    "nodeCode": "KN-B1-P5-005",
    "titleEn": "Self Construction",
    "titleZhHans": "为什么持续的运行中心会逐渐形成稳定的自我模型",
    "canonicalQuestionKey": "book-2-p5-09-self-construction",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.10",
    "nodeCode": "KN-B1-P5-018",
    "titleEn": "Self Maintenance",
    "titleZhHans": "为什么自我会不断维持自己的存在",
    "canonicalQuestionKey": "book-2-p5-10-self-maintenance",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.11",
    "nodeCode": "KN-B1-P5-019",
    "titleEn": "Self Fragmentation",
    "titleZhHans": "为什么同一个生命会形成彼此冲突的多个自我状态",
    "canonicalQuestionKey": "book-2-p5-11-self-fragmentation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.12",
    "nodeCode": "KN-B1-P5-020",
    "titleEn": "Self Reintegration",
    "titleZhHans": "自我如何重新整合",
    "canonicalQuestionKey": "book-2-p5-12-self-reintegration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.13",
    "nodeCode": "KN-B1-P5-006",
    "titleEn": "Emotional Emergence",
    "titleZhHans": "情绪为何出现",
    "canonicalQuestionKey": "book-2-p5-13-emotional-emergence",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.14",
    "nodeCode": "KN-B1-P5-021",
    "titleEn": "Emotional Prediction",
    "titleZhHans": "情绪如何预测未来",
    "canonicalQuestionKey": "book-2-p5-14-emotional-prediction",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.15",
    "nodeCode": "KN-B1-P5-022",
    "titleEn": "Future Simulation",
    "titleZhHans": "情绪如何参与未来模拟",
    "canonicalQuestionKey": "book-2-p5-15-future-simulation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.16",
    "nodeCode": "KN-B1-P5-023",
    "titleEn": "Emotional Regulation",
    "titleZhHans": "情绪如何被调节",
    "canonicalQuestionKey": "book-2-p5-16-emotional-regulation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.17",
    "nodeCode": "KN-B1-P5-024",
    "titleEn": "Emotional Distortion",
    "titleZhHans": "情绪如何扭曲 Reality",
    "canonicalQuestionKey": "book-2-p5-17-emotional-distortion",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.18",
    "nodeCode": "KN-B1-P5-007",
    "titleEn": "Adaptive Imprinting",
    "titleZhHans": "现实如何留下适应痕迹",
    "canonicalQuestionKey": "book-2-p5-18-adaptive-imprinting",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.19",
    "nodeCode": "KN-B1-P5-025",
    "titleEn": "Adaptive Reconfiguration",
    "titleZhHans": "适应如何改变运行方式",
    "canonicalQuestionKey": "book-2-p5-19-adaptive-reconfiguration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.20",
    "nodeCode": "KN-B1-P5-026",
    "titleEn": "Adaptive Reintegration",
    "titleZhHans": "适应结构如何重新整合",
    "canonicalQuestionKey": "book-2-p5-20-adaptive-reintegration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.21",
    "nodeCode": "KN-B1-P5-008",
    "titleEn": "Experience Configuration System",
    "titleZhHans": "体验配置系统如何形成",
    "canonicalQuestionKey": "book-2-p5-21-experience-configuration-system",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.22",
    "nodeCode": "KN-B1-P5-027",
    "titleEn": "Experience Selection",
    "titleZhHans": "为什么进入系统的 Reality 只有部分形成体验",
    "canonicalQuestionKey": "book-2-p5-22-experience-selection",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.23",
    "nodeCode": "KN-B1-P5-028",
    "titleEn": "Experience Stabilization",
    "titleZhHans": "体验如何获得稳定性",
    "canonicalQuestionKey": "book-2-p5-23-experience-stabilization",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.24",
    "nodeCode": "KN-B1-P5-009",
    "titleEn": "Perspective Runtime",
    "titleZhHans": "Reality 如何被观察",
    "canonicalQuestionKey": "book-2-p5-24-perspective-runtime",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.25",
    "nodeCode": "KN-B1-P5-029",
    "titleEn": "Motivation Runtime",
    "titleZhHans": "Reality 为什么变得重要",
    "canonicalQuestionKey": "book-2-p5-25-motivation-runtime",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.26",
    "nodeCode": "KN-B1-P5-030",
    "titleEn": "Experience Integration",
    "titleZhHans": "不同 Experience 如何被组织为整体",
    "canonicalQuestionKey": "book-2-p5-26-experience-integration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.27",
    "nodeCode": "KN-B1-P5-031",
    "titleEn": "Temporal Integration",
    "titleZhHans": "分散时刻如何形成连续时间",
    "canonicalQuestionKey": "book-2-p5-27-temporal-integration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.28",
    "nodeCode": "KN-B1-P5-032",
    "titleEn": "Sensory Integration",
    "titleZhHans": "不同感觉如何形成同一个 Reality",
    "canonicalQuestionKey": "book-2-p5-28-sensory-integration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.29",
    "nodeCode": "KN-B1-P5-033",
    "titleEn": "Internal Representation",
    "titleZhHans": "Experience 如何形成内部表征",
    "canonicalQuestionKey": "book-2-p5-29-internal-representation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.30",
    "nodeCode": "KN-B1-P5-034",
    "titleEn": "Memory Organization",
    "titleZhHans": "经验如何成为可调用的过去",
    "canonicalQuestionKey": "book-2-p5-30-memory-organization",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.31",
    "nodeCode": "KN-B1-P5-035",
    "titleEn": "Predictive Simulation",
    "titleZhHans": "Runtime 如何在内部预演 Reality",
    "canonicalQuestionKey": "book-2-p5-31-predictive-simulation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.32",
    "nodeCode": "KN-B1-P5-036",
    "titleEn": "Representation Continuity",
    "titleZhHans": "内部世界如何保持连续",
    "canonicalQuestionKey": "book-2-p5-32-representation-continuity",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.33",
    "nodeCode": "KN-B1-P5-037",
    "titleEn": "Expression Emergence",
    "titleZhHans": "表达为何出现",
    "canonicalQuestionKey": "book-2-p5-33-expression-emergence",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.34",
    "nodeCode": "KN-B1-P5-038",
    "titleEn": "Cognitive Expression",
    "titleZhHans": "思考如何形成可表达结构",
    "canonicalQuestionKey": "book-2-p5-34-cognitive-expression",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.35",
    "nodeCode": "KN-B1-P5-010",
    "titleEn": "Compression and Expression",
    "titleZhHans": "复杂 Experience 如何被压缩",
    "canonicalQuestionKey": "book-2-p5-35-compression-and-expression",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.36",
    "nodeCode": "KN-B1-P5-039",
    "titleEn": "Expression Architectures",
    "titleZhHans": "Reality 如何形成不同表达路径",
    "canonicalQuestionKey": "book-2-p5-36-expression-architectures",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.37",
    "nodeCode": "KN-B1-P5-040",
    "titleEn": "Expression Threshold",
    "titleZhHans": "为什么有些 Experience 能够表达而有些不能",
    "canonicalQuestionKey": "book-2-p5-37-expression-threshold",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.38",
    "nodeCode": "KN-B1-P5-041",
    "titleEn": "Expression Development",
    "titleZhHans": "表达能力如何发展",
    "canonicalQuestionKey": "book-2-p5-38-expression-development",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.39",
    "nodeCode": "KN-B1-P5-042",
    "titleEn": "Expression Configuration",
    "titleZhHans": "为什么不同 Runtime 使用不同表达方式",
    "canonicalQuestionKey": "book-2-p5-39-expression-configuration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.40",
    "nodeCode": "KN-B1-P5-043",
    "titleEn": "Medium Configuration",
    "titleZhHans": "媒介如何改变表达",
    "canonicalQuestionKey": "book-2-p5-40-medium-configuration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.41",
    "nodeCode": "KN-B1-P5-044",
    "titleEn": "Expression Power",
    "titleZhHans": "表达如何改变其他 Runtime",
    "canonicalQuestionKey": "book-2-p5-41-expression-power",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.42",
    "nodeCode": "KN-B1-P5-045",
    "titleEn": "Expression Distortion",
    "titleZhHans": "为什么表达会偏离 Experience",
    "canonicalQuestionKey": "book-2-p5-42-expression-distortion",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.43",
    "nodeCode": "KN-B1-P5-046",
    "titleEn": "Expression Silence",
    "titleZhHans": "为什么某些 Reality 无法被表达",
    "canonicalQuestionKey": "book-2-p5-43-expression-silence",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.44",
    "nodeCode": "KN-B1-P5-011",
    "titleEn": "Intention Formation",
    "titleZhHans": "意图为何形成",
    "canonicalQuestionKey": "book-2-p5-44-intention-formation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.45",
    "nodeCode": "KN-B1-P5-047",
    "titleEn": "Decision Emergence",
    "titleZhHans": "决策为何出现",
    "canonicalQuestionKey": "book-2-p5-45-decision-emergence",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.46",
    "nodeCode": "KN-B1-P5-048",
    "titleEn": "Decision Architectures",
    "titleZhHans": "Reality 如何形成不同决策路径",
    "canonicalQuestionKey": "book-2-p5-46-decision-architectures",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.47",
    "nodeCode": "KN-B1-P5-049",
    "titleEn": "Decision Formation",
    "titleZhHans": "现实如何形成选择",
    "canonicalQuestionKey": "book-2-p5-47-decision-formation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.48",
    "nodeCode": "KN-B1-P5-050",
    "titleEn": "Internal Conflict",
    "titleZhHans": "内部冲突为何出现",
    "canonicalQuestionKey": "book-2-p5-48-internal-conflict",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.49",
    "nodeCode": "KN-B1-P5-051",
    "titleEn": "Responsibility Formation",
    "titleZhHans": "责任为何形成",
    "canonicalQuestionKey": "book-2-p5-49-responsibility-formation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.50",
    "nodeCode": "KN-B1-P5-052",
    "titleEn": "Commitment Stability",
    "titleZhHans": "承诺为何能够持续",
    "canonicalQuestionKey": "book-2-p5-50-commitment-stability",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.51",
    "nodeCode": "KN-B1-P5-053",
    "titleEn": "Agency Collapse",
    "titleZhHans": "行动力为何瓦解",
    "canonicalQuestionKey": "book-2-p5-51-agency-collapse",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.52",
    "nodeCode": "KN-B1-P5-012",
    "titleEn": "Identity Stabilization",
    "titleZhHans": "身份如何被维持",
    "canonicalQuestionKey": "book-2-p5-52-identity-stabilization",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.53",
    "nodeCode": "KN-B1-P5-054",
    "titleEn": "Identity Compression",
    "titleZhHans": "身份如何被压缩",
    "canonicalQuestionKey": "book-2-p5-53-identity-compression",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.54",
    "nodeCode": "KN-B1-P5-055",
    "titleEn": "Identity Drift",
    "titleZhHans": "身份为何偏离",
    "canonicalQuestionKey": "book-2-p5-54-identity-drift",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.55",
    "nodeCode": "KN-B1-P5-056",
    "titleEn": "Identity Reconfiguration",
    "titleZhHans": "身份如何重组",
    "canonicalQuestionKey": "book-2-p5-55-identity-reconfiguration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.56",
    "nodeCode": "KN-B1-P5-057",
    "titleEn": "Identity Dissolution",
    "titleZhHans": "身份如何瓦解",
    "canonicalQuestionKey": "book-2-p5-56-identity-dissolution",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.57",
    "nodeCode": "KN-B1-P5-058",
    "titleEn": "Feedback Formation",
    "titleZhHans": "行动结果如何重新进入 Experience",
    "canonicalQuestionKey": "book-2-p5-57-feedback-formation",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.58",
    "nodeCode": "KN-B1-P5-059",
    "titleEn": "Runtime Calibration",
    "titleZhHans": "Runtime 如何修正自己",
    "canonicalQuestionKey": "book-2-p5-58-runtime-calibration",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.59",
    "nodeCode": "KN-B1-P5-060",
    "titleEn": "Conscious Learning",
    "titleZhHans": "经验如何改变下一次意识运行",
    "canonicalQuestionKey": "book-2-p5-59-conscious-learning",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.60",
    "nodeCode": "KN-B1-P5-061",
    "titleEn": "Self Model Dissolution",
    "titleZhHans": "自我模型如何停止维持自身",
    "canonicalQuestionKey": "book-2-p5-60-self-model-dissolution",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.61",
    "nodeCode": "KN-B1-P5-062",
    "titleEn": "Narrative Survival",
    "titleZhHans": "叙事如何在当前 Runtime 结束以后继续存在",
    "canonicalQuestionKey": "book-2-p5-61-narrative-survival",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.62",
    "nodeCode": "KN-B1-P5-063",
    "titleEn": "Meaning Residue",
    "titleZhHans": "意义为何留下残留",
    "canonicalQuestionKey": "book-2-p5-62-meaning-residue",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.63",
    "nodeCode": "KN-B1-P5-064",
    "titleEn": "Conscious Completion",
    "titleZhHans": "Conscious Runtime 如何完成一次运行",
    "canonicalQuestionKey": "book-2-p5-63-conscious-completion",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.64",
    "nodeCode": "KN-B1-P5-013",
    "titleEn": "Synthetic Self-Model",
    "titleZhHans": "人工智能是否能够形成自我模型",
    "canonicalQuestionKey": "book-2-p5-64-synthetic-self-model",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P5",
    "chapterCode": "5.65",
    "nodeCode": "KN-B1-P5-065",
    "titleEn": "Synthetic Consciousness",
    "titleZhHans": "人工智能是否能够形成 Conscious Runtime",
    "canonicalQuestionKey": "book-2-p5-65-synthetic-consciousness",
    "sourceBookCode": "BOOK-1",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.1",
    "nodeCode": "KN-B2-P6-001",
    "titleEn": "Shared Runtime",
    "titleZhHans": "为什么共同 Reality 会出现",
    "canonicalQuestionKey": "book-2-p6-01-shared-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.2",
    "nodeCode": "KN-B2-P6-002",
    "titleEn": "Runtime Synchronization",
    "titleZhHans": "多个 Runtime 如何开始同步",
    "canonicalQuestionKey": "book-2-p6-02-runtime-synchronization",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.3",
    "nodeCode": "KN-B2-P6-003",
    "titleEn": "Runtime Connection Mechanics",
    "titleZhHans": "Runtime 如何形成连接",
    "canonicalQuestionKey": "book-2-p6-03-runtime-connection-mechanics",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.4",
    "nodeCode": "KN-B2-P6-004",
    "titleEn": "Shared Field",
    "titleZhHans": "为什么共同场开始形成",
    "canonicalQuestionKey": "book-2-p6-04-shared-field",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.5",
    "nodeCode": "KN-B2-P6-005",
    "titleEn": "Field Synchronization",
    "titleZhHans": "多个 Runtime 如何同步同一个 Field",
    "canonicalQuestionKey": "book-2-p6-05-field-synchronization",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.6",
    "nodeCode": "KN-B2-P6-006",
    "titleEn": "Resonance",
    "titleZhHans": "为什么开始共振",
    "canonicalQuestionKey": "book-2-p6-06-resonance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.7",
    "nodeCode": "KN-B2-P6-007",
    "titleEn": "Interference",
    "titleZhHans": "为什么开始互相干扰",
    "canonicalQuestionKey": "book-2-p6-07-interference",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.8",
    "nodeCode": "KN-B2-P6-008",
    "titleEn": "Biological Resonance",
    "titleZhHans": "生命为何能够共同运行",
    "canonicalQuestionKey": "book-2-p6-08-biological-resonance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.9",
    "nodeCode": "KN-B2-P6-009",
    "titleEn": "Multi-Node Runtime",
    "titleZhHans": "Reality 如何形成多人系统",
    "canonicalQuestionKey": "book-2-p6-09-multi-node-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.10",
    "nodeCode": "KN-B2-P6-010",
    "titleEn": "Runtime Dominance",
    "titleZhHans": "为什么共同 Runtime 会开始出现稳定中心",
    "canonicalQuestionKey": "book-2-p6-10-runtime-dominance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.11",
    "nodeCode": "KN-B2-P6-011",
    "titleEn": "Relational Load",
    "titleZhHans": "为什么共同 Runtime 必须开始分配运行成本",
    "canonicalQuestionKey": "book-2-p6-11-relational-load",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.12",
    "nodeCode": "KN-B2-P6-012",
    "titleEn": "Conflict Formation",
    "titleZhHans": "为什么长期系统一定开始出现结构冲突",
    "canonicalQuestionKey": "book-2-p6-12-conflict-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.13",
    "nodeCode": "KN-B2-P6-013",
    "titleEn": "Boundary Formation",
    "titleZhHans": "共同 Reality 为什么需要形成边界",
    "canonicalQuestionKey": "book-2-p6-13-boundary-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.14",
    "nodeCode": "KN-B2-P6-014",
    "titleEn": "Boundary Transition",
    "titleZhHans": "为什么边界一直改变",
    "canonicalQuestionKey": "book-2-p6-14-boundary-transition",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.15",
    "nodeCode": "KN-B2-P6-015",
    "titleEn": "Boundary Collapse",
    "titleZhHans": "为什么边界最终瓦解",
    "canonicalQuestionKey": "book-2-p6-15-boundary-collapse",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.16",
    "nodeCode": "KN-B2-P6-016",
    "titleEn": "Runtime Dependency",
    "titleZhHans": "为什么 Runtime 会开始降低独立性",
    "canonicalQuestionKey": "book-2-p6-16-runtime-dependency",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.17",
    "nodeCode": "KN-B2-P6-017",
    "titleEn": "Attachment Runtime",
    "titleZhHans": "为什么 Runtime 会开始固定连接",
    "canonicalQuestionKey": "book-2-p6-17-attachment-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.18",
    "nodeCode": "KN-B2-P6-018",
    "titleEn": "Runtime Evolution",
    "titleZhHans": "整个共同 Runtime 如何持续改变",
    "canonicalQuestionKey": "book-2-p6-18-runtime-evolution",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.19",
    "nodeCode": "KN-B2-P6-019",
    "titleEn": "Reality Network",
    "titleZhHans": "为什么多个共同现实开始彼此连接",
    "canonicalQuestionKey": "book-2-p6-19-reality-network",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.20",
    "nodeCode": "KN-B2-P6-020",
    "titleEn": "Participation Balance",
    "titleZhHans": "为什么不同共同现实维持参与平衡",
    "canonicalQuestionKey": "book-2-p6-20-participation-balance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.21",
    "nodeCode": "KN-B2-P6-021",
    "titleEn": "Responsibility Distribution",
    "titleZhHans": "为什么不同共同现实开始承担不同责任",
    "canonicalQuestionKey": "book-2-p6-21-responsibility-distribution",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.22",
    "nodeCode": "KN-B2-P6-022",
    "titleEn": "System Load Distribution",
    "titleZhHans": "为什么运行负荷开始跨共同现实重新分配",
    "canonicalQuestionKey": "book-2-p6-22-system-load-distribution",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.23",
    "nodeCode": "KN-B2-P6-023",
    "titleEn": "Structural Cost",
    "titleZhHans": "为什么现实生态必须承担整体成本",
    "canonicalQuestionKey": "book-2-p6-23-structural-cost",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.24",
    "nodeCode": "KN-B2-P6-024",
    "titleEn": "Ecological Stability",
    "titleZhHans": "为什么多个共同现实能够长期稳定共存",
    "canonicalQuestionKey": "book-2-p6-24-ecological-stability",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.25",
    "nodeCode": "KN-B2-P6-025",
    "titleEn": "Reproductive Relationship",
    "titleZhHans": "生命为什么需要共同形成下一代",
    "canonicalQuestionKey": "book-2-p6-25-reproductive-relationship",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.26",
    "nodeCode": "KN-B2-P6-026",
    "titleEn": "Pair Bond Runtime",
    "titleZhHans": "为什么长期关系能够稳定形成",
    "canonicalQuestionKey": "book-2-p6-26-pair-bond-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.27",
    "nodeCode": "KN-B2-P6-027",
    "titleEn": "Parenting Runtime",
    "titleZhHans": "为什么共同养育会形成新的 Runtime",
    "canonicalQuestionKey": "book-2-p6-27-parenting-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.28",
    "nodeCode": "KN-B2-P6-028",
    "titleEn": "Child Runtime Reading",
    "titleZhHans": "为什么孩子会成为新的 Runtime",
    "canonicalQuestionKey": "book-2-p6-28-child-runtime-reading",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.29",
    "nodeCode": "KN-B2-P6-029",
    "titleEn": "Generational Runtime",
    "titleZhHans": "为什么 Runtime 会跨世代延续",
    "canonicalQuestionKey": "book-2-p6-29-generational-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.30",
    "nodeCode": "KN-B2-P6-030",
    "titleEn": "Generational Projection",
    "titleZhHans": "家庭模式为什么不断复制",
    "canonicalQuestionKey": "book-2-p6-30-generational-projection",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.31",
    "nodeCode": "KN-B2-P6-031",
    "titleEn": "Intergenerational Transition",
    "titleZhHans": "Runtime 如何在世代之间改变",
    "canonicalQuestionKey": "book-2-p6-31-intergenerational-transition",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.32",
    "nodeCode": "KN-B2-P6-032",
    "titleEn": "Family Stabilization",
    "titleZhHans": "Family 如何形成长期稳定系统",
    "canonicalQuestionKey": "book-2-p6-32-family-stabilization",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.33",
    "nodeCode": "KN-B2-P6-033",
    "titleEn": "Emotional Flow",
    "titleZhHans": "情绪如何在家庭 Runtime 中流动",
    "canonicalQuestionKey": "book-2-p6-33-emotional-flow",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.34",
    "nodeCode": "KN-B2-P6-034",
    "titleEn": "Family Synchronization",
    "titleZhHans": "家庭成员如何形成共同节奏",
    "canonicalQuestionKey": "book-2-p6-34-family-synchronization",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.35",
    "nodeCode": "KN-B2-P6-035",
    "titleEn": "Family Reconfiguration",
    "titleZhHans": "家庭 Runtime 如何重新配置",
    "canonicalQuestionKey": "book-2-p6-35-family-reconfiguration",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.36",
    "nodeCode": "KN-B2-P6-036",
    "titleEn": "Family Collapse",
    "titleZhHans": "家庭 Runtime 为什么会瓦解",
    "canonicalQuestionKey": "book-2-p6-36-family-collapse",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.37",
    "nodeCode": "KN-B2-P6-037",
    "titleEn": "Tribe Formation",
    "titleZhHans": "Family 如何扩展为部落",
    "canonicalQuestionKey": "book-2-p6-37-tribe-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.38",
    "nodeCode": "KN-B2-P6-038",
    "titleEn": "Community Runtime",
    "titleZhHans": "群体如何形成社区运行",
    "canonicalQuestionKey": "book-2-p6-38-community-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.39",
    "nodeCode": "KN-B2-P6-039",
    "titleEn": "Shared Identity",
    "titleZhHans": "群体如何形成共享身份",
    "canonicalQuestionKey": "book-2-p6-39-shared-identity",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.40",
    "nodeCode": "KN-B2-P6-040",
    "titleEn": "Collective Resonance",
    "titleZhHans": "群体如何形成集体共振",
    "canonicalQuestionKey": "book-2-p6-40-collective-resonance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.41",
    "nodeCode": "KN-B2-P6-041",
    "titleEn": "Collective Polarization",
    "titleZhHans": "群体为什么走向两极化",
    "canonicalQuestionKey": "book-2-p6-41-collective-polarization",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.42",
    "nodeCode": "KN-B2-P6-042",
    "titleEn": "Influence Formation",
    "titleZhHans": "现实影响如何形成",
    "canonicalQuestionKey": "book-2-p6-42-influence-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.43",
    "nodeCode": "KN-B2-P6-043",
    "titleEn": "Attention Coupling",
    "titleZhHans": "注意力如何在多个 Runtime 之间耦合",
    "canonicalQuestionKey": "book-2-p6-43-attention-coupling",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.44",
    "nodeCode": "KN-B2-P6-044",
    "titleEn": "Belief Coupling",
    "titleZhHans": "信念如何在多个 Runtime 之间耦合",
    "canonicalQuestionKey": "book-2-p6-44-belief-coupling",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.45",
    "nodeCode": "KN-B2-P6-045",
    "titleEn": "Narrative Infection",
    "titleZhHans": "叙事如何感染其他 Runtime",
    "canonicalQuestionKey": "book-2-p6-45-narrative-infection",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.46",
    "nodeCode": "KN-B2-P6-046",
    "titleEn": "Collective Suggestion",
    "titleZhHans": "群体暗示如何改变 Reality",
    "canonicalQuestionKey": "book-2-p6-46-collective-suggestion",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.47",
    "nodeCode": "KN-B2-P6-047",
    "titleEn": "Symbolic Influence",
    "titleZhHans": "符号如何形成关系影响",
    "canonicalQuestionKey": "book-2-p6-47-symbolic-influence",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.48",
    "nodeCode": "KN-B2-P6-048",
    "titleEn": "Relational Entrapment",
    "titleZhHans": "Runtime 如何被关系结构困住",
    "canonicalQuestionKey": "book-2-p6-48-relational-entrapment",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.49",
    "nodeCode": "KN-B2-P6-049",
    "titleEn": "Runtime Hijacking",
    "titleZhHans": "一个 Runtime 如何劫持另一个 Runtime",
    "canonicalQuestionKey": "book-2-p6-49-runtime-hijacking",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.50",
    "nodeCode": "KN-B2-P6-050",
    "titleEn": "Influence Recovery",
    "titleZhHans": "Runtime 如何从关系影响中恢复",
    "canonicalQuestionKey": "book-2-p6-50-influence-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.51",
    "nodeCode": "KN-B2-P6-051",
    "titleEn": "AI-Mediated Relationship",
    "titleZhHans": "AI 如何中介人类关系",
    "canonicalQuestionKey": "book-2-p6-51-ai-mediated-relationship",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.52",
    "nodeCode": "KN-B2-P6-052",
    "titleEn": "Synthetic Companion",
    "titleZhHans": "人工系统如何成为陪伴者",
    "canonicalQuestionKey": "book-2-p6-52-synthetic-companion",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.53",
    "nodeCode": "KN-B2-P6-053",
    "titleEn": "Synthetic Mentor",
    "titleZhHans": "人工系统如何成为指导者",
    "canonicalQuestionKey": "book-2-p6-53-synthetic-mentor",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.54",
    "nodeCode": "KN-B2-P6-054",
    "titleEn": "Synthetic Attachment",
    "titleZhHans": "人类为何会对人工系统形成依恋",
    "canonicalQuestionKey": "book-2-p6-54-synthetic-attachment",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.55",
    "nodeCode": "KN-B2-P6-055",
    "titleEn": "Human–AI Coupling",
    "titleZhHans": "人类与 AI 如何形成共同运行",
    "canonicalQuestionKey": "book-2-p6-55-human-ai-coupling",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.56",
    "nodeCode": "KN-B2-P6-056",
    "titleEn": "Exit Dynamics",
    "titleZhHans": "Runtime 如何离开共同 Reality",
    "canonicalQuestionKey": "book-2-p6-56-exit-dynamics",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.57",
    "nodeCode": "KN-B2-P6-057",
    "titleEn": "Shared Memory",
    "titleZhHans": "共同 Reality 如何留下共享记忆",
    "canonicalQuestionKey": "book-2-p6-57-shared-memory",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P6",
    "chapterCode": "6.58",
    "nodeCode": "KN-B2-P6-058",
    "titleEn": "Shared Reality Closure",
    "titleZhHans": "共同 Reality 如何完成一次运行",
    "canonicalQuestionKey": "book-2-p6-58-shared-reality-closure",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.1",
    "nodeCode": "KN-B2-P7-001",
    "titleEn": "Collective Field",
    "titleZhHans": "集体场为何出现",
    "canonicalQuestionKey": "book-2-p7-01-collective-field",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.2",
    "nodeCode": "KN-B2-P7-002",
    "titleEn": "Shared Projection",
    "titleZhHans": "为何多人会相信同一个现实",
    "canonicalQuestionKey": "book-2-p7-02-shared-projection",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.3",
    "nodeCode": "KN-B2-P7-003",
    "titleEn": "Narrative Synchronization",
    "titleZhHans": "为何故事能够形成共同现实",
    "canonicalQuestionKey": "book-2-p7-03-narrative-synchronization",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.4",
    "nodeCode": "KN-B2-P7-004",
    "titleEn": "Collective Emotion",
    "titleZhHans": "情绪如何跨个体传播",
    "canonicalQuestionKey": "book-2-p7-04-collective-emotion",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.5",
    "nodeCode": "KN-B2-P7-005",
    "titleEn": "Collective Identity",
    "titleZhHans": "群体如何形成我们",
    "canonicalQuestionKey": "book-2-p7-05-collective-identity",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.6",
    "nodeCode": "KN-B2-P7-006",
    "titleEn": "Civilization Pressure",
    "titleZhHans": "集体如何开始约束个体",
    "canonicalQuestionKey": "book-2-p7-06-civilization-pressure",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.7",
    "nodeCode": "KN-B2-P7-007",
    "titleEn": "Value Formation",
    "titleZhHans": "价值为何出现",
    "canonicalQuestionKey": "book-2-p7-07-value-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.8",
    "nodeCode": "KN-B2-P7-008",
    "titleEn": "Value Hierarchy",
    "titleZhHans": "价值如何形成排序",
    "canonicalQuestionKey": "book-2-p7-08-value-hierarchy",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.9",
    "nodeCode": "KN-B2-P7-009",
    "titleEn": "Resource Compression",
    "titleZhHans": "资源为何被压缩",
    "canonicalQuestionKey": "book-2-p7-09-resource-compression",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.10",
    "nodeCode": "KN-B2-P7-010",
    "titleEn": "Scarcity Formation",
    "titleZhHans": "稀缺性如何形成",
    "canonicalQuestionKey": "book-2-p7-10-scarcity-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.11",
    "nodeCode": "KN-B2-P7-011",
    "titleEn": "Social Reward Systems",
    "titleZhHans": "社会奖励机制如何形成",
    "canonicalQuestionKey": "book-2-p7-11-social-reward-systems",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.12",
    "nodeCode": "KN-B2-P7-012",
    "titleEn": "Civilization Incentive Structures",
    "titleZhHans": "文明激励结构如何形成",
    "canonicalQuestionKey": "book-2-p7-12-civilization-incentive-structures",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.13",
    "nodeCode": "KN-B2-P7-013",
    "titleEn": "Memetic Runtime",
    "titleZhHans": "模因如何运行",
    "canonicalQuestionKey": "book-2-p7-13-memetic-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.14",
    "nodeCode": "KN-B2-P7-014",
    "titleEn": "Cultural Runtime",
    "titleZhHans": "文化如何运行",
    "canonicalQuestionKey": "book-2-p7-14-cultural-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.15",
    "nodeCode": "KN-B2-P7-015",
    "titleEn": "Economic Runtime",
    "titleZhHans": "资源如何流动",
    "canonicalQuestionKey": "book-2-p7-15-economic-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.16",
    "nodeCode": "KN-B2-P7-016",
    "titleEn": "Value Storage",
    "titleZhHans": "价值如何储存",
    "canonicalQuestionKey": "book-2-p7-16-value-storage",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.17",
    "nodeCode": "KN-B2-P7-017",
    "titleEn": "Credit Creation",
    "titleZhHans": "信用如何创造现实",
    "canonicalQuestionKey": "book-2-p7-17-credit-creation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.18",
    "nodeCode": "KN-B2-P7-018",
    "titleEn": "Debt Expansion",
    "titleZhHans": "债务如何扩张",
    "canonicalQuestionKey": "book-2-p7-18-debt-expansion",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.19",
    "nodeCode": "KN-B2-P7-019",
    "titleEn": "Capital Allocation",
    "titleZhHans": "资本如何被配置",
    "canonicalQuestionKey": "book-2-p7-19-capital-allocation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.20",
    "nodeCode": "KN-B2-P7-020",
    "titleEn": "Financial Narratives",
    "titleZhHans": "金融叙事如何形成",
    "canonicalQuestionKey": "book-2-p7-20-financial-narratives",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.21",
    "nodeCode": "KN-B2-P7-021",
    "titleEn": "Speculative Cycles",
    "titleZhHans": "投机周期如何形成",
    "canonicalQuestionKey": "book-2-p7-21-speculative-cycles",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.22",
    "nodeCode": "KN-B2-P7-022",
    "titleEn": "Financial Compression",
    "titleZhHans": "金融如何压缩未来",
    "canonicalQuestionKey": "book-2-p7-22-financial-compression",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.23",
    "nodeCode": "KN-B2-P7-023",
    "titleEn": "Future Extraction",
    "titleZhHans": "未来为何被提前提取",
    "canonicalQuestionKey": "book-2-p7-23-future-extraction",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.24",
    "nodeCode": "KN-B2-P7-024",
    "titleEn": "Institutional Runtime",
    "titleZhHans": "制度如何稳定现实",
    "canonicalQuestionKey": "book-2-p7-24-institutional-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.25",
    "nodeCode": "KN-B2-P7-025",
    "titleEn": "Information Runtime",
    "titleZhHans": "信息如何成为文明运行结构",
    "canonicalQuestionKey": "book-2-p7-25-information-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.26",
    "nodeCode": "KN-B2-P7-026",
    "titleEn": "Media Runtime",
    "titleZhHans": "媒体如何组织集体现实",
    "canonicalQuestionKey": "book-2-p7-26-media-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.27",
    "nodeCode": "KN-B2-P7-027",
    "titleEn": "Platform Runtime",
    "titleZhHans": "平台如何组织集体现实",
    "canonicalQuestionKey": "book-2-p7-27-platform-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.28",
    "nodeCode": "KN-B2-P7-028",
    "titleEn": "Network Runtime",
    "titleZhHans": "网络如何形成文明连接",
    "canonicalQuestionKey": "book-2-p7-28-network-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.29",
    "nodeCode": "KN-B2-P7-029",
    "titleEn": "Infrastructure Runtime",
    "titleZhHans": "基础设施如何承载文明",
    "canonicalQuestionKey": "book-2-p7-29-infrastructure-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.30",
    "nodeCode": "KN-B2-P7-030",
    "titleEn": "Collective Neural Networks",
    "titleZhHans": "文明如何形成集体神经网络",
    "canonicalQuestionKey": "book-2-p7-30-collective-neural-networks",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.31",
    "nodeCode": "KN-B2-P7-031",
    "titleEn": "Attention Economy",
    "titleZhHans": "注意力如何成为经济资源",
    "canonicalQuestionKey": "book-2-p7-31-attention-economy",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.32",
    "nodeCode": "KN-B2-P7-032",
    "titleEn": "Attention Competition",
    "titleZhHans": "注意力如何被竞争",
    "canonicalQuestionKey": "book-2-p7-32-attention-competition",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.33",
    "nodeCode": "KN-B2-P7-033",
    "titleEn": "Narrative Markets",
    "titleZhHans": "叙事如何形成市场",
    "canonicalQuestionKey": "book-2-p7-33-narrative-markets",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.34",
    "nodeCode": "KN-B2-P7-034",
    "titleEn": "Collective Attention Loops",
    "titleZhHans": "集体注意力回路如何形成",
    "canonicalQuestionKey": "book-2-p7-34-collective-attention-loops",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.35",
    "nodeCode": "KN-B2-P7-035",
    "titleEn": "Attention Capture",
    "titleZhHans": "注意力如何被捕获",
    "canonicalQuestionKey": "book-2-p7-35-attention-capture",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.36",
    "nodeCode": "KN-B2-P7-036",
    "titleEn": "Algorithmic Amplification",
    "titleZhHans": "算法如何放大集体现实",
    "canonicalQuestionKey": "book-2-p7-36-algorithmic-amplification",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.37",
    "nodeCode": "KN-B2-P7-037",
    "titleEn": "Viral Runtime",
    "titleZhHans": "病毒式传播如何运行",
    "canonicalQuestionKey": "book-2-p7-37-viral-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.38",
    "nodeCode": "KN-B2-P7-038",
    "titleEn": "AI Attention Architecture",
    "titleZhHans": "AI 如何重构注意力架构",
    "canonicalQuestionKey": "book-2-p7-38-ai-attention-architecture",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.39",
    "nodeCode": "KN-B2-P7-039",
    "titleEn": "Temporal Compression",
    "titleZhHans": "文明如何压缩时间",
    "canonicalQuestionKey": "book-2-p7-39-temporal-compression",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.40",
    "nodeCode": "KN-B2-P7-040",
    "titleEn": "Acceleration Runtime",
    "titleZhHans": "加速如何成为文明运行方式",
    "canonicalQuestionKey": "book-2-p7-40-acceleration-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.41",
    "nodeCode": "KN-B2-P7-041",
    "titleEn": "Productivity Runtime",
    "titleZhHans": "生产力如何组织时间",
    "canonicalQuestionKey": "book-2-p7-41-productivity-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.42",
    "nodeCode": "KN-B2-P7-042",
    "titleEn": "Future Orientation",
    "titleZhHans": "文明为何持续面向未来",
    "canonicalQuestionKey": "book-2-p7-42-future-orientation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.43",
    "nodeCode": "KN-B2-P7-043",
    "titleEn": "Generational Time",
    "titleZhHans": "世代如何形成不同时间尺度",
    "canonicalQuestionKey": "book-2-p7-43-generational-time",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.44",
    "nodeCode": "KN-B2-P7-044",
    "titleEn": "Historical Memory",
    "titleZhHans": "历史如何成为集体记忆",
    "canonicalQuestionKey": "book-2-p7-44-historical-memory",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.45",
    "nodeCode": "KN-B2-P7-045",
    "titleEn": "Civilization Deadline",
    "titleZhHans": "文明为何形成期限",
    "canonicalQuestionKey": "book-2-p7-45-civilization-deadline",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.46",
    "nodeCode": "KN-B2-P7-046",
    "titleEn": "Time Debt",
    "titleZhHans": "时间债务如何形成",
    "canonicalQuestionKey": "book-2-p7-46-time-debt",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.47",
    "nodeCode": "KN-B2-P7-047",
    "titleEn": "Artificial Collective Runtime",
    "titleZhHans": "人工集体如何运行",
    "canonicalQuestionKey": "book-2-p7-47-artificial-collective-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.48",
    "nodeCode": "KN-B2-P7-048",
    "titleEn": "Human-AI Collective",
    "titleZhHans": "人机集体如何形成",
    "canonicalQuestionKey": "book-2-p7-48-human-ai-collective",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.49",
    "nodeCode": "KN-B2-P7-049",
    "titleEn": "Synthetic Culture",
    "titleZhHans": "AI 文化如何形成",
    "canonicalQuestionKey": "book-2-p7-49-synthetic-culture",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.50",
    "nodeCode": "KN-B2-P7-050",
    "titleEn": "Synthetic Value Systems",
    "titleZhHans": "AI 价值系统如何形成",
    "canonicalQuestionKey": "book-2-p7-50-synthetic-value-systems",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.51",
    "nodeCode": "KN-B2-P7-051",
    "titleEn": "Synthetic Coordination",
    "titleZhHans": "AI 如何形成协调机制",
    "canonicalQuestionKey": "book-2-p7-51-synthetic-coordination",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.52",
    "nodeCode": "KN-B2-P7-052",
    "titleEn": "Synthetic Civilization",
    "titleZhHans": "AI 文明雏形如何出现",
    "canonicalQuestionKey": "book-2-p7-52-synthetic-civilization",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.53",
    "nodeCode": "KN-B2-P7-053",
    "titleEn": "Collective Saturation",
    "titleZhHans": "集体现实如何达到饱和",
    "canonicalQuestionKey": "book-2-p7-53-collective-saturation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.54",
    "nodeCode": "KN-B2-P7-054",
    "titleEn": "Collective Fragmentation",
    "titleZhHans": "集体现实如何碎裂",
    "canonicalQuestionKey": "book-2-p7-54-collective-fragmentation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.55",
    "nodeCode": "KN-B2-P7-055",
    "titleEn": "Collective Collapse",
    "titleZhHans": "集体现实如何崩塌",
    "canonicalQuestionKey": "book-2-p7-55-collective-collapse",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.56",
    "nodeCode": "KN-B2-P7-056",
    "titleEn": "Civilization Reconfiguration",
    "titleZhHans": "文明如何重组",
    "canonicalQuestionKey": "book-2-p7-56-civilization-reconfiguration",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P7",
    "chapterCode": "7.57",
    "nodeCode": "KN-B2-P7-057",
    "titleEn": "Civilization Threshold",
    "titleZhHans": "文明如何进入下一阶段",
    "canonicalQuestionKey": "book-2-p7-57-civilization-threshold",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.1",
    "nodeCode": "KN-B2-P8-001",
    "titleEn": "Residual Load",
    "titleZhHans": "运行为何留下残留",
    "canonicalQuestionKey": "book-2-p8-01-residual-load",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.2",
    "nodeCode": "KN-B2-P8-002",
    "titleEn": "Runtime Accumulation",
    "titleZhHans": "Reality 为什么不会自动归零",
    "canonicalQuestionKey": "book-2-p8-02-runtime-accumulation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.3",
    "nodeCode": "KN-B2-P8-003",
    "titleEn": "Runtime Persistence",
    "titleZhHans": "过去为何持续存在",
    "canonicalQuestionKey": "book-2-p8-03-runtime-persistence",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.4",
    "nodeCode": "KN-B2-P8-004",
    "titleEn": "Drift Formation",
    "titleZhHans": "Reality 如何偏离原有轨道",
    "canonicalQuestionKey": "book-2-p8-04-drift-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.5",
    "nodeCode": "KN-B2-P8-005",
    "titleEn": "Distortion Formation",
    "titleZhHans": "Reality 如何逐渐变形",
    "canonicalQuestionKey": "book-2-p8-05-distortion-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.6",
    "nodeCode": "KN-B2-P8-006",
    "titleEn": "Chronic Runtime",
    "titleZhHans": "为何问题长期存在",
    "canonicalQuestionKey": "book-2-p8-06-chronic-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.7",
    "nodeCode": "KN-B2-P8-007",
    "titleEn": "Fragmentation",
    "titleZhHans": "Reality 如何失去整体性",
    "canonicalQuestionKey": "book-2-p8-07-fragmentation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.8",
    "nodeCode": "KN-B2-P8-008",
    "titleEn": "Saturation",
    "titleZhHans": "为何系统无法继续承载",
    "canonicalQuestionKey": "book-2-p8-08-saturation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.9",
    "nodeCode": "KN-B2-P8-009",
    "titleEn": "Friction Signals",
    "titleZhHans": "摩擦如何成为警告信号",
    "canonicalQuestionKey": "book-2-p8-09-friction-signals",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.10",
    "nodeCode": "KN-B2-P8-010",
    "titleEn": "Repetition Patterns",
    "titleZhHans": "重复模式如何成为警告",
    "canonicalQuestionKey": "book-2-p8-10-repetition-patterns",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.11",
    "nodeCode": "KN-B2-P8-011",
    "titleEn": "Chronic Noise",
    "titleZhHans": "慢性噪音如何形成",
    "canonicalQuestionKey": "book-2-p8-11-chronic-noise",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.12",
    "nodeCode": "KN-B2-P8-012",
    "titleEn": "Escalation",
    "titleZhHans": "失稳如何逐步升级",
    "canonicalQuestionKey": "book-2-p8-12-escalation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.13",
    "nodeCode": "KN-B2-P8-013",
    "titleEn": "Threshold Crossing",
    "titleZhHans": "系统如何跨越失稳阈值",
    "canonicalQuestionKey": "book-2-p8-13-threshold-crossing",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.14",
    "nodeCode": "KN-B2-P8-014",
    "titleEn": "Signal Blindness",
    "titleZhHans": "为何系统持续警告却无人察觉",
    "canonicalQuestionKey": "book-2-p8-14-signal-blindness",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.15",
    "nodeCode": "KN-B2-P8-015",
    "titleEn": "Interface Occupancy",
    "titleZhHans": "Reality 如何持续占用资源",
    "canonicalQuestionKey": "book-2-p8-15-interface-occupancy",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.16",
    "nodeCode": "KN-B2-P8-016",
    "titleEn": "Interface Saturation",
    "titleZhHans": "为何系统无法退出运行",
    "canonicalQuestionKey": "book-2-p8-16-interface-saturation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.17",
    "nodeCode": "KN-B2-P8-017",
    "titleEn": "Structural Cost Transfer",
    "titleZhHans": "为何成本最终进入载体",
    "canonicalQuestionKey": "book-2-p8-17-structural-cost-transfer",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.18",
    "nodeCode": "KN-B2-P8-018",
    "titleEn": "Embodied Constraints",
    "titleZhHans": "载体限制如何约束运行",
    "canonicalQuestionKey": "book-2-p8-18-embodied-constraints",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.19",
    "nodeCode": "KN-B2-P8-019",
    "titleEn": "Soft Interruptions",
    "titleZhHans": "为何没有崩溃却无法顺畅运行",
    "canonicalQuestionKey": "book-2-p8-19-soft-interruptions",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.20",
    "nodeCode": "KN-B2-P8-020",
    "titleEn": "Chronic Runtime States",
    "titleZhHans": "慢性运行状态如何形成",
    "canonicalQuestionKey": "book-2-p8-20-chronic-runtime-states",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.21",
    "nodeCode": "KN-B2-P8-021",
    "titleEn": "Responsibility Mapping",
    "titleZhHans": "责任如何转化为运行成本",
    "canonicalQuestionKey": "book-2-p8-21-responsibility-mapping",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.22",
    "nodeCode": "KN-B2-P8-022",
    "titleEn": "Interface Architecture",
    "titleZhHans": "运行接口如何组织",
    "canonicalQuestionKey": "book-2-p8-22-interface-architecture",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.23",
    "nodeCode": "KN-B2-P8-023",
    "titleEn": "Medical Runtime",
    "titleZhHans": "Medical OS 如何成为 Runtime Maintenance Layer",
    "canonicalQuestionKey": "book-2-p8-23-medical-runtime",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.24",
    "nodeCode": "KN-B2-P8-024",
    "titleEn": "Safety Detection",
    "titleZhHans": "系统如何检测安全",
    "canonicalQuestionKey": "book-2-p8-24-safety-detection",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.25",
    "nodeCode": "KN-B2-P8-025",
    "titleEn": "Recovery Permission",
    "titleZhHans": "恢复许可如何形成",
    "canonicalQuestionKey": "book-2-p8-25-recovery-permission",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.26",
    "nodeCode": "KN-B2-P8-026",
    "titleEn": "Recovery Resistance",
    "titleZhHans": "为何系统拒绝恢复",
    "canonicalQuestionKey": "book-2-p8-26-recovery-resistance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.27",
    "nodeCode": "KN-B2-P8-027",
    "titleEn": "Recovery Window",
    "titleZhHans": "恢复窗口如何出现",
    "canonicalQuestionKey": "book-2-p8-27-recovery-window",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.28",
    "nodeCode": "KN-B2-P8-028",
    "titleEn": "Reintegration",
    "titleZhHans": "系统如何重新整合",
    "canonicalQuestionKey": "book-2-p8-28-reintegration",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.29",
    "nodeCode": "KN-B2-P8-029",
    "titleEn": "Runtime Re-entry",
    "titleZhHans": "系统如何重新进入运行",
    "canonicalQuestionKey": "book-2-p8-29-runtime-re-entry",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.30",
    "nodeCode": "KN-B2-P8-030",
    "titleEn": "Recovery Scheduling",
    "titleZhHans": "恢复如何被排程",
    "canonicalQuestionKey": "book-2-p8-30-recovery-scheduling",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.31",
    "nodeCode": "KN-B2-P8-031",
    "titleEn": "Recovery Debt",
    "titleZhHans": "恢复债务如何形成",
    "canonicalQuestionKey": "book-2-p8-31-recovery-debt",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.32",
    "nodeCode": "KN-B2-P8-032",
    "titleEn": "Structural Repair",
    "titleZhHans": "结构如何被修复",
    "canonicalQuestionKey": "book-2-p8-32-structural-repair",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.33",
    "nodeCode": "KN-B2-P8-033",
    "titleEn": "Runtime Rebalancing",
    "titleZhHans": "运行如何重新平衡",
    "canonicalQuestionKey": "book-2-p8-33-runtime-rebalancing",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.34",
    "nodeCode": "KN-B2-P8-034",
    "titleEn": "Recovery Architecture",
    "titleZhHans": "恢复架构如何形成",
    "canonicalQuestionKey": "book-2-p8-34-recovery-architecture",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.35",
    "nodeCode": "KN-B2-P8-035",
    "titleEn": "Nervous Recovery",
    "titleZhHans": "神经系统如何恢复",
    "canonicalQuestionKey": "book-2-p8-35-nervous-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.36",
    "nodeCode": "KN-B2-P8-036",
    "titleEn": "Endocrine Recovery",
    "titleZhHans": "内分泌系统如何恢复",
    "canonicalQuestionKey": "book-2-p8-36-endocrine-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.37",
    "nodeCode": "KN-B2-P8-037",
    "titleEn": "Immune Recovery",
    "titleZhHans": "免疫系统如何恢复",
    "canonicalQuestionKey": "book-2-p8-37-immune-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.38",
    "nodeCode": "KN-B2-P8-038",
    "titleEn": "Metabolic Recovery",
    "titleZhHans": "代谢系统如何恢复",
    "canonicalQuestionKey": "book-2-p8-38-metabolic-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.39",
    "nodeCode": "KN-B2-P8-039",
    "titleEn": "Psychological Recovery",
    "titleZhHans": "心理运行如何恢复",
    "canonicalQuestionKey": "book-2-p8-39-psychological-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.40",
    "nodeCode": "KN-B2-P8-040",
    "titleEn": "AI-Assisted Recovery",
    "titleZhHans": "AI 如何辅助恢复",
    "canonicalQuestionKey": "book-2-p8-40-ai-assisted-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.41",
    "nodeCode": "KN-B2-P8-041",
    "titleEn": "Sustainability",
    "titleZhHans": "可持续运行如何形成",
    "canonicalQuestionKey": "book-2-p8-41-sustainability",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.42",
    "nodeCode": "KN-B2-P8-042",
    "titleEn": "Runtime Resilience",
    "titleZhHans": "运行韧性如何形成",
    "canonicalQuestionKey": "book-2-p8-42-runtime-resilience",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.43",
    "nodeCode": "KN-B2-P8-043",
    "titleEn": "Adaptive Maintenance",
    "titleZhHans": "维护如何适应变化",
    "canonicalQuestionKey": "book-2-p8-43-adaptive-maintenance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.44",
    "nodeCode": "KN-B2-P8-044",
    "titleEn": "Long-Term Continuity",
    "titleZhHans": "Reality 如何形成长期连续性",
    "canonicalQuestionKey": "book-2-p8-44-long-term-continuity",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.45",
    "nodeCode": "KN-B2-P8-045",
    "titleEn": "Self-Maintaining Systems",
    "titleZhHans": "系统如何形成自维护能力",
    "canonicalQuestionKey": "book-2-p8-45-self-maintaining-systems",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.46",
    "nodeCode": "KN-B2-P8-046",
    "titleEn": "Beyond Recovery",
    "titleZhHans": "恢复之后如何进入长期稳定",
    "canonicalQuestionKey": "book-2-p8-46-beyond-recovery",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P8",
    "chapterCode": "8.47",
    "nodeCode": "KN-B2-P8-047",
    "titleEn": "Maintenance Transition",
    "titleZhHans": "维护如何升级为治理",
    "canonicalQuestionKey": "book-2-p8-47-maintenance-transition",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.1",
    "nodeCode": "KN-B2-P9-001",
    "titleEn": "Governance Emergence",
    "titleZhHans": "治理为何出现",
    "canonicalQuestionKey": "book-2-p9-01-governance-emergence",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.2",
    "nodeCode": "KN-B2-P9-002",
    "titleEn": "Coordination Problem",
    "titleZhHans": "为什么复杂系统需要治理",
    "canonicalQuestionKey": "book-2-p9-02-coordination-problem",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.3",
    "nodeCode": "KN-B2-P9-003",
    "titleEn": "Resource Allocation",
    "titleZhHans": "资源如何被分配",
    "canonicalQuestionKey": "book-2-p9-03-resource-allocation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.4",
    "nodeCode": "KN-B2-P9-004",
    "titleEn": "Constraint Management",
    "titleZhHans": "限制如何被管理",
    "canonicalQuestionKey": "book-2-p9-04-constraint-management",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.5",
    "nodeCode": "KN-B2-P9-005",
    "titleEn": "Governance Selection",
    "titleZhHans": "治理为何产生不同形式",
    "canonicalQuestionKey": "book-2-p9-05-governance-selection",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.6",
    "nodeCode": "KN-B2-P9-006",
    "titleEn": "Legitimacy Formation",
    "titleZhHans": "为什么人们接受治理",
    "canonicalQuestionKey": "book-2-p9-06-legitimacy-formation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.7",
    "nodeCode": "KN-B2-P9-007",
    "titleEn": "Compliance Systems",
    "titleZhHans": "治理如何通过服从机制持续存在",
    "canonicalQuestionKey": "book-2-p9-07-compliance-systems",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.8",
    "nodeCode": "KN-B2-P9-008",
    "titleEn": "Market Governance",
    "titleZhHans": "市场治理如何运行",
    "canonicalQuestionKey": "book-2-p9-08-market-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.9",
    "nodeCode": "KN-B2-P9-009",
    "titleEn": "Planned Governance",
    "titleZhHans": "计划治理如何运行",
    "canonicalQuestionKey": "book-2-p9-09-planned-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.10",
    "nodeCode": "KN-B2-P9-010",
    "titleEn": "Religious Governance",
    "titleZhHans": "宗教治理如何运行",
    "canonicalQuestionKey": "book-2-p9-10-religious-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.11",
    "nodeCode": "KN-B2-P9-011",
    "titleEn": "Secular Governance",
    "titleZhHans": "世俗治理如何运行",
    "canonicalQuestionKey": "book-2-p9-11-secular-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.12",
    "nodeCode": "KN-B2-P9-012",
    "titleEn": "Institutional Governance",
    "titleZhHans": "制度治理如何运行",
    "canonicalQuestionKey": "book-2-p9-12-institutional-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.13",
    "nodeCode": "KN-B2-P9-013",
    "titleEn": "Hybrid Governance",
    "titleZhHans": "混合治理如何运行",
    "canonicalQuestionKey": "book-2-p9-13-hybrid-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.14",
    "nodeCode": "KN-B2-P9-014",
    "titleEn": "Network Governance",
    "titleZhHans": "网络与平台治理如何运行",
    "canonicalQuestionKey": "book-2-p9-14-network-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.15",
    "nodeCode": "KN-B2-P9-015",
    "titleEn": "Resource Governance",
    "titleZhHans": "资源如何被治理",
    "canonicalQuestionKey": "book-2-p9-15-resource-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.16",
    "nodeCode": "KN-B2-P9-016",
    "titleEn": "Meaning Governance",
    "titleZhHans": "意义如何被治理",
    "canonicalQuestionKey": "book-2-p9-16-meaning-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.17",
    "nodeCode": "KN-B2-P9-017",
    "titleEn": "Information Governance",
    "titleZhHans": "信息如何被治理",
    "canonicalQuestionKey": "book-2-p9-17-information-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.18",
    "nodeCode": "KN-B2-P9-018",
    "titleEn": "Attention Governance",
    "titleZhHans": "注意力如何被治理",
    "canonicalQuestionKey": "book-2-p9-18-attention-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.19",
    "nodeCode": "KN-B2-P9-019",
    "titleEn": "Power Governance",
    "titleZhHans": "权力如何被治理",
    "canonicalQuestionKey": "book-2-p9-19-power-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.20",
    "nodeCode": "KN-B2-P9-020",
    "titleEn": "Incentive Governance",
    "titleZhHans": "激励如何被治理",
    "canonicalQuestionKey": "book-2-p9-20-incentive-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.21",
    "nodeCode": "KN-B2-P9-021",
    "titleEn": "Risk Governance",
    "titleZhHans": "风险如何被治理",
    "canonicalQuestionKey": "book-2-p9-21-risk-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.22",
    "nodeCode": "KN-B2-P9-022",
    "titleEn": "Complexity Governance",
    "titleZhHans": "复杂度如何被治理",
    "canonicalQuestionKey": "book-2-p9-22-complexity-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.23",
    "nodeCode": "KN-B2-P9-023",
    "titleEn": "Governance Drift",
    "titleZhHans": "治理如何发生漂移",
    "canonicalQuestionKey": "book-2-p9-23-governance-drift",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.24",
    "nodeCode": "KN-B2-P9-024",
    "titleEn": "Governance Saturation",
    "titleZhHans": "治理如何达到饱和",
    "canonicalQuestionKey": "book-2-p9-24-governance-saturation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.25",
    "nodeCode": "KN-B2-P9-025",
    "titleEn": "Governance Fragmentation",
    "titleZhHans": "治理如何碎裂",
    "canonicalQuestionKey": "book-2-p9-25-governance-fragmentation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.26",
    "nodeCode": "KN-B2-P9-026",
    "titleEn": "Legitimacy Collapse",
    "titleZhHans": "合法性如何崩塌",
    "canonicalQuestionKey": "book-2-p9-26-legitimacy-collapse",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.27",
    "nodeCode": "KN-B2-P9-027",
    "titleEn": "Governance Capture",
    "titleZhHans": "治理如何被利益结构俘获",
    "canonicalQuestionKey": "book-2-p9-27-governance-capture",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.28",
    "nodeCode": "KN-B2-P9-028",
    "titleEn": "Governance Collapse",
    "titleZhHans": "治理如何崩塌",
    "canonicalQuestionKey": "book-2-p9-28-governance-collapse",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.29",
    "nodeCode": "KN-B2-P9-029",
    "titleEn": "Algorithmic Governance",
    "titleZhHans": "算法治理如何运行",
    "canonicalQuestionKey": "book-2-p9-29-algorithmic-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.30",
    "nodeCode": "KN-B2-P9-030",
    "titleEn": "Synthetic Coordination",
    "titleZhHans": "人工协调如何运行",
    "canonicalQuestionKey": "book-2-p9-30-synthetic-coordination",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.31",
    "nodeCode": "KN-B2-P9-031",
    "titleEn": "AI-Assisted Governance",
    "titleZhHans": "AI 如何辅助治理",
    "canonicalQuestionKey": "book-2-p9-31-ai-assisted-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.32",
    "nodeCode": "KN-B2-P9-032",
    "titleEn": "Human-AI Governance",
    "titleZhHans": "人机共治如何形成",
    "canonicalQuestionKey": "book-2-p9-32-human-ai-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.33",
    "nodeCode": "KN-B2-P9-033",
    "titleEn": "Autonomous Governance",
    "titleZhHans": "自主治理系统如何形成",
    "canonicalQuestionKey": "book-2-p9-33-autonomous-governance",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.34",
    "nodeCode": "KN-B2-P9-034",
    "titleEn": "Governance Without Humans",
    "titleZhHans": "没有人类的治理是否可能",
    "canonicalQuestionKey": "book-2-p9-34-governance-without-humans",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.35",
    "nodeCode": "KN-B2-P9-035",
    "titleEn": "Governance Resilience",
    "titleZhHans": "治理韧性如何形成",
    "canonicalQuestionKey": "book-2-p9-35-governance-resilience",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.36",
    "nodeCode": "KN-B2-P9-036",
    "titleEn": "Governance Adaptation",
    "titleZhHans": "治理如何适应变化",
    "canonicalQuestionKey": "book-2-p9-36-governance-adaptation",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.37",
    "nodeCode": "KN-B2-P9-037",
    "titleEn": "Governance Evolution",
    "titleZhHans": "治理如何演化",
    "canonicalQuestionKey": "book-2-p9-37-governance-evolution",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.38",
    "nodeCode": "KN-B2-P9-038",
    "titleEn": "Civilizational Coordination",
    "titleZhHans": "文明级协调如何形成",
    "canonicalQuestionKey": "book-2-p9-38-civilizational-coordination",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  },
  {
    "partCode": "P9",
    "chapterCode": "9.39",
    "nodeCode": "KN-B2-P9-039",
    "titleEn": "Governance Transition",
    "titleZhHans": "治理如何迁移",
    "canonicalQuestionKey": "book-2-p9-39-governance-transition",
    "sourceBookCode": "BOOK-2",
    "publicationBookCode": "BOOK-2"
  }
];

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const writeJson = async (path, value) =>
  fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const nodesRegistry = await readJson(nodesPath);
const blueprint = await readJson(blueprintPath);
const packageJson = await readJson(packagePath);

const byCode = new Map(nodesRegistry.nodes.map(node => [node.nodeCode, node]));
const chapterByCode = new Map(chapterNodes.map(node => [node.nodeCode, node]));

const partSequences = new Map();
for (const chapter of chapterNodes) {
  if (!partSequences.has(chapter.partCode)) partSequences.set(chapter.partCode, []);
  partSequences.get(chapter.partCode).push(chapter.nodeCode);
}

const firstByPart = Object.fromEntries(
  [...partSequences].map(([partCode, codes]) => [partCode, codes[0]])
);
const lastByPart = Object.fromEntries(
  [...partSequences].map(([partCode, codes]) => [partCode, codes[codes.length - 1]])
);

function relationshipSet(chapter) {
  const sequence = partSequences.get(chapter.partCode);
  const index = sequence.indexOf(chapter.nodeCode);
  const partNumber = Number(chapter.partCode.slice(1));
  const previous = index > 0
    ? sequence[index - 1]
    : firstByPart[`P${partNumber - 1}`] ? lastByPart[`P${partNumber - 1}`] : null;
  const next = index < sequence.length - 1
    ? sequence[index + 1]
    : firstByPart[`P${partNumber + 1}`] || null;

  const dependencies = previous ? [previous] : [];
  const related = [];
  if (partNumber === 5 && chapter.chapterCode === '5.65') related.push(firstByPart.P6);
  if (partNumber === 6 && chapter.chapterCode === '6.58') related.push(firstByPart.P7);
  if (partNumber === 7 && chapter.chapterCode === '7.57') related.push(firstByPart.P8);
  if (partNumber === 8 && chapter.chapterCode === '8.47') related.push(firstByPart.P9);

  return {
    prerequisiteNodeCodes: dependencies,
    nextNodeCodes: next ? [next] : [],
    relatedNodeCodes: related,
    parentNodeCodes: [],
    childNodeCodes: []
  };
}

for (const chapter of chapterNodes) {
  const existing = byCode.get(chapter.nodeCode);
  const relationship = relationshipSet(chapter);
  const common = {
    collectionCode: `KC-BOOK-2-P${chapter.partCode.slice(1)}`,
    themeCode: `TH-BOOK-2-${chapter.partCode}`,
    canonicalQuestionKey: chapter.canonicalQuestionKey,
    nodeType: 'mechanism_question',
    knowledgeLevel: 'foundational',
    productionTier: 'tier_b',
    primaryAssetType: 'article',
    canonicalLanguage: 'zh-Hans',
    requiredPublicLanguages: ['zh-Hans', 'en'],
    registryStatus: existing?.registryStatus === 'draft' ? 'draft' : 'planned',
    productionQueue: 'not_scheduled',
    productionEffort: 'unassessed',
    publicationPriority: 'not_scheduled',
    supportingQuestionCodes: existing?.supportingQuestionCodes || [],
    legacyNodeCodes: existing?.legacyNodeCodes || [],
    relationships: relationship,
    dependencies: relationship.prerequisiteNodeCodes,
    crossSessionNode: {
      enabled: true,
      scope: 'book-2',
      continuityKey: `BOOK-2:${chapter.partCode}:${chapter.chapterCode}`,
      previousNodeCode: relationship.prerequisiteNodeCodes[0] || null,
      nextNodeCode: relationship.nextNodeCodes[0] || null
    },
    chapterCode: chapter.chapterCode,
    partCode: chapter.partCode,
    sourceBookCode: chapter.sourceBookCode,
    publicationBookCode: chapter.publicationBookCode,
    publicationPartCode: chapter.partCode,
    titleEn: chapter.titleEn,
    titleZhHans: chapter.titleZhHans,
    productionReady: false,
    articleStatus: 'not_created',
    candidateStatus: 'not_created',
    version: '2.0.0'
  };

  if (existing) {
    Object.assign(existing, common);
  } else {
    const node = { nodeCode: chapter.nodeCode, ...common, sourceReferences: [] };
    nodesRegistry.nodes.push(node);
    byCode.set(node.nodeCode, node);
  }
}

nodesRegistry.version = '2.0.0';

blueprint.contract = 'PHI-OS-BOOK-2-KNOWLEDGE-BLUEPRINT-v2.0.0';
blueprint.schemaVersion = 'PHI-OS-KNOWLEDGE-BLUEPRINT-v2.0.0';
blueprint.status = 'registry-complete-planning';
blueprint.sourceParts = 5;
blueprint.plannedCanonicalNodes = chapterNodes.length;
blueprint.newNodesBeyondPreface = chapterNodes.length;
blueprint.activeProductionLimit = 0;
blueprint.productionPolicy = {
  articleGenerationAllowed: false,
  candidateGenerationAllowed: false,
  productionReadyPromotionAllowed: false,
  allowedRegistryStatuses: ['planned', 'draft'],
  productionRequiresStage: 'KH-W4K'
};
blueprint.parts = [5,6,7,8,9].map(partNumber => {
  const entries = chapterNodes.filter(node => node.partCode === `P${partNumber}`);
  return {
    partCode: `P${partNumber}`,
    title: {
      P5: '第五部｜意识运行',
      P6: '第六部｜关系运行',
      P7: '第七部｜集体运行',
      P8: '第八部｜运行维护',
      P9: '第九部｜治理运行'
    }[`P${partNumber}`],
    canonicalNodeCount: entries.length,
    nodes: entries.map(node => node.nodeCode)
  };
});
blueprint.nodes = chapterNodes.map(chapter => {
  const node = byCode.get(chapter.nodeCode);
  return {
    nodeCode: node.nodeCode,
    chapterCode: node.chapterCode,
    titleZhHans: node.titleZhHans,
    titleEn: node.titleEn,
    partCode: node.partCode,
    status: node.registryStatus,
    productionPriority: 'not_scheduled',
    articleRequiredNow: false,
    publicLanguagePlan: ['zh-Hans', 'en'],
    sourceRole: 'canonical-mechanism',
    crossSessionNode: node.crossSessionNode,
    relationships: node.relationships,
    dependencies: node.dependencies
  };
});
blueprint.releaseRecommendation = {
  wave1: [],
  wave2: [],
  remaining: 'All Book 2 nodes remain planned or draft until KH-W4K Registry Authority freeze.'
};
blueprint.registryCompletion = {
  stage: 'KH-W4B.5',
  baselineFullCommitSha: BASELINE,
  parts: ['P5','P6','P7','P8','P9'],
  canonicalNodeCount: chapterNodes.length,
  permanentIdentityAssigned: true,
  crossSessionRelationshipsAssigned: true
};

packageJson.scripts['knowledge:complete-book-2-registry'] =
  'node scripts/complete-kh-w4b5-book-2-canonical-node-registry.mjs';
packageJson.scripts['check:kh-w4b.5-book-2'] =
  'node scripts/check-kh-w4b5-book-2-canonical-node-registry.mjs';
const gate = 'node scripts/check-kh-w4b5-book-2-canonical-node-registry.mjs';
if (!packageJson.scripts.precheck.includes(gate)) {
  packageJson.scripts.precheck = `${packageJson.scripts.precheck} && ${gate}`;
}

await writeJson(nodesPath, nodesRegistry);
await writeJson(blueprintPath, blueprint);
await writeJson(packagePath, packageJson);

console.log(`✓ KH-W4B.5 Book 2 registry completed: ${chapterNodes.length} canonical nodes.`);
console.log('✓ Part 5 legacy node identities retained.');
console.log('✓ No Article, Candidate, Readiness, Review, Approval or Publication state generated.');
console.log('Run: npm run knowledge:freeze');
