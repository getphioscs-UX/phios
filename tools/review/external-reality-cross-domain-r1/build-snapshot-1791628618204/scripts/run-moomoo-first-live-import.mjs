import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertNoSecrets,historyKlineUrl,normalizeHistoryKlinePage,priorEndFromNextTime} from './lib/civilization-atlas/moomoo-first-live-import-v1.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,v)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(v,null,2)+'\n');
const token=String(process.env.MOOMOO_ACCESS_TOKEN||'').trim();
if(!token){console.error('NO_VALID_AUTH: MOOMOO_ACCESS_TOKEN is not set. No network request was made.');process.exit(2);}
const plan=read('content/civilization-atlas/reconfiguration/moomoo-first-data-request-plan-v1.json');
const request=plan.requests.find(x=>x.requestId==='MOOMOO-US-HISTORY-KLINE-01');
if(!request)throw new Error('MOOMOO_HISTORY_REQUEST_PLAN_MISSING');
const host='https://webapi.moomoo.com';
const payloads=[];
const failures=[];
const runAt=new Date().toISOString();
for(const symbol of request.instruments){
  let end=request.window.end;
  let page=0;
  const pages=[];
  while(end&&end>=request.window.start){
    page+=1;
    if(page>20)throw new Error('MOOMOO_PAGINATION_GUARD:'+symbol);
    const url=historyKlineUrl({host,symbol,start:request.window.start,end,num:370});
    const res=await fetch(url,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'}});
    const bodyText=await res.text();
    let body;try{body=JSON.parse(bodyText);}catch{throw new Error('MOOMOO_JSON_INVALID:'+symbol+':HTTP_'+res.status);}
    if(!res.ok||Number(body?.ret_code??0)!==0){
      failures.push({symbol,httpStatus:res.status,providerCode:body?.ret_code??null,providerError:body?.error?.code||body?.ret_msg||'UNKNOWN'});
      break;
    }
    assertNoSecrets(body);
    pages.push(body);
    const next=body?.data?.next_time??body?.next_time??null;
    const nextEnd=priorEndFromNextTime(next);
    if(!nextEnd||nextEnd>=end)break;
    end=nextEnd;
  }
  if(failures.some(x=>x.symbol===symbol))continue;
  const normalizedRecords=pages.flatMap(p=>normalizeHistoryKlinePage({symbol,response:p}));
  const rawResponse={pages};
  assertNoSecrets(rawResponse);
  payloads.push({
    payloadId:'MOOMOO-US-HISTORY-KLINE-01-'+symbol.replace('.','-')+'-'+runAt.replace(/[:.]/g,'-'),
    providerId:'MOOMOO_OPENAPI',
    capability:'HISTORY_KLINE',
    retrievedAt:runAt,
    request:{market:'US',symbols:[symbol],start:request.window.start,end:request.window.end,ktype:'DAY',autype:'QFQ',num:370,extended_time:false},
    rawResponse,
    normalizedRecords
  });
}
const intake=read('content/civilization-atlas/reconfiguration/market-provider-intake-v1.json');
const prior=(intake.payloads||[]).filter(x=>!String(x.payloadId||'').startsWith('MOOMOO-US-HISTORY-KLINE-01-'));
const merged={...intake,version:'1.1.0',status:payloads.length?'LIVE_PROVIDER_PAYLOADS_IMPORTED':'LIVE_IMPORT_NO_SUCCESSFUL_PAYLOADS',payloads:[...prior,...payloads],boundary:'Imported payloads contain provider bodies and normalized field lineage only. Authorization headers/tokens are never stored.'};
write('content/civilization-atlas/reconfiguration/market-provider-intake-v1.json',merged);
write('content/civilization-atlas/reconfiguration/moomoo-first-live-import-state-v1.json',{schemaVersion:'PHI-OS-MOOMOO-FIRST-LIVE-IMPORT-STATE-v1.0.0',version:'1.0.0',status:payloads.length?'LIVE_IMPORT_COMPLETED':'LIVE_IMPORT_FAILED',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A-P2-P2',lastRunAt:runAt,authDetected:true,networkInvoked:true,requestId:request.requestId,symbolsPlanned:request.instruments.length,symbolsSucceeded:payloads.length,symbolsFailed:failures.length,payloadsWritten:payloads.length,failures,next:payloads.length?'Run npm run build:runtime-position-48:w8a:p2 to normalize/hash the imported payloads.':'Resolve provider entitlement/API errors and retry; do not create claims from failed symbols.'});
console.log('MOOMOO_FIRST_LIVE_IMPORT completed: succeeded='+payloads.length+', failed='+failures.length+', payloads='+payloads.length+'. Token was not persisted.');
if(failures.length)process.exitCode=1;
