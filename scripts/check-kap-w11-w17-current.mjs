import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { onRequestGet } from '../functions/api/ask-phios.js';

const text = path => fs.readFileSync(path, 'utf8');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const isPresentationPath = path => presentationRecords?.has(path) ?? false;

const paths = Object.freeze({
  package: 'package.json',
  freeze: 'content/knowledge/answer-projection/freeze/kap-w11-w17-answer-composition-freeze-v1.json',
  guidedSuccessor: 'content/knowledge/answer-projection/reconciliation/kap-w17-w18-guided-reading-surface-successor-v1.json',
  presentationSuccessor: 'content/knowledge/answer-projection/reconciliation/kap-w11-w17-current-presentation-successor-v3.json',
  historicalCkaSuccessor: 'content/web-production/reconciliation/hpc2-w5-cka-w0-w4-current-successor-v1.json',
  currentCkaSuccessor: 'content/web-production/reconciliation/hpc2-w6-cka-client-surface-successor-v1.json',
  ckaBSuccessor: 'content/web-production/reconciliation/client-surface-global-invariants-cka-b-successor-v1.json',
  ckaCDelta: 'content/client/knowledge-ask/evidence/cka-w18-w33-delta-manifest-v1.json',
  ckaAcceptance: 'content/client/knowledge-ask/acceptance/cka-w0-w4-batch-a-acceptance-v1.json',
  ask2Acceptance: 'content/governance/ask2/acceptance/ask2-w4-w10-public-consumption-acceptance-v1.json',
  ask2Freeze: 'content/governance/ask2/freeze/ask2-w4-w10-public-consumption-freeze-v1.json',
  stage16Successor: 'content/web-production/px2/successors/px2-stage16-public-ia-successor-v2.json',
  relevanceSuccessor: 'content/knowledge/answer-projection/reconciliation/kap-p1-question-source-relevance-successor-v1.json',
  homepage: 'index.html',
  homepageRuntime: 'assets/js/pages/home-production.js'
});

const p1DeletePath = 'content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json';
const p1PresentationSuccessorPath = 'content/knowledge/answer-projection/reconciliation/kap-p1-physical-delete-presentation-successor-v1.json';
const p1Deleted = fs.existsSync(p1DeletePath) && read(p1DeletePath).status === 'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE';

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `MISSING:${path}`);
if (p1Deleted) assert.ok(fs.existsSync(p1PresentationSuccessorPath), `MISSING:${p1PresentationSuccessorPath}`);

const pkg = read(paths.package);
for (const step of ['11', '12', '13', '14', '15', '16', '17']) {
  const alias = `check:kap-w${step}`;
  const command = pkg.scripts[alias];
  assert.ok(command, `MISSING:${alias}`);
  const [executable, ...args] = command.split(' ');
  assert.equal(executable, 'node');
  const run = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(run.status, 0, `${alias}\n${run.stdout}\n${run.stderr}`);
  process.stdout.write(run.stdout);
}

const freeze = read(paths.freeze);
const guidedSuccessor = read(paths.guidedSuccessor);
const presentationSuccessor = read(paths.presentationSuccessor);
const historicalCka = read(paths.historicalCkaSuccessor);
const currentCka = read(paths.currentCkaSuccessor);
const ckaB = read(paths.ckaBSuccessor);
const ckaBDelta = read(ckaB.ckaB.deltaManifest.path);
const ckaCDelta = read(paths.ckaCDelta);
const ckaAcceptance = read(paths.ckaAcceptance);
const ask2Acceptance = read(paths.ask2Acceptance);
const ask2Freeze = read(paths.ask2Freeze);
const stage16Successor = read(paths.stage16Successor);
const relevanceSuccessor = read(paths.relevanceSuccessor);
const relevanceRuntime = new Map(relevanceSuccessor.runtimeSuccessors.map(item => [item.path, item]));
const homepage = text(paths.homepage);
const homepageRuntime = text(paths.homepageRuntime);
const ckaCurrent = new Map(historicalCka.clientSurfaceTransition.artifacts.map(item => [item.path, item]));
const ckaBCurrent = new Map(ckaBDelta.files.map(item => [item.path, item]));
const ckaCCurrent = new Map(ckaCDelta.files.map(item => [item.path, item]));

