import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { buildCanonicalMethodProjectionCurrent } from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import { buildCanonicalMeaningProductionBundle } from '../functions/canonical-meaning-production/meaning-bundle-builder.js';
import { selectorMatches } from '../functions/canonical-meaning-production/meaning-resolver.js';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const BASE = '1d9b248f314308ef4f2a06354fb962ca46fff5c4';
const ROOT = 'content/professional/canonical-meaning-production';
const w0 = json(`${ROOT}/authority/canonical-meaning-production-authority-baseline-v1.json`);
const w1 = json(`${ROOT}/contracts/canonical-meaning-production-contract-v1.json`);
const w2 = json(`${ROOT}/registries/canonical-meaning-admission-registry-v1.json`);
const w3 = json(`${ROOT}/registries/canonical-method-meaning-mapping-v1.json`);
const w5 = json(`${ROOT}/contracts/canonical-meaning-bundle-production-contract-v1.json`);
const schema = json(`${ROOT}/schemas/canonical-meaning-production-bundle-v1.schema.json`);
const w6 = json(`${ROOT}/contracts/canonical-meaning-provenance-contract-v1.json`);
const acceptance = json(`${ROOT}/acceptance/cmp-w0-w6-acceptance-v1.json`);
const cmrFreeze = json('content/professional/canonical-meaning-runtime/freeze/cmr-w15-full-freeze-v1.json');
const cmrCode = json('content/professional/canonical-meaning-runtime/registries/canonical-meaning-code-registry-v1.2.json');
const cmrIdentity = json('content/professional/canonical-meaning-runtime/identity/meaning-identity-registry-v1.2.json');
const cmrKnowledge = json('content/professional/canonical-meaning-runtime/registries/canonical-meaning-knowledge-map-v1.2.json');
const astLegacy = json('content/professional/canonical-meaning-runtime/registries/ast-meaning-mapping-registry-v1.json');
const bzrLegacy = json('content/professional/canonical-meaning-runtime/registries/bzr-meaning-mapping-registry-v1.1.json');
const numLegacy = json('content/professional/canonical-meaning-runtime/registries/num-meaning-mapping-registry-v1.json');
const rrp = json('content/products/runtime-reading/registries/runtime-reading-method-availability-v1.json');
const deterministicFixture = json(`${ROOT}/fixtures/cmp-w4-num-life-path-8.foundation.valid.json`);
const pcm = json('content/governance/production-capability-matrix/registries/production-capability-registry-v1.json');

for (const doc of [w0,w1,w2,w3,w5,w6,acceptance]) assert.equal(doc.baselineCommit, BASE, `${doc.work}: baseline drift`);
assert.equal(w0.work, 'CMP-W0');
assert.equal(w0.status, 'CMR_VALIDATION_BASELINE_RECONCILED_PRODUCTION_SUCCESSOR_FOUNDATION_OPENED');
assert.equal(w0.predecessorAuthority.productionStatus, 'validation_only');
assert.equal(w0.predecessorAuthority.productionActivated, false);
assert.equal(w0.predecessorAuthority.historicalMutationAllowed, false);
assert.equal(w0.currentProjectionInputAuthority.schemaVersion, 'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0');
assert.equal(w0.activationState, 'NOT_ACTIVATED_FOR_USER_PRODUCTION');
for (const ref of w0.auditedAuthorities) {
  assert.equal(fs.existsSync(ref.path), true, `CMP-W0 authority missing: ${ref.path}`);
  assert.equal(sha(ref.path), ref.sha256, `CMP-W0 predecessor drift: ${ref.path}`);
}
assert.equal(cmrFreeze.productionStatus, 'validation_only');
assert.equal(cmrFreeze.productionActivated, false);
assert.equal(cmrFreeze.successorRequiredForActivation, true);

assert.equal(w1.work, 'CMP-W1');
assert.equal(w1.inputAuthority.contract, 'CANONICAL_METHOD_PROJECTION');
assert.equal(w1.inputAuthority.schemaVersion, 'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0');
assert.equal(w1.inputAuthority.readOnly, true);
assert.deepEqual(w1.allowedSemanticTypes, ['STRUCTURAL_MEANING','DIRECTIONAL_MEANING','RELATIONAL_MEANING','DOMAIN_MEANING','CYCLE_MEANING']);
for (const forbidden of ['PREDICTION_CERTAINTY','PROFESSIONAL_DIAGNOSIS','FINANCIAL_ADVICE','MEDICAL_ADVICE','LEGAL_ADVICE','UNBOUNDED_FATE_CLAIM']) assert.ok(w1.prohibitedClaims.includes(forbidden));
assert.equal(w1.runtimeRules.providerAllowed, false);
assert.equal(w1.runtimeRules.aiAllowed, false);
assert.equal(w1.runtimeRules.promptAllowed, false);
assert.equal(w1.runtimeRules.recalculationAllowed, false);
assert.equal(w1.runtimeRules.productionModeRequiresExplicitActivationSuccessor, true);

