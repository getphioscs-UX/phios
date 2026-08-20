import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { resolveJourneyProviderCostGate, providerUsageEvent } from '../functions/reality-journey-runtime/provider-cost-gate-v1.js';

const read = p => fs.readFileSync(p, 'utf8');
const json = p => JSON.parse(read(p));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const arg = process.argv[2] || 'ALL';
const baseline = '311fad7653785b8f0d14d5a0a154cce3f1303eb5';

function w19() {
  const policy = json('content/runtime/journey-runtime/policies/rjx-provider-cost-policy-v1.json');
  const audit = json('content/runtime/journey-runtime/audits/rjx-provider-cost-reconciliation-v1.json');
  assert.equal(policy.baselineCommit, baseline);
  assert.equal(policy.default.initialResult, 'RULE_ENGINE_ONLY');
  assert.equal(policy.default.initialReadingModelAllowed, false);
  assert.equal(policy.runtimeEntry.openAIDefaultAllowed, false);
  assert.equal(policy.runtimeEntry.openAIExplicitOptInRequired, true);
  assert.equal(policy.publicKNR.providerEnabledByDefault, false);
  assert.equal(policy.workersAI.atomicBudgetReservationRequired, true);
  assert.equal(policy.workersAI.usageTrackingRequired, true);
  assert.equal(policy.workersAI.paidOverageAllowed, false);
  assert.equal(policy.openAI.explicitOptInRequired, true);
  assert.equal(policy.openAI.entitlementRequired, true);
  assert.equal(policy.openAI.budgetReservationRequired, true);
  assert.equal(policy.modelOutput.authority, 'CANDIDATE_ONLY');
  assert.equal(policy.modelOutput.mayCreateObservedEvidence, false);
  assert.equal(policy.modelOutput.mayFillUnknown, false);
  const defaultGate = resolveJourneyProviderCostGate({});
  assert.equal(defaultGate.selectedProvider, 'rule_engine');
  assert.equal(defaultGate.openAIAllowed, false);
  assert.equal(defaultGate.workersAIAllowed, false);
  assert.equal(defaultGate.providerFailureBlocksBaseJourney, false);
  const incompleteOpenAI = resolveJourneyProviderCostGate({requestedProvider:'openai', explicitOpenAIOptIn:true, providerEligible:true, providerAvailable:true});
  assert.equal(incompleteOpenAI.openAIAllowed, false);
  const completeOpenAI = resolveJourneyProviderCostGate({requestedProvider:'openai', explicitOpenAIOptIn:true, openAIEntitled:true, providerEligible:true, providerAvailable:true, budgetReserved:true, usageTrackingReady:true, reservedUnits:1});
  assert.equal(completeOpenAI.openAIAllowed, true);
  const workersNoBudget = resolveJourneyProviderCostGate({requestedProvider:'workers_ai', providerEligible:true, providerAvailable:true, usageTrackingReady:true});
  assert.equal(workersNoBudget.workersAIAllowed, false);
  const usage = providerUsageEvent({provider:'workers_ai', reservedUnits:2, actualUnits:1, meteredCost:0.001});
  assert.equal(usage.recorded, true);
  assert.equal(audit.acceptanceCandidate.defaultOpenAICallCount, 0);
  assert.equal(audit.acceptanceCandidate.unreservedMeteredInferenceAllowed, false);
  assert.equal(audit.productionEffect.meteredProviderActivated, false);
  console.log('✓ RJX-W19 provider cost successor policy passed: rule-only default, explicit OpenAI opt-in, hard reservation/telemetry gate, no paid overage.');
}

