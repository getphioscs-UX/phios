import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const files=['account/index.html','checkout.html','payment-success.html','payment-failure.html','perspectives/personal/index.html','perspectives/relationship/index.html','perspectives/tarot/index.html','perspectives/iching/index.html','academy/lesson/index.html','review/iching/index.html'];
const results=[];const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const file of files)for(const width of [360,390,768,1440]){
  console.log(`PIS functional: ${width} ${file}`);
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===server.origin||u.hostname==='pub-1967bc5812ee4164b19a806fb1427021.r2.dev'?r.continue():r.abort()});
  const route='/'+file.replace(/index\.html$/,'');
  await page.goto(server.origin+route,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('main').waitFor();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert.equal(overflow,false,`${file} ${width}: page overflow`);
  assert.ok(await page.locator('main').innerText(),`${file}: empty main`);
  let screenshot=null;
  if(width===390||width===1440){screenshot=`screenshots/${file.replace(/[^a-z0-9]/gi,'-')}-${width}-shell.png`;await page.screenshot({path:'docs/public-index-successor/'+screenshot});}
  results.push({file,route,width,status:'PASS',scope:'UNAUTHENTICATED_LOCAL_SHELL_ONLY',submittedForms:0,purchaseOrAccountWrites:0,screenshot});await page.close();
 }
}finally{
 await browser.close();await server.close();
 fs.writeFileSync('docs/public-index-successor/pis-r1-functional-browser-v1.json',JSON.stringify({scope:'LOCAL_SHELL_ONLY_NOT_PAYMENT_OR_ACCOUNT_E2E',stripe:'PAUSED_BY_USER',expectedCases:files.length*4,complete:results.length===files.length*4,testedFiles:files.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')})),results},null,2)+'\n');
}
console.log(`PASS PIS functional shell: ${results.length} cases; no forms submitted or production writes.`);
