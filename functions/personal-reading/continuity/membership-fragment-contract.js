import {digest} from '../../account/oidc-auth.js';
// Candidate interface. This does not grant access or replace the legacy paid
// experiment contract. The caller must supply a permission-verified pack.
export async function createMembershipFragmentCatalog(pack){
 const fragments=[];
 for(const source of pack.sources){
  const textSha256=await digest(source.text);
  const fragmentId='F-'+await digest(JSON.stringify([source.sourceCode,source.sourceVersion,source.sourceSha256,source.chapterId,source.support?.startOffset,source.support?.endOffset,textSha256]));
  fragments.push({fragmentId,sourceId:source.id,textSha256,sourceVersion:source.sourceVersion,sourceSha256:source.sourceSha256,chapterId:source.chapterId,sourceLanguage:source.sourceLanguage,text:source.text,support:source.support,pdfPages:source.pdfPages,chapterDeepLink:source.chapterDeepLink});
 }
 return {packDigest:pack.packDigest,fragments,semanticAcceptance:false};
}
export function renderMembershipFragmentSupport(fragmentIds,catalog){
 if(!Array.isArray(fragmentIds)||!fragmentIds.length||new Set(fragmentIds).size!==fragmentIds.length)throw Error('FRAGMENT_SUPPORT_INVALID');
 return fragmentIds.map(id=>{const f=catalog.fragments.find(x=>x.fragmentId===id);if(!f)throw Error('FRAGMENT_NOT_IN_THIS_PACK');
  // Exact source excerpt generated server-side, never a quote invented by the
  // model. The UI may disclose bounded excerpts separately from paraphrases.
  return {fragmentId:id,sourceId:f.sourceId,chapterId:f.chapterId,sourceVersion:f.sourceVersion,sourceSha256:f.sourceSha256,sourceLanguage:f.sourceLanguage,support:f.support,pdfPages:f.pdfPages,chapterDeepLink:f.chapterDeepLink,excerpt:f.text,semanticSupport:'REQUIRES_SEPARATE_CLAIM_REVIEW',publicExcerptDisclosure:'NOT_AUTOMATICALLY_AUTHORIZED'};
 });
}
export async function createMembershipFragmentRequestCandidate(pack){
 const catalog=await createMembershipFragmentCatalog(pack);
 const coverage=assessMembershipSourceCoverage(pack);
 return {contract:'MEMBERSHIP_FRAGMENT_CANDIDATE_OFFLINE_ONLY',question:pack.question,locale:pack.locale,packDigest:pack.packDigest,glossary:pack.glossary||[],coverage,sources:catalog.fragments.map(f=>({fragmentId:f.fragmentId,chapterId:f.chapterId,sourceLanguage:f.sourceLanguage,text:f.text})),constraints:{...pack.constraints,answerSchema:{locale:pack.locale,claims:[{text:'Faithful paraphrase',supportFragmentIds:['fragment ID']}],boundary:'State specific missing evidence'},directQuotes:'DO_NOT_GENERATE; SERVER_RENDERS_EXACT_SOURCE',qualifiers:'Preserve uncertainty, conditions and scope; general running conditions do not prove component replacement conditions',semanticReview:'FRAGMENT_ID_EXISTENCE_IS_NOT_ENTAILMENT',knownMissingEvidence:coverage.missingGroups,providerAuthorization:false},catalog};
}
// Recall coverage only, not a semantic equivalence registry. Concepts remain
// independent; comparison requires evidence for each side and its relation.
export function assessMembershipSourceCoverage(pack){
 const groups=[['components',/组成部分|组成要素|部件|元素|要素|components?|elements?|constituent/iu,/组成部分|组成要素|部件|元素|要素/u],['maintenance',/维护|维持|maintenance/iu,/维护|维持/u],['repair',/修理|repair/iu,/修理/u],['recovery',/恢复|recovery|recover/iu,/恢复/u]];
 const text=pack.sources.map(s=>s.text.replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/gu,'$1')).join('\n\n');
 const requested=groups.filter(([,query])=>query.test(pack.question));
 const missingGroups=requested.filter(([,query,evidence])=>!evidence.test(text)).map(([name])=>name);
 const comparison=/区别|差别|差异|不同|比较|相同|differ|distinguish|compare|versus/iu.test(pack.question);
 return {requestedGroups:requested.map(([name])=>name),missingGroups,comparison,comparisonRelation:'REQUIRES_ARGUMENT_LEVEL_SUPPORT_NOT_KEYWORD_PRESENCE',state:!pack.sources.length?'SOURCE_INSUFFICIENT':missingGroups.length?'PARTIAL_SOURCE_SCOPE':'CANDIDATE_COVERAGE_REQUIRES_SEMANTIC_REVIEW',semanticPass:false};
}
