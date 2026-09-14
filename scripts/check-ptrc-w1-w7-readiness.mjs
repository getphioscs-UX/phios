import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPtrcAskRequestContract} from '../functions/_lib/ptrc-ask-contract.js';
import {adaptPtrcEvidence,buildPtrcRetrievalStages,evaluatePtrcKnowledgeQuality,filterPtrcSourcesByPolicy} from '../functions/_lib/ptrc-knowledge-quality.js';
import {classifyAsk2Consumption} from '../functions/ask2/ask2-consumption-runtime.js';
import {composeDeterministicKapAnswer} from '../functions/_lib/knowledge-answer-composition.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(text(p));
const baseline='dea330193d23033b77bb614a552007258e19456d';

// W1 — only approved R2 logo assets; deterministic role binding; no invented binary evidence.
const brand=json('content/production-truth/brand/ptrc-w1-brand-asset-registry-v1.json');
assert.equal(brand.baselineCommit,baseline);
assert.equal(brand.records.length,12);
const filenames=new Set(brand.records.map(x=>x.filename));
for(const f of ['PHIOS-APP-ICON-v1.svg','PHIOS-FAVICON-v1.svg','PHIOS-LOGO-PRIMARY-HORIZONTAL-v1.svg','PHIOS-LOGO-PRIMARY-MONO-LIGHT-v1.svg'])assert.ok(filenames.has(f));
const roles=Object.fromEntries(brand.roleBindings.map(x=>[x.role,x.assetId]));
assert.equal(roles.PRIMARY_HEADER,'LOGO-003');
assert.equal(roles.PRIMARY_HERO,'LOGO-003');
assert.equal(roles.FAVICON,'LOGO-011');
assert.equal(roles.APP_ICON,'LOGO-012');
assert.equal(brand.evidenceBoundary.checksumInvented,false);
assert.equal(brand.evidenceBoundary.dimensionsInvented,false);
assert.equal(brand.derivatives.rasterState,'BLOCKED_SOURCE_BYTES_NOT_PRESENT_IN_DB2');
const askHtml=text('knowledge/ask/index.html');
assert.match(askHtml,/data-cx-asset="LOGO-003"/);
assert.doesNotMatch(askHtml,/PHIOS-LOGO-MARK-v1\.png/);
assert.match(askHtml,/PHIOS-FAVICON-v1\.svg\?v=ptrc-w1-20260914/);
const publicShell=text('assets/js/public-shell.js');
assert.doesNotMatch(publicShell,/>Φ</);
const customerShell=text('assets/customer-ui/js/shell.js');
// The W1 registry above remains historical; the live shell follows its active successor.
const currentBrand=json('content/customer-experience-rebuild/authority/customer-brand-asset-authority-v4.json');
assert.equal(currentBrand.status,'ACTIVE_SURFACE_AWARE_CUSTOMER_BRAND_BINDING');
assert.equal(currentBrand.authorityBoundary.upstreamLogoRegistryMutated,false);
assert.ok(customerShell.includes(`data-cx-asset="${currentBrand.currentConsumers.publicHeaderLight}"`),'shell missing current canonical header');
assert.match(customerShell,/data-cx-asset="LOGO-010"/);
const manifest=json('site.webmanifest');
assert.equal(manifest.icons[0].type,'image/svg+xml');
assert.match(manifest.icons[0].src,/PHIOS-APP-ICON-v1\.svg/);

// W2 — the user question remains immutable while structured scope changes.
const q='青铜时代网络为什么容易出现系统性脆弱？';
const a=createPtrcAskRequestContract({q,locale:'zh-Hans',entryContext:{contextLabel:'Do not append me',retrievalScope:{scopeType:'CIVILIZATION_ATLAS',bookCode:'BOOK-5',partCode:'PART-12',activeLayer:'timeline',timeWindowId:'T03'}}});
const b=createPtrcAskRequestContract({q,locale:'zh-Hans',entryContext:{contextLabel:'Another label',retrievalScope:{scopeType:'CIVILIZATION_ATLAS',bookCode:'BOOK-5',partCode:'PART-12',activeLayer:'timeline',timeWindowId:'T04'}}});
assert.equal(a.question,q);assert.equal(b.question,q);assert.notDeepEqual(a.retrievalScope.atlasEntityIds,b.retrievalScope.atlasEntityIds);
assert.doesNotMatch(a.question,/append|label/i);
const unknown=createPtrcAskRequestContract({q:'What changed in this window?',locale:'en',entryContext:{retrievalScope:{scopeType:'CIVILIZATION_ATLAS',bookCode:'BOOK-5',partCode:'PART-12',activeLayer:'timeline',timeWindowId:'UNKNOWN-T99'}}});
assert.deepEqual(unknown.retrievalScope.atlasEntityIds,['UNKNOWN-T99']);
assert.doesNotMatch(unknown.question,/UNKNOWN-T99/);

