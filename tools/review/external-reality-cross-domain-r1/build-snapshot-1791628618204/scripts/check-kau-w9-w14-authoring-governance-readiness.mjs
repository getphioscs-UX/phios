import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { classifyCoverage, detectManuscriptDrift, assessProductionReadiness, assertKauGovernanceBoundary, KAU_COVERAGE_STATES } from './lib/knowledge-authoring/knowledge-authoring-governance-v1.mjs';

const root=process.cwd();
const readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const exists=async p=>!!(await fs.stat(path.join(root,p)).catch(()=>null));
const base='content/knowledge/authoring';
const required=[
 `${base}/contracts/kau-w9-node-coverage-analysis-v1.json`,`${base}/schemas/node-coverage-analysis-v1.schema.json`,`${base}/registries/node-coverage-analysis-registry-v1.json`,
 `${base}/contracts/kau-w10-manuscript-drift-runtime-v1.json`,`${base}/schemas/manuscript-drift-record-v1.schema.json`,`${base}/schemas/knowledge-change-proposal-v1.schema.json`,`${base}/registries/manuscript-drift-registry-v1.json`,`${base}/registries/knowledge-change-proposal-registry-v1.json`,
 `${base}/contracts/kau-w11-knowledge-change-impact-v1.json`,`${base}/schemas/knowledge-change-impact-v1.schema.json`,`${base}/registries/knowledge-change-impact-registry-v1.json`,
 `${base}/contracts/kau-w12-editorial-decision-runtime-v1.json`,`${base}/schemas/editorial-decision-v1.schema.json`,`${base}/registries/editorial-decision-registry-v1.json`,
 `${base}/contracts/kau-w13-knowledge-authority-update-proposal-v1.json`,`${base}/schemas/registry-change-package-v1.schema.json`,`${base}/registries/registry-change-package-registry-v1.json`,
 `${base}/contracts/kau-w14-authoring-production-readiness-v1.json`,`${base}/schemas/pja-production-readiness-package-v1.schema.json`,`${base}/registries/pja-production-readiness-package-registry-v1.json`,
 `${base}/freeze/kau-w9-w14-authoring-governance-freeze-v1.json`,`${base}/freeze/kau-full-freeze-v1.json`,
 `${base}/fixtures/manuscript-drift.valid.json`,`${base}/fixtures/knowledge-change-proposal.valid.json`,`${base}/fixtures/knowledge-change-impact.valid.json`,`${base}/fixtures/editorial-decision.valid.json`,`${base}/fixtures/registry-change-package.valid.json`,`${base}/fixtures/pja-production-readiness-package.valid.json`
];
for(const p of required) assert.equal(await exists(p),true,`KAU_FILE_MISSING:${p}`);

const nodes=await readJson('content/knowledge/registry/nodes.json');
const nodeCodes=new Set(nodes.nodes.map(x=>x.nodeCode));
assert.equal(nodeCodes.size,716,'KAU must not change the 716-node Canonical Authority baseline.');

const coverage=await readJson(`${base}/registries/node-coverage-analysis-registry-v1.json`);
assert.equal(coverage.nodeCount,716);
assert.equal(coverage.entries.length,716);
assert.equal(new Set(coverage.entries.map(x=>x.nodeCode)).size,716);
for(const e of coverage.entries){
 assert.ok(nodeCodes.has(e.nodeCode),`Unknown node in KAU coverage:${e.nodeCode}`);
 assert.ok(KAU_COVERAGE_STATES.includes(e.coverageStatus));
 assert.equal(classifyCoverage(e.dimensions),e.coverageStatus,`Coverage classification drift:${e.nodeCode}`);
 assert.equal(e.authorityMode,'analysis_only');
}

