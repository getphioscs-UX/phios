import crypto from 'node:crypto';
import {HD_EXTERNAL_REALITY_COMPOSITION_VERSION} from './human-design-external-authority.js';
import {HD_EXTERNAL_READING_IR_VERSION} from './human-design-external-authority.js';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
export function composeHumanDesignRealityBridge(readingIr,{locale=readingIr?.locale||'en'}={}){
  if(!readingIr||readingIr.schemaVersion!==HD_EXTERNAL_READING_IR_VERSION)throw new TypeError('HD_READING_IR_REQUIRED');
  const zh=locale==='zh-Hans';
  const prompts=zh?[
    ['DECISION','决定', '最近几次重要选择里，清晰度是立即出现、随时间变化，还是高度依赖情境？记录反例。'],
    ['ENGAGEMENT','投入与行动','哪些情境下你会自然回应，哪些情境下会主动发起？两者带来的阻力是否稳定不同？'],
    ['RELATIONSHIP','关系与角色','他人的期待、你承担的角色与实际可用资源之间，哪些模式会反复出现？哪些并不会？'],
    ['ENVIRONMENT','环境与感官','在不同真实环境里，注意力、精力或互动质量有什么可重复观察的差异？'],
    ['CONTRADICTION','反证','这份读取中哪一项最不符合你的经验？什么事实会使这个视角需要被修正或放弃？']
  ]:[
    ['DECISION','Decision','Across recent important choices, did clarity appear immediately, change with time, or depend strongly on context? Record counterexamples.'],
    ['ENGAGEMENT','Engagement and action','In which situations do you naturally respond, and in which do you initiate? Does friction differ consistently between them?'],
    ['RELATIONSHIP','Relationship and role','Which patterns around others’ expectations, your role and available resources recur—and which do not?'],
    ['ENVIRONMENT','Environment and sensory context','Across real environments, what repeatable differences appear in attention, energy or interaction quality?'],
    ['CONTRADICTION','Contradiction','Which part of this reading least fits your experience? What evidence would require this perspective to be revised or dropped?']
  ];
  const body={schemaVersion:HD_EXTERNAL_REALITY_COMPOSITION_VERSION,readingDigest:readingIr.readingDigest,locale,prompts:Object.freeze(prompts.map(([code,label,question])=>freeze({code,label,question,evidenceStatus:'OBSERVATION_NOT_YET_EVIDENCE'}))),boundaries:freeze({createsRealityFact:false,createsRuntimeEvidence:false,createsDiagnosis:false,createsRequiredAction:false,resonanceAloneIsEvidence:false,contradictionPreserved:true})};
  return freeze({...body,compositionDigest:digest(body)});
}
