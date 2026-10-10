import { writePendingVapW9Projection } from './lib/visual-article-production/human-editorial-review-candidate-promotion-v1.mjs';
const result = await writePendingVapW9Projection(process.cwd(), { apply: true });
console.log(`VAP-W9 REVIEW QUEUE: ${result.reviewQueue.entries.length}`);
console.log(`VAP-W9 HUMAN DECISIONS RECORDED: ${result.activation.humanDecisionRecordedCount}`);
console.log(`VAP-W9 PROMOTED: ${result.activation.candidatePromotionCount}`);
console.log(`VAP-W9 STATUS: ${result.activation.status}`);
