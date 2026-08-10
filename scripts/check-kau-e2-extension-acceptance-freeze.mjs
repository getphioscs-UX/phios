import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), base='content/knowledge/authoring/extensions/legacy-supporting-source';
const readJson=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const digest=async f=>crypto.createHash('sha256').update(await fs.readFile(path.join(root,f))).digest('hex');
const contract=await readJson(`${base}/contracts/kau-e2-extension-acceptance-freeze-contract-v1.json`);
const accepted=await readJson(`${base}/registries/legacy-accepted-supporting-relationship-registry-v1.json`);
const deferred=await readJson(`${base}/registries/legacy-deferred-review-registry-v1.json`);
const handoff=await readJson(`${base}/handoff/kau-e2-kpp-accepted-supporting-relationship-handoff-v1.json`);
const manifest=await readJson(`${base}/manifests/kau-e2-extension-freeze-manifest-v1.json`);
const acceptance=await readJson(`${base}/acceptance/kau-e2-extension-acceptance-v1.json`);
const freeze=await readJson(`${base}/freeze/kau-e2-extension-freeze-v1.json`);
const completion=await readJson(`${base}/acceptance/kau-e1r-human-review-completion-acceptance-v1.json`);
const v7=await readJson(`${base}/review-resolution/batches/legacy-human-review-resolution-registry-v7.json`);
const e0=await readJson(`${base}/registries/legacy-supporting-source-registry-v2.json`);
const queue=await readJson(`${base}/review/legacy-unified-language-human-review-queue-v1.json`);
const nodes=await readJson('content/knowledge/registry/nodes.json');
const cmw=await readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const migration=await readJson('content/governance/canonical-master-work/registries/canonical-master-work-migration-registry-v1.json');
const kppContract=await readJson('content/knowledge/production-planning/contracts/kpp-v2-reconciliation-w21-w22-w24-w26-foundation-v1.json');

assert.equal(contract.workCode,'KAU-E2');
assert.equal(contract.rules.acceptedRelationshipIsSupportingOnly,true);
assert.equal(contract.rules.kppMayConsumeOnlyFrozenAcceptedSupportingProjection,true);
assert.equal(e0.entries.length,2);
for(const s of e0.entries){assert.equal(s.supportingOnly,true);assert.equal(s.canonicalAuthority,false);assert.equal(s.meaningAuthority,false);assert.equal(s.nodeAuthority,false);assert.equal(s.publicationAuthority,false);}
assert.equal(completion.status,'HUMAN_REVIEW_COMPLETE_READY_FOR_KAU_E2');
assert.equal(completion.totals.humanReviewed,185);assert.equal(completion.totals.pendingHumanDecision,0);assert.equal(completion.totals.acceptedSupporting,155);assert.equal(completion.totals.deferred,30);
assert.equal(v7.kauE2Ready,true);

const queueByCode=new Map(queue.entries.map(x=>[x.reviewCode,x])); assert.equal(queueByCode.size,185);
const decisions=[];
for(const wave of ['a','b','c','d','e','f']){const d=await readJson(`${base}/review-resolution/decisions/legacy-human-review-wave-${wave}-decisions-v1.json`); for(const entry of d.decisions) decisions.push({wave:wave.toUpperCase(),entry});}
assert.equal(decisions.length,185); assert.equal(new Set(decisions.map(x=>x.entry.reviewCode)).size,185);

const nodeCodes=new Set(nodes.nodes.map(n=>n.nodeCode)); assert.equal(nodes.nodes.length,716);
assert.equal(await digest('content/knowledge/registry/nodes.json'),acceptance.authoritySnapshots.canonicalNodeRegistry.sha256);
assert.equal(acceptance.authoritySnapshots.canonicalNodeRegistry.sha256,'61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431');
assert.equal(await digest(acceptance.authoritySnapshots.canonicalMeaningCodeRegistry.path),acceptance.authoritySnapshots.canonicalMeaningCodeRegistry.sha256);
assert.equal(await digest(acceptance.authoritySnapshots.kppCanonicalProductionPlanRegistry.path),acceptance.authoritySnapshots.kppCanonicalProductionPlanRegistry.sha256);

const expA=new Map(), expD=new Map(), typeCounts={}; let edges=0;
for(const {wave,entry} of decisions){const q=queueByCode.get(entry.reviewCode);assert.ok(q);assert.ok(entry.reviewedBy);assert.ok(entry.reviewedAt);assert.ok(entry.humanReason);
 if(entry.humanDecision==='DEFER'){assert.equal(entry.acceptedCanonicalNodeReferences.length,0); expD.set(entry.reviewCode,{wave,entry,q});}
 else{typeCounts[entry.humanDecision]=(typeCounts[entry.humanDecision]??0)+1; for(const ref of entry.acceptedCanonicalNodeReferences){assert.ok(nodeCodes.has(ref),`UNKNOWN_NODE:${ref}`);edges++;} expA.set(entry.reviewCode,{wave,entry,q});}}
assert.equal(expA.size,155);assert.equal(expD.size,30);assert.equal(edges,597);

