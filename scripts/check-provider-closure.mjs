import fs from 'node:fs';
import path from 'node:path';
import { createProviderFailure, createProviderResult } from '../functions/runtime/shared/provider-interface.js';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const registry = JSON.parse(read('content/registry/provider-closure.json'));
const priority = ['rule_engine', 'workers_ai', 'openai', 'professional_review'];
const fields = ['success','provider','model','stage','output','confidence','missing_evidence','warnings','usage'];

if (registry.status !== 'closed') throw new Error('Provider Closure is not closed.');
if (JSON.stringify(registry.priority) !== JSON.stringify(priority)) throw new Error('Provider priority has drifted.');
if (JSON.stringify(registry.interface?.requiredFields) !== JSON.stringify(fields)) throw new Error('Provider interface has drifted.');
if (registry.callBoundary?.page !== 'api_only' || registry.callBoundary?.api !== 'router_only' || registry.callBoundary?.router !== 'provider_only') throw new Error('Provider call boundary has drifted.');
if (registry.fallback?.preserveRuleEngineOutput !== true || registry.fallback?.destroySession !== false) throw new Error('Provider fallback does not preserve Runtime state.');

const sample = createProviderResult({ provider: 'workers_ai', model: 'fixture', stage: 'reading', output: { ok: true } });
for (const field of fields) if (!(field in sample)) throw new Error(`Provider result field missing: ${field}`);
if (sample.enrichment !== sample.output) throw new Error('Provider compatibility alias diverges from output.');
const failure = createProviderFailure({ provider: 'openai', stage: 'entry', code: 'timeout' });
if (failure.success !== false || failure.output !== null || !failure.warnings.length) throw new Error('Provider failure envelope is invalid.');

const fixtureDirectory = path.join(root, 'tests/fixtures/provider-failures');
const fixtures = fs.readdirSync(fixtureDirectory).filter(name => name.endsWith('.json')).map(name => JSON.parse(fs.readFileSync(path.join(fixtureDirectory, name), 'utf8')));
for (const type of registry.failureFixtures) if (!fixtures.some(fixture => fixture.failure === type)) throw new Error(`Provider failure fixture missing: ${type}`);
for (const fixture of fixtures) if (fixture.preserveRuleOutput !== true || fixture.destroySession !== false) throw new Error(`Unsafe Provider failure fixture: ${fixture.failure}`);

const entryRouter = read('functions/runtime/entry/provider-router.js');
const readingRouter = read('functions/runtime/reading/provider-router.js');
for (const [name, source] of [['entry', entryRouter], ['reading', readingRouter]]) {
  const rule = source.indexOf(name === 'entry' ? 'evaluateEntryRuleFirst' : 'readRuntimeRuleFirst');
  const workers = source.indexOf(name === 'entry' ? 'runWorkersAIEntry' : 'runWorkersAIReading', rule + 1);
  const openai = source.indexOf(name === 'entry' ? 'runOpenAIEntry' : 'runOpenAIReading', workers + 1);
  if (rule < 0 || workers < rule || openai < workers) throw new Error(`${name} Provider priority is not Rule → Workers AI → OpenAI.`);
  if (!source.includes("code: 'provider_failed'")) throw new Error(`${name} Router does not return Provider failure warnings.`);
}

const pageSources = fs.readdirSync(path.join(root, 'assets/js/pages')).filter(name => name.endsWith('.js')).map(name => read(`assets/js/pages/${name}`)).join('\n');
if (/runtime\/(entry|reading)\/providers|runWorkersAI|runOpenAI/.test(pageSources)) throw new Error('A page directly calls a Provider.');

for (const [api, router] of [['functions/api/reconstruct-reality.js','routeRuntimeEntry'], ['functions/api/read-runtime.js','routeRealityReading']]) {
  if (!read(api).includes(router)) throw new Error(`${api} bypasses its Provider Router.`);
}

for (const file of [
  'functions/runtime/entry/providers/workers-ai.js', 'functions/runtime/entry/providers/openai.js',
  'functions/runtime/reading/providers/workers-ai.js', 'functions/runtime/reading/providers/openai.js'
]) {
  const source = read(file);
  if (!source.includes('createProviderResult')) throw new Error(`Provider interface not applied: ${file}`);
  if (/sessionStorage|localStorage|setSession\(/.test(source)) throw new Error(`Provider persists Runtime state: ${file}`);
}

console.log('✓ M1-W4 Provider priority, interface, Router boundary, fallback, and failure fixtures checks passed.');
