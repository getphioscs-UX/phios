export const ZWD_SOUTHERN_TRANSFORMATION_TABLE=Object.freeze({
 JIA:Object.freeze(['LIAN_ZHEN','PO_JUN','WU_QU','TAI_YANG']),YI:Object.freeze(['TIAN_JI','TIAN_LIANG','ZI_WEI','TAI_YIN']),BING:Object.freeze(['TIAN_TONG','TIAN_JI','WEN_CHANG','LIAN_ZHEN']),DING:Object.freeze(['TAI_YIN','TIAN_TONG','TIAN_JI','JU_MEN']),WU:Object.freeze(['TAN_LANG','TAI_YIN','YOU_BI','TIAN_JI']),JI:Object.freeze(['WU_QU','TAN_LANG','TIAN_LIANG','WEN_QU']),GENG:Object.freeze(['TAI_YANG','WU_QU','TAI_YIN','TIAN_TONG']),XIN:Object.freeze(['JU_MEN','TAI_YANG','WEN_QU','WEN_CHANG']),REN:Object.freeze(['TIAN_LIANG','ZI_WEI','ZUO_FU','WU_QU']),GUI:Object.freeze(['PO_JUN','JU_MEN','TAI_YIN','TAN_LANG'])
});
export const ZWD_DYNAMIC_POLICY = Object.freeze({
  schemaVersion:'PHI-OS-ZI-WEI-DYNAMIC-POLICY-v2.0.0',authorityCode:'ZI_WEI_DYNAMIC_DOMAIN_POLICY',authorityVersion:'2.0.0',scopeCode:'ZI_WEI_DYNAMIC_DOMAIN_RUNTIME_V2',status:'HUMAN_FROZEN',
  periodScope:Object.freeze({included:Object.freeze(['NATAL_CHART','DA_XIAN','LIU_NIAN']),deferred:Object.freeze(['LIU_YUE','LIU_RI','LIU_SHI','XIAO_XIAN','DOU_JUN'])}),
  daXian:Object.freeze({periodLengthNominalYears:10,firstPeriodStartAgeBasis:'FIVE_ELEMENT_BUREAU_NUMBER',ageConvention:'LUNAR_YEAR_NOMINAL_AGE',supportedPalacePeriods:12}),
  annual:Object.freeze({boundary:'ZI_WEI_LUNAR_YEAR',lifePalaceBasis:'TARGET_LUNAR_YEAR_EARTHLY_BRANCH'}),
  transformations:Object.freeze({tableAuthority:'BIRTH_YEAR_STEM_FOUR_TRANSFORMATIONS_SOUTHERN_TABLE_V1',table:ZWD_SOUTHERN_TRANSFORMATION_TABLE,daXianStemBasis:'NATAL_PALACE_STEM_AT_CURRENT_DA_XIAN_LIFE_BRANCH',annualStemBasis:'TARGET_LUNAR_YEAR_HEAVENLY_STEM'}),
  calendar:Object.freeze({authority:'HKO_GREGORIAN_LUNAR_TABLE_V1',executableTable:'ZWR_LUNAR_INFO_1900_2100',supportedGregorianYears:Object.freeze([1901,2100]),dayBoundary:'ZI_INITIAL_23_00_NEXT_DAY_V1'}),
  boundaries:Object.freeze({predictionAuthorityGranted:false,methodVotingAllowed:false,natalProjectionMutationAllowed:false})
});
export const ZWD_PRODUCTION_ACTIVATION=Object.freeze({status:'PRODUCTION_ACTIVATED_BOUND_SCOPE',capabilityCode:'ZI_WEI_DYNAMIC_DOMAIN',capabilityVersion:'2.0.0',productionExecutionAllowed:true,frontendExecutionAllowed:true,meaningAllowed:true,readingAllowed:true,predictionAllowed:false,monthlyDailyHourlyAllowed:false});
export function assertZwdProductionActivated(){if(ZWD_PRODUCTION_ACTIVATION.productionExecutionAllowed!==true)throw Object.assign(new Error('ZWD_PRODUCTION_NOT_ACTIVATED'),{code:'ZWD_PRODUCTION_NOT_ACTIVATED'});return ZWD_PRODUCTION_ACTIVATION;}
export function assertZwdPolicy(){if(ZWD_DYNAMIC_POLICY.status!=='HUMAN_FROZEN')throw Object.assign(new Error('ZWD_DYNAMIC_POLICY_NOT_FROZEN'),{code:'ZWD_DYNAMIC_POLICY_NOT_FROZEN'});return ZWD_DYNAMIC_POLICY;}
