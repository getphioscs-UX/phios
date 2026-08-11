import { canonicalDigest } from './validation-evidence-runtime.js';

export const MPA_BZR_ACTIVATION_DECISION_SCHEMA_VERSION =
  'PHI-OS-MPA-BZR-ACTIVATION-DECISION-v1.0.0';

const STEMS = Object.freeze(['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI']);
const BRANCHES = Object.freeze(['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI']);

function mod(n,m){ return ((n % m) + m) % m; }
function jd(date) {
  let y=date.getUTCFullYear(), m=date.getUTCMonth()+1;
  const d=date.getUTCDate()+(date.getUTCHours()+date.getUTCMinutes()/60+date.getUTCSeconds()/3600)/24;
  if(m<=2){y-=1;m+=12;} const A=Math.floor(y/100); const B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5;
}
export function equationOfTimeMinutes(utcIso) {
  const date=new Date(utcIso); if(Number.isNaN(date.getTime())) throw new TypeError('Invalid UTC instant.');
  const T=(jd(date)-2451545.0)/36525;
  const L0=mod(280.46646+T*(36000.76983+T*0.0003032),360);
  const M=357.52911+T*(35999.05029-0.0001537*T);
  const e=0.016708634-T*(0.000042037+0.0000001267*T);
  const epsilon0=23+(26+(21.448-T*(46.815+T*(0.00059-T*0.001813)))/60)/60;
  const omega=125.04-1934.136*T;
  const epsilon=epsilon0+0.00256*Math.cos(omega*Math.PI/180);
  const y=Math.tan((epsilon*Math.PI/180)/2)**2;
  const r=x=>x*Math.PI/180;
  const E=y*Math.sin(2*r(L0))-2*e*Math.sin(r(M))+4*e*y*Math.sin(r(M))*Math.cos(2*r(L0))
    -0.5*y*y*Math.sin(4*r(L0))-1.25*e*e*Math.sin(2*r(M));
  return E*180/Math.PI*4;
}
export function trueSolarClockReference({utcIso, civilLocalDate, civilLocalTime, timezoneOffsetMinutes, longitudeDegreesEast}) {
  if(!Number.isFinite(timezoneOffsetMinutes)||!Number.isFinite(longitudeDegreesEast)) throw new TypeError('Timezone offset and longitude are required.');
  const eot=equationOfTimeMinutes(utcIso);
  const standardMeridian=timezoneOffsetMinutes/4;
  const longitudeCorrection=4*(longitudeDegreesEast-standardMeridian);
  const correction=eot+longitudeCorrection;
  const [h,m,s]=civilLocalTime.split(':').map(Number);
  let seconds=h*3600+m*60+s+correction*60;
  let dayShift=0; while(seconds<0){seconds+=86400;dayShift--;} while(seconds>=86400){seconds-=86400;dayShift++;}
  const base=new Date(`${civilLocalDate}T00:00:00.000Z`); base.setUTCDate(base.getUTCDate()+dayShift);
  const hh=Math.floor(seconds/3600); const mm=Math.floor((seconds-hh*3600)/60); const ss=seconds-hh*3600-mm*60;
  return Object.freeze({
    physicalInstantUtcIso:utcIso,
    equationOfTimeMinutes:eot, standardMeridianDegreesEast:standardMeridian,
    longitudeCorrectionMinutes:longitudeCorrection, totalCorrectionMinutes:correction,
    trueSolarLocalDate:base.toISOString().slice(0,10),
    trueSolarLocalTime:`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${ss.toFixed(6).padStart(9,'0')}`
  });
}
function gregorianJdn(y,m,d){const a=Math.floor((14-m)/12), y2=y+4800-a, m2=m+12*a-3;return d+Math.floor((153*m2+2)/5)+365*y2+Math.floor(y2/4)-Math.floor(y2/100)+Math.floor(y2/400)-32045;}
function pair(index){const i=mod(index-1,60);return {stemCode:STEMS[i%10],branchCode:BRANCHES[i%12],sexagenaryIndex:i+1};}
export function independentBzrPillarsReference({birthDate,trueSolarLocalTime,yearAfterLiChun=true,monthOrdinalFromLiChun}) {
  const [y,m,d]=birthDate.split('-').map(Number);
  if(!Number.isInteger(monthOrdinalFromLiChun)||monthOrdinalFromLiChun<0||monthOrdinalFromLiChun>11) throw new TypeError('monthOrdinalFromLiChun is required.');
  const yearNumber=yearAfterLiChun?y:y-1;
  const yearIndex=mod(yearNumber-3-1,60)+1; const year=pair(yearIndex);
  const yearStem=STEMS.indexOf(year.stemCode);
  const yinStem=mod((yearStem%5)*2+2,10);
  const monthStem=mod(yinStem+monthOrdinalFromLiChun,10);
  const monthBranch=mod(2+monthOrdinalFromLiChun,12);
  let monthIndex=1; for(let i=1;i<=60;i++){const p=pair(i);if(p.stemCode===STEMS[monthStem]&&p.branchCode===BRANCHES[monthBranch]){monthIndex=i;break;}}
  const dayIndex=mod(gregorianJdn(y,m,d)+49,60)+1; const day=pair(dayIndex);
  const hour=Number(trueSolarLocalTime.slice(0,2)); const hourBranch=mod(Math.floor((hour+1)/2),12);
  const dayStem=STEMS.indexOf(day.stemCode); const ziStem=mod((dayStem%5)*2,10); const hourStem=mod(ziStem+hourBranch,10);
  let hourIndex=1; for(let i=1;i<=60;i++){const p=pair(i);if(p.stemCode===STEMS[hourStem]&&p.branchCode===BRANCHES[hourBranch]){hourIndex=i;break;}}
  return Object.freeze({year,month:pair(monthIndex),day,hour:pair(hourIndex)});
}
export function validateBzrAuthorityRecord(record, expectedCode) {
  if(record?.authorityBinding?.authorityCode===expectedCode || record?.authorityBinding?.engineCode===expectedCode) {
    if(record.authorityBindingDigest!==canonicalDigest(record.authorityBinding)) throw new TypeError(`${expectedCode} authority binding digest drift.`);
    return true;
  }
  throw new TypeError(`${expectedCode} authority binding missing.`);
}
export function evaluateBzrActivationReadiness({gates,evidenceReferences=[]}={}) {
  const required=['timezoneAuthority','solarTermAuthority','trueSolarReference','sexagenaryReference','fixtureReconciliation','luckStartExactness','regression','crossImplementationComparison','policyBoundaryPreserved'];
  const failed=required.filter(k=>gates?.[k]!==true); const ready=failed.length===0;
  return Object.freeze({
    schemaVersion:MPA_BZR_ACTIVATION_DECISION_SCHEMA_VERSION,work:'MPA-W23',methodCode:'BAZI',pluginCode:'BZR',methodVersion:'0.1.0',
    decision:ready?'READY_FOR_MPA_W26_ELIGIBILITY_DECISION':'BZR_METHOD_SPECIFIC_ACTIVATION_BLOCKED',
    methodSpecificReady:ready,gates:Object.freeze({...gates}),failedGates:Object.freeze(failed),remainingMethodSpecificBlockers:Object.freeze(failed),
    historicalRegistryBlockerReconciliation:Object.freeze({
      LICENSE_REVIEW_INCOMPLETE:'RESOLVED_FOR_SUCCESSOR_EVIDENCE_IANA_PUBLIC_DOMAIN_ASTRONOMY_ENGINE_MIT_INTERNAL_POLICY',
      VALIDATION_NOT_PASSED:ready?'RESOLVED_FOR_METHOD_SPECIFIC_SUCCESSOR_READINESS':'UNRESOLVED',
      REGRESSION_NOT_PASSED:ready?'RESOLVED_FOR_METHOD_SPECIFIC_SUCCESSOR_READINESS':'UNRESOLVED',
      MPA_EXECUTION_GATE_NOT_ESTABLISHED:'REMAINS_GLOBAL_W27_GATE'
    }),
    evidenceReferences:Object.freeze([...evidenceReferences]),readyForW26:ready,globalEligibilityGate:ready?'MPA-W26_REQUIRED':'MPA-W26_NOT_YET_REACHABLE',
    productionEligible:false,productionEligibilityDecisionCreated:false,productionExecutionAllowed:false,productionExecutionGate:'MPA-W27_REQUIRED',
    professionalEligible:false,professionalReleaseAllowed:false,publicEligible:false,frozenMrOrImrRewritten:false,legacyBzrManifestRewritten:false,historicalW12OrW15Rewritten:false
  });
}
export function assertBzrProductionExecutionBlocked(mode){
  if(mode==='production') throw new Error('MPA_W27_PRODUCTION_EXECUTION_GATE_REQUIRED');
  if(mode!=='validation') throw new TypeError('BZR W23 supports activation evidence only before MPA-W27.');
  return true;
}
