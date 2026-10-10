import { applyVapW6aFormation } from './lib/visual-article-production/batch-article-decision-c2-c3-wave-freeze-v1.mjs';

try {
  const result = applyVapW6aFormation(process.cwd());
  console.log('✓ VAP-W6A governed Article execution formation applied.');
  console.log(`✓ Human-approved Article nodes: ${result.human.approvedNodeCodes.length}.`);
  console.log(`✓ C2 frozen / C3 production-ready / execution eligible: ${result.eligibility.summary.c2FrozenCount}/${result.eligibility.summary.c3ProductionReadyCount}/${result.eligibility.summary.newArticleExecutionEligibleCount}.`);
  console.log('✓ No Candidate, Provider invocation, publication or Canonical Knowledge mutation was performed by VAP-W6A.');
} catch (error) {
  console.error(`${error.code || 'VAP_W6A_APPLY_FAILED'}${error.detail ? `: ${JSON.stringify(error.detail)}` : ''}`);
  process.exitCode = 1;
}
