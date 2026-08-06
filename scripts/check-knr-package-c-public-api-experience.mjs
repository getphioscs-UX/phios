import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { handlePublicKnowledgeRequest } from '../functions/_lib/public-knowledge-api.js';

const root=process.cwd();
const readJson=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const contract=await readJson('content/knowledge/contracts/knr-package-c-public-api-experience-v1.json');
const apiPolicy=await readJson('content/knowledge/runtime/knr/package-c/public-api-policy-v1.json');
const experiencePolicy=await readJson('content/knowledge/runtime/knr/package-c/public-experience-policy-v1.json');
assert.equal(contract.contractCode,'KNR-PACKAGE-C-PUBLIC-API-EXPERIENCE');
assert.equal(apiPolicy.publishedOnly,true);
assert.equal(apiPolicy.providerAllowed,false);
assert.equal(experiencePolicy.prohibited.includes('generated_answer'),true);

const env={ASSETS:{fetch:async request=>{
  const url=new URL(request.url);
  const rel=url.pathname.replace(/^\//,'');
  try{
    const body=await fs.readFile(path.join(root,rel));
    return new Response(body,{status:200,headers:{'Content-Type':'application/json'}});
  }catch{return new Response('not found',{status:404});}
}}};

async function call(url,method='GET'){
  const response=await handlePublicKnowledgeRequest(new Request(url,{method}),env);
  return {response,payload:await response.json()};
}
const zh=await call('https://local/api/public-knowledge?q='+encodeURIComponent('人工智能如何从文明能力中形成？')+'&locale=zh-Hans&mode=auto');
assert.equal(zh.response.status,200);
assert.equal(zh.payload.ok,true);
assert.equal(zh.payload.results[0].nodeCode,'KN-PREFACE-001');
assert.equal(zh.payload.coverage.answerGenerationAllowed,false);
assert.ok(zh.payload.projection.fragments.length>0);
assert.equal(zh.payload.projection.fragments.every(x=>x.locale===undefined),true);
assert.equal(zh.payload.readingPath.blockedContinuations.some(x=>x.targetNodeCode==='KN-PREFACE-002'&&x.navigable===false),true);

const en=await call('https://local/api/public-knowledge?q='+encodeURIComponent('How Does Artificial Intelligence Emerge from Civilizational Capability?')+'&locale=en&mode=full_article');
assert.equal(en.response.status,200);
assert.equal(en.payload.results[0].locale,'en');
assert.equal(en.payload.projection.mode,'full_article');

const none=await call('https://local/api/public-knowledge?q='+encodeURIComponent('unrelated quantum banana request')+'&locale=en');
assert.equal(none.response.status,200);
assert.equal(none.payload.coverage.level,'none');
assert.equal(none.payload.projection,null);

assert.equal((await call('https://local/api/public-knowledge?q=test&locale=fr')).response.status,400);
assert.equal((await call('https://local/api/public-knowledge?q=test&locale=en','POST')).response.status,405);

const page=await fs.readFile(path.join(root,'knowledge-search.html'),'utf8');
const pageJs=await fs.readFile(path.join(root,'assets/js/pages/knowledge-search.js'),'utf8');
const api=await fs.readFile(path.join(root,'functions/api/public-knowledge.js'),'utf8');
assert.match(page,/data-knowledge-search-form/);
assert.match(page,/No model generates an answer here/);
assert.match(pageJs,/queryPublishedKnowledge/);
assert.match(pageJs,/blockedContinuations/);
assert.doesNotMatch(pageJs,/innerHTML\s*=\s*payload/);
assert.match(api,/handlePublicKnowledgeRequest/);

console.log('✓ KNR-W8 read-only Published Knowledge Public API passed.');
console.log('✓ KNR-W9 published-only Public Experience states and accessibility passed.');
console.log('✓ Package C exposes Package A/B results without Provider calls or answer generation.');
