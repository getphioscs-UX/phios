import assert from 'node:assert/strict';
import {normalizeAskContext} from '../assets/customer-ui/js/ask-context-contract.js';
import {rankPublicSearch} from '../assets/customer-ui/js/search-ranking.js';
import {resolveSelectedArticle} from '../functions/contextual-ask/contextual-ask-runtime.js';
import {onRequestPost} from '../functions/api/customer-contextual-ask.js';
import {localAsset} from './lib/ca-r1-preview-server.mjs';
const env={ASSETS:{fetch:r=>localAsset(r.url)}};
assert.equal(normalizeAskContext({contextType:'ARTICLE',contextId:'book3-article-008'}).contextRef,'ARTICLE:book3-article-008');
assert.equal(normalizeAskContext({contextType:'KNOWLEDGE',contextId:'ARTICLE:book3-article-008'}).contextType,'KNOWLEDGE');
assert.equal(normalizeAskContext({contextRoute:'//evil.test'}).contextRoute,'/knowledge/');
for(const locale of ['en','zh-Hans']){
 const selected=await resolveSelectedArticle(env,'book3-article-008',locale);assert.ok(selected?.sources.length);assert.equal(await resolveSelectedArticle(env,'missing',locale),null);
 const response=await onRequestPost({env,request:new Request('https://test.local/api/customer-contextual-ask',{method:'POST',body:JSON.stringify({question:locale==='en'?"Why can't AI decide what deserves protection?":'为什么 AI 不能决定什么值得保护？',locale,contexts:[{contextType:'KNOWLEDGE',contextRef:'ARTICLE:book3-article-008'}]})})});
 const payload=await response.json();assert.equal(response.status,200,JSON.stringify(payload));console.log(locale,JSON.stringify(payload.view).slice(0,1700));
 assert.ok(JSON.stringify(payload.view).includes('book3-article-008'),'selected source lost');
 assert.match(payload.view.answer.text,locale==='en'?/value|cost|legitimacy|responsibility|protect/i:/价值|成本|责任|正当|保护/);
 const failed=await onRequestPost({env,request:new Request('https://test.local/api/customer-contextual-ask',{method:'POST',body:JSON.stringify({question:'Explain this',locale,contexts:[{contextType:'KNOWLEDGE',contextRef:'ARTICLE:missing'}]})})});assert.equal(failed.status,422);
}
const rows=[{title:'Noise',terms:'Reality and other things',type:'ARTICLE'},{title:'Reality Continuity',terms:'Reality Continuity',type:'BOOK'},{title:'Figure',ids:['FIG 11F'],terms:'11F',type:'FIGURE'}];
assert.equal(rankPublicSearch(rows,'Reality Continuity')[0].type,'BOOK');assert.equal(rankPublicSearch(rows,'Reality Continuity').length,1);assert.equal(rankPublicSearch(rows,'FIG 11F')[0].type,'FIGURE');
console.log('✓ Context compatibility, selected article grounding, unavailable source rejection and search precision.');
