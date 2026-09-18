import fs from 'node:fs';
import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/customer-contextual-ask.js';
const env={ASSETS:{fetch:async request=>{try{return new Response(fs.readFileSync('.'+new URL(request.url).pathname));}catch{return new Response('',{status:404});}}}};
const fixtures=JSON.parse(fs.readFileSync('content/books/book-5/maintenance/ask-fixtures-v1.json')).fixtures;
const run=async(question,ref,locale='zh-Hans')=>{
 const request=new Request('https://phios.test/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question,locale,contexts:[{contextType:'KNOWLEDGE',contextRef:ref}],knowledgeContext:{contextRef:ref,contextLabel:'UNTRUSTED_CLIENT_LABEL',contextSummary:'UNTRUSTED_CLIENT_PROSE'},privateProfile:'MUST_NOT_BE_READ'})});
 const response=await onRequestPost({request,env});return {status:response.status,payload:await response.json()};
};
const results=[];
for(const fixture of fixtures){
 const result=await run(fixture.question,'BOOK:BOOK-5');assert.equal(result.status,200);
 const view=result.payload.view;assert.ok(view.answer.text.length>40);
 assert.doesNotMatch(JSON.stringify(view),/UNTRUSTED_CLIENT_PROSE|MUST_NOT_BE_READ/);
 assert.ok(fixture.expectedArticles.some(slug=>view.relatedKnowledge.some(r=>r.href==='/articles/'+slug)),fixture.question);
 if(fixture.question.includes('蒙古')){assert.match(view.answer.text,/蒙古|欧亚/);assert.doesNotMatch(view.answer.text.split('。')[0],/第一突厥/);}
 if(fixture.expectedSnapshots){for(const id of fixture.expectedSnapshots){assert.ok(view.relatedKnowledge.some(r=>r.href.includes('snapshot='+id)));assert.ok(view.answer.text.includes(id.slice(3)));}}
 results.push({question:fixture.question,status:'PASS',answer:view.answer.text,sources:view.basedOn.sources,relatedKnowledge:view.relatedKnowledge});
}
const question='为什么这里的繁荣没有决定后来唯一的道路？';
const song=await run(question,'ARTICLE:book5-song-china'),industrial=await run(question,'ARTICLE:book5-industrial-threshold');
assert.equal(song.status,200);assert.equal(industrial.status,200);assert.notEqual(song.payload.view.answer.text,industrial.payload.view.answer.text);
assert.ok(song.payload.view.basedOn.sources.every(s=>s.href==='/articles/book5-song-china'));
assert.ok(song.payload.view.relatedKnowledge.some(r=>r.href.includes('case=CA-T09-01')));
assert.ok(song.payload.view.relatedKnowledge.some(r=>r.href.includes('snapshot=WS-1250')));
const absent=await run(question,'ARTICLE:book5-nonexistent');assert.equal(absent.status,422);
const en=await run('Why did Song prosperity not determine industrialization?','ARTICLE:book5-song-china','en');assert.equal(en.status,200);assert.match(en.payload.view.answer.text,/Song|industrial/i);
const englishBookFixtures=[];
for(const question of ['Why did Mongol fragmentation strengthen Eurasian connections?','How did the world of 1250 differ from the world of 1000?','Why did Song prosperity not determine industrialization?']){
 const response=await run(question,'BOOK:BOOK-5','en');assert.equal(response.status,200);const view=response.payload.view;
 assert.doesNotMatch(view.answer.text,/[\u3400-\u9fff]/);assert.ok(view.answer.text.length>120);
 const keys=view.relatedKnowledge.map(r=>{const u=new URL(r.href,'https://phios.test');if(u.searchParams.has('atlas'))assert.equal(u.searchParams.get('locale'),'en');u.searchParams.delete('locale');u.searchParams.sort();return u.pathname+u.search+u.hash;});
 assert.equal(new Set(keys).size,keys.length,'Locale variants must not duplicate the same Atlas state');
 englishBookFixtures.push({question,status:'PASS',answer:view.answer.text,relatedKnowledge:view.relatedKnowledge});
}
fs.writeFileSync('content/books/book-5/maintenance/ask-api-results-v1.json',JSON.stringify({status:'PASS',mode:'EXISTING_API_LOCAL_DETERMINISTIC_COMPOSER',liveProviderConfigured:false,humanDecision:'PENDING_HUMAN_REVIEW',fixtures:results,englishBookFixtures,articleContextChangesAnswer:true,clientProseExcluded:true,missingArticleFailsClosed:true},null,2)+'\n');
console.log('PASS actual existing Ask API: 10 Book V answers and deep links, article-dependent answers, English article response, untrusted prose isolation and missing-source rejection. No live model/provider verification claimed.');
