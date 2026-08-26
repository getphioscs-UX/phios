import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  CX_R12R3B_LIFECYCLE,
  createCrossPerspectiveMap,
  createMethodInterpretationCandidate,
  createMethodInterpretationInput,
  projectMethodGraph,
  promoteAcceptedInterpretation,
  semanticEquality,
  stableRuntimeSnapshot
} from '../functions/interpretation-runtime/cx-r12r3b-shared-runtime-v2.js';
import {buildMethodMeaningPayloadV2,buildMethodCustomerDevelopmentResult} from '../functions/customer-projection/method-customer-reading-v2.js';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const text=path=>fs.readFileSync(path,'utf8');
const sha256=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const BASE='content/customer-experience-rebuild';
const authority=read(`${BASE}/authority/cx-r12r3b-current-authority-map-v1.json`);
const shared=read(`${BASE}/contracts/cx-r12r3b-shared-interpretation-contract-v1.json`);
const coverage=read(`${BASE}/registries/cx-r12r3b-meaning-source-coverage-v1.json`);
const themeRegistry=read(`${BASE}/registries/cx-r12r3b-shared-reality-theme-registry-v1.json`);
const graphContract=read(`${BASE}/contracts/cx-r12r3b-method-graph-customer-candidate-contract-v1.json`);
const review=read(`${BASE}/review/cx-r12r3b-96-case-human-review-campaign-v1.json`);
const acceptance=read(`${BASE}/acceptance/cx-r12r3b-machine-development-acceptance-v1.json`);
const adapters=read('content/interpretation/integration/method-interpretation-adapter-registry-v2.json');
const currentMcd7=read('content/professional/method-client-delivery/reconciliation/mcd-7-personal-runtime-result-surface-current-successor-v4.json');

assert.equal(authority.baselineCommit,'526547698894de0d33d09447aed0b93b83558114');
assert.equal(authority.noDuplicateDecisions.forbidden.length,8);
assert.equal(authority.methodScopeFreeze.AST.customerDefaultHouseSystemId,'PLACIDUS_V1');
assert.equal(authority.methodScopeFreeze.AST.supportedAlternativeHouseSystemId,'WHOLE_SIGN_V1');
assert.equal(authority.successorPlan.zeroSilentMutation,true);
assert.equal(sha256(currentMcd7.historicalFreeze.path),currentMcd7.historicalFreeze.sha256,'historical MCD-7 freeze artifact must remain byte-preserved');
assert(currentMcd7.exactAuthorityArtifacts.every(item=>sha256(item.path)===item.sha256),'current MCD-7 successor authority must match its governed digests');
assert.deepEqual(shared.lifecycle,CX_R12R3B_LIFECYCLE);
assert.equal(shared.atomicMeaningBoundary.atomicMeaningEqualsCustomerInterpretation,false);
assert.equal(shared.atomicMeaningBoundary.directAtomicPublicationForbidden,true);
assert.deepEqual(shared.interpretationUnit.primaryQualityFloor,['ONE_STRUCTURAL_REASON','ONE_RELATION_OR_CONTEXT','ONE_CONSTRUCTIVE_EXPRESSION','ONE_FRICTION_OR_ALTERNATIVE_EXPRESSION','ONE_OBSERVABLE_SIGNAL','ONE_REALITY_COMPARISON_QUESTION']);
assert.deepEqual(adapters.adapters.map(x=>x.methodId),['AST','NUM','BZR','ZWR']);
assert(adapters.adapters.every(x=>x.independentInterpretationAuthority===false));
assert.equal(adapters.boundaries.crossPerspectiveConsumesAcceptedInterpretationsOnly,true);
assert.equal(coverage.coverageMatrix.length,4);
assert(coverage.coverageMatrix.every(x=>x.compositionSupported&&x.humanReviewed===false&&x.customerPublishable===false));
assert.deepEqual(themeRegistry.themes,['AUTONOMY','RELATIONSHIP','STABILITY','CHANGE','EXPRESSION','RESPONSIBILITY','BOUNDARY','DIRECTION']);
assert.equal(themeRegistry.inputBoundary.requiresExactlyFourUniqueMethods,true);
assert.equal(themeRegistry.inputBoundary.rawMethodSymbolsForbidden,true);
assert(themeRegistry.projectionRules.every(x=>x.ruleRef&&x.relationTypes.length&&x.theme));
assert.equal(graphContract.rendererIntegration.parallelRendererKingdomCreated,false);
assert.deepEqual(graphContract.sharedResultSurface,['Overview','Graph','Structure','Patterns','Context','Reality Comparison','Technical Details']);
assert.equal(graphContract.acceptedHandoff.requiresMethodFidelityAccepted,true);
assert.equal(graphContract.acceptedHandoff.requiresCustomerClarityAccepted,true);