assert.equal(freeze.status, 'FROZEN_ASK_PHIOS_DETERMINISTIC_PRODUCTION_NO_AI_PROVIDER_NO_READING_ESCALATION');
assert.equal(guidedSuccessor.status, 'ACTIVE_ADDITIVE_SURFACE_SUCCESSOR');
assert.equal(presentationSuccessor.status, 'CURRENT_KAP_CKA_PRESENTATION_FINGERPRINT_DECOUPLED_RUNTIME_AUTHORITY_PRESERVED');
assert.equal(sha256(presentationSuccessor.historicalChecker.path), presentationSuccessor.historicalChecker.sha256, 'KAP_HISTORICAL_CHECKER_DRIFT');
assert.equal(presentationSuccessor.historicalChecker.rewritten, false);
assert.equal(presentationSuccessor.runtimeFingerprintPolicy.presentationWholeFileFingerprint, false);
assert.equal(presentationSuccessor.runtimeFingerprintPolicy.runtimeJavascriptExactFingerprintPreserved, true);
assert.equal(presentationSuccessor.runtimeFingerprintPolicy.apiExactFingerprintPreserved, true);
assert.equal(presentationSuccessor.runtimeFingerprintPolicy.historicalFreezeEvidencePreserved, true);
assert.equal(relevanceSuccessor.status, 'ACTIVE_ADDITIVE_QUESTION_SOURCE_RELEVANCE_SUCCESSOR');
assert.equal(relevanceSuccessor.authorityBoundary.questionSourceRelevancePolicyChanged, true);
for (const key of ['knowledgeAuthorityChanged','retrievalAuthorityChanged','answerAuthorityChanged','meaningAdmissionChanged','canonicalKnowledgeMutationAllowed','modelGapFillAllowed','historicalFreezeMutationAllowed']) assert.equal(relevanceSuccessor.authorityBoundary[key], false, `KAP_RELEVANCE_AUTHORITY_DRIFT:${key}`);
for (const item of relevanceSuccessor.runtimeSuccessors) {
  assert.ok(fs.existsSync(item.path), `KAP_RELEVANCE_RUNTIME_MISSING:${item.path}`);
  assert.equal(sha256(item.path), item.currentSha256, `KAP_RELEVANCE_CURRENT_RUNTIME_DRIFT:${item.path}`);
}
for (const boundary of Object.values(presentationSuccessor.boundaries)) assert.equal(boundary, false);

const presentationRecords = new Map(presentationSuccessor.presentationSurfaces.map(item => [item.path, item]));
for (const record of presentationSuccessor.presentationSurfaces) {
  assert.equal(record.wholeFileSha256Required, false, `KAP_PRESENTATION_SHA_POLICY_DRIFT:${record.path}`);
  if (p1Deleted && record.path === 'knowledge-search.html') {
    assert.equal(fs.existsSync(record.path), false, 'P1 physical delete must remove the retired Knowledge Search presentation');
    const p1 = read(p1PresentationSuccessorPath);
    assert.equal(p1.status, 'ACTIVE_KAP_RUNTIME_PRESERVED_CONTEXTUAL_ASK_PRESENTATION_CURRENT');
    assert.ok(p1.deletedPresentations.includes('knowledge-search.html'));
    assert.equal(fs.existsSync(p1.canonicalCustomerSurface), true);
    const source = text(p1.canonicalCustomerSurface);
    for (const marker of ['data-cx-surface="CONTEXTUAL_ASK"','data-cx-contextual-ask-form','data-cx-answer-limits','data-cx-basis-groups']) assert.ok(source.includes(marker), `KAP_P1_PRESENTATION_MARKER_MISSING:${marker}`);
    continue;
  }
  assert.ok(fs.existsSync(record.path), `KAP_CURRENT_PRESENTATION_MISSING:${record.path}`);
  if (Array.isArray(record.requiredMarkers)) {
    const source = text(record.path);
    for (const marker of record.requiredMarkers) assert.ok(source.includes(marker), `KAP_CURRENT_PRESENTATION_MARKER_MISSING:${record.path}:${marker}`);
    for (const marker of record.forbiddenMarkers || []) assert.ok(!source.includes(marker), `KAP_CURRENT_PRESENTATION_FORBIDDEN_MARKER:${record.path}:${marker}`);
  }
}

for (const item of [...freeze.predecessorEvidence, ...freeze.frozenOutputs]) {
  if (presentationRecords.has(item.path)) continue;
  const transition = ckaCurrent.get(item.path);
  if (item.path === 'assets/js/pages/knowledge-search.js') {
    assert.equal(item.sha256, guidedSuccessor.authorizedDrift.predecessorSha256);
    continue;
  }
  if (item.path === 'functions/api/ask-phios.js') {
    assert.equal(item.sha256, historicalCka.runtimeTransition.askApi.predecessorSha256);
    continue;
  }
  if (transition) {
    assert.equal(item.sha256, transition.predecessorSha256, `CKA_PREDECESSOR_MISMATCH:${item.path}`);
    continue;
  }
  const relevanceTransition = relevanceRuntime.get(item.path);
  if (relevanceTransition) {
    assert.equal(item.sha256, relevanceTransition.predecessorSha256, `KAP_RELEVANCE_PREDECESSOR_MISMATCH:${item.path}`);
    assert.equal(sha256(item.path), relevanceTransition.currentSha256, `KAP_RELEVANCE_CURRENT_RUNTIME_DRIFT:${item.path}`);
    continue;
  }
  assert.equal(sha256(item.path), item.sha256, `KAP_W11_W17_FROZEN_RUNTIME_DRIFT:${item.path}`);
}

