import fs from'node:fs';import assert from'node:assert/strict';
import{freezeEditorialRequest,verifyEditorialRequest,validateEditorialResponse,editorialBudgetPlan,createLocalEditorialRunner,EDITORIAL_SYSTEM_PROMPT}from'../../../functions/personal-reading/narrative/method-editorial-contract.js';
import{buildNumEditorialRequests}from'../../../functions/personal-reading/narrative/numerology-editorial-adapter.js';
const requests=JSON.parse(fs.readFileSync('.tmp/numerology-r21/REQUESTS.json')),rows=[],copy=x=>structuredClone(x);
const test=async(name,fn)=>{try{await fn();rows.push({name,status:'PASS'});}catch(e){rows.push({name,status:'FAIL',error:e.message});}};
const r=requests.find(r=>r.semanticPlan.roleSemantics.length),claim=r.semanticPlan.roleSemantics[0];
const response={zhHans:{paragraphs:[{id:'U1',text:'这个传统主题可以作为观察问题，并不是已经证实的个人事实。'}],question:'什么经历并不符合？'},en:{paragraphs:[{id:'U1',text:'This traditional theme can frame a question; it is not an established personal fact.'}],question:'What experience does not fit?'},claimUsage:[{paragraphId:'U1',claimId:claim.id,scope:claim.scope}],illustrations:[]};
await test('19 actual source-bound page requests; no fixed question→answer map',()=>assert.equal(requests.length,19));
await test('Request digests and immutable source plans',async()=>{for(const x of requests)await verifyEditorialRequest(x);});
await test('Tampered fact cannot use frozen identity',async()=>{const a=copy(r);a.semanticPlan.calculatedFacts.birthDate='2000-01-01';await assert.rejects(()=>verifyEditorialRequest(a),/TAMPERED/);});
await test('Source-version change invalidates request cache',async()=>{const a=copy(r);a.semanticPlan.roleSemantics[0].sourceDigest='different';const b=await freezeEditorialRequest({...a,localOnly:true});assert.notEqual(b.requestDigest,r.requestDigest);});
await test('Unaccepted source rejected',async()=>{const a=copy(r);a.semanticPlan.roleSemantics[0].runtimeUseAllowed=false;await assert.rejects(()=>freezeEditorialRequest(a),/INELIGIBLE_SOURCE/);});
await test('Reality evidence requires consent and source identity',async()=>{const a=copy(r);a.semanticPlan.customerRealityEvidence=[{text:'private',consentGranted:false}];await assert.rejects(()=>freezeEditorialRequest(a),/REALITY_CONSENT/);});
await test('Structure-valid response remains semantically unverified',()=>{const q=validateEditorialResponse(r,response);assert.equal(q.valid,true);assert.equal(q.publicationAllowed,false);assert.match(q.semanticQuality,/NOT_VERIFIED/);});
for(const [name,mutate,code]of [
 ['Unexpected model-computed field',a=>a.computedLifePath=99,'UNEXPECTED_FIELD'],
 ['Unknown claim ID',a=>a.claimUsage[0].claimId='OTHER-PACK', 'UNKNOWN_CLAIM'],
 ['Wrong school/role scope',a=>a.claimUsage[0].scope='LIFE_PATH_VALUE_8', 'SCOPE_MISMATCH'],
 ['Unmapped paragraph',a=>{for(const l of ['zhHans','en'])a[l].paragraphs.push({id:'U2',text:'No mapping'});},'UNMAPPED'],
 ['Missing English',a=>delete a.en,'LANGUAGE_MISSING'],
 ['Mismatched bilingual IDs',a=>a.en.paragraphs[0].id='OTHER','BILINGUAL'],
 ['Internal jargon',a=>a.en.paragraphs[0].text='sourceClaimId runtime provider','INTERNAL_JARGON'],
 ['Certainty risk',a=>a.en.paragraphs[0].text='You will definitely gain guaranteed wealth.','CERTAINTY'],
 ['Unmarked hypothetical',a=>a.illustrations=[{paragraphId:'U1',status:'HYPOTHETICAL'}],'ILLUSTRATION_UNMARKED']
 ])await test(name+' rejected',()=>{const a=copy(response);mutate(a);assert.match(validateEditorialResponse(r,a).errors.join(' '),new RegExp(code));});
