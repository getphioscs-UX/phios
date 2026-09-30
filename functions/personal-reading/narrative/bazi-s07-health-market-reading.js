import {buildMarketBrief,MARKET_CONTRACT,MARKET_DIMENSIONS,MARKET_PROMPT} from './bazi-s04-market-reading.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const HEALTH_VERSION='PHI-OS-BAZI-S07-MARKET-v1.0.0';
export const HEALTH_ROLES=['CHART_HIGHLIGHTS','LOAD_PATTERN','SUPPORT_PATTERN','PRESSURE_POINTS','DAILY_MAINTENANCE','HEALTH_TIMING','HEALTH_GUIDANCE'];
export const HEALTH_HEADINGS={
 CHART_HIGHLIGHTS:['身心负荷命盘重点','Your load and recovery chart'],
 LOAD_PATTERN:['负荷怎样形成','How pressure tends to build'],
 SUPPORT_PATTERN:['什么有助于恢复','What supports recovery'],
 PRESSURE_POINTS:['需要留意的负荷点','Pressure points to watch'],
 DAILY_MAINTENANCE:['日常维护方向','Daily maintenance'],
 HEALTH_TIMING:['当前大运与流年','Your current Da Yun and annual cycle'],
 HEALTH_GUIDANCE:['健康与生活节奏建议','Health and rhythm guidance']
};
export const HEALTH_DIMENSIONS=[...MARKET_DIMENSIONS,'NO_MEDICAL_DIAGNOSIS','NO_DISEASE_PREDICTION','LOAD_RECOVERY_TRACE'];
export const HEALTH_CONTRACT={...MARKET_CONTRACT,version:HEALTH_VERSION,roles:HEALTH_ROLES,headings:HEALTH_HEADINGS,dimensions:HEALTH_DIMENSIONS,scope:'BZR/S07_HEALTH/BASELINE_REVIEW_ONLY',priorOwnerGate:'S02_S03_S04_S05_OWNER_ACCEPTED'};
export const HEALTH_PROMPT=MARKET_PROMPT.replaceAll('career','health').replaceAll('Career','Health').replaceAll('S04:V4','S07:MARKET1')+`
S07 is a traditional BaZi load/recovery and daily-rhythm reading, not medical assessment. Follow the HEALTH content plan. Keep actual Day Master, month command, named Ten Gods, natal relations, Da Yun and annual trace visible.
Never diagnose disease, organ dysfunction, mental illness, fertility, lifespan, injury, hospitalization, medication need, treatment outcome or medical risk. Never tell the customer to start/stop medication, supplements, fasting, exercise programs or treatment. No symptom inference from Five Elements.
Explain Officer/Pressure participation as demands, standards, responsibility and load; Resource as learning/support/replenishment; Peer as autonomy or shared load; Wealth as commitments and resource use. These are symbolic operating themes, not bodily facts.
Five Elements may remain as raw qualitative chart context only. Do not map Wood/Fire/Earth/Metal/Water directly to organs, diseases, foods, colours, supplements or medical prescriptions. Harm/punishment/clash are interaction themes, not injury or illness.
Timing may identify periods where workload, support, expression or commitments deserve more attention, but must not predict illness or health events. End with one concise reminder that medical concerns require qualified healthcare assessment. Return structured JSON only.`;

export async function buildHealthBrief(input){
 const base=await buildMarketBrief({...input,topicCode:'PRESSURE'});
 const plans=[
  '以实际日主、月令、四柱与压力主题实际参与的官杀、印、比劫、财星开篇。五行只作为原始定性背景，不把任何元素对应到器官、疾病或体质诊断。',
  '从本盘压力主题说明责任、标准、外部要求与个人回应怎样共同形成负荷。必须使用实际透藏与柱位，不把七杀或正官写成疾病、焦虑或生理问题。',
  '说明印星、比劫及其他真实参与结构如何提供学习、支持、恢复空间或自主调节的象征线索。不得宣称客户已经拥有或缺乏某种身体恢复能力。',
  '结合实际合、害、刑、冲与压力主题，解释哪些重复要求、边界或责任冲突值得留意。不得把害刑冲写成受伤、手术、疾病、失眠或心理诊断。',
  '提出与现实生活节奏有关的低风险维护方向，例如观察负荷来源、安排恢复时间、澄清责任边界、记录持续压力。不得提供药物、补充剂、食疗、断食、运动处方或治疗方案。',
  '明确当前大运干支与年龄段、流年年份干支及真实十神变化。解释当前阶段哪些负荷与支持主题更值得观察；不得预测发病、事故、住院、寿命或具体健康事件。',
  '收束为少量可观察问题：当前责任是否超过可承载范围、支持是否足够、恢复时间是否被持续挤压。八字不能替代医学评估；有健康疑虑应咨询合格医疗专业人士。'
 ];
 const {briefSemanticDigest,careerNarrativeIR,...seed}=base;
 const claims=HEALTH_ROLES.map((role,i)=>({...base.claims[i],claimId:'S07:MARKET1:'+role,role,text:plans[i]}));
 const synthesis={...base.synthesis,OFFICER:'官杀在健康章只解释要求、责任、压力与负荷主题，不对应疾病或器官。',RESOURCE:'印星只解释学习、支持、吸收与恢复空间的象征意义，不等同治疗或身体恢复力。',PEER:'比劫用于自主、分担与边界；不等同免疫力、竞争伤害或身体强弱。',WEALTH:'财星用于承诺、投入与资源使用，不对应生理消耗或疾病。',combination:'合、刑、害、冲只作为负荷与互动主题，不升级为受伤、疾病或医学结论。'};
 const healthNarrativeIR={...careerNarrativeIR,version:HEALTH_VERSION,synthesis,nodes:claims,topic:'PRESSURE'};
 const next={...seed,sectionKey:'S07_HEALTH',successorVersion:HEALTH_VERSION,successorPromptVersion:'RNT2-HEALTH-PROMPT-v1.0.0',claimIrVersion:HEALTH_VERSION,sourceAuthorityVersion:HEALTH_VERSION,marketDomain:'HEALTH',marketContract:HEALTH_CONTRACT,requiredClaimRoles:HEALTH_ROLES,paragraphFunctions:HEALTH_ROLES,claims,synthesis,healthNarrativeIR};
 return deepFreeze({...next,briefSemanticDigest:await sha256Stable(next)});
}
