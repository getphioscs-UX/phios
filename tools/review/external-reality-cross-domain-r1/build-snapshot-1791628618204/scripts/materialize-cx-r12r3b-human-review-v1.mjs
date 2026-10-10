import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  createMethodInterpretationInput,
  createMethodInterpretationCandidate,
  projectMethodGraph,
  stableRuntimeSnapshot
} from '../functions/interpretation-runtime/cx-r12r3b-shared-runtime-v2.js';
import {buildMethodMeaningPayloadV2} from '../functions/customer-projection/method-customer-reading-v2.js';
import {executeAndProjectAstV2} from '../functions/method-client-delivery/canonical-projection-runtime-ast-v2.js';

const BASE='content/customer-experience-rebuild';
const CAMPAIGN=`${BASE}/review/cx-r12r3b-96-case-human-review-campaign-v2.json`;
const OUT=`${BASE}/review/materialized/v1`;
const CANDIDATE_DIR=`${OUT}/candidates`;
const GRAPH_DIR=`${OUT}/graphs`;
const MANIFEST=`${OUT}/cx-r12r3b-human-review-materialization-manifest-v1.json`;
const REVIEW_HTML='tools/review/cx-r12r3b-human-review-materialized-v1.html';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,`${JSON.stringify(v,null,2)}\n`)};
const sha=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const campaign=read(CAMPAIGN);

