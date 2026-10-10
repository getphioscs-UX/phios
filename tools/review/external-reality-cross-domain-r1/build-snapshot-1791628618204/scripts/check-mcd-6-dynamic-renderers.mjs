import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {renderCanonicalMethodProjection,renderCrossMethodCanonicalComposition} from '../assets/js/method-client-delivery/dynamic-renderer-runtime.js';
import {NUM_MFIG_BINDINGS} from '../assets/js/method-client-delivery/renderers/numerology-renderer.js';
import {CROSS_METHOD_MFIG_BINDINGS} from '../assets/js/method-client-delivery/renderers/cross-method-renderer.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const contract=j('content/professional/method-client-delivery/contracts/mcd-6-visualization-authority-contract-v1.json');
const registry=j('content/professional/method-client-delivery/registries/mcd-6-dynamic-renderer-registry-v1.json');
const mfig=j('content/professional/method-client-delivery/registries/mcd-6-mfig-binding-registry-v1.json');
const hdrResolution=j('content/professional/method-client-delivery/resolutions/mcd-6-hdr-renderer-readiness-v1.json');
const acceptance=j('content/professional/method-client-delivery/acceptance/mcd-6-dynamic-renderer-acceptance-v1.json');
const mcd5Schema=j('content/professional/method-client-delivery/schemas/canonical-method-projection-v1.schema.json');
const crossSchema=j('content/professional/method-client-delivery/schemas/mcd-6-cross-method-composition-v1.schema.json');
const hdrFixture=j('content/professional/method-client-delivery/fixtures/hdr-validation-only-canonical-projection.renderer-fixture.v1.json');

assert.equal(contract.work,'MCD-6');
assert.equal(contract.baselineCommit,'2bd7fd80da907a53f5f4a0f5c0e2db0a87100a4e');
for(const key of ['rendererDoesNotCalculate','rendererDoesNotNormalize','rendererDoesNotInterpret','rendererDoesNotDecideMeaning','rendererDoesNotCreateRealityTruth','rendererDoesNotCreateProfessionalJudgment','rendererDoesNotGrantProduction','mpaRemainsProductionEligibilityAuthority','mcd5RemainsCanonicalProjectionAuthority']) assert.equal(contract.authority[key],true,key);
assert.equal(contract.crossMethod.rendererMayCompareMethodsToCreateClassification,false);
assert.equal(contract.crossMethod.rendererMayInferReading,false);
assert.equal(contract.hdr.rendererState,'VALIDATION_ONLY');
assert.equal(contract.hdr.productionDispatchBindingAllowed,false);
assert.equal(contract.hdr.realCustomerProductionResultAllowed,false);
for(const ref of Object.values(contract.predecessorEvidence)) assert.equal(sha(ref.path),ref.sha256,`MCD-5 predecessor drift: ${ref.path}`);

assert.deepEqual(registry.entries.map(x=>x.publicMethodCode),['ASTROLOGY_PROJECTION','BAZI_PROJECTION','NUMEROLOGY_PROJECTION','PERSONAL_RUNTIME_PROJECTION']);
assert.equal(registry.entries.at(-1).mode,'VALIDATION_ONLY');
assert.equal(registry.entries.at(-1).productionAllowed,false);
assert.equal(registry.crossMethod.sourceMethodValuesAccepted,false);
assert.equal(registry.rules.coreRuntimeImportAllowed,false);
assert.equal(registry.rules.aiCallAllowed,false);
assert.equal(registry.rules.unknownFillAllowed,false);
assert.equal(registry.rules.inputMutationAllowed,false);

assert.deepEqual(NUM_MFIG_BINDINGS,['MFIG-035','MFIG-036','MFIG-037','MFIG-038','MFIG-039','MFIG-040']);
assert.deepEqual(CROSS_METHOD_MFIG_BINDINGS,['MFIG-041','MFIG-042','MFIG-043','MFIG-044','MFIG-045','MFIG-046','MFIG-047','MFIG-048','MFIG-049','MFIG-050']);
assert.equal(mfig.status,'IDENTITY_RANGE_BOUND_SEMANTIC_TITLES_UNRESOLVED');
assert.equal(mfig.sourceBoundary.semanticNamesInventedByMcd6,false);

