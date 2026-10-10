import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
const page=await browser.newPage();const results=[];
for(const width of [1280,390]){
await page.setViewportSize({width,height:900});await page.setContent(fs.readFileSync('tools/review/PHI-OS-PC-R1-PROFILE-DEMOTION-HUMAN-REVIEW.html','utf8').replace('src="/"','src="about:blank"'));
const dimensions=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
assert(dimensions.scroll<=dimensions.width+1,'review horizontal overflow');
assert.equal(await page.locator('iframe').count(),1);
const audit=JSON.parse(fs.readFileSync('content/product-convergence-r1/audits/pc-r1-profile-demotion-first-batch-v1.json'));assert((await page.textContent('body')).includes(audit.pcW11==='CLOSED'?'PC-W11 CLOSED':audit.humanDecision==='PC-R1 PROFILE DEMOTION ACCEPT'?'PC-W11 AUTHORIZED':'PC-W11 BLOCKED'));
results.push({width,status:'PASS',dimensions});
}
fs.writeFileSync(process.env.PC_W11_REGRESSION_DIR?'content/product-convergence-r1/audits/pc-w11-closure/review-browser-results.json':'content/product-convergence-r1/audits/profile-demotion-browser-results.json',JSON.stringify(results,null,2));
console.log('PC-R1 review desktop and mobile PASS');
}finally{await browser.close();}
