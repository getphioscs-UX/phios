import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const root='docs/guided-report-successor-r2/visual-commerce';
const evidence={evidenceClass:'SYNTHETIC_PRESENTATION_ONLY',variants:[],errors:[],realPurchasedEntitlement:false};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const locale of ['en','zh-Hans'])for(const width of [1440,390])for(const mode of ['free','locked']){
 const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>evidence.errors.push(String(e)));
 await page.route('**/functions/**',route=>route.fulfill({status:404,body:'Functions sources are not static assets'}));
 await page.goto(`http://127.0.0.1:8788/${root}/${mode}/${locale}/review.html`);await page.waitForFunction(()=>window.batchReady,{},{timeout:120000});
 assert.equal(await page.evaluate(async()=>typeof(await import('/assets/customer-ui/js/specialists/bazi/product-renderer.js')).renderBaziProduct),'function','actual customer module must load without public functions/ sources');
 assert.equal(await page.locator('.cx-bazi-w12-workspace').count(),0);
 assert.equal(await page.locator('[data-page-number]').count(),11);
 assert.equal(await page.locator('[data-publication-visual]').count(),4);
 const links=page.locator('[data-bazi-paid-state] a');assert.equal(await links.count(),2);
 assert.equal(await links.first().getAttribute('href'),'/account/?product=COM-REPORT-BAZI-FULL#commerce');
 assert.match(await links.first().innerText(),/39/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.locator('#report img').evaluateAll(imgs=>Promise.all(imgs.map(img=>{img.loading='eager';return img.decode();})));
 assert.equal(await page.locator('#report img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).length),0);
 await page.locator('[data-bazi-paid-state]').first().screenshot({path:`${root}/screenshots/${mode}-${locale}-${width}-unlock.png`});
 for(const n of [7,8,9,10])await page.locator(`[data-page-number="${n}"]`).screenshot({path:`${root}/screenshots/${mode}-${locale}-${width}-P${n}.png`});
 evidence.variants.push({locale,width,mode,pages:11,fullWorkspaceAbsent:true,ctaUsesExistingCommerce:true});await page.close();
}}finally{await browser.close();}
evidence.machinePass=evidence.errors.length===0;fs.writeFileSync(`${root}/free-browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');assert(evidence.machinePass);console.log('PASS free/locked EN/ZH at 1440/390: bounded report, four visuals, no full workspace, existing Commerce CTA.');
