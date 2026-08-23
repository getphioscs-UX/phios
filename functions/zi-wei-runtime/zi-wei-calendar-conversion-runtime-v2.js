import { assertZiWeiPolicyConsumable } from './policy-gate.js';
import { LUNAR_INFO_1900_2100, lunarYearDays, leapMonth, leapDays, monthDays } from './lunar-calendar-table-v1.js';
import { addCivilDays, assertIsoDate, assertTime, HEAVENLY_STEMS, EARTHLY_BRANCHES } from './zwr-utils.js';

const BASE_UTC = Date.UTC(1900,0,31);
const DAY_MS = 86400000;

function solarToLunar(dateStr){
  const {y,m,d}=assertIsoDate(dateStr);
  if(y<1901 || y>2100) throw Object.assign(new Error('Zi Wei v1 calendar authority supports Gregorian years 1901-2100 only.'),{code:'ZWR_CALENDAR_OUT_OF_RANGE'});
  let offset=Math.floor((Date.UTC(y,m-1,d)-BASE_UTC)/DAY_MS);
  let lunarYear=1900;
  while(lunarYear<=2100){ const days=lunarYearDays(lunarYear); if(offset<days) break; offset-=days; lunarYear++; }
  if(lunarYear>2100) throw Object.assign(new Error('Lunar conversion exceeds embedded authority range.'),{code:'ZWR_CALENDAR_OUT_OF_RANGE'});
  const leap=leapMonth(lunarYear);
  let lunarMonth=1, isLeap=false;
  while(lunarMonth<=12){
    const days=isLeap ? leapDays(lunarYear) : monthDays(lunarYear,lunarMonth);
    if(offset<days) break;
    offset-=days;
    if(leap===lunarMonth && !isLeap){ isLeap=true; }
    else { if(isLeap) isLeap=false; lunarMonth++; }
  }
  return {lunarYear,lunarMonth,lunarDay:offset+1,isLeap};
}

function hourBranchFromLocalTime(time){
  const {h,m,sec}=assertTime(time);
  const seconds=h*3600+m*60+sec;
  if(seconds>=23*3600 || seconds<1*3600) return {code:'ZI',index:0};
  const index=Math.floor((h+1)/2);
  return {code:EARTHLY_BRANCHES[index],index};
}

export function buildZiWeiCalendarRepresentationV2(input, options={}){
  const policy=assertZiWeiPolicyConsumable(options.policy);
  if(!input || typeof input!=='object') throw Object.assign(new Error('Canonical birth input is required.'),{code:'ZWR_INPUT_REQUIRED'});
  if(input.timeAccuracy!=='EXACT') throw Object.assign(new Error('Zi Wei natal v1 requires exact birth time for deterministic palace construction.'),{code:'ZWR_EXACT_BIRTH_TIME_REQUIRED'});
  assertIsoDate(input.birthDate); assertTime(input.birthTime);
  if(!input.timezone?.iana || !input.timezone?.utcOffsetAtBirth) throw Object.assign(new Error('Governed timezone metadata is required.'),{code:'ZWR_TIMEZONE_REQUIRED'});
  const {h}=assertTime(input.birthTime);
  const dayShift = h>=23 ? 1 : 0;
  const effectiveCivilDate=dayShift ? addCivilDays(input.birthDate,1) : input.birthDate;
  const lunar=solarToLunar(effectiveCivilDate);
  const effectiveMonthForRules = lunar.isLeap && lunar.lunarDay>=16 ? (lunar.lunarMonth===12?1:lunar.lunarMonth+1) : lunar.lunarMonth;
  const hourBranch=hourBranchFromLocalTime(input.birthTime);
  const yearStemIndex=((lunar.lunarYear-4)%10+10)%10;
  const yearBranchIndex=((lunar.lunarYear-4)%12+12)%12;
  return {
    schemaVersion:'PHI-OS-ZWR-CALENDAR-REPRESENTATION-v2.0.0',
    methodCode:'ZI_WEI_DOU_SHU',
    sourceBirthDate:input.birthDate,
    sourceBirthTime:input.birthTime,
    timezone:{iana:input.timezone.iana,utcOffsetAtBirth:input.timezone.utcOffsetAtBirth,source:input.timezone.source||null},
    dayBoundary:{policyCode:'ZI_INITIAL_23_00_NEXT_DAY_V1',dayShift,effectiveCivilDate},
    lunar:{...lunar,effectiveMonthForRules,leapMonthPolicy:'LEAP_MONTH_SPLIT_15_16_V1'},
    birthHour:{...hourBranch,policyCode:'TWELVE_DOUBLE_HOURS_LOCAL_CIVIL_V1'},
    birthYear:{stem:HEAVENLY_STEMS[yearStemIndex],branch:EARTHLY_BRANCHES[yearBranchIndex],basis:'LUNAR_YEAR'},
    authority:{calendarPolicy:'HKO_GREGORIAN_LUNAR_TABLE_V1',supportedGregorianYears:[1901,2100],humanPolicyVersion:policy.authorityVersion},
    interpretationIncluded:false
  };
}

export const _test = { solarToLunar, hourBranchFromLocalTime, LUNAR_INFO_1900_2100 };