function w20() {
  const route = json('content/runtime/journey-runtime/compatibility/rjx-route-compatibility-v1.json');
  const consumers = json('content/runtime/journey-runtime/compatibility/rjx-runtime-consumer-reconciliation-v1.json');
  assert.equal(route.baselineCommit, baseline);
  assert.equal(route.canonicalWorkspaceRoute, '/reality/');
  assert.equal(route.canonicalProductionRouteActivated, false);
  assert.equal(route.accounting.oldRouteCount, 7);
  assert.equal(route.accounting.accountedRouteCount, 7);
  assert.equal(route.accounting.brokenDeepLinkCount, 0);
  assert.equal(route.accounting.duplicateActiveWriteAuthorityCount, 0);
  const entry = route.routes.find(r => r.route === '/reality-entry');
  assert.ok(entry);
  assert.equal(entry.baselineFileExists, false);
  assert.equal(entry.action, 'compatibility_shell');
  assert.equal(entry.compatibilityShellActive, true);
  assert.equal(entry.serverRedirectActivated, false);
  assert.equal(entry.clientRedirectTarget, '/reality/');
  assert.equal(entry.legacyRuntimePubliclyReactivated, false);
  assert.equal(entry.canonicalHistoricalParentBlobSha1, 'b4f470849fbc38e15daa73bf33a12860da471099');
  const entryHtml = read(entry.file);
  assert.match(entryHtml, /RJX-W20 compatibility shell/);
  assert.match(entryHtml, /http-equiv="refresh" content="0;url=\/reality\/"/);
  assert.match(entryHtml, /window\.location\.replace\('\/reality\/'\)/);
  const redirects = read('_redirects');
  assert.doesNotMatch(redirects, /^\/reality-entry(?:\.html)?\s+\/reality\/?\s/m);
  for (const r of route.routes) {
    assert.equal(fs.existsSync(r.file), true, `${r.file} missing`);
    assert.equal(r.deepLinkPreserved, true);
    assert.equal(r.oldPageDeletedByPackageE, false);
    assert.equal(r.runtimeWriteAuthorityCreated, false);
  }
  assert.equal(consumers.accounting.consumerCount, consumers.accounting.accountedConsumerCount);
  assert.equal(consumers.accounting.missingReferenceCount, 0);
  assert.equal(consumers.accounting.duplicateActiveWriteAuthorityCount, 0);
  assert.ok(consumers.consumers.every(c => c.referenceExists === true && c.activeWriteAuthorityCreatedByRJX === false));
  console.log(`✓ RJX-W20 compatibility passed: ${route.routes.length} legacy routes + ${consumers.consumers.length} runtime/surface consumers accounted; zero broken deep links or duplicate write authority.`);
}

function w21() {
  const review = json('content/runtime/journey-runtime/review/rjx-human-review-package-v1.json');
  const acceptance = json('content/runtime/journey-runtime/acceptance/rjx-human-acceptance-v1.json');
  assert.deepEqual(review.reviewPackages.map(p => p.package), ['A','B','C','D','E']);
  assert.equal(review.reviewPackages.find(p => p.package === 'B').eligibilityAcceptedCount, 931);
  assert.equal(review.reviewPackages.find(p => p.package === 'B').ruleBindingAcceptanceCount, 0);
  assert.equal(review.activationBoundary.candidateOnly, true);
  assert.equal(review.activationBoundary.productionActivation, false);
  assert.equal(review.activationBoundary.freezeAllowed, false);
  assert.equal(acceptance.status, 'PENDING_TL_HUMAN_REVIEW');
  assert.equal(acceptance.acceptedBy, null);
  assert.equal(acceptance.boundaries.humanAcceptanceSynthesized, false);
  assert.equal(acceptance.boundaries.freezeAllowed, false);
  console.log('✓ RJX-W21 Human Review package passed: A-E are review-ready; 931 eligibility acceptance is not misrepresented as rule-binding activation.');
}

function w22() {
  const manifest = json('content/runtime/journey-runtime/audits/rjx-central-checker-manifest-v1.json');
  const required = ['check:rjx-provider-cost','check:rjx-compatibility','check:rjx','check:rjx-freeze'];
  for (const cmd of required) assert.ok(manifest.commands.includes(cmd), `${cmd} missing`);
  for (const value of Object.values(manifest.checkerMutationPolicy)) assert.equal(value, false);
  assert.ok(manifest.aggregateInvariants.length >= 23);
  console.log('✓ RJX-W22 central checker manifest passed: read-only checker chain declared with Package E commands.');
}

