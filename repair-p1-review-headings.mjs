import fs from "node:fs";

const reviewPath =
  ".tmp/knowledge-manuscripts/book-1/p1-node-mapping-review.json";

const blueprintPath =
  "content/knowledge/blueprints/book-1-knowledge-blueprint.json";

const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, "utf8"));

const exactHeadings = {
  "KN-B1-P1-001": {
    start: "第一部｜现实物理学 Reality Physics",
    end: "结构 Structure | 可持续关系的形成"
  },
  "KN-B1-P1-002": {
    start: "第一部｜现实物理学 Reality Physics",
    end: "结构 Structure | 可持续关系的形成"
  },
  "KN-B1-P1-003": {
    start: "约束 Constraint | 可能性的裁剪机制",
    end: "Structural Connectivity | 现实如何形成持续连接"
  },
  "KN-B1-P1-004": {
    start: "结构 Structure | 可持续关系的形成",
    end: "Structural Network Architecture |"
  },
  "KN-B1-P1-005": {
    start: "Structural Topology | 结构如何形成可导航路径| 结构如何形成可导航路径",
    end: "Navigation Mechanics | 现实如何开始导航"
  },
  "KN-B1-P1-006": {
    start: "Structural Topology | 结构如何形成可导航路径| 结构如何形成可导航路径",
    end: "Navigation Mechanics | 现实如何开始导航"
  },
  "KN-B1-P1-007": {
    start: "Navigation Resolution | 现实如何提高导航精度",
    end: "Field Emergence | 为什么持续结构会形成场"
  },
  "KN-B1-P1-008": {
    start: "Field Emergence | 为什么持续结构会形成场",
    end: "Field Propagation | 为什么场会不断传播"
  },
  "KN-B1-P1-009": {
    start: "Field Propagation | 为什么场会不断传播",
    end: "Field Overlap |Field Overlap |为什么多个场能够共同存在为什么多个场能够共同存在"
  },
  "KN-B1-P1-010": {
    start: "Artificial Structure |Artificial Structure |人类人类如何主动建立结构如何主动建立结构",
    end: "Runtime Surface Formation | 现实现实如何形成可观察表面如何形成可观察表面"
  },
  "KN-B1-P1-011": {
    start: "Institutional Structure | 制度如何成为现实",
    end: "Runtime Surface Formation | 现实现实如何形成可观察表面如何形成可观察表面"
  },
  "KN-B1-P1-012": {
    start: "Runtime Surface Formation | 现实现实如何形成可观察表面如何形成可观察表面",
    end: "第二部｜投影系统"
  }
};

const blueprintByCode = new Map(
  blueprint.nodes.map(node => [node.nodeCode, node])
);

for (const node of review.nodes) {
  const blueprintNode = blueprintByCode.get(node.nodeCode);
  const heading = exactHeadings[node.nodeCode];

  if (!blueprintNode) {
    throw new Error(`Blueprint node missing: ${node.nodeCode}`);
  }

  if (!heading) {
    throw new Error(`Heading mapping missing: ${node.nodeCode}`);
  }

  node.titleZhHans = blueprintNode.titleZhHans;

  for (const field of ["candidateRanges", "ranges"]) {
    for (const range of node[field] ?? []) {
      range.startHeading = heading.start;
      range.endHeading = heading.end;
    }
  }
}

fs.writeFileSync(
  reviewPath,
  `${JSON.stringify(review, null, 2)}\n`,
  "utf8"
);

console.log("P1 titles and exact candidate headings repaired.");
