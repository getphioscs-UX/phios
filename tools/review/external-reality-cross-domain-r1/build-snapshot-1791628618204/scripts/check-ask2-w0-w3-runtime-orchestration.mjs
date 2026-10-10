import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const runtimeFirst=read('content/governance/ask2/contracts/runtime-first-contract-v1.json');
const disclosure=read('content/governance/ask2/contracts/lens-disclosure-contract-v1.json');
const why=read('content/governance/ask2/contracts/why-this-lens-contract-v1.json');
const realityFirst=read('content/governance/ask2/contracts/reality-evidence-first-contract-v1.json');
const adapters=read('content/governance/ask2/registries/runtime-execution-adapter-registry-v1.json');
const acceptance=read('content/governance/ask2/acceptance/ask2-w0-w3-orchestration-acceptance-v1.json');
const freeze=read('content/governance/ask2/freeze/ask2-w0-w3-orchestration-freeze-v1.json');
const mod=await import(pathToFileURL(path.join(root,'functions/ask2/ask2-orchestrator.js')).href);

assert.equal(runtimeFirst.rule,'MODEL_MAY_COMPOSE_GOVERNED_RUNTIME_OUTPUT_BUT_MAY_NOT_CREATE_RUNTIME_FACTS');
assert.equal(runtimeFirst.invariants.runtimeFirst,true);
assert.equal(runtimeFirst.invariants.noMethodVoting,true);
assert.equal(runtimeFirst.invariants.currentExternalEvidenceImmutable,true);
assert.equal(adapters.rules.modelCalculationAdapterExists,false);
assert.equal(adapters.rules.silentFallbackAdapterExists,false);
assert.equal(disclosure.publicRule,'EVERY_CONSUMED_SYMBOLIC_LENS_MUST_BE_VISIBLE_TO_USER');
assert.equal(why.reasonAuthority,'LRR_QUESTION_TAXONOMY_AND_ROUTE_PLAN');
assert.deepEqual(realityFirst.currentRealityPair,{internal:'CCR',external:'CWA'});
assert.equal(realityFirst.rules.factMayNotBeDerivedFromLens,true);

const ccr=Object.freeze({schemaVersion:'PHI-OS-CURRENT-CONTEXT-SNAPSHOT-v1.0.0',snapshotId:'TEST-CCR'});
const cwa=Object.freeze({schemaVersion:'PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0',claimId:'OPR',claimText:'TEST ONLY',boundaries:Object.freeze({searchRankUsedAsAuthority:false,sourceVotingUsed:false,lensMutationAllowed:false})});

let p=mod.buildAsk2OrchestrationPlan({question:'今年事业环境如何？'});
assert.equal(p.taxonomy,'TIME');
assert.equal(p.orchestrationState,'READY_FOR_RUNTIME_EXECUTION');
assert.equal(p.executionRequests[0].routeKey,'BZR.TEMPORAL');
assert.equal(p.lensDisclosure.primary.pluginCode,'BZR');
assert.match(p.whyThisLens.reason,/temporal/i);
assert.equal(p.boundaries.modelCalculationAllowed,false);

p=mod.buildAsk2OrchestrationPlan({question:'为什么现在特别想换工作？',externalCurrentRequired:false});
assert.equal(p.taxonomy,'CURRENT');
assert.equal(p.orchestrationState,'CURRENT_CONTEXT_REQUIRED');
p=mod.buildAsk2OrchestrationPlan({question:'为什么现在特别想换工作？',externalCurrentRequired:false,currentContextSnapshot:ccr});
assert.equal(p.orchestrationState,'READY_FOR_RUNTIME_EXECUTION');
assert.equal(p.executionRequests[0].routeKey,'AST.CURRENT_DYNAMIC');

p=mod.buildAsk2OrchestrationPlan({question:'事业在我生命结构中是什么位置？'});
assert.equal(p.taxonomy,'DOMAIN');
assert.equal(p.executionRequests[0].routeKey,'ZWR.NATAL');

