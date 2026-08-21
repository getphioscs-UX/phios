import {sha256} from '../method-runtime/shared-calculation-runtime.js';
import {executeMcd4CurrentRequest} from './execution-runtime-current.js';

export const MCD5_CANONICAL_PROJECTION_SCHEMA_VERSION='PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0';
export const MCD5_CANONICAL_PROJECTION_RUNTIME_VERSION='1.0.0';
export const MCD5_CANONICAL_PROJECTION_RUNTIME_ID=`MCD_CANONICAL_PROJECTION_RUNTIME@${MCD5_CANONICAL_PROJECTION_RUNTIME_VERSION}`;
export const MCD5_CURRENT_PROJECTION_SUCCESSOR_VERSION='1.0.0';
const VERSIONS=Object.freeze({methodRegistryVersion:'2.0.0',runtimeVersion:'1.0.0',adapterVersion:'1.0.0',inputContractVersion:'1.0.0',projectionContractVersion:'1.0.0'});
const METHOD_META=Object.freeze({
  ASTROLOGY:Object.freeze({publicMethodCode:'ASTROLOGY_PROJECTION',labels:Object.freeze({en:'Astrology Projection','zh-Hans':'占星投射'})}),
  BAZI:Object.freeze({publicMethodCode:'BAZI_PROJECTION',labels:Object.freeze({en:'Bazi Projection','zh-Hans':'八字投射'})}),
  NUMEROLOGY:Object.freeze({publicMethodCode:'NUMEROLOGY_PROJECTION',labels:Object.freeze({en:'Numerology Projection','zh-Hans':'数字学投射'})})
});
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v)}return value}
function clone(value){return value===undefined?undefined:structuredClone(value)}
function uniq(items){return [...new Set(items.filter(Boolean))]}
function valueFact(code,value,{rawValue=null,reductionSteps=[],masterNumberPreserved=false,certainty='DETERMINISTIC'}={}){
  return Object.freeze({code,value,rawValue,reductionSteps:Object.freeze([...reductionSteps]),masterNumberPreserved,certainty});
}
function reduced(code,value){return valueFact(code,value?.reducedValue??null,{rawValue:value?.rawValue??null,reductionSteps:value?.reductionSteps||[],masterNumberPreserved:value?.masterNumberPreserved===true,certainty:value?'DETERMINISTIC':'UNAVAILABLE'})}
function methodMode(result){
  if(result.executionStatus==='EXECUTED_BOUND_SCOPE')return 'DETERMINISTIC_BOUND_SCOPE';
  if(result.executionStatus==='PARTIAL_EXECUTION')return 'PARTIAL_DEFERRED';
  return 'NOT_CALCULATED';
}
async function protectedMethodReference(request){return `MREF-${(await sha256(`${request.methodCode}@${request.methodVersion}`)).slice(0,16).toUpperCase()}`}
function projectionStatus(result){if(result.executionStatus==='EXECUTED_BOUND_SCOPE')return 'COMPLETE';if(result.executionStatus==='PARTIAL_EXECUTION')return 'PARTIAL';return 'BLOCKED_INPUT'}
function safeMpa(decision){return Object.freeze({authorityOwner:'MPA',decision:decision?.decision||'UNKNOWN',dispatchAllowed:decision?.dispatchAllowed===true,state:decision?.state||null})}
function unknown(code,category,scope,reasonCodes=[]){return Object.freeze({code,category,scope,reasonCodes:Object.freeze(uniq(reasonCodes)),rendererMustDisplay:true})}
function deriveUnknowns(result){
  const out=[]; const reasons=result.reasonCodes||[];
  const add=(code,category,scope,match)=>{const hits=reasons.filter(r=>match.includes(r));if(hits.length)out.push(unknown(code,category,scope,hits))};
  add('ASTRONOMY_CALCULATION_UNAVAILABLE','UNAVAILABLE_CALCULATION','ASTRONOMY_CONTEXT',['AST_GOVERNED_ASTRONOMY_ENGINE_ADAPTER_NOT_MATERIALIZED']);
  add('SOLAR_TERM_CALCULATION_UNAVAILABLE','UNAVAILABLE_CALCULATION','SOLAR_TERM_CONTEXT',['BZR_GOVERNED_SOLAR_TERM_RUNTIME_ADAPTER_NOT_MATERIALIZED']);
  add('BZR_SOLAR_CONTEXT_INCOMPLETE','MISSING_INPUT','BZR_SOLAR_CONTEXT',['BZR_EXACT_SOLAR_CONTEXT_REQUIRES_EXPLICIT_OFFSET_AND_COORDINATES','BZR_UNKNOWN_TIME_THREE_PILLARS_REQUIRES_EXPLICIT_UTC_OFFSET_FOR_BOUNDARY_CLASSIFICATION']);
  add('BZR_BOUNDARY_AMBIGUOUS_WITH_UNKNOWN_TIME','NOT_CALCULABLE_STATE','BZR_SOLAR_TERM_BOUNDARY',['BZR_UNKNOWN_TIME_SOLAR_TERM_BOUNDARY_AMBIGUOUS']);
  add('BZR_LUCK_CYCLE_NOT_CALCULATED','MISSING_INPUT','BZR_LUCK_CYCLE',['BZR_LUCK_CYCLE_TRADITIONAL_CALCULATION_SEX_NOT_SUPPLIED','BZR_LUCK_CYCLE_TRADITIONAL_CALCULATION_SEX_INVALID','BZR_LUCK_CYCLE_REQUIRES_KNOWN_BIRTH_TIME','BZR_LUCK_REFERENCE_JIE_OUTSIDE_CONTEXT']);
  add('BIRTH_TIME_UNKNOWN_DEGRADED_SCOPE','MISSING_INPUT','BIRTH_TIME',['BZR_UNKNOWN_TIME_DEGRADE_TO_THREE_PILLARS']);
  add('BIRTH_TIME_APPROXIMATE','UNCERTAIN_VALUE','BIRTH_TIME',['AST_APPROXIMATE_TIME_PRECISION_WARNING']);
  add('NUM_CYCLE_TARGET_DATE_NOT_SUPPLIED','NOT_CALCULABLE_STATE','NUM_CYCLE',['NUM_CYCLE_DEFERRED_TARGET_DATE_NOT_SUPPLIED']);
  add('NUM_CYCLE_TIMEZONE_CONTEXT_REQUIRED','MISSING_INPUT','NUM_CYCLE',['NUM_CYCLE_TIMEZONE_CONTEXT_REQUIRED']);
  for(const field of result.inputEvaluation?.missingFields||[]) out.push(unknown(`MISSING_${String(field).replaceAll('.','_').toUpperCase()}`,'MISSING_INPUT',String(field),reasons));
  if(result.executionStatus==='INPUT_BLOCKED' && out.length===0) out.push(unknown('CANONICAL_INPUT_NOT_CALCULABLE','NOT_CALCULABLE_STATE','CANONICAL_INPUT',reasons));
  return Object.freeze(out);
}
function mapNumCalculation(result){
  const core=result.partialExecution?.coreResults||[];
  const birth=core.find(x=>x.algorithmCode==='NUM_BIRTH_NUMBER_CALCULATION');
  const structure=core.find(x=>x.algorithmCode==='NUM_NUMBER_STRUCTURE_NORMALIZATION');
  const cycle=core.find(x=>x.algorithmCode==='NUM_DATE_AND_LIFE_STAGE_CYCLES');
  const values=[]; const structures=[]; const cycles=[];
  if(birth?.output?.numbers){
    const n=birth.output.numbers;
    values.push(reduced('LIFE_PATH',n.lifePath),reduced('BIRTHDAY_NUMBER',n.birthdayNumber),reduced('ATTITUDE_NUMBER',n.attitudeNumber),reduced('BIRTH_YEAR_NUMBER',n.birthYearNumber),reduced('BIRTH_MONTH_NUMBER',n.birthMonthNumber),reduced('BIRTH_DAY_NUMBER',n.birthDayNumber));
  }
  if(structure?.output){
    const s=structure.output;
    structures.push(Object.freeze({code:'NUMBER_FACTS',items:Object.freeze((s.numberFacts||[]).map(x=>Object.freeze({code:String(x.factCode||'').replace(/^NUM_/,''),value:x.reducedValue??null,rawValue:x.rawValue??null,meta:Object.freeze({masterNumberPreserved:x.masterNumberPreserved===true})})))}));
    structures.push(Object.freeze({code:'DIGIT_FREQUENCY',items:Object.freeze((s.digitFrequency||[]).map(x=>Object.freeze({code:`DIGIT_${x.digit}`,value:x.occurrenceCount??0,rawValue:null,meta:Object.freeze({absenceMeansDeficit:false})})))}));
    structures.push(Object.freeze({code:'MASTER_NUMBER_STATE',items:Object.freeze((s.masterNumberState||[]).map(x=>Object.freeze({code:`MASTER_${x.number}`,value:x.present===true,rawValue:null,meta:Object.freeze({})})))}));
  }
  if(cycle?.output){
    for(const [key,val] of Object.entries(cycle.output.calendarCycles||{})) cycles.push(Object.freeze({code:key.replace(/[A-Z]/g,m=>`_${m}`).toUpperCase(),value:val.reducedValue??null,rawValue:val.rawValue??null,startAge:null,endAge:null,cycleNumber:null,certainty:'DETERMINISTIC'}));
    for(const x of cycle.output.lifeStageCycles?.pinnacleCycles||[]) cycles.push(Object.freeze({code:'PINNACLE_CYCLE',value:x.number??null,rawValue:null,startAge:x.startAge??null,endAge:x.endAge??null,cycleNumber:x.cycleNumber??null,certainty:'DETERMINISTIC'}));
    for(const x of cycle.output.lifeStageCycles?.challengeCycles||[]) cycles.push(Object.freeze({code:'CHALLENGE_CYCLE',value:x.number??null,rawValue:null,startAge:x.startAge??null,endAge:x.endAge??null,cycleNumber:x.cycleNumber??null,certainty:'DETERMINISTIC'}));
  }
  return Object.freeze({status:result.executionStatus==='EXECUTED_BOUND_SCOPE'?'COMPLETE':result.executionStatus==='INPUT_BLOCKED'?'BLOCKED_INPUT':'PARTIAL',deterministic:core.length?true:null,values:Object.freeze(values),coordinates:null,structures:Object.freeze(structures),cycles:Object.freeze(cycles),positions:Object.freeze([])});
}

