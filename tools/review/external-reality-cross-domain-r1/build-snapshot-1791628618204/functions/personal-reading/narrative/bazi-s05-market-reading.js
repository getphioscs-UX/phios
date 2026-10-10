import {buildMarketBrief,MARKET_CONTRACT,MARKET_DIMENSIONS,MARKET_PROMPT} from './bazi-s04-market-reading.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
export const WEALTH_VERSION='PHI-OS-BAZI-S05-MARKET-v1.0.0';
export const WEALTH_ROLES=['CHART_HIGHLIGHTS','WEALTH_CHARACTER','WEALTH_ADVANTAGES','WEALTH_CHALLENGES','WEALTH_DIRECTIONS','WEALTH_TIMING','WEALTH_ADVICE'];
export const WEALTH_HEADINGS={CHART_HIGHLIGHTS:['财富命盘重点','Your wealth chart'],WEALTH_CHARACTER:['你的财富特质','Your approach to earning'],WEALTH_ADVANTAGES:['积累财富的优势','Strengths for building resources'],WEALTH_CHALLENGES:['容易遇到的财富问题','Financial pressure points'],WEALTH_DIRECTIONS:['适合的收入与积累方式','Earning and accumulation'],WEALTH_TIMING:['当前大运与流年','Your current Da Yun and annual cycle'],WEALTH_ADVICE:['财富取舍建议','Choices to consider']};
export const WEALTH_CONTRACT={...MARKET_CONTRACT,version:WEALTH_VERSION,roles:WEALTH_ROLES,headings:WEALTH_HEADINGS,dimensions:[...MARKET_DIMENSIONS,'WEALTH_NOT_CAREER_SUBSTITUTION','NO_FINANCIAL_PREDICTION_OR_PRESCRIPTION'],scope:'BZR/S05_WEALTH/BASELINE_REVIEW_ONLY',priorOwnerGate:'S04_V4_BILINGUAL_ACCEPTED'};
export const WEALTH_PROMPT=MARKET_PROMPT.replaceAll('career','wealth').replaceAll('Career','Wealth').replaceAll('S04:V4','S05:MARKET1')+`
S05 is about earning, retaining and allocating resources, not selecting a job or repeating S04. Follow the WEALTH content plan. Explain actual 正财 and 偏财 locations, visible/hidden distinction and co-present Officer/Peer themes. Direct Wealth does not prove salary, Indirect Wealth does not prove windfalls or investment skill. A hidden star does not imply hidden assets, late wealth or money that cannot be earned. Absent natal Output does not prove inability to earn. A single hidden Peer is not Rob Wealth or proof of competitors taking money.
No buy/sell/hold recommendations, products, asset classes, loans, leverage, portfolio allocations, dates for transactions, return percentages, wealth ranks, income amounts or prosperity guarantees. Use modest personal interpretation and ordinary questions about income arrangements, effort, commitments and keeping resources available. No financial diagnosis or observed spending history. Explain chart combinations without inventing 财生官、食伤生财、比劫夺财 or 财多身弱. No unsupported first-ever cycle claims. Do not recite source governance. Avoid numerical star inventories and percentages. Aim for 1400 Chinese characters or 800 English words. Keep English natural; gloss Chinese Ten Gods briefly once.
Final boundary: 八字反映的是结构倾向与阶段变化，实际财富状况仍会受到个人选择与现实条件影响。 or natural English. This single framing sentence does not permit stronger unsupported claims elsewhere.`;
export async function buildWealthBrief(input){
 const base=await buildMarketBrief({...input,topicCode:'WEALTH'});
 const plans=[
  '从实际日主与月令说明财富阅读的参照，点明正财和偏财的真实位置、透藏及定性五行背景。解释财星涉及收入机会、市场需求与资源使用，不将数量当作财富多少。',
  '以财星为本章主线，组合实际同时参与的官杀和比肩，解释收入安排与责任、合作之间的取舍。印星只有在原局事实支持时作为知识背景，不取代财星主线；不套用职业性格。',
  '解释三项有具体财星或原局组合依据的积累机会：如何理解收入来源、回应需求、协调责任和投入。每项包含依据和有条件的现实用途，不宣称已经具备理财能力或致富优势。',
  '财星与官杀并存及真实合、害、刑分别提示哪些资源安排需要留意。说明承诺、完成成本、合作分担怎样影响可留下的资源。不得凭比肩推断夺财、凭财藏推断财富受阻或晚年发财。',
  '讨论实际所得、完成工作需要付出的资源、可保留资源三者如何区别。结合财星透藏和同时参与的十神，给出有条件的收入与积累方式；不要复述职业方向，不建议具体金融工具、借贷或投资。',
  '以真实大运干支、年龄段、十神以及流年年份干支说明本命财星与当前阶段的差异。区分大运伤官所指的成果表达与年度正财所指的收入交换；只写实际确认的原局关系，不推断收益、交易时机或生财格局。',
  '收束为与本盘有关的少量取舍：需求与收入约定、付出与责任、可保留资源之间怎样核对。不可写预算比例、资产配置、收入预测或交易建议；末尾一句边界即可。'
 ];
 const {briefSemanticDigest,careerNarrativeIR,...seed}=base;
 const claims=WEALTH_ROLES.map((role,i)=>({...base.claims[i],claimId:'S05:MARKET1:'+role,role,text:plans[i]}));
 const synthesis={...base.synthesis,WEALTH:'正财、偏财按实际透藏与柱位区分，以收入安排、需求、投入及资源保留为财富主题；正偏财不是固定收入类型或收益预言。',PEER:'仅解释实际同类星的存在与合作分担议题；比肩不等于劫财，更不等于夺财。',combination:'财富章只据实际原局关系讨论资源安排中的协调议题；共存不是已确立的生克制化或致富机制。'};
 const wealthNarrativeIR={...careerNarrativeIR,version:WEALTH_VERSION,synthesis,nodes:claims,topic:'WEALTH'};
 const next={...seed,sectionKey:'S05_WEALTH',successorVersion:WEALTH_VERSION,successorPromptVersion:'RNT2-WEALTH-PROMPT-v1.0.0',claimIrVersion:WEALTH_VERSION,sourceAuthorityVersion:WEALTH_VERSION,marketDomain:'WEALTH',marketContract:WEALTH_CONTRACT,requiredClaimRoles:WEALTH_ROLES,paragraphFunctions:WEALTH_ROLES,claims,synthesis,wealthNarrativeIR};
 return deepFreeze({...next,briefSemanticDigest:await sha256Stable(next)});
}