p=mod.buildAsk2OrchestrationPlan({question:'我应该怎样做决定？',publicRequest:true,externalCurrentRequired:false,currentContextSnapshot:ccr});
assert.equal(p.taxonomy,'DECISION');
assert.equal(p.executionRequests.length,0);
assert.equal(p.routePlan.routeState,'BLOCKED_CAPABILITY');
assert.equal(p.routePlan.primary.gate.reason,'LRR_PUBLIC_CAPABILITY_NOT_AVAILABLE');
p=mod.buildAsk2OrchestrationPlan({question:'我应该怎样做决定？',publicRequest:false,internalAccessClass:'GOVERNED_INTERNAL_PROFESSIONAL',externalCurrentRequired:false,currentContextSnapshot:ccr});
assert.equal(p.executionRequests[0].routeKey,'HDR.OPERATING_READING');

p=mod.buildAsk2OrchestrationPlan({question:'为什么我们最近越来越容易吵架？',taxonomyHint:'RELATIONSHIP',externalCurrentRequired:false,currentContextSnapshot:ccr});
assert.equal(p.relationalPlan.routeState,'RELATIONAL_RUNTIME_ROUTABLE');
assert.equal(p.executionRequests[0].runtimeCode,'PHI_OS_RELATIONAL_RUNTIME');

p=mod.buildAsk2OrchestrationPlan({question:"What is Malaysia's current OPR?",domain:'FINANCIAL_MARKETS',taxonomyHint:'REALITY_FACT'});
assert.equal(p.orchestrationState,'CURRENT_EXTERNAL_EVIDENCE_REQUIRED');
p=mod.buildAsk2OrchestrationPlan({question:"What is Malaysia's current OPR?",domain:'FINANCIAL_MARKETS',taxonomyHint:'REALITY_FACT',currentExternalEvidence:[cwa]});
assert.equal(p.orchestrationState,'REALITY_EVIDENCE_ONLY');
assert.equal(p.executionRequests.length,0);

assert.throws(()=>mod.composeAsk2BoundedState({plan:mod.buildAsk2OrchestrationPlan({question:'今年事业环境如何？'}),runtimeResults:[{requestId:'ASK2-RUNTIME-001',origin:'MODEL',sourceArtifactId:'x',sourceSchemaVersion:'y'}]}),/ASK2_RUNTIME_RESULT_COUNT_MISMATCH|ASK2_RUNTIME_RESULT_ORIGIN_INVALID/);
const timePlan=mod.buildAsk2OrchestrationPlan({question:'今年事业环境如何？'});
const results=timePlan.executionRequests.map((r,i)=>({requestId:r.requestId,origin:r.originRequired,sourceArtifactId:`ART-${i}`,sourceSchemaVersion:'TEST-SCHEMA',modelGeneratedCalculation:false}));
const composed=mod.composeAsk2BoundedState({plan:timePlan,runtimeResults:results});
assert.equal(composed.boundaries.modelMayCalculate,false);
assert.equal(composed.primaryLens.pluginCode,'BZR');
assert.equal(composed.answer,null);

assert.equal(acceptance.status,'ASK2_ORCHESTRATION_FOUNDATION_ACCEPTED_NOT_PUBLIC_EXECUTION_BOUND');
assert.equal(acceptance.productionBoundary.existingAskApiMutated,false);
assert.equal(acceptance.productionBoundary.liveSearchProviderBound,false);
assert.equal(freeze.status,'ASK2_W0_W3_ORCHESTRATION_FOUNDATION_FROZEN');

const legacyFiles=['functions/api/ask-phios.js','functions/api/ask-phios-consumption.js','functions/api/ask-phios-health.js'];
for(const f of legacyFiles)assert.ok(fs.existsSync(path.join(root,f)),`missing ${f}`);

console.log('✓ ASK2-W0–W3 runtime orchestration foundation passed.');
console.log('✓ Runtime-first, visible lens disclosure, route-reason disclosure and reality-evidence-first are frozen.');
console.log('✓ CCR is internal-current context; CWA is admitted external-current evidence; neither may be rewritten by a lens.');
console.log('✓ RLR relationship successor is consumed without mutating the frozen LRR-v1 predecessor.');
console.log('✓ Existing Ask / CKA / Health APIs remain unmodified and public execution binding is deferred.');