function mapAstCalculation(result){
  const core=result.partialExecution?.coreResults||[];
  const planet=core.find(x=>x.algorithmCode==='AST_PLANET_EPHEMERIS');
  const bodies=planet?.output?.bodies||[];
  const positions=bodies.map(x=>Object.freeze({code:x.bodyCode,value:x.longitude,rawValue:null,meta:Object.freeze({latitude:x.latitude,distanceAu:x.distanceAu,speedLongitudeDegreesPerDay:x.speedLongitudeDegreesPerDay,nodeType:x.nodeType})}));
  const values=bodies.map(x=>Object.freeze({code:`${x.bodyCode}_RETROGRADE`,value:x.retrograde===true,rawValue:null,reductionSteps:Object.freeze([]),masterNumberPreserved:false,certainty:'DETERMINISTIC'}));
  return Object.freeze({status:planet?'COMPLETE':result.executionStatus==='INPUT_BLOCKED'?'BLOCKED_INPUT':'PARTIAL',deterministic:planet?true:null,values:Object.freeze(values),coordinates:null,structures:Object.freeze([]),cycles:Object.freeze([]),positions:Object.freeze(positions)});
}
function mapBzrCalculation(result){
  const core=result.partialExecution?.coreResults||[];
  const pillars=core.find(x=>x.algorithmCode==='BZR_FOUR_PILLARS');
  const luck=core.find(x=>x.algorithmCode==='BZR_LUCK_CYCLE_SEQUENCE');
  const structures=[]; const cycles=[];
  if(pillars?.output){
    const items=[];
    for(const p of pillars.output.pillars||[]){items.push(Object.freeze({code:`${p.pillarType}_STEM`,value:p.stemCode,rawValue:null,meta:Object.freeze({sexagenaryIndex:p.sexagenaryIndex})}));items.push(Object.freeze({code:`${p.pillarType}_BRANCH`,value:p.branchCode,rawValue:null,meta:Object.freeze({sexagenaryIndex:p.sexagenaryIndex})}));}
    structures.push(Object.freeze({code:'FOUR_PILLARS',items:Object.freeze(items)}));
  }
  if(luck?.output){for(const c of luck.output.cycles||[])cycles.push(Object.freeze({code:'LUCK_CYCLE',value:`${c.pillar.stemCode}-${c.pillar.branchCode}`,rawValue:null,startAge:c.startAgeYears,endAge:c.endAgeYears,cycleNumber:c.cycleNumber,certainty:'DETERMINISTIC'}));}
  const degraded=(result.reasonCodes||[]).includes('BZR_UNKNOWN_TIME_DEGRADE_TO_THREE_PILLARS');
  return Object.freeze({status:pillars?(degraded?'PARTIAL':'COMPLETE'):result.executionStatus==='INPUT_BLOCKED'?'BLOCKED_INPUT':'PARTIAL',deterministic:pillars?true:null,values:Object.freeze([]),coordinates:null,structures:Object.freeze(structures),cycles:Object.freeze(cycles),positions:Object.freeze([])});
}

