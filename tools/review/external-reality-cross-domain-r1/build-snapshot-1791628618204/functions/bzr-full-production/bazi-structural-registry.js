/** BAZI-FP structural identity tables. These are structural mappings only; they do not create customer meaning. */
export const BAZI_STRUCTURAL_REGISTRY_VERSION='1.0.0';

export const STEMS=Object.freeze({
  JIA:Object.freeze({code:'JIA',zh:'甲',element:'WOOD',polarity:'YANG'}),
  YI:Object.freeze({code:'YI',zh:'乙',element:'WOOD',polarity:'YIN'}),
  BING:Object.freeze({code:'BING',zh:'丙',element:'FIRE',polarity:'YANG'}),
  DING:Object.freeze({code:'DING',zh:'丁',element:'FIRE',polarity:'YIN'}),
  WU:Object.freeze({code:'WU',zh:'戊',element:'EARTH',polarity:'YANG'}),
  JI:Object.freeze({code:'JI',zh:'己',element:'EARTH',polarity:'YIN'}),
  GENG:Object.freeze({code:'GENG',zh:'庚',element:'METAL',polarity:'YANG'}),
  XIN:Object.freeze({code:'XIN',zh:'辛',element:'METAL',polarity:'YIN'}),
  REN:Object.freeze({code:'REN',zh:'壬',element:'WATER',polarity:'YANG'}),
  GUI:Object.freeze({code:'GUI',zh:'癸',element:'WATER',polarity:'YIN'})
});

export const BRANCHES=Object.freeze({
  ZI:Object.freeze({code:'ZI',zh:'子',element:'WATER',hiddenStems:['GUI']}),
  CHOU:Object.freeze({code:'CHOU',zh:'丑',element:'EARTH',hiddenStems:['JI','GUI','XIN']}),
  YIN:Object.freeze({code:'YIN',zh:'寅',element:'WOOD',hiddenStems:['JIA','BING','WU']}),
  MAO:Object.freeze({code:'MAO',zh:'卯',element:'WOOD',hiddenStems:['YI']}),
  CHEN:Object.freeze({code:'CHEN',zh:'辰',element:'EARTH',hiddenStems:['WU','YI','GUI']}),
  SI:Object.freeze({code:'SI',zh:'巳',element:'FIRE',hiddenStems:['BING','WU','GENG']}),
  WU:Object.freeze({code:'WU',zh:'午',element:'FIRE',hiddenStems:['DING','JI']}),
  WEI:Object.freeze({code:'WEI',zh:'未',element:'EARTH',hiddenStems:['JI','DING','YI']}),
  SHEN:Object.freeze({code:'SHEN',zh:'申',element:'METAL',hiddenStems:['GENG','REN','WU']}),
  YOU:Object.freeze({code:'YOU',zh:'酉',element:'METAL',hiddenStems:['XIN']}),
  XU:Object.freeze({code:'XU',zh:'戌',element:'EARTH',hiddenStems:['WU','XIN','DING']}),
  HAI:Object.freeze({code:'HAI',zh:'亥',element:'WATER',hiddenStems:['REN','JIA']})
});

export const SEASON_BY_MONTH_BRANCH=Object.freeze({
  YIN:'SPRING',MAO:'SPRING',CHEN:'LATE_SPRING',
  SI:'SUMMER',WU:'SUMMER',WEI:'LATE_SUMMER',
  SHEN:'AUTUMN',YOU:'AUTUMN',XU:'LATE_AUTUMN',
  HAI:'WINTER',ZI:'WINTER',CHOU:'LATE_WINTER'
});

export const STEM_COMBINATIONS=Object.freeze([
  ['JIA','JI'],['YI','GENG'],['BING','XIN'],['DING','REN'],['WU','GUI']
]);
export const BRANCH_SIX_COMBINATIONS=Object.freeze([
  ['ZI','CHOU'],['YIN','HAI'],['MAO','XU'],['CHEN','YOU'],['SI','SHEN'],['WU','WEI']
]);
export const BRANCH_CLASHES=Object.freeze([
  ['ZI','WU'],['CHOU','WEI'],['YIN','SHEN'],['MAO','YOU'],['CHEN','XU'],['SI','HAI']
]);
export const BRANCH_HARMS=Object.freeze([
  ['ZI','WEI'],['CHOU','WU'],['YIN','SI'],['MAO','CHEN'],['SHEN','HAI'],['YOU','XU']
]);
export const BRANCH_BREAKS=Object.freeze([
  ['ZI','YOU'],['MAO','WU'],['CHEN','CHOU'],['XU','WEI'],['YIN','HAI'],['SI','SHEN']
]);
export const THREE_HARMONIES=Object.freeze([
  Object.freeze({branches:['SHEN','ZI','CHEN'],element:'WATER'}),
  Object.freeze({branches:['HAI','MAO','WEI'],element:'WOOD'}),
  Object.freeze({branches:['YIN','WU','XU'],element:'FIRE'}),
  Object.freeze({branches:['SI','YOU','CHOU'],element:'METAL'})
]);
export const THREE_MEETINGS=Object.freeze([
  Object.freeze({branches:['YIN','MAO','CHEN'],element:'WOOD'}),
  Object.freeze({branches:['SI','WU','WEI'],element:'FIRE'}),
  Object.freeze({branches:['SHEN','YOU','XU'],element:'METAL'}),
  Object.freeze({branches:['HAI','ZI','CHOU'],element:'WATER'})
]);
export const THREE_PUNISHMENT_GROUPS=Object.freeze([
  Object.freeze({branches:['YIN','SI','SHEN'],code:'YIN_SI_SHEN'}),
  Object.freeze({branches:['CHOU','XU','WEI'],code:'CHOU_XU_WEI'})
]);
export const SELF_PUNISHMENT_BRANCHES=Object.freeze(['CHEN','WU','YOU','HAI']);

