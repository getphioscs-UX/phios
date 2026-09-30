import {buildMarketBrief,MARKET_CONTRACT,MARKET_DIMENSIONS,MARKET_PROMPT} from './bazi-s04-market-reading.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const GUIDANCE_VERSION='PHI-OS-BAZI-S09-MARKET-v1.0.0';
export const GUIDANCE_ROLES=['PRIORITY_MAP','CAPABILITY_TO_USE','BOUNDARIES_TO_KEEP','RESOURCES_TO_PROTECT','CURRENT_STAGE_CHOICES','REALITY_CHECKS','NAVIGATION_SUMMARY'];
export const GUIDANCE_HEADINGS={
 PRIORITY_MAP:['当前优先级','Current priorities'],
 CAPABILITY_TO_USE:['可以调用的能力','Capabilities to use'],
 BOUNDARIES_TO_KEEP:['需要保留的边界','Boundaries to keep'],
 RESOURCES_TO_PROTECT:['需要保护的资源','Resources to protect'],
 CURRENT_STAGE_CHOICES:['当前阶段的取舍','Choices for the current stage'],
 REALITY_CHECKS:['现实核对','Reality checks'],
 NAVIGATION_SUMMARY:['导航摘要','Navigation summary']
};
export const GUIDANCE_DIMENSIONS=[...MARKET_DIMENSIONS,'CROSS_SECTION_SYNTHESIS_NOT_REPETITION','NO_LIFE_PRESCRIPTION','REALITY_CHECK_REQUIRED'];
export const GUIDANCE_CONTRACT={...MARKET_CONTRACT,version:GUIDANCE_VERSION,roles:GUIDANCE_ROLES,headings:GUIDANCE_HEADINGS,dimensions:GUIDANCE_DIMENSIONS,scope:'BZR/S09_GUIDANCE/BASELINE_REVIEW_ONLY',priorOwnerGate:'S02_S03_S04_S05_OWNER_ACCEPTED'};
export const GUIDANCE_PROMPT=MARKET_PROMPT.replaceAll('career','guidance').replaceAll('Career','Guidance').replaceAll('S04:V4','S09:MARKET1')+`
S09 is a navigation synthesis, not another personality/career/wealth/relationship chapter. It must reduce repetition by translating the strongest supported chart themes into a small number of present choices and reality checks.
Use actual Day Master, month command, relevant Ten Gods, natal relations, current Da Yun and annual layer, but do not re-explain every definition. Each recommendation must identify the chart evidence it comes from and remain conditional.
Do not prescribe marriage, divorce, quitting a job, investing, medical treatment, migration, legal action or other high-stakes life decisions. Do not tell the customer what they must do. Prefer observe, compare, clarify, protect, test, sequence, or discuss.
No generic motivational slogans. No fixed personality verdict. No unsupported useful-god/favourable-element remedies, colours, directions, lucky dates or objects. Return structured JSON only.`;

export async function buildGuidanceBrief(input){
 const base=await buildMarketBrief({...input,topicCode:'CAPABILITY'});
 const plans=[
  '从全盘最明确、且已经在前章出现的结构中选出三到四个当前优先级，只保留真正影响选择的内容，不重复十神百科。',
  '说明当前可以调用的能力：例如学习与整合、承担责任、回应需求、保留自主或表达成果。每项必须落到实际印、官杀、财、比劫或时间层证据。',
  '指出哪些边界需要保留，例如责任上限、合作分工、关系期待、客户承诺或时间投入；用实际原局关系说明为什么，而不是写通用人生建议。',
  '说明需要保护的现实资源：注意力、时间、专业准备、可保留资金、恢复空间或关系协商。不得把八字直接变成投资、医疗或法律建议。',
  '结合当前大运与流年，给出阶段性取舍顺序：哪些主题可以先试、哪些需要先核对条件、哪些不宜只凭象征结构做决定。不得预测结果。',
  '给出五到七个现实核对问题，让客户用真实数据、反馈、沟通和结果验证八字解释是否适用。问题必须与本盘结构直接相关。',
  '以简洁导航摘要收束：保留两到四个可执行但非强制的方向，并明确重大现实决策仍应依据现实证据与相关专业意见。'
 ];
 const {briefSemanticDigest,careerNarrativeIR,...seed}=base;
 const claims=GUIDANCE_ROLES.map((role,i)=>({...base.claims[i],claimId:'S09:MARKET1:'+role,role,text:plans[i]}));
 const synthesis={...base.synthesis,guidance:'指导章只把已建立的结构翻译成优先级、边界与现实核对，不新增命理结论，也不重复前章定义。'};
 const guidanceNarrativeIR={...careerNarrativeIR,version:GUIDANCE_VERSION,synthesis,nodes:claims,topic:'CAPABILITY'};
 const next={...seed,sectionKey:'S09_GUIDANCE',successorVersion:GUIDANCE_VERSION,successorPromptVersion:'RNT2-GUIDANCE-PROMPT-v1.0.0',claimIrVersion:GUIDANCE_VERSION,sourceAuthorityVersion:GUIDANCE_VERSION,marketDomain:'GUIDANCE',marketContract:GUIDANCE_CONTRACT,requiredClaimRoles:GUIDANCE_ROLES,paragraphFunctions:GUIDANCE_ROLES,claims,synthesis,guidanceNarrativeIR};
 return deepFreeze({...next,briefSemanticDigest:await sha256Stable(next)});
}
