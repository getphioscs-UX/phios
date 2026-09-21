import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const assets=JSON.parse(fs.readFileSync('config/reports/bazi-visual-assets.json')),root='docs/guided-report-successor-r2/addendum-b';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:8788/${root}/review.html?locale=en`);await page.waitForFunction(()=>window.batchReady,{},{timeout:120000});
 const visualPolicy=await page.evaluate(()=>({narrative:[...document.querySelectorAll('[data-page-family="NARRATIVE_ANALYSIS_PAGE"] .pub-decoration img')].map(i=>Number(getComputedStyle(i).opacity)),insight:[...document.querySelectorAll('[data-page-family="INSIGHT_LIST_PAGE"] .pub-decoration img')].map(i=>Number(getComputedStyle(i).opacity)),placements:[...document.querySelectorAll('[data-page-family="SECTION_OPENER_PAGE"]')].map(p=>p.dataset.heroPlacement)}));
 assert(visualPolicy.narrative.every(n=>n<=.15));assert(visualPolicy.insight.every(n=>n<=.1));assert(new Set(visualPolicy.placements).size>=4);assert(visualPolicy.placements.every((p,i)=>!i||p!==visualPolicy.placements[i-1]));
 const records=[];
 for(const a of assets.assets){const src=assets.bindings[a.assetId];if(!src){records.push({assetId:a.assetId,status:a.status,selectedFallback:'CSS_PREMIUM',humanVisualAcceptance:'PENDING'});continue;}
  const size=await page.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();return {width:i.naturalWidth,height:i.naturalHeight};},src);
  assert(size.width&&size.height);records.push({assetId:a.assetId,src,...size,sha256:createHash('sha256').update(fs.readFileSync('.'+src)).digest('hex'),decoded:true,containsTextDeclared:false,humanVisualAcceptance:'PENDING'});
 }
 await page.route('**/simulated-missing-section-hero.webp',r=>r.fulfill({status:404,body:''}));
 const fallback=await page.evaluate(async()=>{
  const {settlePublicationAssets}=await import('/assets/customer-ui/js/personal-products/publication-report-pages.js');
  const root=document.createElement('div');root.innerHTML='<div class="pub-decoration"><img src="/simulated-missing-section-hero.webp" data-fallback-sources=\'["/simulated-missing-section-hero.webp","/assets/images/report/VIS-REPORT-BAZI-MOTIF.svg"]\' alt=""></div>';document.body.append(root);await settlePublicationAssets(root);const image=root.querySelector('img'),result={retained:!!image,decoded:!!image?.naturalWidth,fallbackUsed:image?.src.endsWith('VIS-REPORT-BAZI-MOTIF.svg')};root.remove();return result;
 });assert.deepEqual(fallback,{retained:true,decoded:true,fallbackUsed:true});
 fs.writeFileSync(`${root}/asset-evidence.json`,JSON.stringify({records,visualPolicy,simulated404Fallback:fallback,humanAccepted:false},null,2)+'\n');
 console.log('PASS: bound visual assets decode; optional hero 404 advances to a working fallback.');
}finally{await browser.close();}
