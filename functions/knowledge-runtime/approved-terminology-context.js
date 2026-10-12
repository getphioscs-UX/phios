import registry from '../../content/knowledge/l10n/bilingual-terminology-registry.json';
const normalize=x=>String(x||'').normalize('NFKC').toLowerCase();
const approved=registry.terms.filter(t=>t.status==='approved'&&t.translationLock===true);
export function matchApprovedTerminology(question,locale){
 if(!['en','zh-Hans'].includes(locale))return [];
 const q=normalize(question);
 return approved.filter(t=>{
   const term=normalize(t[locale]);
   return locale==='en'?new RegExp('(?:^|[^a-z])'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:$|[^a-z])','u').test(q):q.includes(term);
 }).map(t=>({termCode:t.termCode,key:t.key,label:t[locale],locale,authority:'EXISTING_FROZEN_HUMAN_TERMINOLOGY',createsAnswerEvidence:false}));
}
export function bindTerminologyToEvidence(matches,sources,locale){
 return matches.flatMap(term=>{
  const refs=sources.filter(s=>s.sourceType==='COMPLETED_MANUSCRIPT'||s.sourceType==='PUBLISHED_CANONICAL_ARTICLE').filter(s=>normalize(s.text).includes(normalize(term.label))).map(s=>({sourceCode:s.sourceCode||null,sourceId:s.sourceId||null,sectionCode:s.sectionCode||null,nodeCode:s.nodeCode||null,sourceDigest:s.sourceBinaryDigest||s.sourcePdfSha256||s.sourceDigest||null}));
  return refs.length?[{...term,locale,supportingSources:refs,glossaryOnlyAnswerAllowed:false}]:[];
 });
}
export function approvedTerminologyForSourcePack(question,locale,sources){
 return matchApprovedTerminology(question,locale).flatMap(match=>{
  const term=approved.find(t=>t.termCode===match.termCode);
  const sourceLabel=term?.['zh-Hans'];
  const support=sources.filter(s=>[match.label,sourceLabel].filter(Boolean).some(label=>normalize(s.text).replace(/\s+/gu,'').includes(normalize(label).replace(/\s+/gu,''))));
  return support.length?[{...match,sourceLabel,sourceLocale:'zh-Hans',sourceIds:support.map(s=>s.id),createsAnswerEvidence:false}]:[];
 });
}
// Search expansion only; the customer's original question and authority are unchanged.
export function approvedCrossLocaleSearch(question,fromLocale,toLocale){
 const matches=matchApprovedTerminology(question,fromLocale);
 const aliases=matches.map(m=>approved.find(t=>t.termCode===m.termCode)?.[toLocale]).filter(Boolean);
 // Linguistic search hints are not glossary acceptance or answer evidence.
 // Preserve the original question for the model; the Chinese index must not
 // require an English paragraph to match Chinese argument anchors.
 const hints=fromLocale==='en'&&toLocale==='zh-Hans'?[
  [/\bsystems?\b/iu,'系统'],[/\bstructures?\b/iu,'结构'],[/\belements?|components?|parts?\b/iu,'元素 组成部分'],
  [/\bchang(?:e|es|ed|ing)|replac(?:e|ed|ing)|renew(?:al|ed)?\b/iu,'更替 更新'],[/\bremain|keep|retain|preserv(?:e|ing)\b/iu,'保持'],
  [/\bunchanged|same|identical\b/iu,'原样 不变'],[/\bwhy\b/iu,'为什么'],[/\bhow\b/iu,'如何'],
  [/\bwhat (?:is|does)|defin(?:e|ition)\b/iu,'定义 什么是'],[/\bdifferen(?:t|ce)|compar(?:e|ison)|distinguish(?:es)?|versus\b/iu,'区别 比较'],
  [/\bconditions?|unless|if\b/iu,'条件'],[/\bnot|never|cannot|doesn.t|don.t\b/iu,'不'],
  [/\bresources?|capacity\b/iu,'资源 能力'],[/\blimits?|boundar(?:y|ies)\b/iu,'边界 限制'],[/\btime|timing\b/iu,'时间'],
  [/\bciviliz(?:ation|ations|ational)\b/iu,'文明'],[/\breconfigur(?:ation|e|ed|ing)\b/iu,'重组'],[/\bordinary|normal\b/iu,'普通 正常'],[/\bchanges?\b/iu,'变化'],
  [/\bobserv(?:e|ed|ing|ation|ations)\b/iu,'观察'],[/\bexist(?:s|ed|ence)?\b/iu,'存在'],[/\bevidence|proof|prove\b/iu,'证据'],[/\black|absence\b/iu,'缺少 未观察'],
  [/\bmaintenance\b/iu,'维护 维持'],[/\brepair\b/iu,'修理'],[/\bdamage|fault|failure\b/iu,'损坏 故障'],[/\bbefore\b/iu,'之前'],[/\bafter\b/iu,'之后'],[/\brecovery|recover\b/iu,'恢复'],[/\bwar\b/iu,'战争']
 ].filter(([pattern])=>pattern.test(question)).map(([,text])=>text):[];
 const expansion=[...new Set([...aliases,...hints])];
 return {originalQuestion:question,retrievalQuery:expansion.length?expansion.join(' '):question,aliases,linguisticHints:hints,linguisticHintsAuthority:'SEARCH_ONLY_NOT_ACCEPTED_TERMINOLOGY',createsAnswerEvidence:false};
}
