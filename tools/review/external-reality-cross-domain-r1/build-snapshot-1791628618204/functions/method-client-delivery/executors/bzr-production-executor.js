import {sha256} from '../../method-runtime/shared-calculation-runtime.js';
import {createBzrSolarCalendarRuntime,BZR_SOLAR_CALENDAR_RUNTIME_CODE} from '../../core-method-runtime/bzr-solar-calendar-runtime.js';
import {createBzrFourPillarsRuntime,BZR_FOUR_PILLARS_RUNTIME_CODE} from '../../core-method-runtime/bzr-four-pillars-runtime.js';
import {createBzrLuckCycleRuntime,BZR_LUCK_CYCLE_RUNTIME_CODE} from '../../core-method-runtime/bzr-luck-cycle-runtime.js';
import {createBzrGovernedProductionAdapters,parseOffset} from '../production-adapters/bzr-governed-production-adapters.js';
function record(id,type,payload){return Object.freeze({authority:'SHARED_DATA_AUTHORITY',status:'verified',methodOwner:null,pluginOwner:null,recordId:id,recordType:type,recordVersion:'1.0.0',payload:Object.freeze(payload)});}
function calendarShape(solar){return Object.freeze({yearBoundaryPolicy:'exact_li_chun_instant',monthBoundaryPolicy:'exact_twelve_jie_instants',dayBoundaryTimeBasis:'true_solar_time',dayBoundaryLocalTime:'00:00',liChunUtcIso:solar.liChunUtcIso,jieBoundaries:Object.freeze(solar.jieBoundaries.map(x=>Object.freeze({...x})))});}
export async function executeBzrProductionMcd4({requestId,canonicalInput,executionParameters={}},{astronomyModuleLoader}={}){
  const adapters=createBzrGovernedProductionAdapters({canonicalInput,astronomyModuleLoader});
  const known=canonicalInput.birthTime!=null && canonicalInput.timeAccuracy!=='UNKNOWN';
  const coreResults=[],executedStages=[],deferredStages=[],reasonCodes=[];
  let calendarRecord=null;
  if(known){
    if(canonicalInput.timezone?.utcOffsetAtBirth==null||!Number.isFinite(canonicalInput.birthPlace?.latitude)||!Number.isFinite(canonicalInput.birthPlace?.longitude)){
      return Object.freeze({coreExecutionPerformed:false,coreHistoricalExecutionMode:'validation',executedStages:Object.freeze([]),deferredStages:Object.freeze(['BZR_SOLAR_CALENDAR','BZR_PILLARS','BZR_LUCK_CYCLE']),reasonCodes:Object.freeze(['BZR_EXACT_SOLAR_CONTEXT_REQUIRES_EXPLICIT_OFFSET_AND_COORDINATES']),coreResults:Object.freeze([])});
    }
    const birth=record(`SDA-${requestId}-BZR-BIRTH`,'BIRTH_RECORD',{localDate:canonicalInput.birthDate,localTime:canonicalInput.birthTime,timezoneId:canonicalInput.timezone.iana,birthTimeKnown:true});
    const coordinate=record(`SDA-${requestId}-BZR-COORD`,'COORDINATE',{latitude:canonicalInput.birthPlace.latitude,longitude:canonicalInput.birthPlace.longitude,elevationMeters:0,datum:'WGS84'});
    const solarRuntime=createBzrSolarCalendarRuntime({timezoneAdapter:adapters.timezoneAdapter,trueSolarTimeAdapter:adapters.trueSolarTimeAdapter,solarTermAdapter:adapters.solarTermAdapter});
    const solar=await solarRuntime.calculate({calculationId:`${requestId}-BZR-W1`,runtimeCode:BZR_SOLAR_CALENDAR_RUNTIME_CODE,executionMode:'validation',policyVersion:'PHI_OS_BAZI_POLICY_V1',dstDisambiguationPolicyCode:'EXPLICIT_FAIL_CLOSED_V1',equationOfTimePolicyCode:'APPARENT_SOLAR_TIME_V1',timeScale:'TT',referenceFrame:'ECLIPTIC_OF_DATE',inputRecords:[birth,coordinate],referenceVersions:{mcdProductionAuthority:'MPA',productionAdapterBinding:'MCD_BZR_PRODUCTION_SUCCESSOR_V1'}});
    coreResults.push(solar);executedStages.push('BZR_SOLAR_CALENDAR');
    calendarRecord=record(`SDA-${requestId}-BZR-CALENDAR`,'BZR_SOLAR_CALENDAR_CONTEXT',{...solar.output,outputDigest:solar.outputDigest});
  }else{
    if(canonicalInput.timezone?.utcOffsetAtBirth==null){
      return Object.freeze({coreExecutionPerformed:false,coreHistoricalExecutionMode:'validation',executedStages:Object.freeze([]),deferredStages:Object.freeze(['BZR_DATE_ONLY_EXACT_BOUNDARY_CONTEXT','BZR_PILLARS','BZR_LUCK_CYCLE']),reasonCodes:Object.freeze(['BZR_UNKNOWN_TIME_THREE_PILLARS_REQUIRES_EXPLICIT_UTC_OFFSET_FOR_BOUNDARY_CLASSIFICATION']),coreResults:Object.freeze([])});
    }
    const solar=await adapters.solarTermAdapter.resolveYearContext({gregorianYear:Number(canonicalInput.birthDate.slice(0,4)),referenceFrame:'ECLIPTIC_OF_DATE',timeScale:'TT',engineVersion:'2.1.19'});
    const payload={schemaVersion:'PHI-OS-BZR-SOLAR-DATE-CONTEXT-v1.0.0',contextStatus:'date_only_time_unresolved',birthTimeKnown:false,fabricatedTimeUsed:false,trueSolarDate:canonicalInput.birthDate,utcOffsetMinutes:parseOffset(canonicalInput.timezone.utcOffsetAtBirth),solarCalendar:calendarShape(solar)};
    calendarRecord=record(`SDA-${requestId}-BZR-DATE-CONTEXT`,'BZR_SOLAR_DATE_CONTEXT',{...payload,outputDigest:await sha256(payload)});
    executedStages.push('BZR_DATE_ONLY_EXACT_BOUNDARY_CONTEXT');reasonCodes.push('BZR_UNKNOWN_TIME_DEGRADE_TO_THREE_PILLARS');deferredStages.push('BZR_HOUR_PILLAR');
  }
  const pillarRuntime=createBzrFourPillarsRuntime({sexagenaryAdapter:adapters.sexagenaryAdapter});
  let pillars;
  try{pillars=await pillarRuntime.calculate({calculationId:`${requestId}-BZR-W2`,runtimeCode:BZR_FOUR_PILLARS_RUNTIME_CODE,executionMode:'validation',policyVersion:'PHI_OS_BAZI_POLICY_V1',ziHourPolicyCode:'TRUE_SOLAR_ZI_HOUR_V1',inputRecords:[calendarRecord],referenceVersions:{mcdProductionAuthority:'MPA',productionAdapterBinding:'MCD_BZR_PRODUCTION_SUCCESSOR_V1'}});}catch(error){if(error?.code==='BZR_UNKNOWN_TIME_SOLAR_TERM_BOUNDARY_AMBIGUOUS'){return Object.freeze({coreExecutionPerformed:coreResults.length>0,coreHistoricalExecutionMode:'validation',executedStages:Object.freeze(executedStages),deferredStages:Object.freeze([...deferredStages,'BZR_PILLARS']),reasonCodes:Object.freeze([...reasonCodes,error.code]),coreResults:Object.freeze(coreResults)});}throw error;}
  coreResults.push(pillars);executedStages.push(known?'BZR_FOUR_PILLARS':'BZR_THREE_PILLARS');
  if(known){
    const sex=String(executionParameters.traditionalCalculationSex||'').toUpperCase();
    if(sex==='MALE'||sex==='FEMALE'){
      const sexRecord=record(`SDA-${requestId}-BZR-TRADITIONAL-SEX`,'TRADITIONAL_CALCULATION_SEX',{value:sex,useScope:'LUCK_CYCLE_DIRECTION_ONLY',identityInferenceAllowed:false,personalityClaimAllowed:false,relationshipRoleClaimAllowed:false,generalProfileClaimAllowed:false});
      const pillarsRecord=record(`SDA-${requestId}-BZR-PILLARS`,'BZR_FOUR_PILLARS_RESULT',{...pillars.output,outputDigest:pillars.outputDigest});
      const luckRuntime=createBzrLuckCycleRuntime({luckCycleAdapter:adapters.luckCycleAdapter});
      try{const luck=await luckRuntime.calculate({calculationId:`${requestId}-BZR-W3`,runtimeCode:BZR_LUCK_CYCLE_RUNTIME_CODE,executionMode:'validation',policyVersion:'PHI_OS_BAZI_POLICY_V1',cycleCount:Number.isInteger(executionParameters.luckCycleCount)?executionParameters.luckCycleCount:8,inputRecords:[calendarRecord,pillarsRecord,sexRecord],referenceVersions:{mcdProductionAuthority:'MPA',productionAdapterBinding:'MCD_BZR_PRODUCTION_SUCCESSOR_V1'}});coreResults.push(luck);executedStages.push('BZR_LUCK_CYCLE');}catch(error){if(error?.code==='BZR_LUCK_REFERENCE_JIE_OUTSIDE_CONTEXT'){deferredStages.push('BZR_LUCK_CYCLE');reasonCodes.push(error.code);}else throw error;}
    }else{deferredStages.push('BZR_LUCK_CYCLE');reasonCodes.push(sex?'BZR_LUCK_CYCLE_TRADITIONAL_CALCULATION_SEX_INVALID':'BZR_LUCK_CYCLE_TRADITIONAL_CALCULATION_SEX_NOT_SUPPLIED');}
  }else{deferredStages.push('BZR_LUCK_CYCLE');reasonCodes.push('BZR_LUCK_CYCLE_REQUIRES_KNOWN_BIRTH_TIME');}
  return Object.freeze({coreExecutionPerformed:true,coreHistoricalExecutionMode:'validation',executedStages:Object.freeze(executedStages),deferredStages:Object.freeze([...new Set(deferredStages)]),reasonCodes:Object.freeze([...new Set(['BZR_GOVERNED_PRODUCTION_ADAPTER_EXECUTED',...reasonCodes])]),coreResults:Object.freeze(coreResults)});
}