const workCoverage=new Set([...authority.workCoverage,...shared.workCoverage.filter(Number.isInteger),...graphContract.workCoverage,...review.workCoverage,...acceptance.workCoverage.filter(Number.isInteger)]);
for(let work=0;work<=60;work++)assert(workCoverage.has(work),`CX-R12R3B-W${work} missing from sequential work evidence`);

const fixture=read('content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json');
const speeds={Sun:1,Moon:13,Mercury:-.2,Venus:1.1,Mars:.5,Jupiter:.08,Saturn:.03,Uranus:.01,Neptune:.006,Pluto:.004};
const bodyNames=Object.keys(speeds);
const engine=Object.freeze({
  Body:Object.freeze(Object.fromEntries(bodyNames.map(x=>[x,x]))),
  MakeTime(date){const ut=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;return {ut,tt:ut+64/86400,date}},
  GeoVector(body,date){const day=(date.getTime()-Date.UTC(1989,10,15,14,50))/86400000;return {x:1,y:0,z:0,_lon:((bodyNames.indexOf(body)*30+232.5)+(speeds[body]||.1)*day+360)%360,_lat:bodyNames.indexOf(body)*.1}},
  Ecliptic(v){return {elon:v._lon,elat:v._lat}},SearchSunLongitude(_longitude,start){return {date:start}},
  GeoMoonState(){return {x:1,y:0,z:0,vx:0,vy:1,vz:.1}},Rotation_EQJ_ECT(){return {}},RotateState(_rotation,state){return state}
});
const astRequest=(houseSystemCode,requestId)=>({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'CX_R12R3B_ACCEPTANCE',canonicalInput:fixture.input,executionParameters:{houseSystemCode},consentRecordId:'CX-R12R3B-CONSENT',requestId});
const placidus=(await executeAndProjectAstV2(astRequest('PLACIDUS_V1','CX-R12R3B-AST-P'),{astronomyModuleLoader:async()=>engine})).canonicalProjection;
const wholeSign=(await executeAndProjectAstV2(astRequest('WHOLE_SIGN_V1','CX-R12R3B-AST-W'),{astronomyModuleLoader:async()=>engine})).canonicalProjection;
const num=read('content/interpretation/integration/fixtures/numerology-projection.valid.json').fixture;
const bzr=read('content/professional/bzr-production/fixtures/bzr-canonical-projection.production.valid.json');

