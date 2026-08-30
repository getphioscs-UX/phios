import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {buildAstCustomerWorkspaceCandidate} from '../functions/ast-full-production/ast-customer-reading-production.js';
import {adaptAstPersonalRealityProduct} from '../functions/personal-reality-product/adapters/ast-production-adapter.js';
import {resolveSpecialistRendererDescriptor} from '../assets/customer-ui/js/personal-products/specialist-renderer-registry.js';
import {buildAstExplorerInspectorHtml,buildAstrologySpecialistSurfaceV3,orderedThemeRefsForIntent} from '../assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';
import {renderAstrologyProduct} from '../assets/customer-ui/js/specialists/ast/product-renderer.js';
import {AST_CX_R3_CUSTOMER_EXPERIENCE_SCHEMA,AST_CX_R3_W13_W16_BASELINE} from '../functions/ast-full-production/ast-customer-experience-projection-v1.js';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='content/professional/ast-full-production/customer-product-v3';
const baseline='ea68b40a8ee32754e04cfc3aba6eede271dc63f5';
const escapeHtml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const occurrences=(haystack,needle)=>{if(!needle)return 0;let n=0,i=0;while((i=haystack.indexOf(needle,i))!==-1){n++;i+=needle.length}return n};
globalThis.document={documentElement:{lang:'zh-Hans'}};

