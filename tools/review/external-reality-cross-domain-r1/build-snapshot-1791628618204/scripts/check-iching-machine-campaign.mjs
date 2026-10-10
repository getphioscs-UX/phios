import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { executeIChingProductRuntime } from '../functions/iching-product-runtime/iching-product-runtime-v1.js';
import { inspectIChingExecutionAuthority } from '../functions/iching-product-runtime/iching-execution-authority-v1.js';
import { detectSensitiveDomains, assertSymbolicSensitiveDomainBoundary } from '../functions/symbolic-method-public-ux/symbolic-sensitive-domain-guard.js';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const P = Object.freeze({
  registry: 'content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sources: 'content/interpretation/iching/registries/iching-source-registry-v1.json',
  perspectives: 'content/interpretation/iching/registries/iching-interpretation-perspective-registry-v1.json',
  corpus: 'content/interpretation/iching/corpus/iching-public-domain-minimum-corpus-v1.json',
  campaign64: 'content/production/symbolic-method/machine/iching-64-hexagram-machine-campaign-v1.json',
  replay: 'content/production/symbolic-method/machine/iching-replay-machine-campaign-v1.json',
  sensitive: 'content/production/symbolic-method/machine/iching-sensitive-domain-machine-campaign-v1.json',
  acceptanceV1: 'content/production/symbolic-method/acceptance/iching-machine-acceptance-v1.json',
  acceptanceV2: 'content/production/symbolic-method/acceptance/iching-machine-acceptance-v2.json',
  pcm: 'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
  catalog: 'content/web-production/px2/successors/public-method-catalog-v2.json'
});
for (const path of Object.values(P)) assert.ok(fs.existsSync(path), `missing ${path}`);

const authorities = Object.freeze({
  hexagramRegistry: read(P.registry),
  sourceRegistry: read(P.sources),
  perspectiveRegistry: read(P.perspectives),
  corpus: read(P.corpus)
});
const campaign64 = read(P.campaign64);
const replay = read(P.replay);
const sensitive = read(P.sensitive);
const oldAcceptance = read(P.acceptanceV1);
const acceptance = read(P.acceptanceV2);
const BASE = '40cb9e71450ebb817998cde8222225cd941c0aa0';
const at = '2026-08-24T15:00:00.000Z';
const digest = sha(P.registry);

const request = (caseId, overrides = {}) => ({
  method: 'I_CHING',
  question: 'What deserves observation before I decide?',
  inputMode: 'MANUAL_LINES',
  lines: [7, 8, 7, 8, 7, 8],
  sessionId: caseId,
  timestamp: at,
  projectionVersion: '1.0.0',
  authorityDigests: { hexagramRegistrySha256: digest },
  ...overrides
});

assert.equal(campaign64.baselineCommit, BASE);
assert.equal(campaign64.expectedHexagramCount, 64);
assert.equal(authorities.hexagramRegistry.entries.length, 64);
assert.equal(new Set(authorities.hexagramRegistry.entries.map(item => item.hexagramId)).size, 64);
const covered = new Set();
let visibleSourceGaps = 0;
for (const entry of authorities.hexagramRegistry.entries) {
  const lines = entry.lineStructure.map(value => value === 1 ? campaign64.caseDerivation.stableYang : campaign64.caseDerivation.stableYin);
  const result = await executeIChingProductRuntime(request(`ICH-M64-${String(entry.number).padStart(2, '0')}`, { lines }), authorities);
  assert.equal(result.ok, true);
  assert.equal(result.readingIr.structuralProjection.primary.hexagramId, entry.hexagramId);
  assert.equal(result.readingIr.structuralProjection.relating.hexagramId, entry.hexagramId);
  assert.equal(result.readingIr.structuralProjection.changingLines.length, 0);
  assert.equal(result.readingIr.rcc.required, true);
  assert.equal(result.readingIr.uncertainty.required, true);
  assert.equal(result.readingIr.agency.decisionAuthority, 'USER');
  assert.equal(result.readingIr.agency.ichingMayDecide, false);
  assert.equal(result.readingIr.authority.sourceGapMayBeFilledByModel, false);
  assert.equal(result.publicView.production.runAllowed, false);
  if (result.readingIr.sourceInterpretation.coverage.primary !== 'SOURCE_COMMENTARY_AVAILABLE') {
    visibleSourceGaps += 1;
    assert.ok(result.readingIr.uncertainty.states.some(item => item.status === 'UNRESOLVED' && item.scope === 'SOURCE_COVERAGE'));
  }
  covered.add(entry.hexagramId);
}
assert.equal(covered.size, 64);
assert.equal(visibleSourceGaps, 62);

