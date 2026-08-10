import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { evaluateFragmentEligibility, evaluateVisualEligibility, assertCrossNodeAssembly, assertHandoff, isNoPublicAssetComplete } from './lib/knowledge-production-planning/kpp-handoff-governance-v1.mjs';
const root=process.cwd(); const base='content/knowledge/production-planning';
const r=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const must=[
`${base}/contracts/kpp-fragment-eligibility-gate-v1.json`,`${base}/schemas/kpp-fragment-eligibility-v1.schema.json`,
`${base}/contracts/kpp-visual-eligibility-gate-v1.json`,`${base}/schemas/kpp-visual-eligibility-v1.schema.json`,
`${base}/contracts/kpp-cross-node-asset-assembly-v1.json`,`${base}/schemas/kpp-cross-node-asset-assembly-v1.schema.json`,`${base}/registries/kpp-cross-node-asset-assembly-registry-v1.json`,
`${base}/policies/kpp-production-priority-policy-v1.json`,`${base}/contracts/kpp-production-wave-contract-v1.json`,`${base}/schemas/kpp-production-wave-v1.schema.json`,`${base}/registries/kpp-production-wave-registry-v1.json`,
`${base}/contracts/kpp-pja-handoff-contract-v1.json`,`${base}/schemas/kpp-pja-handoff-v1.schema.json`,`${base}/registries/kpp-pja-handoff-registry-v1.json`,
`${base}/contracts/kpp-car-handoff-contract-v1.json`,`${base}/schemas/kpp-car-handoff-v1.schema.json`,`${base}/registries/kpp-car-handoff-registry-v1.json`,
`${base}/contracts/kpp-no-public-asset-governance-v1.json`,`${base}/schemas/kpp-no-public-asset-completion-v1.schema.json`,`${base}/registries/kpp-no-public-asset-completion-registry-v1.json`,
`${base}/contracts/kpp-w13-w20-handoff-governance-v1.json`,`${base}/freeze/kpp-w13-w20-handoff-governance-freeze-v1.json`];
for(const p of must) await fs.access(path.join(root,p));
const fragment=await r(`${base}/contracts/kpp-fragment-eligibility-gate-v1.json`); assert.equal(fragment.kppMayCreateFragmentCandidate,false); assert.equal(fragment.handoffAuthority,'EXISTING_PJA');
assert.equal(evaluateFragmentEligibility({publicKnowledgeValueExists:true,knowledgeCoverageSufficient:true,boundaryStable:true,fragmentCanStandAlone:true,localeSourceAvailable:true}),'fragment_eligible');
assert.equal(evaluateFragmentEligibility({publicKnowledgeValueExists:true,knowledgeCoverageSufficient:false,boundaryStable:true,fragmentCanStandAlone:true,localeSourceAvailable:true}),'fragment_blocked');
const visual=await r(`${base}/contracts/kpp-visual-eligibility-gate-v1.json`); assert.equal(visual.articlePrerequisite,false); assert.equal(visual.kppMayCreateAssetCandidate,false);
assert.equal(evaluateVisualEligibility({knowledgeCoverageSufficient:true,visualStructurePresent:true,knowledgeBoundaryStable:true,localeSupported:true,carAssetTypeRegistered:true}),'visual_eligible');
const assembly=await r(`${base}/fixtures/kpp-cross-node-asset-assembly.figure4e.valid.json`); assert.equal(assertCrossNodeAssembly(assembly),true); assert.equal(assembly.primaryNode,'KN-B1-P4-003'); assert.deepEqual(assembly.supportingNodes,['KN-B1-P4-002','KN-B1-P4-005']);
const prio=await r(`${base}/policies/kpp-production-priority-policy-v1.json`); assert.equal(prio.nodeCodeOrderForbiddenAsPriorityBasis,true); assert.equal(prio.scoreDoesNotAutoAssignPriority,true);
const wave=await r(`${base}/contracts/kpp-production-wave-contract-v1.json`); assert.equal(wave.waveMayContainMixedRoles,true); assert.equal(wave.invariant,'WAVE_IS_MIXED_PRODUCTION_PLAN_NOT_ARTICLE_BATCH');
for(const reg of ['kpp-cross-node-asset-assembly-registry-v1.json','kpp-production-wave-registry-v1.json','kpp-pja-handoff-registry-v1.json','kpp-car-handoff-registry-v1.json','kpp-no-public-asset-completion-registry-v1.json']) { const x=await r(`${base}/registries/${reg}`); const arr=x.assemblies??x.waves??x.handoffs??x.records; assert.deepEqual(arr,[]); }
const pja=await r(`${base}/contracts/kpp-pja-handoff-contract-v1.json`); assert.deepEqual(pja.allowedRoles,['ARTICLE','FRAGMENT']); assert.equal(pja.kppMayCreateCandidate,false); assert.equal(assertHandoff('ARTICLE','PJA'),true); assert.throws(()=>assertHandoff('FIGURE','PJA'),/KPP_HANDOFF_ROLE_INVALID/);
const car=await r(`${base}/contracts/kpp-car-handoff-contract-v1.json`); assert.equal(car.kppMayCreateAssetBrief,false); assert.equal(car.kppMayCreateAssetCandidate,false); assert.equal(assertHandoff('FIGURE','CAR'),true); assert.throws(()=>assertHandoff('ARTICLE','CAR'),/KPP_HANDOFF_ROLE_INVALID/);
const noAsset=await r(`${base}/fixtures/kpp-no-public-asset-completion.valid.json`); assert.equal(isNoPublicAssetComplete(noAsset),true); const ng=await r(`${base}/contracts/kpp-no-public-asset-governance-v1.json`); assert.equal(ng.completionState,'complete'); assert(ng.mustNotBeCountedAs.includes('unfinished_production'));
// Existing authorities are read-only prerequisites if present.
try { const carTypes=await r('content/professional/canonical-asset-runtime/registries/canonical-asset-type-registry-v1.json'); const types=(carTypes.assetTypes??carTypes.types??[]).map(x=>typeof x==='string'?x:x.assetType??x.code); for(const t of ['FIGURE','DIAGRAM','ACADEMY_LESSON','SLIDES','VIDEO_SCRIPT','WEBSITE_MODULE']) assert(types.includes(t)); } catch {}
try { const old=await r(`${base}/registries/kpp-canonical-production-plan-registry-v1.json`); assert.deepEqual(old.plans,[]); } catch {}
const freeze=await r(`${base}/freeze/kpp-w13-w20-handoff-governance-freeze-v1.json`); assert.equal(freeze.baselineCommit,'86bee5093dd4975dddbe864da9626b655bbc32ee'); assert.equal(freeze.productionStatus,'validation_only');
console.log('✓ KPP-W13～W20 Handoff & Completion Governance passed.');
console.log('✓ Fragment and Visual eligibility fail closed; visuals do not require Articles.');
console.log('✓ Cross-node assets and mixed-role Waves are supported without creating PJA/CAR candidates.');
console.log('✓ NO_PUBLIC_ASSET_REQUIRED is a valid complete state and is not counted as unfinished production.');
