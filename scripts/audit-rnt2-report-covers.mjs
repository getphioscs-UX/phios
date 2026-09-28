import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.RNT2_PLAYWRIGHT_MODULE||'playwright');
import {PDFDocument} from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import {fitReportCoverFields} from '../functions/canonical-presentation-runtime/report-cover-overlay.js';

const root='artifacts/rnt2-cover',origin=process.env.RNT2_COVER_ORIGIN||'http://127.0.0.1:8791';
const expected=JSON.parse(fs.readFileSync(root+'/expected.json','utf8'));
const browser=await chromium.launch({headless:true,...(process.env.RNT2_BROWSER_EXECUTABLE?{executablePath:process.env.RNT2_BROWSER_EXECUTABLE}:{})});
const evidence={schemaVersion:'PHI-OS-RNT2-COVER-AUDIT-v1.0.0',errors:[],methods:{},physicalPdf:null};
try{
 const page=await browser.newPage({viewport:{width:1200,height:1700},deviceScaleFactor:1});
 await page.goto(origin+'/'+root+'/review.html',{waitUntil:'networkidle',timeout:120000});
 await page.evaluate('('+fitReportCoverFields.toString()+')(document)');
 const cases=expected.cases;
 for(const item of cases){
  const {methodId,caseId}=item;
  const loc=page.locator('.cover[data-case="'+caseId+'"]');
  const broken=await loc.locator('img').evaluate(i=>!i.complete||!i.naturalWidth);
  if(broken)evidence.errors.push('BROKEN_COVER_ASSET:'+methodId);
  const vals=Object.fromEntries(await loc.locator('[data-cover-field]').evaluateAll(nodes=>nodes.map(n=>[n.dataset.coverField,n.textContent.trim()])));
  for(const k of ['name','birthDate','birthTime'])if(vals[k]!==item.values[k])evidence.errors.push('COVER_FIELD_MISMATCH:'+caseId+':'+k);
  const clipped=await loc.locator('[data-cover-field]').evaluateAll(nodes=>nodes.filter(n=>n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1).map(n=>n.dataset.coverField));
  for(const k of clipped)evidence.errors.push('COVER_FIELD_CLIPPED:'+methodId+':'+k);
  evidence.methods[caseId]={values:vals,broken,clipped};
  await loc.screenshot({path:root+'/'+caseId+'-cover.png'});
 }
 await page.emulateMedia({media:'print'});
 const pdfPath=root+'/rnt2-eight-covers.pdf';
 await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true});
 const pdf=await PDFDocument.load(fs.readFileSync(pdfPath));
 evidence.physicalPdf={expectedPages:cases.length,actualPages:pdf.getPageCount(),match:pdf.getPageCount()===cases.length};
 if(pdf.getPageCount()!==cases.length)evidence.errors.push('COVER_PDF_PAGE_COUNT:'+pdf.getPageCount()+'/'+cases.length);
 const doc=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(pdfPath)),disableWorker:true}).promise;
 for(let i=1;i<=doc.numPages;i++){
  const p=await doc.getPage(i),tc=await p.getTextContent(),txt=tc.items.map(x=>x.str).join(' ');
  const item=cases[i-1],normalized=txt.replace(/\s+/g,'');
  if(item)for(const field of ['name','birthDate','birthTime'])if(!normalized.includes(item.values[field].replace(/\s+/g,'')))evidence.errors.push('PDF_COVER_FIELD_MISSING:'+item.caseId+':'+field);
 }
}finally{await browser.close();}
evidence.hardGateTests=expected.hardGateTests||[];
if(!evidence.hardGateTests.length||evidence.hardGateTests.some(x=>x.failClosed!==true))evidence.errors.push('COVER_FAIL_CLOSED_GATES_INCOMPLETE');
evidence.machinePass=evidence.errors.length===0;
fs.writeFileSync(root+'/cover-evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({machinePass:evidence.machinePass,errors:evidence.errors,physicalPdf:evidence.physicalPdf},null,2));
if(!evidence.machinePass)process.exitCode=1;
