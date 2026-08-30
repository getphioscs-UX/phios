import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildPersonalRealityProductRoute} from '../functions/personal-reality-product/product-assembly.js';
import {buildAstCustomerWorkspaceCandidate} from '../functions/ast-full-production/ast-customer-reading-production.js';
import {buildAstCustomerProductProjectionV3} from '../functions/ast-full-production/ast-customer-product-projection-v3.js';
import {AST_READER_LANGUAGE_REGISTRY} from '../functions/ast-full-production/ast-customer-reading-authority-v2.js';
import {buildAstrologySpecialistSurfaceV3,buildTimingActivationHtml,buildTechnicalDisclosureHtml} from '../assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='content/professional/ast-full-production/customer-product-v3';
const baseline='1189c0519f1c5e9376965324b6010c00c212a3a1';
const stripTechnical=html=>String(html||'').replace(/<details class="ast-cx-r3-technical"[\s\S]*?<\/details>/g,'');
const visibleText=html=>stripTechnical(html).replace(/<[^>]+>/g,' ').replace(/&(?:amp|lt|gt|quot|#039|nbsp);/g,' ').replace(/\s+/g,' ').trim();
globalThis.document={documentElement:{lang:'zh-Hans'}};

// Frozen PPR-R3 remains byte-stable. AST may report a shared input need; it may not edit the host from this ticket.
const pprFreeze=json('content/professional/personal-reality/r3/authority/ppr-r3-w10-successor-freeze-v1.json');
const currentBaselineExpectedAbsent=new Set(['assets/customer-ui/js/surfaces/single-method-reading.js']);for(const [p,d] of Object.entries(pprFreeze.protectedConvergenceFiles)){if(currentBaselineExpectedAbsent.has(p)){assert.equal(fs.existsSync(p),false,`AST-CX-R3 W17-W20 retired baseline path unexpectedly restored: ${p}`);continue}assert.equal(sha(p),d,`AST-CX-R3 W17-W20 protected PPR drift: ${p}`)};
for(const [p,d] of Object.entries(pprFreeze.sharedSingleMethodReadingFiles))assert.equal(sha(p),d,`AST-CX-R3 W17-W20 shared SMR drift: ${p}`);
for(const p of ['assets/customer-ui/js/personal-products/personal-product-renderers.js','assets/customer-ui/js/personal-products/specialist-renderer-host.js','assets/customer-ui/js/personal-products/specialist-renderer-registry.js','assets/customer-ui/surfaces/ppr-r3-specialist-host.css'])assert.equal(sha(p),pprFreeze.successorFiles[p],`AST-CX-R3 W17-W20 shared host drift: ${p}`);

const w17=json(`${base}/contracts/ast-cx-r3-w17-canonical-timing-reachability-contract-v1.json`);
const w18=json(`${base}/contracts/ast-cx-r3-w18-timing-activation-contract-v1.json`);
const w19=json(`${base}/contracts/ast-cx-r3-w19-technical-disclosure-contract-v1.json`);
const w20=json(`${base}/contracts/ast-cx-r3-w20-raw-code-elimination-contract-v1.json`);
for(const [doc,work] of [[w17,'AST-CX-R3-W17'],[w18,'AST-CX-R3-W18'],[w19,'AST-CX-R3-W19'],[w20,'AST-CX-R3-W20']]){assert.equal(doc.workCode,work);assert.equal(doc.baselineCommit,baseline)}

// W17 — real canonical route audit. Inputs exist in frozen HTML, but the frozen orchestrator/API/product assembly do not carry them into AST.
const html=text('perspectives/personal/index.html');
const sharedUi=text('assets/customer-ui/js/surfaces/personal-reality.js');
const api=text('functions/api/customer-personal-reality.js');
const assembly=text('functions/personal-reality-product/product-assembly.js');
const astProduction=text('functions/ast-full-production/ast-customer-reading-production.js');
for(const name of ['astTargetDate','astTargetTime','astTargetTimezone','astTargetUtcOffsetAtTarget'])assert(html.includes(`name="${name}"`),`existing AST target field missing ${name}`);
assert.match(html,/data-cx-ast-target-input hidden/);
assert.doesNotMatch(sharedUi,/astTargetContext/);
assert.doesNotMatch(sharedUi,/fd\.get\('astTargetDate'\)|fd\.get\("astTargetDate"\)/);
assert.doesNotMatch(api,/astTargetContext/);
assert.doesNotMatch(assembly,/astTargetContext/);
assert.match(assembly,/buildAstCustomerWorkspaceCandidate\(\{canonicalProjection:ast\.canonicalProjection,rawIntent:intent\|\|'',locale,sourceMainCommit:/);
assert.doesNotMatch(assembly,/buildAstCustomerWorkspaceCandidate\(\{[^}]*targetContext/s);
assert.match(astProduction,/targetContext=null/);
assert.match(astProduction,/if\(targetComplete\(targetContext\)\)/);
assert.equal(w17.currentFinding,'PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED');
assert.equal(w18.canonicalCustomerActivationState,'BLOCKED_BY_W17_SHARED_INPUT_REACHABILITY');

const fixture=json('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const route=await buildPersonalRealityProductRoute({selectedKeys:['astrology'],results:[{ok:true,key:'astrology',spec:{methodCode:'ASTROLOGY'},canonicalProjection:fixture.inputProjection}],locale:'zh-Hans',intent:'work role direction'});
const product=route.primaryProduct,p=product.sourceProduct.customerProductProjection,x=product.sourceProduct.customerExperienceProjection;
assert.equal(p.timing.state,'UNAVAILABLE');
for(const cap of ['AST_TIMING_REACHABILITY_GATE','AST_TIMING_ACTIVATION_PRESENTATION','AST_TECHNICAL_DISCLOSURE','AST_RAW_CODE_ELIMINATION'])assert(product.specialistRenderer.capabilities.includes(cap),`missing W17-W20 capability ${cap}`);
const unavailableTiming=buildTimingActivationHtml(p);
assert.match(unavailableTiming,/本命读取已经准备好；当前激活尚未附加/);
assert.match(unavailableTiming,/不会从浏览器或服务器时钟自行推断/);
assert.doesNotMatch(unavailableTiming,/AST_TEMPORAL_AUTHORITY_NOT_SUPPLIED|PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED/);

// W18 — specialist presentation is complete behind the gate. Use a governed temporal-IR-shaped synthetic witness; no renderer calculation is allowed.
const bundle=await buildAstCustomerWorkspaceCandidate({canonicalProjection:fixture.inputProjection,rawIntent:'work role direction',locale:'zh-Hans',sourceMainCommit:baseline});
const temporalIR={schemaVersion:'PHI-OS-AST-GOVERNED-TEMPORAL-READING-IR-v1.0.0',customerPublicationAllowed:true,targetContext:{targetDate:'2026-08-30',targetTime:'09:30:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}},items:[{itemType:'ASTT_RELATION',temporalClaimRef:'ASTT-W18:REL-1',readerText:'当前木星与本命太阳形成「低摩擦激活」。这是受治理的时间关系示例。',orbDegrees:1.2,sourceRefs:['ASTT-W18-REL-1']},{itemType:'ASTT_HOUSE_ACTIVATION',temporalClaimRef:'ASTT-W18:HOUSE-1',readerText:'当前土星经过本命第 6 宫。这是受治理的宫位激活示例。',sourceRefs:['ASTT-W18-HOUSE-1']}],boundary:{currentDynamicOnly:true,eventPredictionCreated:false,fortunePredictionCreated:false,goodBadScoreCreated:false,natalMeaningRewritten:false,serverCurrentTimeInferred:false,browserTimezoneInferred:false}};
const timed=await buildAstCustomerProductProjectionV3({canonicalProjection:fixture.inputProjection,professionalSemanticProjection:bundle.professionalSemanticProjection,synthesis:bundle.synthesis,reading:bundle.reading,intentResolution:bundle.intentResolution,languageRegistry:AST_READER_LANGUAGE_REGISTRY,temporalIR});
assert.equal(timed.timing.state,'AVAILABLE');
assert.equal(timed.timing.owner,'ASTT_GOVERNED_TEMPORAL_READING_IR');
assert.equal(timed.timing.items.length,2);
assert.equal(timed.timing.items[0].itemType,'ASTT_RELATION');
assert.equal(timed.timing.items[0].orbDegrees,1.2);
const availableTiming=buildTimingActivationHtml(timed);
assert.match(availableTiming,/本命 → 目标时刻 → 当前激活/);
assert.match(availableTiming,/2026-08-30/);
assert.match(availableTiming,/Asia\/Kuala_Lumpur/);
assert.match(availableTiming,/当前相位激活/);
assert.match(availableTiming,/当前宫位激活/);
assert.match(availableTiming,/容许度 1\.2°/);
assert.match(availableTiming,/不建立具体事件、诊断、结果或吉凶评分/);

// W19 — customer-safe rationale is visible; raw lineage is behind collapsed technical details.
const technical=buildTechnicalDisclosureHtml(p);
assert.match(technical,/为什么这样读/);
assert.match(technical,/受治理来源已保留/);
assert.match(technical,/人工获准意义已保留|受治理意义 lineage 已保留/);
assert.match(technical,/data-astcx-technical-details/);
assert.match(technical,/<details class="ast-cx-r3-technical"/);
assert.match(technical,/<code>/);
const beforeDetails=technical.split('<details class="ast-cx-r3-technical"')[0];
assert.doesNotMatch(beforeDetails,/PHI-OS-|AST-R4A|AST-R5|projectionId|semanticDigest|CUSTOMER_PUBLISHABLE/);
assert.equal(w19.rawTechnicalCodesAllowedOnlyInsideCollapsedTechnicalDetails,true);

// W20 — no raw enum/code tokens in default customer-visible prose. Technical details and data-* attributes remain auditable.
const plan=buildAstrologySpecialistSurfaceV3(p,x);
const fullHtml=[plan.navigationHtml,plan.visualHtml,plan.readingHtml,plan.technicalHtml].join('');
const customerText=visibleText(fullHtml);
for(const token of w20.defaultVisibleProhibitedTokens)assert.equal(customerText.includes(token),false,`raw token leaked into customer-visible prose: ${token}`);
assert.deepEqual([...new Set(customerText.match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g)||[])],[],`underscore enum leaked into visible prose`);
assert.match(plan.technicalHtml,/PHI-OS-|AST-R4A|AST-R5/); // retained only in the collapsed audit layer

const surfaceSource=text('assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js');
assert.doesNotMatch(surfaceSource,/executeAstTransitRequest|createAstronomyEngine|calculateBodies|fetch\(/);
assert.match(surfaceSource,/buildTimingActivationHtml/);
assert.match(surfaceSource,/buildTechnicalDisclosureHtml/);
const acceptance=json(`${base}/acceptance/ast-cx-r3-w17-w20-timing-technical-acceptance-v1.json`);
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED_WITH_CANONICAL_TIMING_ACTIVATION_BLOCKED');
assert.equal(acceptance.w17CanonicalReachability,'PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED');
assert.equal(acceptance.w18SpecialistPresentationReady,true);
assert.equal(acceptance.w18CanonicalCustomerActivation,false);
assert.equal(acceptance.w19TechnicalDisclosurePassed,true);
assert.equal(acceptance.w20RawCodeEliminationPassed,true);
assert.equal(acceptance.pprR3SharedFilesModified,0);
assert.equal(acceptance.sharedSingleMethodReadingModified,0);
assert.equal(acceptance.otherMethodFilesModified,0);

console.log('✓ AST-CX-R3 W17-W20 passed with one explicit boundary: W17 proves the frozen canonical PPR route does not yet carry AST targetContext, so W18 customer timing activation remains blocked rather than mutating PPR-R3.');
console.log('  W18 timing presentation is engineering-ready for admitted temporal IR; W19 technical disclosure is progressive; W20 customer-visible raw enum/code leakage is 0 for the governed fixture.');