function zwrFixture(){
  const palaceCodes=['LIFE','SIBLINGS','SPOUSE','CHILDREN','WEALTH','HEALTH','TRAVEL','FRIENDS','CAREER','PROPERTY','FORTUNE','PARENTS'];
  const branches=['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'];
  const palaces=palaceCodes.map((code,index)=>({code,value:branches[index],rawValue:null,meta:{stem:index%2?'YI':'JIA',isLifePalace:index===0,isBodyPalace:index===6}}));
  const stars=[
    {code:'ZI_WEI',value:'ZI',rawValue:null,meta:{palaceCode:'LIFE',starClass:'MAIN'}},
    {code:'TIAN_FU',value:'SHEN',rawValue:null,meta:{palaceCode:'CAREER',starClass:'MAIN'}},
    {code:'ZUO_FU',value:'MAO',rawValue:null,meta:{palaceCode:'CHILDREN',starClass:'SUPPORT'}}
  ];
  const transformations=[{code:'HUA_LU',value:'ZI_WEI',rawValue:null,meta:{targetStarCode:'ZI_WEI',branch:'ZI',palaceCode:'LIFE',scope:'NATAL',schoolLabel:'CURRENT_FROZEN_POLICY'}}];
  return {schemaVersion:'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0',projectionId:'ZWRP-CXR12R3BFIXTURE00000001',method:{publicMethodCode:'ZI_WEI_PROJECTION',publicLabel:'Zi Wei',publicLabels:{en:'Zi Wei','zh-Hans':'紫微斗数'},version:'1.0.0',status:'PRODUCTION_BOUND_SCOPE'},calculation:{status:'COMPLETE',deterministic:true,values:[{code:'LIFE_PALACE',value:'ZI'}],structures:[{code:'ZI_WEI_PALACES',items:palaces},{code:'ZI_WEI_STARS',items:stars},{code:'ZI_WEI_TRANSFORMATIONS',items:transformations}],cycles:[],positions:[]},projection:{status:'COMPLETE',clientRenderable:true,productionResult:true},unknown:[],evidence:[],version:{projectionContractVersion:'ZWR-MCD-CANONICAL-PROJECTION-v1.0.0'},execution:{mpaDecision:{authorityOwner:'MPA',decision:'ELIGIBLE',dispatchAllowed:true}},interpretation:{included:false,meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false}};
}
const zwr=zwrFixture();
function zwrMeaning(locale){
  const codes=['CM-ZWR-PALACE-LIFE','CM-ZWR-STAR-ZI_WEI','CM-ZWR-TRANSFORMATION-HUA_LU'];
  const definitions=locale==='zh-Hans'?['命宫是本次结构网络的一个核心领域。','紫微星的功能必须结合所在宫位阅读。','化禄表示已记录的结构运动，不构成事件事实。']:['The Life Palace is one central domain in this structural network.','The Zi Wei star function must be read with its palace placement.','Hua Lu marks a recorded structural movement and does not establish an event as fact.'];
  const items=codes.map((meaningCode,index)=>({meaningCode,meaningVersion:'1.0.0',status:'PRODUCTION',meaningType:'ATOMIC',mappingLineage:{mappingCode:`CX-ZWR-MAP-${index+1}`},sourceProjectionRef:{projectionId:zwr.projectionId}}));
  return {meaningBundle:{schemaVersion:'PHI-OS-CANONICAL-MEANING-PRODUCTION-BUNDLE-v1.0.0',bundleCode:'CMP-ZWR-CXR12R3B',status:'PRODUCTION',items},localeProjection:{schemaVersion:'PHI-OS-CANONICAL-MEANING-LOCALE-PROJECTION-v1.0.0',locale,items:codes.map((meaningCode,index)=>({meaningCode,label:locale==='zh-Hans'?`紫微意义 ${index+1}`:`Zi Wei meaning ${index+1}`,definition:definitions[index]}))}};
}