assert.equal(guidedSuccessor.authorizedDrift.predecessorSha256, freeze.frozenOutputs.find(item => item.path === 'assets/js/pages/knowledge-search.js').sha256);
assert.equal(guidedSuccessor.authorizedDrift.successorSha256, ckaCurrent.get(guidedSuccessor.authorizedDrift.path).predecessorSha256);
assert.equal(guidedSuccessor.authorityBoundary.askPhiosSemanticsChanged, false);
assert.equal(guidedSuccessor.authorityBoundary.guidedReadingIsSeparateCapability, true);

assert.equal(historicalCka.status, 'ACTIVE_ADDITIVE_CKA_HOMEPAGE_ENTRY_SUCCESSOR_W5_HISTORY_PRESERVED');
assert.equal(historicalCka.runtimeTransition.askApi.currentSuccessorSha256, ckaB.ckaB.askApi.predecessorSha256);
assert.equal(sha256(ckaB.ckaB.askApi.path), ckaB.ckaB.askApi.currentSuccessorSha256);
for (const boundary of Object.values(ckaB.authorityBoundary)) assert.equal(boundary, false);
for (const item of historicalCka.clientSurfaceTransition.artifacts) {
  if (item.path === currentCka.currentClientSurface.path) {
    assert.equal(item.currentSuccessorSha256, currentCka.predecessor.historicalDeclaredCurrentSha256);
    continue;
  }
  if (isPresentationPath(item.path)) {
    assert.ok(presentationRecords.has(item.path), `KAP_CURRENT_PRESENTATION_POLICY_MISSING:${item.path}`);
    continue;
  }
  const bRecord = ckaBCurrent.get(item.path);
  const cRecord = ckaCCurrent.get(item.path);
  if (cRecord) {
    assert.ok(bRecord, `CKA_B_PREDECESSOR_MISSING:${item.path}`);
    assert.equal(cRecord.predecessorSha256, bRecord.sha256, `CKA_C_PREDECESSOR_MISMATCH:${item.path}`);
    if (
      item.path === 'assets/js/knowledge/ask-phios-client.js' &&
      ask2Acceptance.productionState === 'ASK2_PUBLIC_SOURCE_ACCEPTED_LIVE_BROWSER_PENDING'
    ) {
      const ask2Client = text(item.path);
      assert.equal(cRecord.sha256, 'b610370c03588224f27c03612661eb0af173934b877da570ee7531a048753758');
      assert.ok(ask2Client.includes("fetch('/api/ask-phios-orchestrated'"));
      assert.ok(ask2Client.includes('renderAsk2Disclosure(payload)'));
      assert.ok(ask2Client.includes('capability gate'));
      assert.ok(ask2Client.includes('模型不能自行补算 Method'));
      assert.equal(ask2Acceptance.sourceAcceptance.existingAskClientBound, true);
      assert.equal(ask2Acceptance.sourceAcceptance.existingCkaEndpointMutated, false);
      assert.equal(ask2Freeze.freeze.existingCkaAuthorityPreserved, true);
      assert.equal(ask2Freeze.freeze.modelCalculationAllowed, false);
    } else if (presentationRecords.has(item.path)) {
      assert.equal(presentationRecords.get(item.path).wholeFileSha256Required, false, `CKA_C_PRESENTATION_POLICY_DRIFT:${item.path}`);
    } else {
      assert.equal(sha256(item.path), cRecord.sha256, `CKA_C_CURRENT_RUNTIME_DRIFT:${item.path}`);
    }
    continue;
  }
  if (bRecord) {
    assert.equal(sha256(item.path), bRecord.sha256, `CKA_B_CURRENT_RUNTIME_DRIFT:${item.path}`);
    continue;
  }
  assert.equal(sha256(item.path), item.currentSuccessorSha256, `CKA_A_CURRENT_RUNTIME_DRIFT:${item.path}`);
}
assert.equal(historicalCka.clientSurfaceTransition.guidedReadingActivatedByCkaW0W4, false);

