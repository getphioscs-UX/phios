import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const root='docs/financial-will-successor-r1';fs.mkdirSync(`${root}/screenshots`,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});const evidence=[];
try{for(const lang of ['en','zh-Hans'])for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000}});await context.addInitScript(lang=>{localStorage.setItem('phios-cx-locale',lang);window.print=()=>{window.__printRequested=true;};},lang);
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8790/professional/financial/');await page.locator('[data-structured-inventory]').waitFor();
 await page.locator('[name="asOfDate"]').fill('2026-09-21');await page.locator('[name="baseCurrency"]').selectOption('MYR');await page.locator('[data-structured-inventory]').check();
 async function add(group,values){const block=page.locator(`[data-inventory-group="${group}"]`);await block.locator('[data-inventory-add]').click();const row=block.locator('.fw-inventory-row').last();for(const [key,value] of Object.entries(values)){const el=row.locator(`[data-inventory-field="${key}"]`);if(await el.evaluate(n=>n.tagName==='SELECT'))await el.selectOption(String(value));else await el.fill(String(value));}}
 await add('people',{label:lang==='en'?'Person A':'甲',relationship:lang==='en'?'Self':'本人'});
 for(let stage=1;stage<=8;stage++){
  await page.locator('[data-cx-financial-stage-next]').click();
  if(stage===1)await add('incomeStreams',{label:'Salary',value:8000,representation:'EXACT',disclosureState:'SELF_REPORTED',frequency:'MONTHLY'});
  if(stage===2)await add('expenses',{label:'Living costs',value:5000,representation:'EXACT',disclosureState:'SELF_REPORTED',frequency:'MONTHLY'});
  if(stage===3)await add('assets',{label:'Savings',type:'BANK_ACCOUNT',value:50000,representation:'EXACT',disclosureState:'SELF_REPORTED',ownershipMode:'SOLE'});
  if(stage===4)await add('liabilities',{label:'Loan',value:10000,representation:'EXACT',disclosureState:'SELF_REPORTED'});
  if(stage===8)await add('assumptions',{type:'TAX_EFFECTIVE_RATE',value:0.1});
 }
 await page.locator('[name="consent"]').check();await page.locator('[data-cx-financial-submit]').click();await page.locator('[data-cx-financial-results]').waitFor({state:'visible'});await page.locator('[data-cx-financial-result-tab="report"]').click();
 await page.locator('[data-cx-financial-report] .fw-navigation').waitFor();assert.equal(await page.locator('[data-cx-financial-report] .fw-navigation section').count(),22);
 assert.equal(await page.locator('[data-cx-financial-report] .fw-dashboard>div').count(),13);
 await page.locator('[data-cx-financial-report]').screenshot({path:`${root}/screenshots/financial-${lang}-${width}.png`});
 await page.locator('[data-estate-import]').click();await page.locator('[data-import-consent]').check();await page.locator('[data-import-confirm]').click();
 const form=page.locator('[data-estate-form]');await form.locator(':scope > .cx-p1-fields [data-estate-field="jurisdiction"]').fill('MY');
 for(const id of ['identity','assets','liabilities']){const section=page.locator(`[data-estate-section="${id}"]`);await section.locator('summary').click();await section.locator(':scope > label [data-estate-field="status"]').selectOption('KNOWN');}
 await page.locator('[data-estate-section="assets"] [data-estate-field="estateInclusion"]').selectOption('INCLUDED');
 await page.locator('[data-estate-consent]').check();await form.locator('button[type="submit"]').click();await page.locator('[data-estate-report] .fw-navigation').waitFor();
 assert.equal(await page.locator('[data-estate-report] .fw-navigation section').count(),12);
 await page.locator('[data-estate-report]').screenshot({path:`${root}/screenshots/estate-${lang}-${width}.png`});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`${lang}:${width} overflow`);assert.deepEqual(errors,[]);
 const storage=await page.evaluate(()=>({session:Object.keys(sessionStorage),local:Object.keys(localStorage)}));assert.equal(storage.session.length,0);assert(!storage.local.some(k=>/financial|estate|will/i.test(k)));
 const printButtons=await page.locator('[data-report-print]').count();assert.equal(printButtons,2);
 await page.locator('[data-estate-report] [data-report-print]').click();await page.waitForFunction(()=>[...document.querySelectorAll('iframe')].some(f=>f.contentWindow?.__printRequested));
 const printSource=await page.evaluate(()=>[...document.querySelectorAll('iframe')].find(f=>f.contentWindow?.__printRequested)?.contentDocument.body.innerText||'');assert(printSource.includes(lang==='en'?'It is not an executed Will':'不是已经签署并生效的遗嘱'));assert(!printSource.includes('Explicit customer confirmation for informational review'));
 evidence.push({lang,width,nineStageFinancial:true,hfpSections:22,dashboardCards:13,explicitImport:true,willSections:12,overflow,errors,privateDataStored:false,printButtonPresent:true,estatePrintHtmlPrepared:true,printDialog:'NOT_RUN_NATIVE_DIALOG_STUBBED'});await context.close();
}}finally{await browser.close();}
fs.writeFileSync(`${root}/browser-evidence.json`,JSON.stringify({variants:evidence,productionDeployment:'NOT_RUN',fullAttachmentAccepted:false},null,2)+'\n');console.log('PASS: real local request handlers, nine stages, consented import, financial/estate views, en/zh-Hans at 1440/390.');
