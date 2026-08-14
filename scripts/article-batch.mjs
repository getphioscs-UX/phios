import { writeBatchPlan } from './lib/article-simplification/batch-orchestrator-v1.mjs';
import { DEFAULT_TARGET_LOCALES, writeCandidateOrchestration } from './lib/article-simplification/candidate-orchestrator-v1.mjs';

const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};
const bookCode = valueAfter('--book');
const countRaw = valueAfter('--count');
const locale = valueAfter('--locale') || 'zh-Hans';
const batchCode = valueAfter('--batch') || null;
const targetLocalesRaw = valueAfter('--locales');
const targetLocales = targetLocalesRaw
  ? targetLocalesRaw.split(',').map(value => value.trim()).filter(Boolean)
  : [...DEFAULT_TARGET_LOCALES];

if (!bookCode) throw new Error('article:batch requires --book, for example --book BOOK-1');
if (!countRaw || !/^\d+$/.test(countRaw)) throw new Error('article:batch requires a positive integer --count');
const count = Number(countRaw);
const root = process.cwd();
const { plan, outputPath, reusedExistingPlan } = writeBatchPlan(root, { bookCode, locale, count, batchCode });

console.log(`✓ APS-3 article:batch ${reusedExistingPlan ? 'reused' : 'created'} ${plan.batchCode}: ${outputPath}`);
console.log(`✓ Selected ${plan.selection.selectedCount}/${plan.selection.availableReadyCount} ARTICLE_READY nodes; requested maximum ${plan.request.requestedCount}.`);
if (plan.selection.shortfallCount > 0) console.log(`✓ Shortfall ${plan.selection.shortfallCount} is valid because --count is a maximum, not a quota.`);
console.log(`✓ Downstream chunks respect the ${plan.selection.downstreamPjaWaveMaximum}-node PJA wave maximum.`);

const candidateResult = writeCandidateOrchestration(root, plan, { targetLocales });
const orchestration = candidateResult.orchestration;
console.log(`✓ APS-4 Candidate Orchestration ${candidateResult.reusedExistingOrchestration ? 'reused' : 'created'}: ${candidateResult.outputPath}`);
console.log(`✓ Primary candidates ready ${orchestration.summary.primaryCandidateReadyCount}/${orchestration.summary.selectedNodeCount}; reused existing ${orchestration.summary.reusedExistingPrimaryCandidateCount}.`);
console.log(`✓ Locale lanes: ${orchestration.targetLocales.join(' + ')}; candidate-ready ${orchestration.summary.localeCandidateReadyCount}/${orchestration.summary.localeLaneCount}; locale-discovery blocked ${orchestration.summary.localeDiscoveryBlockedCount}.`);
console.log('✓ Candidate remains candidate-only; article:batch creates no Human Review, Human Approval, Human Publication, CAR, CPR or Visual Article authority.');
console.log('✓ No implicit paid-AI/network call is made when a Candidate is missing; APS reports a governed generation requirement instead.');
console.log('→ APS-5 will assemble one review batch and reuse exact digest-bound Human evidence where already available.');
