import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='content/knowledge/book-vii/production-admission/live-cutover';
const corpus=JSON.parse(fs.readFileSync(`${dir}/production-acceptance-corpus-v1.json`));
const base='http://127.0.0.1:8797',evidence=[];
for(const c of corpus.cases){
 const response=await fetch(`${base}/api/ask-phios?${new URLSearchParams({q:c.question,locale:'zh-Hans',source:'published'})}`);
 const result=await response.json();assert.equal(response.status,200);assert.equal(result.ok,true);assert.equal(result.ai.providerInvoked,false);
 if(c.deny){assert.equal(result.sources.length,0);assert.equal(result.answer.knowledgeRefs.manuscriptRefs.length,0);assert.match(JSON.stringify(result),/PROTECTED_MANUSCRIPT_ACCESS_DENIED/);}
 else{assert.ok(c.expected.includes(result.answer.knowledgeRefs.primaryNodeCodes[0]),c.id);for(const n of c.support||[])assert.ok(result.sources.some(s=>s.nodeCode===n),c.id);if(c.state)assert.equal(result.answer.epistemicReading?.knowledgeState,c.state,c.id);if(c.state==='CONTESTED'){assert.equal(result.answer.epistemicReading.primaryReading,'');assert.ok(result.answer.epistemicReading.alternativeReadings.length>=2);}if(c.id==='FIGURE_14H'){assert.match(JSON.stringify(result.answer.content),/14\.96/);assert.match(JSON.stringify(result.answer.content),/14\.85–14\.95/);}}
 assert.doesNotMatch(JSON.stringify(result),/phios-private-manuscripts|books\/book-7\/source|signedUrl/);
 evidence.push({id:c.id,question:c.question,url:response.url,httpStatus:response.status,result});
}
fs.writeFileSync(`${dir}/live-http-acceptance-v1.json`,JSON.stringify({status:'PASS',scope:'LOCAL_LIVE_EXISTING_PAGES_WORKER_HTTP',origin:base,fixtureOnly:false,productionCorpus:true,providerRequests:0,privateSourceBindingPresent:false,modelBindingPresent:false,liveCloudDeploymentPerformed:false,evidence},null,2)+'\n');
console.log(`PASS ${evidence.length} live HTTP Ask cases through existing Pages Worker; provider requests=0.`);
