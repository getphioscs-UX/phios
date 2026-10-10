import {buildZiWeiDynamicProjection} from '../zi-wei-dynamic/dynamic-runtime.js';
import {sha256Stable} from '../zi-wei-runtime/zwr-utils.js';

export const ZIWEI_PRO_R2_TIMING_NAVIGATION_SCHEMA='PHI-OS-ZIWEI-PRO-R2-W12-TIMING-NAVIGATION-v1.0.0';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const pad=n=>String(n).padStart(2,'0');
const shiftYear=(date,year)=>{const [,m='08',d='30']=String(date||'').split('-');return `${year}-${pad(Number(m)||8)}-${pad(Math.min(Number(d)||30,28))}`};
const annualTransformations=p=>(p.dynamicTransformations||[]).filter(x=>x.sourceLayer==='LIU_NIAN').map(x=>freeze({transformationCode:x.transformationCode,targetStarCode:x.targetStarCode,palaceCode:x.palaceCode,branch:x.branch}));

export async function buildZiweiProfessionalTimingNavigation({canonicalInput,natalProjection,normalizedTarget,consentRecordId,executionParameters,requestId='ZIWEI-PRO-R2-W12'}={}){
  const currentYear=Number(String(normalizedTarget?.targetDate||'').slice(0,4));
  if(!Number.isInteger(currentYear))throw Object.assign(new Error('ZIWEI_PRO_R2_W12_TARGET_YEAR_REQUIRED'),{code:'ZIWEI_PRO_R2_W12_TARGET_YEAR_REQUIRED'});
  const years=[];
  for(let year=currentYear-2;year<=currentYear+3;year+=1){
    const targetDate=year===currentYear?normalizedTarget.targetDate:shiftYear(normalizedTarget.targetDate,year);
    const targetContext={targetDate,targetTime:normalizedTarget.targetTime,targetTimezone:{iana:normalizedTarget.targetTimezone.iana,utcOffsetAtTarget:normalizedTarget.targetTimezone.utcOffsetAtTarget}};
    const dynamic=await buildZiWeiDynamicProjection({requestId:`${requestId}-${year}`,consentRecordId,canonicalInput,natalProjection,targetContext,executionParameters});
    const annual=dynamic.annualContext||{},dx=dynamic.currentDaXian?.current||{},focus=dynamic.currentDomainFocus||{};
    years.push(freeze({calendarYear:year,targetDate,direction:year<currentYear?'PAST':year===currentYear?'CURRENT':'FUTURE',lunarYear:annual.lunarYear||null,yearStem:annual.yearStem||null,yearBranch:annual.yearBranch||null,annualLifeBranch:annual.lifeBranch||null,annualNatalDomainCode:annual.natalDomainCode||null,daXianCycleIndex:dx.cycleIndex||null,daXianStartNominalAge:dx.startNominalAge||null,daXianEndNominalAge:dx.endNominalAge||null,daXianNatalDomainCode:dx.natalDomainCode||null,sameNatalDomainFocus:focus.sameNatalDomainFocus===true,classification:focus.classification||null,annualTransformations:annualTransformations(dynamic),dynamicProjectionId:dynamic.projectionId}));
  }
  const base={schemaVersion:ZIWEI_PRO_R2_TIMING_NAVIGATION_SCHEMA,work:'ZIWEI-PRO-R2-W12',window:{pastYears:2,currentYears:1,futureYears:3,totalYears:6},anchorCalendarYear:currentYear,years,boundaries:{sameDateComparisonAcrossYears:true,annualStructureNotEventPrediction:true,noGuaranteedOutcome:true,noMonthlyDailyHourlyExpansion:true,doesNotReplaceCurrentTargetContext:true}};
  return freeze({...base,navigationDigest:sha256Stable(base)});
}
export default Object.freeze({buildZiweiProfessionalTimingNavigation,ZIWEI_PRO_R2_TIMING_NAVIGATION_SCHEMA});
