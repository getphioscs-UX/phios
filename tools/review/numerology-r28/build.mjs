import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import sharp from 'sharp';import {PDFDocument} from 'pdf-lib';
import {requireDiskSpace} from '../../../scripts/lib/disk-space-guard.mjs';
import {projectNumR28ForLocalDelivery,renderNumR28PublicationHtml} from '../../../functions/personal-reading/narrative/numerology-publication-system.js';
import {renderNumR28Diagram} from '../../../functions/personal-reading/narrative/numerology-publication-diagrams.js';
import {assembleFixedPublicationCandidate} from '../../../functions/canonical-presentation-runtime/report-fixed-publication-assembler.js';
import {bindLocalConfirmedCoverFields} from '../../../functions/canonical-presentation-runtime/report-cover-field-binding.js';
import {loadWorldPlaywright,worldBrowserLaunchOptions} from '../../../scripts/lib/world-browser-runtime.mjs';
const dir='tools/review/numerology-r28',out='output/pdf/numerology-r28';
const write=(file,value)=>fs.writeFileSync(file,JSON.stringify(value,null,2));
export async function build(){
 requireDiskSpace({estimatedBytes:900000000,label:'R28 three-language publication candidate'});
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/.gitignore','*\n');fs.mkdirSync(dir,{recursive:true});fs.mkdirSync('.tmp/numerology-r28',{recursive:true});
 const snapshot=JSON.parse(fs.readFileSync('.tmp/numerology-r27/PUBLICATION-SNAPSHOT.json'));
 const priorPages=JSON.parse(fs.readFileSync('.tmp/numerology-r28/R27-EDITORIAL.json'));
 const editorial={origin:'OFFLINE_HANDOFF_REPLAY',sourceRef:'.tmp/numerology-r27/handoff/PHIOS_NUMEROLOGY_R27_BODY_PRINT.html',calculationSnapshotDigest:snapshot.snapshotDigest,publicationAllowed:false,pages:priorPages};
 const publication=process.argv.includes('--reuse-publication')?JSON.parse(fs.readFileSync('.tmp/numerology-r28/PUBLICATION.json')):await projectNumR28ForLocalDelivery({snapshot,editorial});if(publication.snapshotDigest!==snapshot.snapshotDigest)throw Error('REUSE_SNAPSHOT_MISMATCH');
 write('.tmp/numerology-r28/PUBLICATION.json',publication);
 write(dir+'/BINDING-MATRIX.json',publication.diagrams);write(dir+'/EDITORIAL-BEFORE-AFTER.json',publication.editorialChanges);
 const styles={shell:fs.readFileSync('assets/customer-ui/surfaces/report-print-shell-v2.css','utf8'),method:fs.readFileSync('assets/customer-ui/surfaces/numerology-publication-v28.css','utf8')};
 const manifest=JSON.parse(fs.readFileSync('content/reports/shared/report-visual-assets-r2.json')),assets={},pdfAssets={};let bodyAsset;
 for(const a of manifest.assets.filter(x=>x.methodId==='NUM')){
  const name=a.pageId.startsWith('SEC-')?a.pageId+'.webp':(a.language==='bilingual'&&['BODY','SECTION-STYLE'].includes(a.pageId)?'shared':a.language)+'-'+path.basename(a.objectKey);
  const bytes=fs.readFileSync('.tmp/numerology-r20/assets/'+name),hash=createHash('sha256').update(bytes).digest('hex');if(hash!==a.sha256)throw Error('R28_FIXED_ASSET_HASH_MISMATCH');assets[a.objectKey]={sha256:hash,dataUrl:'data:image/webp;base64,'+bytes.toString('base64')};
  if(process.argv.includes('--pdf')){const item={sourceBytes:bytes,pdfBytes:await sharp(bytes).jpeg({quality:100,chromaSubsampling:'4:4:4'}).toBuffer(),mime:'image/jpeg',sourceSHA256:hash};pdfAssets['NUM:'+a.pageId+':'+a.language]=item;if(a.pageId==='BODY')bodyAsset=item;}
 }
 const fontUrl='data:font/ttf;base64,'+fs.readFileSync('assets/fonts/private-report/NotoSansSC-Regular.ttf').toString('base64'),results=[];
 let browser;
 if(process.argv.includes('--pdf'))browser=await loadWorldPlaywright().chromium.launch(worldBrowserLaunchOptions());
 try{for(const locale of (process.argv.includes('--bilingual-only')?['bilingual']:['zh-Hans','en','bilingual'])){
  const folder=out+'/'+locale;fs.mkdirSync(folder+'/diagrams',{recursive:true});
  const rendered=renderNumR28PublicationHtml({snapshot,publication,locale,styles,manifest,assets,fontUrl,localReview:true});
  await fs.promises.writeFile(folder+'/REPORT.html',rendered.html);write(folder+'/PAGE-MAP.json',rendered.plan);
  for(const d of publication.diagrams){const svg=renderNumR28Diagram({diagram:d,publication,locale});fs.writeFileSync(folder+'/diagrams/'+d.logicalPageId+'.svg',svg);if(locale==='bilingual')await sharp(Buffer.from(svg)).resize({width:1100}).flatten({background:'#fbf7ee'}).png().toFile(folder+'/diagrams/'+d.logicalPageId+'.png');}
  const result={locale,html:folder+'/REPORT.html',snapshotDigest:snapshot.snapshotDigest,publicationDigest:publication.publicationDigest,physicalPages:rendered.plan.length,diagrams:19,htmlGenerated:true,pdf:'NOT_EXECUTED'};
  if(browser){
   if(publication.diagrams.some(d=>d.availability==='BLOCKED_PRINT_BUDGET'))throw Error('R28_PRINT_BUDGET_REVIEW_REQUIRED');
   const page=await browser.newPage({viewport:{width:1200,height:1400}});await page.route('**/*',r=>r.request().url().startsWith('data:')?r.continue():r.abort());await page.emulateMedia({media:'print'});await page.setContent(rendered.html,{waitUntil:'load'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
   const qa=await page.evaluate(()=>[...document.querySelectorAll('.num-publication-page')].map(e=>{const r=e.getBoundingClientRect(),foot=e.querySelector('.pub-footer').getBoundingClientRect(),content=e.querySelector('.num-page-content').getBoundingClientRect();return{pageId:e.dataset.pageId,pageOverflow:Math.max(0,foot.bottom-(r.bottom-10*96/25.4)),contentFooterOverlap:Math.max(0,content.bottom-foot.top),bodyFontSizes:[...e.querySelectorAll('.num-interpretation p')].map(p=>parseFloat(getComputedStyle(p).fontSize)*72/96),diagramLabelSizes:[...e.querySelectorAll('svg text.label,svg text.note')].map(t=>parseFloat(getComputedStyle(t).fontSize)*t.getScreenCTM().a*72/96)};}));
   const failures=qa.filter(x=>x.pageOverflow>1||x.contentFooterOverlap>1||x.bodyFontSizes.some(n=>n<9.49)||x.diagramLabelSizes.some(n=>n<8.49));write(folder+'/PRINT-PREFLIGHT.json',{qa,failures});
   if(failures.length)result.pdf='BLOCKED_LAYOUT_PREFLIGHT';else{
    await page.addStyleTag({content:'.sheet.fixed{display:none!important}.pub-page:before{display:none!important}.pub-decoration{display:none!important}html,body,.pub-report,.sheet{background:transparent!important;background-image:none!important}.num-publication-page{background:#fbf7ee!important}'});
    const bodyPdf=await page.pdf({preferCSSPageSize:true,printBackground:true,omitBackground:true});if((await PDFDocument.load(bodyPdf)).getPageCount()!==19)throw Error('R28_BODY_PAGE_COUNT');
    const assembled=await assembleFixedPublicationCandidate({plan:rendered.plan,bodyPdf,assets:pdfAssets,bodyAsset,localReview:true});
    const notSupplied=locale==='en'?'Not supplied':locale==='zh-Hans'?'未提供':'未提供 / Not supplied';
    const fields=[{key:'name',value:snapshot.expansionInput.identityInput?.customerConfirmed?snapshot.expansionInput.identityInput.fullBirthName:notSupplied},{key:'birthDate',value:snapshot.canonicalInput.birthDate},{key:'birthTime',value:snapshot.canonicalInput.birthTime||notSupplied}];
    const cover=await browser.newPage();await cover.route('**/*',r=>r.request().url().startsWith('data:')?r.continue():r.abort());await cover.emulateMedia({media:'print'});
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    await cover.setContent(`<style>@font-face{font-family:ReportCJK;src:url('${fontUrl}')}@page{size:A4;margin:0}html,body{margin:0;background:transparent}div{position:absolute;top:253.2mm;width:57mm;font:9pt/1.2 Arial,ReportCJK,sans-serif;color:#193442;overflow-wrap:anywhere}</style>`+fields.map((f,i)=>`<div style="left:${[18,84,146][i]}mm">${escape(f.value)}</div>`).join(''));await cover.evaluate(()=>document.fonts.ready);
    const overlay=await cover.pdf({preferCSSPageSize:true,printBackground:true,omitBackground:true});await cover.close();
    const bound=await bindLocalConfirmedCoverFields({pdfBytes:assembled.bytes,overlayPdfBytes:overlay,fields,inputDigest:snapshot.inputDigest,localReview:true});
    const file=folder+'/PHI-OS-NUMEROLOGY-R28-'+locale+'.pdf';fs.writeFileSync(file,bound.bytes);result.pdf=file;result.pdfPages=(await PDFDocument.load(bound.bytes)).getPageCount();result.pdfSHA256=createHash('sha256').update(bound.bytes).digest('hex');write(folder+'/PAGE-MAP.json',assembled.map);write(folder+'/COVER-BINDING.json',bound.binding);
   }await page.close();
  }results.push(result);console.log(locale,result.pdf);
 }}finally{await browser?.close();}
 if(process.argv.includes('--bilingual-only'))for(const old of JSON.parse(fs.readFileSync(dir+'/GENERATION.json')).results.filter(x=>x.locale!=='bilingual')){old.pdfSHA256=createHash('sha256').update(fs.readFileSync(old.pdf)).digest('hex');old.publicationDigest=publication.publicationDigest;results.unshift(old);}
 write(dir+(process.argv.includes('--preserve-pdf-receipts')?'/HTML-REVISION.json':'/GENERATION.json'),{results,providerCalls:0,productionWrites:0,customerPublishable:false});
 return{snapshot,publication,results};
}
if(process.argv.includes('--run'))await build();