assert.equal(accepted.relationshipCount,155);assert.equal(accepted.canonicalNodeReferenceEdgeCount,597);
assert.deepEqual(accepted.relationshipTypeCounts,Object.fromEntries(Object.entries(typeCounts).sort()));
for(const r of accepted.entries){const x=expA.get(r.reviewCode);assert.ok(x);assert.equal(r.relationshipType,x.entry.humanDecision);assert.deepEqual(r.canonicalNodeReferences,x.entry.acceptedCanonicalNodeReferences);assert.deepEqual(r.architectureReferences??[],x.entry.architectureReferences??[]);assert.equal(r.sourceCode,x.q.sourceCode);assert.equal(r.legacySectionCode,x.q.legacySectionCode);assert.equal(r.state,'ACCEPTED_SUPPORTING');assert.equal(r.supportingOnly,true);assert.equal(r.canonicalAuthority,false);assert.equal(r.meaningAuthority,false);assert.equal(r.publicationAuthority,false);assert.equal(r.productionDecisionAuthority,false);assert.equal(r.mayOverwriteCanonical,false);}
assert.equal(deferred.deferredCount,30);for(const r of deferred.entries){assert.ok(expD.has(r.reviewCode));assert.equal(r.state,'DEFERRED');assert.deepEqual(r.canonicalNodeReferences,[]);assert.equal(r.autoResolutionAllowed,false);}
assert.equal(deferred.rules.futureResolutionRequiresNewGovernedWork,true);

assert.equal(handoff.status,'READY_FOR_CONTROLLED_KPP_CONSUMPTION');assert.equal(handoff.acceptedReviewCount,155);assert.equal(handoff.deferredReviewCount,30);assert.equal(handoff.canonicalNodeReferenceEdgeCount,597);
assert.deepEqual(handoff.allowedConsumers,['KPP-W23','KPP-W27']);assert.equal(handoff.consumerRules.readOnly,true);assert.equal(handoff.consumerRules.rawLegacySourceAccessForbidden,true);assert.equal(handoff.consumerRules.acceptedSupportingDoesNotEqualProductionReadiness,true);assert.equal(handoff.consumerRules.acceptedSupportingDoesNotEqualArticleRequirement,true);assert.equal(handoff.consumerRules.acceptedSupportingDoesNotEqualPriority,true);assert.equal(handoff.consumerRules.acceptedSupportingDoesNotEqualWavePlacement,true);assert.equal(handoff.consumerRules.deferredItemsExcluded,true);
assert.equal(kppContract.rawLegacySourceAccepted,false);assert.ok(kppContract.explicitlyDeferred.some(x=>x.includes('KPP-W23')&&x.includes('KAU-E2')));assert.ok(kppContract.explicitlyDeferred.some(x=>x.includes('KPP-W27')&&x.includes('KAU-E2')));

for(const item of manifest.files) assert.equal(await digest(item.path),item.sha256,`FREEZE_DRIFT:${item.path}`);
const md=await digest(`${base}/manifests/kau-e2-extension-freeze-manifest-v1.json`);assert.equal(acceptance.freezeManifestSha256,md);assert.equal(freeze.freezeManifestSha256,md);
assert.equal(acceptance.relationshipState.acceptedSupporting,155);assert.equal(acceptance.relationshipState.deferred,30);assert.equal(acceptance.relationshipState.canonicalNodeReferenceEdges,597);
assert.equal(acceptance.checks.canonicalNodeRegistryMutated,false);assert.equal(acceptance.checks.meaningAuthorityMutated,false);assert.equal(acceptance.checks.productionReadinessPromoted,false);assert.equal(acceptance.checks.articleRequirementCreated,false);assert.equal(acceptance.checks.frozenWaveMutated,false);assert.equal(acceptance.checks.rawLegacyToKppForbidden,true);assert.equal(acceptance.checks.deferredItemsAutoResolved,false);assert.equal(acceptance.checks.baseKauFreezeMutated,false);assert.equal(acceptance.checks.cmwRegistryMutated,false);
assert.equal(freeze.status,'frozen');assert.equal(freeze.counts.humanReviewed,185);assert.equal(freeze.counts.acceptedSupporting,155);assert.equal(freeze.counts.deferred,30);assert.equal(freeze.counts.canonicalNodeReferenceEdges,597);assert.equal(freeze.extensionStatus,'FROZEN_WITH_GOVERNED_DEFERRED_ITEMS');

const e2=cmw.entries.find(x=>x.workCode==='KAU-E2');assert.ok(e2);assert.equal(e2.runtimeCode,'KAU');assert.equal(e2.executionOrder,410);assert.equal(e2.status,'PLANNED');
const mig=migration.entries.find(x=>x.canonicalWorkCode==='KAU-E2');assert.ok(mig);assert.equal(mig.legacyWorkCode,'KAU-W18-PROPOSED');assert.equal(mig.freezeImpact,'NO_SILENT_MUTATION');
for(const r of queue.entries){assert.equal(r.reviewStatus,'PENDING');assert.equal(r.humanDecision,null);assert.equal(r.acceptedRelationship,null);}

console.log('✓ KAU-E2 Extension Acceptance & Freeze passed.');
console.log('✓ 185/185 human reviews governed: 155 frozen accepted-supporting records, 30 frozen deferred records, 597 canonical-node reference edges.');
console.log('✓ KPP-W23/W27 may consume only the frozen E2 handoff; raw legacy remains forbidden and no production decision is promoted.');
console.log('✓ Canonical Knowledge, Meaning, Publication, KPP decision authority and KAU v1 base freeze remain unchanged.');
