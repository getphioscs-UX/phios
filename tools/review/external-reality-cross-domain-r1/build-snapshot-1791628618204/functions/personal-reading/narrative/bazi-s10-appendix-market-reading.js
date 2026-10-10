import {buildMarketBrief,MARKET_CONTRACT,MARKET_DIMENSIONS,MARKET_PROMPT} from './bazi-s04-market-reading.js';
import {sha256Stable,deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

export const APPENDIX_VERSION='PHI-OS-BAZI-S10-MARKET-v1.0.0';
export const APPENDIX_ROLES=['FOUR_PILLARS','TEN_GOD_MAP','FIVE_ELEMENT_CONTEXT','NATAL_RELATIONS','DA_YUN_REFERENCE','ANNUAL_REFERENCE','METHOD_NOTES'];
export const APPENDIX_HEADINGS={
 FOUR_PILLARS:['四柱资料','Four Pillars'],
 TEN_GOD_MAP:['十神资料','Ten God map'],
 FIVE_ELEMENT_CONTEXT:['五行原始背景','Raw Five Element context'],
 NATAL_RELATIONS:['原局关系','Natal relations'],
 DA_YUN_REFERENCE:['当前大运资料','Current Da Yun reference'],
 ANNUAL_REFERENCE:['当前流年资料','Current annual reference'],
 METHOD_NOTES:['阅读说明','Reading notes']
};
export const APPENDIX_DIMENSIONS=[...MARKET_DIMENSIONS,'TRACEABILITY_FIRST','NO_NEW_INTERPRETIVE_CLAIMS','VISIBLE_HIDDEN_PROVENANCE'];
export const APPENDIX_CONTRACT={...MARKET_CONTRACT,version:APPENDIX_VERSION,roles:APPENDIX_ROLES,headings:APPENDIX_HEADINGS,dimensions:APPENDIX_DIMENSIONS,scope:'BZR/S10_APPENDIX/BASELINE_REVIEW_ONLY',priorOwnerGate:'S02_S03_S04_S05_OWNER_ACCEPTED'};
export const APPENDIX_PROMPT=MARKET_PROMPT.replaceAll('career','appendix').replaceAll('Career','Appendix').replaceAll('S04:V4','S10:MARKET1')+`
S10 is an evidence appendix. Prioritize traceability and compact explanation over narrative flourish. It must not introduce new personality, career, wealth, relationship, health or event conclusions.
Present Four Pillars, Day Master/month command, Ten Gods with visible/hidden provenance, raw Five Element context, recorded natal relations, current Da Yun and annual layer. Do not infer strength, useful gods, pattern completion, transformation, favourable elements or future events.
Explain that raw element counts are not strength and visible/hidden are source locations, not importance scores. Keep relationship types tied to actual pillar positions. Return structured JSON only.`;

export async function buildAppendixBrief(input){
 const base=await buildMarketBrief({...input,topicCode:'LIFE_OPERATION'});
 const plans=[
  '列出年、月、日、时四柱的天干地支，并标明日主与月令。只作为后文追溯依据，不加入性格判断。',
  '整理实际出现的十神，明确哪些来自透干、哪些来自藏干及所在柱位。数量只表示出现来源，不等于旺衰、重要性或吉凶。',
  '列出五行原始分布与现有 correction boundary；明确原始计数不是强弱，也不由此推出喜用神、忌神或补救元素。',
  '整理原局已确认的天干合、地支害、刑、冲等关系及涉及柱位；只记录结构关系，不宣称合化或现实事件。',
  '记录当前大运完整干支、年龄区间、天干十神、地支藏干及已确认的原局互动。作为 S08 时间章的可追溯证据。',
  '记录当前流年年份、干支、天干十神及已确认的相关结构。只作为年度层资料，不单独给吉凶或事件预测。',
  '说明阅读边界：本报告使用现有 canonical 八字结构进行解释；未获 authority 的旺衰、喜用、格局完成、合化和具体事件预测均不在本附录中新增。'
 ];
 const {briefSemanticDigest,careerNarrativeIR,...seed}=base;
 const claims=APPENDIX_ROLES.map((role,i)=>({...base.claims[i],claimId:'S10:MARKET1:'+role,role,text:plans[i]}));
 const synthesis={...base.synthesis,appendix:'附录只承担证据追溯与术语定位，不新增客户结论。'};
 const appendixNarrativeIR={...careerNarrativeIR,version:APPENDIX_VERSION,synthesis,nodes:claims,topic:'LIFE_OPERATION'};
 const next={...seed,sectionKey:'S10_APPENDIX',successorVersion:APPENDIX_VERSION,successorPromptVersion:'RNT2-APPENDIX-PROMPT-v1.0.0',claimIrVersion:APPENDIX_VERSION,sourceAuthorityVersion:APPENDIX_VERSION,marketDomain:'APPENDIX',marketContract:APPENDIX_CONTRACT,requiredClaimRoles:APPENDIX_ROLES,paragraphFunctions:APPENDIX_ROLES,claims,synthesis,appendixNarrativeIR};
 return deepFreeze({...next,briefSemanticDigest:await sha256Stable(next)});
}
