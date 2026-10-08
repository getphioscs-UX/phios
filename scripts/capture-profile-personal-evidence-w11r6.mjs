import fs from 'node:fs';
import {chromium} from 'playwright';
const dir='content/profile/successors/personal-evidence-r1/w11r6/',phase=process.argv.includes('--after')?'after':'before';
const baseline=JSON.parse(fs.readFileSync(dir+'baseline.json'));
const hub=fs.readFileSync('tools/review/PROFILE-PERSONAL-EVIDENCE-R1-HUMAN-REVIEW.html','utf8'),assets=JSON.parse(hub.match(/embeddedAssets=(.*?);\s*const displayAssets/s)[1]);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
fs.mkdirSync(dir+phase,{recursive:true});
try{const page=await browser.newPage({viewport:{width:1100,height:1000}});
for(const id of ['CASE-01','CASE-08','CASE-09']){
 const p=phase==='before'?baseline.backup+'tools/review/personal-evidence-r1/'+id+'-bilingual-dossier.html':'tools/review/personal-evidence-r1/'+id+'-bilingual-dossier.html';
 let html=fs.readFileSync(p,'utf8');for(const [url,data]of Object.entries(assets))html=html.replaceAll(url,data);
 await page.setContent(html);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))});
 await page.emulateMedia({media:'print'});
 for(const fig of await page.locator('figure[data-pfig]').all()){
  const fid=await fig.getAttribute('data-pfig');if(id!=='CASE-01'&&!['PFIG-002','PFIG-004','PFIG-005','PFIG-009'].includes(fid))continue;
  await fig.screenshot({path:dir+phase+'/'+id+'-'+fid+'.png'});
  if(id==='CASE-01')await fig.locator('xpath=ancestor::article[1]').screenshot({path:dir+phase+'/'+id+'-'+fid+'-page.png'});
 }
}
console.log('W11R6 '+phase+' full-figure and page-context captures complete');
}finally{await browser.close();}