// W3/W4 — Atlas first, typed evidence, broader-knowledge policy, and five-way gate.
const source=(id,body,extra={})=>({sourceId:id,sourceType:'CIVILIZATION_ATLAS_ENTITY',scopeMatch:true,text:body,bookCode:'BOOK-5',partCode:'PART-12',atlasLayer:'timeline',...extra});
const bundle={question:{text:q,locale:'zh-Hans'},sources:[source('ATLAS:timeline:T03','青铜时代网络高度连接，贸易与物资依赖形成系统性脆弱。',{atlasEntityId:'T03'}),source('ATLAS:EVIDENCE:E1','证据显示多个区域的连接与供应链断裂可能同步放大冲击。',{sourceType:'CIVILIZATION_ATLAS_EVIDENCE',atlasEntityId:'E1'})],retrievalChain:[{stage:'ATLAS_ENTITY',status:'MATCHED'},{stage:'ATLAS_EVIDENCE',status:'MATCHED'},{stage:'PART_12',status:'AUTHORIZED_FALLBACK'},{stage:'BROADER_KNOWLEDGE',status:'AUTHORIZED_FALLBACK'}]};
assert.equal(adaptPtrcEvidence(bundle,a).length,2);
assert.deepEqual(buildPtrcRetrievalStages(bundle,a).map(x=>x.stage),['ATLAS_ENTITY','ATLAS_EVIDENCE','PART_12','BROADER_KNOWLEDGE']);
const sufficient=evaluatePtrcKnowledgeQuality({bundle,contract:a});
assert.equal(sufficient.outcome,'SUFFICIENT');assert.equal(sufficient.longFormAllowed,true);
const partial=evaluatePtrcKnowledgeQuality({bundle:{...bundle,sources:bundle.sources.slice(0,1)},contract:a});
assert.equal(partial.outcome,'PARTIAL');assert.equal(partial.longFormAllowed,false);assert.equal(partial.shortSupportedAnswerAllowed,true);
const insufficient=evaluatePtrcKnowledgeQuality({bundle:{...bundle,sources:[source('X','完全不相关的烹饪内容',{scopeMatch:false})]},contract:createPtrcAskRequestContract({q:'How did industrial energy systems change production?',locale:'en'})});
assert.equal(insufficient.outcome,'INSUFFICIENT');assert.equal(insufficient.longFormAllowed,false);
const contradictory=evaluatePtrcKnowledgeQuality({bundle:{...bundle,sources:[...bundle.sources,source('C','青铜时代网络并不存在。',{contradiction:true})]},contract:a});
assert.equal(contradictory.outcome,'CONTRADICTORY');assert.equal(contradictory.unconditionalClaimAllowed,false);
const ambiguous=evaluatePtrcKnowledgeQuality({bundle:{...bundle,sources:[]},contract:createPtrcAskRequestContract({q:'这个？',locale:'zh-Hans'})});
assert.equal(ambiguous.outcome,'AMBIGUOUS');
const noBroader=filterPtrcSourcesByPolicy([...bundle.sources,{sourceId:'P',sourceType:'PUBLISHED_CANONICAL_ARTICLE',text:'broader'}],createPtrcAskRequestContract({q,locale:'zh-Hans',answerPolicy:{allowBroaderKnowledge:false},entryContext:{retrievalScope:{scopeType:'CIVILIZATION_ATLAS',bookCode:'BOOK-5',partCode:'PART-12',activeLayer:'timeline',timeWindowId:'T03'}}}));
assert.equal(noBroader.some(x=>x.sourceId==='P'),false);
const partialBundle={bundleId:'TEST-PARTIAL',question:{text:q,locale:'zh-Hans'},normalization:{hints:{containsPersonalContextHint:false}},sources:bundle.sources.slice(0,1),unknowns:[],nodeMatches:{primaryNodes:[],supportingNodes:[],relatedPublishedNodeCodes:[]},relationships:{mechanismFacets:[]}};
const partialAnswer=composeDeterministicKapAnswer({bundle:partialBundle,coverageDecision:{status:'PARTIAL_COVERAGE',answerCompositionEligible:false,shortSupportedAnswerEligible:true,ptrcQuality:partial},now:new Date('2026-09-14T00:00:00Z')});
assert.match(partialAnswer.content.directAnswer,/青铜时代网络/);assert.equal(partialAnswer.content.mechanism.length,0);assert.doesNotMatch(partialAnswer.content.directAnswer,/does not currently have enough/);