export const TEN_GODS=Object.freeze({
  BI_JIAN:Object.freeze({code:'BI_JIAN',zh:'比肩',en:'Peer'}),
  JIE_CAI:Object.freeze({code:'JIE_CAI',zh:'劫财',en:'Rob Wealth'}),
  SHI_SHEN:Object.freeze({code:'SHI_SHEN',zh:'食神',en:'Eating God'}),
  SHANG_GUAN:Object.freeze({code:'SHANG_GUAN',zh:'伤官',en:'Hurting Officer'}),
  PIAN_CAI:Object.freeze({code:'PIAN_CAI',zh:'偏财',en:'Indirect Wealth'}),
  ZHENG_CAI:Object.freeze({code:'ZHENG_CAI',zh:'正财',en:'Direct Wealth'}),
  QI_SHA:Object.freeze({code:'QI_SHA',zh:'七杀',en:'Seven Killings'}),
  ZHENG_GUAN:Object.freeze({code:'ZHENG_GUAN',zh:'正官',en:'Direct Officer'}),
  PIAN_YIN:Object.freeze({code:'PIAN_YIN',zh:'偏印',en:'Indirect Resource'}),
  ZHENG_YIN:Object.freeze({code:'ZHENG_YIN',zh:'正印',en:'Direct Resource'})
});

const GENERATES=Object.freeze({WOOD:'FIRE',FIRE:'EARTH',EARTH:'METAL',METAL:'WATER',WATER:'WOOD'});
const CONTROLS=Object.freeze({WOOD:'EARTH',EARTH:'WATER',WATER:'FIRE',FIRE:'METAL',METAL:'WOOD'});

export function stemIdentity(code){const x=STEMS[code];if(!x)throw new TypeError(`UNKNOWN_BAZI_STEM:${code}`);return x;}
export function branchIdentity(code){const x=BRANCHES[code];if(!x)throw new TypeError(`UNKNOWN_BAZI_BRANCH:${code}`);return x;}
export function elementRelation(subjectElement,targetElement){
  if(subjectElement===targetElement)return 'SAME_ELEMENT';
  if(GENERATES[subjectElement]===targetElement)return 'SUBJECT_GENERATES_TARGET';
  if(GENERATES[targetElement]===subjectElement)return 'TARGET_GENERATES_SUBJECT';
  if(CONTROLS[subjectElement]===targetElement)return 'SUBJECT_CONTROLS_TARGET';
  if(CONTROLS[targetElement]===subjectElement)return 'TARGET_CONTROLS_SUBJECT';
  throw new TypeError(`UNKNOWN_ELEMENT_RELATION:${subjectElement}:${targetElement}`);
}
export function tenGodFor(dayStemCode,targetStemCode){
  const day=stemIdentity(dayStemCode),target=stemIdentity(targetStemCode),samePolarity=day.polarity===target.polarity;
  const relation=elementRelation(day.element,target.element);
  let code;
  if(relation==='SAME_ELEMENT')code=samePolarity?'BI_JIAN':'JIE_CAI';
  else if(relation==='SUBJECT_GENERATES_TARGET')code=samePolarity?'SHI_SHEN':'SHANG_GUAN';
  else if(relation==='SUBJECT_CONTROLS_TARGET')code=samePolarity?'PIAN_CAI':'ZHENG_CAI';
  else if(relation==='TARGET_CONTROLS_SUBJECT')code=samePolarity?'QI_SHA':'ZHENG_GUAN';
  else if(relation==='TARGET_GENERATES_SUBJECT')code=samePolarity?'PIAN_YIN':'ZHENG_YIN';
  return TEN_GODS[code];
}