assert.equal(w2.work, 'CMP-W2');
assert.equal(w2.productionActivated, false);
assert.equal(w2.productionAdmissionCount, 41);
assert.deepEqual(w2.methodAdmissionSummary, { AST:0, BZR:29, NUM:12 });
const codeBy = new Map(cmrCode.meaningCodes.map(x => [x.meaningCode, x]));
const idBy = new Map(cmrIdentity.records.map(x => [x.meaningCode, x]));
const knowBy = new Map(cmrKnowledge.mappings.map(x => [x.meaningCode, x]));
for (const admission of w2.admissions) {
  const code = codeBy.get(admission.meaningCode); const identity = idBy.get(admission.meaningCode); const knowledge = knowBy.get(admission.meaningCode);
  assert.ok(code && identity && knowledge, `CMP-W2 orphan admission ${admission.meaningCode}`);
  assert.equal(code.status, 'validation_only');
  assert.equal(identity.lifecycle.status, 'validation_only');
  assert.equal(knowledge.status, 'validation_only');
  assert.equal(admission.productionAdmitted, true);
  assert.equal(admission.activationState, 'FOUNDATION_ADMITTED_NOT_USER_ACTIVE');
  assert.equal(admission.semanticHash, code.semanticHash);
  assert.equal(admission.meaningCanonicalDigest, identity.meaningCanonicalDigest);
  assert.equal(admission.knowledgeHash, knowledge.knowledgeHash);
  assert.ok(admission.knowledgeAuthority.primaryNodeCodes.length > 0);
}
assert.equal(w2.rules.admissionDoesNotEqualActivation, true);
assert.equal(w2.rules.admissionDoesNotEqualMethodAvailability, true);

assert.equal(w3.work, 'CMP-W3');
assert.equal(w3.sourceProjectionAuthority.schemaVersion, 'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0');
assert.equal(w3.productionActivated, false);
assert.equal(w3.mappingCount, 39);
assert.equal(w3.mappings.length, 39);
assert.equal(w3.blockedPredecessorMappings.length, 2);
assert.ok(w3.blockedPredecessorMappings.every(x => x.reason === 'LUCK_CYCLE_DIRECTION_NOT_PRESENT_IN_CANONICAL_METHOD_PROJECTION_V1'));
const admissions = new Map(w2.admissions.map(x => [x.meaningCode, x]));
for (const mapping of w3.mappings) {
  assert.equal(mapping.productionEligible, true);
  assert.equal(mapping.productionActivated, false);
  assert.equal(mapping.status, 'FOUNDATION_ADMITTED_NOT_USER_ACTIVE');
  assert.ok(admissions.has(mapping.targetMeaningCode), `CMP-W3 target not admitted: ${mapping.targetMeaningCode}`);
  assert.equal(mapping.sourceProjectionSchemaVersion, 'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0');
  assert.equal(fs.existsSync(mapping.predecessorLineage.sourceRegistry), true);
}
const coverage = Object.fromEntries(w3.methodCoverage.map(x => [x.pluginCode, x]));
assert.equal(coverage.NUM.foundationMappingCount, 12);
assert.equal(coverage.BZR.foundationMappingCount, 27);
assert.equal(coverage.AST.foundationMappingCount, 0);
assert.equal(coverage.NUM.productionMeaningComplete, false);
assert.equal(coverage.BZR.productionMeaningComplete, false);
assert.equal(coverage.AST.productionMeaningComplete, false);
assert.ok(coverage.BZR.blockers.includes('LUCK_CYCLE_DIRECTION_NOT_PRESENT_IN_CANONICAL_METHOD_PROJECTION_V1'));
assert.equal(astLegacy.mappingCount, 0);
assert.equal(bzrLegacy.mappingCount, 29);
assert.equal(numLegacy.mappingCount, 12);

