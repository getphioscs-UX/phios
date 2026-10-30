// One presentation interpreter shared by Home discovery and World. No data authority.
export const WORLD_JOURNEYS=Object.freeze(['now','connections','history','compare']);
const modes=new Set(['landing',...WORLD_JOURNEYS,'companies']);
export function worldQuestionTarget(value,{selected=false}={}){
 const q=String(value||'').normalize('NFKC').trim();
 if(!q||q.length>500||/自杀|自傷|自伤|suicid|emergency|急救|我的(?:账户|投资|工资|家庭|关系)|my (?:account|portfolio|salary|relationship)/i.test(q))return null;
 if(/相关文章|阅读.*文章|在哪里读|知识搜索|\b(?:knowledge|article|where.*read)\b/i.test(q))return null;
 let journey=null,symbol=null,company=null,region=null;
 if(/东方咖啡|東方咖啡|oriental\s*(?:kopi|coffee)|MYX:0338/i.test(q)){journey='companies';symbol='MYX:0338';}
 else if(/NVIDIA|英伟达|輝達/i.test(q)){journey='companies';company='NVIDIA';}
 else if(/\bMYX:\d{4}\b/i.test(q)){journey='companies';symbol=q.match(/MYX:\d{4}/i)[0].toUpperCase();}
 else if(/公司|企业研究|企業研究|上市|财报|財報|\b(?:company|companies|corporate|earnings|stock)\b/i.test(q))journey='companies';
 else if(/供应链|供應鏈|网络|網絡|贸易|貿易|港口|交通|城市|产业|產業|\b(?:supply\s*chains?|networks?|trade|ports?|transport|cities|urban|industr(?:y|ies))\b/i.test(q))journey='connections';
 else if(/比较|比較|对照|對照|\bcompar(?:e|ison)\b/i.test(q))journey='compare';
 else if(/文明|历史|歷史|罗马|羅馬|\b(?:history|civilizations?|rome|roman)\b/i.test(q))journey='history';
 else if(/世界|地区|地區|经济|經濟|人口|能源|马来西亚|馬來西亞|\b(?:world|econom(?:y|ic)|population|energy|malaysia|regions?)\b/i.test(q))journey=/世界正在发生什么|世界正在發生什麼|understand the world|what.*happening.*world/i.test(q)?'landing':'now';
 else if(selected)journey='landing';
 if(!journey)return null;
 if(/马来西亚|馬來西亞|malaysia/i.test(q))region='MYS';
 const u=new URL('/world/','https://getphios.com');u.searchParams.set('worldJourney',journey);
 if(symbol)u.searchParams.set('symbol',symbol);if(company)u.searchParams.set('q',company);
 if(journey==='history'&&/罗马|羅馬|\b(?:rome|roman)\b/i.test(q))u.hash='v=2&mode=history&pane=cases&case=CA-T06-02';
 if(journey==='connections')u.hash='v=2&mode=current&pane=map&topic=connections';
 if(journey==='now'&&region)u.hash='v=2&mode=current&pane=data&region=MYS&topic=economy&year=2024';
 return {journey,href:u.pathname+u.search+u.hash,reason:'EXPLICIT_PUBLIC_WORLD_TASK',company,region};
}
export function worldRouteFromURL(value){
 const u=new URL(value,'https://getphios.com'),q=u.searchParams,h=new URLSearchParams(u.hash.slice(1)),explicit=q.get('worldJourney');
 let journey='landing';
 if(q.has('reading'))journey='history';
 else if(modes.has(explicit))journey=explicit;
 else if(q.has('symbol')||['company','market'].includes(q.get('intent')))journey='companies';
 else if(q.get('intent')==='compare'||q.has('objectCompare')||q.get('atlas')==='comparison'||h.get('mode')==='compare')journey='compare';
 else if(['connections','network','industry'].includes(q.get('intent')))journey='connections';
 else if(q.get('view')==='reconfiguration'||q.get('intent')==='current'||h.get('mode')==='current')journey='now';
 else if(['structure','history','timeline'].includes(q.get('intent'))||q.has('atlas')||h.get('mode')==='history'||Number(h.get('book'))>0)journey='history';
 else if(q.has('q'))journey=worldQuestionTarget(q.get('q'))?.journey||'now';
 return {journey,unknownIntent:!!explicit&&!modes.has(explicit),reading:q.get('reading'),topic:journey==='connections'?(h.get('topic')||'connections'):h.get('topic'),region:h.get('region'),companyQuery:journey==='companies'?q.get('q'):null};
}
export const worldJourneyFromURL=value=>worldRouteFromURL(value).journey;
export function worldJourneyURL(value,journey){
 if(!modes.has(journey))throw Error('WORLD_JOURNEY_INVALID');
 const u=new URL(value,'https://getphios.com');u.searchParams.set('worldJourney',journey);
 for(const k of ['reading','atlas','view','intent','explore','q','symbol'])u.searchParams.delete(k);
 const h=new URLSearchParams(u.hash.slice(1));
 if(journey==='connections'){h.set('mode','current');h.set('topic','connections');h.set('pane','map');}
 else if(['now','history','compare'].includes(journey)){h.set('mode',{now:'current',history:'history',compare:'compare'}[journey]);h.delete('pane');}
 u.hash=h.toString();return u;
}
export function worldNeedsLegacyReader(value){const u=new URL(value,'https://getphios.com');return ['reading','atlas','view','explore'].some(k=>u.searchParams.has(k))||u.hash==='#atlas'||u.hash==='#world-object-actions';}