const astFixture=read('content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json');
const speeds={Sun:1,Moon:13,Mercury:-.2,Venus:1.1,Mars:.5,Jupiter:.08,Saturn:.03,Uranus:.01,Neptune:.006,Pluto:.004};
const bodyNames=Object.keys(speeds);
const engine=Object.freeze({
  Body:Object.freeze(Object.fromEntries(bodyNames.map(x=>[x,x]))),
  MakeTime(date){const ut=(date.getTime()-Date.UTC(2000,0,1,12))/86400000;return {ut,tt:ut+64/86400,date}},
  GeoVector(body,date){const day=(date.getTime()-Date.UTC(1989,10,15,14,50))/86400000;return {x:1,y:0,z:0,_lon:((bodyNames.indexOf(body)*30+232.5)+(speeds[body]||.1)*day+360)%360,_lat:bodyNames.indexOf(body)*.1}},
  Ecliptic(v){return {elon:v._lon,elat:v._lat}},SearchSunLongitude(_longitude,start){return {date:start}},
  GeoMoonState(){return {x:1,y:0,z:0,vx:0,vy:1,vz:.1}},Rotation_EQJ_ECT(){return {}},RotateState(_rotation,state){return state}
});
const astRequest={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ASTROLOGY',methodVersion:'0.1.0',capability:'CALCULATION',purposeCode:'CX_R12R3B_PASS2A_REVIEW',canonicalInput:astFixture.input,executionParameters:{houseSystemCode:'PLACIDUS_V1'},consentRecordId:'CX-R12R3B-PASS2A',requestId:'CX-R12R3B-PASS2A-AST'};
const AST=(await executeAndProjectAstV2(astRequest,{astronomyModuleLoader:async()=>engine})).canonicalProjection;
const NUM=read('content/interpretation/integration/fixtures/numerology-projection.valid.json').fixture;
const BZR=read('content/professional/bzr-production/fixtures/bzr-canonical-projection.production.valid.json');

function buildZwrProjection(){
  const corpus=read('content/zi-wei-runtime/fixtures/zi-wei-validation-fixture-corpus-v1.json');
  const source=corpus.formulaFixtures?.[0]||corpus.calendarFixtures?.[0];
  const palaceCodes=['LIFE','SIBLINGS','SPOUSE','CHILDREN','WEALTH','HEALTH','TRAVEL','FRIENDS','CAREER','PROPERTY','FORTUNE','PARENTS'];
  const branches=['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'];
  const palaces=palaceCodes.map((code,index)=>({code,value:branches[index],rawValue:null,meta:{stem:index%2?'YI':'JIA',isLifePalace:index===0,isBodyPalace:index===6}}));
  const stars=[
    {code:'ZI_WEI',value:'ZI',rawValue:null,meta:{palaceCode:'LIFE',starClass:'MAIN'}},
    {code:'TIAN_FU',value:'SHEN',rawValue:null,meta:{palaceCode:'CAREER',starClass:'MAIN'}},
    {code:'ZUO_FU',value:'MAO',rawValue:null,meta:{palaceCode:'CHILDREN',starClass:'SUPPORT'}}
  ];
  const transformations=[{code:'HUA_LU',value:'ZI_WEI',rawValue:null,meta:{targetStarCode:'ZI_WEI',branch:'ZI',palaceCode:'LIFE',scope:'NATAL',schoolLabel:'CURRENT_FROZEN_POLICY'}}];
  return {schemaVersion:'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0',projectionId:'ZWRP-CXR12R3B-PASS2A-0001',method:{publicMethodCode:'ZI_WEI_PROJECTION',publicLabel:'Zi Wei',publicLabels:{en:'Zi Wei','zh-Hans':'紫微斗数'},version:'1.0.0',status:'PRODUCTION_BOUND_SCOPE'},calculation:{status:'COMPLETE',deterministic:true,values:[{code:'LIFE_PALACE',value:'ZI'}],structures:[{code:'ZI_WEI_PALACES',items:palaces},{code:'ZI_WEI_STARS',items:stars},{code:'ZI_WEI_TRANSFORMATIONS',items:transformations}],cycles:[],positions:[]},projection:{status:'COMPLETE',clientRenderable:true,productionResult:true},unknown:[],evidence:[{type:'REVIEW_FIXTURE_SOURCE',status:'AVAILABLE',reference:'content/zi-wei-runtime/fixtures/zi-wei-validation-fixture-corpus-v1.json',fixtureId:source?.fixtureId||null}],version:{projectionContractVersion:'ZWR-MCD-CANONICAL-PROJECTION-v1.0.0'},execution:{mpaDecision:{authorityOwner:'MPA',decision:'ELIGIBLE',dispatchAllowed:true}},interpretation:{included:false,meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false}};
}
const ZWR=buildZwrProjection();
const projections={AST,NUM,BZR,ZWR};

function structureItems(projection,groupCode){return projection.calculation?.structures?.find(x=>x.code===groupCode)?.items||[]}
function zwrSelectorMatch(projection,selector){
  if(selector?.operator!=='structure_item_code_match')return false;
  return structureItems(projection,selector.groupCode).some(x=>x.code===selector.code);
}
function buildZwrMeaningPayload(projection,locale){
  const ontology=read('content/zi-wei-runtime/meaning/zi-wei-meaning-ontology-v1.json');
  const mapping=read('content/zi-wei-runtime/meaning/zi-wei-meaning-mapping-v1.json');
  const localeAuthority=read('content/zi-wei-runtime/meaning/zi-wei-meaning-locale-v1.json');
  const ontologyByCode=new Map(ontology.items.map(x=>[x.meaningCode,x]));
  const localeByCode=new Map(localeAuthority.items.map(x=>[x.meaningCode,x.locales?.[locale]]));
  const applicable=mapping.mappings.filter(x=>x.productionEligible&&x.productionActivated&&zwrSelectorMatch(projection,x.selector));
  const items=applicable.map(m=>({meaningCode:m.targetMeaningCode,meaningVersion:m.targetMeaningVersion,status:'PRODUCTION',meaningType:m.meaningType,mappingLineage:{mappingCode:m.mappingCode,mappingVersion:m.mappingVersion},sourceProjectionRef:{projectionId:projection.projectionId,projectionSchemaVersion:projection.schemaVersion,publicMethodCode:'ZI_WEI_PROJECTION',selector:m.selector},sourceFields:m.sourceFields,semanticDigest:ontologyByCode.get(m.targetMeaningCode)?.semanticDigest||null}));
  const localeItems=items.map(item=>({meaningCode:item.meaningCode,label:localeByCode.get(item.meaningCode)?.label||ontologyByCode.get(item.meaningCode)?.label?.[locale]||null,definition:localeByCode.get(item.meaningCode)?.definition||ontologyByCode.get(item.meaningCode)?.definition?.[locale]||null}));
  return {meaningBundle:{schemaVersion:'PHI-OS-CANONICAL-MEANING-PRODUCTION-BUNDLE-v1.0.0',bundleCode:`CMP-ZWR-PASS2A-${sha(projection.projectionId).slice(0,12).toUpperCase()}`,status:'PRODUCTION',items},localeProjection:{schemaVersion:'PHI-OS-CANONICAL-MEANING-LOCALE-PROJECTION-v1.0.0',locale,items:localeItems},reviewMaterializer:{version:'CX-R12R3B-ZWR-REVIEW-MATERIALIZER-v1',cloudflareRuntimeMutated:false,jsonAuthoritiesReadDirectly:true}};
}
async function meaningFor(methodId,projection,locale){return methodId==='ZWR'?buildZwrMeaningPayload(projection,locale):buildMethodMeaningPayloadV2({canonicalProjection:projection,locale})}

function withoutMeaningCode(payload,meaningCode){
  const copy=structuredClone(payload);
  copy.meaningBundle.items=(copy.meaningBundle.items||[]).filter(x=>x.meaningCode!==meaningCode);
  copy.localeProjection.items=(copy.localeProjection.items||[]).filter(x=>x.meaningCode!==meaningCode);
  return copy;
}
function focusFor(caseRecord,candidate,graph){
  const index=Number(caseRecord.caseId.slice(-2))-1;
  const units=candidate.interpretationUnits||[];const nodes=graph.nodes||[];const edges=graph.edges||[];
  const primary=units.filter(x=>x.priority==='PRIMARY');
  const unitPool=primary.length?primary:units;
  const focusUnits=unitPool.length?[unitPool[index%unitPool.length]]:[];
  const focusNode=nodes.length?nodes[index%nodes.length]:null;
  const relationEdge=edges.length?edges[index%edges.length]:null;
  return {focusInterpretationUnitRefs:focusUnits.map(x=>x.interpretationUnitId),focusNodeRefs:focusNode?[focusNode.canonicalRef]:[],focusRelationRefs:relationEdge?[relationEdge.canonicalRelationRef]:[],scenario:caseRecord.scenario,caseType:caseRecord.caseType,variantMode:'REVIEW_LENS_OVER_GOVERNED_FIXED_PROJECTION',calculationVariantInvented:false};
}
function customerText(candidate){return (candidate.interpretationUnits||[]).flatMap(u=>[u.title,u.plainLanguageExplanation,u.structuralReason,u.relationContext,u.constructiveExpression,u.frictionExpression,...(u.observableSignals||[]),...(u.realityComparisonQuestions||[])]).join(' ')}
function languagePreflight(candidate){const text=customerText(candidate);return {internalPhraseFree:!/(PHI OS canonical|semantic slot|语义槽位|projection item|canonical item)/i.test(text),rawCodeFree:!/(\b(?:JIA|YI|BING|DING|GENG|XIN|REN|GUI|SHEN|CHEN)\b|结构项)/.test(text)} }

const manifestCases=[];const reviewHtmlCases=[];
for(const caseRecord of campaign.cases){
  const projection=projections[caseRecord.methodId];assert(projection,`projection missing ${caseRecord.methodId}`);
  const localized=[];let overallPreflight=true;let structureOnlyExpected=false;
  for(const locale of caseRecord.reviewLocales){
    let meaning=await meaningFor(caseRecord.methodId,projection,locale);
    const input=await createMethodInterpretationInput({canonicalProjection:projection,methodId:caseRecord.methodId,locale,requestedDepth:caseRecord.caseType==='LOCALE_ALIGNMENT'?'PROFESSIONAL':'STANDARD',availableContext:{reviewCaseId:caseRecord.caseId,scenario:caseRecord.scenario,reviewOnly:true},authorityState:{source:'CURRENT_PASS2A'}});
    if(caseRecord.caseType==='MISSING_DATA'&&caseRecord.scenario==='one meaning or rule unavailable'){
      structureOnlyExpected=true;
      const baselineCandidate=await createMethodInterpretationCandidate({input,meaningPayload:meaning});
      assert(baselineCandidate.interpretationUnits?.some(x=>x.meaningRefs?.length),'stress case requires at least one admitted meaning before withholding');
      meaning=structuredClone(meaning);
      meaning.meaningBundle.items=[];
      meaning.localeProjection.items=[];
      meaning.reviewAvailabilityOverride='REQUIRED_MEANING_UNAVAILABLE_FAIL_CLOSED';
    }
    const candidate=await createMethodInterpretationCandidate({input,meaningPayload:meaning});
    const graph=await projectMethodGraph({input,candidate,meaningPayload:meaning});
    const language=languagePreflight(candidate);
    const expectedStructureOnly=structureOnlyExpected;
    const preflight=expectedStructureOnly?(candidate.status==='STRUCTURE_ONLY'&&candidate.lifecycle.currentStage!=='COMPOSITION_SUPPORTED'):(candidate.validation.valid&&language.internalPhraseFree&&language.rawCodeFree&&candidate.interpretationUnits.length>0&&graph.nodes.length>0);
    overallPreflight&&=Boolean(preflight);
    const snapshot={schemaVersion:'PHI-OS-CX-R12R3B-HUMAN-REVIEW-CANDIDATE-SNAPSHOT-v1.0.0',caseId:caseRecord.caseId,methodId:caseRecord.methodId,locale,caseType:caseRecord.caseType,scenario:caseRecord.scenario,fixedInputRef:caseRecord.fixedInputRef,fixedVariant:caseRecord.fixedVariant,variantDisclosure:{mode:'REVIEW_LENS_OVER_GOVERNED_FIXED_PROJECTION',doesNotClaimDistinctCalculationUnlessFixtureDiffers:true},sourceReference:candidate.sourceReference,projectionDigest:candidate.projectionDigest,interpretationDigest:candidate.interpretationDigest,candidateId:candidate.candidateId,status:candidate.status,lifecycle:candidate.lifecycle,validation:candidate.validation,interpretationUnits:candidate.interpretationUnits,reviewFocus:focusFor(caseRecord,candidate,graph),languagePreflight:language,customerLanguageAuthority:meaning.customerLanguageAuthority||null,meaningSelection:{selectorBound:true,firstNSelectionForbidden:true},humanReview:{methodFidelityAccepted:null,customerClarityAccepted:null,reviewerRef:null,evidenceRef:null},customerPublishable:false};
    const graphSnapshot={schemaVersion:'PHI-OS-CX-R12R3B-HUMAN-REVIEW-GRAPH-SNAPSHOT-v1.0.0',caseId:caseRecord.caseId,methodId:caseRecord.methodId,locale,projectionDigest:graph.projectionDigest,graphDigest:graph.graphDigest,graphType:graph.graphType,houseSystemId:graph.houseSystemId||null,nodes:graph.nodes,edges:graph.edges,groups:graph.groups,overlays:graph.overlays,legend:graph.legend,textEquivalent:graph.textEquivalent,reviewFocus:snapshot.reviewFocus,customerInterpretationBindingsAccepted:false};
    localized.push({locale,snapshot,graphSnapshot,preflight,expectedStructureOnly});
  }
  const candidatePath=`${CANDIDATE_DIR}/${caseRecord.caseId}.json`;const graphPath=`${GRAPH_DIR}/${caseRecord.caseId}.json`;
  const candidateFile={schemaVersion:'PHI-OS-CX-R12R3B-HUMAN-REVIEW-CASE-v1.0.0',caseId:caseRecord.caseId,methodId:caseRecord.methodId,reviewLocales:caseRecord.reviewLocales,caseType:caseRecord.caseType,scenario:caseRecord.scenario,localized:localized.map(x=>x.snapshot),machinePreflightPassed:overallPreflight,reviewEligible:overallPreflight};
  const graphFile={schemaVersion:'PHI-OS-CX-R12R3B-HUMAN-REVIEW-GRAPH-CASE-v1.0.0',caseId:caseRecord.caseId,methodId:caseRecord.methodId,localized:localized.map(x=>x.graphSnapshot)};
  write(candidatePath,candidateFile);write(graphPath,graphFile);
  manifestCases.push({...caseRecord,candidateMaterialization:{state:'MATERIALIZED',candidateSnapshotRef:candidatePath,graphSnapshotRef:graphPath,projectionDigest:localized[0]?.snapshot.projectionDigest||null,interpretationDigest:localized[0]?.snapshot.interpretationDigest||null,machinePreflightPassed:overallPreflight},reviewEligible:overallPreflight,decision:overallPreflight?'READY_FOR_EXTERNAL_HUMAN_REVIEW':'PREFLIGHT_FAILED'});
  reviewHtmlCases.push({caseId:caseRecord.caseId,methodId:caseRecord.methodId,caseType:caseRecord.caseType,scenario:caseRecord.scenario,reviewEligible:overallPreflight,localized:localized.map(x=>({locale:x.locale,status:x.snapshot.status,validation:x.snapshot.validation,units:x.snapshot.interpretationUnits,focus:x.snapshot.reviewFocus,graph:{nodeCount:x.graphSnapshot.nodes.length,edgeCount:x.graphSnapshot.edges.length,legend:x.graphSnapshot.legend,table:x.graphSnapshot.textEquivalent}}))});
}
const materialized=manifestCases.filter(x=>x.candidateMaterialization.state==='MATERIALIZED').length;
const eligible=manifestCases.filter(x=>x.reviewEligible).length;
const manifest={schemaVersion:'PHI-OS-CX-R12R3B-HUMAN-REVIEW-MATERIALIZATION-MANIFEST-v1.0.0',work:'CX-R12R3B-PASS2A',baselineCommit:'0db5e11ed84829e28c5cd56244dab774059b3839',status:eligible===96?'96_CASE_REVIEW_PACK_MATERIALIZED':'MATERIALIZED_WITH_PREFLIGHT_FAILURES',campaignRef:CAMPAIGN,caseCount:96,materialized,reviewEligible:eligible,dualAccepted:0,humanAcceptanceFabricated:false,selectorRemediation:{firstNMeaningSelectionRemoved:true,selectorBoundMeaningSelectionRequired:true},customerLanguageAuthorityRef:`${BASE}/authority/cx-r12r3b-customer-language-authority-v1.json`,zwrReviewMaterializer:{cloudflareRuntimeMutated:false,directGovernedJsonAuthorityRead:true},cases:manifestCases};
write(MANIFEST,manifest);
const campaignV3={...campaign,schemaVersion:'PHI-OS-CX-R12R3B-HUMAN-REVIEW-CAMPAIGN-v3.0.0',successorOf:CAMPAIGN,historicalPredecessorMutated:false,baselineCommit:'0db5e11ed84829e28c5cd56244dab774059b3839',status:eligible===96?'MATERIALIZED_EXTERNAL_HUMAN_REVIEW_READY':'MATERIALIZED_PREFLIGHT_REMEDIATION_REQUIRED',currentTotals:{...campaign.currentTotals,materialized,reviewEligible:eligible,dualAccepted:0,pending:96},materializationManifestRef:MANIFEST,cases:manifestCases};
write(`${BASE}/review/cx-r12r3b-96-case-human-review-campaign-v3.json`,campaignV3);
const escaped=JSON.stringify(reviewHtmlCases).replaceAll('</','<\\/');
fs.writeFileSync(REVIEW_HTML,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CX-R12R3B · 96-case Human Review</title><style>body{font:16px/1.55 system-ui;margin:0;background:#f7f5ef;color:#171914}main{max-width:1120px;margin:auto;padding:28px}.case{background:white;border:1px solid #ddd8ca;border-radius:18px;padding:20px;margin:18px 0}.meta{color:#6a685f}.unit{border-top:1px solid #eee7da;padding-top:14px;margin-top:14px}.tag{display:inline-block;padding:3px 8px;border-radius:999px;background:#eef3ec;margin-right:6px}.review{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.review button{padding:12px;border:1px solid #bbb;border-radius:10px;background:#fafafa}.warn{background:#fff3cd;padding:10px;border-radius:10px}details{margin-top:10px}pre{white-space:pre-wrap;word-break:break-word;background:#f6f6f3;padding:12px;border-radius:10px}</style><main><h1>CX-R12R3B · 96-case Human Review</h1><p>This pack contains materialized candidate and graph snapshots. Review buttons are intentionally non-persistent in this static copy; record decisions in the governed results JSON after review.</p><div id="app"></div></main><script>const cases=${escaped};const esc=s=>String(s??'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));document.querySelector('#app').innerHTML=cases.map(c=>\`<section class="case"><h2>\${esc(c.caseId)} · \${esc(c.methodId)}</h2><p class="meta">\${esc(c.caseType)} · \${esc(c.scenario)} · \${c.reviewEligible?'Review eligible':'Preflight failed'}</p>\${c.localized.map(l=>\`<h3>\${esc(l.locale)}</h3>\${!l.validation.valid?\`<p class="warn">STRUCTURE_ONLY preflight: \${esc((l.validation.failures||[]).join(', '))}</p>\`:''}\${(l.units||[]).map(u=>\`<article class="unit"><strong>\${esc(u.title)}</strong><p>\${esc(u.plainLanguageExplanation)}</p><p><b>Why:</b> \${esc(u.structuralReason)}</p><p><b>Context:</b> \${esc(u.relationContext)}</p><p><b>Constructive:</b> \${esc(u.constructiveExpression)}</p><p><b>Friction:</b> \${esc(u.frictionExpression)}</p><p><b>Observe:</b> \${esc((u.observableSignals||[]).join(' '))}</p><p><b>Reality question:</b> \${esc((u.realityComparisonQuestions||[]).join(' '))}</p><details><summary>Evidence & refs</summary><pre>\${esc(JSON.stringify({projectionRefs:u.projectionRefs,meaningRefs:u.meaningRefs,ruleRefs:u.ruleRefs,sourceLineage:u.sourceLineage},null,2))}</pre></details></article>\`).join('')}<details><summary>Graph snapshot</summary><pre>\${esc(JSON.stringify(l.graph,null,2))}</pre></details>\`).join('')}<div class="review"><button type="button">Method Fidelity: review externally</button><button type="button">Customer Clarity: review externally</button></div></section>\`).join('');</script></html>`);
console.log(`Materialized ${materialized}/96 cases; reviewEligible=${eligible}/96`);
