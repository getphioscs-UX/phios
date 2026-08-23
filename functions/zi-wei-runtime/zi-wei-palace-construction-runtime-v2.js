import { assertZiWeiPolicyConsumable } from './policy-gate.js';
import { EARTHLY_BRANCHES, HEAVENLY_STEMS, branchIndex, mod } from './zwr-utils.js';

const PALACES=['LIFE','SIBLINGS','SPOUSE','CHILDREN','WEALTH','HEALTH','TRAVEL','FRIENDS','CAREER','PROPERTY','WELLBEING','PARENTS'];
const YIN=branchIndex('YIN');
const TIGER_START={JIA:'BING',JI:'BING',YI:'WU',GENG:'WU',BING:'GENG',XIN:'GENG',DING:'REN',REN:'REN',WU:'JIA',GUI:'JIA'};
const ELEMENT_BY_SUM={1:{element:'WOOD',bureau:3},2:{element:'METAL',bureau:4},3:{element:'WATER',bureau:2},4:{element:'FIRE',bureau:6},5:{element:'EARTH',bureau:5}};
function palaceStem(yearStem, branchCode){
  const start=HEAVENLY_STEMS.indexOf(TIGER_START[yearStem]);
  if(start<0) throw Object.assign(new Error('Unsupported birth-year stem'),{code:'ZWR_YEAR_STEM_INVALID'});
  const offset=mod(branchIndex(branchCode)-YIN,12);
  return HEAVENLY_STEMS[mod(start+offset,10)];
}
function fiveElementBureau(stem,branch){
  const stemValue=Math.floor(HEAVENLY_STEMS.indexOf(stem)/2)+1;
  const b=branchIndex(branch);
  const branchValue=([0,1,6,7].includes(b)?1:[2,3,8,9].includes(b)?2:3);
  let n=stemValue+branchValue; if(n>5)n-=5;
  return {...ELEMENT_BY_SUM[n],numericRuleResult:n,stemValue,branchValue};
}
export function buildZiWeiPalaceStructureV2(calendar, options={}){
  assertZiWeiPolicyConsumable(options.policy);
  if(!calendar?.lunar || !calendar?.birthHour) throw Object.assign(new Error('ZiWeiCalendarRepresentation v2 required'),{code:'ZWR_CALENDAR_REPRESENTATION_REQUIRED'});
  const month=calendar.lunar.effectiveMonthForRules;
  const hourIndex=calendar.birthHour.index;
  const monthBranchIndex=mod(YIN+(month-1),12);
  const lifeIndex=mod(monthBranchIndex-hourIndex,12);
  const bodyIndex=mod(monthBranchIndex+hourIndex,12);
  const lifeBranch=EARTHLY_BRANCHES[lifeIndex];
  const bodyBranch=EARTHLY_BRANCHES[bodyIndex];
  const palaces=PALACES.map((palaceCode,i)=>{
    const idx=mod(lifeIndex-i,12); const branch=EARTHLY_BRANCHES[idx];
    return {palaceCode,branch,stem:palaceStem(calendar.birthYear.stem,branch),isBodyPalace:idx===bodyIndex};
  });
  const life=palaces[0];
  const bureau=fiveElementBureau(life.stem,life.branch);
  return {
    schemaVersion:'PHI-OS-ZWR-PALACE-STRUCTURE-IR-v2.0.0',
    lifePalace:{branch:lifeBranch,stem:life.stem}, bodyPalace:{branch:bodyBranch,stem:palaceStem(calendar.birthYear.stem,bodyBranch)},
    palaces, fiveElementBureau:{...bureau,code:`${bureau.element}_${bureau.bureau}`},
    construction:{effectiveLunarMonth:month,birthHourBranch:calendar.birthHour.code,policyCode:'STANDARD_YIN_MONTH_REVERSE_HOUR_PALACES_V1'},
    interpretationIncluded:false
  };
}
export const _test={palaceStem,fiveElementBureau,PALACES};
