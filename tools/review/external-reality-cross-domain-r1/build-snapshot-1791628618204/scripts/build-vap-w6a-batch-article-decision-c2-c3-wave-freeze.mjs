import { writeVapW6aPendingProjection } from './lib/visual-article-production/batch-article-decision-c2-c3-wave-freeze-v1.mjs';

const root = process.cwd();
const { eligibility, activation } = writeVapW6aPendingProjection(root);
console.log('✓ VAP-W6A pending authority projection built.');
console.log(`✓ Human ARTICLE approved: ${eligibility.summary.humanArticleApprovedCount}/${eligibility.summary.selectedNodeCount}`);
console.log(`✓ C2 frozen: ${eligibility.summary.c2FrozenCount}/${eligibility.summary.selectedNodeCount}; C3 ready: ${eligibility.summary.c3ProductionReadyCount}/${eligibility.summary.selectedNodeCount}.`);
console.log(`✓ New Article execution eligible: ${eligibility.summary.newArticleExecutionEligibleCount}/${eligibility.summary.selectedNodeCount}.`);
console.log(`✓ Status: ${activation.status}`);