// W5 — production-shaped question regression: route, locale, intent and structured scope.
const regression=json('content/production-truth/ask/ptrc-w5-question-regression-v1.json');
assert.ok(regression.criticalCases.length>=20);
for(const c of regression.criticalCases){
  const body={q:c.question,locale:c.locale,...(c.entryContext?{entryContext:c.entryContext}:{})};
  const contract=createPtrcAskRequestContract(body);
  assert.equal(contract.intent,c.expectedIntent,`${c.id}: intent`);
  assert.equal(contract.locale,c.locale,`${c.id}: locale`);
  const route=classifyAsk2Consumption({question:contract.question,body}).mode;
  assert.equal(route,c.expectedMode,`${c.id}: route`);
  if(c.expectedScope){
    for(const [key,value] of Object.entries(c.expectedScope))assert.deepEqual(contract.retrievalScope[key],value,`${c.id}: scope ${key}`);
  }
}
assert.equal(regression.liveCanary.status,'PENDING_POST_DEPLOY');

// W6 — full-bleed responsive HTML/CSS/SVG and explicit experience states.
const ux=json('content/production-truth/ux/ptrc-w6-responsive-experience-v1.json');
assert.deepEqual(ux.viewports,['360x800','390x844','768x1024','1440x900','1920x1080']);
const css=text('assets/customer-ui/surfaces/contextual-ask.css');
assert.match(css,/full-bleed reconstruction/);assert.match(css,/100svh/);assert.match(css,/clamp\(/);
assert.match(text('assets/customer-ui/components.css'),/\.cx-button\s*\{[^}]*min-height:\s*var\(--cx-size-control-min\)/);
assert.match(text('assets/customer-ui/tokens.css'),/--cx-size-control-min:\s*2\.75rem/);
// The poster opts into animation only when reduced motion is not requested.
assert.match(css,/@media\(prefers-reduced-motion:no-preference\)\{\.cx-ask-poster__core\{animation:/);
const client=text('assets/customer-ui/js/surfaces/contextual-ask.js');
for(const state of ux.askStates)assert.match(client,new RegExp(`['\"]${state}['\"]`));
assert.match(client,/window\.addEventListener\('offline'/);assert.match(client,/aria-busy/);
assert.match(askHtml,/role="status" aria-live="polite"/);assert.match(askHtml,/<svg class="cx-ask-poster__network"/);

// W7 — machine readiness can pass while human approval remains explicitly pending.
const reviewHtml=text('tools/review/PTRC-W7-HUMAN-REVIEW.html');
const decision=json('tools/review/PTRC-W7-HUMAN-DECISION.json');
assert.match(reviewHtml,/Two distinct human reviewers/);assert.match(reviewHtml,/Download decision JSON/);
assert.equal(decision.status,'PENDING_TWO_REVIEWERS');assert.equal(decision.reviewers.length,0);

console.log('✓ PTRC-W1–W7 machine/readiness checks passed.');
console.log('  W1 approved R2 logo selection + favicon/app manifest binding: passed (raster byte derivatives explicitly evidence-blocked, not fabricated).');
console.log('  W2 structured question/scope separation: passed.');
console.log('  W3 Atlas → evidence → Part 12 → broader Knowledge trace/policy: passed.');
console.log('  W4 relevance/sufficiency/abstention five-way gate: passed.');
console.log(`  W5 offline production-shaped regression: ${regression.criticalCases.length}/${regression.criticalCases.length} passed; live canary remains post-deploy.`);
console.log('  W6 full-bleed responsive state contract: passed source-level machine acceptance.');
console.log('  W7 human acceptance harness: ready; final two-reviewer acceptance is intentionally still pending.');
