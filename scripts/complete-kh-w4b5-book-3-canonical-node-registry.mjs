import fs from 'node:fs/promises';

const BASELINE = '7bca88e28a0da2930ef8e121fddd956d82c351e0';
const nodesPath = 'content/knowledge/registry/nodes.json';
const blueprintPath = 'content/knowledge/blueprints/book-3-knowledge-blueprint.json';
const packagePath = 'package.json';

const chapters = [
  {
    "partCode": "P10",
    "chapterCode": "10.1",
    "nodeCode": "KN-B3-P10-001",
    "titleEn": "Civilization Migration",
    "titleZhHans": "文明本质为何是迁移过程",
    "canonicalQuestionKey": "book-3-p10-01-civilization-migration"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.2",
    "nodeCode": "KN-B3-P10-002",
    "titleEn": "Selection Pressure",
    "titleZhHans": "什么推动文明改变",
    "canonicalQuestionKey": "book-3-p10-02-selection-pressure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.3",
    "nodeCode": "KN-B3-P10-003",
    "titleEn": "Complexity Gradient",
    "titleZhHans": "复杂度如何推动迁移",
    "canonicalQuestionKey": "book-3-p10-03-complexity-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.4",
    "nodeCode": "KN-B3-P10-004",
    "titleEn": "Stability Gradient",
    "titleZhHans": "稳定性如何主导文明方向",
    "canonicalQuestionKey": "book-3-p10-04-stability-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.5",
    "nodeCode": "KN-B3-P10-005",
    "titleEn": "Resource Gradient",
    "titleZhHans": "资源如何改变文明轨迹",
    "canonicalQuestionKey": "book-3-p10-05-resource-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.6",
    "nodeCode": "KN-B3-P10-006",
    "titleEn": "Meaning Gradient",
    "titleZhHans": "意义如何改变文明轨迹",
    "canonicalQuestionKey": "book-3-p10-06-meaning-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.7",
    "nodeCode": "KN-B3-P10-007",
    "titleEn": "Information Gradient",
    "titleZhHans": "信息如何改变文明轨迹",
    "canonicalQuestionKey": "book-3-p10-07-information-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.8",
    "nodeCode": "KN-B3-P10-008",
    "titleEn": "Civilization Drift",
    "titleZhHans": "文明如何开始偏移",
    "canonicalQuestionKey": "book-3-p10-08-civilization-drift"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.9",
    "nodeCode": "KN-B3-P10-009",
    "titleEn": "Migration Threshold",
    "titleZhHans": "文明何时进入迁移",
    "canonicalQuestionKey": "book-3-p10-09-migration-threshold"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.10",
    "nodeCode": "KN-B3-P10-010",
    "titleEn": "Emergence",
    "titleZhHans": "文明如何出现",
    "canonicalQuestionKey": "book-3-p10-10-emergence"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.11",
    "nodeCode": "KN-B3-P10-011",
    "titleEn": "Stabilization",
    "titleZhHans": "文明如何稳定",
    "canonicalQuestionKey": "book-3-p10-11-stabilization"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.12",
    "nodeCode": "KN-B3-P10-012",
    "titleEn": "Expansion",
    "titleZhHans": "文明如何扩张",
    "canonicalQuestionKey": "book-3-p10-12-expansion"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.13",
    "nodeCode": "KN-B3-P10-013",
    "titleEn": "Saturation",
    "titleZhHans": "文明如何饱和",
    "canonicalQuestionKey": "book-3-p10-13-saturation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.14",
    "nodeCode": "KN-B3-P10-014",
    "titleEn": "Fragmentation",
    "titleZhHans": "文明如何碎裂",
    "canonicalQuestionKey": "book-3-p10-14-fragmentation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.15",
    "nodeCode": "KN-B3-P10-015",
    "titleEn": "Collapse",
    "titleZhHans": "文明如何崩塌",
    "canonicalQuestionKey": "book-3-p10-15-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.16",
    "nodeCode": "KN-B3-P10-016",
    "titleEn": "Civilization Compression",
    "titleZhHans": "文明如何被压缩",
    "canonicalQuestionKey": "book-3-p10-16-civilization-compression"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.17",
    "nodeCode": "KN-B3-P10-017",
    "titleEn": "Reconfiguration",
    "titleZhHans": "文明如何重组",
    "canonicalQuestionKey": "book-3-p10-17-reconfiguration"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.18",
    "nodeCode": "KN-B3-P10-018",
    "titleEn": "Successor Systems",
    "titleZhHans": "继任文明如何出现",
    "canonicalQuestionKey": "book-3-p10-18-successor-systems"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.19",
    "nodeCode": "KN-B3-P10-019",
    "titleEn": "Human Nodes",
    "titleZhHans": "个体如何成为文明节点",
    "canonicalQuestionKey": "book-3-p10-19-human-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.20",
    "nodeCode": "KN-B3-P10-020",
    "titleEn": "Architect Nodes",
    "titleZhHans": "架构者如何成为文明节点",
    "canonicalQuestionKey": "book-3-p10-20-architect-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.21",
    "nodeCode": "KN-B3-P10-021",
    "titleEn": "Institutional Nodes",
    "titleZhHans": "制度如何成为文明节点",
    "canonicalQuestionKey": "book-3-p10-21-institutional-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.22",
    "nodeCode": "KN-B3-P10-022",
    "titleEn": "Financial Nodes",
    "titleZhHans": "资本如何成为文明节点",
    "canonicalQuestionKey": "book-3-p10-22-financial-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.23",
    "nodeCode": "KN-B3-P10-023",
    "titleEn": "Entertainment Nodes",
    "titleZhHans": "娱乐如何成为文明承载器",
    "canonicalQuestionKey": "book-3-p10-23-entertainment-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.24",
    "nodeCode": "KN-B3-P10-024",
    "titleEn": "AI Nodes",
    "titleZhHans": "人工智能如何成为文明节点",
    "canonicalQuestionKey": "book-3-p10-24-ai-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.25",
    "nodeCode": "KN-B3-P10-025",
    "titleEn": "Civilization Archetypes",
    "titleZhHans": "文明原型如何形成",
    "canonicalQuestionKey": "book-3-p10-25-civilization-archetypes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.26",
    "nodeCode": "KN-B3-P10-026",
    "titleEn": "Compression Nodes",
    "titleZhHans": "压缩节点如何迁移文明",
    "canonicalQuestionKey": "book-3-p10-26-compression-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.27",
    "nodeCode": "KN-B3-P10-027",
    "titleEn": "Node Transition",
    "titleZhHans": "文明节点如何迁移",
    "canonicalQuestionKey": "book-3-p10-27-node-transition"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.28",
    "nodeCode": "KN-B3-P10-028",
    "titleEn": "Compression Runtime",
    "titleZhHans": "文明压缩如何成为持续运行机制",
    "canonicalQuestionKey": "book-3-p10-28-compression-runtime"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.29",
    "nodeCode": "KN-B3-P10-029",
    "titleEn": "Complexity Overload",
    "titleZhHans": "文明如何发生复杂度过载",
    "canonicalQuestionKey": "book-3-p10-29-complexity-overload"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.30",
    "nodeCode": "KN-B3-P10-030",
    "titleEn": "Structural Rigidity",
    "titleZhHans": "文明结构为何僵化",
    "canonicalQuestionKey": "book-3-p10-30-structural-rigidity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.31",
    "nodeCode": "KN-B3-P10-031",
    "titleEn": "Collective Misalignment",
    "titleZhHans": "集体为何发生失配",
    "canonicalQuestionKey": "book-3-p10-31-collective-misalignment"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.32",
    "nodeCode": "KN-B3-P10-032",
    "titleEn": "Growth Dependency",
    "titleZhHans": "文明为何依赖成长",
    "canonicalQuestionKey": "book-3-p10-32-growth-dependency"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.33",
    "nodeCode": "KN-B3-P10-033",
    "titleEn": "Migration Resistance",
    "titleZhHans": "文明为何抗拒改变",
    "canonicalQuestionKey": "book-3-p10-33-migration-resistance"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.34",
    "nodeCode": "KN-B3-P10-034",
    "titleEn": "Migration Triggers",
    "titleZhHans": "文明为何突然改变",
    "canonicalQuestionKey": "book-3-p10-34-migration-triggers"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.35",
    "nodeCode": "KN-B3-P10-035",
    "titleEn": "Coordination Failure",
    "titleZhHans": "文明协调为何失败",
    "canonicalQuestionKey": "book-3-p10-35-coordination-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.36",
    "nodeCode": "KN-B3-P10-036",
    "titleEn": "Runtime Saturation",
    "titleZhHans": "文明运行如何达到饱和",
    "canonicalQuestionKey": "book-3-p10-36-runtime-saturation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.37",
    "nodeCode": "KN-B3-P10-037",
    "titleEn": "Adaptive Capacity",
    "titleZhHans": "文明适应能力如何形成",
    "canonicalQuestionKey": "book-3-p10-37-adaptive-capacity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.38",
    "nodeCode": "KN-B3-P10-038",
    "titleEn": "Structural Cost",
    "titleZhHans": "文明如何产生结构成本",
    "canonicalQuestionKey": "book-3-p10-38-structural-cost"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.39",
    "nodeCode": "KN-B3-P10-039",
    "titleEn": "Runtime Debt",
    "titleZhHans": "文明如何形成运行债务",
    "canonicalQuestionKey": "book-3-p10-39-runtime-debt"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.40",
    "nodeCode": "KN-B3-P10-040",
    "titleEn": "Cost Deferral",
    "titleZhHans": "文明如何递延成本",
    "canonicalQuestionKey": "book-3-p10-40-cost-deferral"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.41",
    "nodeCode": "KN-B3-P10-041",
    "titleEn": "Resource Compression",
    "titleZhHans": "文明如何压缩资源",
    "canonicalQuestionKey": "book-3-p10-41-resource-compression"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.42",
    "nodeCode": "KN-B3-P10-042",
    "titleEn": "Generational Transfer",
    "titleZhHans": "文明成本如何代际转移",
    "canonicalQuestionKey": "book-3-p10-42-generational-transfer"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.43",
    "nodeCode": "KN-B3-P10-043",
    "titleEn": "Cost Inflation",
    "titleZhHans": "文明成本如何膨胀",
    "canonicalQuestionKey": "book-3-p10-43-cost-inflation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.44",
    "nodeCode": "KN-B3-P10-044",
    "titleEn": "Hidden Subsidies",
    "titleZhHans": "隐藏补贴如何维持文明",
    "canonicalQuestionKey": "book-3-p10-44-hidden-subsidies"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.45",
    "nodeCode": "KN-B3-P10-045",
    "titleEn": "Civilization Future Extraction",
    "titleZhHans": "文明如何提前提取未来",
    "canonicalQuestionKey": "book-3-p10-45-civilization-future-extraction"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.46",
    "nodeCode": "KN-B3-P10-046",
    "titleEn": "Biological Continuity",
    "titleZhHans": "文明如何维持生物连续性",
    "canonicalQuestionKey": "book-3-p10-46-biological-continuity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.47",
    "nodeCode": "KN-B3-P10-047",
    "titleEn": "Civilization Continuity",
    "titleZhHans": "文明如何维持自身连续性",
    "canonicalQuestionKey": "book-3-p10-47-civilization-continuity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.48",
    "nodeCode": "KN-B3-P10-048",
    "titleEn": "Reproduction Is Not Continuity",
    "titleZhHans": "为什么繁衍不等于连续性",
    "canonicalQuestionKey": "book-3-p10-48-reproduction-is-not-continuity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.49",
    "nodeCode": "KN-B3-P10-049",
    "titleEn": "Future Confidence",
    "titleZhHans": "未来信心如何形成",
    "canonicalQuestionKey": "book-3-p10-49-future-confidence"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.50",
    "nodeCode": "KN-B3-P10-050",
    "titleEn": "Civilization Selection",
    "titleZhHans": "文明如何选择未来",
    "canonicalQuestionKey": "book-3-p10-50-civilization-selection"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.51",
    "nodeCode": "KN-B3-P10-051",
    "titleEn": "Low Fertility Systems",
    "titleZhHans": "低生育率系统如何形成",
    "canonicalQuestionKey": "book-3-p10-51-low-fertility-systems"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.52",
    "nodeCode": "KN-B3-P10-052",
    "titleEn": "Population Compression",
    "titleZhHans": "人口如何被压缩",
    "canonicalQuestionKey": "book-3-p10-52-population-compression"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.53",
    "nodeCode": "KN-B3-P10-053",
    "titleEn": "Replacement Failure",
    "titleZhHans": "文明替代为何失败",
    "canonicalQuestionKey": "book-3-p10-53-replacement-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.54",
    "nodeCode": "KN-B3-P10-054",
    "titleEn": "Future Production Failure",
    "titleZhHans": "文明如何停止生产未来",
    "canonicalQuestionKey": "book-3-p10-54-future-production-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.55",
    "nodeCode": "KN-B3-P10-055",
    "titleEn": "Continuity Collapse",
    "titleZhHans": "文明连续性如何崩塌",
    "canonicalQuestionKey": "book-3-p10-55-continuity-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.56",
    "nodeCode": "KN-B3-P10-056",
    "titleEn": "Asymptomatic Failure",
    "titleZhHans": "文明如何无症状失败",
    "canonicalQuestionKey": "book-3-p10-56-asymptomatic-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.57",
    "nodeCode": "KN-B3-P10-057",
    "titleEn": "Structural Cost Deferral",
    "titleZhHans": "结构成本如何被隐藏",
    "canonicalQuestionKey": "book-3-p10-57-structural-cost-deferral"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.58",
    "nodeCode": "KN-B3-P10-058",
    "titleEn": "Invisible Collapse",
    "titleZhHans": "隐性崩塌如何发生",
    "canonicalQuestionKey": "book-3-p10-58-invisible-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.59",
    "nodeCode": "KN-B3-P10-059",
    "titleEn": "Running Is Not Healthy",
    "titleZhHans": "为什么运行不等于健康",
    "canonicalQuestionKey": "book-3-p10-59-running-is-not-healthy"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.60",
    "nodeCode": "KN-B3-P10-060",
    "titleEn": "Growth Hides Collapse",
    "titleZhHans": "成长如何掩盖崩塌",
    "canonicalQuestionKey": "book-3-p10-60-growth-hides-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.61",
    "nodeCode": "KN-B3-P10-061",
    "titleEn": "Debt-Fed Stability",
    "titleZhHans": "债务如何喂养稳定",
    "canonicalQuestionKey": "book-3-p10-61-debt-fed-stability"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.62",
    "nodeCode": "KN-B3-P10-062",
    "titleEn": "High Burn Systems",
    "titleZhHans": "高消耗系统如何形成",
    "canonicalQuestionKey": "book-3-p10-62-high-burn-systems"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.63",
    "nodeCode": "KN-B3-P10-063",
    "titleEn": "Delayed Breakdown",
    "titleZhHans": "文明为何延迟崩坏",
    "canonicalQuestionKey": "book-3-p10-63-delayed-breakdown"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.64",
    "nodeCode": "KN-B3-P10-064",
    "titleEn": "Technology as Compression",
    "titleZhHans": "技术如何成为压缩器",
    "canonicalQuestionKey": "book-3-p10-64-technology-as-compression"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.65",
    "nodeCode": "KN-B3-P10-065",
    "titleEn": "Synthetic Coordination",
    "titleZhHans": "AI 如何降低协调成本",
    "canonicalQuestionKey": "book-3-p10-65-synthetic-coordination"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.66",
    "nodeCode": "KN-B3-P10-066",
    "titleEn": "Information Locking",
    "titleZhHans": "信息如何被锁定",
    "canonicalQuestionKey": "book-3-p10-66-information-locking"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.67",
    "nodeCode": "KN-B3-P10-067",
    "titleEn": "AI Runtime Civilization",
    "titleZhHans": "AI 运行文明如何形成",
    "canonicalQuestionKey": "book-3-p10-67-ai-runtime-civilization"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.68",
    "nodeCode": "KN-B3-P10-068",
    "titleEn": "Synthetic Governance",
    "titleZhHans": "人工治理如何形成",
    "canonicalQuestionKey": "book-3-p10-68-synthetic-governance"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.69",
    "nodeCode": "KN-B3-P10-069",
    "titleEn": "Human-AI Coordination",
    "titleZhHans": "人机如何协调",
    "canonicalQuestionKey": "book-3-p10-69-human-ai-coordination"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.70",
    "nodeCode": "KN-B3-P10-070",
    "titleEn": "Civilization Interface Shift",
    "titleZhHans": "文明接口如何迁移",
    "canonicalQuestionKey": "book-3-p10-70-civilization-interface-shift"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.71",
    "nodeCode": "KN-B3-P10-071",
    "titleEn": "Post-Human Carriers",
    "titleZhHans": "后人类载体如何出现",
    "canonicalQuestionKey": "book-3-p10-71-post-human-carriers"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.72",
    "nodeCode": "KN-B3-P10-072",
    "titleEn": "Successor Civilizations",
    "titleZhHans": "继任文明如何形成",
    "canonicalQuestionKey": "book-3-p10-72-successor-civilizations"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.73",
    "nodeCode": "KN-B3-P10-073",
    "titleEn": "Artificial Civilizations",
    "titleZhHans": "人工文明如何形成",
    "canonicalQuestionKey": "book-3-p10-73-artificial-civilizations"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.74",
    "nodeCode": "KN-B3-P10-074",
    "titleEn": "Hybrid Civilizations",
    "titleZhHans": "混合文明如何形成",
    "canonicalQuestionKey": "book-3-p10-74-hybrid-civilizations"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.75",
    "nodeCode": "KN-B3-P10-075",
    "titleEn": "Civilization Transition Selection",
    "titleZhHans": "文明如何选择迁移路径",
    "canonicalQuestionKey": "book-3-p10-75-civilization-transition-selection"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.76",
    "nodeCode": "KN-B3-P10-076",
    "titleEn": "Civilization Transition",
    "titleZhHans": "文明如何进入下一运行阶段",
    "canonicalQuestionKey": "book-3-p10-76-civilization-transition"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.77",
    "nodeCode": "KN-B3-P10-077",
    "titleEn": "The Final Runtime Question",
    "titleZhHans": "世界将如何继续",
    "canonicalQuestionKey": "book-3-p10-77-the-final-runtime-question"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.1",
    "nodeCode": "KN-B3-P11-001",
    "titleEn": "Civilization Function",
    "titleZhHans": "文明承担什么功能",
    "canonicalQuestionKey": "book-3-p11-01-civilization-function"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.2",
    "nodeCode": "KN-B3-P11-002",
    "titleEn": "Innovation Ecology",
    "titleZhHans": "创新生态如何形成",
    "canonicalQuestionKey": "book-3-p11-02-innovation-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.3",
    "nodeCode": "KN-B3-P11-003",
    "titleEn": "Scale Ecology",
    "titleZhHans": "规模生态如何形成",
    "canonicalQuestionKey": "book-3-p11-03-scale-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.4",
    "nodeCode": "KN-B3-P11-004",
    "titleEn": "Entertainment Ecology",
    "titleZhHans": "娱乐生态如何形成",
    "canonicalQuestionKey": "book-3-p11-04-entertainment-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.5",
    "nodeCode": "KN-B3-P11-005",
    "titleEn": "Archetype Ecology",
    "titleZhHans": "原型生态如何形成",
    "canonicalQuestionKey": "book-3-p11-05-archetype-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.6",
    "nodeCode": "KN-B3-P11-006",
    "titleEn": "Governance Ecology",
    "titleZhHans": "治理生态如何形成",
    "canonicalQuestionKey": "book-3-p11-06-governance-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.7",
    "nodeCode": "KN-B3-P11-007",
    "titleEn": "Translation Ecology",
    "titleZhHans": "翻译生态如何形成",
    "canonicalQuestionKey": "book-3-p11-07-translation-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.8",
    "nodeCode": "KN-B3-P11-008",
    "titleEn": "Resource Ecology",
    "titleZhHans": "资源生态如何形成",
    "canonicalQuestionKey": "book-3-p11-08-resource-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.9",
    "nodeCode": "KN-B3-P11-009",
    "titleEn": "Financial Ecology",
    "titleZhHans": "金融生态如何形成",
    "canonicalQuestionKey": "book-3-p11-09-financial-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.10",
    "nodeCode": "KN-B3-P11-010",
    "titleEn": "Security Ecology",
    "titleZhHans": "安全生态如何形成",
    "canonicalQuestionKey": "book-3-p11-10-security-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.11",
    "nodeCode": "KN-B3-P11-011",
    "titleEn": "Meaning Ecology",
    "titleZhHans": "意义生态如何形成",
    "canonicalQuestionKey": "book-3-p11-11-meaning-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.12",
    "nodeCode": "KN-B3-P11-012",
    "titleEn": "Hybrid Functions",
    "titleZhHans": "文明如何承担多个功能",
    "canonicalQuestionKey": "book-3-p11-12-hybrid-functions"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.13",
    "nodeCode": "KN-B3-P11-013",
    "titleEn": "Legacy Civilization",
    "titleZhHans": "遗产文明如何形成",
    "canonicalQuestionKey": "book-3-p11-13-legacy-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.14",
    "nodeCode": "KN-B3-P11-014",
    "titleEn": "Innovation Civilization",
    "titleZhHans": "创新文明如何形成",
    "canonicalQuestionKey": "book-3-p11-14-innovation-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.15",
    "nodeCode": "KN-B3-P11-015",
    "titleEn": "Scale Civilization",
    "titleZhHans": "规模文明如何形成",
    "canonicalQuestionKey": "book-3-p11-15-scale-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.16",
    "nodeCode": "KN-B3-P11-016",
    "titleEn": "Frontier Civilization",
    "titleZhHans": "边疆文明如何形成",
    "canonicalQuestionKey": "book-3-p11-16-frontier-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.17",
    "nodeCode": "KN-B3-P11-017",
    "titleEn": "Fortress Civilization",
    "titleZhHans": "堡垒文明如何形成",
    "canonicalQuestionKey": "book-3-p11-17-fortress-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.18",
    "nodeCode": "KN-B3-P11-018",
    "titleEn": "Closed Runtime Civilization",
    "titleZhHans": "封闭文明如何形成",
    "canonicalQuestionKey": "book-3-p11-18-closed-runtime-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.19",
    "nodeCode": "KN-B3-P11-019",
    "titleEn": "Fragmented Civilization",
    "titleZhHans": "碎片文明如何形成",
    "canonicalQuestionKey": "book-3-p11-19-fragmented-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.20",
    "nodeCode": "KN-B3-P11-020",
    "titleEn": "Expansion Civilization",
    "titleZhHans": "扩张文明如何形成",
    "canonicalQuestionKey": "book-3-p11-20-expansion-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.21",
    "nodeCode": "KN-B3-P11-021",
    "titleEn": "Hybrid Civilization",
    "titleZhHans": "混合文明如何形成",
    "canonicalQuestionKey": "book-3-p11-21-hybrid-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.22",
    "nodeCode": "KN-B3-P11-022",
    "titleEn": "North America Ecology",
    "titleZhHans": "北美文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-22-north-america-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.23",
    "nodeCode": "KN-B3-P11-023",
    "titleEn": "Europe Ecology",
    "titleZhHans": "欧洲文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-23-europe-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.24",
    "nodeCode": "KN-B3-P11-024",
    "titleEn": "East Asia Ecology",
    "titleZhHans": "东亚文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-24-east-asia-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.25",
    "nodeCode": "KN-B3-P11-025",
    "titleEn": "South Asia Ecology",
    "titleZhHans": "南亚文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-25-south-asia-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.26",
    "nodeCode": "KN-B3-P11-026",
    "titleEn": "Southeast Asia Ecology",
    "titleZhHans": "东南亚文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-26-southeast-asia-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.27",
    "nodeCode": "KN-B3-P11-027",
    "titleEn": "Middle East Ecology",
    "titleZhHans": "中东文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-27-middle-east-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.28",
    "nodeCode": "KN-B3-P11-028",
    "titleEn": "Africa Ecology",
    "titleZhHans": "非洲文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-28-africa-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.29",
    "nodeCode": "KN-B3-P11-029",
    "titleEn": "Latin America Ecology",
    "titleZhHans": "拉丁美洲文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-29-latin-america-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.30",
    "nodeCode": "KN-B3-P11-030",
    "titleEn": "Oceania Ecology",
    "titleZhHans": "大洋洲文明生态如何形成",
    "canonicalQuestionKey": "book-3-p11-30-oceania-ecology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.31",
    "nodeCode": "KN-B3-P11-031",
    "titleEn": "Frontier Ecologies",
    "titleZhHans": "边疆与极地生态如何形成",
    "canonicalQuestionKey": "book-3-p11-31-frontier-ecologies"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.32",
    "nodeCode": "KN-B3-P11-032",
    "titleEn": "Cooperation",
    "titleZhHans": "文明如何合作",
    "canonicalQuestionKey": "book-3-p11-32-cooperation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.33",
    "nodeCode": "KN-B3-P11-033",
    "titleEn": "Competition",
    "titleZhHans": "文明如何竞争",
    "canonicalQuestionKey": "book-3-p11-33-competition"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.34",
    "nodeCode": "KN-B3-P11-034",
    "titleEn": "Dependency",
    "titleZhHans": "文明如何形成依赖",
    "canonicalQuestionKey": "book-3-p11-34-dependency"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.35",
    "nodeCode": "KN-B3-P11-035",
    "titleEn": "Translation",
    "titleZhHans": "文明如何彼此翻译",
    "canonicalQuestionKey": "book-3-p11-35-translation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.36",
    "nodeCode": "KN-B3-P11-036",
    "titleEn": "Absorption",
    "titleZhHans": "文明如何彼此吸收",
    "canonicalQuestionKey": "book-3-p11-36-absorption"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.37",
    "nodeCode": "KN-B3-P11-037",
    "titleEn": "Resistance",
    "titleZhHans": "文明如何彼此抵抗",
    "canonicalQuestionKey": "book-3-p11-37-resistance"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.38",
    "nodeCode": "KN-B3-P11-038",
    "titleEn": "Civilization Diffusion",
    "titleZhHans": "文明如何扩散",
    "canonicalQuestionKey": "book-3-p11-38-civilization-diffusion"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.39",
    "nodeCode": "KN-B3-P11-039",
    "titleEn": "Runtime Conflict",
    "titleZhHans": "文明冲突如何形成",
    "canonicalQuestionKey": "book-3-p11-39-runtime-conflict"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.40",
    "nodeCode": "KN-B3-P11-040",
    "titleEn": "Attention Migration",
    "titleZhHans": "注意力如何迁移",
    "canonicalQuestionKey": "book-3-p11-40-attention-migration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.41",
    "nodeCode": "KN-B3-P11-041",
    "titleEn": "Capital Migration",
    "titleZhHans": "资本如何迁移",
    "canonicalQuestionKey": "book-3-p11-41-capital-migration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.42",
    "nodeCode": "KN-B3-P11-042",
    "titleEn": "Manufacturing Migration",
    "titleZhHans": "制造如何迁移",
    "canonicalQuestionKey": "book-3-p11-42-manufacturing-migration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.43",
    "nodeCode": "KN-B3-P11-043",
    "titleEn": "Population Migration",
    "titleZhHans": "人口如何迁移",
    "canonicalQuestionKey": "book-3-p11-43-population-migration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.44",
    "nodeCode": "KN-B3-P11-044",
    "titleEn": "Meaning Migration",
    "titleZhHans": "意义如何迁移",
    "canonicalQuestionKey": "book-3-p11-44-meaning-migration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.45",
    "nodeCode": "KN-B3-P11-045",
    "titleEn": "Technology Migration",
    "titleZhHans": "技术如何迁移",
    "canonicalQuestionKey": "book-3-p11-45-technology-migration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.46",
    "nodeCode": "KN-B3-P11-046",
    "titleEn": "AI Migration",
    "titleZhHans": "AI 如何迁移",
    "canonicalQuestionKey": "book-3-p11-46-ai-migration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.47",
    "nodeCode": "KN-B3-P11-047",
    "titleEn": "Function Transfer",
    "titleZhHans": "文明功能如何转移",
    "canonicalQuestionKey": "book-3-p11-47-function-transfer"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.48",
    "nodeCode": "KN-B3-P11-048",
    "titleEn": "Civilization Succession",
    "titleZhHans": "文明如何继承",
    "canonicalQuestionKey": "book-3-p11-48-civilization-succession"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.49",
    "nodeCode": "KN-B3-P11-049",
    "titleEn": "Platform Ecologies",
    "titleZhHans": "平台生态如何形成",
    "canonicalQuestionKey": "book-3-p11-49-platform-ecologies"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.50",
    "nodeCode": "KN-B3-P11-050",
    "titleEn": "Algorithmic Ecologies",
    "titleZhHans": "算法生态如何形成",
    "canonicalQuestionKey": "book-3-p11-50-algorithmic-ecologies"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.51",
    "nodeCode": "KN-B3-P11-051",
    "titleEn": "AI-Mediated Ecologies",
    "titleZhHans": "AI 中介生态如何形成",
    "canonicalQuestionKey": "book-3-p11-51-ai-mediated-ecologies"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.52",
    "nodeCode": "KN-B3-P11-052",
    "titleEn": "Synthetic Communities",
    "titleZhHans": "人工社群如何形成",
    "canonicalQuestionKey": "book-3-p11-52-synthetic-communities"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.53",
    "nodeCode": "KN-B3-P11-053",
    "titleEn": "Network Civilizations",
    "titleZhHans": "网络文明如何形成",
    "canonicalQuestionKey": "book-3-p11-53-network-civilizations"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.54",
    "nodeCode": "KN-B3-P11-054",
    "titleEn": "Post-Geographic Ecologies",
    "titleZhHans": "后地理生态如何形成",
    "canonicalQuestionKey": "book-3-p11-54-post-geographic-ecologies"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.55",
    "nodeCode": "KN-B3-P11-055",
    "titleEn": "Civilization Mapping",
    "titleZhHans": "如何建立文明地图",
    "canonicalQuestionKey": "book-3-p11-55-civilization-mapping"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.56",
    "nodeCode": "KN-B3-P11-056",
    "titleEn": "Functional Reading",
    "titleZhHans": "如何读取文明功能",
    "canonicalQuestionKey": "book-3-p11-56-functional-reading"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.57",
    "nodeCode": "KN-B3-P11-057",
    "titleEn": "Ecological Reading",
    "titleZhHans": "如何读取文明生态",
    "canonicalQuestionKey": "book-3-p11-57-ecological-reading"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.58",
    "nodeCode": "KN-B3-P11-058",
    "titleEn": "Civilization Positioning",
    "titleZhHans": "如何定位文明",
    "canonicalQuestionKey": "book-3-p11-58-civilization-positioning"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.59",
    "nodeCode": "KN-B3-P11-059",
    "titleEn": "Future Ecologies",
    "titleZhHans": "未来生态如何形成",
    "canonicalQuestionKey": "book-3-p11-59-future-ecologies"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.60",
    "nodeCode": "KN-B3-P11-060",
    "titleEn": "The Next Habitat",
    "titleZhHans": "下一代文明栖息地如何形成",
    "canonicalQuestionKey": "book-3-p11-60-the-next-habitat"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.1",
    "nodeCode": "KN-B3-P12-001",
    "titleEn": "United States Runtime",
    "titleZhHans": "美国文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-01-united-states-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.2",
    "nodeCode": "KN-B3-P12-002",
    "titleEn": "China Runtime",
    "titleZhHans": "中国文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-02-china-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.3",
    "nodeCode": "KN-B3-P12-003",
    "titleEn": "India Runtime",
    "titleZhHans": "印度文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-03-india-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.4",
    "nodeCode": "KN-B3-P12-004",
    "titleEn": "Japan Runtime",
    "titleZhHans": "日本文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-04-japan-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.5",
    "nodeCode": "KN-B3-P12-005",
    "titleEn": "Korea Runtime",
    "titleZhHans": "韩国文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-05-korea-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.6",
    "nodeCode": "KN-B3-P12-006",
    "titleEn": "Southeast Asia Runtime",
    "titleZhHans": "东南亚文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-06-southeast-asia-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.7",
    "nodeCode": "KN-B3-P12-007",
    "titleEn": "Europe Runtime",
    "titleZhHans": "欧洲文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-07-europe-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.8",
    "nodeCode": "KN-B3-P12-008",
    "titleEn": "Middle East Runtime",
    "titleZhHans": "中东文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-08-middle-east-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.9",
    "nodeCode": "KN-B3-P12-009",
    "titleEn": "Africa Runtime",
    "titleZhHans": "非洲文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-09-africa-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.10",
    "nodeCode": "KN-B3-P12-010",
    "titleEn": "Latin America Runtime",
    "titleZhHans": "拉丁美洲文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-10-latin-america-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.11",
    "nodeCode": "KN-B3-P12-011",
    "titleEn": "Russia Runtime",
    "titleZhHans": "俄罗斯文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-11-russia-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.12",
    "nodeCode": "KN-B3-P12-012",
    "titleEn": "North Korea Runtime",
    "titleZhHans": "朝鲜文明当前如何运行",
    "canonicalQuestionKey": "book-3-p12-12-north-korea-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.13",
    "nodeCode": "KN-B3-P12-013",
    "titleEn": "Emerging Ecologies",
    "titleZhHans": "新兴文明生态如何运行",
    "canonicalQuestionKey": "book-3-p12-13-emerging-ecologies"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.14",
    "nodeCode": "KN-B3-P12-014",
    "titleEn": "Civilization Runtime Phases",
    "titleZhHans": "文明生命周期如何划分",
    "canonicalQuestionKey": "book-3-p12-14-civilization-runtime-phases"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.15",
    "nodeCode": "KN-B3-P12-015",
    "titleEn": "Civilization Runtime Timeline",
    "titleZhHans": "文明时间轴如何建立",
    "canonicalQuestionKey": "book-3-p12-15-civilization-runtime-timeline"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.16",
    "nodeCode": "KN-B3-P12-016",
    "titleEn": "Civilization Runtime Matrix",
    "titleZhHans": "文明运行矩阵如何建立",
    "canonicalQuestionKey": "book-3-p12-16-civilization-runtime-matrix"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.17",
    "nodeCode": "KN-B3-P12-017",
    "titleEn": "Civilization Position",
    "titleZhHans": "文明位置如何确定",
    "canonicalQuestionKey": "book-3-p12-17-civilization-position"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.18",
    "nodeCode": "KN-B3-P12-018",
    "titleEn": "Civilization Density",
    "titleZhHans": "文明密度如何读取",
    "canonicalQuestionKey": "book-3-p12-18-civilization-density"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.19",
    "nodeCode": "KN-B3-P12-019",
    "titleEn": "Civilization Capacity",
    "titleZhHans": "文明容量如何读取",
    "canonicalQuestionKey": "book-3-p12-19-civilization-capacity"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.20",
    "nodeCode": "KN-B3-P12-020",
    "titleEn": "Civilization Load",
    "titleZhHans": "文明负载如何读取",
    "canonicalQuestionKey": "book-3-p12-20-civilization-load"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.21",
    "nodeCode": "KN-B3-P12-021",
    "titleEn": "Civilization Alignment",
    "titleZhHans": "文明对齐如何读取",
    "canonicalQuestionKey": "book-3-p12-21-civilization-alignment"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.22",
    "nodeCode": "KN-B3-P12-022",
    "titleEn": "Civilization Resilience",
    "titleZhHans": "文明韧性如何读取",
    "canonicalQuestionKey": "book-3-p12-22-civilization-resilience"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.23",
    "nodeCode": "KN-B3-P12-023",
    "titleEn": "Civilization Risk",
    "titleZhHans": "文明风险如何读取",
    "canonicalQuestionKey": "book-3-p12-23-civilization-risk"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.24",
    "nodeCode": "KN-B3-P12-024",
    "titleEn": "Historical Runtime Compression",
    "titleZhHans": "历史运行如何被压缩",
    "canonicalQuestionKey": "book-3-p12-24-historical-runtime-compression"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.25",
    "nodeCode": "KN-B3-P12-025",
    "titleEn": "Runtime Permissions",
    "titleZhHans": "哪些条件允许文明出现",
    "canonicalQuestionKey": "book-3-p12-25-runtime-permissions"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.26",
    "nodeCode": "KN-B3-P12-026",
    "titleEn": "Runtime Manifestation",
    "titleZhHans": "文明如何被显化",
    "canonicalQuestionKey": "book-3-p12-26-runtime-manifestation"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.27",
    "nodeCode": "KN-B3-P12-027",
    "titleEn": "Historical Runtime Interpretation",
    "titleZhHans": "历史运行如何被解释",
    "canonicalQuestionKey": "book-3-p12-27-historical-runtime-interpretation"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.28",
    "nodeCode": "KN-B3-P12-028",
    "titleEn": "Civilization Runtime Projection",
    "titleZhHans": "过去如何塑造现在",
    "canonicalQuestionKey": "book-3-p12-28-civilization-runtime-projection"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.29",
    "nodeCode": "KN-B3-P12-029",
    "titleEn": "AI Transition Runtime",
    "titleZhHans": "AI 如何进入历史进程",
    "canonicalQuestionKey": "book-3-p12-29-ai-transition-runtime"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.30",
    "nodeCode": "KN-B3-P12-030",
    "titleEn": "Future Runtime Projection",
    "titleZhHans": "未来运行如何投影",
    "canonicalQuestionKey": "book-3-p12-30-future-runtime-projection"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.31",
    "nodeCode": "KN-B3-P12-031",
    "titleEn": "AI Transition Phase",
    "titleZhHans": "AI 时代属于什么阶段",
    "canonicalQuestionKey": "book-3-p12-31-ai-transition-phase"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.32",
    "nodeCode": "KN-B3-P12-032",
    "titleEn": "Successor Civilizations",
    "titleZhHans": "继任文明如何出现",
    "canonicalQuestionKey": "book-3-p12-32-successor-civilizations"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.33",
    "nodeCode": "KN-B3-P12-033",
    "titleEn": "Synthetic Civilizations",
    "titleZhHans": "人工文明如何出现",
    "canonicalQuestionKey": "book-3-p12-33-synthetic-civilizations"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.34",
    "nodeCode": "KN-B3-P12-034",
    "titleEn": "Civilization Scenarios",
    "titleZhHans": "文明未来情景如何建立",
    "canonicalQuestionKey": "book-3-p12-34-civilization-scenarios"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.35",
    "nodeCode": "KN-B3-P12-035",
    "titleEn": "Life Beyond Biology",
    "titleZhHans": "生命如何超越生物载体",
    "canonicalQuestionKey": "book-3-p12-35-life-beyond-biology"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.36",
    "nodeCode": "KN-B3-P12-036",
    "titleEn": "Alternative Carriers",
    "titleZhHans": "替代载体如何形成",
    "canonicalQuestionKey": "book-3-p12-36-alternative-carriers"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.37",
    "nodeCode": "KN-B3-P12-037",
    "titleEn": "Intelligence Without Humanity",
    "titleZhHans": "非人类智能如何形成",
    "canonicalQuestionKey": "book-3-p12-37-intelligence-without-humanity"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.38",
    "nodeCode": "KN-B3-P12-038",
    "titleEn": "Collective Intelligence",
    "titleZhHans": "集体智能如何形成",
    "canonicalQuestionKey": "book-3-p12-38-collective-intelligence"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.39",
    "nodeCode": "KN-B3-P12-039",
    "titleEn": "Planetary Intelligence",
    "titleZhHans": "行星智能如何形成",
    "canonicalQuestionKey": "book-3-p12-39-planetary-intelligence"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.40",
    "nodeCode": "KN-B3-P12-040",
    "titleEn": "Synthetic Civilization",
    "titleZhHans": "人工文明如何持续运行",
    "canonicalQuestionKey": "book-3-p12-40-synthetic-civilization"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.41",
    "nodeCode": "KN-B3-P12-041",
    "titleEn": "Extraterrestrial Possibility",
    "titleZhHans": "外星文明可能性如何被审查",
    "canonicalQuestionKey": "book-3-p12-41-extraterrestrial-possibility"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.42",
    "nodeCode": "KN-B3-P12-042",
    "titleEn": "The Carrier Question",
    "titleZhHans": "文明最终需要什么载体",
    "canonicalQuestionKey": "book-3-p12-42-the-carrier-question"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.43",
    "nodeCode": "KN-B3-P12-043",
    "titleEn": "Civilization Diagnostics",
    "titleZhHans": "文明如何被诊断",
    "canonicalQuestionKey": "book-3-p12-43-civilization-diagnostics"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.44",
    "nodeCode": "KN-B3-P12-044",
    "titleEn": "Observable Civilization",
    "titleZhHans": "文明如何被观测",
    "canonicalQuestionKey": "book-3-p12-44-observable-civilization"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.45",
    "nodeCode": "KN-B3-P12-045",
    "titleEn": "Reading Civilization",
    "titleZhHans": "PHI OS 如何阅读文明",
    "canonicalQuestionKey": "book-3-p12-45-reading-civilization"
  }
];

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const writeJson = async (path, value) =>
  fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const registry = await readJson(nodesPath);