// CMP-W4 deterministic resolver / current MCD-5 CanonicalMethodProjection integration.
const request = {
  methodCode:'NUMEROLOGY', methodVersion:'0.1.0-candidate', requestId:'CMP-W4-NUM-FIXTURE-001',
  canonicalInput:{ inputVersion:'1.0.0', locale:'en', timezone:{ source:'UNKNOWN', confidence:'UNKNOWN', iana:null }, birthPlace:{} }
};
const result = {
  executionStatus:'EXECUTED_BOUND_SCOPE', reasonCodes:[], inputEvaluation:{ missingFields:[] },
  mpaEvaluation:{ authorityOwner:'MPA', decision:'ELIGIBLE', dispatchAllowed:true, state:'PRODUCTION_AUTHORITY_GRANTED_FOR_BOUND_SCOPE' },
  partialExecution:{ coreResults:[{
    algorithmCode:'NUM_BIRTH_NUMBER_CALCULATION', algorithmVersion:'1.0.0', runtimeVersion:'1.0.0', calculationId:'CAL-CMP-NUM-001',
    output:{ numbers:{ lifePath:{ reducedValue:8, rawValue:44, reductionSteps:[44,8], masterNumberPreserved:false } } }
  }]}
};
const projection = await buildCanonicalMethodProjectionCurrent(request, result, { executedAt:'2026-08-22T00:00:00.000Z' });
assert.equal(projection.schemaVersion, 'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0');
assert.equal(projection.method.publicMethodCode, 'NUMEROLOGY_PROJECTION');
assert.equal(projection.interpretation.meaningAuthorityCreated, false);
const a = await buildCanonicalMeaningProductionBundle({ projection, admissionRegistry:w2, mappingRegistry:w3 });
const b = await buildCanonicalMeaningProductionBundle({ projection, admissionRegistry:w2, mappingRegistry:w3 });
assert.equal(a.bundleDigest, b.bundleDigest, 'CMP-W4 determinism drift');
assert.equal(a.bundleCode, b.bundleCode, 'CMP-W4 bundle identity drift');
assert.equal(a.status, 'FOUNDATION_VALIDATION_ONLY');
assert.equal(a.activationState, 'NOT_USER_ACTIVE');
assert.deepEqual(a.items.map(x => x.meaningCode), ['CM-NUMBER-ORIENTATION-NO08']);
assert.equal(a.bundleDigest, deterministicFixture.expectedCanonicalMeaningBundle.bundleDigest, 'CMP-W4 frozen deterministic digest drift');
assert.equal(a.bundleCode, deterministicFixture.expectedCanonicalMeaningBundle.bundleCode, 'CMP-W4 frozen bundle identity drift');
assert.deepEqual(a.items, deterministicFixture.expectedCanonicalMeaningBundle.items, 'CMP-W4 frozen bundle item drift');
assert.equal(a.boundaries.aiUsed, false);
assert.equal(a.boundaries.providerUsed, false);
assert.equal(a.boundaries.recalculated, false);
assert.equal(a.boundaries.interpretationCreated, false);
await assert.rejects(() => buildCanonicalMeaningProductionBundle({ projection, admissionRegistry:w2, mappingRegistry:w3, mode:'production' }), error => error?.code === 'CMP_PRODUCTION_NOT_ACTIVATED');

// Verify selector behavior against the current BZR public projection shape without inventing unavailable direction.
const bzrProjection = { calculation:{ structures:[{code:'FOUR_PILLARS',items:[{code:'YEAR_STEM',value:'JIA'},{code:'YEAR_BRANCH',value:'ZI'}]}], cycles:[{code:'LUCK_CYCLE',value:'YI-CHOU'}] } };
const stemMap = w3.mappings.find(x => x.predecessorLineage.mappingCode === 'MAP-BZR-STEM-JIA-TO-AQ01');
const branchMap = w3.mappings.find(x => x.predecessorLineage.mappingCode === 'MAP-BZR-BRANCH-ZI-TO-CC01');
const pillarMap = w3.mappings.find(x => x.predecessorLineage.mappingCode === 'MAP-BZR-PILLAR-YEAR-TO-TP01');
const luckMap = w3.mappings.find(x => x.predecessorLineage.mappingCode === 'MAP-BZR-LUCK-CYCLE-SEQUENCE-TO-RP01');
for (const mapping of [stemMap,branchMap,pillarMap,luckMap]) assert.equal(selectorMatches(bzrProjection, mapping.selector), true, `CMP-W3 selector mismatch: ${mapping.mappingCode}`);

