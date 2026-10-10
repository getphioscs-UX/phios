import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root=process.cwd();
const BASE='content/professional/method-production-activation';
const baseline='07391e717e64c2636ce22e3f97900ff97d9571d8';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const j=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const contract=j(`${BASE}/contracts/mpa-downstream-integration-v1.json`);
const registry=j(`${BASE}/registries/mpa-downstream-integration-registry-v1.json`);
const schema=j(`${BASE}/schemas/mpa-downstream-projection-reference-v1.schema.json`);
const acceptance=j(`${BASE}/acceptance/mpa-w28-downstream-integration-acceptance-v1.json`);
const rdgExt=j('content/governance/reality-data-governance/extensions/mpa-rmo-method-projection/registries/rmo-method-projection-consumer-read-successor-v1.json');
const rmoExt=j('content/runtime/reality-model-runtime/extensions/mpa-method-projection/contracts/rmo-method-projection-reference-integration-v1.json');

assert.equal(contract.work,'MPA-W28');
assert.equal(contract.baselineCommit,baseline);
assert.deepEqual(contract.canonicalFlow,['METHOD_PROJECTION','RMO','RRE','JR_PR_RNE','CPR','WPR']);
assert.equal(contract.authority.mpaOwnsCustomerReadout,false);
assert.equal(contract.authority.mpaOwnsRealityTruth,false);
assert.equal(contract.authority.mpaOwnsProfessionalJudgment,false);
assert.equal(contract.productionRules.projectionHandoffRequiresEligibilityDecision,'ELIGIBLE');
assert.equal(contract.productionRules.conditionallyEligibleCannotHandoffAsProduction,true);
assert.equal(contract.productionRules.validationOnlyProjectionCannotHandoffAsProduction,true);
assert.equal(contract.productionRules.currentProductionProjectionHandoffCount,0);

assert.equal(registry.status,'CANONICAL_REFERENCE_ONLY_INTEGRATION');
assert.equal(registry.entries.length,5);
assert.deepEqual(registry.entries.map(x=>x.stage),[1,2,3,4,5]);
assert.equal(registry.entries[0].from,'MPA');
assert.equal(registry.entries[0].to,'RMO');
assert.equal(registry.entries[1].to,'RRE');
assert.deepEqual(registry.entries[2].to,['JR','PR','RNE']);
assert.equal(registry.entries[3].to,'CPR');
assert.equal(registry.entries[4].to,'WPR');
assert.equal(registry.rules.mpaDoesNotCreateReadout,true);
assert.equal(registry.rules.mpaDoesNotCreateRealityFact,true);

assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');
assert.equal(schema.properties.projectionStatus.const,'PRODUCTION');
assert.equal(schema.properties.truthClaimed.const,false);
assert.equal(schema.properties.professionalJudgmentCreated.const,false);

assert.equal(rdgExt.status,'ACTIVE_SUCCESSOR_EXTENSION');
assert.deepEqual(rdgExt.addedReadOnlyDataTypes,['METHOD_PROJECTION_RECORD']);
assert.equal(rdgExt.rules.consumerReadOnly,true);
assert.equal(rdgExt.rules.methodProjectionIsEvidence,false);
assert.equal(rdgExt.rules.methodProjectionIsObservedFact,false);
assert.equal(rdgExt.rules.methodProjectionIsRealityTruth,false);
assert.equal(rdgExt.rules.rmoWriteAuthorityExpanded,false);
assert.equal(rdgExt.rules.baseRegistryRewritten,false);
assert.equal(rdgExt.rules.mpaOwnsDataGovernanceAuthority,false);

assert.equal(rmoExt.integrationMode,'REFERENCE_ONLY');
assert.equal(rmoExt.rules.rmoV1FreezeRewritten,false);
assert.equal(rmoExt.rules.methodProjectionPromotedToRealityFact,false);
assert.equal(rmoExt.rules.rmoMayCreateCustomerReadout,false);
assert.equal(rmoExt.rules.productionUseRequiresMpaEligibleProjection,true);
assert.equal(rmoExt.rmoBinding.truthClaimed,false);

for(const record of Object.values(registry.preservedFrozenAuthorities)){
  assert.equal(sha(record.reference),record.sha256,`Frozen downstream authority drift: ${record.reference}`);
}

const rmoState=j('content/runtime/reality-model-runtime/contracts/reality-state-runtime-contract-v1.json');
assert.equal(rmoState.rules.projectedIsObservedTruth,false);
assert.equal(rmoState.rules.projectedIsPredictionAuthority,false);
assert.equal(rmoState.rules.projectedCreatesActionOrNavigationChoice,false);

const rreInput=j('content/runtime/reality-readout-engine/contracts/reality-readout-input-contract-v1.json');
assert.ok(rreInput.requiredInputs.includes('methodProjectionReferences'));
assert.equal(rreInput.rules.rawArbitraryDataAccepted,false);
assert.equal(rreInput.rules.referenceOnlyCrossAuthorityConsumption,true);
const rreReadout=j('content/runtime/reality-readout-engine/contracts/canonical-runtime-readout-contract-v1.json');
assert.equal(rreReadout.rules.readoutMayCreateDiagnosis,false);
assert.equal(rreReadout.rules.readoutMayCreateProfessionalJudgment,false);
assert.equal(rreReadout.rules.readoutMayCreateNavigationDecision,false);

