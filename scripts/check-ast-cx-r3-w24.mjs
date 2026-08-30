import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assertAstCxR3CurrentSharedBoundary} from './lib/ast-cx-r3-shared-boundary.mjs';
import {assertPprR4AstInputSuccessorIntegrity} from './ppr-r3-governed-successor-support.mjs';
import {methodInputExtension,registeredMethodInputExtensions,PPR_R4_METHOD_INPUT_REGISTRY_VERSION} from '../assets/customer-ui/js/personal-inputs/method-input-extension-registry.js';
import {serializeAstMethodInput,AST_INPUT_EXTENSION_ID} from '../assets/customer-ui/js/specialists/ast/input-extension.js';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const base='content/professional/ast-full-production/customer-product-v3';
const baseline='7c6126404fe8e257b44937a0149bf23c837c538f';
const campaignPath=`${base}/campaign/ast-cx-r3-w24-real-canonical-route-240-v1.json`;

assertAstCxR3CurrentSharedBoundary('AST-CX-R3 W24');
const {v2}=assertPprR4AstInputSuccessorIntegrity();
const contract=json(`${base}/contracts/ast-cx-r3-w24-real-canonical-route-machine-contract-v1.json`);
const campaign=json(campaignPath);
const acceptance=json(`${base}/acceptance/ast-cx-r3-w24-machine-acceptance-v1.json`);
const recert=json(`${base}/acceptance/ast-cx-r3-w17-current-reachability-recertification-7c61264-v1.json`);
const w10b=json('content/professional/personal-reality/r3/authority/ppr-r3-w10b-product-assembly-successor-reconciliation-v1.json');
const currentShared=json(`${base}/authority/ast-cx-r3-w24-current-shared-baseline-v1.json`);

for(const doc of [contract,campaign,acceptance,recert,w10b,v2])assert.equal(doc.integrationBaselineCommit||doc.baselineCommit,baseline);
assert.equal(contract.workCode,'AST-CX-R3-W24');
assert.equal(contract.status,'ACTIVE_MACHINE_CAMPAIGN_CONTRACT');
assert.equal(campaign.status,'MACHINE_ACCEPTED_240_OF_240');
assert.equal(acceptance.status,'MACHINE_ACCEPTED_240_OF_240');
assert.equal(acceptance.campaignRef,campaignPath);
assert.equal(acceptance.campaignDigest,campaign.campaignDigest);
assert.equal(campaign.campaignDigest,'80275c244eb093e8d0c2e9fc5dd73f008636bb1048e3b811228776aac3aa0d6f');
assert.deepEqual(campaign.canonicalPath,contract.canonicalPath);
assert.equal(currentShared.status,'CURRENT_MAIN_SHARED_BASELINE_RECONCILED_FOR_W24');

const s=campaign.summary;
assert.equal(s.requiredCaseCount,240);assert.equal(s.executedCaseCount,240);assert.equal(s.passed,240);assert.equal(s.failed,0);assert.equal(s.passRate,'240/240');
assert.equal(s.birthCases,10);assert.deepEqual(s.houseSystems,{PLACIDUS_V1:120,WHOLE_SIGN_V1:120});assert.deepEqual(s.locales,{en:120,'zh-Hans':120});
assert.deepEqual(s.intents,{OPEN:40,EXPRESSION:40,WORK:40,RELATIONSHIP:40,PRESSURE:40,DIRECTION:40});
assert.equal(s.timingAvailableCases,240);assert.equal(s.specialistRenderedCases,240);assert.equal(s.domParsedCases,240);assert.equal(s.rawCodeLeakCases,0);assert.equal(s.legacyPrimaryCases,0);assert.equal(s.duplicateThemeProseCases,0);assert.equal(s.deterministicReplayCases,12);assert.equal(s.deterministicReplayPassed,12);
assert.equal(campaign.cases.length,240);assert.equal(campaign.replay.length,12);

const ids=new Set(),births=new Set();let placidus=0,whole=0,en=0,zh=0,timing=0,specialist=0,dom=0;
const intentCounts={OPEN:0,EXPRESSION:0,WORK:0,RELATIONSHIP:0,PRESSURE:0,DIRECTION:0};
for(const c of campaign.cases){
 assert(!ids.has(c.caseId),`duplicate case id: ${c.caseId}`);ids.add(c.caseId);births.add(c.input.birthCase);
 assert.equal(c.api.status,200,`${c.caseId} API`);assert.equal(c.api.routeMode,'SINGLE_METHOD',`${c.caseId} route`);assert.equal(c.api.state,'CUSTOMER_PUBLISHABLE',`${c.caseId} publication`);
 assert.equal(c.renderer.rendererId,'PPR_R3_AST_PRODUCT_V1',`${c.caseId} renderer`);assert.equal(c.renderer.compatibilityOnly,false,`${c.caseId} compatibility`);
 assert.equal(c.projection.houseSystemId,c.input.houseSystem,`${c.caseId} house system`);assert.equal(c.projection.timingState,'AVAILABLE',`${c.caseId} timing`);assert(c.projection.timingItems>0,`${c.caseId} timing items`);
 assert(c.projection.themeCount>=3&&c.projection.themeCount<=5,`${c.caseId} theme count ${c.projection.themeCount}`);
 assert.equal(c.dom.parsed,true,`${c.caseId} DOM`);assert.equal(c.dom.rendererState,'SPECIALIST_RENDERED',`${c.caseId} DOM renderer`);assert.equal(c.dom.timingAvailable,true,`${c.caseId} DOM timing`);assert.equal(c.passed,true,`${c.caseId} pass flag`);
 assert.deepEqual(c.input.targetContext,campaign.timingResolution.targetContext,`${c.caseId} target context`);
 if(c.input.houseSystem==='PLACIDUS_V1')placidus++;else if(c.input.houseSystem==='WHOLE_SIGN_V1')whole++;else assert.fail(`${c.caseId} unknown house system`);
 if(c.input.locale==='en')en++;else if(c.input.locale==='zh-Hans')zh++;else assert.fail(`${c.caseId} unknown locale`);
 assert(Object.hasOwn(intentCounts,c.input.intentId),`${c.caseId} unknown intent`);intentCounts[c.input.intentId]++;
 timing++;specialist++;dom++;
}
assert.equal(births.size,10);assert.equal(placidus,120);assert.equal(whole,120);assert.equal(en,120);assert.equal(zh,120);assert.deepEqual(intentCounts,s.intents);assert.equal(timing,240);assert.equal(specialist,240);assert.equal(dom,240);
for(const r of campaign.replay){assert.equal(r.matched,true,`${r.caseId} replay`);assert.equal(r.volatileProjectionIdentityExpected,true,`${r.caseId} volatile identity rule`);assert.equal(r.customerHtmlDigest,r.replayCustomerHtmlDigest,`${r.caseId} customer replay digest`)}