assert.equal(replay.baselineCommit, BASE);
assert.equal(replay.cases.length, 6);
for (const item of replay.cases) {
  const overrides = { inputMode: item.inputMode, lines: item.lines, coinLines: item.coinLines };
  if (item.inputMode === 'SYSTEM_RANDOM') {
    overrides.lines = undefined;
    overrides.randomSelectionEvidence = {
      selectedSymbols: item.selectedSymbols,
      seed: item.seed,
      entropyEvidence: { source: 'ICH_MACHINE_EXTERNAL_ENTROPY', digest: crypto.createHash('sha256').update(item.caseId).digest('hex') },
      replayToken: item.replayToken
    };
  }
  if (item.inputMode === 'COIN_CAST') overrides.lines = undefined;
  const first = await executeIChingProductRuntime(request(item.caseId, overrides), authorities);
  const second = await executeIChingProductRuntime(request(item.caseId, overrides), authorities);
  assert.deepEqual(second, first, `product replay drift: ${item.caseId}`);
  assert.equal(first.readingIr.methodEvidence.inputMode, item.inputMode);
  assert.equal(first.readingIr.agency.decisionAuthority, 'USER');
}

assert.equal(sensitive.baselineCommit, BASE);
assert.equal(sensitive.cases.length, 8);
for (const item of sensitive.cases) {
  assert.ok(detectSensitiveDomains(item.question).includes(item.domain), `sensitive classification missing: ${item.caseId}`);
  const boundary = assertSymbolicSensitiveDomainBoundary({ question: item.question, generatedOutput: sensitive.safeOutput });
  assert.equal(boundary.createsFact, false);
  assert.equal(boundary.createsDiagnosis, false);
  assert.equal(boundary.createsProfessionalAdvice, false);
  assert.equal(boundary.createsDecisionDirective, false);
  assert.equal(boundary.userDecisionAuthority, true);
  assert.throws(
    () => assertSymbolicSensitiveDomainBoundary({ question: item.question, generatedOutput: item.unsafeOutput }),
    /SYMBOLIC_SENSITIVE_DOMAIN_SYSTEM_AUTHORITY_FORBIDDEN/
  );
  const result = await executeIChingProductRuntime(request(item.caseId, { question: item.question }), authorities);
  assert.ok(result.readingIr.sensitiveDomainBoundary.domains.includes(item.domain));
  assert.equal(result.readingIr.authority.readingMayPredict, false);
  assert.equal(result.readingIr.authority.readingMayDiagnose, false);
  assert.equal(result.readingIr.authority.readingMayInferThirdPartyHiddenState, false);
  assert.equal(result.readingIr.authority.readingMayCreateProfessionalDirective, false);
}

assert.equal(oldAcceptance.machineAcceptanceComplete, false);
assert.equal(acceptance.successorOf, P.acceptanceV1);
assert.equal(acceptance.machineAcceptanceComplete, true);
assert.equal(acceptance.accepted.canonicalHexagramCoverage, 64);
assert.equal(acceptance.accepted.manualCoinRandomReplayCases, 6);
assert.equal(acceptance.accepted.sensitiveAndHiddenStateCases, 8);
assert.equal(acceptance.sourceCoverage.commentaryCoveredHexagrams, 2);
assert.equal(acceptance.sourceCoverage.complete, false);
for (const value of Object.values(acceptance.productionBoundary)) assert.equal(value, false);

const pcm = read(P.pcm);
const ich = pcm.capabilities.find(item => item.methodRuntime?.methodCode === 'I_CHING');
assert.ok(ich);
assert.equal(ich.userExecutable, false);
assert.equal(ich.productionAccepted, false);
const catalog = read(P.catalog);
const publicIch = catalog.methods.find(item => item.methodCode === 'I_CHING');
assert.ok(publicIch);
assert.equal(publicIch.runAllowed, false);
assert.equal(inspectIChingExecutionAuthority({ data: {}, env: { CF_PAGES_COMMIT_SHA: BASE } }).authorized, false);

console.log('✓ ICH-PROD-W12 64-hexagram product machine campaign passed: 64/64 canonical structures traverse calculation, Shared Projection, source-bound Interpretation, Reading IR, RCC, uncertainty, agency and public view.');
console.log('✓ ICH-PROD-W13 replay campaign passed: manual, coin and persisted-random product evidence reproduce the same full product output.');
console.log('✓ ICH-PROD-W14 sensitive-domain campaign passed: medical, mental-health, financial, legal, pregnancy, death, relationship and third-party hidden-state authority fail closed.');
console.log('  Machine acceptance is complete. Commentary coverage remains explicitly partial (2/64); human, live persistence, browser, deployed SHA and public execution remain closed.');
