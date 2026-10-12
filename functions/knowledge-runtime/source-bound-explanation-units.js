// Source-native explanation facets. No question-specific answers, external
// conclusions, glossary-only evidence or translation is produced here.
const compact=s=>String(s||'').normalize('NFKC').replace(/\s+/gu,'');
// Linguistic recall hints only, never accepted conceptual equivalences. Repair
// is not a synonym for damage; maintenance is not a synonym for recovery.
const linguisticFamilies=[['持续','连续','延续'],['更新','更替','更换','换新','替换'],['组成部分','组成要素','部件','元素','要素'],['层次','层面','层'],['损坏','故障'],['维护','维持'],['观察','观测']];
export function explanationQueryTerms(query,terms){
 const q=compact(query);
 return [...new Set([...terms,...linguisticFamilies.filter(f=>f.some(t=>q.includes(t))).flat()])];
}
export function createSourceBoundExplanationUnits(record){
 return (record.argumentUnits||[]).map(unit=>{
  const raw=String(record.text).slice(unit.startOffset,unit.endOffset);
  return {unitId:unit.argumentId,conceptIds:(record.retrievalConcepts||[]).map(c=>c.conceptId),locale:'zh-Hans',sourceSectionId:record.sectionCode,support:{startOffset:unit.startOffset,endOffset:unit.endOffset,textSha256:unit.textSha256},mainArgument:raw,
   definition:unit.type==='DEFINITION'?raw:null,conditions:unit.type==='CONDITIONS'?raw:null,boundary:unit.type==='BOUNDARY'?raw:null,applicableComparison:unit.type==='DISTINCTION'?raw:null,mechanism:unit.type==='MECHANISM'?raw:null,
   additionalConclusionsAllowed:false,fullChapterCoverage:false,unit};
 });
}
export function rankSourceBoundExplanations(record,query,terms){
 const units=createSourceBoundExplanationUnits(record),expanded=explanationQueryTerms(query,terms);
 if(!units.length)return [];
 const grammar=/^(?:为什么|为何|如何|哪些|什么|是否|是不是|不能|能够|才能|之后|以后|仍然|已经|而不是|可以|需要|讨论|长期|保证|必然|任何|所有|一个|一样|这种|这个|那个)$/u;
 const content=expanded.filter(t=>t.length>1&&!grammar.test(t));
 const enumerate=/哪些|几种|层次|包括/u.test(query);
 const compare=/区别|差别|差异|不同|相比|比较/u.test(query);
 const define=/什么是|是什么意思|指什么|定义/u.test(query);
 const guarantee=/保证|一定|必然/u.test(query);
 const ranked=units.map(u=>{
  const text=compact(u.mainArgument),matched=content.filter(t=>text.includes(t));
  const distinctive=matched.filter(t=>units.filter(v=>compact(v.mainArgument).includes(t)).length<=Math.max(1,units.length/2));
  let score=matched.reduce((n,t)=>n+t.length/(1+units.filter(v=>compact(v.mainArgument).includes(t)).length),0);
  const direct=terms.filter(t=>t.length>1&&!grammar.test(t)&&!/^(?:结构|系统|文明|国家|保持|连续|持续)$/u.test(t)&&text.includes(t));
  score+=direct.reduce((n,t)=>n+5*t.length/(1+units.filter(v=>compact(v.mainArgument).includes(t)).length),0);
  if(enumerate&&u.definition&&/至少|包括|分别|分为|可以是/u.test(text))score+=30;
  if(define&&u.definition)score+=20;
  if(compare&&u.applicableComparison)score+=20;
  if(/代表|证明|意味着|就能/u.test(query)&&u.applicableComparison&&/不代表|不意味着|并不等于/u.test(text)&&matched.length>=2)score+=40;
  if(guarantee&&u.boundary&&distinctive.length)score+=20;
  // An explicit source distinction remains relevant to damage/timing questions
  // even when the customer does not literally use “有什么区别”.
  if(u.applicableComparison&&/故障|损坏|修理/u.test(query)&&/损坏|修理/u.test(text))score+=20;
  return {u,score,matched,distinctive};
 }).filter(r=>r.matched.length>=2&&r.distinctive.length>0).sort((a,b)=>b.score-a.score);
 return ranked;
}
export function selectSourceBoundExplanation(record,query,terms,maximum){
 const ranked=rankSourceBoundExplanations(record,query,terms);
 if(!ranked.length)return null;
 const chosen=ranked.find(r=>r.u.mainArgument.length<=maximum);
 if(!chosen)return null;
 return {unit:chosen.u.unit,text:chosen.u.mainArgument,score:chosen.score,explanationUnit:chosen.u,evidenceMatch:{contentAnchors:chosen.matched,distinctiveAnchors:chosen.distinctive,glossaryOnly:false}};
}
