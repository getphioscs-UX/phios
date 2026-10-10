/** ASTA-W10 CanonicalMethodProjection v2 successor for AST calculation/projection scope only. */
import {sha256} from '../method-runtime/shared-calculation-runtime.js';
import {executeMcd4CurrentRequest} from './execution-runtime-current.js';
import {buildCanonicalMethodProjectionCurrent} from './canonical-projection-runtime-current.js';
import {createAstStructuralProductionRuntime} from '../ast-production/ast-structural-calculation-runtime.js';
import {ASTA_SCOPE_CODE,ASTA_DEFAULT_HOUSE_SYSTEM_CODE} from '../ast-production/ast-production-policy.js';

export const ASTA_CANONICAL_PROJECTION_SCHEMA_VERSION='PHI-OS-CANONICAL-METHOD-PROJECTION-v2.0.0';
export const ASTA_CANONICAL_PROJECTION_RUNTIME_VERSION='2.0.0';
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value;}
function unknownItem(code,category,scope,reasonCodes=[]){return Object.freeze({code,category,scope,reasonCodes:Object.freeze([...new Set(reasonCodes)]),rendererMustDisplay:true});}
function calcEvidence(result){return Object.freeze([{type:'RULE_SOURCE',status:'AVAILABLE',sourceCode:result.algorithmCode,reference:result.algorithmCode,version:result.algorithmVersion,confidence:'HIGH'},{type:'CALCULATION_AUTHORITY',status:'AVAILABLE',sourceCode:'SHARED_CALCULATION_RUNTIME',reference:result.calculationId,version:result.runtimeVersion,confidence:'HIGH'}]);}
function nodePositions(node){return node.output.positions.map(x=>Object.freeze({code:x.bodyCode,value:x.longitude,rawValue:null,meta:Object.freeze({latitude:null,distanceAu:null,speedLongitudeDegreesPerDay:null,nodeType:x.nodeType})}));}
function group(code,items){return Object.freeze({code,items:Object.freeze(items)});}
function structures(scope){
 const out=[];
 if(scope.house){
  const h=scope.house.output;
  out.push(group('ANGLES',[
   {code:'ASC',value:h.angles.ascendantLongitude,rawValue:null,meta:{anglePolicyCode:h.anglePolicyCode}},
   {code:'MC',value:h.angles.midheavenLongitude,rawValue:null,meta:{anglePolicyCode:h.anglePolicyCode}},
   {code:'DSC',value:h.angles.descendantLongitude,rawValue:null,meta:{anglePolicyCode:h.anglePolicyCode}},
   {code:'IC',value:h.angles.imumCoeliLongitude,rawValue:null,meta:{anglePolicyCode:h.anglePolicyCode}}
  ].map(freeze)));
  out.push(group('HOUSE_CUSPS',h.cusps.map(x=>freeze({code:`HOUSE_${x.houseNumber}`,value:x.longitude,rawValue:null,meta:{houseNumber:x.houseNumber,houseSystemCode:h.houseSystemCode}}))));
  out.push(group('HOUSE_PLACEMENTS',h.placements.map(x=>freeze({code:x.bodyCode,value:x.houseNumber,rawValue:null,meta:{houseNumber:x.houseNumber,houseSystemCode:h.houseSystemCode}}))));
 }
 const a=scope.aspects.output;
 out.push(group('ASPECTS',a.aspects.map((x,index)=>freeze({code:`ASPECT_${String(index+1).padStart(2,'0')}`,value:x.separationDegrees,rawValue:null,meta:{fromCode:x.fromCode,toCode:x.toCode,type:x.aspectCode,orb:x.orbDegrees,authorizedOrbDegrees:x.authorizedOrbDegrees,applyingState:x.applyingState,aspectSetCode:a.aspectSetCode}}))));
 return Object.freeze(out);
}
function assertBoundary(projection){
 if(projection.interpretation?.included!==false||projection.interpretation?.meaningAuthorityCreated!==false||projection.interpretation?.professionalJudgmentCreated!==false)throw Object.assign(new Error('ASTA_INTERPRETATION_BOUNDARY_VIOLATION'),{code:'ASTA_INTERPRETATION_BOUNDARY_VIOLATION'});
 const forbidden=new Set(['output','inputRecordIds','referenceVersions','pluginCode','professionalConclusion','fortunePrediction','destinyConclusion']);
 const walk=(v,path='$')=>{if(!v||typeof v!=='object')return;for(const [k,c] of Object.entries(v)){if(forbidden.has(k))throw Object.assign(new Error(`ASTA_CORE_SCHEMA_LEAK:${path}.${k}`),{code:'ASTA_CORE_SCHEMA_LEAK'});walk(c,`${path}.${k}`);}};walk(projection);
}
export async function executeAndProjectAstV2(request,{astronomyModuleLoader}={}){
 if(request?.methodCode!=='ASTROLOGY')throw Object.assign(new Error('ASTA_ASTROLOGY_REQUEST_REQUIRED'),{code:'ASTA_ASTROLOGY_REQUEST_REQUIRED'});
 const baseExecution=await executeMcd4CurrentRequest(request,{astronomyModuleLoader});
 if(baseExecution.executionStatus==='BLOCKED_BY_MPA')return Object.freeze({execution:baseExecution,canonicalProjection:null,executedAt:new Date().toISOString()});
 if(baseExecution.executionStatus==='INPUT_BLOCKED'){
  const base=await buildCanonicalMethodProjectionCurrent(request,baseExecution,{executedAt:new Date().toISOString()});
  return Object.freeze({execution:baseExecution,canonicalProjection:base,executedAt:base.execution.executedAt});
 }
 const base=await buildCanonicalMethodProjectionCurrent(request,baseExecution,{executedAt:new Date().toISOString()});
 const planetResult=baseExecution.partialExecution?.coreResults?.find(x=>x.algorithmCode==='AST_PLANET_EPHEMERIS');
 if(!planetResult?.output?.bodies?.length)throw Object.assign(new Error('ASTA_CORE10_RESULT_REQUIRED'),{code:'ASTA_CORE10_RESULT_REQUIRED'});
 const structuralRuntime=createAstStructuralProductionRuntime({astronomyModuleLoader});
 const houseSystemCode=request.executionParameters?.houseSystemCode||ASTA_DEFAULT_HOUSE_SYSTEM_CODE;
 const scope=await structuralRuntime.calculate({requestId:request.requestId,canonicalInput:request.canonicalInput,planetBodies:planetResult.output.bodies,houseSystemCode});
 const calculation=freeze({...base.calculation,status:scope.house?'COMPLETE':'PARTIAL',positions:Object.freeze([...base.calculation.positions,...nodePositions(scope.node)]),structures:structures(scope)});
 const unknowns=Object.freeze([...base.unknown,...(scope.house?[]:[unknownItem('AST_HOUSES_ANGLES_NOT_CALCULATED','MISSING_INPUT','AST_HOUSE_ANGLE_SCOPE',scope.reasonCodes)])]);
 const evidence=Object.freeze([...base.evidence,...calcEvidence(scope.node),...(scope.house?calcEvidence(scope.house):[]),...calcEvidence(scope.aspects)]);
 const version=freeze({...base.version,runtimeVersion:ASTA_CANONICAL_PROJECTION_RUNTIME_VERSION,adapterVersion:'2.0.0',projectionContractVersion:'2.0.0'});
 const execution=freeze({...base.execution,runtimeIdentity:`MCD_CANONICAL_PROJECTION_RUNTIME@${ASTA_CANONICAL_PROJECTION_RUNTIME_VERSION}`,astScope:ASTA_SCOPE_CODE});
 const projection=freeze({...base.projection,status:scope.house?'COMPLETE':'PARTIAL',productionResult:true,unknownDisclosureRequired:unknowns.length>0,scope:ASTA_SCOPE_CODE});
 const method=freeze({...base.method,status:'PRODUCTION_STRUCTURAL_SCOPE_V1'});
 const interpretation=freeze({included:false,principle:'CALCULATION_NOT_EQUAL_INTERPRETATION',meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false});
 const body={schemaVersion:ASTA_CANONICAL_PROJECTION_SCHEMA_VERSION,method,calculation,projection,unknown:unknowns,evidence,version,execution,interpretation};
 const projectionId=`CMP2-${(await sha256({method:method.publicMethodCode,calculation,unknown:unknowns,version,evidence:evidence.filter(x=>x.type==='RULE_SOURCE'||x.type==='CALCULATION_AUTHORITY')})).slice(0,24).toUpperCase()}`;
 const canonical=freeze({schemaVersion:body.schemaVersion,projectionId,...body});assertBoundary(canonical);
 const coreResults=Object.freeze([...baseExecution.partialExecution.coreResults,scope.node,...(scope.house?[scope.house]:[]),scope.aspects]);
 const executionV2=freeze({...baseExecution,executionStatus:scope.house?'EXECUTED_BOUND_SCOPE':'PARTIAL_EXECUTION',partialExecution:freeze({...baseExecution.partialExecution,executedStages:Object.freeze([...baseExecution.partialExecution.executedStages,'AST_TRUE_LUNAR_NODE','AST_MAJOR_ASPECTS',...(scope.house?['AST_ANGLES',`AST_${scope.house.output.houseSystemCode}_HOUSES`]:[])]),deferredStages:Object.freeze(scope.house?[]:['AST_ANGLES',`AST_${houseSystemCode}_HOUSES`]),coreResults}),reasonCodes:Object.freeze([...new Set([...baseExecution.reasonCodes,...scope.reasonCodes,'ASTA_STRUCTURAL_SCOPE_SUCCESSOR_EXECUTED'])])});
 return Object.freeze({execution:executionV2,canonicalProjection:canonical,executedAt:canonical.execution.executedAt});
}
