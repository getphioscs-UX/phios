import fs from 'node:fs/promises';
import path from 'node:path';
import { applyVapW9, VAP_W9_PATHS } from './lib/visual-article-production/human-editorial-review-candidate-promotion-v1.mjs';
const root = process.cwd();
const args = process.argv.slice(2);
const apply = args.includes('--apply');
if (!apply) {
  console.error('VAP-W9 is fail-closed. Use --apply only after six explicit per-node TL Human Editorial decisions are recorded.');
  process.exit(2);
}
const envelope = JSON.parse(await fs.readFile(path.join(root, VAP_W9_PATHS.decisions), 'utf8'));
const result = await applyVapW9(root, envelope, { apply: true });
console.log(`VAP-W9 HUMAN REVIEWS: ${result.activation.humanEditorialReviewCount}`);
console.log(`VAP-W9 ACCEPTED: ${result.activation.humanAcceptedCount}`);
console.log(`VAP-W9 PROMOTED TO PJA APPROVAL ELIGIBILITY: ${result.activation.candidatePromotionCount}`);
console.log(`VAP-W9 APPROVALS: ${result.activation.approvalCount}`);
console.log(`VAP-W9 PUBLICATIONS: ${result.activation.publicationCount}`);