assert.equal(mcd5Schema.properties.method.properties.publicMethodCode.enum.includes('PERSONAL_RUNTIME_PROJECTION'),true);
assert.equal(mcd5Schema.properties.projection.properties.productionResult.type,'boolean');
assert.equal(crossSchema.authorityBoundary['x-renderer-must-not-compute-classification'],true);
function validateCanonical(c){
  if(c?.schemaVersion!=='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0') return false;
  if(!/^CMP-[A-F0-9]{24}$/.test(c.projectionId||'')) return false;
  if(!['ASTROLOGY_PROJECTION','BAZI_PROJECTION','NUMEROLOGY_PROJECTION','PERSONAL_RUNTIME_PROJECTION'].includes(c.method?.publicMethodCode)) return false;
  if(!Array.isArray(c.calculation?.values)||!Array.isArray(c.calculation?.structures)||!Array.isArray(c.calculation?.cycles)||!Array.isArray(c.calculation?.positions)) return false;
  if(!Array.isArray(c.unknown)||!Array.isArray(c.evidence)||c.evidence.length<6) return false;
  for(const k of ['methodRegistryVersion','runtimeVersion','adapterVersion','inputContractVersion','projectionContractVersion']) if(typeof c.version?.[k]!=='string'||!c.version[k]) return false;
  if(c.execution?.mpaDecision?.authorityOwner!=='MPA') return false;
  if(c.interpretation?.included!==false) return false;
  return true;
}
function validateCross(c){
  if(c?.schemaVersion!=='PHI-OS-MCD-6-CROSS-METHOD-COMPOSITION-v1.0.0') return false;
  if(!/^CMC-[A-Z0-9-]{8,}$/.test(c.compositionId||'')) return false;
  if(!Array.isArray(c.sourceProjectionRefs)||!Array.isArray(c.signals)||!Array.isArray(c.unknown)||!Array.isArray(c.evidence)||!Array.isArray(c.lineage)) return false;
  if(c.sourceProjectionRefs.some(x=>!/^CMP-[A-F0-9]{24}$/.test(x.projectionId||''))) return false;
  if(c.signals.some(x=>!['CONVERGENCE','DIVERGENCE','UNKNOWN'].includes(x.classification))) return false;
  return true;
}
const evidence=(extra=[])=>[
 {type:'INPUT_SOURCE',status:'AVAILABLE',sourceCode:'CANONICAL_BIRTH_INPUT_CLIENT_ENTRY',reference:'CanonicalBirthInput',version:'1.0.0',confidence:'HIGH'},
 {type:'TIMEZONE_SOURCE',status:'AVAILABLE',sourceCode:'PINNED_IANA_TZDB',reference:'Asia/Kuala_Lumpur',version:'2026c',confidence:'HIGH'},
 {type:'COORDINATES_SOURCE',status:'AVAILABLE',sourceCode:'CANONICAL_BIRTH_INPUT_CLIENT_ENTRY',reference:'COORDINATES_PRESENT',version:'1.0.0',confidence:'HIGH'},
 {type:'RULE_SOURCE',status:'AVAILABLE',sourceCode:'RENDERER_TEST_RULE',reference:'TEST_ONLY',version:'1.0.0',confidence:'HIGH'},
 {type:'CALCULATION_AUTHORITY',status:'AVAILABLE',sourceCode:'SHARED_CALCULATION_RUNTIME',reference:'CALC-TEST',version:'1.0.0',confidence:'HIGH'},
 {type:'RUNTIME_AUTHORITY',status:'AVAILABLE',sourceCode:'MCD_5',reference:'MCD_CANONICAL_PROJECTION_RUNTIME',version:'1.0.0',confidence:'HIGH'},
 {type:'PRODUCTION_DISPATCH_AUTHORITY',status:'AVAILABLE',sourceCode:'MPA',reference:'ELIGIBLE',version:'MCD-1-SUCCESSOR-v1.0.0',confidence:'HIGH'},...extra
];
const baseProjection=(methodCode,label,calculation,unknown=[],extraEvidence=[])=>({
 schemaVersion:'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0',projectionId:'CMP-ABCDEF0123456789ABCDEF01',
 method:{publicMethodCode:methodCode,publicLabel:label,publicLabels:{en:label,'zh-Hans':label},internalReference:{opaqueId:'MREF-0123456789ABCDEF',protected:true,rawIdentityExposed:false},version:'1.0.0',status:'PRODUCTION_BOUND_SCOPE',calculationMode:'DETERMINISTIC_BOUND_SCOPE'},
 calculation,projection:{contract:'CANONICAL_METHOD_PROJECTION',status:'COMPLETE',clientRenderable:true,productionResult:true,coreSchemaExposed:false,unknownDisclosureRequired:unknown.length>0},unknown,evidence:evidence(extraEvidence),
 version:{methodRegistryVersion:'2.0.0',runtimeVersion:'1.0.0',adapterVersion:'1.0.0',inputContractVersion:'1.0.0',projectionContractVersion:'1.0.0'},
 execution:{requestId:'REQ-MCD6-TEST',status:'EXECUTED_BOUND_SCOPE',mpaDecision:{authorityOwner:'MPA',decision:'ELIGIBLE',dispatchAllowed:true,state:'PRODUCTION_AUTHORITY_GRANTED_FOR_BOUND_SCOPE'},runtimeIdentity:'MCD_CANONICAL_PROJECTION_RUNTIME@1.0.0',executedAt:'2026-08-14T09:50:00.000Z'},
 interpretation:{included:false,principle:'CALCULATION_NOT_EQUAL_INTERPRETATION',meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false}
});

