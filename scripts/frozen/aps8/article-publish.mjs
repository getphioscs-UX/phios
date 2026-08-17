import { runAps7Publication } from './lib/article-simplification/publication-orchestrator-v1.mjs';

const args = process.argv.slice(2);
const valueAfter = flag => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; };
const batchCode = valueAfter('--batch');
if (!batchCode) {
  console.error('article:publish requires --batch, for example --batch BATCH-001');
  process.exit(2);
}
try {
  const result = await runAps7Publication(process.cwd(), batchCode, { apply: true });
  console.log(`✓ APS-6 explicit Human Decision Bridge validated ${result.result.humanDecisionCount} independent node/locale decisions.`);
  console.log(`✓ APS-7 publication orchestration completed for ${batchCode}.`);
  console.log(`✓ publish ${result.result.publishAuthorizedCount}; defer ${result.result.deferCount}; do_not_publish ${result.result.doNotPublishCount}.`);
  console.log('✓ VAP-W11 authority reused; frozen PJA publication implementation remained byte-identical; frozen-brief successor validation was used.');
  console.log('✓ Published entries proceeded to Published Knowledge Authority → conditional CAR → CPR → Visual Article → same-route locale release.');
} catch (error) {
  if (error?.code === 'APS7_EXPLICIT_HUMAN_DECISIONS_REQUIRED') {
    console.error(`APS-7 BLOCKED: ${error.code}`);
    console.error(`Pending node(s): ${String(error.message).replace(/^APS7_EXPLICIT_HUMAN_DECISIONS_REQUIRED:\s*/, '')}`);
    console.error(`Complete publicationDecision, publisherCode=TL, decidedAt and summary in content/production/article-simplification/batches/${batchCode}/human-decisions.v1.json, then rerun this command.`);
    process.exit(2);
  }
  throw error;
}