assert.equal(w5.work, 'CMP-W5');
assert.equal(w5.bundleSchemaVersion, 'PHI-OS-CANONICAL-MEANING-PRODUCTION-BUNDLE-v1.0.0');
assert.equal(w5.rules.foundationBundleCannotBeConsumedAsProduction, true);
assert.equal(schema.properties.schemaVersion.const, 'PHI-OS-CANONICAL-MEANING-PRODUCTION-BUNDLE-v1.0.0');
for (const field of schema.required) assert.ok(Object.hasOwn(a, field), `CMP-W5 bundle missing required field: ${field}`);
assert.match(a.bundleCode, /^CMPB-[A-F0-9]{24}$/);
assert.match(a.bundleDigest, /^[a-f0-9]{64}$/);
assert.ok(schema.properties.status.enum.includes(a.status));
assert.ok(schema.properties.activationState.enum.includes(a.activationState));

assert.equal(w6.work, 'CMP-W6');
assert.equal(w6.rules.meaningWithoutProjectionRefAllowed, false);
assert.equal(w6.rules.meaningWithoutMappingLineageAllowed, false);
assert.equal(w6.rules.meaningWithoutKnowledgeAuthorityAllowed, false);
assert.equal(w6.rules.calculationMayBeRepeatedByMeaningRuntime, false);
for (const item of a.items) {
  assert.equal(item.sourceProjectionRef.projectionId, projection.projectionId);
  assert.ok(item.sourceProjectionRef.projectionDigest);
  assert.ok(item.sourceFields.length > 0);
  assert.ok(item.mappingLineage.mappingCode);
  assert.ok(item.mappingLineage.predecessor.mappingDigest);
  assert.ok(item.knowledgeAuthority.primaryNodeCodes.length > 0);
}

// Foundation exists, but RRP/PCM/frontend must remain unchanged until CMP-W10+ and method-specific coverage.
for (const code of ['AST','BZR','NUM']) {
  const method = rrp.methods.find(x => x.methodCode === code);
  assert.equal(method.meaning, 'UNAVAILABLE', `${code} RRP meaning prematurely enabled`);
  assert.equal(method.availability, 'PARTIAL', `${code} RRP availability prematurely promoted`);
  const capability = pcm.capabilities.find(x => x.methodRuntime.pluginCode === code);
  assert.equal(capability.statusProjection, 'Limited', `${code} PCM prematurely promoted`);
}
const functionsOutsideCmp = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(path);
    else if (/\.(js|mjs)$/.test(entry.name) && !path.startsWith('functions/canonical-meaning-production/')) {
      const text = fs.readFileSync(path, 'utf8');
      if (text.includes('canonical-meaning-production/')) functionsOutsideCmp.push(path);
    }
  }
}
walk('functions');
assert.deepEqual(functionsOutsideCmp, [], `CMP foundation leaked into production function consumers: ${functionsOutsideCmp.join(', ')}`);

for (const [path, expectedDigest] of Object.entries(acceptance.artifactDigests)) { assert.equal(fs.existsSync(path), true, `CMP acceptance artifact missing: ${path}`); assert.equal(sha(path), expectedDigest, `CMP acceptance artifact drift: ${path}`); }
assert.equal(acceptance.status, 'ACCEPTED_PRODUCTION_MEANING_FOUNDATION_NOT_USER_ACTIVATED');
assert.equal(acceptance.exitGate.productionActivated, false);
assert.equal(acceptance.exitGate.frontendBound, false);
assert.equal(acceptance.exitGate.rrpProductionMeaningAvailable, false);
const pkg = json('package.json');
assert.equal(pkg.scripts['check:cmp-w0-w6'], 'node scripts/check-cmp-w0-w6.mjs');
assert.equal(pkg.scripts['check:cmp'], 'npm run check:cmp-w0-w6');

console.log('✓ CMP-W0 CMR authority reconciliation passed: frozen validation-only predecessor preserved; MCD-5 CanonicalMethodProjection is the read-only production input authority.');
console.log('✓ CMP-W1–W3 production contract, admission registry and current-projection-compatible mapping foundation passed: 41 meanings admitted, 39 mappings compatible, 2 BZR direction mappings fail closed, AST remains unmapped.');
console.log('✓ CMP-W4 deterministic resolver passed against an actual current MCD-5 NUM CanonicalMethodProjection; production mode remains fail-closed before activation.');
console.log('✓ CMP-W5 Canonical Meaning Production Bundle schema/determinism passed.');
console.log('✓ CMP-W6 provenance passed: meaning → mapping → CanonicalMethodProjection fields → calculation evidence remains traceable; no frontend/RRP activation occurred.');