assert.equal(campaign.dom.engine,'PYTHON_LXML_HTML_DOM');assert.equal(campaign.dom.casesParsed,240);assert.equal(campaign.dom.casesPassed,240);assert.equal(campaign.dom.casesFailed,0);assert.equal(campaign.dom.timingCasesPassed,240);assert.equal(campaign.dom.rawCodeLeakCases,0);assert.equal(campaign.dom.legacyPrimaryCases,0);assert.equal(campaign.dom.canonicalSpecialistPlanParsed,true);
assert.equal(campaign.timingResolution.historicalW17Finding,'PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED');assert.equal(campaign.timingResolution.currentVerdict,'CANONICAL_TIMING_REACHABILITY_RESOLVED_AND_PROVEN_240_OF_240');
assert.equal(recert.status,'CANONICAL_AST_TARGET_CONTEXT_REACHABILITY_RECERTIFIED');assert.equal(recert.historicalFinding,'PPR_R3_SHARED_INPUT_EXTENSION_REQUIRED');assert.equal(recert.historicalFindingRewritten,false);assert.deepEqual(recert.expectedW24Proof,{apiCases:240,timingAvailable:240});
assert.equal(w10b.status,'AUTHORIZED_CONCURRENT_SUCCESSOR_RECONCILIATION_IMPLEMENTED');assert.equal(w10b.w17Verdict,'CANONICAL_TIMING_REACHABILITY_RESOLVED_AND_RETAINED');
const assembly=text(w10b.reconciledFile.path);for(const token of w10b.reconciledFile.requiredAstTransport)assert(assembly.includes(token),`W10B AST token missing: ${token}`);for(const token of w10b.reconciledFile.requiredEcrMandala)assert(assembly.includes(token),`W10B ECR token missing: ${token}`);

assert.equal(PPR_R4_METHOD_INPUT_REGISTRY_VERSION,'PPR-R4-METHOD-INPUT-REGISTRY-v2.0.0');assert.equal(AST_INPUT_EXTENSION_ID,'PPR_R4_AST_INPUT_EXTENSION_V1');
const astExt=methodInputExtension('astrology');assert(astExt);assert.equal(astExt.extensionId,AST_INPUT_EXTENSION_ID);assert(registeredMethodInputExtensions().some(x=>x.methodKey==='bazi'));assert(registeredMethodInputExtensions().some(x=>x.methodKey==='astrology'));
assert.deepEqual(serializeAstMethodInput({}),{astTargetContext:null});
assert.throws(()=>serializeAstMethodInput({astCxTargetDate:'2026-08-30'}),/Astrology target context is all-or-nothing/);
const serialized=serializeAstMethodInput({astCxTargetDate:'2026-08-30',astCxTargetTime:'12:00',astCxTargetTimezone:'Asia/Kuala_Lumpur',astCxTargetUtcOffset:'+08:00'});
assert.deepEqual(serialized.astTargetContext,campaign.timingResolution.targetContext);assert.equal(v2.currentVerdict,'CANONICAL_AST_TARGET_CONTEXT_INPUT_RECONCILED');

for(const [key,value] of Object.entries(campaign.boundaries)){
 if(key==='pprSpecialistHostProtocolVerified')assert.equal(value,true);
 else if(key==='externalPlaceTimezoneResolversDeterministicFixtures')assert.equal(value,true);
 else assert.equal(value,false,`W24 boundary expected false: ${key}`);
}
assert.equal(acceptance.claims.realCustomerApiExecuted,true);assert.equal(acceptance.claims.realAstProductionExecuted,true);assert.equal(acceptance.claims.realAsttRuntimeExecuted,true);assert.equal(acceptance.claims.realPprProductRouterExecuted,true);assert.equal(acceptance.claims.approvedAstRendererResolved,true);assert.equal(acceptance.claims.astSpecialistMarkupParsedAsDom,true);assert.equal(acceptance.claims.pprR4AstInputSerializerMachineValidated,true);assert.equal(acceptance.claims.liveBrowserFormSubmissionExecuted,false);assert.equal(acceptance.claims.liveBrowserVisualAcceptance,false);assert.equal(acceptance.claims.humanVisualAcceptance,false);

console.log('✓ AST-CX-R3 W24 Real Canonical Route Machine Campaign passed 240/240.');
console.log('  10 birth cases × 2 house systems × 6 intent lenses × 2 locales; 240/240 governed ASTT timing AVAILABLE; 240/240 specialist DOM; 0 raw-code leaks; 0 legacy primary owners; 12/12 deterministic customer-DOM replays.');
console.log(`  W17 current verdict: ${campaign.timingResolution.currentVerdict}.`);
