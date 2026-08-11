import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildProviderGenerationPlan,
  buildVapW7Activation,
  candidateRelativePath,
  generationRecordRelativePath,
  runProviderGeneration,
  stableJson,
  VAP_W6_BATCH,
  VAP_W7_ACTIVATION,
  VAP_W7_BASELINE,
  VAP_W7_CONTRACT,
  VAP_W7_POLICY,
  VAP_W7_PROVIDER_REGISTRY,
  VAP_W7_SCHEMA
} from './lib/visual-article-production/governed-provider-generation-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const copy = (sourceRoot, targetRoot, relative) => {
  const target = path.join(targetRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(sourceRoot, relative), target);
};

const contract = readJson(VAP_W7_CONTRACT);
const policy = readJson(VAP_W7_POLICY);
const registry = readJson(VAP_W7_PROVIDER_REGISTRY);
const schema = readJson(VAP_W7_SCHEMA);
const actualActivation = readJson(VAP_W7_ACTIVATION);
const expectedActivation = buildVapW7Activation(root);

assert.equal(contract.contractCode, 'PHI-OS-VAP-W7-GOVERNED-PROVIDER-GENERATION-v1');
assert.equal(contract.implementationBaselineCommit, VAP_W7_BASELINE);
assert.equal(contract.upstreamExecutionGate.perNodeProductionBriefExportReadyRequired, true);
assert.equal(contract.upstreamExecutionGate.blockedNodeProviderInvocationForbidden, true);
assert.equal(contract.providerInvocationBoundary.networkInvocationSupported, true);
assert.equal(contract.providerInvocationBoundary.networkInvocationRequiresApply, true);
assert.equal(contract.providerInvocationBoundary.networkInvocationRequiresExplicitNetworkFlag, true);
assert.equal(contract.providerInvocationBoundary.credentialMustComeFromEnvironment, true);
assert.equal(contract.providerInvocationBoundary.credentialsMayBePersisted, false);
assert.equal(contract.providerInvocationBoundary.providerOutputAuthority, 'CANDIDATE_ONLY');
assert.equal(contract.providerInvocationBoundary.providerMayCreateCanonicalKnowledge, false);
assert.equal(contract.providerInvocationBoundary.providerMayChangeHumanProductionDecision, false);
assert.equal(contract.providerInvocationBoundary.providerMayFreezeC2OrC3, false);
assert.equal(contract.providerInvocationBoundary.providerMayPublish, false);
assert.equal(contract.candidateIsolationBoundary.automaticPjaCandidateImportAllowed, false);
assert.equal(contract.candidateIsolationBoundary.formalCandidateValidationDeferredTo, 'VAP-W8');
assert.equal(contract.batchBoundary.maximumNodes, 24);

assert.equal(policy.defaultMode, 'dry_run');
assert.equal(policy.maximumBatchSize, 24);
assert.equal(policy.networkInvocationRequiresApply, true);
assert.equal(policy.networkInvocationRequiresExplicitNetworkFlag, true);
assert.equal(policy.providerSelectionRequired, true);
assert.equal(policy.modelSelectionRequired, true);
assert.equal(policy.credentialPersistenceForbidden, true);
assert.equal(policy.providerToolsAllowed, false);
assert.equal(policy.providerWebSearchAllowed, false);
assert.equal(policy.providerFileSearchAllowed, false);
assert.equal(policy.storeProviderResponse, false);
assert.equal(policy.candidateAuthority, false);
assert.equal(policy.candidateImportIntoPjaAllowed, false);
assert.equal(policy.publicationAllowed, false);
assert.equal(policy.existingCandidateRequiresExplicitReplace, true);

assert.equal(registry.scope, 'VAP_ARTICLE_CANDIDATE_GENERATION_ONLY');
assert.equal(registry.publicKnrProviderRegistryReused, false);
const openai = registry.providers.find(provider => provider.providerCode === 'openai_responses');
assert(openai);
assert.equal(openai.implementationStatus, 'implemented');
assert.equal(openai.networkCapable, true);
assert.equal(openai.credentialEnvironmentVariable, 'OPENAI_API_KEY');
assert.equal(openai.providerOutputAuthority, 'candidate_only');
assert.equal(openai.toolsEnabled, false);
assert.equal(openai.automaticPublicationAllowed, false);
assert.equal(openai.defaultModel, null);

assert.equal(schema.properties.schemaVersion.const, 'PHI-OS-VAP-W7-PROVIDER-GENERATION-REPORT-v1.0.0');
assert.equal(schema.properties.candidateAuthority.const, false);
assert.equal(schema.properties.humanReviewRequired.const, true);
assert.equal(schema.properties.publicationAllowed.const, false);
assert.equal(schema.properties.credentialPersisted.const, false);

