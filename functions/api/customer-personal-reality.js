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
import {executeAndProjectMcd5CurrentRequest} from '../method-client-delivery/canonical-projection-runtime-current.js';
import {buildBaziMethodNativeReading} from '../personal-professional-reading/bazi-method-native-reading-adapter.js';
import {resolveBirthPlace} from '../location/place-resolver.js';

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

function nativeBackedReadingMethod(spec,locale,projection,{available=true,reasonCode=null}={}){
  const ready=available===true;
  const message=locale==='zh-Hans'
    ?(ready?'专业八字读取已由方法原生 Full Production 报告提供；旧逐柱解释链不再参与本页面。':'八字计算结构已建立，但方法原生客户报告这次未能发布。')
    :(ready?'The professional BaZi reading is supplied by the method-native Full Production report; the legacy pillar-by-pillar composer is not used on this page.':'The BaZi calculation is established, but the method-native customer report could not be published this time.');
  return freeze({
    schemaVersion:'PHI-OS-CX-R12R4B-CUSTOMER-READING-METHOD-v1.0.0',
    methodId:'BZR',methodLabel:methodLabel(spec,locale),locale,
    state:ready?'READY_TO_READ':'NEEDS_ATTENTION',stateLabel:ready?(locale==='zh-Hans'?'可以阅读':'Ready to read'):(locale==='zh-Hans'?'需要补充':'Needs attention'),
    summary:message,insights:[],visualModel:null,source:{label:'BAZI-FP-v1.0.0',lineageAvailable:Boolean(projection?.projectionId)},openQuestions:ready?[]:[message],
    technical:{methodId:'BZR',publicMethodCode:spec.publicMethodCode,projectionId:projection?.projectionId||null,reasonCode,acceptanceBasis:'PPR-C1_METHOD_NATIVE_BAZI',legacyComposerUsed:false,boundary:{rendererCreatesMeaning:false,aiCreatesMeaning:false,realityKnown:false}}
  });
}

async function executeOne(context,input,key,consentRecordId,parameters,numExpansionInput){
  const spec=METHODS[key];
  const requestId=`CX-${spec.methodCode}-${crypto.randomUUID()}`;
  const body=spec.methodCode==='EMBODIED_CONFIGURATION'
    ?{canonicalInput:input,consent:true,requestId}
    :{schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:spec.methodCode,methodVersion:spec.methodVersion,capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput:input,executionParameters:parameters,consentRecordId,requestId};
  if(spec.methodCode==='BAZI'){
    try{
      const direct=await executeAndProjectMcd5CurrentRequest(body);
      const baseExecution=direct.execution,canonicalProjection=direct.canonicalProjection;
      const execution=baseExecution;
      if(!canonicalProjection||execution?.executionStatus==='BLOCKED_BY_MPA'||execution?.executionStatus==='INPUT_BLOCKED')return {ok:false,key,spec,methodCode:spec.methodCode,publicMethodCode:spec.publicMethodCode,label:methodLabel(spec,context.locale),reasonCodes:execution?.reasonCodes||['METHOD_EXECUTION_FAILED']};
      return {ok:true,key,spec,canonicalProjection,baseExecution,readingMethod:nativeBackedReadingMethod(spec,context.locale,canonicalProjection)};
    }catch(error){
      return {ok:false,key,spec,methodCode:spec.methodCode,publicMethodCode:spec.publicMethodCode,label:methodLabel(spec,context.locale),reasonCodes:[error?.code||'METHOD_EXECUTION_FAILED']};
    }
  }
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

function buildReadingView({methods,selectedCount,calculationCount,locale}){
  const readable=methods.filter(item=>item.state==='READY_TO_READ');
  const allCalculated=calculationCount===selectedCount;
  const allReadable=readable.length===selectedCount;
  const readingState=allReadable?'READY_TO_READ':readable.length?'PARTIALLY_PREPARED':'NEEDS_ATTENTION';
  const customerLabel=locale==='zh-Hans'
    ?allReadable?'所选视角都可以阅读':readable.length?'部分视角可以阅读':'还需要更多资料'
    :allReadable?'All selected perspectives are ready to read':readable.length?'Some perspectives are ready to read':'More information is needed';
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
      stage(locale,'COMBINED_READING','NOT_STARTED','Combined reading','综合读取','Cross-method composition has not been performed in this phase.','本阶段尚未进行跨方法综合。'),
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
    combinedReading:{state:'NOT_STARTED',crossMethodCompositionPerformed:false}
  });
}

function withNativeReportStage(reading,{hasPublishableNativeReport=false,locale='en'}={}){
  if(!hasPublishableNativeReport)return reading;
  return freeze({...reading,map:reading.map.map(item=>item.stageId==='FULL_REPORT'?stage(locale,'FULL_REPORT','READABLE','Full report','完整报告','A method-native Full Production report is ready on this canonical surface.','方法原生 Full Production 报告已经进入这个唯一客户页面。'):item)});
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
  const methodNativeReading={};
  const baziResult=results.find(result=>result.ok&&result.spec?.methodCode==='BAZI');
  if(baziResult){
    try{
      methodNativeReading.BZR=await buildBaziMethodNativeReading({canonicalProjection:baziResult.canonicalProjection,canonicalInput:input,baseExecution:baziResult.baseExecution,locale,targetContext:body?.baziTemporalContext||null});
      baziResult.readingMethod=nativeBackedReadingMethod(baziResult.spec,locale,baziResult.canonicalProjection);
    }catch(error){
      baziResult.readingMethod=nativeBackedReadingMethod(baziResult.spec,locale,baziResult.canonicalProjection,{available:false,reasonCode:error?.code||'PPR_C1_BAZI_METHOD_NATIVE_UNAVAILABLE'});
    }
  }
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
  const hasPublishableNativeReport=Object.values(methodNativeReading).some(product=>product?.publicationDecision?.customerPublishable===true);
  const reading=withNativeReportStage(buildReadingView({methods:readingMethods,selectedCount:selected.length,calculationCount:projections.length,locale}),{hasPublishableNativeReport,locale});
  let singleMethodReading=null;
  const hasSingleNativeReport=selected.length===1&&hasPublishableNativeReport;
  if(!hasSingleNativeReport&&selected.length===1&&readingMethods[0]?.state==='READY_TO_READ'){
    try{singleMethodReading=await maybeBuildProductionSingleMethodReading({methodResult:readingMethods[0],customerIntent:context.customerIntent,locale})}
    catch{singleMethodReading=null}
  }
  const astrology=stripAstrologyTechnicalProjection(results.find(result=>result.ok&&result.customerProjection)?.customerProjection||null);
  const numerology=projectNumerologyEnvelopeForCustomer(results.find(result=>result.ok&&result.numerologyEnvelope)?.numerologyEnvelope||null);
  const view=freeze({...stripLegacyInterpretation(baseView),astrology,numerology,reading,singleMethodReading,methodNativeReading:freeze(methodNativeReading)});
  return json({
    ok:true,
    view,
    location:location?{state:'CONFIRMED',displayName:location.displayName,locality:location.locality,region:location.region,country:location.country,timeZone:location.timezone.iana}:null,
    privacy:{saved:false}
  });
}
