import http from 'node:http';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {retrieveQuality,customerAnswer,minimalEvidencePack} from '../../../functions/_lib/knowledge-answer-quality-local.js';
import {loadWorldQualityAnswer} from '../../../functions/_lib/world-answer-quality.js';
const dir='tools/review/knowledge-answer-quality-r1/',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export async function start({port=59835}={}){
 const units=read(dir+'ARGUMENT-INDEX.json').units,concepts=read('content/registry/concepts.json').concepts;
 const packet=read('content/world/local-answer-quality-r1.json');
 const env={ASSETS:{fetch:async req=>new URL(req.url).pathname==='/content/world/local-answer-quality-r1.json'?Response.json(packet):new Response('',{status:403})}};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  try{const url=new URL(req.url,'http://'+req.headers.host);
   if(req.method==='POST'&&url.pathname==='/query'){
    if(req.headers.origin&&req.headers.origin!==url.origin){res.writeHead(403).end();return;}
    let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){res.writeHead(413).end();return;}}
    const input=JSON.parse(body);if(Object.keys(input).some(k=>!['question','locale'].includes(k)))throw Error('INPUT_INVALID');
    const result=retrieveQuality({...input,units,concepts});const known=await loadWorldQualityAnswer({...input,env});
    const answer=known?{directAnswer:known.directAnswer,reasons:known.reasons,impacts:known.impacts,limitations:known.limitations,sources:known.sources,nextSteps:known.nextSteps,route:'EXISTING_REVIEWED_MECHANISM_LOCAL_CANDIDATE'}:customerAnswer(result);
    res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({answer,diagnostics:{requirements:result.contract,coverage:result.coverage,top5:result.relatedReading.slice(0,5).map(r=>({id:r.sourceId,score:r.score,classification:r.classification,locator:r.unit.locator})),pack:minimalEvidencePack(result)}}));return;
   }
   if(req.method!=='GET'){res.writeHead(405).end();return;}
   const allow={'/':'REVIEW.html','/questions':'QUESTIONS.json','/results':'PAIRED-RESULTS.json','/audit':'AUDIT.md','/coverage':'CORPUS-COVERAGE.json','/checkpoint':'CHECKPOINT.json','/cost':'COST-AND-MODEL.json','/english-sources':'SOURCE-INVENTORY.json','/english-update':'ENGLISH-SOURCE-UPDATE.md','/english-plan':'ENGLISH-INCREMENTAL-INDEX-PLAN.md','/english-checkpoint':'ENGLISH-SOURCE-CHECKPOINT.json','/book-pdf-policy':'book-pdf-delivery/DELIVERY-DECISION.md','/book-pdf-evidence':'book-pdf-delivery/FULL-AUTHOR-REGRESSION.json','/book-pdf-checkpoint':'book-pdf-delivery/CHECKPOINT.json'};
   if(!allow[url.pathname]){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',url.pathname==='/'?'text/html; charset=utf-8':allow[url.pathname].endsWith('.md')?'text/plain; charset=utf-8':'application/json; charset=utf-8');res.end(fs.readFileSync(dir+allow[url.pathname]));
  }catch{res.writeHead(400).end(JSON.stringify({error:'Please use a public question of up to 500 characters and choose English or Chinese.'}));}
 });await new Promise(r=>server.listen(port,'127.0.0.1',r));return {origin:'http://127.0.0.1:'+server.address().port,stop:()=>new Promise(r=>server.close(r))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const s=await start();console.log('Local retrieval / answer review: '+s.origin);}
