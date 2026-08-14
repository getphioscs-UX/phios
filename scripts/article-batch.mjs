import { writeBatchPlan } from './lib/article-simplification/batch-orchestrator-v1.mjs';

const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const bookCode = valueAfter('--book');
const countRaw = valueAfter('--count');
const locale = valueAfter('--locale') || 'zh-Hans';
const batchCode = valueAfter('--batch') || null;

if (!bookCode) throw new Error('article:batch requires --book, for example --book BOOK-1');
if (!countRaw || !/^\d+$/.test(countRaw)) throw new Error('article:batch requires a positive integer --count');
const count = Number(countRaw);
const { plan, outputPath, reusedExistingPlan } = writeBatchPlan(process.cwd(), { bookCode, locale, count, batchCode });

console.log(`✓ APS-3 article:batch ${reusedExistingPlan ? 'reused' : 'created'} ${plan.batchCode}: ${outputPath}`);
console.log(`✓ Selected ${plan.selection.selectedCount}/${plan.selection.availableReadyCount} ARTICLE_READY nodes; requested maximum ${plan.request.requestedCount}.`);
if (plan.selection.shortfallCount > 0) console.log(`✓ Shortfall ${plan.selection.shortfallCount} is valid because --count is a maximum, not a quota.`);
console.log(`✓ Downstream chunks respect the ${plan.selection.downstreamPjaWaveMaximum}-node PJA wave maximum.`);
console.log('✓ APS-3 created no Candidate, Human Decision, Provider call or Publication authority.');
console.log('→ APS-4 will extend this same article:batch path with governed candidate orchestration.');
