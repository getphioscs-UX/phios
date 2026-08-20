import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  CKA_ENTRY_MODES,
  CKA_ENTRY_SURFACES,
  CKA_GUEST_MAX_FOLLOW_UP_DEPTH,
  CKA_UNKNOWN_STATES,
  classifyCkaFollowUpBoundary,
  composeCkaRetrievalQuestion,
  createCkaFollowUpContext,
  normalizeCkaEntryContext,
  projectCkaClientAnswer
} from '../functions/_lib/client-knowledge-ask.js';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const selected = work => !process.argv[2] || process.argv[2] === 'ALL' || process.argv[2] === work;
const baseline = '316a1bcc8adc817bb8c8fb005260462bb316efdf';

const paths = Object.freeze({
  w0: 'content/client/knowledge-ask/contracts/cka-w0-ask-entry-contract-v1.json',
  w1: 'content/client/knowledge-ask/contracts/cka-w1-question-composer-contract-v1.json',
  w2: 'content/client/knowledge-ask/contracts/cka-w2-answer-surface-contract-v1.json',
  w3: 'content/client/knowledge-ask/contracts/cka-w3-knowledge-card-contract-v1.json',
  w4: 'content/client/knowledge-ask/contracts/cka-w4-follow-up-contract-v1.json',
  registry: 'content/client/knowledge-ask/registries/cka-entry-surface-registry-v1.json',
  audit: 'content/client/knowledge-ask/evidence/cka-w0-w4-authority-and-consumer-audit-v1.json',
  acceptance: 'content/client/knowledge-ask/acceptance/cka-w0-w4-batch-a-acceptance-v1.json',
  freeze: 'content/client/knowledge-ask/freeze/cka-w0-w4-batch-a-freeze-v1.json',
  html: 'knowledge-search.html',
  css: 'assets/css/knowledge-search.css',
  client: 'assets/js/pages/knowledge-search.js',
  apiClient: 'assets/js/knowledge/ask-phios-client.js',
  api: 'functions/api/ask-phios.js',
  serverProjection: 'functions/_lib/client-knowledge-ask.js',
  kapAnswer: 'functions/_lib/knowledge-answer-composition.js',
  kapGrounding: 'functions/_lib/knowledge-answer-grounding.js',
  strongFixture: 'content/knowledge/answer-projection/fixtures/ask-phios-response.strong.valid.json',
  insufficientFixture: 'content/knowledge/answer-projection/fixtures/ask-phios-response.insufficient.valid.json',
  homepage: 'index.html',
  homepageCss: 'assets/css/hpc2-pre-home-visuals.css',
  en: 'assets/js/locales/en/public.js',
  zh: 'assets/js/locales/zh-Hans/public.js',
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing BATCH-CKA-A dependency: ${path}`);

const contracts = {
  W0: read(paths.w0),
  W1: read(paths.w1),
  W2: read(paths.w2),
  W3: read(paths.w3),
  W4: read(paths.w4)
};
const registry = read(paths.registry);
const audit = read(paths.audit);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const html = text(paths.html);
const css = text(paths.css);
const client = text(paths.client);
const apiClient = text(paths.apiClient);
const api = text(paths.api);
const serverProjection = text(paths.serverProjection);
const homepage = text(paths.homepage);
const homepageCss = text(paths.homepageCss);
const en = text(paths.en);
const zh = text(paths.zh);
const pkg = read(paths.package);

for (const contract of Object.values(contracts)) assert.equal(contract.baselineCommit, baseline);
assert.equal(audit.baselineCommit, baseline);
assert.equal(acceptance.baselineCommit, baseline);
assert.equal(freeze.baselineCommit, baseline);

for (const snapshot of audit.predecessorSnapshots) {
  assert.equal(sha256(snapshot.path), snapshot.sha256, `CKA predecessor authority drift: ${snapshot.path}`);
}
assert.equal(sha256(paths.kapAnswer), '601cdfe9c75affe453f86b31deedd524c515613e08e15c6ab017707f1cbee965');
assert.equal(sha256(paths.kapGrounding), 'b251475a4ff303b6c7428290d7ed231af5416b8fffa14077b9defe37952e5011');

if (selected('W0')) {
  assert.equal(contracts.W0.work, 'CKA-W0');
  assert.deepEqual(contracts.W0.supportedEntrySurfaces, CKA_ENTRY_SURFACES);
  assert.deepEqual(contracts.W0.modes, CKA_ENTRY_MODES);
  assert.deepEqual(contracts.W0.realityAwareRequirements, ['permission', 'privacy', 'entitlement', 'account', 'realityCaseId']);
  assert.equal(registry.records.length, 8);
  assert.equal(registry.records.find(record => record.entrySurface === 'FIGURE').contextualOnly, true);
  assert.equal(registry.records.find(record => record.entrySurface === 'REALITY_DASHBOARD').consumerState, 'CONTRACT_READY_AUTHORIZATION_REQUIRED');

  const global = normalizeCkaEntryContext({ entrySurface: 'HOMEPAGE', mode: 'GLOBAL', locale: 'en' });
  assert.equal(global.entrySurface, 'HOMEPAGE');
  assert.equal(global.governance.createsPersistentCase, false);
  assert.throws(() => normalizeCkaEntryContext({ entrySurface: 'FIGURE', mode: 'CONTEXTUAL' }), /CKA_FIGURE_CONTEXT_REQUIRED/);
  assert.throws(() => normalizeCkaEntryContext({ entrySurface: 'REALITY_DASHBOARD', mode: 'REALITY_AWARE', realityCaseId: 'case-1' }), /CKA_REALITY_CONTEXT_NOT_AUTHORIZED/);
  const realityAware = normalizeCkaEntryContext({
    entrySurface: 'REALITY_DASHBOARD',
    mode: 'REALITY_AWARE',
    realityCaseId: 'case-1',
    accountState: 'ACCOUNT',
    permission: true,
    privacy: true,
    entitlement: true
  });
  assert.equal(realityAware.authorization.permissionVerified, true);
  assert.equal(realityAware.governance.createsPersistentCase, false);

  assert.match(homepage, /data-hpc2-consumer-state="ACTIVE_CKA_W0"/);
  assert.match(homepage, /href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=GLOBAL"/);
  assert.match(homepage, /data-cka-entry-surface="HOMEPAGE"/);
  assert.doesNotMatch(homepage, /data-hpc2-consumer-state="MISSING_PENDING_CKA"/);
  assert.equal(count(homepage, /href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=GLOBAL"/g), 1);
  assert.doesNotMatch(text('assets/js/pages/home-production.js'), /\/api\/ask-phios|fetch\([^)]*knowledge-search/i);
  assert.match(homepageCss, /\.hpc2-h04__ask-link\s*\{/);
}

if (selected('W1')) {
  assert.equal(contracts.W1.work, 'CKA-W1');
  assert.match(html, /<h1>What would you like to understand\?<\/h1>/);
  assert.match(html, /data-cka-composer/);
  assert.match(html, /data-cka-question/);
  const composer = html.slice(html.indexOf('<form class="cka-composer"'), html.indexOf('</form>', html.indexOf('<form class="cka-composer"')) + 7);
  assert.equal(count(composer, /<(?:textarea|input)\b/g), 1);
  assert.doesNotMatch(composer, /<(?:select|fieldset)\b|runtime|evidence mode|knowledge node|journey type/i);
  assert.doesNotMatch(html, /data-answer-depth/);
  assert.doesNotMatch(client, /guided-reading-client|checkGuidedReadingEligibility|runGuidedReading/);
  assert.match(client, /contextGlobal:\s*'Asking PHI OS'/);
  assert.match(client, /title:\s*'你想了解什么？'/);
}

if (selected('W2')) {
  assert.equal(contracts.W2.work, 'CKA-W2');
  assert.deepEqual(contracts.W2.requiredOrder, [
    'QUESTION',
    'DIRECT_ANSWER',
    'WHY_THIS_MAY_HAPPEN',
    'WHAT_TO_OBSERVE',
    'WHAT_PHIOS_DOES_NOT_YET_KNOW',
    'RELATED_KNOWLEDGE'
  ]);
  const sectionOrder = [...html.matchAll(/data-cka-section="([A-Z_]+)"/g)].map(match => match[1]);
  assert.deepEqual(sectionOrder, contracts.W2.requiredOrder.slice(1));
  assert.ok(html.indexOf('data-cka-answer-question') < html.indexOf('data-cka-section="DIRECT_ANSWER"'));
  assert.ok(html.indexOf('data-cka-section="DIRECT_ANSWER"') < html.indexOf('data-cka-section="WHY_THIS_MAY_HAPPEN"'));
  assert.match(html, /<details class="cka-grounding" data-cka-grounding>/);
  assert.deepEqual(contracts.W2.unknownStates, CKA_UNKNOWN_STATES);
  assert.match(client, /answer\.directAnswer/);
  assert.match(client, /answer\.whyThisMayHappen/);
  assert.match(client, /answer\.whatToObserve/);
  assert.match(client, /answer\.unknown/);
  assert.match(client, /answer\.relatedKnowledgeCards/);
  assert.match(api, /projectCkaClientAnswer/);
  assert.match(api, /runAskPhiosPipeline/);
  assert.equal(contracts.W2.runtimeBinding.secondAnswerRuntimeCreated, false);
  assert.equal(contracts.W2.runtimeBinding.secondRetrievalRuntimeCreated, false);

  const strong = projectCkaClientAnswer(read(paths.strongFixture), {
    entryContext: normalizeCkaEntryContext({ entrySurface: 'KNOWLEDGE_SEARCH', mode: 'GLOBAL', locale: 'zh-Hans' }),
    followUpContext: createCkaFollowUpContext({ currentQuestion: '为什么人工智能是文明能力长期累积的结果?', followUpDepth: 0 })
  });
  assert.ok(strong.directAnswer.length > 0);
  assert.ok(CKA_UNKNOWN_STATES.includes(strong.unknown.state));
  assert.equal(strong.governance.createsCanonicalAuthority, false);

  const insufficient = projectCkaClientAnswer(read(paths.insufficientFixture), {
    entryContext: normalizeCkaEntryContext({ entrySurface: 'KNOWLEDGE_SEARCH', mode: 'GLOBAL', locale: 'zh-Hans' }),
    followUpContext: createCkaFollowUpContext({ currentQuestion: '问题', followUpDepth: 0 })
  });
  assert.equal(insufficient.unknown.state, 'INSUFFICIENT_EVIDENCE');
}

if (selected('W3')) {
  assert.equal(contracts.W3.work, 'CKA-W3');
  assert.deepEqual(contracts.W3.requiredPublicFields, ['concept', 'part', 'volume', 'description']);
  assert.deepEqual(contracts.W3.forbiddenPublicFields, ['nodeCode', 'fragmentCode', 'sectionCode', 'sourceId', 'pipelineState', 'candidatePublicationState']);
  assert.match(html, /data-cka-related-knowledge/);
  assert.doesNotMatch(html, /KN-B\d|candidate publication state|internal pipeline state/i);
  assert.doesNotMatch(client, /\.nodeCode|\.fragmentCode|\.sectionCode|\.sourceId|pipelineState|candidatePublicationState/);
  const projected = projectCkaClientAnswer(read(paths.strongFixture), {
    entryContext: normalizeCkaEntryContext({ entrySurface: 'KNOWLEDGE_SEARCH', mode: 'GLOBAL', locale: 'en' }),
    followUpContext: createCkaFollowUpContext({ currentQuestion: 'Why?', followUpDepth: 0 })
  });
  assert.ok(projected.relatedKnowledgeCards.length > 0);
  for (const card of projected.relatedKnowledgeCards) {
    assert.deepEqual(Object.keys(card), ['concept', 'part', 'volume', 'description', 'contentType', 'href']);
    assert.doesNotMatch(JSON.stringify(card), /KN-PREFACE|FRAGMENT-|pipelineState|candidatePublicationState/);
  }
  assert.match(css, /\.cka-card-grid\s*\{/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
}

if (selected('W4')) {
  assert.equal(contracts.W4.work, 'CKA-W4');
  assert.deepEqual(contracts.W4.recordedFields, ['currentQuestion', 'answerContext', 'knowledgeContext', 'followUpDepth']);
  assert.equal(CKA_GUEST_MAX_FOLLOW_UP_DEPTH, 1);
  const followUp = createCkaFollowUpContext({
    currentQuestion: 'Can you compare them?',
    contextQuestion: 'What is continuity?',
    parentAnswerId: 'answer-1',
    groundingBundleId: 'grounding-1',
    followUpDepth: 1,
    accountState: 'GUEST'
  });
  assert.equal(followUp.temporaryOnly, true);
  assert.equal(followUp.historyPersisted, false);
  assert.match(composeCkaRetrievalQuestion(followUp), /Follow-up:/);
  assert.throws(() => createCkaFollowUpContext({ currentQuestion: 'Again?', followUpDepth: 2, accountState: 'GUEST' }), /CKA_GUEST_FOLLOW_UP_LIMIT_REACHED/);
  assert.equal(classifyCkaFollowUpBoundary('Can you clarify this?').simpleAskAllowed, true);
  assert.equal(classifyCkaFollowUpBoundary('Please track my action and review the outcome').simpleAskAllowed, false);
  assert.match(html, /data-cka-follow-up-form/);
  assert.match(client, /followUpDepth:\s*state\.followUpDepth \+ 1/);
  assert.match(client, /state\.followUpDepth >= 1/);
  assert.match(api, /CKA_NOT_SIMPLE_ASK/);
  assert.match(api, /accountState:\s*'GUEST'/);
  assert.doesNotMatch(api, /startRealityJourney|runGuidedReading|createAccount|persistCase/i);
}

assert.equal(acceptance.batch, 'BATCH-CKA-A');
assert.equal(acceptance.works.length, 5);
assert.equal(acceptance.exitGate.simpleAskWithoutJourney, true);
assert.equal(acceptance.exitGate.simpleAskWithoutAccount, true);
assert.equal(acceptance.exitGate.structuredAnswer, true);
assert.equal(acceptance.exitGate.groundedAnswer, true);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(freeze.successorRules.nextWork, 'CKA-W5_GUIDED_CTA');
assert.equal(freeze.successorRules.automaticJourneyActivationAllowed, false);
assert.match(api, /secondAnswerRuntimeCreated:\s*false/);
assert.match(serverProjection, /internalNodeCodesProjectedToCards:\s*false/);
assert.match(en, /state:\s*'Ask PHI OS'/);
assert.match(zh, /state:\s*'向 PHI OS 提问'/);
assert.equal(pkg.scripts['check:cka-w0'], 'node scripts/check-cka-w0-w4.mjs W0');
assert.equal(pkg.scripts['check:cka-w1'], 'node scripts/check-cka-w0-w4.mjs W1');
assert.equal(pkg.scripts['check:cka-w2'], 'node scripts/check-cka-w0-w4.mjs W2');
assert.equal(pkg.scripts['check:cka-w3'], 'node scripts/check-cka-w0-w4.mjs W3');
assert.equal(pkg.scripts['check:cka-w4'], 'node scripts/check-cka-w0-w4.mjs W4');
assert.equal(pkg.scripts['check:cka-a'], 'node scripts/check-cka-w0-w4.mjs ALL');

console.log(`BATCH-CKA-A ${process.argv[2] || 'ALL'}: ACCEPTED`);
console.log('  CKA-W0: governed entry context + Homepage and Knowledge Search consumers active');
console.log('  CKA-W1: one-question composer; no runtime, evidence, node, method, authority or journey selection');
console.log('  CKA-W2/W3: six-section grounded answer + public knowledge cards; internal codes not rendered');
console.log('  CKA-W4: one temporary Guest follow-up; persistence, Guided Context and Journey activation = 0');
