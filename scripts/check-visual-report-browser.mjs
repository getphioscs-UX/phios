import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const modulePath=process.env.PHIOS_PLAYWRIGHT_MODULE;if(!modulePath)throw Error('PHIOS_PLAYWRIGHT_MODULE_REQUIRED');
const {chromium}=await import(pathToFileURL(modulePath).href);
const base=process.env.PHIOS_REVIEW_URL||'http://127.0.0.1:54705';
const root='docs/visual-report-r1';fs.mkdirSync(`${root}/browser`,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(`${root}/cases.json`)),results=[];
const onlyMethod=process.argv.find(x=>x.startsWith('--method='))?.split('=')[1]||null;
const browser=await chromium.launch({channel:'msedge',headless:true});
const jobs=[];
for(const sample of manifest.cases.filter(x=>(!onlyMethod||x.methodId===onlyMethod)&&(/^[A-Z]+-01-/.test(x.caseId)||x.methodId==='PROFILE'||x.focus)))for(const depth of sample.focus?['paid']:['free','paid'])for(const width of [1440,390])jobs.push({sample,depth,width});
if(!jobs.length)throw Error('VRPT_BROWSER_NO_CASES_SELECTED');
let cursor=0;
try{await Promise.all(Array.from({length:3},async()=>{while(cursor<jobs.length){const {sample,depth,width}=jobs[cursor++];
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${base}/${root}/review.html?case=${sample.path}&depth=${depth}`);await page.waitForSelector('body[data-ready="true"]');await page.evaluate(()=>document.fonts.ready);await page.locator('.vrpt-primary img').evaluateAll(images=>Promise.all(images.map(i=>i.decode().catch(()=>null))));
 const missingImages=await page.locator('.vrpt-primary img').evaluateAll(images=>images.filter(i=>!i.naturalWidth).map(i=>i.src));errors.push(...missingImages.map(src=>'IMAGE_NOT_LOADED:'+src));
 if(sample.methodId==='AST'){const marks=await page.locator('.ast-cx-r3-ring,.ast-cx-r3-aspect').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).stroke));if(!marks.length||marks.some(s=>s==='none'))errors.push('AST_NATIVE_CHART_STROKE_MISSING');}
 const metrics=await page.locator('.vrpt-page').evaluateAll(pages=>pages.map(p=>{const r=p.getBoundingClientRect(),v=p.querySelector('.vrpt-primary').getBoundingClientRect(),b=p.querySelector('.vrpt-insights').getBoundingClientRect();return {pageId:p.dataset.pageId,width:r.width,height:r.height,visualRatio:v.height/r.height,bodyRatio:b.height/r.height,overflow:p.scrollWidth>p.clientWidth+2,insights:p.querySelectorAll('.vrpt-insights p').length};}));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
 const key=`${sample.caseId}-${depth}-${width}`;
 await page.screenshot({path:`${root}/browser/${key}.png`,fullPage:true});
 let print=[];
 if(width===1440){await page.emulateMedia({media:'print'});print=await page.locator('.vrpt-page').evaluateAll(pages=>pages.map(p=>({pageId:p.dataset.pageId,overflow:p.scrollHeight>p.clientHeight+2||p.scrollWidth>p.clientWidth+2,height:p.getBoundingClientRect().height})));}
 if(process.argv.includes('--pdf')&&width===1440&&/^[A-Z]+-01-/.test(sample.caseId)){fs.mkdirSync('output/pdf',{recursive:true});await page.pdf({path:`output/pdf/VRPT-${sample.caseId}-${depth}.pdf`,format:'A4',printBackground:true,preferCSSPageSize:true});}
 results.push({key,errors,documentOverflow:overflow,pages:metrics,print,status:!errors.length&&!overflow&&print.every(x=>!x.overflow)&&metrics.every(x=>!x.overflow&&x.visualRatio>=.45&&x.bodyRatio<=.30&&x.insights<=3)?'PASS':'FAIL'});await page.close();
}}));}finally{await browser.close();}
if(onlyMethod){const existing=JSON.parse(fs.readFileSync(`${root}/browser-results.json`));const changed=new Set(results.map(x=>x.key));results.push(...existing.results.filter(x=>!changed.has(x.key)));}
results.sort((a,b)=>a.key.localeCompare(b.key));
fs.writeFileSync(`${root}/browser-results.json`,JSON.stringify({scope:'Eight method candidates; Profile eight entry variants; ECR conditional sources; synthetic review only',measurement:'DOM figure/body bounding boxes; visual occupancy and semantic usefulness require human review',views:results.length,lastRun:{method:onlyMethod,views:jobs.length},results},null,2)+'\n');
console.log(JSON.stringify(results.map(x=>({key:x.key,status:x.status,failedPages:x.pages.filter(p=>p.overflow||p.visualRatio<.45||p.bodyRatio>.30)})),null,2));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
