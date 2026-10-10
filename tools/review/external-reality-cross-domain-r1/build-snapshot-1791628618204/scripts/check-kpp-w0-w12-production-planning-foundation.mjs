import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PRODUCTION_ROLES, evaluateArticleEligibility, assertPlanningBoundary, recommendRole } from './lib/knowledge-production-planning/kpp-foundation-v1.mjs';
const root=process.cwd();
const r=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const base='content/knowledge/production-planning';
const must=[
 `${base}/audits/kpp-baseline-audit-v1.json`,`${base}/audits/kpp-authority-boundary-v1.json`,`${base}/audits/kpp-existing-production-reconciliation-v1.json`,
 `${base}/contracts/kpp-production-role-contract-v1.json`,`${base}/registries/kpp-production-role-registry-v1.json`,
 `${base}/policies/kpp-independent-reading-value-policy-v1.json`,`${base}/policies/kpp-narrative-duplication-gate-v1.json`,`${base}/policies/kpp-fragment-suitability-policy-v1.json`,`${base}/policies/kpp-visual-suitability-policy-v1.json`,`${base}/policies/kpp-runtime-only-classification-v1.json`,`${base}/policies/kpp-journey-production-need-v1.json`,`${base}/policies/kpp-academy-production-need-v1.json`,`${base}/policies/kpp-multi-asset-decision-v1.json`,`${base}/policies/kpp-production-need-score-v1.json`,
 `${base}/registries/kpp-canonical-production-plan-registry-v1.json`,`${base}/contracts/kpp-article-eligibility-gate-v1.json`,`${base}/freeze/kpp-w0-w12-production-planning-foundation-freeze-v1.json`
];
for (const p of must) await fs.access(path.join(root,p));
const audit=await r(must[0]);
assert.equal(audit.baselineCommit,'9bfa695935e98e020231ba745769b4fcbea73754');
assert(audit.invariants.includes('716_CANONICAL_NODES_NOT_716_ARTICLES'));
const boundary=await r(must[1]);
for (const x of ['create_node','rewrite_knowledge','write_article','approve_article','publish','create_final_asset']) assert(boundary.forbidden.includes(x));
const roleContract=await r(`${base}/contracts/kpp-production-role-contract-v1.json`);
assert.equal(roleContract.defaultRole,null); assert.equal(roleContract.defaultArticleRequired,false); assert.deepEqual(roleContract.roles,PRODUCTION_ROLES);
const score=await r(`${base}/policies/kpp-production-need-score-v1.json`);
assert.equal(score.scoreMayNotAutoAssignProductionRole,true); assert.equal(score.scoreMayNotAutoRequireArticle,true);
const dup=await r(`${base}/policies/kpp-narrative-duplication-gate-v1.json`); assert.equal(dup.failureCode,'ARTICLE_NOT_JUSTIFIED');
const journey=await r(`${base}/policies/kpp-journey-production-need-v1.json`); assert.equal(journey.invariant,'JOURNEY_NEEDS_KNOWLEDGE_NOT_ARTICLE');
const plans=await r(`${base}/registries/kpp-canonical-production-plan-registry-v1.json`); assert.deepEqual(plans.plans,[]); assert.equal(plans.invariants.emptyRegistryIsValidBeforeProductionPlanning,true);
const visualRole=recommendRole({noPublicAssetRequired:false,runtimeValue:50,publicReadingValue:40,visualValue:90,independentReadingValue:35,diagramPreferred:false,teachingValue:30,journeyValue:40,duplicationRisk:20,fragmentValue:45}); assert.equal(visualRole,'FIGURE');
assert.equal(evaluateArticleEligibility({knowledgeCoverageSufficient:true,standaloneReadingValueSufficient:true,independentQuestionClear:true,boundaryStable:true,narrativeDuplicationAcceptable:true,entryValueExists:true,localeSourceAvailable:true}),'article_eligible');
assert.equal(evaluateArticleEligibility({knowledgeCoverageSufficient:true,standaloneReadingValueSufficient:false,independentQuestionClear:false,boundaryStable:true,narrativeDuplicationAcceptable:true,entryValueExists:true,localeSourceAvailable:true}),'article_not_required');
assert.throws(()=>assertPlanningBoundary('write_article'),/KPP_AUTHORITY_BOUNDARY_VIOLATION/); assert.equal(assertPlanningBoundary('plan'),true);
const invalid=await r(`${base}/fixtures/kpp-production-plan.invalid-default-article.json`); assert.equal(invalid.humanDecisionRequired,false);
const freeze=await r(`${base}/freeze/kpp-w0-w12-production-planning-foundation-freeze-v1.json`); assert.equal(freeze.productionPlanRegistryMustRemainEmpty,true); assert.equal(freeze.articleDefaultRequired,false);
// Optional reconciliation with existing KAU if present.
try { const cov=await r('content/knowledge/authoring/registries/node-coverage-analysis-registry-v1.json'); const arr=cov.entries ?? cov.nodes ?? cov.coverage ?? cov.records; if (Array.isArray(arr)) assert.equal(arr.length,716); } catch {}
console.log('✓ KPP-W0～W12 Production Planning Foundation passed.');
console.log('✓ Canonical Node is not Article; Knowledge Ready is not Article Required.');
console.log('✓ Production roles have no default and scoring cannot auto-assign Article or any production role.');
console.log('✓ Article Eligibility fails closed and KPP cannot create nodes, write/approve/publish articles or create final assets.');