const ast=baseProjection('ASTROLOGY_PROJECTION','Astrology Projection',{
 status:'COMPLETE',deterministic:true,values:[{code:'PLANET_MERCURY_RETROGRADE',value:true,rawValue:null,reductionSteps:[],masterNumberPreserved:false,certainty:'DETERMINISTIC'}],coordinates:{latitude:3.14,longitude:101.69},
 structures:[
  {code:'HOUSE_CUSPS',items:[...Array(12)].map((_,i)=>({code:`HOUSE_${i+1}`,value:i*30,rawValue:null,meta:{house:i+1}}))},
  {code:'ASPECTS',items:[{code:'ASPECT_1',value:'TRINE',rawValue:null,meta:{fromCode:'PLANET_SUN',toCode:'PLANET_MOON',type:'TRINE',orb:1.2}}]}
 ],cycles:[],positions:[
  {code:'PLANET_SUN',value:12.5,unit:'degree',certainty:'DETERMINISTIC'},
  {code:'PLANET_MOON',value:132.5,unit:'degree',certainty:'DETERMINISTIC'},
  {code:'PLANET_MERCURY',value:14.2,unit:'degree',certainty:'DETERMINISTIC'}
 ]
});
assert.equal(validateCanonical(ast),true);
const astBefore=JSON.stringify(ast);const astRendered=renderCanonicalMethodProjection(ast,{locale:'en'});assert.equal(astRendered.status,'RENDERED');assert.match(astRendered.html,/mcd6-ast/);assert.match(astRendered.html,/HOUSE_1/);assert.match(astRendered.html,/TRINE/);assert.match(astRendered.accessibleText,/retrograde/);assert.equal(JSON.stringify(ast),astBefore,'AST renderer mutated canonical input');
const astNoLayers=structuredClone(ast);astNoLayers.calculation.structures=[];const astNoLayersOut=renderCanonicalMethodProjection(astNoLayers,{locale:'en'});assert.match(astNoLayersOut.html,/Houses.*not supplied/s);assert.match(astNoLayersOut.html,/Aspects not present/);
const astBlocked=structuredClone(ast);astBlocked.execution.mpaDecision.dispatchAllowed=false;assert.equal(renderCanonicalMethodProjection(astBlocked).status,'BLOCKED');

const bzrUnknown={code:'BIRTH_TIME_UNKNOWN_DEGRADED_SCOPE',category:'MISSING_INPUT',scope:'BIRTH_TIME',reasonCodes:['BZR_UNKNOWN_TIME_DEGRADE_TO_THREE_PILLARS'],rendererMustDisplay:true};
const bzr=baseProjection('BAZI_PROJECTION','Bazi Projection',{
 status:'PARTIAL',deterministic:true,values:[],coordinates:null,
 structures:[
  {code:'FOUR_PILLARS',items:['YEAR','MONTH','DAY','HOUR'].flatMap((p,i)=>[{code:`${p}_STEM`,value:`STEM_${i+1}`,rawValue:null,meta:{}},{code:`${p}_BRANCH`,value:`BRANCH_${i+1}`,rawValue:null,meta:{}}])},
  {code:'HIDDEN_STEMS',items:[{code:'YEAR_HIDDEN_1',value:'HIDDEN_A',rawValue:null,meta:{}}]},
  {code:'ELEMENT_DISTRIBUTION',items:[{code:'WOOD',value:2,rawValue:null,meta:{}}]},
  {code:'TEN_GOD_PROJECTION',items:[{code:'DAY_ROLE',value:'SECRET_TEN_GOD_VALUE',rawValue:null,meta:{}}]}
 ],cycles:[{code:'LUCK_CYCLE',value:'CYCLE_A',rawValue:null,startAge:8,endAge:17,cycleNumber:1,certainty:'DETERMINISTIC'}],positions:[]
},[bzrUnknown]);
bzr.projection.status='PARTIAL'; bzr.calculation.status='PARTIAL'; bzr.method.calculationMode='PARTIAL_DEFERRED';
assert.equal(validateCanonical(bzr),true);
const bzrOut=renderCanonicalMethodProjection(bzr,{locale:'en'});assert.equal(bzrOut.status,'RENDERED');assert.doesNotMatch(bzrOut.html,/data-pillar="HOUR"/);assert.match(bzrOut.html,/no synthetic hour pillar/i);assert.match(bzrOut.html,/data-authority="BLOCKED"/);assert.doesNotMatch(bzrOut.html,/SECRET_TEN_GOD_VALUE/);
const bzrAuthorized=structuredClone(bzr);bzrAuthorized.evidence.push({type:'RULE_SOURCE',status:'AVAILABLE',sourceCode:'BZR_TEN_GOD_AUTHORITY',reference:'TEN_GOD_PROJECTION_POLICY',version:'1.0.0',confidence:'HIGH'});const bzrAuthOut=renderCanonicalMethodProjection(bzrAuthorized);assert.match(bzrAuthOut.html,/data-authority="AUTHORIZED"/);assert.match(bzrAuthOut.html,/SECRET_TEN_GOD_VALUE/);

