import {ZIWEI_PRO_R2_STAR_PROFILES_V2 as PROFILES,ZIWEI_PRO_R2_PALACE_LENSES as LENSES,ZIWEI_PRO_R2_TRANSFORMATION_MODIFIERS as MODIFIERS} from '../../zi-wei-full-production/ziwei-professional-reading-r2-authority-v2.js';
export const ZIWEI_REPORT_VERSION='ZIWEI-SEMANTIC-PRODUCTION-R1';
export const ENTITY_TYPES=['PALACE','STAR','STAR_PLACEMENT','TRANSFORMATION','STAR_GROUP','PALACE_RELATIONSHIP','OPPOSITION','TRIAD','AXIS','PATTERN','TIMING_LAYER','CONDITION','COUNTERWEIGHT','OBSERVABLE_EXPRESSION','NAVIGATION_IMPLICATION'];
export const CLAIM_TYPES=['BASELINE_STRUCTURE','DOMINANT_SIGNAL','SUPPORTING_SIGNAL','COUNTERWEIGHT','STRUCTURAL_TENSION','CONDITIONAL_EXPRESSION','TIMING_MODIFIER','OBSERVABLE_EXPRESSION','NAVIGATION_IMPLICATION','UNKNOWN'];
export const PROHIBITED=['MEDICAL_DIAGNOSIS','GUARANTEED_WEALTH','GUARANTEED_MARRIAGE','FIXED_PROFESSION','EVENT_CERTAINTY','UNADMITTED_SCHOOL_MIXING'];
export const AUTHORITIES={
 calculation:['functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js','content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json','functions/zi-wei-full-production/ziwei-source-admission-authority-v1.js','functions/zi-wei-dynamic/dynamic-runtime.js'],
 semantic:['functions/zi-wei-full-production/ziwei-professional-reading-r2-authority-v2.js','functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js','functions/zi-wei-full-production/ziwei-four-transformation-matrix-runtime.js','functions/zi-wei-full-production/ziwei-palace-relationship-engine.js','functions/zi-wei-full-production/ziwei-pattern-rule-authority-v1.js','functions/zi-wei-dynamic/dynamic-meaning-runtime.js'],
 editorial:['functions/zi-wei-full-production/ziwei-professional-reading-r2-runtime-v2.js','functions/zi-wei-full-production/ziwei-customer-report-runtime.js'],
 publication:['functions/zi-wei-full-production/ziwei-current-publication-envelope-runtime.js','functions/personal-reading/narrative/report-publication-ir-v2.js']
};
const section=(id,code,zh,en,primary,context,timing=['NATAL'])=>({sectionId:id,code,title:{'zh-Hans':zh,en},primaryPalaces:primary,contextPalaces:context,timingLayers:timing,evidenceRequired:true,prohibitedExtensions:PROHIBITED});
export const ZIWEI_REPORT_SECTIONS=[
 section('S01','CHART_ARCHITECTURE','命盘结构','Chart Architecture',['LIFE','BODY'],['ALL']),
 section('S02','CORE_ORIENTATION','核心运行方式','Core Orientation',['LIFE','BODY'],['CAREER','WEALTH','TRAVEL'],['NATAL','DA_XIAN','LIU_NIAN']),
 section('S03','INNER_STRUCTURE','内部结构','Inner Structure',['WELLBEING'],['LIFE','BODY']),
 section('S04','WORK_DIRECTION','工作与方向','Work & Direction',['CAREER','TRAVEL'],['LIFE','WEALTH'],['NATAL','DA_XIAN','LIU_NIAN']),
 section('S05','RESOURCES_WEALTH','资源与财富','Resources & Wealth',['WEALTH','PROPERTY'],['LIFE','CAREER'],['NATAL','DA_XIAN','LIU_NIAN']),
 section('S06','RELATIONSHIPS','关系运行','Relationships',['SPOUSE'],['CHILDREN','FRIENDS']),
 section('S07','FAMILY_SUPPORT','家庭与支持','Family & Support',['PARENTS','SIBLINGS','FRIENDS'],['LIFE']),
 section('S08','PRESSURE_VULNERABILITY','压力与脆弱点','Pressure & Vulnerability',['HEALTH'],['LIFE','WELLBEING']),
 section('S09','LONG_TERM_CYCLES','长期周期','Long-term Cycles',[],[],['DA_XIAN']),
 section('S10','CURRENT_TIMING','当前时序','Current Timing',[],[],['LIU_NIAN']),
 {...section('S11','NAVIGATION','现实导航','Navigation',[],[]),consumesPriorSectionClaims:true,mayRecalculatePalaces:false},
 {...section('S12','APPENDIX','方法与附录','Appendix',[],[]),requiredTopics:['calculation scope','school authority','timing scope','unsupported scope','terminology','sources','interpretation boundaries']}
];
export function buildZiweiSemanticCanon(){
 return {schemaVersion:ZIWEI_REPORT_VERSION,entityTypes:ENTITY_TYPES,stableIdPolicy:'ZWR:<entity type>:<canonical codes>; subject instances additionally use governed input fingerprint. No locale prose in IDs.',authorityLayers:AUTHORITIES,
  palaces:Object.values(LENSES).map(p=>({palaceId:'ZWR:PALACE:'+p.palaceCode,palaceCode:p.palaceCode,canonicalZh:p.label['zh-Hans'],canonicalEn:p.label.en,structuralRole:p.readingQuestion,primaryDomains:[p.domain],secondaryDomains:[],allowedClaims:['CONDITIONAL_DOMAIN_STRUCTURE'],restrictedClaims:PROHIBITED,relationshipRoles:['OPPOSITE','TRIAD','FLANK'],timingRoles:['NATAL_DOMAIN','DA_XIAN_FOCUS','LIU_NIAN_FOCUS'],sourceRefs:[AUTHORITIES.semantic[0]+'#ZIWEI_PRO_R2_PALACE_LENSES/'+p.palaceCode]})),
  stars:Object.values(PROFILES).map(s=>({starId:'ZWR:STAR:'+s.starCode,starCode:s.starCode,canonicalZh:s.label['zh-Hans'],canonicalEn:s.label.en,baseRole:s.dimensions.coreFunction,expressionRange:{constructive:s.dimensions.highExpression,strained:s.dimensions.strainedExpression},conditions:[s.dimensions.highExpression],counterweights:[s.dimensions.strainedExpression],amplifiers:[],constraints:[s.boundary],palaceModulation:s.dimensions,transformationInteraction:'CONTEXTUAL_MODIFIER_ONLY',sourceRefs:[AUTHORITIES.semantic[0]+'#ZIWEI_PRO_R2_STAR_PROFILES_V2/'+s.starCode,...(s.admissionRef?[s.admissionRef]:[])],authorityState:s.admissionState,customerRuntimeAllowed:s.customerRuntimeAllowed})),
  transformations:Object.entries(MODIFIERS).map(([code,m])=>({transformationId:'ZWR:TRANSFORMATION:'+code,code,...m,requires:['STAR_PLACEMENT','PALACE','TIMING_LAYER'],relationshipContext:'ATTACH_WHEN_SUPPORTED',fortuneLabel:false,sourceRefs:[AUTHORITIES.semantic[0]+'#ZIWEI_PRO_R2_TRANSFORMATION_MODIFIERS/'+code]})),
  relationshipOperators:['REINFORCEMENT','SUPPORT','AMPLIFICATION','TENSION','COUNTERWEIGHT','REDIRECTION','CONTAINMENT','ACTIVATION','MODIFICATION'].map(code=>({code,requires:['admitted semantic source','bound placement or admitted pattern','explicit conditions'],topologyAloneSufficient:false})),
  timingLayers:[{id:'ZWR:TIMING_LAYER:NATAL',role:'STRUCTURAL_BASELINE'},{id:'ZWR:TIMING_LAYER:DA_XIAN',role:'LONG_CYCLE_MODIFICATION'},{id:'ZWR:TIMING_LAYER:LIU_NIAN',role:'YEAR_LEVEL_ACTIVATION'}],excludedTiming:['LIU_YUE'],historicalAtomicEightStarOwnerUnchanged:true,unknownPolicy:'UNAVAILABLE_NEVER_GENERIC_FALLBACK',productionAdmissionGranted:false};
}
export function buildZiweiTerminologyCanon(){
 const extra=[['BODY','身宫','Body'],['SAN_FANG_SI_ZHENG','三方四正','San Fang Si Zheng'],['OPPOSITE','对宫','Opposite Palace'],['DA_XIAN','大限','Da Xian'],['LIU_NIAN','流年','Liu Nian']];
 return {schemaVersion:ZIWEI_REPORT_VERSION,appliesTo:['report','customer UI','review','Ask','appendix'],terms:[...Object.values(LENSES).map(p=>({termId:p.palaceCode,zh:p.label['zh-Hans'],en:p.label.en,zhAliases:p.palaceCode==='FRIENDS'?['交友','交友宫','仆役','仆役宫']:[p.label['zh-Hans'].replace(/宫$/,'')]})),...extra.map(([termId,zh,en])=>({termId,zh,en})),...Object.entries(MODIFIERS).map(([termId,m])=>({termId,zh:m.label['zh-Hans'],en:m.label.en}))],policy:'Existing PRO-R2 labels are canonical. Traditional synonyms normalize to IDs; do not create independent translations per surface.'};
}
export {PROFILES as ZIWEI_STAR_PROFILES,LENSES as ZIWEI_PALACE_LENSES,MODIFIERS as ZIWEI_TRANSFORMATION_MODIFIERS};
