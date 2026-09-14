import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';import {parseHTML} from 'linkedom';
import {buildHumanReviewPacket,validateReviewDraft} from './lib/structured-human-review.mjs';
const base='docs/knowledge/structured-successor/',bytes=fs.readFileSync(base+'extraction/b14-sks-extraction-candidates-v1.json');
const packet=JSON.parse(fs.readFileSync(base+'human-review/b14-sks-w56-w59-review-packet-v1.json'));
for(const [path,sha] of Object.entries(JSON.parse(bytes).sourceDigests))assert.equal(createHash('sha256').update(fs.readFileSync(path)).digest('hex'),sha,`REVIEW_SOURCE_DRIFT:${path}`);
assert.deepEqual(packet,buildHumanReviewPacket(JSON.parse(bytes),createHash('sha256').update(bytes).digest('hex')));
const draft={sourceDigest:packet.sourceDigest,scope:packet.scope,decisions:packet.records.map(r=>({candidateId:r.candidateId,decision:'PENDING',reviewer:'',notes:'',checks:r.criteria.map(()=>'UNREVIEWED')}))};
assert.equal(validateReviewDraft(packet,draft).valid,true);
const change=(index,patch)=>({...draft,decisions:draft.decisions.map((r,i)=>i===index?{...r,...patch}:r)});
assert.equal(validateReviewDraft(packet,{...draft,sourceDigest:'stale'}).valid,false);
assert.equal(validateReviewDraft(packet,{...draft,decisions:[]}).valid,false);
assert.equal(validateReviewDraft(packet,{...draft,decisions:[null,...draft.decisions.slice(1)]}).valid,false);
assert.equal(validateReviewDraft(packet,change(0,{decision:'APPROVE_ASSEMBLY'})).valid,false);
assert.equal(validateReviewDraft(packet,change(0,{decision:'REQUEST_CHANGES',reviewer:'reviewer'})).valid,false);
assert.equal(validateReviewDraft(packet,change(0,{candidateId:packet.records[1].candidateId})).valid,false);
for(let i=0;i<packet.records.length;i++){const r=packet.records[i],result=validateReviewDraft(packet,change(i,{decision:'APPROVE_ASSEMBLY',reviewer:'test reviewer',checks:r.criteria.map(()=>'PASS')}));assert.equal(result.valid,r.blockers.length===0);assert.equal(result.appliesDecisions,false);assert.equal(result.productionApproved,false);}
const html=fs.readFileSync(base+'human-review/B14-SKS-W56-W59-HUMAN-REVIEW.html','utf8'),{document}=parseHTML(html);
assert.equal(document.querySelectorAll('details').length,71);assert.equal(document.querySelectorAll('option[value=APPROVE_ASSEMBLY]').length,31);assert.equal(document.querySelectorAll('script[src]').length,0);new Function(document.querySelector('script').textContent);
if(process.argv.includes('--browser')){
 const {chromium}=await import(process.env.PHIOS_PLAYWRIGHT_MODULE?pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href:'playwright');const browser=await chromium.launch({channel:'msedge',headless:true});
 try{const page=await browser.newPage({viewport:{width:390,height:900}});await page.goto(pathToFileURL(process.cwd()+'/'+base+'human-review/B14-SKS-W56-W59-HUMAN-REVIEW.html').href);await page.selectOption('[data-book]','BOOK-1');assert.equal(await page.locator('details:visible').count(),11);await page.fill('[data-search]','SK-B1-CONSTRAINT');assert.equal(await page.locator('details:visible').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('details:visible summary').click();await page.locator('details:visible [data-reviewer]').fill('test reviewer');await page.locator('details:visible [data-decision]').selectOption('APPROVE_ASSEMBLY');await page.click('[data-export]');assert.match(await page.locator('[role=status]').textContent(),/APPROVAL_BLOCKED/);
 for(const c of await page.locator('details:visible [data-check]').all())await c.selectOption('PASS');const download=page.waitForEvent('download');await page.click('[data-export]');assert.equal((await download).suggestedFilename(),'b14-sks-human-review-draft.json');
 await page.locator('[data-import]').setInputFiles({name:'stale.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...draft,sourceDigest:'stale'}))});await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('STALE_REVIEW_SOURCE'));assert.equal(await page.locator('details:visible [data-decision]').inputValue(),'APPROVE_ASSEMBLY');
 await page.locator('[data-import]').setInputFiles({name:'draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('草稿已恢复'));assert.equal(await page.locator('details:visible [data-decision]').inputValue(),'PENDING');
 }finally{await browser.close();}
}
console.log('✓ W56–W59 review preparation: 71 pending records, 40 extraction blocks, exact source digest, scope-limited decisions, stale/invalid review rejection and offline form checks passed. No human approval applied.');
