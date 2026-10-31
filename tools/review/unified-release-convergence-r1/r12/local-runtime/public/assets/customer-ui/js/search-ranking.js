const norm=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const stop=new Set(['what','is','are','the','a','an','of','how','does','why','can']);
export function rankPublicSearch(corpus,query){
 const q=norm(query),terms=q.split(' ').filter(x=>!stop.has(x));
 if(!q)return ['ARTICLE','BOOK','FIGURE','STRUCTURED_OBJECT','ATLAS','CONCEPT'].flatMap(type=>corpus.filter(x=>x.type===type).slice(0,2));
 return corpus.map(item=>{
  const title=norm(item.title),hay=norm(item.terms),ids=(item.ids||[]).map(norm),aliases=(item.aliases||[]).map(norm);
  const exactId=ids.includes(q),exactTitle=title===q,exactAlias=aliases.includes(q);
  const hits=terms.filter(t=>hay.includes(t)).length,coverage=hits/Math.max(1,terms.length);
  const phrase=terms.join(' '),titlePhrase=phrase&&title.includes(phrase);
  const eligible=exactId||exactTitle||exactAlias||titlePhrase||(terms.length>0&&coverage===1);
  const score=exactId?900:exactTitle?800:exactAlias?700:title.startsWith(q)?500:titlePhrase?400:coverage===1?200:0;
  return {...item,score,exactMatch:exactId||exactTitle||exactAlias,eligible};
 }).filter(x=>x.eligible).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
}
