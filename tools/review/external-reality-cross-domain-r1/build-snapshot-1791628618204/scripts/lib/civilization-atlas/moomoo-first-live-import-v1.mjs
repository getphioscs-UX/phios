const SECRET_KEY=/authorization|access[_-]?token|refresh[_-]?token|api[_-]?key|secret|password/i;
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
    const stamp=row.time_key!=null?new Date(Number(row.time_key)).toISOString():(row.date?String(row.date):null);
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
  const n=Number(nextTime);
  if(!Number.isFinite(n)||n<=0)return null;
  return new Date(n).toISOString().slice(0,10);
}
