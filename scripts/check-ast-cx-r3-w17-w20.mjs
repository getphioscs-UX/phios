import {assertPprR3GovernedPath,assertPprR3AstInputSuccessorIntegrity} from './ppr-r3-governed-successor-support.mjs';
import {resolveAstTargetContextInput} from '../functions/api/customer-personal-reality.js';
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
assertPprR3AstInputSuccessorIntegrity();
for(const [p,d] of Object.entries(pprFreeze.protectedConvergenceFiles))assertPprR3GovernedPath(p,d,'AST-CX-R3 protected PPR convergence');
for(const [p,d] of Object.entries(pprFreeze.sharedSingleMethodReadingFiles))assert.equal(sha(p),d,`AST-CX-R3 W17-W20 shared SMR drift: ${p}`);
for(const p of ['assets/customer-ui/js/personal-products/personal-product-renderers.js','assets/customer-ui/js/personal-products/specialist-renderer-host.js','assets/customer-ui/js/personal-products/specialist-renderer-registry.js','assets/customer-ui/surfaces/ppr-r3-specialist-host.css'])assert.equal(sha(p),pprFreeze.successorFiles[p],`AST-CX-R3 W17-W20 shared host drift: ${p}`);

const w17=json(`${base}/contracts/ast-cx-r3-w17-canonical-timing-reachability-contract-v1.json`);
const w18=json(`${base}/contracts/ast-cx-r3-w18-timing-activation-contract-v1.json`);
const w19=json(`${base}/contracts/ast-cx-r3-w19-technical-disclosure-contract-v1.json`);
const w20=json(`${base}/contracts/ast-cx-r3-w20-raw-code-elimination-contract-v1.json`);
const w17Resolution=json(`${base}/acceptance/ast-cx-r3-w17-shared-input-successor-resolution-v1.json`);
for(const [doc,work] of [[w17,'AST-CX-R3-W17'],[w18,'AST-CX-R3-W18'],[w19,'AST-CX-R3-W19'],[w20,'AST-CX-R3-W20']]){assert.equal(doc.workCode,work);assert.equal(doc.baselineCommit,baseline)}

// W17 — preserve the historical gate result, then prove the separately authorized PPR-R3 W10A successor resolves it.
const html=text('perspectives/personal/index.html');
const sharedUi=text('assets/customer-ui/js/surfaces/personal-reality.js');
const api=text('functions/api/customer-personal-reality.js');
const assembly=text('functions/personal-reality-product/product-assembly.js');
const astProduction=text('functions/ast-full-production/ast-customer-reading-production.js');
for(const name of ['astTargetDate','astTargetTime','astTargetTimezone','astTargetUtcOffsetAtTarget'])assert(html.includes(`name="${name}"`),`existing AST target field missing ${name}`);
assert.match(html,/data-cx-ast-target-input hidden/);
assert.match(sharedUi,/astTargetContext/);
assert.match(sharedUi,/const astTargetValues=\['astTargetDate','astTargetTime','astTargetTimezone','astTargetUtcOffsetAtTarget'\]/);
assert.match(sharedUi,/map\(name=>String\(fd\.get\(name\)/);
assert.match(api,/resolveAstTargetContextInput/);
assert.match(api,/astTargetContext/);
assert.match(assembly,/astTargetContext=null/);
assert.match(assembly,/targetContext:astTargetContext/);
assert.match(assembly,/consentRecordId/);
assert.match(astProduction,/targetContext=null/);
assert.match(astProduction,/if\(targetComplete\(targetContext\)\)/);
assert.equal(w17.currentFinding,'PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED'); // historical gate remains truthful
assert.equal(w18.canonicalCustomerActivationState,'BLOCKED_BY_W17_SHARED_INPUT_REACHABILITY'); // historical contract remains immutable
assert.equal(w17Resolution.status,'CANONICAL_TIMING_REACHABILITY_RESOLVED');
assert.equal(w17Resolution.historicalGateFinding,w17.currentFinding);
assert.equal(w17Resolution.currentReachability,'CANONICAL_AST_TARGET_CONTEXT_REACHABLE');
assert.equal(w17Resolution.w18.canonicalCustomerActivation,true);
assert.equal(w17Resolution.w18.liveBrowserHumanAcceptanceClaimedByThisSuccessor,false);
for(const value of Object.values(w17Resolution.boundaries))assert.equal(value,false);

// Shared API input normalization is explicit and fail-closed.
assert.equal(resolveAstTargetContextInput({},['astrology']),null);
assert.throws(()=>resolveAstTargetContextInput({astTargetContext:{targetDate:'2026-08-30'}},['astrology']),e=>e?.code==='AST_CX_R3_TARGET_CONTEXT_INCOMPLETE');
assert.throws(()=>resolveAstTargetContextInput({astTargetContext:{targetDate:'2026-08-30',targetTime:'09:30',targetTimezone:{iana:'NOT/A_ZONE',utcOffsetAtTarget:'+08:00'}}},['astrology']),e=>e?.code==='AST_CX_R3_TARGET_TIMEZONE_INVALID');
const normalizedTarget=resolveAstTargetContextInput({astTargetContext:{targetDate:'2026-08-30',targetTime:'09:30',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}}},['astrology']);
assert.deepEqual(normalizedTarget,{targetDate:'2026-08-30',targetTime:'09:30:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'}});