const driftRegistry=await readJson(`${base}/registries/manuscript-drift-registry-v1.json`);
const changeRegistry=await readJson(`${base}/registries/knowledge-change-proposal-registry-v1.json`);
const impactRegistry=await readJson(`${base}/registries/knowledge-change-impact-registry-v1.json`);
const editorialRegistry=await readJson(`${base}/registries/editorial-decision-registry-v1.json`);
const packageRegistry=await readJson(`${base}/registries/registry-change-package-registry-v1.json`);
const readinessRegistry=await readJson(`${base}/registries/pja-production-readiness-package-registry-v1.json`);
assert.deepEqual(driftRegistry.records,[]);
assert.deepEqual(changeRegistry.productionProposals,[]);
assert.deepEqual(impactRegistry.records,[]);
assert.deepEqual(editorialRegistry.productionDecisions,[]);
assert.deepEqual(packageRegistry.productionPackages,[]);
assert.deepEqual(readinessRegistry.productionPackages,[]);
assert.equal(packageRegistry.automaticApplyAllowed,false);
assert.equal(readinessRegistry.articleCandidateCreationAllowed,false);

const drift=await readJson(`${base}/fixtures/manuscript-drift.valid.json`);
const rebuilt=detectManuscriptDrift(drift);
assert.deepEqual(rebuilt.affectedSections,drift.affectedSections);
assert.deepEqual(rebuilt.affectedNodes,drift.affectedNodes);
assert.deepEqual(rebuilt.detectedDrift,drift.detectedDrift.slice().sort());
assert.equal(rebuilt.status,'requires_human_review');
const noDrift=detectManuscriptDrift({...drift,newManuscriptDigest:drift.oldManuscriptDigest});
assert.equal(noDrift.status,'no_drift');
assert.deepEqual(noDrift.affectedNodes,[]);

const change=await readJson(`${base}/fixtures/knowledge-change-proposal.valid.json`);
assert.equal(change.authorityMode,'proposal_only');
assert.equal(change.status,'human_review_required');
const impact=await readJson(`${base}/fixtures/knowledge-change-impact.valid.json`);
assert.equal(impact.authorityMode,'analysis_only');
assert.ok(impact.affectedObjects.nodes.every(x=>nodeCodes.has(x)));

const decision=await readJson(`${base}/fixtures/editorial-decision.valid.json`);
assert.equal(decision.humanDecision,true);
assert.ok(decision.actor.length>0);
const changePackage=await readJson(`${base}/fixtures/registry-change-package.valid.json`);
assert.equal(changePackage.targetAuthority,'KNOWLEDGE_GOVERNANCE');
assert.equal(changePackage.authorityMode,'proposal_only');

const ready=await readJson(`${base}/fixtures/pja-production-readiness-package.valid.json`);
const assessed=assessProductionReadiness({nodeExists:ready.checks.canonicalNodeExists,...ready.checks});
assert.equal(assessed.productionReady,ready.productionReady);
assert.deepEqual(assessed.blockingReasons,ready.blockingReasons);
assert.equal(ready.pjaAuthority,'EXISTING_PJA');
assert.equal(ready.authorityMode,'readiness_handoff_only');

for(const op of ['mutate_nodes_registry','write_article_candidate','approve_article','publish_article','mutate_meaning_mapping','mutate_asset_registry','mutate_journey_state','apply_registry_change_package']) assert.throws(()=>assertKauGovernanceBoundary(op),/KAU_AUTHORITY_BOUNDARY_DENIED/);
assert.equal(assertKauGovernanceBoundary('create_knowledge_change_proposal'),true);
assert.equal(assertKauGovernanceBoundary('create_pja_readiness_handoff'),true);

const full=await readJson(`${base}/freeze/kau-full-freeze-v1.json`);
assert.equal(full.status,'frozen');
assert.equal(full.scope,'KAU-W0-W14');
assert.equal(full.productionStatus,'validation_only');
assert.equal(full.boundaries.directKnowledgeAuthorityMutation,false);
assert.equal(full.boundaries.directArticleCandidateCreation,false);

console.log('✓ KAU-W9 Node Coverage Analysis passed: all 716 Canonical Nodes assessed without authority mutation.');
console.log('✓ KAU-W10/W11 Drift and Change Impact passed: changes create proposals/revalidation obligations only.');
console.log('✓ KAU-W12/W13 Human Editorial and Knowledge Governance handoff passed; no package auto-applies.');
console.log('✓ KAU-W14 Production Readiness passed; KAU hands off to existing PJA and cannot create Article Candidates.');
console.log('✓ Knowledge Authoring Runtime v1 (KAU-W0～W14) Full Freeze passed.');
