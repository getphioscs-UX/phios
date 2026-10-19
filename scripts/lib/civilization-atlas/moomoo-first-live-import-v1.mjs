const SECRET_KEY=/authorization|access[_-]?token|refresh[_-]?token|api[_-]?key|secret|password/i;
export function providerTimeISO(value){const n=Number(value);if(!Number.isFinite(n)||n<=0)return null;const ms=n<100000000000?n*1000:n;try{return new Date(ms).toISOString();}catch{return null;}}
export function mergeHistoryKlinePages({symbol,pages=[]}){const out=new Map();for(const page of pages)for(const r of normalizeHistoryKlinePage({symbol,response:page})){const k=[r.instrument,r.timestamp,r.fieldPath].join('|');if(out.has(k)&&JSON.stringify(out.get(k))!==JSON.stringify(r))throw Error('MOOMOO_CONFLICTING_PAGE_BOUNDARY');out.set(k,r);}return [...out.values()].sort((a,b)=>a.timestamp.localeCompare(b.timestamp)||a.fieldPath.localeCompare(b.fieldPath));}
export function nextHistoryWindow({response,start,end}){const raw=response?.data?.kline_list||response?.kline_list||[];const dates=raw.map(r=>providerTimeISO(r.time_key)||(String(r.date||'').match(/^\d{8}$/)?String(r.date).replace(/(\d{4})(\d{2})(\d{2})/,'$1-$2-$3'):r.date)).filter(Boolean).map(x=>x.slice(0,10)).sort();if(!dates.length)return null;const first=dates[0],last=dates.at(-1),shift=(d,n)=>new Date(Date.parse(d)+n*86400000).toISOString().slice(0,10);if(first>start&&last>=end)return {start,end:shift(first,-1),reason:'BACKWARD_WINDOW'};if(last<end&&first<=shift(start,7))return {start:shift(last,1),end,reason:'FORWARD_WINDOW_NO_CURSOR'};const next=priorEndFromNextTime(response?.data?.next_time??response?.next_time);if(next&&next<end&&next>=start)return {start,end:next,reason:'PROVIDER_CURSOR'};return null;}
export function assertNoSecrets(value,path='$'){
  if(!value||typeof value!=='object')return true;
  for(const [k,v] of Object.entries(value)){
    if(SECRET_KEY.test(k)&&v!=null&&String(v).trim())throw new Error('MOOMOO_SECRET_MATERIAL_PRESENT:'+path+'.'+k);
    if(v&&typeof v==='object')assertNoSecrets(v,path+'.'+k);
  }
  return true;
}
export function normalizeHistoryKlinePage({symbol,response}={}){
  const list=response?.data?.kline_list||response?.kline_list||[];
  if(!Array.isArray(list))throw new Error('MOOMOO_KLINE_LIST_INVALID');
  const fields=['open','high','low','close','volume','turnover','pe_ratio','turnover_rate','change_rate'];
  const records=[];
  for(const row of list){
    const stamp=row.time_key!=null?providerTimeISO(row.time_key):(row.date?String(row.date).replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3'):null);
    if(!stamp||!Number.isFinite(Date.parse(stamp)))throw Error('MOOMOO_KLINE_TIMESTAMP_INVALID');
    for(const field of fields){
      if(row[field]==null)continue;
      records.push({fieldPath:'data.kline_list[].'+field,instrument:symbol,timestamp:stamp,value:row[field],unit:field==='volume'?'shares':field==='turnover'?'currency':field.includes('rate')?'percent':field.includes('ratio')?'multiple':'price'});
    }
  }
  return records;
}
export function historyKlineUrl({host='https://webapi.moomoo.com',symbol,start,end,num=370}={}){
  if(!/^US\.[A-Z0-9._-]+$/.test(symbol||''))throw new Error('MOOMOO_SYMBOL_INVALID');
  const u=new URL('/api/v1.0/quote/'+encodeURIComponent(symbol)+'/history-kline',host);
  if(start)u.searchParams.set('start',start);
  if(!end)throw new Error('MOOMOO_END_REQUIRED');
  u.searchParams.set('end',end);
  u.searchParams.set('ktype','2');
  u.searchParams.set('autype','1');
  u.searchParams.set('num',String(num));
  u.searchParams.set('extended_time','0');
  return u.toString();
}
export function priorEndFromNextTime(nextTime){
  return providerTimeISO(nextTime)?.slice(0,10)||null;
}