const blueprint = await readJson(blueprintPath);
const packageJson = await readJson(packagePath);
const byCode = new Map(registry.nodes.map(node => [node.nodeCode, node]));

const sequences = new Map();
for (const chapter of chapters) {
  if (!sequences.has(chapter.partCode)) sequences.set(chapter.partCode, []);
  sequences.get(chapter.partCode).push(chapter.nodeCode);
}
const first = Object.fromEntries([...sequences].map(([k,v])=>[k,v[0]]));
const last = Object.fromEntries([...sequences].map(([k,v])=>[k,v[v.length-1]]));

function relationships(chapter) {
  const sequence = sequences.get(chapter.partCode);
  const index = sequence.indexOf(chapter.nodeCode);
  const partNo = Number(chapter.partCode.slice(1));
  const previous = index > 0 ? sequence[index-1] : last[`P${partNo-1}`] || null;
  const next = index < sequence.length-1 ? sequence[index+1] : first[`P${partNo+1}`] || null;
  const related = [];
  if (chapter.chapterCode === '10.77') related.push(first.P11);
  if (chapter.chapterCode === '11.60') related.push(first.P12);
  return {
    prerequisiteNodeCodes: previous ? [previous] : ['KN-B2-P9-039'],
    nextNodeCodes: next ? [next] : [],
    relatedNodeCodes: related,
    parentNodeCodes: [],
    childNodeCodes: []
  };
}