assert.equal(stableJson(actualActivation), stableJson(expectedActivation), 'VAP-W7 activation must rebuild deterministically from W6 + W7 authority.');
assert.equal(actualActivation.status, 'PROVIDER_RUNTIME_ACTIVE_UPSTREAM_BATCH_BLOCKED_FAIL_CLOSED');
assert.equal(actualActivation.selectedNodeCount, 6);
assert.equal(actualActivation.productionBriefExportReadyCount, 0);
assert.equal(actualActivation.providerGenerationEligibleCount, 0);
assert.deepEqual(actualActivation.providerGenerationEligibleNodeCodes, []);
assert.equal(actualActivation.effectsByActivation.networkCallMade, false);
assert.equal(actualActivation.effectsByActivation.candidateCreated, false);
assert.equal(actualActivation.effectsByActivation.pjaCandidateImported, false);
assert.equal(actualActivation.effectsByActivation.publicationCreated, false);

const currentPlan = buildProviderGenerationPlan(root, { providerCode: 'openai_responses', model: 'fixture-model' });
assert.equal(currentPlan.selectedNodeCount, 6);
assert.deepEqual(currentPlan.providerGenerationReadyNodeCodes, []);
for (const entry of currentPlan.entries) {
  assert.ok(entry.blockers.includes('W6_PRODUCTION_BRIEF_EXPORT_NOT_READY'));
  assert.ok(entry.blockers.includes('W4R_NEW_ARTICLE_EXECUTION_ELIGIBILITY_NOT_PASSED'));
  assert.ok(entry.blockers.includes('PRODUCTION_BRIEF_FILE_MISSING'));
}