const num=baseProjection('NUMEROLOGY_PROJECTION','Numerology Projection',{
 status:'COMPLETE',deterministic:true,values:[
  {code:'LIFE_PATH',value:8,rawValue:35,reductionSteps:[3,5,8],masterNumberPreserved:false,certainty:'DETERMINISTIC'},
  {code:'BIRTHDAY_NUMBER',value:6,rawValue:15,reductionSteps:[1,5,6],masterNumberPreserved:false,certainty:'DETERMINISTIC'}
 ],coordinates:null,structures:[{code:'NUMBER_FACTS',items:[{code:'LIFE_PATH',value:8,rawValue:35,meta:{masterNumberPreserved:false}}]}],cycles:[{code:'PERSONAL_YEAR',value:5,rawValue:14,startAge:null,endAge:null,cycleNumber:null,certainty:'DETERMINISTIC'}],positions:[]
});
assert.equal(validateCanonical(num),true);const numOut=renderCanonicalMethodProjection(num,{locale:'en'});assert.match(numOut.html,/LIFE_PATH/);assert.match(numOut.html,/3<\/li><li>5<\/li><li>8/);assert.deepEqual(numOut.mfigBindings,NUM_MFIG_BINDINGS);assert.match(numOut.html,/Evidence/);assert.match(numOut.html,/Uncertainty/);assert.match(numOut.html,/Source/);

const cross={schemaVersion:'PHI-OS-MCD-6-CROSS-METHOD-COMPOSITION-v1.0.0',compositionId:'CMC-MCD6-TEST-001',sourceProjectionRefs:[
 {projectionId:'CMP-AAAAAAAAAAAAAAAAAAAAAAAA',publicMethodCode:'ASTROLOGY_PROJECTION'},
 {projectionId:'CMP-BBBBBBBBBBBBBBBBBBBBBBBB',publicMethodCode:'BAZI_PROJECTION'},
 {projectionId:'CMP-CCCCCCCCCCCCCCCCCCCCCCCC',publicMethodCode:'NUMEROLOGY_PROJECTION'}
],signals:[
 {signalId:'S1',classification:'CONVERGENCE',label:'Upstream convergence signal',detail:'Already classified upstream.',projectionRefs:['CMP-AAAAAAAAAAAAAAAAAAAAAAAA','CMP-BBBBBBBBBBBBBBBBBBBBBBBB'],evidenceRefs:['E1']},
 {signalId:'S2',classification:'DIVERGENCE',label:'Upstream divergence signal',detail:null,projectionRefs:['CMP-BBBBBBBBBBBBBBBBBBBBBBBB','CMP-CCCCCCCCCCCCCCCCCCCCCCCC'],evidenceRefs:['E2']},
 {signalId:'S3',classification:'UNKNOWN',label:'Upstream unknown signal',detail:null,projectionRefs:['CMP-AAAAAAAAAAAAAAAAAAAAAAAA'],evidenceRefs:[]}
],unknown:[{code:'CROSS_METHOD_UNRESOLVED','reason':'Upstream composition marked unresolved.'}],evidence:[{ref:'E1',label:'Upstream evidence',source:'MCD5'}],lineage:[{ref:'L1',label:'Composition lineage'}]};
assert.equal(validateCross(cross),true);const crossOut=renderCrossMethodCanonicalComposition(cross);assert.deepEqual(crossOut.mfigBindings,CROSS_METHOD_MFIG_BINDINGS);for(const cls of ['CONVERGENCE','DIVERGENCE','UNKNOWN'])assert.match(crossOut.html,new RegExp(cls));assert.equal('methodValues' in cross,false);assert.equal('ast' in cross,false);assert.equal('bzr' in cross,false);assert.equal('num' in cross,false);