for (const chapter of chapters) {
  if (byCode.has(chapter.nodeCode)) {
    throw new Error(`Book 3 Canonical Node already exists: ${chapter.nodeCode}`);
  }
  const relation = relationships(chapter);
  const node = {
    nodeCode: chapter.nodeCode,
    collectionCode: `KC-BOOK-3-${chapter.partCode}`,
    themeCode: `TH-BOOK-3-${chapter.partCode}`,
    canonicalQuestionKey: chapter.canonicalQuestionKey,
    nodeType: 'mechanism_question',
    knowledgeLevel: 'advanced',
    productionTier: 'tier_b',
    primaryAssetType: 'article',
    canonicalLanguage: 'zh-Hans',
    requiredPublicLanguages: ['zh-Hans','en'],
    registryStatus: 'planned',
    productionQueue: 'not_scheduled',
    productionEffort: 'unassessed',
    publicationPriority: 'not_scheduled',
    supportingQuestionCodes: [],
    legacyNodeCodes: [],
    relationships: relation,
    dependencies: relation.prerequisiteNodeCodes,
    crossSessionNode: {
      enabled: true,
      scope: 'book-3',
      continuityKey: `BOOK-3:${chapter.partCode}:${chapter.chapterCode}`,
      previousNodeCode: relation.prerequisiteNodeCodes[0] || null,
      nextNodeCode: relation.nextNodeCodes[0] || null
    },
    chapterCode: chapter.chapterCode,
    partCode: chapter.partCode,
    sourceBookCode: 'BOOK-3',
    publicationBookCode: 'BOOK-3',
    publicationPartCode: chapter.partCode,
    titleEn: chapter.titleEn,
    titleZhHans: chapter.titleZhHans,
    carrierFoundationDependencies: [
      'KN-B1-P4-CARRIER-INITIALIZATION',
      'KN-B1-P4-CARRIER-ARCHETYPES',
      'KN-B1-P4-CARRIER-COLLAPSE'
    ],
    productionReady: false,
    articleStatus: 'not_created',
    candidateStatus: 'not_created',
    sourceReferences: [],
    version: '2.0.0'
  };
  registry.nodes.push(node);
  byCode.set(node.nodeCode,node);
}

