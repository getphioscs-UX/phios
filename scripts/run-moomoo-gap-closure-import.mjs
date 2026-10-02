import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeCapitalFlow,normalizeValuation,normalizeFinancials,normalizeRevenueBreakdown} from './lib/civilization-atlas/moomoo-gap-closure-import-v1.mjs';
import {assertNoSecrets} from './lib/civilization-atlas/moomoo-first-live-import-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,v)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(v,null,2)+'\n');
const token=String(process.env.MOOMOO_ACCESS_TOKEN||'').trim();
if(!token){console.error('NO_VALID_AUTH: MOOMOO_ACCESS_TOKEN is not set. No network request was made.');process.exit(2);}
const plan=read('content/civilization-atlas/reconfiguration/moomoo-first-data-request-plan-v1.json');
const intake=read('content/civilization-atlas/reconfiguration/market-provider-intake-v1.json');
const runAt=new Date().toISOString();
const payloads=[],failures=[];
const headers={Authorization:'Bearer '+token,Accept:'application/json'};
const fetchJson=async url=>{const res=await fetch(url,{headers});const t=await res.text();let b;try{b=JSON.parse(t);}catch{throw new Error('MOOMOO_JSON_INVALID:HTTP_'+res.status);}if(!res.ok||Number(b?.ret_code??0)!==0)throw new Error('MOOMOO_PROVIDER_ERROR:HTTP_'+res.status+':'+(b?.error?.code||b?.ret_msg||'UNKNOWN'));assertNoSecrets(b);return b;};
const host='https://webapi.moomoo.com';

for(const req of plan.requests.filter(x=>(plan.gapClosureExecutableRequestIds||[]).includes(x.requestId))){
  if(req.capability==='CAPITAL_FLOW'){
    for(const symbol of req.instruments){
      try{
        const u=new URL('/api/v1.0/quote/'+encodeURIComponent(symbol)+'/capital-flow/history',host);
        u.searchParams.set('period_type','DAY');u.searchParams.set('start',req.window.start);u.searchParams.set('end',req.window.end);u.searchParams.set('count','1000');
        const body=await fetchJson(u);
        payloads.push({payloadId:req.requestId+'-'+symbol.replace('.','-')+'-'+runAt.replace(/[:.]/g,'-'),providerId:'MOOMOO_OPENAPI',capability:'CAPITAL_FLOW',retrievedAt:runAt,request:{market:'US',symbols:[symbol],start:req.window.start,end:req.window.end,period:'DAY'},rawResponse:body,normalizedRecords:normalizeCapitalFlow({symbol,response:body})});
      }catch(e){failures.push({requestId:req.requestId,symbol,error:String(e.message)});}
    }
  } else if(req.capability==='VALUATION'){
    for(const symbol of req.instruments)for(const [valuationType,label] of [[1,'PE'],[2,'PB'],[3,'PS']]){
      try{
        const u=new URL('/api/v1.0/quote/'+encodeURIComponent(symbol)+'/valuation/detail',host);
        u.searchParams.set('valuation_type',String(valuationType));u.searchParams.set('interval_type','6');
        const body=await fetchJson(u);
        payloads.push({payloadId:req.requestId+'-'+symbol.replace('.','-')+'-'+label+'-'+runAt.replace(/[:.]/g,'-'),providerId:'MOOMOO_OPENAPI',capability:'VALUATION',retrievedAt:runAt,request:{market:'US',symbols:[symbol],valuationType:label,interval:'YEAR5'},rawResponse:body,normalizedRecords:normalizeValuation({symbol,response:body,valuationType:label})});
      }catch(e){failures.push({requestId:req.requestId,symbol,valuationType:label,error:String(e.message)});}
    }
  } else if(req.capability==='FINANCIAL_STATEMENTS'){
    for(const symbol of req.instruments)for(const statementType of [1,2,3,4]){
      try{
        const u=new URL('/api/v1.0/quote/'+encodeURIComponent(symbol)+'/financials/statements',host);
        u.searchParams.set('statement_type',String(statementType));u.searchParams.set('financial_type','10');u.searchParams.set('limit','50');
        const body=await fetchJson(u);
        payloads.push({payloadId:req.requestId+'-'+symbol.replace('.','-')+'-S'+statementType+'-'+runAt.replace(/[:.]/g,'-'),providerId:'MOOMOO_OPENAPI',capability:'FINANCIAL_STATEMENTS',retrievedAt:runAt,request:{market:'US',symbols:[symbol],statementType,financialType:10,limit:50},rawResponse:body,normalizedRecords:normalizeFinancials({symbol,response:body,statementType})});
      }catch(e){failures.push({requestId:req.requestId,symbol,statementType,error:String(e.message)});}
    }
  } else if(req.capability==='REVENUE_BREAKDOWN'){
    for(const symbol of req.instruments){
      try{
        const u=new URL('/api/v1.0/quote/'+encodeURIComponent(symbol)+'/financials/revenue-breakdown',host);
        const body=await fetchJson(u);
        payloads.push({payloadId:req.requestId+'-'+symbol.replace('.','-')+'-'+runAt.replace(/[:.]/g,'-'),providerId:'MOOMOO_OPENAPI',capability:'REVENUE_BREAKDOWN',retrievedAt:runAt,request:{market:'US',symbols:[symbol],date:0,financialType:0},rawResponse:body,normalizedRecords:normalizeRevenueBreakdown({symbol,response:body})});
      }catch(e){failures.push({requestId:req.requestId,symbol,error:String(e.message)});}
    }
  }
}
const prefixes=plan.gapClosureExecutableRequestIds||[];
const prior=(intake.payloads||[]).filter(x=>!prefixes.some(p=>String(x.payloadId||'').startsWith(p+'-')));
write('content/civilization-atlas/reconfiguration/market-provider-intake-v1.json',{...intake,version:'1.2.0',status:payloads.length?'GAP_CLOSURE_PROVIDER_PAYLOADS_IMPORTED':'GAP_CLOSURE_IMPORT_NO_SUCCESSFUL_PAYLOADS',payloads:[...prior,...payloads],boundary:'Provider payloads only; credentials are excluded. Claims/evidence/semantic promotion remain separate stages.'});
write('content/civilization-atlas/reconfiguration/runtime-position-w8e-p2-gap-closure-live-state-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8E-P2-GAP-CLOSURE-LIVE-STATE-v1.0.0',version:'1.0.0',status:payloads.length?'GAP_CLOSURE_LIVE_IMPORT_COMPLETED':'GAP_CLOSURE_LIVE_IMPORT_FAILED',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8E-P2-GAP-CLOSURE',lastRunAt:runAt,payloadsWritten:payloads.length,failures,claimCandidates:0,cwaEvidence:0,w8ePromotions:0});
console.log('MOOMOO_GAP_CLOSURE_IMPORT completed: payloads='+payloads.length+', failures='+failures.length+'. Token was not persisted.');
if(failures.length)process.exitCode=1;
