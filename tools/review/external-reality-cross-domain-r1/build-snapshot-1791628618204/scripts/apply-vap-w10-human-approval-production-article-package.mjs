import fs from 'node:fs/promises';
import path from 'node:path';
import { applyVapW10, VAP_W10_PATHS } from './lib/visual-article-production/human-approval-production-article-package-v1.mjs';
const root = process.cwd();
if (!process.argv.slice(2).includes('--apply')) {
  console.error('VAP-W10 is fail-closed. Use --apply only after six explicit per-node TL Human Approval decisions are recorded.');
  process.exit(2);
}
const envelope = JSON.parse(await fs.readFile(path.join(root, VAP_W10_PATHS.decisions), 'utf8'));
const result = await applyVapW10(root, envelope, { apply: true });
console.log(`VAP-W10 HUMAN APPROVAL DECISIONS: ${result.activation.humanApprovalDecisionCount}`);
console.log(`VAP-W10 HUMAN APPROVED: ${result.activation.humanApprovedCount}`);
console.log(`VAP-W10 PRODUCTION ARTICLE PACKAGES: ${result.activation.productionArticlePackageCount}`);
console.log(`VAP-W10 PUBLICATIONS: ${result.activation.publicationCount}`);