registry.version='2.0.0';

blueprint.contract='PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.0.0';
blueprint.schemaVersion='PHI-OS-KNOWLEDGE-BLUEPRINT-v2.0.0';
blueprint.status='registry-complete-planning';
blueprint.bookCode='BOOK-3';
blueprint.canonicalLanguage='zh-Hans';
blueprint.plannedCanonicalNodes=chapters.length;
blueprint.activeProductionLimit=0;
blueprint.productionPolicy={
  articleGenerationAllowed:false,
  candidateGenerationAllowed:false,
  productionReadyPromotionAllowed:false,
  allowedRegistryStatuses:['planned','draft'],
  productionRequiresStage:'KH-W4K'
};
blueprint.parts=[10,11,12].map(partNo=>{
  const list=chapters.filter(node=>node.partCode===`P${partNo}`);
  return {
    partCode:`P${partNo}`,
    title:{P10:'第十部｜文明动态',P11:'第十一部｜文明生态',P12:'第十二部｜文明图谱'}[`P${partNo}`],
    canonicalNodeCount:list.length,
    nodes:list.map(node=>node.nodeCode)
  };
});
blueprint.nodes=chapters.map(chapter=>{
  const node=byCode.get(chapter.nodeCode);
  return {
    nodeCode:node.nodeCode,
    chapterCode:node.chapterCode,
    titleZhHans:node.titleZhHans,
    titleEn:node.titleEn,
    partCode:node.partCode,
    status:node.registryStatus,
    productionPriority:'not_scheduled',
    articleRequiredNow:false,
    sourceRole:'canonical-mechanism',
    crossSessionNode:node.crossSessionNode,
    relationships:node.relationships,
    dependencies:node.dependencies
  };
});
blueprint.registryCompletion={
  stage:'KH-W4B.5C-F',
  baselineFullCommitSha:BASELINE,
  parts:['P10','P11','P12'],
  canonicalNodeCount:chapters.length,
  permanentIdentityAssigned:true,
  crossSessionRelationshipsAssigned:true,
  normalizationContract:'content/knowledge/contracts/book-3-registry-normalization-v1.json'
};
blueprint.releaseRecommendation={
  wave1:[],wave2:[],
  remaining:'All Book 3 nodes remain planned until KH-W4K Registry Authority freeze.'
};

packageJson.scripts['knowledge:complete-book-3-registry'] =
  'node scripts/complete-kh-w4b5-book-3-canonical-node-registry.mjs';
packageJson.scripts['check:kh-w4b.5-book-3'] =
  'node scripts/check-kh-w4b5-book-3-canonical-node-registry.mjs';
const gate='node scripts/check-kh-w4b5-book-3-canonical-node-registry.mjs';
if (!packageJson.scripts.precheck.includes(gate)) {
  packageJson.scripts.precheck=`${packageJson.scripts.precheck} && ${gate}`;
}

await writeJson(nodesPath,registry);
await writeJson(blueprintPath,blueprint);
await writeJson(packagePath,packageJson);

console.log('✓ KH-W4B.5 Book 3 registry completed: 182 canonical nodes.');
console.log('✓ P10 77 / P11 60 / P12 45.');
console.log('✓ Carrier foundation remains reference-only.');
console.log('✓ No Article, Candidate, Readiness, Review, Approval or Publication state generated.');
console.log('Run: npm run knowledge:freeze');