const projections={AST:placidus,NUM:num,BZR:bzr,ZWR:zwr};
const meaningFor=async(methodId,projection,locale)=>methodId==='ZWR'?zwrMeaning(locale):buildMethodMeaningPayloadV2({canonicalProjection:projection,locale});
const snapshots={};
for(const methodId of ['AST','NUM','BZR','ZWR']){
  const projection=projections[methodId];
  const meaningEn=await meaningFor(methodId,projection,'en');
  const inputEn=await createMethodInterpretationInput({canonicalProjection:projection,methodId,locale:'en',requestedDepth:'STANDARD',availableContext:{timing:'UPSTREAM_ONLY'},authorityState:{source:'CURRENT'}});
  const candidateEn=await createMethodInterpretationCandidate({input:inputEn,meaningPayload:meaningEn});
  const repeated=await createMethodInterpretationCandidate({input:inputEn,meaningPayload:meaningEn});
  assert.equal(candidateEn.validation.valid,true,`${methodId} candidate must validate: ${JSON.stringify(candidateEn.validation)}`);
  assert.equal(candidateEn.status,'HUMAN_REVIEW_REQUIRED');
  assert.equal(candidateEn.lifecycle.currentStage,'COMPOSITION_SUPPORTED');
  assert.equal(candidateEn.lifecycle.flags.HUMAN_REVIEWED,false);
  assert.equal(candidateEn.lifecycle.flags.CUSTOMER_PUBLISHABLE,false);
  assert.equal(candidateEn.atomicMeaningPublishedDirectly,false);
  assert.equal(candidateEn.interpretationDigest,repeated.interpretationDigest,`${methodId} interpretation determinism`);
  assert.equal(stableRuntimeSnapshot(candidateEn),stableRuntimeSnapshot(repeated),`${methodId} stable candidate snapshot`);
  assert(candidateEn.interpretationUnits.some(x=>x.priority==='PRIMARY'));
  for(const unit of candidateEn.interpretationUnits.filter(x=>x.priority==='PRIMARY')){
    assert(unit.structuralReason&&unit.relationContext&&unit.constructiveExpression&&unit.frictionExpression);
    assert(unit.observableSignals.length&&unit.realityComparisonQuestions.length);
    assert(unit.projectionRefs.length&&unit.meaningRefs.length&&unit.ruleRefs.length&&unit.sourceLineage.length);
  }
  const graph=await projectMethodGraph({input:inputEn,candidate:candidateEn});
  const graphRepeated=await projectMethodGraph({input:inputEn,candidate:candidateEn});
  assert.equal(graph.graphDigest,graphRepeated.graphDigest,`${methodId} graph determinism`);
  assert.equal(graph.projectionDigest,candidateEn.projectionDigest);
  assert(graph.nodes.length>0&&graph.edges.length>0,`${methodId} graph requires nodes and edges`);
  assert.equal(graph.rendererAuthorityCreated,false);
  assert.equal(graph.customerInterpretationBindingsAccepted,false);
  assert(graph.nodes.every(x=>x.canonicalRef&&x.localizedLabel&&Array.isArray(x.interpretationUnitRefs)));
  assert(graph.edges.every(x=>x.canonicalRelationRef&&x.sourceNodeId&&x.targetNodeId));
  const meaningZh=await meaningFor(methodId,projection,'zh-Hans');
  const inputZh=await createMethodInterpretationInput({canonicalProjection:projection,methodId,locale:'zh-Hans',requestedDepth:'PROFESSIONAL',availableContext:{timing:'UPSTREAM_ONLY'},authorityState:{source:'CURRENT'}});
  const candidateZh=await createMethodInterpretationCandidate({input:inputZh,meaningPayload:meaningZh});
  assert.equal(candidateZh.validation.valid,true,`${methodId} zh candidate must validate`);
  assert(semanticEquality(candidateEn,candidateZh),`${methodId} locale/depth must preserve semantic digest`);
  snapshots[methodId]={inputEn,candidateEn,graph};
}

assert.equal(snapshots.AST.candidateEn.houseSystemId,'PLACIDUS_V1');
assert.equal(snapshots.AST.graph.houseSystemId,'PLACIDUS_V1');
const wholeInput=await createMethodInterpretationInput({canonicalProjection:wholeSign,methodId:'AST',locale:'en'});
const wholeMeaning=await buildMethodMeaningPayloadV2({canonicalProjection:wholeSign,locale:'en'});
const wholeCandidate=await createMethodInterpretationCandidate({input:wholeInput,meaningPayload:wholeMeaning});
const wholeGraph=await projectMethodGraph({input:wholeInput,candidate:wholeCandidate});
assert.equal(wholeCandidate.houseSystemId,'WHOLE_SIGN_V1');
assert.equal(wholeGraph.houseSystemId,'WHOLE_SIGN_V1');
assert.notEqual(wholeCandidate.projectionDigest,snapshots.AST.candidateEn.projectionDigest,'house system change must change projection digest');
assert.notEqual(wholeGraph.graphDigest,snapshots.AST.graph.graphDigest,'house system change must change graph digest');

await assert.rejects(()=>createMethodInterpretationCandidate({input:{...snapshots.NUM.inputEn,temporaryFrontendValue:8},meaningPayload:awaitableNever()}),/CX_R12R3B_INTERPRETATION_INPUT_FIELD_FORBIDDEN/);
await assert.rejects(()=>promoteAcceptedInterpretation(snapshots.AST.candidateEn,{methodFidelityAccepted:true,customerClarityAccepted:true}),/CX_R12R3B_DUAL_HUMAN_ACCEPTANCE_EVIDENCE_REQUIRED/);
assert.throws(()=>createCrossPerspectiveMap([snapshots.AST.candidateEn,snapshots.BZR.candidateEn]),/CX_R12R3B_FOUR_ACCEPTED_METHOD_INTERPRETATIONS_REQUIRED/);
assert.throws(()=>createCrossPerspectiveMap([{rawSymbol:'Sun in Scorpio'},{rawSymbol:'Wu Chen'},{rawSymbol:'Life Path 8'},{rawSymbol:'Zi Wei Palace'}]),/CX_R12R3B_ACCEPTED_METHOD_INTERPRETATION_REQUIRED/);