let blockedTransportCalls = 0;
const blockedRun = await runProviderGeneration(root, {
  providerCode: 'openai_responses',
  model: 'fixture-model',
  apply: true,
  network: true,
  env: { OPENAI_API_KEY: 'fixture-secret' },
  transport: async () => { blockedTransportCalls += 1; return { responseId: 'should-not-run', text: '# no', usage: null }; }
});
assert.equal(blockedTransportCalls, 0, 'Upstream-blocked batch must never call Provider.');
assert.equal(blockedRun.networkCalls, 0);
assert.equal(blockedRun.candidatesStaged, 0);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'phios-vap-w7-'));
try {
  for (const relative of [VAP_W7_CONTRACT, VAP_W7_POLICY, VAP_W7_PROVIDER_REGISTRY, VAP_W6_BATCH]) copy(root, tempRoot, relative);
  const tempBatchPath = path.join(tempRoot, VAP_W6_BATCH);
  const tempBatch = JSON.parse(fs.readFileSync(tempBatchPath, 'utf8'));
  const target = tempBatch.entries[0];
  target.productionBriefExport.ready = true;
  target.productionBriefExport.status = 'READY_FOR_EXISTING_PJA_EXPORTER';
  target.productionBriefExport.blockers = [];
  target.executionEligibility.evaluatedByW4r = true;
  target.executionEligibility.articleIntent = true;
  target.executionEligibility.newArticleExecutionEligible = true;
  target.executionEligibility.status = 'NEW_ARTICLE_EXECUTION_ELIGIBLE';
  target.executionEligibility.nonExecutionReasons = [];
  for (const other of tempBatch.entries.slice(1)) {
    other.productionBriefExport.ready = false;
    other.executionEligibility.newArticleExecutionEligible = false;
  }
  fs.writeFileSync(tempBatchPath, JSON.stringify(tempBatch, null, 2) + '\n');
  const briefPath = path.join(tempRoot, 'dist/knowledge-production-briefs', `${target.nodeCode}-production-brief.md`);
  fs.mkdirSync(path.dirname(briefPath), { recursive: true });
  fs.writeFileSync(briefPath, `# ${target.nodeCode} Canonical Article Production Brief\n\n## Canonical Thesis\n\nFixture governed thesis.\n\n## Article Boundary\n\nDo not exceed fixture scope.\n`);

  let calls = 0;
  let seenApiKey = null;
  let seenPrompt = null;
  const transport = async ({ apiKey, prompt, model, maxOutputTokens }) => {
    calls += 1;
    seenApiKey = apiKey;
    seenPrompt = prompt;
    assert.equal(model, 'fixture-model');
    assert.equal(maxOutputTokens, 5000);
    return {
      responseId: 'resp_fixture_001',
      text: '# 为什么导航需要方向、位置与坐标\n\n这是一个只用于测试隔离与治理边界的候选文章正文。',
      usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
    };
  };

  const dry = await runProviderGeneration(tempRoot, {
    providerCode: 'openai_responses', model: 'fixture-model', apply: false, network: true,
    env: { OPENAI_API_KEY: 'fixture-secret' }, transport
  });
  assert.equal(calls, 0, 'Dry-run must never call Provider even with --network semantics.');
  assert.equal(dry.candidatesStaged, 0);

  const noNetwork = await runProviderGeneration(tempRoot, {
    providerCode: 'openai_responses', model: 'fixture-model', apply: true, network: false,
    env: { OPENAI_API_KEY: 'fixture-secret' }, transport
  });
  assert.equal(calls, 0, 'Apply without explicit network flag must never call Provider.');
  assert.equal(noNetwork.candidatesStaged, 0);

  const applied = await runProviderGeneration(tempRoot, {
    providerCode: 'openai_responses', model: 'fixture-model', apply: true, network: true,
    env: { OPENAI_API_KEY: 'fixture-secret' }, transport, generatedAt: '2026-08-11T11:15:00+08:00'
  });
  assert.equal(calls, 1);
  assert.equal(seenApiKey, 'fixture-secret');
  assert.ok(seenPrompt.input.includes('BEGIN GOVERNED PRODUCTION BRIEF'));
  assert.equal(applied.networkCalls, 1);
  assert.equal(applied.candidatesStaged, 1);
  assert.equal(applied.authorityWrites, 0);
  assert.equal(applied.pjaCandidateImports, 0);
  assert.equal(applied.humanApprovalsCreated, 0);
  assert.equal(applied.publicationCreated, false);
  assert.equal(applied.canonicalAuthorityChanged, false);

  const candidatePath = path.join(tempRoot, candidateRelativePath(tempBatch.batchCode, target.nodeCode, 'zh-Hans'));
  const recordPath = path.join(tempRoot, generationRecordRelativePath(tempBatch.batchCode, target.nodeCode, 'zh-Hans'));
  assert.equal(fs.existsSync(candidatePath), true);
  assert.equal(fs.existsSync(recordPath), true);
  const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  assert.equal(record.candidateAuthority, false);
  assert.equal(record.humanReviewRequired, true);
  assert.equal(record.publicationAllowed, false);
  assert.equal(record.credentialPersisted, false);
  assert.equal(JSON.stringify(record).includes('fixture-secret'), false, 'Credentials must not be persisted in Provider generation records.');
  assert.equal(fs.existsSync(path.join(tempRoot, 'content/knowledge/production', target.nodeCode.toLowerCase(), 'candidate.md')), false, 'VAP-W7 must not import provider output into PJA candidate authority.');

  let secondCalls = 0;
  const existingBlocked = await runProviderGeneration(tempRoot, {
    providerCode: 'openai_responses', model: 'fixture-model', apply: true, network: true,
    env: { OPENAI_API_KEY: 'fixture-secret' }, transport: async () => { secondCalls += 1; return { responseId: 'x', text: '# x' }; }
  });
  assert.equal(secondCalls, 0, 'Existing Provider candidate must require explicit --replace before another paid/network generation.');
  assert.ok(existingBlocked.results.some(result => result.status === 'BLOCKED_EXISTING_PROVIDER_CANDIDATE'));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts['build:vap-w7'], 'node scripts/build-vap-w7-governed-provider-generation.mjs');
assert.equal(packageJson.scripts['vap:provider:generate'], 'node scripts/run-vap-w7-governed-provider-generation.mjs');
assert.equal(packageJson.scripts['check:vap-w7'], 'node scripts/check-vap-w7-governed-provider-generation.mjs');
assert.ok(packageJson.scripts['check:vap-b'].includes('npm run check:vap-w7'));
assert.ok(packageJson.scripts.postcheck.includes('npm run check:vap-w7'));

console.log('✓ VAP-W7 Governed Provider Generation passed.');
console.log('✓ Real network Provider generation is implemented but requires per-node W6 readiness, an actual exported Brief, --apply, --network, explicit Provider/model resolution, and environment credentials.');
console.log('✓ Current Batch 001 remains fail-closed with 0 Provider-eligible nodes; no Provider call is made while W6A/C2/C3/Human/plan/wave/W4R gates remain unresolved.');
console.log('✓ Provider outputs are staged only under dist/knowledge-production-candidates and remain non-authoritative Candidate artifacts for VAP-W8 validation/import.');
console.log('✓ Dry-run, missing network authorization, blocked upstream nodes, and existing Candidate protection all prevent network calls.');
console.log('✓ Credentials are never persisted; Provider cannot mutate Canonical Knowledge, Human decisions, C2/C3 authority, PJA Candidate authority, or Publication.');
