import {buildMarketBrief,MARKET_CONTRACT,MARKET_DIMENSIONS,MARKET_PROMPT} from './bazi-s04-market-reading.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const TIMING_VERSION='PHI-OS-BAZI-S08-MARKET-v1.0.0';
export const TIMING_ROLES=['NATAL_BASELINE','CURRENT_DA_YUN','CURRENT_ANNUAL','NATAL_TIMING_INTERACTIONS','OPPORTUNITY_THEMES','CAUTION_THEMES','TIMING_GUIDANCE'];
export const TIMING_HEADINGS={
 NATAL_BASELINE:['本命时间基线','Natal timing baseline'],
 CURRENT_DA_YUN:['当前大运','Current Da Yun'],
 CURRENT_ANNUAL:['当前流年','Current annual layer'],
 NATAL_TIMING_INTERACTIONS:['运年与原局关系','Timing interactions with the natal chart'],
 OPPORTUNITY_THEMES:['这一阶段可利用的主题','Themes to use'],
 CAUTION_THEMES:['这一阶段要留意的主题','Themes to watch'],
 TIMING_GUIDANCE:['阶段导航','Timing guidance']
};
export const TIMING_DIMENSIONS=[...MARKET_DIMENSIONS,'DA_YUN_FULL_TRACE','ANNUAL_FULL_TRACE','NO_EVENT_PREDICTION','NATAL_TIMING_LAYER_SEPARATION'];
export const TIMING_CONTRACT={...MARKET_CONTRACT,version:TIMING_VERSION,roles:TIMING_ROLES,headings:TIMING_HEADINGS,dimensions:TIMING_DIMENSIONS,scope:'BZR/S08_TIMING/BASELINE_REVIEW_ONLY',priorOwnerGate:'S02_S03_S04_S05_OWNER_ACCEPTED'};
export const TIMING_PROMPT=MARKET_PROMPT.replaceAll('career','timing').replaceAll('Career','Timing').replaceAll('S04:V4','S08:MARKET1')+`
S08 is the timing chapter. It must clearly separate natal structure, current Da Yun and current annual layer. Use only the supplied timing authority; do not calculate additional cycles or dates.
Always state the complete current Da Yun stem+branch, age interval, stem Ten God, relevant hidden-stem Ten Gods and admitted natal interactions. Always state the annual year, stem+branch and stem Ten God. Explain what each layer adds relative to the natal chart.
No event prediction: no guaranteed promotion, wealth, marriage, pregnancy, illness, accident, legal event, relocation, loss, windfall, separation or exact event date. No 'good year/bad year' score. Combination does not mean transformation; harm/punishment does not prove an event.
Use timing language such as more worth watching, easier to encounter as a theme, requires more attention, or creates a different emphasis. Do not claim observed past events. Return structured JSON only.`;

export async function buildTimingBrief(input){
 const base=await buildMarketBrief({...input,topicCode:'LIFE_OPERATION'});
 const plans=[
  '先用本命日主、月令、主要十神与原局关系建立时间基线，明确本命是长期结构，不把大运或流年特征倒写成本命人格。',
  '完整说明当前大运干支、年龄区间、天干十神与地支藏干重点；解释它相对本命新增或放大的主题，只使用已有 authority，不计算额外起运或换运日期。',
  '完整说明当前流年年份、干支及天干十神，并区分年度层与十年层。解释年度主题怎样叠加在大运和本命之上，不把一年写成命运结论。',
  '列出当前大运/流年与原局实际确认的合、刑、害或其他关系，并保留涉及的柱位。合不等于合化，刑害不等于事故、冲突或损失事件。',
  '从当前新增或加强的十神主题中提炼可利用方向，例如表达、学习、责任、收入交换、合作或自主；每一点必须说明来自大运还是流年。',
  '说明阶段内需要留意的负荷、资源承诺、关系边界或执行压力。不得写某年必然升职、发财、结婚、生病、搬迁、诉讼或发生任何具体事件。',
  '用“本命—大运—流年”三层收束：哪些主题是长期底色、哪些是十年重点、哪些只是年度强调，并给出少量现实观察问题。'
 ];
 const {briefSemanticDigest,careerNarrativeIR,...seed}=base;
 const claims=TIMING_ROLES.map((role,i)=>({...base.claims[i],claimId:'S08:MARKET1:'+role,role,text:plans[i]}));
 const synthesis={...base.synthesis,timing:'本命、当前大运与流年必须分层解释；运年只改变阶段重点，不自动生成具体事件。',combination:'时间层的合、刑、害只说明结构互动；不等于合化、事故、婚恋、财富或健康事件。'};
 const timingNarrativeIR={...careerNarrativeIR,version:TIMING_VERSION,synthesis,nodes:claims,topic:'LIFE_OPERATION'};
 const next={...seed,sectionKey:'S08_TIMING',successorVersion:TIMING_VERSION,successorPromptVersion:'RNT2-TIMING-PROMPT-v1.0.0',claimIrVersion:TIMING_VERSION,sourceAuthorityVersion:TIMING_VERSION,marketDomain:'TIMING',marketContract:TIMING_CONTRACT,requiredClaimRoles:TIMING_ROLES,paragraphFunctions:TIMING_ROLES,claims,synthesis,timingNarrativeIR};
 return deepFreeze({...next,briefSemanticDigest:await sha256Stable(next)});
}
