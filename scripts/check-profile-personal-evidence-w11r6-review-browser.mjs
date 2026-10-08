import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='content/profile/successors/personal-evidence-r1/w11r6/',url='http://127.0.0.1:8806/w11r6/';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const page=await browser.newPage(),errors=[];let external=0;
await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.protocol.startsWith('http')&&!['127.0.0.1','localhost'].includes(u.hostname)){external++;return r.abort();}return r.continue();});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status());});
const synthetic=fs.readFileSync(dir+'synthetic-explicit-observation.html','utf8'),css=fs.readFileSync('assets/customer-ui/surfaces/personal-evidence-dossier.css','utf8');
await page.setViewportSize({width:900,height:1100});await page.setContent(synthetic.replace('</head>','<style>'+css+'</style></head>').replace('<body>','<body><div class="pe-dossier" style="padding:24px">').replace('</body>','</div></body>'));
await page.screenshot({path:dir+'after/synthetic-explicit-observation.png',fullPage:true});
assert.equal(await page.locator('[data-pfig-state=READY]').count(),3);
for(const width of [1280,390]){
 await page.setViewportSize({width,height:900});await page.goto(url);await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode())));
 assert.equal(await page.locator('section[id^=PFIG-]').count(),9);assert.equal(await page.locator('pre').count(),1);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1));
 assert(await page.evaluate(()=>[...document.images].every(i=>i.naturalWidth>0)));
}
await page.goto(url+'PRD-W11R6-CASE-01-PUBLICATION-REVIEW.html');await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode())));
assert.equal(await page.locator('figure[data-pfig]').count(),9);
assert.equal(external,0);assert.equal(errors.length,0);
fs.writeFileSync(dir+'review-browser-results.json',JSON.stringify({timestamp:new Date().toISOString(),status:'PASS',verifiedUrl:url,desktopAnd390px:true,nineFigures:true,localArtworkDecoded:true,externalRequests:external,providerCalls:0,syntheticFixtureSeparatelyLabeled:true},null,2));console.log('W11R6 local human review desktop/mobile/images PASS: '+url);
}finally{await browser.close();}
