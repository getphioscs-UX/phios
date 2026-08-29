import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';
import {onRequestPost as runMethodExecute} from './method-execute.js';
import {onRequestPost as runAstStructuralExecute} from './ast-structural-execute.js';
import {onRequestPost as runZiWeiExecute} from './zi-wei-execute.js';
import {onRequestPost as runEcrExecute} from './ecr-execute.js';
import {projectMethodsForCustomer} from '../customer-projection/method-customer-projection.js';
import {projectAstrologyForCustomer} from '../customer-projection/astrology-customer-projection.js';
import {buildAstrologyCustomerReading} from '../customer-projection/astrology-customer-reading.js';
import {buildAcceptedMethodCustomerResult} from '../customer-projection/method-customer-reading-v2.js';
import {buildProductionMethodMeaningPayload} from '../canonical-meaning-production/api-method-meaning-handler.js';
import {buildNumerologyCustomerReadingEnvelope,projectNumerologyEnvelopeForCustomer} from '../customer-projection/numerology-customer-reading-envelope-v1.js';
import {maybeBuildProductionSingleMethodReading} from '../single-method-reading/single-method-reading-production.js';
import {maybeBuildProductionCombinedReading} from '../runtime-reading/cross-reading-production.js';
import {resolveBirthPlace} from '../location/place-resolver.js';
import {maybeBuildActiveAstCustomerWorkspace,getAstCustomerWorkspaceCapability} from '../ast-full-production/ast-customer-reading-production.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const clean=value=>String(value??'').trim();
const nullable=value=>clean(value)||null;
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const METHOD_ID=Object.freeze({ASTROLOGY:'AST',BAZI:'BZR',NUMEROLOGY:'NUM',ZI_WEI_DOU_SHU:'ZWR',EMBODIED_CONFIGURATION:'ECR'});
const METHOD_ID_BY_PUBLIC=Object.freeze({ASTROLOGY_PROJECTION:'AST',BAZI_PROJECTION:'BZR',NUMEROLOGY_PROJECTION:'NUM',ZI_WEI_PROJECTION:'ZWR',EMBODIED_CONFIGURATION_PROJECTION:'ECR'});
const METHODS=Object.freeze({
  astrology:{methodCode:'ASTROLOGY',methodVersion:'0.1.0',publicMethodCode:'ASTROLOGY_PROJECTION',label:{en:'Astrology',zh:'占星'},endpoint:'/api/ast-structural-execute'},
  bazi:{methodCode:'BAZI',methodVersion:'0.1.0',publicMethodCode:'BAZI_PROJECTION',label:{en:'BaZi',zh:'八字'},endpoint:'/api/method-execute'},
  numeric:{methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',publicMethodCode:'NUMEROLOGY_PROJECTION',label:{en:'Numerology',zh:'数字学'},endpoint:'/api/method-execute'},
  ziwei:{methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',publicMethodCode:'ZI_WEI_PROJECTION',label:{en:'Zi Wei',zh:'紫微斗数'},endpoint:'/api/zi-wei-execute'},
  ecr:{methodCode:'EMBODIED_CONFIGURATION',methodVersion:'1.0.0',publicMethodCode:'EMBODIED_CONFIGURATION_PROJECTION',label:{en:'Embodied Configuration',zh:'载体构型读取'},endpoint:'/api/ecr-execute'}
});

function canonicalInput(body,location,consentRecordId,locale){
  const hasTime=!body?.birthTimeUnknown&&Boolean(clean(body.birthTime));
  const birthPlace=location
    ?freeze({displayName:location.displayName,countryCode:location.countryCode,latitude:location.latitude,longitude:location.longitude})
    :freeze({displayName:null,countryCode:null,latitude:null,longitude:null});
  const timezone=location
    ?freeze({iana:location.timezone.iana,utcOffsetAtBirth:location.timezone.utcOffsetAtBirth,source:'GOVERNED_RESOLUTION',confidence:'HIGH'})
    :freeze({iana:null,utcOffsetAtBirth:null,source:'UNKNOWN',confidence:'UNKNOWN'});
  return freeze({
    birthDate:nullable(body.birthDate),
    birthTime:hasTime?`${clean(body.birthTime)}${clean(body.birthTime).length===5?':00':''}`:null,
    birthPlace,
    timezone,
    timeAccuracy:hasTime?'EXACT':'UNKNOWN',
    locale,
    consent:freeze({recordId:consentRecordId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'}),
    inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'
  });
}

function executionParameters(body){
  const traditional=clean(body?.traditionalCalculationSex).toUpperCase();
  const houseSystem=clean(body?.astrologyHouseSystem).toUpperCase();
  const targetDate=clean(body?.numerologyTargetDate);
  const out={};
  if(traditional==='MALE'||traditional==='FEMALE')out.traditionalCalculationSex=traditional;
  if(houseSystem==='WHOLE_SIGN_V1'||houseSystem==='PLACIDUS_V1')out.houseSystemCode=houseSystem;
  if(targetDate)out.targetDate=targetDate;
  return freeze(out);
}
function isoDate(value){const v=clean(value);if(!v)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return null;const d=new Date(`${v}T00:00:00.000Z`);return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===v?v:null}
function numerologyExpansionInput(body){
  const fullBirthName=clean(body?.numerologyFullBirthName);
  const targetDate=clean(body?.numerologyTargetDate);
  const comparisonBirthDate=clean(body?.numerologyComparisonBirthDate);
  const identityInput=fullBirthName?freeze({fullBirthName,customerConfirmed:body?.numerologyNameConfirmed===true,alphabetSystemId:'PYTHAGOREAN_LATIN_1_9_V1',nameNormalizationPolicy:'ASCII_LATIN_LETTERS_ONLY_V1'}):null;
  return freeze({birthDate:nullable(body?.birthDate),...(targetDate?{targetDate}:{}),...(identityInput?{identityInput}:{}),...(comparisonBirthDate?{relationship:freeze({comparisonBirthDate})}:{})});
}
function validateNumerologyExpansionRequest(body,selected){
  if(!selected.includes('numeric'))return null;
  const target=clean(body?.numerologyTargetDate),comparison=clean(body?.numerologyComparisonBirthDate),name=clean(body?.numerologyFullBirthName);
  if(target&&!isoDate(target))return 'NUM_CX_TARGET_DATE_INVALID';
  if(comparison&&!isoDate(comparison))return 'NUM_CX_COMPARISON_BIRTH_DATE_INVALID';
  if(body?.numerologyNameConfirmed===true&&!name)return 'NUM_CX_CONFIRMED_NAME_REQUIRED';
  return null;
}

function methodLabel(spec,locale){return spec.label[locale==='zh-Hans'?'zh':'en']}

function astTargetContext(body){
  const date=clean(body?.astTargetDate),time=clean(body?.astTargetTime),iana=clean(body?.astTargetTimezone),offset=clean(body?.astTargetUtcOffsetAtTarget),values=[date,time,iana,offset];
  if(values.every(x=>!x))return null;
  if(values.some(x=>!x)){const e=new Error('AST_TARGET_CONTEXT_INCOMPLETE');e.code='AST_TARGET_CONTEXT_INCOMPLETE';throw e;}
  return freeze({targetDate:date,targetTime:time.length===5?`${time}:00`:time,targetTimezone:freeze({iana,utcOffsetAtTarget:offset})});
}

function limitedReadingMethod(spec,locale,error,projection=null){
  const message=locale==='zh-Hans'
    ?'这次没有形成足够完整、可面向客户发布的解释。已建立的结构会保留，但系统不会自行补写意义。'
    :'This run did not produce a complete customer-publishable explanation. Established structure remains available, and no meaning will be invented to fill the gap.';
  return freeze({
    schemaVersion:'PHI-OS-CX-R12R4B-CUSTOMER-READING-METHOD-v1.0.0',
    methodId:METHOD_ID[spec.methodCode],
    methodLabel:methodLabel(spec,locale),
    locale,
    state:'NEEDS_ATTENTION',
    stateLabel:locale==='zh-Hans'?'还需要资料':'Needs more information',
    summary:message,
    insights:[],
    visualModel:null,
    source:{label:locale==='zh-Hans'?'尚未形成可发布解释':'No publishable interpretation yet',lineageAvailable:Boolean(projection?.projectionId)},
    openQuestions:[message],
    technical:{
      methodId:METHOD_ID[spec.methodCode],
      publicMethodCode:spec.publicMethodCode,
      projectionId:projection?.projectionId||null,
      reasonCode:error?.code||'CX_R12R4B_COMPOSITION_UNAVAILABLE',
      constraints:error?.constraints||[],
      acceptanceBasis:null,
      boundary:{rendererCreatesMeaning:false,aiCreatesMeaning:false,realityKnown:false}
    }
  });
}

async function executeOne(context,input,key,consentRecordId,parameters,numExpansionInput){
  const spec=METHODS[key];
  const requestId=`CX-${spec.methodCode}-${crypto.randomUUID()}`;
  const body=spec.methodCode==='EMBODIED_CONFIGURATION'
    ?{canonicalInput:input,consent:true,requestId}
    :{schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:spec.methodCode,methodVersion:spec.methodVersion,capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:input,executionParameters:parameters,consentRecordId,requestId};
  const request=new Request(new URL(spec.endpoint,context.request.url),{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(body)});
  const handler=spec.endpoint.includes('ecr-execute')?runEcrExecute:spec.endpoint.includes('zi-wei')?runZiWeiExecute:spec.endpoint.includes('ast-structural')?runAstStructuralExecute:runMethodExecute;
  const response=await handler({request});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||payload?.ok!==true)return {ok:false,key,spec,methodCode:spec.methodCode,publicMethodCode:spec.publicMethodCode,label:methodLabel(spec,context.locale),reasonCodes:payload?.reasonCodes||[payload?.error||'METHOD_EXECUTION_FAILED']};

  let readingMethod;
  try{
    readingMethod=await buildAcceptedMethodCustomerResult({canonicalProjection:payload.result,locale:context.locale,requestedDepth:'STANDARD'});
  }catch(error){
    readingMethod=limitedReadingMethod(spec,context.locale,error,payload.result);
  }
  if(spec.methodCode==='NUMEROLOGY'){
    try{
      const meaningPayload=await buildProductionMethodMeaningPayload({canonicalProjection:payload.result,locale:context.locale,numerologyExpansionInput:numExpansionInput||{}});
      const numerologyEnvelope=buildNumerologyCustomerReadingEnvelope({canonicalProjection:payload.result,meaningPayload,expansionInput:numExpansionInput||{},locale:context.locale});
      return {ok:true,key,spec,canonicalProjection:payload.result,readingMethod,numerologyEnvelope};
    }catch(error){
      return {ok:false,key,spec,methodCode:spec.methodCode,publicMethodCode:spec.publicMethodCode,label:methodLabel(spec,context.locale),reasonCodes:[error?.code||error?.message||'NUM_CX_PRODUCTION_READING_UNAVAILABLE']};
    }
  }
  if(spec.methodCode!=='ASTROLOGY')return {ok:true,key,spec,canonicalProjection:payload.result,readingMethod};

  let meaningPayload;
  try{
    meaningPayload=await buildAstrologyCustomerReading({canonicalProjection:payload.result,locale:context.locale});
  }catch(error){
    return {ok:false,key,spec,methodCode:spec.methodCode,publicMethodCode:spec.publicMethodCode,label:methodLabel(spec,context.locale),reasonCodes:[error?.code||'ASTROLOGY_MEANING_UNAVAILABLE']};
  }
  return {ok:true,key,spec,canonicalProjection:payload.result,readingMethod,customerProjection:projectAstrologyForCustomer({canonicalProjection:payload.result,meaningPayload,locale:context.locale})};
}

function stage(locale,stageId,state,enLabel,zhLabel,enDetail,zhDetail){
  return freeze({stageId,state,label:locale==='zh-Hans'?zhLabel:enLabel,detail:locale==='zh-Hans'?zhDetail:enDetail});
}

function buildReadingView({methods,selectedCount,calculationCount,locale,combinedReading=null}){
  const readable=methods.filter(item=>item.state==='READY_TO_READ');
  const allCalculated=calculationCount===selectedCount;
  const allReadable=readable.length===selectedCount;
  const readingState=allReadable?'READY_TO_READ':readable.length?'PARTIALLY_PREPARED':'NEEDS_ATTENTION';
  const customerLabel=locale==='zh-Hans'
    ?allReadable?'所选视角都可以阅读':readable.length?'部分视角可以阅读':'还需要更多资料'
    :allReadable?'All selected perspectives are ready to read':readable.length?'Some perspectives are ready to read':'More information is needed';
  const combinedReady=combinedReading?.schemaVersion==='PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v2.0.0'&&combinedReading?.state==='PRODUCTION';
  const combinedExpected=selectedCount>=2;
  const combinedStageState=combinedReady?'READABLE':combinedExpected&&allReadable?'NEEDS_INFORMATION':'NOT_STARTED';
  const combinedDetail=locale==='zh-Hans'
    ?combinedReady?'跨视角读取已由获准的客户可发布方法 claim 组成；它不会把方法一致解释为事实。':combinedExpected&&allReadable?'本次方法读取已准备，但跨视角组合没有通过完整治理门。':'只有至少两个已准备的方法视角才会形成跨视角读取。'
    :combinedReady?'The cross-perspective reading is composed from admitted customer-publishable method claims; agreement is not treated as proof.':combinedExpected&&allReadable?'The method readings are ready, but cross-perspective composition did not clear every governed gate.':'At least two ready method perspectives are required for a cross-perspective reading.';
  return freeze({
    schemaVersion:'PHI-OS-CX-R12R4B-CUSTOMER-READING-VIEW-v1.0.0',
    state:readingState,
    customerLabel,
    selectedPerspectiveCount:selectedCount,
    readablePerspectiveCount:readable.length,
    methods,
    map:[
      stage(locale,'DATA','PREPARED','Information','资料','Required information was validated for this run.','本次所需资料已经通过验证。'),
      stage(locale,'METHOD_CALCULATION',allCalculated?'PREPARED':'NEEDS_INFORMATION','Method calculation','方法计算',allCalculated?'All selected calculations completed.':'Some selected calculations still need attention.',allCalculated?'所选方法都已完成计算。':'部分所选方法仍需要补充资料。'),
      stage(locale,'METHOD_INTERPRETATION',allReadable?'READABLE':readable.length?'READABLE':'NEEDS_INFORMATION','Method interpretation','方法解释',allReadable?'All selected method readings are ready.':readable.length?'Some method readings are ready; the remaining methods stay open.':'No customer-readable method interpretation is ready yet.',allReadable?'所选方法的解释都可以阅读。':readable.length?'部分方法解释可以阅读，其余部分继续保持开放。':'目前还没有可面向客户阅读的方法解释。'),
      stage(locale,'COMBINED_READING',combinedStageState,'Combined reading','综合读取',combinedDetail,combinedDetail),
      stage(locale,'CURRENT_REALITY','NOT_STARTED','Current Reality','当前现实','No current-reality evidence has been added or assumed.','尚未加入或假定任何当前现实证据。'),
      stage(locale,'FULL_REPORT','NOT_STARTED','Full report','完整报告','The full Personal Reading Report has not been composed yet.','完整 Personal Reading Report 尚未生成。')
    ],
    governance:{
      acceptanceBasis:'ADMITTED_COMPOSITION_RULESET',
      liveCustomerHumanReviewClaimed:false,
      rawProjectionUsedAsCustomerInterpretation:false,
      currentRealityAssumed:false,
      persistence:false
    },
    combinedReading:combinedReady?combinedReading:freeze({state:combinedExpected&&allReadable?'NEEDS_ATTENTION':'NOT_STARTED',crossMethodCompositionPerformed:false})
  });
}

function stripLegacyInterpretation(baseView){
  const structure={methods:(baseView.structure?.methods||[]).map(method=>({
    methodId:METHOD_ID_BY_PUBLIC[method.publicMethodCode],
    label:method.label,
    values:(method.values||[]).map(item=>({label:item.label,value:item.value})),
    structures:(method.structures||[]).map(group=>({label:group.label,items:(group.items||[]).map(item=>({label:item.label,value:item.value}))}))
  }))};
  const currentContext={items:(baseView.currentContext?.items||[]).map(item=>({label:item.label,value:item.value}))};
  return {schemaVersion:'PHI-OS-CX-R12R4B-CUSTOMER-SURFACE-SHELL-v1.0.0',surface:baseView.surface,locale:baseView.locale,intent:baseView.intent,structure,currentContext};
}

function stripAstrologyTechnicalProjection(astrology){
  if(!astrology)return null;
  const {projectionId:_projectionId,executionCompleteness:_executionCompleteness,interpretation:_legacyInterpretation,unknowns:_technicalUnknowns,boundary:_technicalBoundary,...safe}=astrology;
  return {
    ...safe,
    bodies:(safe.bodies||[]).map(({meaningRefs:_meaningRefs,...body})=>body)
  };
}

export async function onRequestPost(context){
  let body;
  try{body=await context.request.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)}
  if(body?.consent!==true)return json({ok:false,error:'PERSONAL_REALITY_PROCESSING_CONSENT_REQUIRED'},403);
  const selected=[...(Array.isArray(body?.methods)?body.methods:[])].map(value=>clean(value).toLowerCase()).filter(key=>METHODS[key]);
  if(!selected.length)return json({ok:false,error:'PERSONAL_REALITY_METHOD_REQUIRED'},400);
  const needsPlace=selected.some(key=>['astrology','bazi','ziwei','ecr'].includes(key));
  if(needsPlace&&!clean(body?.placeRef))return json({ok:false,error:'LOCATION_SELECTION_REQUIRED'},422);

  const expansionError=validateNumerologyExpansionRequest(body,selected);
  if(expansionError)return json({ok:false,error:expansionError},422);
  const locale=body?.locale==='zh-Hans'?'zh-Hans':'en';
  context.locale=locale;
  context.customerIntent=body?.intent||null;
  let targetContext=null;try{targetContext=astTargetContext(body)}catch(error){return json({ok:false,error:error.code},422)}
  let location=null;
  if(needsPlace){
    try{location=await resolveBirthPlace(body.placeRef,{birthDate:nullable(body.birthDate),birthTime:body?.birthTimeUnknown?null:nullable(body.birthTime),locale,env:context.env})}
    catch(error){return json({ok:false,error:error?.code||'LOCATION_RESOLUTION_FAILED'},422)}
  }
  const consentRecordId=`CX-CONSENT-${crypto.randomUUID()}`;
  const input=canonicalInput(body,location,consentRecordId,locale);
  const shape=validateCanonicalBirthInput(input);
  if(!shape.valid)return json({ok:false,error:'PERSONAL_REALITY_INPUT_INVALID',reasonCodes:shape.reasonCodes},422);

  const parameters=executionParameters(body);
  const numExpansionInput=numerologyExpansionInput(body);
  const results=await Promise.all(selected.map(key=>executeOne(context,input,key,consentRecordId,parameters,numExpansionInput)));
  const projections=results.filter(result=>result.ok).map(result=>result.canonicalProjection);
  const blocked=results.filter(result=>!result.ok);
  const baseView=projectMethodsForCustomer({projections,blocked,intent:body?.intent,locale,includeLegacyInterpretation:false});
  const blockedByCode=new Map((baseView.overview?.blocked||[]).map(item=>[item.methodCode,item]));
  const readingMethods=results.map(result=>{
    if(result.ok)return result.readingMethod;
    const publicBlocked=blockedByCode.get(result.methodCode)||blockedByCode.get(result.publicMethodCode);
    const error={code:result.reasonCodes?.[0]||'METHOD_EXECUTION_FAILED'};
    const limited=limitedReadingMethod(result.spec,locale,error);
    return publicBlocked?.message?freeze({...limited,summary:publicBlocked.message,openQuestions:[publicBlocked.message]}):limited;
  });
  let combinedReading=null;
  if(selected.length>=2&&selected.length<=5&&readingMethods.every(method=>method?.state==='READY_TO_READ')){
    try{combinedReading=await maybeBuildProductionCombinedReading({acceptedMethodReadings:readingMethods,customerIntent:context.customerIntent})}
    catch{combinedReading=null}
  }
  const reading=buildReadingView({methods:readingMethods,selectedCount:selected.length,calculationCount:projections.length,locale,combinedReading});
  let singleMethodReading=null;
  if(selected.length===1&&readingMethods[0]?.state==='READY_TO_READ'){
    try{singleMethodReading=await maybeBuildProductionSingleMethodReading({methodResult:readingMethods[0],customerIntent:context.customerIntent,locale})}
    catch{singleMethodReading=null}
  }
  const astrologyResult=results.find(result=>result.ok&&result.spec?.methodCode==='ASTROLOGY');
  const astrology=stripAstrologyTechnicalProjection(astrologyResult?.customerProjection||null);
  const numerology=projectNumerologyEnvelopeForCustomer(results.find(result=>result.ok&&result.numerologyEnvelope)?.numerologyEnvelope||null);
  let astrologyWorkspace=null;
  if(selected.length===1&&selected[0]==='astrology'&&astrologyResult?.canonicalProjection){
    try{astrologyWorkspace=await maybeBuildActiveAstCustomerWorkspace({canonicalProjection:astrologyResult.canonicalProjection,rawIntent:body?.intent||'',explicitIntentProfileId:body?.astIntentProfileId||null,locale,targetContext,consentRecordId,sourceMainCommit:'3f6825a9b57dc9e62e34fb69bc55d2aac2c39768'})}catch{astrologyWorkspace=null}
  }
  const astrologyWorkspaceCapability=getAstCustomerWorkspaceCapability();
  let view=freeze({...stripLegacyInterpretation(baseView),astrology,numerology,reading,singleMethodReading});
  view=freeze({...view,astrologyWorkspace,astrologyWorkspaceCapability});
  return json({
    ok:true,
    view,
    location:location?{state:'CONFIRMED',displayName:location.displayName,locality:location.locality,region:location.region,country:location.country,timeZone:location.timezone.iana}:null,
    privacy:{saved:false}
  });
}