assert.equal(validateCanonical(hdrFixture),true);const hdrProd=renderCanonicalMethodProjection(hdrFixture,{mode:'PRODUCTION'});assert.equal(hdrProd.status,'BLOCKED');assert.equal(hdrProd.reasonCode,'HDR_PRODUCTION_RENDERING_FORBIDDEN');const hdrVal=renderCanonicalMethodProjection(hdrFixture,{mode:'VALIDATION',validationFixture:true,locale:'zh-Hans'});assert.equal(hdrVal.status,'RENDERED_VALIDATION_ONLY');assert.match(hdrVal.html,/个人运行投射/);assert.doesNotMatch(hdrVal.html,/Human Design|HUMAN_DESIGN|\bHDR\b/);
assert.equal(hdrResolution.status,'VALIDATION_ONLY_PRODUCTION_BINDING_FORBIDDEN');assert.equal(hdrResolution.current.productionDispatchBinding,false);assert.equal(hdrResolution.current.realCustomerProductionResult,false);

const jsFiles=[
 'assets/js/method-client-delivery/dynamic-renderer-runtime.js','assets/js/method-client-delivery/renderers/renderer-core.js','assets/js/method-client-delivery/renderers/astrology-renderer.js','assets/js/method-client-delivery/renderers/bazi-renderer.js','assets/js/method-client-delivery/renderers/numerology-renderer.js','assets/js/method-client-delivery/renderers/cross-method-renderer.js','assets/js/method-client-delivery/renderers/hdr-validation-renderer.js'
];
const js=jsFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');assert.doesNotMatch(js,/core-method-runtime|method-runtime\/|adapter-registry-runtime|execution-runtime|canonical-projection-runtime/);assert.doesNotMatch(js,/openai|workersAI/i);assert.doesNotMatch(js,/fetch\s*\(/);
const css=fs.readFileSync('assets/css/method-client-delivery/dynamic-renderers.css','utf8');for(const marker of ['@media(max-width:48rem)','@media(max-width:30rem)','@media(forced-colors:active)','@media(prefers-reduced-motion:reduce)',':focus-visible'])assert.match(css,new RegExp(marker.replace(/[()]/g,'\\$&')));
const defined=new Set([...fs.readFileSync('assets/css/tokens.css','utf8').matchAll(/(--phi-[a-zA-Z0-9-]+)\s*:/g)].map(x=>x[1]));const used=new Set([...css.matchAll(/var\((--phi-[a-zA-Z0-9-]+)/g)].map(x=>x[1]));for(const token of used)assert.ok(defined.has(token),`Undefined PDS token used by MCD-6 CSS: ${token}`);

const pkg=j('package.json');assert.equal(pkg.scripts['check:mcd-6'],'node scripts/check-mcd-6-dynamic-renderers.mjs && node scripts/check-mcd-6-dynamic-renderer-freeze.mjs');assert.equal(pkg.scripts['check:mcd-renderer'],'npm run check:mcd-6');assert.equal(pkg.scripts['check:mcd'],'npm run check:mcd-production-authority && npm run check:mcd-2 && npm run check:mcd-3 && npm run check:mcd-4 && npm run check:mcd-5');assert.equal(pkg.scripts['check:mcd-through-6'],'npm run check:mcd && npm run check:mcd-6');
assert.equal(acceptance.status,'ACCEPTED_RENDERER_ONLY_MCD5_BOUND_MPA_GATED_MCD7_NOT_BOUND');assert.equal(acceptance.notActivated.mcd7PersonalRuntimeSurface,true);assert.equal(acceptance.notActivated.hdrProductionRenderer,true);

console.log('✓ MCD-6 Dynamic Renderers passed.');
console.log('  AST/BZR/NUM render only MCD-5 CanonicalMethodProjection data and require MPA dispatch evidence; absent layers stay absent/Unknown.');
console.log('  Cross-method classifications are upstream-owned; MCD-6 receives no source Method values to compare. HDR remains validation-only with controlled public naming and Production rendering blocked.');
