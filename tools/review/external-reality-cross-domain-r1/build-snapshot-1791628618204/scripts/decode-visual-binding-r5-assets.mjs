import fs from 'node:fs';
import {createRequire} from 'node:module';
const base='content/production-closure/live-customer-commercial-convergence',file=base+'/VISUAL-BINDING-R5-89-R2-VERIFICATION.json',receipt=JSON.parse(fs.readFileSync(file));
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
try{for(const record of receipt.records.filter(x=>x.actualFormat==='WEBP')){
 const url='data:image/webp;base64,'+fs.readFileSync(record.cache).toString('base64');
 const result=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};},url);
 Object.assign(record,result,{decoded:true,state:'DECODE_VERIFIED_VISUAL_REVIEW_PENDING'});
}
fs.mkdirSync('tools/review/visual-binding-r5',{recursive:true});
for(const batch of [...new Set(receipt.records.map(x=>x.batch))]){
 const records=receipt.records.filter(x=>x.batch===batch&&x.decoded);
 if(!records.length)continue;
 await page.setContent('<style>body{font:16px sans-serif;display:grid;grid-template-columns:repeat(2,1fr);gap:20px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px}</style>'+records.map(x=>'<figure><figcaption>'+x.sequence+' '+x.planId+'</figcaption><img src="data:image/webp;base64,'+fs.readFileSync(x.cache).toString('base64')+'"></figure>').join(''));
 await page.screenshot({path:'tools/review/visual-binding-r5/'+batch+'-verified-contact-sheet.png',fullPage:true});
}
fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({decoded:receipt.records.filter(x=>x.decoded).length,failed:receipt.records.filter(x=>x.state==='FAIL').length,providerCalls:0}));
}finally{await browser.close();}
