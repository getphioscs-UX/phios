import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';import {previewServer} from './lib/ca-r1-preview-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const bindings=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-r1-context-figures-v1.json')).bindings;
const server=await previewServer(),browser=await chromium.launch({channel:'msedge',headless:true}),results=[];
try{for(const file of [...new Set(bindings.map(x=>x.file))]){
 const page=await browser.newPage({viewport:{width:390,height:900}});await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===server.origin||u.hostname==='pub-1967bc5812ee4164b19a806fb1427021.r2.dev'?r.continue():r.abort()});
 await page.goto(server.origin+'/'+file.replace(/index\.html$/,''),{waitUntil:'domcontentloaded'});const root=page.locator('[data-pis-context-figures]');await root.locator('summary').click();
 for(const item of bindings.filter(x=>x.file===file)){
  const img=root.locator(`[data-px2-asset="${item.code}"]`);await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());
  assert.ok(await img.evaluate(i=>i.naturalWidth>0));const href=await img.locator('..').getAttribute('href');assert.equal(decodeURIComponent(new URL(href).pathname).slice(1),item.key);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  results.push({code:item.code,file,loaded:true,originalImageLink:true,viewport:390});
 }
 await root.scrollIntoViewIfNeeded();await page.screenshot({path:'docs/public-index-successor/screenshots/'+file.replace(/[^a-z0-9]/gi,'-')+'-diagrams.png'});await page.close();console.log('Diagrams loaded: '+file);
}}finally{await browser.close();await server.close();fs.writeFileSync('docs/public-index-successor/pis-r1-context-figures-browser-v1.json',JSON.stringify({scope:'LOCAL_EXPANDED_DIAGRAMS_REMOTE_IMAGE_LOAD_NOT_PRODUCTION_DEPLOYMENT',complete:results.length===39,results,testedFiles:[...new Set(bindings.map(x=>x.file)),'assets/customer-ui/js/public-index-figures.js'].map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}))},null,2)+'\n')}
console.log(`PASS: ${results.length} registered diagrams loaded, original image links and mobile layout checked.`);
