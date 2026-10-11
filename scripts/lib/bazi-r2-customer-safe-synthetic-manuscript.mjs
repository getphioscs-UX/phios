// QA_FIXTURE_SUCCESSOR. Never imported by production functions.
const domains={
 S02:['日常选择与核心运作','daily choices and core operation'],S03:['学习方式、能力与结构','learning, capability and structure'],
 S04:['工作责任、标准与期限','work responsibilities, standards and deadlines'],S05:['收入、成本与资源管理','income, costs and resource management'],
 S06:['亲密、信任、自主与靠近','intimacy, trust, autonomy and closeness'],S07:['家庭照顾、实际分担与支持','family care, shared burdens and support'],
 S08:['压力、节奏与恢复','pressure, pace and recovery'],S09:['长期节奏、持续与改变','longer cycles, continuity and change'],S10:['时序背景与现实选择','timing context and real-life choices']
};
export const CUSTOMER_SAFE_INTERNAL_TERMS=/\b(?:authority|authoring|pack|fixture|provider(?:Calls)?|schema(?:Version)?|registry|candidate|QA|test)\b|reference subject|customer-native publication chain|semantic verifier|machine baseline|internal IR|cache key|权威包|内部测试|本地测试|出版链|候选登记|机器基线|语义验证|缓存键/gi;
export function fixtureVisibleInternalTerms(text){return [...new Set(String(text).match(CUSTOMER_SAFE_INTERNAL_TERMS)||[])];}
export function customerSafeSyntheticBaziText(pack,sectionId,locale){
 const domain=domains[sectionId];if(!domain)throw Error('UNKNOWN_SYNTHETIC_SECTION');
 const p=pack.natal.pillars,day=pack.natal.dayMaster,marker=[p.year,p.month,p.day,p.hour].join(locale==='en'?', ':'、');
 const lines=locale==='en'?[
  `Your Day Master is ${day}, with four pillars ${marker}; the mechanism considered here begins with the Day Master, month branch and the structure of your chart.`,
  `In daily life, ${domain[1]} provides a practical setting in which to observe this structure without treating it as proof of personal events.`,
  'Support and carrying conditions can change how the same structure is expressed, so resources, support, recovery and counterweights must remain part of the reading.',
  `When considering ${domain[1]}, compare the reading with your actual circumstances and available choices.`,
  'Personal experiences, relationship facts and real-life conclusions that lack sufficient information remain open and are not inferred in this report.',
  'This reading concerns your own chart; your lived circumstances and personal choices still need to be considered individually.'
 ]:[
  `你的日主为${day}，四柱为${marker}；本节的命理机制从日主、月令与命盘结构出发。`,
  `在现实生活中，${domain[0]}提供了观察结构的具体情境，但这些线索不等同于已经发生的个人事实。`,
  '支持与承载条件会改变同一结构的实际表现，因此需要同时保留资源、支持、恢复与制衡条件。',
  `面对${domain[0]}时，应将解读与实际条件和可行选择逐项比较。`,
  '没有足够资料支持的个人经历、关系事实或现实结论仍然保持开放，不在本报告中作推断。',
  '这份解读只围绕你的命盘展开，实际处境与个人选择仍需分别核对。'
 ];
 if(sectionId==='S10')lines.splice(2,0,locale==='en'?'Da Yun and annual layers describe different timing scales; specific timing identities have not been supplied here, so no particular stem-branch combination or event is inferred.':'大运与流年构成不同尺度的时序层；目前没有足够资料确认具体时序干支，不能据此推断特定事件。');
 const text=lines.join('\n\n');if(fixtureVisibleInternalTerms(text).length)throw Error('FIXTURE_VISIBLE_INTERNAL_LANGUAGE');return text;
}
