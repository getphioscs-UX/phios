import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const normalizeText=value=>typeof value==='string'?value.normalize('NFKC').toLowerCase().replace(/\s+/gu,' ').trim():'';
const titles=value=>Object.values(typeof value==='string'?{text:value}:value||{}).map(normalizeText).filter(Boolean);
const grams=text=>{const chars=Array.from(normalizeText(text));return new Set(chars.slice(1).map((c,i)=>chars[i]+c));};
const similarity=(a,b)=>{const x=grams(a),y=grams(b);if(!x.size||!y.size)return 0;return [...x].filter(g=>y.has(g)).length/(x.size+y.size-[...x].filter(g=>y.has(g)).length);};
export function buildDedupReport({candidates,backlinks}){
 const rows=[...candidates].sort((a,b)=>a.candidateId.localeCompare(b.candidateId,'en'));
 assert.equal(new Set(rows.map(c=>c.candidateId)).size,rows.length,'DUPLICATE_CANDIDATE_ID');
 assert.equal(new Set(rows.map(c=>c.sourceObjectId)).size,rows.length,'DUPLICATE_OBJECT_ID');
 const links=new Map(backlinks.map(b=>[b.objectId,b]));
 for(const c of rows)assert.equal(links.get(c.sourceObjectId)?.bookCode,c.bookCode,'BACKLINK_OWNER_MISMATCH');
 const findings=[];let supportedPairs=0;
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const a=rows[i],b=rows[j],am=normalizeText(a.proposedMeaning),bm=normalizeText(b.proposedMeaning);
  const sameTitle=titles(a.proposedTitle).some(t=>titles(b.proposedTitle).includes(t));
  const reasons=[];const supported=!!am&&!!bm;if(supported)supportedPairs++;
  const score=supported?similarity(am,bm):null;
  if(supported&&am===bm)reasons.push('EXACT_TEXT_DIFFERENT_IDS');
  if(sameTitle)reasons.push(supported?(am===bm?'SAME_TITLE_SAME_TEXT':'SAME_TITLE_DIFFERENT_TEXT'):'SAME_TITLE_MEANING_UNRESOLVED');
  if(supported&&am!==bm&&score>=0.65)reasons.push('LEXICAL_OVERLAP');
  if(a.bookCode!==b.bookCode&&(sameTitle||(supported&&(am===bm||score>=0.65))))reasons.push('CROSS_BOOK_OVERLAP');
  const articleIds=new Set(links.get(a.sourceObjectId).publishedArticles.map(x=>x.articleCode));
  const sharedArticles=[...new Set(links.get(b.sourceObjectId).publishedArticles.map(x=>x.articleCode).filter(id=>articleIds.has(id)))].sort();
  // Sharing an article alone is expected many-to-many provenance, not duplication.
  if(supported&&(am===bm||score>=0.65)&&(a.meaningKind==='PUBLISHED_ARTICLE_SUMMARY'||b.meaningKind==='PUBLISHED_ARTICLE_SUMMARY'))reasons.push('ARTICLE_DERIVED_DUPLICATION_CANDIDATE');
  if(!reasons.length)continue;
  const pair=[a.candidateId,b.candidateId];
  findings.push({findingId:'DEDUP-'+createHash('sha256').update(JSON.stringify(pair)).digest('hex').slice(0,20),candidateIds:pair,objectIds:[a.sourceObjectId,b.sourceObjectId],bookCodes:[a.bookCode,b.bookCode],reasons,lexicalSimilarity:score===null?null:Number(score.toFixed(6)),sharedArticleCodes:sharedArticles,evidence:[a,b].map(c=>({candidateId:c.candidateId,title:c.proposedTitle,meaning:c.proposedMeaning,meaningKind:c.meaningKind,sourceQuoteRefs:c.sourceQuoteRefs,manuscriptRef:c.manuscriptRef})),reviewState:'PENDING_HUMAN_REVIEW',semanticEquivalenceConfirmed:false,mergeAllowed:false});
 }
 return {version:'1.0.0',stage:'B14-SKS-W60',policy:{normalization:'NFKC_CASE_WHITESPACE_ONLY',lexicalMetric:'CHARACTER_BIGRAM_JACCARD',lexicalThreshold:0.65,semanticParaphraseDetection:'NOT_IMPLEMENTED_HUMAN_REVIEW_REQUIRED',sharedArticleAloneIsDuplicate:false},coverage:{objects:rows.length,totalPairs:rows.length*(rows.length-1)/2,supportedMeaningPairs:supportedPairs,meaningUnavailable:rows.filter(c=>!normalizeText(c.proposedMeaning)).map(c=>c.candidateId)},findings,automaticMerge:false,automaticRegistryWriteback:false,humanAcceptanceComplete:false};
}
