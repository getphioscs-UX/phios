import { buildProviderGenerationPlan, runProviderGeneration } from './lib/visual-article-production/governed-provider-generation-v1.mjs';

const args = process.argv.slice(2);
const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const has = name => args.includes(name);
const root = process.cwd();
const providerCode = option('--provider');
const model = option('--model');
const locale = option('--locale') || undefined;
const maxNodes = option('--max-nodes') == null ? undefined : Number(option('--max-nodes'));
const maxOutputTokens = option('--max-output-tokens') == null ? undefined : Number(option('--max-output-tokens'));
const apply = has('--apply');
const network = has('--network');
const replace = has('--replace');

try {
  const plan = buildProviderGenerationPlan(root, { providerCode, model, locale, maxNodes, maxOutputTokens });
  const result = await runProviderGeneration(root, { providerCode, model, locale, maxNodes, maxOutputTokens, apply, network, replace });
  console.log(JSON.stringify({ plan, result }, null, 2));
  if (apply && network && result.eligibleNodeCodes?.length && result.candidatesStaged === 0) process.exitCode = 2;
} catch (error) {
  console.error(JSON.stringify({
    work: 'VAP-W7',
    status: 'blocked',
    code: error.code || error.message,
    detail: error.detail || null,
    networkCallMade: false,
    authorityWrites: 0,
    publicationCreated: false
  }, null, 2));
  process.exit(2);
}