const jr=j('content/runtime/journey-runtime/contracts/canonical-journey-contract-v2.json');
assert.equal(jr.authorityBoundary.journeyOwnsRealityTruth,false);
assert.equal(jr.authorityBoundary.journeyOwnsProfessionalJudgment,false);
assert.ok(jr.referenceOnlyFields.includes('readoutReferences'));
const jrContext=j('content/runtime/journey-runtime/contracts/journey-context-contract-v2.json');
assert.equal(jrContext.referenceClasses.readoutReferences,'RRE');
assert.equal(jrContext.rules.referenceOnly,true);

const pr=j('content/runtime/professional-runtime/freeze/pr-v2-freeze-v1.json');
assert.equal(pr.authorityClosure.realityAuthority,'RMO');
assert.equal(pr.authorityClosure.readoutAuthority,'RRE');
assert.equal(pr.authorityClosure.journeyAuthority,'JR');
assert.equal(pr.authorityClosure.professionalJudgmentAuthority,'PR_ONLY_HUMAN_ATTRIBUTABLE');
assert.equal(pr.nonAuthority.prCreatesReadout,false);

const rne=j('content/runtime/reality-navigation-engine/freeze/rne-v1-freeze-v1.json');
assert.equal(rne.authority.readout,'RRE');
assert.equal(rne.authority.journeyWorkflow,'JR');
assert.equal(rne.authority.realityLifecycle,'RMO');
assert.equal(rne.authority.professionalJudgment,false);
assert.equal(rne.authority.navigationDecisionCommand,false);

const cpr=j('content/professional/canonical-presentation-runtime/audits/cpr-authority-boundary-v1.json');
assert.equal(cpr.invariants.cprMayInferRuntimeState,false);
assert.equal(cpr.doesNotOwn.includes('professional_judgment'),true);
const rreCpr=j('content/runtime/reality-readout-engine/contracts/rre-cpr-projection-contract-v1.json');
assert.equal(rreCpr.rules.rreMayCreateProfessionalJudgment,false);
assert.equal(rreCpr.rules.cprRetainsPresentationAuthority,true);

const wpr=j('content/web-production/freeze/wpr-v1-freeze-v1.json');
assert.equal(wpr.frozenBoundaries.realityTruthAuthority,false);
assert.equal(wpr.frozenBoundaries.methodAuthority,false);
assert.equal(wpr.frozenBoundaries.professionalJudgmentAuthority,false);
assert.equal(wpr.frozenBoundaries.cprAuthority,false);

const decision=j(`${BASE}/registries/mpa-production-eligibility-decision-registry-v1.json`);
assert.equal(decision.summary.eligibleCount,0);
const runtime=await import(pathToFileURL(path.join(root,'functions/method-production-activation/downstream-integration-runtime.js')).href+`?v=${Date.now()}`);
const productionRef={
  schemaVersion:'PHI-OS-MPA-DOWNSTREAM-PROJECTION-REFERENCE-v1.0.0',
  methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',
  projectionCode:'MPA-PROJECTION-TEST-001',projectionVersion:'1.0.0',
  projectionDigest:'a'.repeat(64),projectionStatus:'PRODUCTION',
  truthClaimed:false,professionalJudgmentCreated:false
};
assert.throws(()=>runtime.createProductionMethodProjectionHandoff({
  methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',projectionReference:productionRef
}),/METHOD_PRODUCTION_NOT_ELIGIBLE_FOR_DOWNSTREAM_INTEGRATION/);
assert.throws(()=>runtime.assertProductionMethodProjectionReference({...productionRef,projectionStatus:'VALIDATION_ONLY'}),/METHOD_PROJECTION_NOT_PRODUCTION/);

assert.equal(acceptance.status,'ACCEPT_REFERENCE_ONLY_CHAIN_CURRENT_PRODUCTION_HANDOFF_COUNT_ZERO');
assert.equal(acceptance.acceptedFacts.mpaCreatesCustomerReadout,false);

const pkg=j('package.json');
assert.equal(pkg.scripts['check:mpa-w28'],'node scripts/check-mpa-w28-downstream-integration.mjs');
assert.equal(pkg.scripts['check:mpa-downstream-integration'],'npm run check:mpa-w28');
const chain=String(pkg.scripts['check:mpa']||'').split(' && ');
assert.equal(chain.filter(x=>x==='npm run check:mpa-downstream-integration').length,1);
assert.ok(chain.indexOf('npm run check:mpa-downstream-integration')>chain.indexOf('npm run check:mpa-production-gate'));
assert.equal(String(pkg.scripts.postcheck||'').includes('check:mpa'),false);

console.log('✓ MPA-W28 RMO / RRE / JR / PR / RNE / CPR / WPR Integration passed.');
console.log('  Method Projection is reference-bound through RMO to RRE and downstream consumers; MPA creates no Customer Readout, Reality Fact, Professional Judgment, Presentation or Web Projection.');
console.log('  Current W26 contains zero ELIGIBLE Projection capability decisions, so production downstream handoff remains zero and fail-closed.');
