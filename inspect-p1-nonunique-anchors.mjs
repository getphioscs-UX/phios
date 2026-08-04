import fs from "node:fs";

const candidatePath =
  ".tmp/knowledge-manuscripts/book-1/p1-reality-physics-candidate.md";

const reviewPath =
  ".tmp/knowledge-manuscripts/book-1/p1-node-mapping-review.json";

const text = fs.readFileSync(candidatePath, "utf8");
const review = JSON.parse(fs.readFileSync(reviewPath, "utf8"));

for (const node of review.nodes) {
  for (const range of node.ranges ?? []) {
    const anchor = range.startAnchor;
    const positions = [];

    let from = 0;
    while (anchor && from <= text.length) {
      const index = text.indexOf(anchor, from);
      if (index === -1) break;
      positions.push(index);
      from = index + Math.max(anchor.length, 1);
    }

    if (positions.length !== 1) {
      console.log(`\n${node.nodeCode}`);
      console.log(`Occurrences: ${positions.length}`);
      console.log(`Anchor: ${anchor}`);

      for (const position of positions) {
        console.log("---");
        console.log(
          text
            .slice(
              Math.max(0, position - 80),
              Math.min(text.length, position + anchor.length + 180)
            )
            .replace(/\n+/gu, " ")
        );
      }
    }
  }
}
