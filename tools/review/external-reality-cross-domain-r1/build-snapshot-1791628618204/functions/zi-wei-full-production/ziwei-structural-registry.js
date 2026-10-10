export const ZIWEI_FP_STRUCTURAL_REGISTRY_VERSION='1.0.0';

export const BRANCH_ORDER=Object.freeze(['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI']);
export const STEM_ORDER=Object.freeze(['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI']);

export const BRANCH_ZH=Object.freeze({ZI:'子',CHOU:'丑',YIN:'寅',MAO:'卯',CHEN:'辰',SI:'巳',WU:'午',WEI:'未',SHEN:'申',YOU:'酉',XU:'戌',HAI:'亥'});
export const STEM_ZH=Object.freeze({JIA:'甲',YI:'乙',BING:'丙',DING:'丁',WU:'戊',JI:'己',GENG:'庚',XIN:'辛',REN:'壬',GUI:'癸'});
export const PALACE_ZH=Object.freeze({LIFE:'命宫',SIBLINGS:'兄弟宫',SPOUSE:'夫妻宫',CHILDREN:'子女宫',WEALTH:'财帛宫',HEALTH:'疾厄宫',TRAVEL:'迁移宫',FRIENDS:'仆役宫',CAREER:'官禄宫',PROPERTY:'田宅宫',WELLBEING:'福德宫',PARENTS:'父母宫'});
export const PALACE_EN=Object.freeze({LIFE:'Life',SIBLINGS:'Siblings',SPOUSE:'Spouse',CHILDREN:'Children',WEALTH:'Wealth',HEALTH:'Health',TRAVEL:'Travel',FRIENDS:'Friends',CAREER:'Career',PROPERTY:'Property',WELLBEING:'Wellbeing',PARENTS:'Parents'});

export const STAR_ZH=Object.freeze({
 ZI_WEI:'紫微',TIAN_JI:'天机',TAI_YANG:'太阳',WU_QU:'武曲',TIAN_TONG:'天同',LIAN_ZHEN:'廉贞',TIAN_FU:'天府',TAI_YIN:'太阴',TAN_LANG:'贪狼',JU_MEN:'巨门',TIAN_XIANG:'天相',TIAN_LIANG:'天梁',QI_SHA:'七杀',PO_JUN:'破军',
 ZUO_FU:'左辅',YOU_BI:'右弼',WEN_CHANG:'文昌',WEN_QU:'文曲',TIAN_KUI:'天魁',TIAN_YUE:'天钺',LU_CUN:'禄存',QING_YANG:'擎羊',TUO_LUO:'陀罗',HUO_XING:'火星',LING_XING:'铃星',DI_KONG:'地空',DI_JIE:'地劫',TIAN_MA:'天马'
});
export const TRANSFORMATION_ZH=Object.freeze({HUA_LU:'化禄',HUA_QUAN:'化权',HUA_KE:'化科',HUA_JI:'化忌'});
export const BUREAU_ZH=Object.freeze({WATER_2:'水二局',WOOD_3:'木三局',METAL_4:'金四局',EARTH_5:'土五局',FIRE_6:'火六局'});

export const MAIN_STARS=Object.freeze(['ZI_WEI','TIAN_JI','TAI_YANG','WU_QU','TIAN_TONG','LIAN_ZHEN','TIAN_FU','TAI_YIN','TAN_LANG','JU_MEN','TIAN_XIANG','TIAN_LIANG','QI_SHA','PO_JUN']);
export const FROZEN_SUPPORT_STARS=Object.freeze(['ZUO_FU','YOU_BI','WEN_CHANG','WEN_QU','TIAN_KUI','TIAN_YUE']);
export const FP_EXTENSION_STARS=Object.freeze(['LU_CUN','QING_YANG','TUO_LUO','HUO_XING','LING_XING','DI_KONG','DI_JIE','TIAN_MA']);

export const STAR_CLASS=Object.freeze(Object.fromEntries([
 ...MAIN_STARS.map(code=>[code,'MAIN']),
 ...FROZEN_SUPPORT_STARS.map(code=>[code,'SUPPORT']),
 ['LU_CUN','RESOURCE_SUPPORT'],['QING_YANG','MALEFIC'],['TUO_LUO','MALEFIC'],['HUO_XING','MALEFIC'],['LING_XING','MALEFIC'],['DI_KONG','MALEFIC'],['DI_JIE','MALEFIC'],['TIAN_MA','MOBILITY']
]));

export const STAR_STATE_VOCABULARY=Object.freeze({
 MIAO:{zh:'庙',rank:null},WANG:{zh:'旺',rank:null},DE:{zh:'得',rank:null},LI:{zh:'利',rank:null},PING:{zh:'平',rank:null},BU:{zh:'不',rank:null},XIAN:{zh:'陷',rank:null},UNSPECIFIED:{zh:'未载明',rank:null}
});

export function mod(n,m=12){return ((n%m)+m)%m;}
export function branchIndex(code){const i=BRANCH_ORDER.indexOf(code);if(i<0)throw Object.assign(new Error(`ZIWEI_FP_UNKNOWN_BRANCH:${code}`),{code:'ZIWEI_FP_UNKNOWN_BRANCH'});return i;}
export function branchAt(index){return BRANCH_ORDER[mod(index)];}
export function labelStar(code){return STAR_ZH[code]||code;}
export function labelBranch(code){return BRANCH_ZH[code]||code;}
export function labelStem(code){return STEM_ZH[code]||code;}
export function labelPalace(code){return PALACE_ZH[code]||code;}
