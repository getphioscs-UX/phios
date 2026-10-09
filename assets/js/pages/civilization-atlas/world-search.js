export const normalizeSearch=s=>String(s??'').normalize('NFKC').toLocaleLowerCase().trim();
const text=v=>typeof v==='object'?Object.values(v||{}).flat().join(' '):String(v??'');
function distance(a,b){if(Math.abs(a.length-b.length)>2)return 3;let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));row=next;}return row[b.length];}
export function searchWorld(rows,query,{locale='en',book='',type='',region='',state='',visualOnly=false,period=''}={}){
 const q=normalizeSearch(query),terms=q.split(/\s+/).filter(Boolean);
 return rows.filter(r=>(!book||r.book===book)&&(!type||r.type===type)&&(!region||String(r.regionId)===region)&&(!state||r.state===state)&&(!visualOnly||r.visualAssets?.length)&&(!period||String(r.time?.start||'').startsWith(period))).map(r=>{
 if(!q)return {row:r,score:1,matched:''};const title=normalizeSearch(r.title?.[locale]),both=normalizeSearch(text(r.title)),aliases=normalizeSearch(text(r.aliases)),keywords=normalizeSearch(text(r.keywords)),geotime=normalizeSearch(text(r.region)+' '+text(r.time)),summary=normalizeSearch(text(r.summary)),id=normalizeSearch(r.id);
 const hay=both+' '+aliases+' '+keywords+' '+geotime+' '+summary+' '+id;if(!terms.every(t=>hay.includes(t))){if(!/^[a-z ]{4,40}$/.test(q)||!title.split(/\W+/).some(w=>w.length>=4&&distance(w,q)<=Math.min(2,Math.floor(q.length/5))))return null;return {row:r,score:25,matched:r.title?.[locale]};}
 const score=title===q?1000:aliases.split(/[|,]/).includes(q)?900:title.startsWith(q)?800:both.includes(q)?700:aliases.includes(q)?600:keywords.includes(q)?500:geotime.includes(q)?400:summary.includes(q)?300:id.includes(q)?100:200;return {row:r,score,matched:r.summary?.[locale]||r.title?.[locale]};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.row.id.localeCompare(b.row.id));
}
