import {w11r6RepairAudit,w11r6ReviewUrl} from './lib/w11r6-review-paths.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir=w11r6RepairAudit||'content/profile/successors/personal-evidence-r1/w11r6/',root='tools/review/personal-evidence-r1/';
const hub=fs.readFileSync('tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html','utf8'),assets=JSON.parse(hub.match(/embeddedAssets=(.*?);\s*const displayAssets/s)[1]);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const pdfDir=process.env.W11R6_REPAIR_PDF||'output/pdf/w11r6';const results=[];fs.mkdirSync(pdfDir,{recursive:true});fs.mkdirSync(dir+'after',{recursive:true});
try{const page=await browser.newPage();
let remoteRequestsBlocked=0;await page.route('**/*',route=>{const url=route.request().url();if(/^https?:/.test(url)){remoteRequestsBlocked++;return route.abort();}return route.continue();});
for(let n=1;n<=11;n++){
 const id='CASE-'+String(n).padStart(2,'0');let html=fs.readFileSync(root+id+'-bilingual-dossier.html','utf8');for(const [url,data]of Object.entries(assets))html=html.replaceAll(url,data);
 if(process.argv.some(a=>a.startsWith('--case='))&&!process.argv.includes('--case='+id))continue;
 await page.setViewportSize({width:1100,height:1100});await page.setContent(html);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});await page.emulateMedia({media:'print'});
 const audit=await page.evaluate(()=>[...document.querySelectorAll('.pub-page,.pub-static')].map((p,i)=>{
  const footer=p.querySelector('footer')?.getBoundingClientRect(),field=p.querySelector('.pe-reading-field')?.getBoundingClientRect();
  const figures=[...p.querySelectorAll('figure[data-pfig]')].map(f=>{const r=f.getBoundingClientRect();return {id:f.dataset.pfig,top:r.top-p.getBoundingClientRect().top,bottom:r.bottom-p.getBoundingClientRect().top,width:r.width,height:r.height,footerOverlap:footer?r.bottom>footer.top:false,childOverflow:[...f.querySelectorAll('.pe-diagram-node,.pe-axis-legend>div,.pe-native-series>div')].filter(e=>e.scrollWidth>e.clientWidth+1).length}});
  return {page:i+1,section:p.dataset.peSection||null,static:p.dataset.peStatic||null,width:p.getBoundingClientRect().width,height:p.getBoundingClientRect().height,readingOverlap:footer&&field?field.bottom>footer.top+1:false,blank:!p.querySelector('img')&&!p.textContent.trim(),figures};
 }));
 const errors=audit.filter(p=>p.blank||p.readingOverlap||p.figures.some(f=>f.footerOverlap||f.childOverflow));
 if(errors.length){console.log(id,JSON.stringify(errors));for(const fid of errors.flatMap(p=>p.figures.map(f=>f.id))){const f=page.locator('[data-pfig="'+fid+'"]');await f.screenshot({path:dir+'after/'+id+'-'+fid+'-diagnostic.png'});console.log(fid,await f.evaluate(e=>[...e.children].map(c=>({class:c.className,height:c.getBoundingClientRect().height}))));}}assert.equal(errors.length,0,id+' A4 figure/page overlap');
 assert(audit.every(p=>Math.abs(p.width-793.7)<2&&Math.abs(p.height-1122.5)<2),'Physical A4 dimensions');
 if(n===1){fs.writeFileSync(dir+'PRD-W11R6-CASE-01-PUBLICATION-REVIEW.html',fs.readFileSync(root+id+'-bilingual-dossier.html','utf8'));for(const f of await page.locator('figure[data-pfig]').all()){const fid=await f.getAttribute('data-pfig');await f.screenshot({path:dir+'after/'+id+'-'+fid+'.png'});await f.locator('xpath=ancestor::article[1]').screenshot({path:dir+'after/'+id+'-'+fid+'-page.png'});}}
 if([1,8,9].includes(n)&&!process.argv.includes('--no-pdf'))await page.pdf({path:pdfDir+'/' +(n===1?'PRD-W11R6-CASE-01-PUBLICATION-REVIEW.pdf':id+'-bilingual-dossier.pdf'),format:'A4',preferCSSPageSize:true,printBackground:true});
 if([8,9].includes(n))for(const fid of ['PFIG-002','PFIG-004','PFIG-005','PFIG-006','PFIG-009'])await page.locator('[data-pfig="'+fid+'"]').screenshot({path:dir+'after/'+id+'-'+fid+'.png'});
 await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,figures:[...document.querySelectorAll('figure[data-pfig]')].map(f=>({id:f.dataset.pfig,width:f.getBoundingClientRect().width,scroll:f.scrollWidth,minTextSize:Math.min(...[...f.querySelectorAll('p,small,strong,figcaption,.pe-axis-legend>div')].map(e=>parseFloat(getComputedStyle(e).fontSize)))}))}));
 assert(mobile.scroll<=mobile.width+1,id+' mobile document overflow');assert(mobile.figures.every(f=>f.scroll<=f.width+1&&f.minTextSize>=13),id+' mobile labels');
 if(n===1)for(const f of await page.locator('figure[data-pfig]').all())await f.screenshot({path:dir+'after/'+id+'-'+await f.getAttribute('data-pfig')+'-mobile.png'});
 results.push({id,status:'PASS',pages:audit.length,pageAudit:audit,mobile});console.log(id+' A4 + mobile PASS');
}
assert.equal(remoteRequestsBlocked,0,'Publication must use local/embedded assets only');
fs.writeFileSync(dir+'browser-results.json',JSON.stringify({timestamp:new Date().toISOString(),results,status:'PASS',networkEvidence:{remoteRequestsBlocked,providerCalls:0,openAiCalls:0,assetsDecodedLocally:true}},null,2));
}finally{await browser.close();}
