import fs from "node:fs";

const freshPath =
  ".tmp/knowledge-manuscripts/book-1/p1-node-mapping-review.json";

const approvedPath =
  ".tmp/knowledge-manuscripts/book-1/p1-node-mapping-review.tl-approved-backup.json";

const fresh = JSON.parse(fs.readFileSync(freshPath, "utf8"));
const approved = JSON.parse(fs.readFileSync(approvedPath, "utf8"));

const approvedByCode = new Map(
  approved.nodes.map(node => [node.nodeCode, node])
);

fresh.nodes = fresh.nodes.map(freshNode => {
  const reviewed = approvedByCode.get(freshNode.nodeCode);

  if (!reviewed) {
    throw new Error(`Reviewed node missing: ${freshNode.nodeCode}`);
  }

  return {
    ...freshNode,

    decision: reviewed.decision,
    checks: reviewed.checks,

    candidateRanges: reviewed.candidateRanges,
    ranges: reviewed.ranges,

    crossSectionReferences: reviewed.crossSectionReferences,
    unresolved: reviewed.unresolved,

    conflict: reviewed.conflict,
    paidBookSubstitutionRisk: reviewed.paidBookSubstitutionRisk,

    reviewerRole: reviewed.reviewerRole,
    reviewedBy: reviewed.reviewedBy,
    reviewedAt: reviewed.reviewedAt
  };
});

fresh.application = {
  ...fresh.application,
  status: "not_applied",
  appliedMappingSha256: null
};

fs.writeFileSync(
  freshPath,
  `${JSON.stringify(fresh, null, 2)}\n`,
  "utf8"
);

console.log("P1 TL review merged into fresh generated identity.");
