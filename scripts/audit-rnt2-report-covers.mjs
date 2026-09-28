import fs from 'node:fs';
import {chromium} from 'playwright';
import {PDFDocument} from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const root='artifacts/rnt2-cover',origin='http://127.0.0.1:8791';
const expected=JSON.parse(fs.readFileSync(root+'/expected.json','utf8'));
const browser=await chromium.launch({headless:true});
const evidence={schemaVersion:'PHI-OS-RNT2-COVER-AUDIT-v1.0.0',errors:[],methods:{},physicalPdf:null};
try{
 const page=await browser.newPage({viewport:{width:1200,height:1700},deviceScaleFactor:1});
 await page.goto(origin+'/'+root+'/review.html',{waitUntil:'networkidle',timeout:120000});
 const methods=await page.locator('.cover').evaluateAll(nodes=>nodes.map(n=>n.dataset.method));
 for(const methodId of methods){
  const loc=page.locator('.cover[data-method="'+methodId+'"]');
  const broken=await loc.locator('img').evaluate(i=>!i.complete||!i.naturalWidth);
  if(broken)evidence.errors.push('BROKEN_COVER_ASSET:'+methodId);
  const vals=Object.fromEntries(await loc.locator('[data-cover-field]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.coverField,n.textContent.trim()])));
  for(const k of ['name','birthDate','birthTime'])if(vals[k]!==expected.expected[methodId][k])evidence.errors.push('COVER_FIELD_MISMATCH:'+methodId+':'+k);
  const clipped=await loc.locator('[data-cover-field]').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1).map(n=>n.dataset.coverField));
  for(const k of clipped)evidence.errors.push('COVER_FIELD_CLIPPED:'+methodId+':'+k);
  evidence.methods[methodId]={values:vals,broken,clipped};
  await loc.screenshot({path:root+'/'+methodId+'-cover.png'});
 }
 await page.emulateMedia({media:'print'});
 const pdfPath=root+'/rnt2-eight-covers.pdf';
 await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true});
 const pdf=await PDFDocument.load(fs.readFileSync(pdfPath));
 evidence.physicalPdf={expectedPages:8,actualPages:pdf.getPageCount(),match:pdf.getPageCount()===8};
 if(pdf.getPageCount()!==8)evidence.errors.push('COVER_PDF_PAGE_COUNT:'+pdf.getPageCount()+'/8');
 const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(pdfPath)),disableWorker:true}).promise;
 for(let i=1;i<=doc.numPages;i++){
  const p=await doc.getPage(i),tc=await p.getTextContent(),txt=tc.items.map(x=>x.str).join(' ');
  if(!txt.includes('RNT2 QA'))evidence.errors.push('PDF_COVER_NAME_MISSING:P'+i);
  const methodId=Object.keys(expected.expected)[i-1];
  if(methodId){
   const v=expected.expected[methodId];
   if(!txt.includes(v.birthDate.replace(/\s+/g,' ').trim()))evidence.errors.push('PDF_COVER_DATE_MISSING:'+methodId+':P'+i);
   if(!txt.includes(v.birthTime.replace(/\s+/g,' ').trim()))evidence.errors.push('PDF_COVER_TIME_MISSING:'+methodId+':P'+i);
  }
 }
}finally{await browser.close();}
evidence.machinePass=evidence.errors.length===0;
fs.writeFileSync(root+'/cover-evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({machinePass:evidence.machinePass,errors:evidence.errors,physicalPdf:evidence.physicalPdf},null,2));
if(!evidence.machinePass)process.exitCode=1;