function emptyCalculation(result){return Object.freeze({status:result.executionStatus==='INPUT_BLOCKED'?'BLOCKED_INPUT':'PARTIAL',deterministic:null,values:Object.freeze([]),coordinates:null,structures:Object.freeze([]),cycles:Object.freeze([]),positions:Object.freeze([])})}
function evidence(request,result){
  const input=request.canonicalInput||{}; const tz=input.timezone||{}; const place=input.birthPlace||{}; const core=result.partialExecution?.coreResults||[];
  const items=[
    {type:'INPUT_SOURCE',status:input.inputVersion?'AVAILABLE':'UNAVAILABLE',sourceCode:input.inputVersion?'CANONICAL_BIRTH_INPUT_CLIENT_ENTRY':null,reference:input.inputVersion?'CanonicalBirthInput':null,version:input.inputVersion||null,confidence:input.inputVersion?'HIGH':'UNKNOWN'},
    {type:'TIMEZONE_SOURCE',status:tz.source&&tz.source!=='UNKNOWN'?'AVAILABLE':'UNAVAILABLE',sourceCode:tz.source&&tz.source!=='UNKNOWN'?tz.source:null,reference:tz.iana||null,version:tz.source==='PINNED_IANA_TZDB'?'2026c':null,confidence:tz.confidence||'UNKNOWN'},
    {type:'COORDINATES_SOURCE',status:Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)?'AVAILABLE':'UNAVAILABLE',sourceCode:Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)?'CANONICAL_BIRTH_INPUT_CLIENT_ENTRY':null,reference:Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)?'COORDINATES_PRESENT':null,version:input.inputVersion||null,confidence:Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)?'HIGH':'UNKNOWN'},
    {type:'RUNTIME_AUTHORITY',status:'AVAILABLE',sourceCode:'MCD_5',reference:'MCD_CANONICAL_PROJECTION_RUNTIME',version:MCD5_CANONICAL_PROJECTION_RUNTIME_VERSION,confidence:'HIGH'},
    {type:'PRODUCTION_DISPATCH_AUTHORITY',status:'AVAILABLE',sourceCode:'MPA',reference:result.mpaEvaluation?.decision||'UNKNOWN',version:'MCD-1-SUCCESSOR-v1.0.0',confidence:'HIGH'}
  ];
  if(core.length){
    for(const calc of core){items.push({type:'RULE_SOURCE',status:'AVAILABLE',sourceCode:calc.algorithmCode,reference:calc.algorithmCode,version:calc.algorithmVersion,confidence:'HIGH'});items.push({type:'CALCULATION_AUTHORITY',status:'AVAILABLE',sourceCode:'SHARED_CALCULATION_RUNTIME',reference:calc.calculationId,version:calc.runtimeVersion,confidence:'HIGH'});}
  }else{
    items.push({type:'RULE_SOURCE',status:'AVAILABLE',sourceCode:'MCD_4_EXECUTION_REASON_POLICY',reference:'MCD_4_REASON_CODES',version:'1.0.0',confidence:'HIGH'});
    items.push({type:'CALCULATION_AUTHORITY',status:'UNAVAILABLE',sourceCode:null,reference:null,version:null,confidence:'UNKNOWN'});
  }
  return Object.freeze(items.map(x=>Object.freeze(x)));
}
function assertVersions(version){for(const key of ['methodRegistryVersion','runtimeVersion','adapterVersion','inputContractVersion','projectionContractVersion'])if(typeof version[key]!=='string'||!version[key])throw Object.assign(new Error('MCD5_VERSION_INCOMPLETE_PRODUCTION_FORBIDDEN'),{code:'MCD5_VERSION_INCOMPLETE_PRODUCTION_FORBIDDEN'});}
function assertNoCoreLeak(value,path='$'){
  if(!value||typeof value!=='object')return;
  const forbidden=new Set(['output','inputRecordIds','referenceVersions','pluginCode','methodCode','productionEligible','stack','stackTrace','serverPath','modulePath']);
  for(const [key,child] of Object.entries(value)){if(forbidden.has(key))throw Object.assign(new Error(`MCD5_CORE_SCHEMA_LEAK:${path}.${key}`),{code:'MCD5_CORE_SCHEMA_LEAK'});assertNoCoreLeak(child,`${path}.${key}`)}
}
export async function buildCanonicalMethodProjectionCurrent(request,result,{executedAt=new Date().toISOString()}={}){
  if(!result?.mpaEvaluation||result.mpaEvaluation.authorityOwner!=='MPA'||result.mpaEvaluation.decision!=='ELIGIBLE'||result.mpaEvaluation.dispatchAllowed!==true) throw Object.assign(new Error('MCD5_REQUIRES_MPA_ELIGIBLE_EXECUTION'),{code:'MCD5_REQUIRES_MPA_ELIGIBLE_EXECUTION'});
  const meta=METHOD_META[request.methodCode]; if(!meta)throw Object.assign(new Error('MCD5_METHOD_PROJECTION_NOT_REGISTERED'),{code:'MCD5_METHOD_PROJECTION_NOT_REGISTERED'});
  assertVersions(VERSIONS);
  const unknowns=deriveUnknowns(result); const calc=request.methodCode==='NUMEROLOGY'?mapNumCalculation(result):request.methodCode==='ASTROLOGY'?mapAstCalculation(result):request.methodCode==='BAZI'?mapBzrCalculation(result):emptyCalculation(result); const status=calc.status==='COMPLETE'?'COMPLETE':calc.status==='PARTIAL'?'PARTIAL':projectionStatus(result);
  const publicLabel=meta.labels[request.canonicalInput?.locale]||null;
  const method=Object.freeze({publicMethodCode:meta.publicMethodCode,publicLabel,publicLabels:meta.labels,internalReference:Object.freeze({opaqueId:await protectedMethodReference(request),protected:true,rawIdentityExposed:false}),version:request.methodVersion,status:'PRODUCTION_BOUND_SCOPE',calculationMode:methodMode(result)});
  const projection=Object.freeze({contract:'CANONICAL_METHOD_PROJECTION',status,clientRenderable:true,productionResult:['COMPLETE','PARTIAL'].includes(status),coreSchemaExposed:false,unknownDisclosureRequired:unknowns.length>0});
  const base={schemaVersion:MCD5_CANONICAL_PROJECTION_SCHEMA_VERSION,method,calculation:calc,projection,unknown:unknowns,evidence:evidence(request,result),version:VERSIONS,execution:Object.freeze({requestId:request.requestId,status:result.executionStatus,mpaDecision:safeMpa(result.mpaEvaluation),runtimeIdentity:MCD5_CANONICAL_PROJECTION_RUNTIME_ID,executedAt}),interpretation:Object.freeze({included:false,principle:'CALCULATION_NOT_EQUAL_INTERPRETATION',meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false})};
  const projectionId=`CMP-${(await sha256({method:base.method.publicMethodCode,calculation:base.calculation,unknown:base.unknown,version:base.version,evidence:base.evidence.filter(x=>x.type==='RULE_SOURCE'||x.type==='CALCULATION_AUTHORITY')})).slice(0,24).toUpperCase()}`;
  const canonical=freeze({schemaVersion:base.schemaVersion,projectionId,...base}); assertNoCoreLeak(canonical); return canonical;
}
export async function executeAndProjectMcd5CurrentRequest(request,{astronomyModuleLoader}={}){
  const startedAt=new Date().toISOString();
  const execution=await executeMcd4CurrentRequest(request,{astronomyModuleLoader});
  if(execution.executionStatus==='BLOCKED_BY_MPA')return Object.freeze({execution,canonicalProjection:null,executedAt:startedAt});
  const canonicalProjection=await buildCanonicalMethodProjectionCurrent(request,execution,{executedAt:new Date().toISOString()});
  return Object.freeze({execution,canonicalProjection,executedAt:canonicalProjection.execution.executedAt});
}
