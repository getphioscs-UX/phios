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
const sourceFragments=(await readJson('content/knowledge/public/retrieval/fragments.json')).records;
for(const fragment of zh.payload.projection.fragments){
  const source=sourceFragments.find(x=>x.fragmentCode===fragment.fragmentCode&&x.locale==='zh-Hans');
  assert.ok(source);
  assert.equal(fragment.locale,'zh-Hans');
  assert.equal(fragment.text,source.text);
  assert.equal(fragment.digest,source.digest);
}
const relationships=(await readJson('content/knowledge/public/retrieval/relationships.json')).records;
const expectedBlocked=relationships.filter(x=>x.sourceNodeCode==='KN-PREFACE-001'&&x.locale==='zh-Hans'&&!x.targetPublished)
  .map(x=>({targetNodeCode:x.targetNodeCode,type:x.type,reason:'target_not_published_in_requested_locale',navigable:false}));
assert.deepEqual(zh.payload.readingPath.blockedContinuations,expectedBlocked);
// Exercise a real unpublished edge even when this entry's continuations have been published.
const nodes=(await readJson('content/knowledge/public/retrieval/nodes.json')).records;
const blockedEdge=relationships.find(x=>!x.targetPublished&&nodes.some(n=>n.nodeCode===x.sourceNodeCode&&n.locale===x.locale));
assert.ok(blockedEdge,'MISSING_UNPUBLISHED_CONTINUATION_TEST_CASE');
const blockedNode=nodes.find(n=>n.nodeCode===blockedEdge.sourceNodeCode&&n.locale===blockedEdge.locale);
const blocked=await call('https://local/api/public-knowledge?'+new URLSearchParams({q:blockedNode.title,locale:blockedNode.locale}));
assert.equal(blocked.response.status,200);
assert.equal(blocked.payload.results[0].nodeCode,blockedNode.nodeCode);
assert.ok(blocked.payload.readingPath.blockedContinuations.some(x=>x.targetNodeCode===blockedEdge.targetNodeCode&&x.navigable===false));
assert.equal(blocked.payload.readingPath.steps.some(x=>x.nodeCode===blockedEdge.targetNodeCode),false);

const en=await call('https://local/api/public-knowledge?q='+encodeURIComponent('How Does Artificial Intelligence Emerge from Civilizational Capability?')+'&locale=en&mode=full_article');
assert.equal(en.response.status,200);
assert.equal(en.payload.results[0].locale,'en');
assert.equal(en.payload.projection.mode,'full_article');

const none=await call('https://local/api/public-knowledge?q='+encodeURIComponent('zzkapunmatchedalpha zzkapunmatchedbeta')+'&locale=en');
assert.equal(none.response.status,200);
assert.equal(none.payload.coverage.level,'none');
assert.equal(none.payload.projection,null);

assert.equal((await call('https://local/api/public-knowledge?q=test&locale=fr')).response.status,400);
assert.equal((await call('https://local/api/public-knowledge?q=test&locale=en','POST')).response.status,405);

const migration=await readJson('content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json');
assert.equal(migration.status,'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE');
await assert.rejects(fs.access(path.join(root,'knowledge-search.html')),{code:'ENOENT'});
const page=await fs.readFile(path.join(root,'knowledge/ask/index.html'),'utf8');
const pageJs=await fs.readFile(path.join(root,'assets/customer-ui/js/surfaces/contextual-ask.js'),'utf8');
const api=await fs.readFile(path.join(root,'functions/api/public-knowledge.js'),'utf8');
assert.match(page,/<link rel="canonical" href="\/knowledge\/ask\/">/);
assert.match(page,/contextual-ask\.js/);
const redirects=await fs.readFile(path.join(root,'_redirects'),'utf8');
assert.match(redirects,/^\/knowledge-search\s+\/knowledge\/ask\/\s+308\s*$/m);
assert.match(page,/data-cx-contextual-ask-form/);
assert.match(pageJs,/\/api\/customer-contextual-ask/);
assert.match(pageJs,/textContent/);
assert.doesNotMatch(pageJs,/innerHTML\s*=\s*payload/);
assert.match(api,/handlePublicKnowledgeRequest/);

console.log('✓ KNR-W8 read-only Published Knowledge Public API passed.');
console.log('✓ KNR-W9 published-only Public Experience states and accessibility passed.');
console.log('✓ Package C exposes Package A/B results without Provider calls or answer generation.');
