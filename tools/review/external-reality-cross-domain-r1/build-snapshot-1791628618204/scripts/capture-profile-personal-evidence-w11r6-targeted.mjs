import fs from 'node:fs';
import {chromium} from 'playwright';
const dir=process.env.W11R6_REPAIR_AUDIT||'content/profile/successors/personal-evidence-r1/w11r6/targeted-r1/',base=JSON.parse(fs.readFileSync(dir+'baseline.json')),root='tools/review/personal-evidence-r1/';
const hub=fs.readFileSync(base.backup+'tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html','utf8'),assets=JSON.parse(hub.match(/embeddedAssets=(.*?);\s*const displayAssets/s)[1]);
fs.mkdirSync(dir+'before',{recursive:true});
for(let i=1;i<=9;i++){const name='CASE-01-PFIG-'+String(i).padStart(3,'0')+'.png';fs.copyFileSync('content/profile/successors/personal-evidence-r1/w11r6/after/'+name,dir+'before/'+name);}
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),results=[];
try{const page=await browser.newPage();await page.route('**/*',r=>/^https?:/.test(r.request().url())?r.abort():r.continue());
for(const [id,ids]of [['CASE-08',['PFIG-006']],['CASE-09',['PFIG-005','PFIG-009']]])for(const phase of ['before','after']){
 let html=fs.readFileSync((phase==='before'?base.backup:'')+root+id+'-bilingual-dossier.html','utf8');for(const [url,data]of Object.entries(assets))html=html.replaceAll(url,data);
 await page.setViewportSize({width:1100,height:1100});await page.setContent(html);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});await page.emulateMedia({media:'print'});
 for(const fid of ids){const f=page.locator('[data-pfig="'+fid+'"]');await f.screenshot({path:dir+phase+'/'+id+'-'+fid+'.png'});await f.locator('xpath=ancestor::article[1]').screenshot({path:dir+phase+'/'+id+'-'+fid+'-page.png'});}
 await page.emulateMedia({media:'screen'});await page.setViewportSize({width:390,height:844});
 for(const fid of ids)await page.locator('[data-pfig="'+fid+'"]').screenshot({path:dir+phase+'/'+id+'-'+fid+'-mobile.png'});
 results.push({id,phase,figures:ids,source:phase==='before'?base.backup+root+id+'-bilingual-dossier.html':root+id+'-bilingual-dossier.html'});
 console.log(id+' '+phase+' targeted A4/page/mobile screenshots captured');
}
fs.writeFileSync(dir+'screenshot-provenance.json',JSON.stringify({timestamp:new Date().toISOString(),case01Before:'Original reviewed W11R6 after screenshots, copied unchanged',targetedBefore:'Exact start-of-repair HTML backup rendered locally',results},null,2));
}finally{await browser.close();}