function w23() {
  const a = json('content/runtime/journey-runtime/acceptance/rjx-production-acceptance-v1.json');
  const slices = json('content/runtime/journey-runtime/acceptance/rjx-minimum-vertical-slices-v1.json');
  const metrics = json('content/runtime/journey-runtime/registries/rjx-metrics-contract-v1.json');
  assert.equal(a.status, 'NOT_PRODUCTION_ACCEPTED_PENDING_HUMAN_BROWSER_AND_RUNTIME_INTEGRATION');
  assert.equal(a.technicalAcceptance.defaultPaidOpenAICallCountInSuccessorPolicy, 0);
  assert.equal(a.costAcceptance.initialResultRuleOnly, true);
  assert.equal(a.costAcceptance.baseJourneyModelRequired, false);
  assert.equal(a.costAcceptance.workersAIRequiresEligibilityAndBudgetReservation, true);
  assert.equal(a.costAcceptance.openAIRequiresExplicitOptInEntitlementAndBudget, true);
  assert.equal(a.costAcceptance.paidOverageFailClosed, true);
  assert.equal(a.productionActivation, false);
  assert.equal(slices.slices.length, 5);
  for (const s of slices.slices) assert.equal(fs.existsSync(s.fixture), true, `${s.fixture} missing`);
  assert.equal(Object.keys(metrics.safetyMetrics).length, 8);
  assert.ok(Object.values(metrics.safetyMetrics).every(v => v.target === 0));
  console.log('✓ RJX-W23 production acceptance gate passed fail-closed: candidate evidence is present; human/browser/provider integration remain explicitly blocking.');
}

function verifyDigest(entry) {
  assert.equal(fs.existsSync(entry.path), true, `${entry.path} missing`);
  assert.equal(sha256(entry.path), entry.sha256, `${entry.path} digest drift`);
}
function w24() {
  const freeze = json('content/runtime/journey-runtime/freeze/rjx-reality-journey-experience-v1.json');
  assert.equal(freeze.status, 'FREEZE_BLOCKED_PENDING_REQUIRED_ACCEPTANCE');
  assert.equal(freeze.baselineCommit, baseline);
  assert.equal(freeze.historicalAuthorityPreserved, true);
  assert.equal(freeze.humanAcceptance.accepted, false);
  assert.equal(freeze.acceptanceProof.allHumanReviewPackagesAccepted, false);
  assert.equal(freeze.acceptanceProof.productionBrowserAcceptancePassed, false);
  assert.equal(freeze.acceptanceProof.productionProviderIntegrationPassed, false);
  assert.equal(freeze.acceptanceProof.freezeAllowed, false);
  for (const entry of Object.values(freeze.authorityDigests)) verifyDigest(entry);
  verifyDigest(freeze.ruleRegistryDigest);
  verifyDigest(freeze.workspaceCompositionDigest);
  verifyDigest(freeze.compatibilityDigest);
  verifyDigest(freeze.providerCostPolicyDigest);
  verifyDigest(freeze.checkerManifestDigest);
  for (const entry of Object.values(freeze.additionalProtectedDigests)) verifyDigest(entry);
  assert.equal(freeze.freezeProof.openAIOptInOnlyInSuccessorPolicy, true);
  assert.equal(freeze.freezeProof.workersAIBudgetGovernedInSuccessorPolicy, true);
  console.log('✓ RJX-W24 successor freeze gate passed: protected digests are stable and final freeze is correctly blocked until required acceptance evidence exists.');
}

const map = {'RJX-W19':w19,'RJX-W20':w20,'RJX-W21':w21,'RJX-W22':w22,'RJX-W23':w23,'RJX-W24':w24};
if (arg === 'ALL') { for (const fn of Object.values(map)) fn(); }
else { assert.ok(map[arg], `Unknown Package E work: ${arg}`); map[arg](); }
if (arg === 'ALL') console.log('✓ RJX Package E W19-W24 technical successor passed without synthesizing Human Acceptance or final production freeze.');