// PPR-R3 shared host + shared single-method-reading remain frozen.
const pprFreeze=json('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
for(const [p,d] of Object.entries(pprFreeze.protectedConvergenceFiles))assert.equal(sha(p),d,`AST-CX-R3 W13-W16 protected PPR drift: ${p}`);
for(const [p,d] of Object.entries(pprFreeze.sharedSingleMethodReadingFiles))assert.equal(sha(p),d,`AST-CX-R3 W13-W16 shared SMR drift: ${p}`);
for(const p of ['assets/customer-ui/js/personal-products/personal-product-renderers.js','assets/customer-ui/js/personal-products/specialist-renderer-host.js','assets/customer-ui/js/personal-products/specialist-renderer-registry.js','assets/customer-ui/surfaces/ppr-r3-specialist-host.css'])assert.equal(sha(p),pprFreeze.successorFiles[p],`AST-CX-R3 W13-W16 shared PPR-R3 host drift: ${p}`);

const docs=[
  json(`${base}/contracts/ast-cx-r3-w13-whole-chart-reading-contract-v1.json`),
  json(`${base}/contracts/ast-cx-r3-w14-one-narrative-owner-contract-v1.json`),
  json(`${base}/contracts/ast-cx-r3-w15-intent-lens-contract-v1.json`),
  json(`${base}/contracts/ast-cx-r3-w16-reality-comparison-binding-contract-v1.json`)
];
assert.deepEqual(docs.map(x=>x.workCode),['AST-CX-R3-W13','AST-CX-R3-W14','AST-CX-R3-W15','AST-CX-R3-W16']);
for(const doc of docs)assert.equal(doc.baselineCommit,baseline,`${doc.workCode} baseline drift`);
assert.equal(AST_CX_R3_W13_W16_BASELINE,baseline);
assert.equal(docs[1].policy,'ONE_NARRATIVE_REF_ONE_FULL_EXPLANATION_OWNER');
assert.equal(docs[1].primaryOwnerSurface,'MY_READING');
assert.equal(docs[2].boundaries.meaningChanged,false);
assert.equal(docs[3].externalOwnerRequired,'CX-R12R4B');
assert.equal(docs[3].canonicalRouteCurrentState,'NOT_BOUND_UNTIL_CX_R12R4B_HANDOFF_EXISTS');

const fixture=json('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const route=await buildPersonalRealityProductRoute({selectedKeys:['astrology'],results:[{ok:true,key:'astrology',spec:{methodCode:'ASTROLOGY'},canonicalProjection:fixture.inputProjection}],locale:'zh-Hans',intent:'work role direction'});
assert.equal(route.mode,'SINGLE_METHOD');
const product=route.primaryProduct;
assert.equal(product.methodId,'AST');
assert.equal(product.state,'CUSTOMER_PUBLISHABLE');
assert.equal(resolveSpecialistRendererDescriptor(product)?.rendererId,'PPR_R3_AST_PRODUCT_V1');
for(const cap of ['AST_WHOLE_CHART_READING_V3','AST_SINGLE_NARRATIVE_OWNER','AST_INTENT_LENS','AST_REALITY_COMPARISON_BINDING'])assert(product.specialistRenderer.capabilities.includes(cap),`missing W13-W16 capability ${cap}`);
const p=product.sourceProduct?.customerProductProjection;
const x=product.sourceProduct?.customerExperienceProjection;
assert.equal(p?.schemaVersion,'PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0');
assert.equal(x?.schemaVersion,AST_CX_R3_CUSTOMER_EXPERIENCE_SCHEMA);
assert.equal(product.lineage.customerExperienceProjectionSchema,AST_CX_R3_CUSTOMER_EXPERIENCE_SCHEMA);
assert.equal(product.lineage.customerExperienceSemanticDigest,x.semanticDigest);
assert.equal(product.boundaries.customerExperienceProjectionCreatesMeaning,false);
assert.equal(product.boundaries.realityAuthorityCreated,false);

// W13 — whole-chart reading is primary, with admitted prose + structural progressive disclosure.
const plan=buildAstrologySpecialistSurfaceV3(p,x);
assert.equal(plan.status,'RENDERED');
const allHtml=[plan.navigationHtml,plan.visualHtml,plan.readingHtml,plan.technicalHtml].join('');
assert.match(plan.visualHtml,/data-astcx-section="my-reading"/);
assert.match(plan.visualHtml,/data-astcx-theme-owner-list/);
assert.match(plan.visualHtml,/为什么出现这项内容/);
assert.match(plan.visualHtml,/支持连接/);
assert.match(plan.visualHtml,/张力连接/);
assert.match(plan.visualHtml,/仍然开放/);
assert.equal((plan.visualHtml.match(/data-astcx-theme-owner=/g)||[]).length,p.keyConfigurations.length);
for(const theme of p.keyConfigurations){
  assert.equal(occurrences(allHtml,escapeHtml(theme.readerText)),1,`full narrative must render exactly once for ${theme.themeRef}`);
  assert(plan.visualHtml.includes(escapeHtml(theme.readerTitle)),`reading owner title missing ${theme.themeRef}`);
}
assert.doesNotMatch(allHtml,/>\s*(sourceRefs|narrativeRef|renderOwnerId)\s*</i);
assert.doesNotMatch(allHtml,/严格采用普拉西德宫制[^<]*严格采用普拉西德宫制/);

// W14 — one narrativeRef / renderOwnerId = one full explanation owner. Inspectors link back, never repeat prose.
assert.equal(x.narrativeOwnership.policy,'ONE_NARRATIVE_REF_ONE_FULL_EXPLANATION_OWNER');
assert.equal(x.narrativeOwnership.themeOwners.length,p.keyConfigurations.length);
assert.equal(x.narrativeOwnership.fullExplanationOwnerCount,p.keyConfigurations.length+1);
assert.equal(x.narrativeOwnership.exactDuplicateFullExplanationCount,0);
assert.equal(x.narrativeOwnership.normalizedDuplicateFullExplanationCount,0);
assert.equal(new Set(x.narrativeOwnership.themeOwners.map(o=>o.narrativeRef)).size,p.keyConfigurations.length);
assert.equal(new Set(x.narrativeOwnership.themeOwners.map(o=>o.renderOwnerId)).size,p.keyConfigurations.length);
for(const theme of p.keyConfigurations){
  const inspector=buildAstExplorerInspectorHtml(p,'theme',theme.themeRef);
  assert(!inspector.includes(escapeHtml(theme.readerText)),`theme inspector repeats full narrative ${theme.themeRef}`);
  assert.match(inspector,/data-astcx-jump-theme-owner=/);
}

// W15 — all six governed lenses reorder the same admitted theme set; no browser meaning changes.
const intentIds=['OPEN','EXPRESSION','WORK','RELATIONSHIP','PRESSURE','DIRECTION'];
assert.deepEqual(x.intentLens.views.map(v=>v.intentId),intentIds);
assert.equal(x.intentLens.activeIntentId,'WORK');
const baseRefs=p.keyConfigurations.map(t=>t.themeRef);
const baseSet=[...baseRefs].sort();
for(const id of intentIds){
  const view=x.intentLens.views.find(v=>v.intentId===id);assert(view,`intent view missing ${id}`);
  assert.equal(view.meaningChanged,false,`${id} changed meaning`);
  const refs=orderedThemeRefsForIntent(x,id);
  assert.equal(refs.length,baseRefs.length,`${id} theme count drift`);
  assert.equal(new Set(refs).size,baseRefs.length,`${id} duplicate theme ref`);
  assert.deepEqual([...refs].sort(),baseSet,`${id} introduced/dropped theme`);
}
assert.notDeepEqual(orderedThemeRefsForIntent(x,'EXPRESSION'),orderedThemeRefsForIntent(x,'WORK'),'fixture must prove intent can reorder focus without changing the selected theme set');
assert.match(plan.visualHtml,/data-astcx-intent="OPEN"/);
assert.match(plan.visualHtml,/data-astcx-intent="WORK"/);
assert.match(plan.visualHtml,/这里只调整顺序与焦点/);

// W16 — canonical PPR route remains unbound until the CX-R12R4B handoff exists.
assert.equal(x.realityComparison.state,'NOT_BOUND');
assert.equal(x.realityComparison.owner,'CX-R12R4B');
assert.equal(x.realityComparison.items.length,0);
assert.equal(product.boundaries.currentRealityKnown,false);
assert.match(plan.readingHtml,/尚未与你当前现实进行对照/);
assert.match(plan.readingHtml,/命盘不会自行猜测现实状态/);

// Synthetic consumer validation: AST may display explicit CX-R12R4B records, but cannot infer or own them.
const responses=['CURRENTLY_RESONANT','PARTIALLY_RESONANT','CURRENTLY_NOT_RESONANT','OPEN'];
const realityItems=p.keyConfigurations.slice(0,4).map((theme,i)=>({themeRef:theme.themeRef,customerResponse:responses[i],capturedAt:`2026-08-${20+i}T10:00:00+08:00`,sourceRefs:[`REALITY-COMP-${i+1}`]}));
const boundBundle=await buildAstCustomerWorkspaceCandidate({canonicalProjection:fixture.inputProjection,rawIntent:'work role direction',locale:'zh-Hans',sourceMainCommit:baseline,realityComparison:{owner:'CX-R12R4B',items:realityItems}});
const bx=boundBundle.customerExperienceProjection;
assert.equal(bx.realityComparison.state,'BOUND');
assert.equal(bx.realityComparison.items.length,4);
assert.equal(bx.realityComparison.customerSelfReportUsed,true);
assert.equal(bx.realityComparison.chartUsedAsRealityProof,false);
for(const [i,item] of bx.realityComparison.items.entries()){assert.equal(item.customerResponse,responses[i]);assert.equal(item.source,'CUSTOMER')}
const boundProduct=adaptAstPersonalRealityProduct({workspace:boundBundle.workspace,locale:'zh-Hans'});
assert.equal(boundProduct.boundaries.currentRealityKnown,true);
const boundPlan=buildAstrologySpecialistSurfaceV3(boundBundle.customerProductProjection,bx);
for(const label of ['这很符合我现在的现实','部分符合','目前不符合','我不确定'])assert(boundPlan.readingHtml.includes(label),`customer reality label missing: ${label}`);
assert.match(boundPlan.readingHtml,/客户自述/);
assert.match(boundPlan.readingHtml,/不会把它升级成命盘客观为真的证明/);
await assert.rejects(()=>buildAstCustomerWorkspaceCandidate({canonicalProjection:fixture.inputProjection,locale:'zh-Hans',sourceMainCommit:baseline,realityComparison:{owner:'AST',items:realityItems}}),/AST_CX_R3_W16_REALITY_OWNER_REQUIRED/);
await assert.rejects(()=>buildAstCustomerWorkspaceCandidate({canonicalProjection:fixture.inputProjection,locale:'zh-Hans',sourceMainCommit:baseline,realityComparison:{owner:'CX-R12R4B',items:[{themeRef:p.keyConfigurations[0].themeRef,customerResponse:'YES_IT_IS_TRUE'}]}}),/AST_CX_R3_W16_REALITY_RESPONSE_INVALID/);
const unmatchedBundle=await buildAstCustomerWorkspaceCandidate({canonicalProjection:fixture.inputProjection,locale:'zh-Hans',sourceMainCommit:baseline,realityComparison:{owner:'CX-R12R4B',items:[{themeRef:'AST:NOT:A:REAL:THEME',customerResponse:'OPEN'}]}});
assert.equal(unmatchedBundle.customerExperienceProjection.realityComparison.state,'NOT_BOUND');
assert.deepEqual(unmatchedBundle.customerExperienceProjection.realityComparison.unmatchedRefs,['AST:NOT:A:REAL:THEME']);

// Specialist renderer consumes the experience projection; browser source never executes astrology or semantic matching.
const renderPlan=renderAstrologyProduct({product});
assert.equal(renderPlan.status,'RENDERED');
assert.equal(renderPlan.compatibilityOnly,false);
const surfaceSource=text('assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js');
const experienceSource=text('functions/ast-full-production/ast-customer-experience-projection-v1.js');
assert.doesNotMatch(surfaceSource,/calculatePlanet|calculateHouse|calculateAspect|executeAst|buildAstWholeChart|buildAstProfessionalSemantic|semanticSimilarity|fuzzyMatch/i);
assert.doesNotMatch(experienceSource,/calculatePlanet|calculateHouse|calculateAspect|ephemerisAdapter|executeAstTransit|semanticSimilarity|fuzzyMatch/i);
assert.match(surfaceSource,/appendChild\?\.\(el\)/);
assert.match(surfaceSource,/data-astcx-jump-theme-owner/);

for(const [k,v] of Object.entries(x.governance)){
  if(k==='presentationProjectionOnly')assert.equal(v,true);
  else assert.equal(v,false,`experience governance ${k} must be false`);
}

const acceptance=json(`${base}/acceptance/ast-cx-r3-w13-w16-reading-experience-acceptance-v1.json`);
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED');
assert.equal(acceptance.baselineCommit,baseline);
assert.equal(acceptance.expectedFixtureCustomerExperienceSemanticDigest,x.semanticDigest);
assert.equal(acceptance.canonicalRealityBindingState,'NOT_BOUND_UNTIL_CX_R12R4B_HANDOFF_EXISTS');
assert.equal(acceptance.syntheticRealityBindingPassed,true);
assert.equal(acceptance.pprR3SharedFilesModified,0);
assert.equal(acceptance.sharedSingleMethodReadingModified,0);
assert.equal(acceptance.otherMethodFilesModified,0);
const manifest=json(`${base}/manifest/ast-cx-r3-w13-w16-manifest-v1.json`);
assert.equal(manifest.baselineCommit,baseline);
assert.equal(manifest.sequence.length,4);

console.log('✓ AST-CX-R3 W13–W16 passed: whole-chart reading is primary, each admitted narrative has one full owner, six governed intent lenses reorder without changing meaning, and Reality Comparison consumes only explicit CX-R12R4B handoff records.');
console.log(`  ${p.keyConfigurations.length} whole-chart themes / ${x.narrativeOwnership.fullExplanationOwnerCount} full narrative owners / ${x.intentLens.views.length} intent lenses; canonical reality state ${x.realityComparison.state}; synthetic bound reality records ${bx.realityComparison.items.length}.`);
console.log(`  Customer experience digest: ${x.semanticDigest}.`);