assert.equal(review.caseCount,96);assert.equal(review.cases.length,96);assert.equal(review.status,'PREPARED_EXTERNAL_HUMAN_REVIEW_NOT_STARTED');
for(const methodId of ['AST','NUM','BZR','ZWR']){
  const cases=review.cases.filter(x=>x.methodId===methodId);assert.equal(cases.length,24);
  assert.deepEqual(Object.fromEntries(Object.entries(review.categoryCountsPerMethod).map(([type,count])=>[type,cases.filter(x=>x.caseType===type).length])),review.categoryCountsPerMethod);
}
assert(review.cases.every(x=>x.methodFidelityReview.methodFidelityAccepted===null&&x.customerClarityReview.customerClarityAccepted===null&&x.customerPublishable===false));
assert.equal(review.ordinaryReaderFiveMinuteTest.status,'NOT_RUN_EXTERNAL_EVIDENCE_REQUIRED');
assert.equal(review.ordinaryReaderFiveMinuteTest.questions.length,6);

const html=text('perspectives/personal/index.html'),client=text('assets/customer-ui/js/surfaces/personal-reality.js'),graphClient=text('assets/customer-ui/js/method-graph-v1.js'),css=text('assets/customer-ui/surfaces/personal-reality.css'),api=text('functions/api/customer-personal-reality.js');
for(const token of ['Overview','Graph','Structure','Patterns','Context','Reality Comparison','Technical Details'])assert(html.includes(token),`shared customer result surface missing ${token}`);
for(const token of ['cx-method-insight','cx-method-evidence','cx-method-alternative','cx-method-uncertainty','cx-method-observation','cx-method-technical-detail','cx-method-graph-panel'])assert(css.includes(`.${token}`)||graphClient.includes(token),`shared component missing ${token}`);
for(const token of ['<title','<desc','tabindex="0"','tableFallback','data-relation'])assert(graphClient.includes(token),`graph accessibility missing ${token}`);
assert(client.includes('renderMethodGraph'));assert(api.includes('buildMethodCustomerDevelopmentResult'));assert(api.includes('candidateResultsNotCustomerPublished:true'));
assert.equal(html.includes('legacy.css'),false);assert.equal(html.includes('DETERMINISTIC badge'),false);assert.equal(graphClient.includes('placeholder interpretation'),false);

const packageJson=read('package.json');
assert.equal(packageJson.scripts['check:cx-r12r3b'],'node scripts/check-cx-r12r3b-method-interpretation-layer.mjs');
const r12r4Aggregate=packageJson.scripts['check:cx-r12r4'];assert(typeof r12r4Aggregate==='string'&&r12r4Aggregate.startsWith('npm run check:cx-r12r3b &&'),'CX-R12R4 successor must preserve CX-R12R3B as its first aggregate gate');assert(packageJson.scripts.check.endsWith('&& npm run check:cx-r12r4'),'CX-R12R4 successor aggregate must be last in npm run check while preserving CX-R12R3B internally');
assert.equal(acceptance.claims.humanAccepted,false);assert.equal(acceptance.claims.liveBrowserAccepted,false);assert.equal(acceptance.claims.fullProduction,false);
assert.deepEqual(acceptance.requiredStopStates,['DEVELOPMENT_ACCEPTED','HUMAN_REVIEW_REQUIRED','LIVE_BROWSER_REQUIRED']);

console.log('✓ CX-R12R3B W0–W60 shared Method Interpretation Layer passed.');
console.log('  AST, NUM, BZR and ZWR remain independent calculation/projection perspectives and consume one shared composition, graph, validation and handoff successor.');
console.log('  96 fixed human-review cases are prepared; HUMAN_REVIEWED, CUSTOMER_PUBLISHABLE, LIVE_BROWSER_ACCEPTED and FULL_PRODUCTION remain false without external evidence.');

function awaitableNever(){return null;}
