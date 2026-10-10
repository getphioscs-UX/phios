import {buildMarketBrief,MARKET_CONTRACT,MARKET_DIMENSIONS,MARKET_PROMPT} from './bazi-s04-market-reading.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const RELATIONSHIP_VERSION='PHI-OS-BAZI-S06-MARKET-v1.0.0';
export const RELATIONSHIP_ROLES=['CHART_HIGHLIGHTS','RELATIONSHIP_CHARACTER','RELATIONSHIP_STRENGTHS','RELATIONSHIP_CHALLENGES','RELATIONSHIP_DIRECTIONS','RELATIONSHIP_TIMING','RELATIONSHIP_ADVICE'];
export const RELATIONSHIP_HEADINGS={
 CHART_HIGHLIGHTS:['关系命盘重点','Your relationship chart'],
 RELATIONSHIP_CHARACTER:['你的关系模式','Your relationship pattern'],
 RELATIONSHIP_STRENGTHS:['关系中的优势','Relationship strengths'],
 RELATIONSHIP_CHALLENGES:['容易遇到的关系课题','Relationship challenges'],
 RELATIONSHIP_DIRECTIONS:['更适合的相处方式','Ways of relating'],
 RELATIONSHIP_TIMING:['当前大运与流年','Your current Da Yun and annual cycle'],
 RELATIONSHIP_ADVICE:['关系建议','Relationship guidance']
};
export const RELATIONSHIP_DIMENSIONS=[...MARKET_DIMENSIONS,'RELATIONSHIP_NOT_PARTNER_PREDICTION','DAY_PILLAR_RELATION_TRACE','NO_MARRIAGE_EVENT_PREDICTION'];
export const RELATIONSHIP_CONTRACT={...MARKET_CONTRACT,version:RELATIONSHIP_VERSION,roles:RELATIONSHIP_ROLES,headings:RELATIONSHIP_HEADINGS,dimensions:RELATIONSHIP_DIMENSIONS,scope:'BZR/S06_RELATIONSHIP/BASELINE_REVIEW_ONLY',priorOwnerGate:'S02_S03_S04_S05_OWNER_ACCEPTED'};
export const RELATIONSHIP_PROMPT=MARKET_PROMPT
 .replaceAll('career','relationship')
 .replaceAll('Career','Relationship')
 .replaceAll('S04:V4','S06:MARKET1')+`
S06 is a personal BaZi relationship reading, not partner profiling and not a marriage-event prediction. Follow the RELATIONSHIP content plan. Keep the actual Day Master, Day pillar/branch, named Ten Gods, natal stem/branch relations and timing trace visible.
Do not infer a partner's personality, hidden motives, fidelity, fertility, marriage date, divorce, third party, abuse, soulmate status, sexual behavior or guaranteed relationship outcome. Do not infer a spouse star solely from customer gender unless an admitted canonical authority explicitly supplies that mapping. A Day-pillar relation is a structural relationship lens, not proof of a lived relationship event.
Explain actual Officer, Wealth, Resource and Peer participation only where supported by the supplied chart. Keep visible versus hidden distinct. Co-presence does not establish 官印相生、财生官、伤官见官 or any generating/controlling/transformation mechanism unless explicit authority exists.
Use actual natal relationships such as combination, harm, punishment or clash only as bounded interaction themes tied to their recorded pillar positions. Combination does not mean transformation; harm/punishment does not mean betrayal, injury or separation. The other person's state remains unknown.
Discuss closeness, expectations, reciprocity, autonomy, responsibility, boundaries and communication only as conditional relationship themes supported by this chart. No compatibility score and no instructions to stay, leave, marry or separate.
Timing may explain which relationship themes deserve more attention in the current Da Yun and annual layer, but never predict a relationship event. Aim for 1200–1800 Chinese Han characters or 750–1050 English words. End with one concise boundary only.`;

export async function buildRelationshipBrief(input){
 const base=await buildMarketBrief({...input,topicCode:'RELATIONSHIPS'});
 const plans=[
  '以实际日主、月令、日柱/日支、四柱和关系主题中真实参与的十神开篇。保留官杀、财、印、比劫的真实柱位与透藏差异，并点出与日柱直接相关的原局关系；不把柱位自动等同某个现实人物。',
  '以关系主题的首要十神和同时参与的功能解释亲近关系中的期待、责任、交换、自主与支持怎样共同出现。必须从本盘具体十神位置出发，不写固定人格，也不描述对方隐藏心理。',
  '选择三项或四项有本盘依据的关系优势，例如责任感、稳定投入、理解需求、保留自主或学习协调；每项先给八字事实再解释有条件的现实价值，不把单一十神写成好坏标签。',
  '结合与日柱直接相关及其他实际合、害、刑、冲说明哪些互动主题更需要协商。只解释结构张力与联结，不把害刑写成背叛、争吵、分离、疾病或事故，也不宣称合一定带来婚姻。',
  '给出有依据的相处方向：怎样平衡责任与自主、需求与投入、亲近与边界、支持与表达。不得指定伴侣类型、婚姻对象或用职业/收入条件代替关系解读。',
  '明确当前大运完整干支、年龄段、流年年份干支、各自十神及与原局实际确认的关系。说明哪些本命关系主题在当前阶段更值得观察；不得预测结婚、分手、复合、第三者或具体事件。',
  '收束为本盘相关的少量关系取舍：什么需要说清楚、哪些期待需要协商、哪里要保留现实观察。不得给 stay/leave/marry 指令；章末一句边界即可。'
 ];
 const {briefSemanticDigest,careerNarrativeIR,...seed}=base;
 const claims=RELATIONSHIP_ROLES.map((role,i)=>({...base.claims[i],claimId:'S06:MARKET1:'+role,role,text:plans[i]}));
 const synthesis={
  ...base.synthesis,
  OFFICER:'官杀在关系章只解释责任、期待、边界与外部要求怎样参与关系；不等同伴侣人格或婚姻结果。',
  WEALTH:'财星在关系章解释投入、回应需要与交换方式；不等同对方条件、资产或感情结果。',
  RESOURCE:'印星解释理解、学习、支持与吸收方式；不证明现实中一定得到照顾或保护。',
  PEER:'比劫解释自我位置、自主、平等与协商；比肩不等于竞争者，更不等于第三者。',
  combination:'关系章只据实际柱位合、害、刑、冲讨论互动中的联结或张力；不把结构关系升级成婚恋事件、对方动机或合化结论。'
 };
 const relationshipNarrativeIR={...careerNarrativeIR,version:RELATIONSHIP_VERSION,synthesis,nodes:claims,topic:'RELATIONSHIPS'};
 const next={...seed,sectionKey:'S06_RELATIONSHIP',successorVersion:RELATIONSHIP_VERSION,successorPromptVersion:'RNT2-RELATIONSHIP-PROMPT-v1.0.0',claimIrVersion:RELATIONSHIP_VERSION,sourceAuthorityVersion:RELATIONSHIP_VERSION,marketDomain:'RELATIONSHIP',marketContract:RELATIONSHIP_CONTRACT,requiredClaimRoles:RELATIONSHIP_ROLES,paragraphFunctions:RELATIONSHIP_ROLES,claims,synthesis,relationshipNarrativeIR};
 return deepFreeze({...next,briefSemanticDigest:await sha256Stable(next)});
}
