import fs from 'node:fs';import http from 'node:http';import path from 'node:path';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PHIOS_PLAYWRIGHT||'C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve('.');
const server=http.createServer((request,response)=>{
 const url=new URL(request.url,'http://localhost');if(url.pathname.startsWith('/api/')){response.writeHead(401,{'content-type':'application/json'});response.end('{"ok":false}');return;}
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){response.writeHead(404).end();return;}
 response.setHeader('content-type',({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');response.end(fs.readFileSync(file));
});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,channel:'msedge'});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto(`http://127.0.0.1:${server.address().port}/professional/financial/`);await page.locator('#everyday-finance-tasks').waitFor();
 assert.equal(await page.locator('.finance-everyday-cards a').count(),3);
 for(const [task,index] of [['incomeStreams',1],['assets',3],['goals',6]]){await page.locator(`.finance-everyday-cards [data-finance-task="${task}"]`).click();assert(await page.locator(`[data-cx-financial-stage-index="${index}"]`).isVisible());}
 assert(await page.locator('#financial-saved').count());
 assert(await page.locator('body').evaluate(()=>document.querySelector('[data-financial-tools]').compareDocumentPosition(document.querySelector('[data-cx-financial-form]'))&Node.DOCUMENT_POSITION_PRECEDING));
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow ${width}`);}
 await page.locator('[data-coverage-check]').click();assert((await page.locator('[data-coverage-result]').innerText()).length>0);
 assert.deepEqual(errors,[]);await page.screenshot({path:'tools/review/finance-core-v2/entry.png',fullPage:false});
 fs.writeFileSync('tools/review/finance-core-v2/entry-verification.json',JSON.stringify({taskCount:3,stageLinks:true,freeSaving:true,specialistToolsAfterIntake:true,widths:[360,768,1440],pageErrors:errors},null,2));console.log('PASS everyday finances tasks, existing stages, saved panel, preview and responsive layout');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
