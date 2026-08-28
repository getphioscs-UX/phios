export const NUM_FP_SCHEMA='PHI-OS-NUM-FULL-PRODUCTION-RULES-v1.0.0';
export const NUM_FP_VERSION='1.0.0';
export const NUM_FP_CORE_ROLES=Object.freeze(['LIFE_PATH','BIRTHDAY_NUMBER','ATTITUDE_NUMBER','BIRTH_YEAR_NUMBER','BIRTH_MONTH_NUMBER','BIRTH_DAY_NUMBER']);
export const NUM_FP_PRIMARY_ROLES=Object.freeze(['LIFE_PATH','BIRTHDAY_NUMBER','ATTITUDE_NUMBER']);
export const NUM_FP_CUSTOMER_RELATION_ROLES=Object.freeze(['LIFE_PATH','BIRTHDAY_NUMBER','ATTITUDE_NUMBER','BIRTH_YEAR_NUMBER','BIRTH_MONTH_NUMBER']);
export const NUM_FP_DERIVATION_ALIASES=Object.freeze({BIRTH_DAY_NUMBER:'BIRTHDAY_NUMBER'});
export const NUM_FP_CALENDAR_CYCLES=Object.freeze(['UNIVERSAL_YEAR','PERSONAL_YEAR','PERSONAL_MONTH','PERSONAL_DAY']);
export const NUM_FP_LIFE_STAGE_CYCLES=Object.freeze(['PINNACLE_CYCLE','CHALLENGE_CYCLE']);
export const NUM_FP_MASTER_NUMBERS=Object.freeze([11,22,33]);
export const NUM_FP_RICH_MEANING_DOMAIN=Object.freeze([1,2,3,4,5,6,7,8,9,11,22,33]);
export const NUM_FP_KARMIC_DEBT_CANDIDATE_RAW_VALUES=Object.freeze([13,14,16,19]);

const LABELS=Object.freeze({
 LIFE_PATH:{en:'Life Path',zh:'生命路径',briefEn:'primary whole-birth-date role',briefZh:'整组出生日期形成的主要位置'},
 BIRTHDAY_NUMBER:{en:'Birthday Number',zh:'生日数',briefEn:'day-of-birth role',briefZh:'由出生日期中的“日”形成的位置'},
 ATTITUDE_NUMBER:{en:'Attitude Number',zh:'态度数',briefEn:'month-plus-day role',briefZh:'由出生月与出生日组合形成的位置'},
 BIRTH_YEAR_NUMBER:{en:'Birth Year Number',zh:'出生年数',briefEn:'birth-year role',briefZh:'由出生年份形成的位置'},
 BIRTH_MONTH_NUMBER:{en:'Birth Month Number',zh:'出生月数',briefEn:'birth-month role',briefZh:'由出生月份形成的位置'},
 BIRTH_DAY_NUMBER:{en:'Birth Day Number',zh:'出生日数',briefEn:'birth-day role',briefZh:'由出生日形成的位置'},
 UNIVERSAL_YEAR:{en:'Universal Year',zh:'普遍年',briefEn:'target-year structural cycle',briefZh:'目标年份形成的结构周期'},
 PERSONAL_YEAR:{en:'Personal Year',zh:'个人年',briefEn:'birth month + day + target-year cycle',briefZh:'出生月、日与目标年份组合形成的周期'},
 PERSONAL_MONTH:{en:'Personal Month',zh:'个人月',briefEn:'personal-year + target-month cycle',briefZh:'个人年与目标月份组合形成的周期'},
 PERSONAL_DAY:{en:'Personal Day',zh:'个人日',briefEn:'personal-month + target-day cycle',briefZh:'个人月与目标日期组合形成的周期'},
 PINNACLE_CYCLE:{en:'Pinnacle',zh:'高峰周期',briefEn:'age-banded life-stage cycle',briefZh:'按年龄区间排列的生命阶段周期'},
 CHALLENGE_CYCLE:{en:'Challenge',zh:'挑战周期',briefEn:'age-banded contrast cycle',briefZh:'按年龄区间排列的差值周期'}
});

export function numFpRoleMeta(code,locale='en'){
 const item=LABELS[code]||{en:String(code||'Unknown').replaceAll('_',' '),zh:String(code||'未知').replaceAll('_',' '),briefEn:'calculated structural role',briefZh:'已计算的结构位置'};
 return Object.freeze({code,label:locale==='zh-Hans'?item.zh:item.en,brief:locale==='zh-Hans'?item.briefZh:item.briefEn});
}
export function numFpValueMeaningCode(value){
 const n=Number(value); if(!NUM_FP_RICH_MEANING_DOMAIN.includes(n))return null;
 return `CM-NUMBER-ORIENTATION-NO${String(n).padStart(2,'0')}`;
}
export function numFpIsMaster(value){return NUM_FP_MASTER_NUMBERS.includes(Number(value));}
export function numFpIsKarmicCandidateRaw(value){return NUM_FP_KARMIC_DEBT_CANDIDATE_RAW_VALUES.includes(Number(value));}
