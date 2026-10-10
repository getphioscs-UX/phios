import assert from 'node:assert/strict';
import fs from 'node:fs';
import {internalPublicationFile} from './lib/publication-boundary.mjs';
import {STRIPE_PRODUCT_REGISTRY,commerceProduct} from '../functions/pws/commercial/stripe-product-registry.js';
import {projectKnowledgeAnswerForCustomer} from '../functions/customer-projection/knowledge-customer-projection.js';
import {projectFinancialForCustomer} from '../functions/customer-projection/financial-customer-projection.js';
const results=[];
function test(workId,name,fn){try{fn();results.push({workId,name,result:'PASS',scope:'SOURCE_LOCAL_ONLY'});}catch(e){results.push({workId,name,result:'FAIL',error:e.message});}}
test('W04','Internal HTML exclusion preserves runtime JSON',()=>{
 for(const p of ['content/x/review/test.html','content/x/candidate.html','content/x/acceptance/review.htm','content/production-closure/master.json','assets/x.js.backup-123'])assert.equal(internalPublicationFile(p),true,p);
 for(const p of ['content/knowledge/public/article.json','content/runtime/contract.json','content/figures/accepted.webp','books/index.html'])assert.equal(internalPublicationFile(p),false,p);
});
test('W13','Book VIII historic identity cannot be purchased',()=>{
 const p=STRIPE_PRODUCT_REGISTRY.find(p=>p.publicationVolume===8);
 assert.equal(p.productId,'COM-BOOK-07');assert.equal(p.active,false);assert.equal(p.entitlementPolicy,'BOOK_07_FULL_ACCESS');
 assert.throws(()=>commerceProduct(p.productId),e=>e.code==='commerce_product_invalid');
 assert.equal(commerceProduct('COM-BOOK-06').publicationVolume,7);
 assert.equal(commerceProduct('COM-BOOK-CONFIGURATION').publicationVolume,6);
 const html=fs.readFileSync('books/reality-navigation/index.html','utf8');
 assert.ok(html.includes('不对外出售'));assert.ok(!html.includes('book-volume-seven.js'));
 for(const route of ['reality-continuity','reality-expansion','reality-observation'])assert.ok(html.includes('/books/'+route+'/'));
});
test('W12','Grounded partial answer keeps sources and support',()=>{
 const result=projectKnowledgeAnswerForCustomer({ptrc:{quality:{outcome:'INSUFFICIENT'}},clientAnswer:{directAnswer:'A specific supported partial answer.',whyThisMayHappen:['Retain this explanation.'],sourcesGrounding:[{authorityLabel:'Published article',excerpt:'Accepted text',href:'/articles/test'}]}});
 assert.equal(result.answer.text,'A specific supported partial answer.');assert.equal(result.answer.supporting.length,1);assert.equal(result.basedOn.sources.length,1);
 const empty=projectKnowledgeAnswerForCustomer({ptrc:{quality:{outcome:'INSUFFICIENT'}},clientAnswer:{directAnswer:'not enough governed knowledge'}});
 assert.equal(empty.basedOn.sources.length,0);assert.equal(empty.answer.supporting.length,0);
});
test('W05','Homepage task links resolve to existing sources',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(!html.includes('<form class="cx-home-ask"'));
 for(const route of ['perspectives/personal','perspectives/relationship','professional/financial','perspectives/tarot','perspectives/iching','academy','books']){
  assert.ok(html.includes('/'+route+'/'));assert.ok(fs.existsSync(route+'/index.html'));
 }
});
test('W27','Financial range remains a range and unknown stays null',()=>{
 const result=projectFinancialForCustomer({snapshot:{evidenceState:'SELF_REPORTED_PARTIAL'},calculation:{metrics:{netWorth:{min:100,max:500},grossAssets:null,totalLiabilities:0}}});
 assert.deepEqual(result.currentPosition[0].value,{min:100,max:500});
 assert.equal(result.currentPosition[0].evidenceState,'REPORTED');
 assert.equal(result.currentPosition[1].value,null);
 assert.equal(result.currentPosition[2].value,0);
 assert.deepEqual(result.overview.whereYouAre.netWorth,{min:100,max:500});
});
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/QA-RESULTS.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));if(results.some(r=>r.result==='FAIL'))process.exitCode=1;
