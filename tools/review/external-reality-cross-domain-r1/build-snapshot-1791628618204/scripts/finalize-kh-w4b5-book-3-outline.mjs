import fs from 'node:fs/promises';

const BASELINE = '59c15fa74925f03fe2825af39b854782022ff563';
const nodesPath = 'content/knowledge/registry/nodes.json';
const blueprintPath = 'content/knowledge/blueprints/book-3-knowledge-blueprint.json';
const migrationPath = 'content/knowledge/migrations/book-3-final-outline-migration-v1.json';
const normalizationPath = 'content/knowledge/contracts/book-3-registry-normalization-v1.json';
const packagePath = 'package.json';

const chapters = [
  {
    "partCode": "P10",
    "chapterCode": "10.1",
    "nodeCode": "KN-B3-P10-001",
    "titleEn": "Runtime Expansion",
    "titleZhHans": "Runtime 本质为何持续扩展",
    "canonicalQuestionKey": "book-3-p10-01-runtime-expansion"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.2",
    "nodeCode": "KN-B3-P10-002",
    "titleEn": "Carrier Evolution",
    "titleZhHans": "Reality 为什么持续形成新的承载体",
    "canonicalQuestionKey": "book-3-p10-02-carrier-evolution"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.3",
    "nodeCode": "KN-B3-P10-003",
    "titleEn": "Runtime Initialization",
    "titleZhHans": "为什么不同 Runtime 使用不同初始化方式",
    "canonicalQuestionKey": "book-3-p10-03-runtime-initialization"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.4",
    "nodeCode": "KN-B3-P10-004",
    "titleEn": "Carrier Replacement",
    "titleZhHans": "为什么 Runtime 会更换承载体",
    "canonicalQuestionKey": "book-3-p10-04-carrier-replacement"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.5",
    "nodeCode": "KN-B3-P10-005",
    "titleEn": "Carrier Collapse",
    "titleZhHans": "为什么旧承载体最终失效",
    "canonicalQuestionKey": "book-3-p10-05-carrier-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.6",
    "nodeCode": "KN-B3-P10-006",
    "titleEn": "Selection Pressure",
    "titleZhHans": "什么推动 Runtime 改变",
    "canonicalQuestionKey": "book-3-p10-06-selection-pressure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.7",
    "nodeCode": "KN-B3-P10-007",
    "titleEn": "Complexity Gradient",
    "titleZhHans": "复杂度如何推动扩展",
    "canonicalQuestionKey": "book-3-p10-07-complexity-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.8",
    "nodeCode": "KN-B3-P10-008",
    "titleEn": "Stability Gradient",
    "titleZhHans": "稳定性如何影响扩展方向",
    "canonicalQuestionKey": "book-3-p10-08-stability-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.9",
    "nodeCode": "KN-B3-P10-009",
    "titleEn": "Resource Gradient",
    "titleZhHans": "资源如何推动扩展",
    "canonicalQuestionKey": "book-3-p10-09-resource-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.10",
    "nodeCode": "KN-B3-P10-010",
    "titleEn": "Meaning Gradient",
    "titleZhHans": "意义如何推动扩展",
    "canonicalQuestionKey": "book-3-p10-10-meaning-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.11",
    "nodeCode": "KN-B3-P10-011",
    "titleEn": "Information Gradient",
    "titleZhHans": "信息如何推动扩展",
    "canonicalQuestionKey": "book-3-p10-11-information-gradient"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.12",
    "nodeCode": "KN-B3-P10-012",
    "titleEn": "Runtime Drift",
    "titleZhHans": "Runtime 如何开始偏移",
    "canonicalQuestionKey": "book-3-p10-12-runtime-drift"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.13",
    "nodeCode": "KN-B3-P10-013",
    "titleEn": "Expansion Threshold",
    "titleZhHans": "Runtime 何时进入扩展临界点",
    "canonicalQuestionKey": "book-3-p10-13-expansion-threshold"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.14",
    "nodeCode": "KN-B3-P10-014",
    "titleEn": "Expansion Trigger",
    "titleZhHans": "Runtime 扩展如何被触发",
    "canonicalQuestionKey": "book-3-p10-14-expansion-trigger"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.15",
    "nodeCode": "KN-B3-P10-015",
    "titleEn": "Emergence",
    "titleZhHans": "新的 Runtime 如何出现",
    "canonicalQuestionKey": "book-3-p10-15-emergence"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.16",
    "nodeCode": "KN-B3-P10-016",
    "titleEn": "Stabilization",
    "titleZhHans": "Runtime 如何获得稳定",
    "canonicalQuestionKey": "book-3-p10-16-stabilization"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.17",
    "nodeCode": "KN-B3-P10-017",
    "titleEn": "Expansion",
    "titleZhHans": "Runtime 如何扩张",
    "canonicalQuestionKey": "book-3-p10-17-expansion"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.18",
    "nodeCode": "KN-B3-P10-018",
    "titleEn": "Saturation",
    "titleZhHans": "Runtime 如何达到饱和",
    "canonicalQuestionKey": "book-3-p10-18-saturation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.19",
    "nodeCode": "KN-B3-P10-019",
    "titleEn": "Fragmentation",
    "titleZhHans": "Runtime 如何发生碎裂",
    "canonicalQuestionKey": "book-3-p10-19-fragmentation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.20",
    "nodeCode": "KN-B3-P10-020",
    "titleEn": "Collapse",
    "titleZhHans": "Runtime 如何崩塌",
    "canonicalQuestionKey": "book-3-p10-20-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.21",
    "nodeCode": "KN-B3-P10-021",
    "titleEn": "Compression",
    "titleZhHans": "Runtime 如何被压缩",
    "canonicalQuestionKey": "book-3-p10-21-compression"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.22",
    "nodeCode": "KN-B3-P10-022",
    "titleEn": "Reconfiguration",
    "titleZhHans": "Runtime 如何重组",
    "canonicalQuestionKey": "book-3-p10-22-reconfiguration"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.23",
    "nodeCode": "KN-B3-P10-023",
    "titleEn": "Successor Runtime",
    "titleZhHans": "继任 Runtime 如何出现",
    "canonicalQuestionKey": "book-3-p10-23-successor-runtime"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.24",
    "nodeCode": "KN-B3-P10-024",
    "titleEn": "Human Nodes",
    "titleZhHans": "个体如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-24-human-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.25",
    "nodeCode": "KN-B3-P10-025",
    "titleEn": "Architect Nodes",
    "titleZhHans": "架构者如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-25-architect-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.26",
    "nodeCode": "KN-B3-P10-026",
    "titleEn": "Institutional Nodes",
    "titleZhHans": "制度如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-26-institutional-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.27",
    "nodeCode": "KN-B3-P10-027",
    "titleEn": "Financial Nodes",
    "titleZhHans": "资本如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-27-financial-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.28",
    "nodeCode": "KN-B3-P10-028",
    "titleEn": "Knowledge Nodes",
    "titleZhHans": "知识如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-28-knowledge-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.29",
    "nodeCode": "KN-B3-P10-029",
    "titleEn": "Technology Nodes",
    "titleZhHans": "技术如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-29-technology-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.30",
    "nodeCode": "KN-B3-P10-030",
    "titleEn": "Media Nodes",
    "titleZhHans": "媒体如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-30-media-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.31",
    "nodeCode": "KN-B3-P10-031",
    "titleEn": "Entertainment Nodes",
    "titleZhHans": "娱乐如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-31-entertainment-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.32",
    "nodeCode": "KN-B3-P10-032",
    "titleEn": "AI Nodes",
    "titleZhHans": "人工智能如何成为扩展节点",
    "canonicalQuestionKey": "book-3-p10-32-ai-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.33",
    "nodeCode": "KN-B3-P10-033",
    "titleEn": "Compression Nodes",
    "titleZhHans": "压缩节点如何推动扩展",
    "canonicalQuestionKey": "book-3-p10-33-compression-nodes"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.34",
    "nodeCode": "KN-B3-P10-034",
    "titleEn": "Node Transition",
    "titleZhHans": "扩展节点如何迁移",
    "canonicalQuestionKey": "book-3-p10-34-node-transition"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.35",
    "nodeCode": "KN-B3-P10-035",
    "titleEn": "Complexity Overload",
    "titleZhHans": "Runtime 如何发生复杂度过载",
    "canonicalQuestionKey": "book-3-p10-35-complexity-overload"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.36",
    "nodeCode": "KN-B3-P10-036",
    "titleEn": "Structural Rigidity",
    "titleZhHans": "Runtime 结构为何僵化",
    "canonicalQuestionKey": "book-3-p10-36-structural-rigidity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.37",
    "nodeCode": "KN-B3-P10-037",
    "titleEn": "Collective Misalignment",
    "titleZhHans": "集体为何发生失配",
    "canonicalQuestionKey": "book-3-p10-37-collective-misalignment"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.38",
    "nodeCode": "KN-B3-P10-038",
    "titleEn": "Growth Dependency",
    "titleZhHans": "Runtime 为何依赖成长",
    "canonicalQuestionKey": "book-3-p10-38-growth-dependency"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.39",
    "nodeCode": "KN-B3-P10-039",
    "titleEn": "Expansion Resistance",
    "titleZhHans": "Runtime 为何抗拒扩展",
    "canonicalQuestionKey": "book-3-p10-39-expansion-resistance"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.40",
    "nodeCode": "KN-B3-P10-040",
    "titleEn": "Coordination Failure",
    "titleZhHans": "扩展协调为何失败",
    "canonicalQuestionKey": "book-3-p10-40-coordination-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.41",
    "nodeCode": "KN-B3-P10-041",
    "titleEn": "Runtime Saturation",
    "titleZhHans": "运行如何达到整体饱和",
    "canonicalQuestionKey": "book-3-p10-41-runtime-saturation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.42",
    "nodeCode": "KN-B3-P10-042",
    "titleEn": "Adaptive Capacity",
    "titleZhHans": "Runtime 适应能力如何形成",
    "canonicalQuestionKey": "book-3-p10-42-adaptive-capacity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.43",
    "nodeCode": "KN-B3-P10-043",
    "titleEn": "Structural Cost",
    "titleZhHans": "扩展如何产生结构成本",
    "canonicalQuestionKey": "book-3-p10-43-structural-cost"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.44",
    "nodeCode": "KN-B3-P10-044",
    "titleEn": "Runtime Debt",
    "titleZhHans": "扩展如何形成运行债务",
    "canonicalQuestionKey": "book-3-p10-44-runtime-debt"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.45",
    "nodeCode": "KN-B3-P10-045",
    "titleEn": "Cost Deferral",
    "titleZhHans": "扩展成本如何被递延",
    "canonicalQuestionKey": "book-3-p10-45-cost-deferral"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.46",
    "nodeCode": "KN-B3-P10-046",
    "titleEn": "Resource Compression",
    "titleZhHans": "扩展如何压缩资源",
    "canonicalQuestionKey": "book-3-p10-46-resource-compression"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.47",
    "nodeCode": "KN-B3-P10-047",
    "titleEn": "Generational Transfer",
    "titleZhHans": "扩展成本如何代际转移",
    "canonicalQuestionKey": "book-3-p10-47-generational-transfer"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.48",
    "nodeCode": "KN-B3-P10-048",
    "titleEn": "Cost Inflation",
    "titleZhHans": "扩展成本如何膨胀",
    "canonicalQuestionKey": "book-3-p10-48-cost-inflation"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.49",
    "nodeCode": "KN-B3-P10-049",
    "titleEn": "Hidden Subsidies",
    "titleZhHans": "隐藏补贴如何维持扩展",
    "canonicalQuestionKey": "book-3-p10-49-hidden-subsidies"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.50",
    "nodeCode": "KN-B3-P10-050",
    "titleEn": "Future Extraction",
    "titleZhHans": "扩展如何提前提取未来",
    "canonicalQuestionKey": "book-3-p10-50-future-extraction"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.51",
    "nodeCode": "KN-B3-P10-051",
    "titleEn": "Biological Continuity",
    "titleZhHans": "生物连续性如何维持",
    "canonicalQuestionKey": "book-3-p10-51-biological-continuity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.52",
    "nodeCode": "KN-B3-P10-052",
    "titleEn": "Runtime Continuity",
    "titleZhHans": "Runtime 如何维持连续性",
    "canonicalQuestionKey": "book-3-p10-52-runtime-continuity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.53",
    "nodeCode": "KN-B3-P10-053",
    "titleEn": "Reproduction Is Not Continuity",
    "titleZhHans": "为什么繁衍不等于连续性",
    "canonicalQuestionKey": "book-3-p10-53-reproduction-is-not-continuity"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.54",
    "nodeCode": "KN-B3-P10-054",
    "titleEn": "Future Confidence",
    "titleZhHans": "未来信心如何形成",
    "canonicalQuestionKey": "book-3-p10-54-future-confidence"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.55",
    "nodeCode": "KN-B3-P10-055",
    "titleEn": "Runtime Selection",
    "titleZhHans": "Runtime 如何选择未来",
    "canonicalQuestionKey": "book-3-p10-55-runtime-selection"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.56",
    "nodeCode": "KN-B3-P10-056",
    "titleEn": "Low Fertility Systems",
    "titleZhHans": "低生育率系统如何形成",
    "canonicalQuestionKey": "book-3-p10-56-low-fertility-systems"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.57",
    "nodeCode": "KN-B3-P10-057",
    "titleEn": "Population Compression",
    "titleZhHans": "人口如何被压缩",
    "canonicalQuestionKey": "book-3-p10-57-population-compression"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.58",
    "nodeCode": "KN-B3-P10-058",
    "titleEn": "Replacement Failure",
    "titleZhHans": "替代为何失败",
    "canonicalQuestionKey": "book-3-p10-58-replacement-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.59",
    "nodeCode": "KN-B3-P10-059",
    "titleEn": "Future Production Failure",
    "titleZhHans": "Runtime 如何停止生产未来",
    "canonicalQuestionKey": "book-3-p10-59-future-production-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.60",
    "nodeCode": "KN-B3-P10-060",
    "titleEn": "Continuity Collapse",
    "titleZhHans": "连续性如何崩塌",
    "canonicalQuestionKey": "book-3-p10-60-continuity-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.61",
    "nodeCode": "KN-B3-P10-061",
    "titleEn": "Asymptomatic Failure",
    "titleZhHans": "Runtime 如何无症状失败",
    "canonicalQuestionKey": "book-3-p10-61-asymptomatic-failure"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.62",
    "nodeCode": "KN-B3-P10-062",
    "titleEn": "Invisible Collapse",
    "titleZhHans": "隐性崩塌如何发生",
    "canonicalQuestionKey": "book-3-p10-62-invisible-collapse"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.63",
    "nodeCode": "KN-B3-P10-063",
    "titleEn": "Growth Hides Collapse",
    "titleZhHans": "成长如何掩盖崩塌",
    "canonicalQuestionKey": "book-3-p10-63-growth-hides-collapse"
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
    "titleZhHans": "人工协调如何降低扩展成本",
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
    "titleEn": "AI Runtime",
    "titleZhHans": "人工智能 Runtime 如何形成",
    "canonicalQuestionKey": "book-3-p10-67-ai-runtime"
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
    "titleEn": "Human–AI Coordination",
    "titleZhHans": "人机如何协调",
    "canonicalQuestionKey": "book-3-p10-69-human-ai-coordination"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.70",
    "nodeCode": "KN-B3-P10-070",
    "titleEn": "Runtime Interface Shift",
    "titleZhHans": "Runtime 接口如何迁移",
    "canonicalQuestionKey": "book-3-p10-70-runtime-interface-shift"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.71",
    "nodeCode": "KN-B3-P10-071",
    "titleEn": "Post-Human Carriers",
    "titleZhHans": "后人类承载体如何出现",
    "canonicalQuestionKey": "book-3-p10-71-post-human-carriers"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.72",
    "nodeCode": "KN-B3-P10-072",
    "titleEn": "Successor Runtime",
    "titleZhHans": "继任 Runtime 如何形成",
    "canonicalQuestionKey": "book-3-p10-72-successor-runtime"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.73",
    "nodeCode": "KN-B3-P10-073",
    "titleEn": "Synthetic Runtime",
    "titleZhHans": "人工 Runtime 如何形成",
    "canonicalQuestionKey": "book-3-p10-73-synthetic-runtime"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.74",
    "nodeCode": "KN-B3-P10-074",
    "titleEn": "Hybrid Runtime",
    "titleZhHans": "混合 Runtime 如何形成",
    "canonicalQuestionKey": "book-3-p10-74-hybrid-runtime"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.75",
    "nodeCode": "KN-B3-P10-075",
    "titleEn": "Runtime Selection",
    "titleZhHans": "Runtime 如何选择迁移路径",
    "canonicalQuestionKey": "book-3-p10-75-runtime-selection"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.76",
    "nodeCode": "KN-B3-P10-076",
    "titleEn": "Runtime Transition",
    "titleZhHans": "Runtime 如何进入下一阶段",
    "canonicalQuestionKey": "book-3-p10-76-runtime-transition"
  },
  {
    "partCode": "P10",
    "chapterCode": "10.77",
    "nodeCode": "KN-B3-P10-077",
    "titleEn": "The Expansion Question",
    "titleZhHans": "世界将如何不断扩展",
    "canonicalQuestionKey": "book-3-p10-77-the-expansion-question"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.1",
    "nodeCode": "KN-B3-P11-001",
    "titleEn": "Civilization Emergence",
    "titleZhHans": "文明如何出现",
    "canonicalQuestionKey": "book-3-p11-01-civilization-emergence"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.2",
    "nodeCode": "KN-B3-P11-002",
    "titleEn": "Shared Reality",
    "titleZhHans": "共同 Runtime 为什么能够持续扩大",
    "canonicalQuestionKey": "book-3-p11-02-shared-reality"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.3",
    "nodeCode": "KN-B3-P11-003",
    "titleEn": "Shared Memory",
    "titleZhHans": "为什么文明需要共同记忆",
    "canonicalQuestionKey": "book-3-p11-03-shared-memory"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.4",
    "nodeCode": "KN-B3-P11-004",
    "titleEn": "Shared Meaning",
    "titleZhHans": "为什么文明需要共同意义",
    "canonicalQuestionKey": "book-3-p11-04-shared-meaning"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.5",
    "nodeCode": "KN-B3-P11-005",
    "titleEn": "Shared Language",
    "titleZhHans": "为什么文明需要共同语言",
    "canonicalQuestionKey": "book-3-p11-05-shared-language"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.6",
    "nodeCode": "KN-B3-P11-006",
    "titleEn": "Shared Identity",
    "titleZhHans": "为什么文明形成共同身份",
    "canonicalQuestionKey": "book-3-p11-06-shared-identity"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.7",
    "nodeCode": "KN-B3-P11-007",
    "titleEn": "Shared Time",
    "titleZhHans": "为什么文明需要统一时间",
    "canonicalQuestionKey": "book-3-p11-07-shared-time"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.8",
    "nodeCode": "KN-B3-P11-008",
    "titleEn": "Shared Space",
    "titleZhHans": "为什么文明需要共同空间",
    "canonicalQuestionKey": "book-3-p11-08-shared-space"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.9",
    "nodeCode": "KN-B3-P11-009",
    "titleEn": "Civilization Boundary",
    "titleZhHans": "文明边界如何形成",
    "canonicalQuestionKey": "book-3-p11-09-civilization-boundary"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.10",
    "nodeCode": "KN-B3-P11-010",
    "titleEn": "Civilization Scale",
    "titleZhHans": "文明为何不断扩大",
    "canonicalQuestionKey": "book-3-p11-10-civilization-scale"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.11",
    "nodeCode": "KN-B3-P11-011",
    "titleEn": "Institutions",
    "titleZhHans": "制度如何组织文明",
    "canonicalQuestionKey": "book-3-p11-11-institutions"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.12",
    "nodeCode": "KN-B3-P11-012",
    "titleEn": "Governance",
    "titleZhHans": "治理如何组织文明",
    "canonicalQuestionKey": "book-3-p11-12-governance"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.13",
    "nodeCode": "KN-B3-P11-013",
    "titleEn": "Law",
    "titleZhHans": "法律如何组织文明",
    "canonicalQuestionKey": "book-3-p11-13-law"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.14",
    "nodeCode": "KN-B3-P11-014",
    "titleEn": "Economy",
    "titleZhHans": "经济如何组织文明",
    "canonicalQuestionKey": "book-3-p11-14-economy"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.15",
    "nodeCode": "KN-B3-P11-015",
    "titleEn": "Markets",
    "titleZhHans": "市场如何组织文明",
    "canonicalQuestionKey": "book-3-p11-15-markets"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.16",
    "nodeCode": "KN-B3-P11-016",
    "titleEn": "Education",
    "titleZhHans": "教育如何组织文明",
    "canonicalQuestionKey": "book-3-p11-16-education"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.17",
    "nodeCode": "KN-B3-P11-017",
    "titleEn": "Religion",
    "titleZhHans": "宗教如何组织文明",
    "canonicalQuestionKey": "book-3-p11-17-religion"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.18",
    "nodeCode": "KN-B3-P11-018",
    "titleEn": "Science",
    "titleZhHans": "科学如何组织文明",
    "canonicalQuestionKey": "book-3-p11-18-science"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.19",
    "nodeCode": "KN-B3-P11-019",
    "titleEn": "Technology",
    "titleZhHans": "技术如何组织文明",
    "canonicalQuestionKey": "book-3-p11-19-technology"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.20",
    "nodeCode": "KN-B3-P11-020",
    "titleEn": "Infrastructure",
    "titleZhHans": "基础设施如何承载文明",
    "canonicalQuestionKey": "book-3-p11-20-infrastructure"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.21",
    "nodeCode": "KN-B3-P11-021",
    "titleEn": "Organization Layers",
    "titleZhHans": "组织层级如何形成",
    "canonicalQuestionKey": "book-3-p11-21-organization-layers"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.22",
    "nodeCode": "KN-B3-P11-022",
    "titleEn": "Coordination",
    "titleZhHans": "文明如何协调",
    "canonicalQuestionKey": "book-3-p11-22-coordination"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.23",
    "nodeCode": "KN-B3-P11-023",
    "titleEn": "Trust",
    "titleZhHans": "文明如何形成信任",
    "canonicalQuestionKey": "book-3-p11-23-trust"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.24",
    "nodeCode": "KN-B3-P11-024",
    "titleEn": "Reputation",
    "titleZhHans": "文明如何形成信誉",
    "canonicalQuestionKey": "book-3-p11-24-reputation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.25",
    "nodeCode": "KN-B3-P11-025",
    "titleEn": "Authority",
    "titleZhHans": "文明如何形成权威",
    "canonicalQuestionKey": "book-3-p11-25-authority"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.26",
    "nodeCode": "KN-B3-P11-026",
    "titleEn": "Incentives",
    "titleZhHans": "文明如何形成激励",
    "canonicalQuestionKey": "book-3-p11-26-incentives"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.27",
    "nodeCode": "KN-B3-P11-027",
    "titleEn": "Responsibilities",
    "titleZhHans": "文明如何分配责任",
    "canonicalQuestionKey": "book-3-p11-27-responsibilities"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.28",
    "nodeCode": "KN-B3-P11-028",
    "titleEn": "Participation",
    "titleZhHans": "文明如何组织参与",
    "canonicalQuestionKey": "book-3-p11-28-participation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.29",
    "nodeCode": "KN-B3-P11-029",
    "titleEn": "Cooperation",
    "titleZhHans": "文明如何组织合作",
    "canonicalQuestionKey": "book-3-p11-29-cooperation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.30",
    "nodeCode": "KN-B3-P11-030",
    "titleEn": "Competition",
    "titleZhHans": "文明如何组织竞争",
    "canonicalQuestionKey": "book-3-p11-30-competition"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.31",
    "nodeCode": "KN-B3-P11-031",
    "titleEn": "Runtime Balance",
    "titleZhHans": "文明如何维持运行平衡",
    "canonicalQuestionKey": "book-3-p11-31-runtime-balance"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.32",
    "nodeCode": "KN-B3-P11-032",
    "titleEn": "Innovation",
    "titleZhHans": "文明如何创新",
    "canonicalQuestionKey": "book-3-p11-32-innovation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.33",
    "nodeCode": "KN-B3-P11-033",
    "titleEn": "Knowledge Accumulation",
    "titleZhHans": "知识如何累积",
    "canonicalQuestionKey": "book-3-p11-33-knowledge-accumulation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.34",
    "nodeCode": "KN-B3-P11-034",
    "titleEn": "Technology Diffusion",
    "titleZhHans": "技术如何扩散",
    "canonicalQuestionKey": "book-3-p11-34-technology-diffusion"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.35",
    "nodeCode": "KN-B3-P11-035",
    "titleEn": "Institutional Learning",
    "titleZhHans": "制度如何学习",
    "canonicalQuestionKey": "book-3-p11-35-institutional-learning"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.36",
    "nodeCode": "KN-B3-P11-036",
    "titleEn": "Cultural Adaptation",
    "titleZhHans": "文化如何适应",
    "canonicalQuestionKey": "book-3-p11-36-cultural-adaptation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.37",
    "nodeCode": "KN-B3-P11-037",
    "titleEn": "Runtime Optimization",
    "titleZhHans": "文明如何优化运行",
    "canonicalQuestionKey": "book-3-p11-37-runtime-optimization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.38",
    "nodeCode": "KN-B3-P11-038",
    "titleEn": "Complexity Growth",
    "titleZhHans": "文明复杂度如何成长",
    "canonicalQuestionKey": "book-3-p11-38-complexity-growth"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.39",
    "nodeCode": "KN-B3-P11-039",
    "titleEn": "Expansion Capacity",
    "titleZhHans": "文明扩展能力如何形成",
    "canonicalQuestionKey": "book-3-p11-39-expansion-capacity"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.40",
    "nodeCode": "KN-B3-P11-040",
    "titleEn": "Evolutionary Selection",
    "titleZhHans": "文明如何经历演化选择",
    "canonicalQuestionKey": "book-3-p11-40-evolutionary-selection"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.41",
    "nodeCode": "KN-B3-P11-041",
    "titleEn": "Institutional Failure",
    "titleZhHans": "制度如何失效",
    "canonicalQuestionKey": "book-3-p11-41-institutional-failure"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.42",
    "nodeCode": "KN-B3-P11-042",
    "titleEn": "Governance Failure",
    "titleZhHans": "治理如何失效",
    "canonicalQuestionKey": "book-3-p11-42-governance-failure"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.43",
    "nodeCode": "KN-B3-P11-043",
    "titleEn": "Trust Collapse",
    "titleZhHans": "信任如何崩塌",
    "canonicalQuestionKey": "book-3-p11-43-trust-collapse"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.44",
    "nodeCode": "KN-B3-P11-044",
    "titleEn": "Meaning Fragmentation",
    "titleZhHans": "意义如何碎裂",
    "canonicalQuestionKey": "book-3-p11-44-meaning-fragmentation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.45",
    "nodeCode": "KN-B3-P11-045",
    "titleEn": "Identity Conflict",
    "titleZhHans": "身份冲突如何形成",
    "canonicalQuestionKey": "book-3-p11-45-identity-conflict"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.46",
    "nodeCode": "KN-B3-P11-046",
    "titleEn": "Coordination Collapse",
    "titleZhHans": "协调如何崩塌",
    "canonicalQuestionKey": "book-3-p11-46-coordination-collapse"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.47",
    "nodeCode": "KN-B3-P11-047",
    "titleEn": "Organizational Rigidity",
    "titleZhHans": "组织为何僵化",
    "canonicalQuestionKey": "book-3-p11-47-organizational-rigidity"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.48",
    "nodeCode": "KN-B3-P11-048",
    "titleEn": "Adaptive Failure",
    "titleZhHans": "文明适应为何失败",
    "canonicalQuestionKey": "book-3-p11-48-adaptive-failure"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.49",
    "nodeCode": "KN-B3-P11-049",
    "titleEn": "Civilization Fragmentation",
    "titleZhHans": "文明如何碎裂",
    "canonicalQuestionKey": "book-3-p11-49-civilization-fragmentation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.50",
    "nodeCode": "KN-B3-P11-050",
    "titleEn": "AI Organizations",
    "titleZhHans": "AI 组织如何形成",
    "canonicalQuestionKey": "book-3-p11-50-ai-organizations"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.51",
    "nodeCode": "KN-B3-P11-051",
    "titleEn": "Synthetic Institutions",
    "titleZhHans": "人工制度如何形成",
    "canonicalQuestionKey": "book-3-p11-51-synthetic-institutions"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.52",
    "nodeCode": "KN-B3-P11-052",
    "titleEn": "Machine Governance",
    "titleZhHans": "机器治理如何形成",
    "canonicalQuestionKey": "book-3-p11-52-machine-governance"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.53",
    "nodeCode": "KN-B3-P11-053",
    "titleEn": "Human–AI Collaboration",
    "titleZhHans": "人机如何协作",
    "canonicalQuestionKey": "book-3-p11-53-human-ai-collaboration"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.54",
    "nodeCode": "KN-B3-P11-054",
    "titleEn": "Autonomous Coordination",
    "titleZhHans": "自主协调如何形成",
    "canonicalQuestionKey": "book-3-p11-54-autonomous-coordination"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.55",
    "nodeCode": "KN-B3-P11-055",
    "titleEn": "Synthetic Culture",
    "titleZhHans": "人工文化如何形成",
    "canonicalQuestionKey": "book-3-p11-55-synthetic-culture"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.56",
    "nodeCode": "KN-B3-P11-056",
    "titleEn": "Collective Intelligence",
    "titleZhHans": "集体智能如何形成",
    "canonicalQuestionKey": "book-3-p11-56-collective-intelligence"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.57",
    "nodeCode": "KN-B3-P11-057",
    "titleEn": "Civilization Beyond Humanity",
    "titleZhHans": "超越人类的文明如何形成",
    "canonicalQuestionKey": "book-3-p11-57-civilization-beyond-humanity"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.58",
    "nodeCode": "KN-B3-P11-058",
    "titleEn": "Civilization Stability",
    "titleZhHans": "文明稳定性如何形成",
    "canonicalQuestionKey": "book-3-p11-58-civilization-stability"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.59",
    "nodeCode": "KN-B3-P11-059",
    "titleEn": "Civilization Resilience",
    "titleZhHans": "文明韧性如何形成",
    "canonicalQuestionKey": "book-3-p11-59-civilization-resilience"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.60",
    "nodeCode": "KN-B3-P11-060",
    "titleEn": "Civilization Sustainability",
    "titleZhHans": "文明可持续性如何形成",
    "canonicalQuestionKey": "book-3-p11-60-civilization-sustainability"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.61",
    "nodeCode": "KN-B3-P11-061",
    "titleEn": "Civilization Transformation",
    "titleZhHans": "文明如何转型",
    "canonicalQuestionKey": "book-3-p11-61-civilization-transformation"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.62",
    "nodeCode": "KN-B3-P11-062",
    "titleEn": "Civilization Continuity",
    "titleZhHans": "文明如何维持连续性",
    "canonicalQuestionKey": "book-3-p11-62-civilization-continuity"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.63",
    "nodeCode": "KN-B3-P11-063",
    "titleEn": "Runtime Civilization",
    "titleZhHans": "Runtime 如何组织成 Civilization",
    "canonicalQuestionKey": "book-3-p11-63-runtime-civilization"
  },
  {
    "partCode": "P11",
    "chapterCode": "11.64",
    "nodeCode": "KN-B3-P11-064",
    "titleEn": "The Civilization Question",
    "titleZhHans": "文明为何能够持续运行",
    "canonicalQuestionKey": "book-3-p11-64-the-civilization-question"
  },
  {
    "partCode": "P12",
    "chapterCode": "12.0",
    "nodeCode": "KN-B3-P12-046",
    "titleEn": "Carrier Archetypes",
    "titleZhHans": "Reality 为什么形成不同承载形态",
    "canonicalQuestionKey": "book-3-p12-00-carrier-archetypes"
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
const supportingDimensions = {
  "10.3": [
    {
      "code": "10.3.1",
      "titleEn": "Human Initialization",
      "titleZhHans": "出生"
    },
    {
      "code": "10.3.2",
      "titleEn": "Synthetic Initialization",
      "titleZhHans": "Boot / Initialization"
    },
    {
      "code": "10.3.3",
      "titleEn": "Organizational Initialization",
      "titleZhHans": "成立"
    },
    {
      "code": "10.3.4",
      "titleEn": "Civilization Initialization",
      "titleZhHans": "形成事件"
    }
  ],
  "12.0": [
    {
      "code": "12.0.1",
      "legacyCode": "4.64.1",
      "titleEn": "Static Carriers",
      "titleZhHans": "岩石、山脉、矿物"
    },
    {
      "code": "12.0.2",
      "legacyCode": "4.64.2",
      "titleEn": "Rhythmic Carriers",
      "titleZhHans": "植物、菌类、生态循环"
    },
    {
      "code": "12.0.3",
      "legacyCode": "4.64.3",
      "titleEn": "Reactive Carriers",
      "titleZhHans": "动物、昆虫、鱼类"
    },
    {
      "code": "12.0.4",
      "legacyCode": "4.64.4",
      "titleEn": "Behavioral Carriers",
      "titleZhHans": "能够学习、模仿与重复行为的载体"
    },
    {
      "code": "12.0.5",
      "legacyCode": "4.64.5",
      "titleEn": "Goal-Oriented Carriers",
      "titleZhHans": "能够围绕未来目标组织资源的载体"
    },
    {
      "code": "12.0.6",
      "legacyCode": "4.64.6",
      "titleEn": "Cognitive Carriers",
      "titleZhHans": "能够形成抽象模型、语言、规划与模拟的载体"
    },
    {
      "code": "12.0.7",
      "legacyCode": "4.64.7",
      "titleEn": "Shared Carriers",
      "titleZhHans": "家庭、部落、公司、宗教与国家"
    },
    {
      "code": "12.0.8",
      "legacyCode": "4.64.8",
      "titleEn": "Systemic Carriers",
      "titleZhHans": "文明、互联网、金融与法律系统"
    },
    {
      "code": "12.0.9",
      "legacyCode": "4.64.9",
      "titleEn": "Synthetic Carriers",
      "titleZhHans": "AI、Agent Network 与 Machine System"
    },
    {
      "code": "12.0.10",
      "legacyCode": "4.64.10",
      "titleEn": "Integrated Carriers",
      "titleZhHans": "生物、社会与合成系统共同形成的复合载体"
    }
  ]
};

const readJson = async path => JSON.parse(await fs.readFile(path, 'utf8'));
const writeJson = async (path, value) =>
  fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

const registry = await readJson(nodesPath);
const blueprint = await readJson(blueprintPath);
const packageJson = await readJson(packagePath);
const existingBook3 = registry.nodes.filter(node =>
  node.publicationBookCode === 'BOOK-3' &&
  ['P10','P11','P12'].includes(node.publicationPartCode)
);
const existingByCode = new Map(existingBook3.map(node => [node.nodeCode, node]));
const targetCodes = new Set(chapters.map(chapter => chapter.nodeCode));

for (const node of existingBook3) {
  if (!targetCodes.has(node.nodeCode)) {
    throw new Error(`BOOK3_FINAL_OUTLINE_ORPHAN_NODE: ${node.nodeCode}`);
  }
  if (!['planned','draft'].includes(node.registryStatus)) {
    throw new Error(`BOOK3_FINAL_OUTLINE_PRODUCTION_STATE_BLOCKED: ${node.nodeCode}`);
  }
}

const sequences = new Map();
for (const chapter of chapters) {
  if (!sequences.has(chapter.partCode)) sequences.set(chapter.partCode, []);
  sequences.get(chapter.partCode).push(chapter.nodeCode);
}
const sequence = [
  ...sequences.get('P10'),
  ...sequences.get('P11'),
  ...sequences.get('P12')
];

const identityChanges = [];
for (const [index, chapter] of chapters.entries()) {
  const existing = existingByCode.get(chapter.nodeCode);
  const previousNodeCode = index === 0 ? 'KN-B2-P9-039' : sequence[index - 1];
  const nextNodeCode = index < sequence.length - 1 ? sequence[index + 1] : null;

  if (existing && (
    existing.chapterCode !== chapter.chapterCode ||
    existing.titleEn !== chapter.titleEn ||
    existing.titleZhHans !== chapter.titleZhHans ||
    existing.canonicalQuestionKey !== chapter.canonicalQuestionKey
  )) {
    identityChanges.push({
      nodeCode: chapter.nodeCode,
      previousChapterCode: existing.chapterCode,
      nextChapterCode: chapter.chapterCode,
      previousTitleEn: existing.titleEn,
      nextTitleEn: chapter.titleEn,
      previousTitleZhHans: existing.titleZhHans,
      nextTitleZhHans: chapter.titleZhHans,
      reason: 'pre-kh-w4k-final-outline-normalization'
    });
  }

  const relation = {
    prerequisiteNodeCodes: [previousNodeCode],
    nextNodeCodes: nextNodeCode ? [nextNodeCode] : [],
    relatedNodeCodes: [],
    parentNodeCodes: [],
    childNodeCodes: []
  };

  const next = {
    ...(existing || {}),
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
    registryStatus: existing?.registryStatus === 'draft' ? 'draft' : 'planned',
    productionQueue: 'not_scheduled',
    productionEffort: 'unassessed',
    publicationPriority: 'not_scheduled',
    supportingQuestionCodes: existing?.supportingQuestionCodes || [],
    legacyNodeCodes: [
      ...(existing?.legacyNodeCodes || []),
      ...(chapter.chapterCode === '12.0' ? ['BOOK-1:4.64'] : [])
    ].filter((value, position, values) => values.indexOf(value) === position),
    relationships: relation,
    dependencies: relation.prerequisiteNodeCodes,
    crossSessionNode: {
      enabled: true,
      scope: 'book-3',
      continuityKey: `BOOK-3:${chapter.partCode}:${chapter.chapterCode}`,
      previousNodeCode,
      nextNodeCode
    },
    chapterCode: chapter.chapterCode,
    partCode: chapter.partCode,
    sourceBookCode: 'BOOK-3',
    publicationBookCode: 'BOOK-3',
    publicationPartCode: chapter.partCode,
    titleEn: chapter.titleEn,
    titleZhHans: chapter.titleZhHans,
    supportingDimensions: supportingDimensions[chapter.chapterCode] || [],
    productionReady: false,
    articleStatus: 'not_created',
    candidateStatus: 'not_created',
    sourceReferences: existing?.sourceReferences || [],
    version: '2.1.0'
  };

  if (existing) Object.assign(existing, next);
  else registry.nodes.push(next);
}

const finalBook3 = registry.nodes.filter(node =>
  node.publicationBookCode === 'BOOK-3' &&
  ['P10','P11','P12'].includes(node.publicationPartCode)
);
if (finalBook3.length !== 187) {
  throw new Error(`BOOK3_FINAL_OUTLINE_COUNT_MISMATCH: ${finalBook3.length}`);
}

blueprint.contract = 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.1.0';
blueprint.schemaVersion = 'PHI-OS-KNOWLEDGE-BLUEPRINT-v2.0.0';
blueprint.status = 'final-outline-registry-freeze';
blueprint.bookCode = 'BOOK-3';
blueprint.bookTitleZhHans = '世界如何不断扩展';
blueprint.sourceParts = 3;
blueprint.plannedCanonicalNodes = 187;
blueprint.newNodesBeyondPreface = 187;
blueprint.activeProductionLimit = 0;
blueprint.parts = [
  { partCode:'P10', title:'第十部｜Runtime Expansion', canonicalNodeCount:77, nodes:sequences.get('P10') },
  { partCode:'P11', title:'第十一部｜Civilization Runtime', canonicalNodeCount:64, nodes:sequences.get('P11') },
  { partCode:'P12', title:'第十二部｜Civilization Atlas', canonicalNodeCount:46, nodes:sequences.get('P12') }
];
blueprint.nodes = chapters.map(chapter => {
  const node = registry.nodes.find(candidate => candidate.nodeCode === chapter.nodeCode);
  return {
    nodeCode: node.nodeCode,
    chapterCode: node.chapterCode,
    titleZhHans: node.titleZhHans,
    titleEn: node.titleEn,
    partCode: node.partCode,
    status: node.registryStatus,
    productionPriority: 'not_scheduled',
    articleRequiredNow: false,
    sourceRole: 'canonical-mechanism',
    supportingDimensions: node.supportingDimensions,
    crossSessionNode: node.crossSessionNode,
    relationships: node.relationships,
    dependencies: node.dependencies
  };
});
blueprint.registryCompletion = {
  stage: 'KH-W4B.5-BOOK-3-FINAL-OUTLINE',
  baselineFullCommitSha: BASELINE,
  parts: ['P10','P11','P12'],
  canonicalNodeCount: 187,
  permanentIdentityPreserved: true,
  addedNodeCodes: [
    'KN-B3-P11-061','KN-B3-P11-062','KN-B3-P11-063','KN-B3-P11-064',
    'KN-B3-P12-046'
  ],
  carrierMigration: {
    sourceChapterCode: '4.64',
    targetChapterCode: '12.0',
    targetNodeCode: 'KN-B3-P12-046'
  }
};
blueprint.productionPolicy = {
  articleGenerationAllowed:false,
  candidateGenerationAllowed:false,
  productionReadyPromotionAllowed:false,
  allowedRegistryStatuses:['planned','draft'],
  productionRequiresStage:'KH-W4K'
};
blueprint.releaseRecommendation = {
  wave1:[],
  wave2:[],
  remaining:'All Book 3 nodes remain planned or draft until KH-W4K Registry Authority freeze.'
};

const migration = {
  contract: 'KH-W4B.5-BOOK-3-FINAL-OUTLINE-MIGRATION-v1',
  status: 'frozen',
  baselineFullCommitSha: BASELINE,
  previousCounts: { P10:77, P11:60, P12:45, total:182 },
  finalCounts: { P10:77, P11:64, P12:46, total:187 },
  identityPolicy: {
    existingNodeCodesRetained: true,
    newNodeCodesOnlyForNewMechanisms: true,
    productionStateChangesAllowed: false,
    preKhW4kMeaningRevisionRecorded: true
  },
  carrierMigration: {
    legacyChapterCode: '4.64',
    finalChapterCode: '12.0',
    nodeCode: 'KN-B3-P12-046',
    subtypePolicy: 'supporting_dimensions_not_independent_canonical_nodes'
  },
  initializationSubtypePolicy: {
    chapterCode: '10.3',
    subtypePolicy: 'supporting_dimensions_not_independent_canonical_nodes'
  },
  addedNodeCodes: [
    'KN-B3-P11-061','KN-B3-P11-062','KN-B3-P11-063','KN-B3-P11-064',
    'KN-B3-P12-046'
  ],
  identityChanges
};

const normalization = {
  contract:'KH-W4B.5-BOOK-3-REGISTRY-NORMALIZATION-v2',
  status:'frozen',
  baselineFullCommitSha:BASELINE,
  bookCode:'BOOK-3',
  finalTitles: {
    P10:'Runtime Expansion',
    P11:'Civilization Runtime',
    P12:'Civilization Atlas'
  },
  rules: {
    canonicalPrefix:'KN-B3',
    parts:['P10','P11','P12'],
    permanentIdentityRetainedBeforeKhW4k:true,
    carrierLegacyNumberingProhibited:true,
    nestedVariationsAreSupportingDimensions:true,
    articlesCandidatesAndProductionStatesRemainClosed:true
  },
  counts:{P10:77,P11:64,P12:46,total:187}
};

packageJson.scripts['knowledge:finalize-book-3-outline'] =
  'node scripts/finalize-kh-w4b5-book-3-outline.mjs';
packageJson.scripts['check:kh-w4b.5-book-3'] =
  'node scripts/check-kh-w4b5-book-3-canonical-node-registry.mjs';

await writeJson(nodesPath, registry);
await writeJson(blueprintPath, blueprint);
await writeJson(migrationPath, migration);
await writeJson(normalizationPath, normalization);
await writeJson(packagePath, packageJson);

console.log('✓ Book 3 final outline migrated.');
console.log('✓ P10 77 / P11 64 / P12 46 / Total 187.');
console.log('✓ Existing 182 Node identities retained; 5 new identities added.');
console.log('✓ Legacy 4.64 Carrier Archetypes normalized to 12.0 / KN-B3-P12-046.');
console.log('✓ No Article, Candidate, Readiness, Review, Approval or Publication state generated.');
console.log('Run: npm run knowledge:freeze');