await test('Source gap not substituted with filler',()=>assert.equal(validateEditorialResponse(r,{status:'CONTENT_SOURCE_GAP'}).valid,false));
await test('Combined order cap includes four-question/repair reserve (synthetic pricing only)',()=>{const x=editorialBudgetPlan({inputTokens:1000,maxOutputTokens:1000,inputMicroUSDPerMillion:1000000,outputMicroUSDPerMillion:1000000,reservedFollowupMicroUSD:1000000,repairReserveMicroUSD:100000});assert.equal(x.allowed,true);const y=editorialBudgetPlan({inputTokens:1000,maxOutputTokens:1000,inputMicroUSDPerMillion:1000000,outputMicroUSDPerMillion:1000000,reservedFollowupMicroUSD:2000000});assert.equal(y.allowed,false);});
await test('Unknown cost cannot become zero',()=>assert.throws(()=>editorialBudgetPlan({inputTokens:1000,maxOutputTokens:1000,reservedFollowupMicroUSD:0}),/VERIFIED_COST/));
const data=new Map(),store={get:async k=>data.get(k),putIfAbsent:async(k,v)=>{if(!data.has(k))data.set(k,v);}},calls={n:0};const runner=createLocalEditorialRunner({store,adapter:{mode:'SYNTHETIC_MOCK',generate:async()=>{calls.n++;await new Promise(r=>setTimeout(r,10));return copy(response);}}});
await test('Parallel generation coalesced, reopening reuses immutable result',async()=>{const [a,b]=await Promise.all([runner(r),runner(r)]);assert.deepEqual(a,b);await runner(r);assert.equal(calls.n,1);});
await test('Account/entitlement cache isolation',async()=>{const a=await freezeEditorialRequest({...r,accountId:'OTHER',localOnly:true});await runner(a);assert.equal(calls.n,2);});
await test('Real provider adapter disabled',async()=>{const run=createLocalEditorialRunner({store,adapter:{mode:'LIVE',generate:()=>{throw Error('must not execute');}}});await assert.rejects(()=>run(r),/PROVIDER_DISABLED/);});
await test('P12 exact accepted mapping; P14/P15 role-only scope',()=>{for(const id of ['NUM-D5-PATTERN-516','NUM-D5-PATTERN-876','NUM-D5-PATTERN-189'])assert.ok(requests.find(x=>x.semanticPlan.publicationContext.logicalPageId==='P12').semanticPlan.roleSemantics.find(c=>c.id===id));for(const [p,id]of [['P14','NUM-D3-ROLE-01'],['P15','NUM-D3-ROLE-05']])assert.equal(requests.find(x=>x.semanticPlan.publicationContext.logicalPageId===p).semanticPlan.roleSemantics.find(c=>c.id===id).scope,'ROLE_DEFINITION_ONLY');});
await test('No current reality is invented in plans',()=>{for(const x of requests)assert.deepEqual(x.semanticPlan.customerRealityEvidence,[]);});
await test('Stale or sample-only meaning cannot be reused for changed source prose',async()=>{const s=JSON.parse(fs.readFileSync('.tmp/numerology-r20/PUBLICATION-SNAPSHOT.json')),catalog=JSON.parse(fs.readFileSync('tools/review/numerology-r21/SOURCE-MATRIX.json')).sourceCatalog;const first=Object.keys(catalog)[0];catalog[first].sourceText.en+=' changed';await assert.rejects(()=>buildNumEditorialRequests({snapshot:s,sourceCatalog:catalog,accountId:'test',entitlementId:'test',localReview:true}),/SOURCE_CATALOG_STALE/);});
fs.writeFileSync('tools/review/numerology-r21/EDITORIAL-PROMPT.txt',EDITORIAL_SYSTEM_PROMPT);
fs.writeFileSync('tools/review/numerology-r21/CHECKS.json',JSON.stringify({rows,providerCalls:0,productionWrites:0,semanticModelValidation:'NOT_EXECUTED',mockGenerationCalls:calls.n,prices:'SYNTHETIC_FOR_BUDGET_TEST_ONLY',noCustomerPublication:true},null,2));console.log(JSON.stringify({pass:rows.filter(x=>x.status==='PASS').length,fail:rows.filter(x=>x.status==='FAIL')}));if(rows.some(x=>x.status==='FAIL'))process.exitCode=1;