const fixture=json('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json');
const route=await buildPersonalRealityProductRoute({selectedKeys:['astrology'],results:[{ok:true,key:'astrology',spec:{methodCode:'ASTROLOGY'},canonicalProjection:fixture.inputProjection}],locale:'zh-Hans',intent:'work role direction'});
const product=route.primaryProduct,p=product.sourceProduct.customerProductProjection,x=product.sourceProduct.customerExperienceProjection;
assert.equal(p.timing.state,'UNAVAILABLE');
for(const cap of ['AST_TIMING_REACHABILITY_GATE','AST_TIMING_ACTIVATION_PRESENTATION','AST_TECHNICAL_DISCLOSURE','AST_RAW_CODE_ELIMINATION'])assert(product.specialistRenderer.capabilities.includes(cap),`missing W17-W20 capability ${cap}`);
const unavailableTiming=buildTimingActivationHtml(p);
assert.match(unavailableTiming,/本命读取已经准备好；当前激活尚未附加/);
assert.match(unavailableTiming,/不会从浏览器或服务器时钟自行推断/);
assert.doesNotMatch(unavailableTiming,/AST_TEMPORAL_AUTHORITY_NOT_SUPPLIED|PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED/);

// W17 successor executable witness: an accepted natal projection + the explicit target reaches the existing ASTT chain.
const acceptedTransitProjection=structuredClone(fixture.inputProjection);
acceptedTransitProjection.projection={...acceptedTransitProjection.projection,productionResult:true,clientRenderable:true};
acceptedTransitProjection.execution={...(acceptedTransitProjection.execution||{}),mpaDecision:{authorityOwner:'MPA',decision:'ELIGIBLE',dispatchAllowed:true}};
acceptedTransitProjection.evidence=[...(acceptedTransitProjection.evidence||[]),{type:'PRODUCTION_DISPATCH_AUTHORITY',status:'AVAILABLE'}];
const transitBodies=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
const transitLongitude={Sun:10,Moon:65,Mercury:120,Venus:180,Mars:90,Jupiter:240,Saturn:300,Uranus:45,Neptune:150,Pluto:330};
const astronomyWitness=Object.freeze({Body:Object.freeze(Object.fromEntries(transitBodies.map(name=>[name,name]))),MakeTime(date){return {ut:(date.valueOf()/86400000)-10957.5,tt:(date.valueOf()/86400000)-10957.4992}},GeoVector(body,date){return {x:1,y:0,z:0,body,date}},Ecliptic(vector){return {elon:transitLongitude[vector.body]??0,elat:0}},SearchSunLongitude(){return {date:new Date('2026-02-04T00:00:00Z')}}});
const liveTimedBundle=await buildAstCustomerWorkspaceCandidate({canonicalProjection:acceptedTransitProjection,rawIntent:'work role direction',locale:'zh-Hans',targetContext:normalizedTarget,consentRecordId:'AST-CX-R3-W17-SUCCESSOR-WITNESS',astronomyModuleLoader:async()=>astronomyWitness,sourceMainCommit:w17Resolution.sourceBaselineCommit});
assert.equal(liveTimedBundle.customerProductProjection.timing.state,'AVAILABLE');
assert.equal(liveTimedBundle.customerProductProjection.timing.owner,'ASTT_GOVERNED_TEMPORAL_READING_IR');
assert.equal(liveTimedBundle.temporalIR?.customerPublicationAllowed,true);
assert.ok(liveTimedBundle.astt?.projection?.projectionId?.startsWith('ASTT-'));

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
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED_WITH_CANONICAL_TIMING_ACTIVATION_BLOCKED'); // historical acceptance retained
assert.equal(acceptance.w17CanonicalReachability,'PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED');
assert.equal(acceptance.w18SpecialistPresentationReady,true);
assert.equal(acceptance.w18CanonicalCustomerActivation,false);
assert.equal(acceptance.w19TechnicalDisclosurePassed,true);
assert.equal(acceptance.w20RawCodeEliminationPassed,true);
assert.equal(acceptance.pprR3SharedFilesModified,0);
assert.equal(acceptance.sharedSingleMethodReadingModified,0);
assert.equal(acceptance.otherMethodFilesModified,0);
assert.equal(w17Resolution.boundaries.historicalAstW17GateRewritten,false);
assert.equal(w17Resolution.boundaries.historicalAstW18ContractRewritten,false);

console.log('✓ AST-CX-R3 W17-W20 passed: the historical W17 gate remains immutable, and authorized PPR-R3 W10A now carries explicit AST targetContext through the canonical route into the existing ASTT runtime.');
console.log('  W18 canonical timing is engineering-reachable only when all explicit target fields are supplied; natal-only remains fail-closed. W19/W20 remain passed; no new live-browser human acceptance is claimed.');
