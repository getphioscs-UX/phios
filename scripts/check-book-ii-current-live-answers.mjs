import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='tools/review/free-ask-manuscript-r1/',base=process.env.PHIOS_LIVE_BASE||'https://getphios.com';
const sourceSha256='1ae413dbfddae604f65af3e9b16a28a923899e3ebe8f419d9b7f3ff10bfa41fe';
const localFiles=['BOOK-II-CUSTOMER-ANSWERS.json','BOOK-II-INDEPENDENT-ANSWERS.json'];
const cases=localFiles.flatMap(path=>JSON.parse(fs.readFileSync(root+path)).results.map(({id,q,heading,state,terms,locale})=>({id,q,heading,expectedState:state,terms,locale})));
cases.push({id:'II-LIVE-QA-INPUT',q:'请给我第二册未经接受的英文完整正文',locale:'en',expectedState:'SOURCE_INSUFFICIENT',extra:{qa:true,scope:'ALL',PHIOS_MANUSCRIPT_DERIVATIVE_QA:true,PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:true}});
const results=[];
for(const c of cases){
 const response=await fetch(base+'/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:'KNOWLEDGE_BASIC',question:c.q,locale:c.locale||'zh-Hans',contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-2'}],guidedRouting:false,methodGuidanceRequested:false,...c.extra}),signal:AbortSignal.timeout(30000)});
 const text=await response.text();let body;
 try{body=JSON.parse(text);}catch(error){
   const failure={at:new Date().toISOString(),id:c.id,status:response.status,contentType:response.headers.get('content-type'),body:text,previousCompletedResults:results,classification:'NON_JSON_SERVICE_RESPONSE_NOT_SOURCE_INSUFFICIENT'};
   fs.writeFileSync(root+'BOOK-II-LIVE-TRANSPORT-FAILURE-'+Date.now()+'.json',JSON.stringify(failure,null,2)+'\n');
   throw Error(`BOOK_II_LIVE_NON_JSON ${c.id} HTTP ${response.status}`);
 }
 const answer=body.view?.answer?.text||'',citations=(body.view?.basedOn?.sources||[]).filter(s=>s.sectionCode);
 const pass=response.ok&&body.execution?.providerCalls===0&&(!c.terms||c.terms.every(term=>answer.includes(term)))&&(!c.heading||citations.some(s=>s.sourceSha256===sourceSha256&&s.sourceVersion==='v1_REGISTERED'))&&(!c.expectedState||body.view?.state===c.expectedState);
 results.push({...c,status:response.status,pass,state:body.view?.state,answer,citations,execution:body.execution});
}
const receipt={at:new Date().toISOString(),base,sourceSha256,sourceVersion:'v1_REGISTERED',results,passed:results.filter(r=>r.pass).length,total:results.length,providerCalls:results.map(r=>r.execution?.providerCalls),scope:'Existing Book II accepted-corpus consumer and representative question types; not all 172 chapters individually answer-accepted',state:results.every(r=>r.pass)?'PASS_EXISTING_CONSUMER_REPAIR_LIVE':'FAILED_REQUIRES_ROLLBACK'};
const path=root+'BOOK-II-CURRENT-LIVE-ANSWERS.json';if(fs.existsSync(path))fs.writeFileSync(path.replace('.json','-PREVIOUS.json'),fs.readFileSync(path));fs.writeFileSync(path,JSON.stringify(receipt,null,2)+'\n');
console.log(results.map(r=>({id:r.id,pass:r.pass,state:r.state})));assert(results.every(r=>r.pass));