assert.equal(currentCka.status, 'ACTIVE_ADDITIVE_CKA_CLIENT_AND_H05_CONSUMER_SUCCESSOR_HISTORICAL_RECONCILIATION_PRESERVED');
assert.equal(currentCka.baselineCommit, '6b860d361c45745b2cb415ac897c5a9067585182');
assert.equal(sha256(currentCka.predecessor.contract), currentCka.predecessor.contractSha256);
assert.equal(currentCka.predecessor.historicalObservationRewritten, false);
assert.equal(sha256(currentCka.currentClientSurface.path), currentCka.currentClientSurface.sha256, `CKA_CURRENT_RUNTIME_DRIFT:${currentCka.currentClientSurface.path}`);
const currentClient = text(currentCka.currentClientSurface.path);
for (const marker of currentCka.currentClientSurface.requiredSemanticMarkers) assert.ok(currentClient.includes(marker), `CKA_CURRENT_SEMANTIC_MARKER_MISSING:${marker}`);
for (const marker of currentCka.currentClientSurface.forbiddenSemanticMarkers) assert.ok(!currentClient.includes(marker), `CKA_CURRENT_FORBIDDEN_SEMANTIC_MARKER:${marker}`);
for (const boundary of Object.values(currentCka.authorityBoundary)) assert.equal(boundary, false);
assert.equal(currentCka.successorPolicy.failClosed, true);
assert.equal(currentCka.successorPolicy.deterministic, true);
assert.equal(currentCka.successorPolicy.duplicateAuthorityForbidden, true);

const px2Successor = read('content/web-production/px2/successors/px2-w11-checker-successor-v1.json');
assert.equal(px2Successor.status, 'ACTIVE');
if (stage16Successor.status === 'ACTIVE_STAGE16_CLIENT_INTENT_SUCCESSOR') {
  assert.equal(stage16Successor.predecessorMutated, false);
  assert.match(homepage, /data-cx-surface="HOME"/);
  assert.match(homepage, /href="\/knowledge\/ask\/"/);
  assert.match(homepage, /href="\/books\/"/);
  assert.match(homepage, /href="\/perspectives\/personal\/"/);
  assert.match(homepage, /href="\/reality\/"/);
  assert.doesNotMatch(homepage, /data-cir-root/);
  assert.doesNotMatch(homepage, /data-px2-intent-form/);
} else {
  assert.match(homepage, /data-px2-intent-form/);
  assert.match(homepage, /href="\/knowledge-search"/);
  assert.match(homepage, /href="\/search\/"/);
}
assert.doesNotMatch(homepageRuntime, /\/api\/ask-phios|fetch\([^)]*knowledge-search/i);
assert.equal(currentCka.homepageConsumerTransition.secondAnswerRuntimeCreated, false);
assert.equal(currentCka.homepageConsumerTransition.secondRetrievalRuntimeCreated, false);
assert.equal(currentCka.homepageConsumerTransition.secondHomepageRuntimeCreated, false);
assert.equal(currentCka.homepageConsumerTransition.secondAskAuthorityCreated, false);

assert.equal(ckaAcceptance.humanAcceptance.claimed, false);
assert.equal(ckaAcceptance.browserAcceptance.claimed, false);

const ASSETS = {
  fetch: async request => {
    const relativePath = decodeURIComponent(new URL(request.url).pathname.replace(/^\/+/, ''));
    try {
      return new Response(fs.readFileSync(relativePath), { status: 200, headers: { 'content-type': 'application/json' } });
    } catch {
      return new Response('', { status: 404 });
    }
  }
};
const request = new Request(`https://phios.local/api/ask-phios?q=${encodeURIComponent('为什么人工智能是文明能力长期累积的结果')}&locale=zh-Hans&depth=STANDARD&entrySurface=KNOWLEDGE_SEARCH&mode=GLOBAL`);
const response = await onRequestGet({ request, env: { ASSETS } });
const payload = await response.json();
assert.equal(response.status, 200);
assert.equal(payload.ok, true);
assert.equal(payload.capability, 'ASK_PHIOS');
assert.equal(payload.ai.providerInvoked, false);
assert.equal(payload.production.independentlyDeliverable, true);
assert.equal(payload.production.requiresGuidedReading, false);
assert.equal(payload.governance.persistentCaseCreated, false);
assert.equal(payload.cka.entryContext.entrySurface, 'KNOWLEDGE_SEARCH');
assert.equal(payload.cka.clientAnswer.governance.createsCanonicalAuthority, false);
assert.equal(payload.cka.governance.secondAnswerRuntimeCreated, false);
assert.equal(payload.cka.governance.persistentHistoryCreated, false);

assert.equal(pkg.scripts['check:kap-answer'], 'node scripts/check-kap-w11-w17-current.mjs');
assert.equal(pkg.scripts['check:kap-answer-historical'], 'node scripts/check-kap-w11-w17-guided-successor.mjs');
console.log('✓ KAP-W11-W17 current answer semantics passed with presentation fingerprint decoupled.');
console.log('  knowledge-search HTML/CSS may evolve by semantic contract; CKA JS/API runtime fingerprints and authority boundaries remain fail-closed.');
