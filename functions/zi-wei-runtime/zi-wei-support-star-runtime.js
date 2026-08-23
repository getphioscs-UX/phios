import { EARTHLY_BRANCHES, branchIndex, mod } from './zwr-utils.js';
const KUI_YUE={
 JIA:['CHOU','WEI'],WU:['CHOU','WEI'],GENG:['CHOU','WEI'],YI:['ZI','SHEN'],JI:['ZI','SHEN'],XIN:['WU','YIN'],BING:['HAI','YOU'],DING:['HAI','YOU'],REN:['MAO','SI'],GUI:['MAO','SI']
};
export function placeZiWeiSupportStars(calendar){
  const month=calendar?.lunar?.effectiveMonthForRules; const hour=calendar?.birthHour?.index; const stem=calendar?.birthYear?.stem;
  if(!Number.isInteger(month)||!Number.isInteger(hour)||!KUI_YUE[stem]) throw Object.assign(new Error('Calendar month/hour/year stem required'),{code:'ZWR_SUPPORT_STAR_INPUT_REQUIRED'});
  const branch=(idx)=>EARTHLY_BRANCHES[mod(idx,12)];
  const chen=branchIndex('CHEN'), xu=branchIndex('XU');
  const [kui,yue]=KUI_YUE[stem];
  const stars=[
    {starCode:'ZUO_FU',branch:branch(chen+month-1),basis:'EFFECTIVE_LUNAR_MONTH'},
    {starCode:'YOU_BI',branch:branch(xu-(month-1)),basis:'EFFECTIVE_LUNAR_MONTH'},
    {starCode:'WEN_CHANG',branch:branch(xu-hour),basis:'BIRTH_HOUR'},
    {starCode:'WEN_QU',branch:branch(chen+hour),basis:'BIRTH_HOUR'},
    {starCode:'TIAN_KUI',branch:kui,basis:'LUNAR_BIRTH_YEAR_STEM'},
    {starCode:'TIAN_YUE',branch:yue,basis:'LUNAR_BIRTH_YEAR_STEM'}
  ];
  return {schemaVersion:'PHI-OS-ZWR-SUPPORT-STAR-PLACEMENT-v1.0.0',scopeCode:'SIX_SUPPORT_STARS_V1',stars,starCount:6,interpretationIncluded:false};
}
