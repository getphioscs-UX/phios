import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const BASE='content/professional/method-production-activation';
const baseline='07391e717e64c2636ce22e3f97900ff97d9571d8';
const j=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const freeze=j(`${BASE}/freeze/mpa-production-activation-freeze-v1.json`);
const manifest=j(`${BASE}/freeze/mpa-w0-w29-content-preservation-manifest-v1.json`);
const acceptance=j(`${BASE}/acceptance/mpa-w30-freeze-acceptance-v1.json`);
const eligibility=j(`${BASE}/registries/mpa-production-eligibility-decision-registry-v1.json`);
const execution=j(`${BASE}/registries/mpa-production-execution-gate-registry-v1.json`);
const w29=j(`${BASE}/acceptance/mpa-w29-full-acceptance-v1.json`);
const w28=j(`${BASE}/acceptance/mpa-w28-downstream-integration-acceptance-v1.json`);

assert.equal(freeze.freezeCode,'PHI-OS-MPA-PRODUCTION-ACTIVATION-FREEZE-v1');
assert.equal(freeze.freezeVersion,'1.0.0');
assert.equal(freeze.status,'MPA-v1.0.0-FROZEN');
assert.equal(freeze.baselineCommit,baseline);
assert.equal(freeze.scope,'MPA-W0-W30');
assert.equal(freeze.governanceClosure.governanceClosed,true);
assert.equal(freeze.governanceClosure.allMethodsActivated,false);
assert.equal(freeze.governanceClosure.blockedMethodsAllowedAtFreeze,true);
assert.equal(freeze.governanceClosure.freezeMeansAllMethodsOpen,false);

assert.equal(freeze.eligibilityAtFreeze.eligibleCount,0);
assert.equal(freeze.eligibilityAtFreeze.conditionallyEligibleCount,6);
assert.equal(freeze.eligibilityAtFreeze.blockedCount,36);
assert.deepEqual(freeze.eligibilityAtFreeze,eligibility.summary);
assert.equal(freeze.executionAtFreeze.productionDispatchActive,false);
assert.equal(freeze.executionAtFreeze.eligibleProductionExecutionCount,0);
assert.equal(execution.currentState.productionDispatchActive,false);

assert.equal(freeze.methodStates.NUMEROLOGY.CALCULATION,'CONDITIONALLY_ELIGIBLE');
assert.equal(freeze.methodStates.NUMEROLOGY.PROJECTION,'CONDITIONALLY_ELIGIBLE');
assert.equal(freeze.methodStates.BAZI.CALCULATION,'CONDITIONALLY_ELIGIBLE');
assert.equal(freeze.methodStates.BAZI.PROJECTION,'CONDITIONALLY_ELIGIBLE');
for(const cap of Object.keys(freeze.methodStates.ASTROLOGY)) assert.equal(freeze.methodStates.ASTROLOGY[cap],'BLOCKED');
for(const cap of Object.keys(freeze.methodStates.HUMAN_DESIGN)) assert.equal(freeze.methodStates.HUMAN_DESIGN[cap],'BLOCKED');
for(const method of ['I_CHING','TAROT','PSYCHOLOGY']) {
  for(const cap of Object.keys(freeze.methodStates[method])) assert.equal(freeze.methodStates[method][cap],'BLOCKED');
}

assert.equal(freeze.downstreamAtFreeze.mpaCreatesCustomerReadout,false);
assert.equal(freeze.downstreamAtFreeze.currentProductionProjectionHandoffCount,0);
assert.equal(w28.acceptedFacts.mpaCreatesCustomerReadout,false);
assert.equal(w29.acceptedFacts.currentProductionDispatchCount,0);

assert.equal(freeze.preservationManifestReference,`${BASE}/freeze/mpa-w0-w29-content-preservation-manifest-v1.json`);
assert.equal(freeze.preservationManifestDigest,sha(freeze.preservationManifestReference));
assert.equal(manifest.status,'FROZEN_CONTENT_PRESERVATION_MANIFEST');
assert.equal(manifest.baselineCommit,baseline);
assert.equal(manifest.scope,'MPA-W0-W29_PLUS_EXECUTION_AND_W28_CROSS_RUNTIME_SUCCESSORS');
assert.equal(manifest.entries.length,freeze.frozenArtifactCount);
for(const entry of manifest.entries){
  assert.ok(fs.existsSync(path.join(root,entry.reference)),`Missing frozen artifact: ${entry.reference}`);
  assert.equal(sha(entry.reference),entry.sha256,`MPA frozen artifact drift: ${entry.reference}`);
}

assert.equal(acceptance.status,'MPA_FROZEN_V1_GOVERNANCE_CLOSED_BLOCKED_METHODS_PRESERVED');
assert.equal(acceptance.acceptedFacts.freezeDoesNotMeanAllMethodsOpen,true);
assert.equal(acceptance.acceptedFacts.blockedMethodsPreserved,true);
assert.equal(acceptance.acceptedFacts.currentProductionDispatchCount,0);
assert.equal(acceptance.acceptedFacts.mpaCreatesCustomerReadout,false);

const pkg=j('package.json');
assert.equal(pkg.scripts['check:mpa-w30'],'node scripts/check-mpa-w30-freeze.mjs');
assert.equal(pkg.scripts['check:mpa-freeze'],'npm run check:mpa-w30');
assert.equal(pkg.scripts['check:mpa-complete'],'npm run check:mpa');
assert.equal(pkg.scripts['method-production-activation:check'],'npm run check:mpa-complete');
const chain=String(pkg.scripts['check:mpa']||'').split(' && ');
const expected=[
  'npm run check:mpa-foundation',
  'npm run check:mpa-input-calculation',
  'npm run check:mpa-validation-evidence',
  'npm run check:mpa-projection-integration',
  'npm run check:mpa-num-activation',
  'npm run check:mpa-ast-activation',
  'npm run check:mpa-bzr-activation',
  'npm run check:mpa-hdr-boundary',
  'npm run check:mpa-future-holding',
  'npm run check:mpa-production-gate',
  'npm run check:mpa-downstream-integration',
  'npm run check:mpa-full-acceptance',
  'npm run check:mpa-freeze'
];
assert.deepEqual(chain,expected,'MPA W0-W30 aggregate chain must be contiguous and canonical.');

const post=String(pkg.scripts.postcheck||'').split(' && ').map(x=>x.trim()).filter(Boolean);
assert.equal(post.filter(x=>x==='npm run method-production-activation:check').length,1);
assert.equal(post.at(-1),'npm run check:web-production-runtime','WPR historical final postcheck tail must remain last.');
assert.ok(post.indexOf('npm run method-production-activation:check')<post.indexOf('npm run check:web-production-runtime'));
assert.equal(String(pkg.scripts.postcheck).includes('check:mpa'),false,'Neutral MPA final alias preserves historical pre-W30 MPA checker guards.');

console.log('✓ MPA-W30 Production Activation Freeze passed.');
console.log('  MPA v1 governance is frozen with zero current Production dispatch, NUM/BZR conditional states, AST/HDR blocked states and Future Methods held closed.');
console.log('  Freeze means governance closure, not that every Method is open; MPA still does not create Customer Readout, Reality Fact or Professional Judgment.');
