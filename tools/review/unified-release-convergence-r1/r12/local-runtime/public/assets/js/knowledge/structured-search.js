const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().trim();
export function searchStructuredIndex(rows,query,{bookCode,limit=30}={}){
 const q=normalize(query);if(!q)return [];
 const tokens=q.split(/\s+/u);
 return rows.filter(r=>!bookCode||r.bookCode===bookCode).map(r=>{
  const title=normalize(r.title),aliases=r.aliases.map(normalize),id=normalize(r.objectId);
  const text=[title,id,...aliases,r.objectType,r.bookCode,r.partCode,...r.keywords].map(normalize).join(' ');
  const score=id===q?100:title===q?90:aliases.includes(q)?80:title.includes(q)?60:aliases.some(a=>a.includes(q))?50:tokens.every(t=>text.includes(t))?20:0;
  return {row:r,score};
 }).filter(x=>x.score).sort((a,b)=>b.score-a.score||a.row.objectId.localeCompare(b.row.objectId,'en')).slice(0,Math.max(0,Math.min(100,limit))).map(x=>x.row);
}
export function createStructuredSearch(fetcher=globalThis.fetch){
 let pending;
 return async(query,options)=>{
  if(!normalize(query))return [];
  if(!pending){pending=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetcher('/content/knowledge/structured/structured-knowledge-search-index-v1.json',{signal:controller.signal});if(!r.ok)throw new Error('SEARCH_UNAVAILABLE');return await r.json();}finally{clearTimeout(timer);}})();pending.catch(()=>{pending=undefined;});}
  return searchStructuredIndex(await pending,query,options);
 };
}
export const searchStructuredKnowledge=createStructuredSearch();
