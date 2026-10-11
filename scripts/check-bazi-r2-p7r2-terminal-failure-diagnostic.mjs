// Single first-failure diagnostic on the immutable HTML; no browser matrix or gate rerun.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from './lib/world-browser-runtime.mjs';
import {BAZI_DIAGRAM_FIDELITY_R1_ACCEPTED_CANDIDATE} from '../functions/personal-reading/publication-fit/bazi-diagram-fidelity.js';
const dir='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/';
const source=dir+'CUSTOMER-MATERIAL.html',html=fs.readFileSync(source,'utf8');
const browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions());
const requests=[],unexpected=[],hosts=new Set(['pub-1967bc5812ee4164b19a806fb1427021.r2.dev','assets.getphios.com']);
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 await page.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(req.method()!=='GET'){unexpected.push(u.href);return route.abort();}
  if(u.hostname==='qa.phios-github.pages.dev'&&u.pathname.startsWith('/assets/')){
   const p=path.resolve('.'+u.pathname);if(!p.startsWith(process.cwd()+path.sep)||!fs.existsSync(p)){unexpected.push(u.href);return route.abort();}
   return route.fulfill({contentType:p.endsWith('.css')?'text/css':'application/octet-stream',body:fs.readFileSync(p)});
  }
  if(!hosts.has(u.hostname)||u.pathname.startsWith('/api/')){unexpected.push(u.href);return route.abort();}
  const r=await fetch(u.href,{signal:AbortSignal.timeout(45000)});requests.push({url:u.href,status:r.status});
  return route.fulfill({status:r.status,contentType:r.headers.get('content-type')||'application/octet-stream',body:Buffer.from(await r.arrayBuffer())});
 });
 await page.setContent(html.replaceAll('href="/assets/','href="https://qa.phios-github.pages.dev/assets/'),{waitUntil:'networkidle',timeout:60000});await page.evaluate(()=>document.fonts.ready);
 const measured=await page.evaluate(()=>['D05','D10'].map(id=>{const d=document.querySelector(`[data-diagram-id="${id}"]`);return {diagramId:id,pageNumber:Number(d.closest('.bdm-page').dataset.pageNumber),actualNodes:[...d.querySelectorAll('[data-node-id]')].map(n=>n.dataset.nodeId),actualEdges:[...d.querySelectorAll('[data-edge-from]')].map(n=>n.dataset.edgeFrom+'>'+n.dataset.edgeTo)};}));
 for(const row of measured)row.gateRequiredTopology=BAZI_DIAGRAM_FIDELITY_R1_ACCEPTED_CANDIDATE[row.diagramId];
 const screenshot=dir+'P7R2-FIRST-FAILURE-P10.png';await page.locator('[data-page-number="10"]').screenshot({path:screenshot});
 fs.writeFileSync(dir+'P7R2-TERMINAL-FIRST-FAILURE.json',JSON.stringify({category:'BROWSER_LAYOUT',blocker:'CUSTOMER_NATIVE_D05_D10_RENDERED_TOPOLOGY_MISSING',source,sourceSha256:crypto.createHash('sha256').update(html).digest('hex'),viewport:{width:1920,height:1080},measured,screenshot,providerCalls:0,providerCostUSD:0,providerNetworkCalls:0,staticAssetRequests:requests,unexpectedRequests:unexpected,noGateChanges:true,noMatrixRerun:true},null,2)+'\n');
 console.log('First-failure diagnostic saved; no repair or full rerun.');
}finally{await browser.close();}
