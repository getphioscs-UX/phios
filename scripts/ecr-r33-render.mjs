import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {buildEcrAuthorPublicationIR,renderEcrAuthorPublicationChapter,assembleEcrAuthorPublicationPdf,authorVisibleText} from '../functions/ecr-full-report/ecr-author-led-publication-r31.js';
const root=path.resolve(process.argv[2]),out=path.join(root,'r33-publication');if(root.toLowerCase().startsWith(path.resolve('.').toLowerCase()+path.sep))throw Error('PRIVATE_OUTPUT_REQUIRED');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),index=read(root+'/CURRENT-EFFECTIVE-CHAPTERS.json'),ir=read(out+'/private-runtime-ir.json'),proof=read(out+'/20-MANUSCRIPT-ACCEPTANCE-PROOF.json'),manifest=read(out+'/asset-manifest-snapshot.json'),assets=read(out+'/asset-byte-evidence.json').results;
const manuscripts=index.versions.map(v=>({...v,text:fs.readFileSync(v.folder+'/exact-text.txt','utf8'),shaVerified:proof.checks.some(c=>c.sectionId===v.sectionId&&c.locale===v.locale&&c.hashVerified),explicitFounderEvidence:proof.checks.find(c=>c.sectionId===v.sectionId&&c.locale===v.locale)?.explicitFounderEvidence}));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']}),page=await browser.newPage();await page.route('https://**/*',route=>route.abort());
const results=[],textProof=[];
try{for(const locale of ['zh-Hans','en','bilingual']){
 const dir=path.join(out,locale);fs.mkdirSync(dir,{recursive:true});
 const publication=buildEcrAuthorPublicationIR({ir,manuscripts,language:locale,founderIntegrationAuthorized:true,localReview:true});fs.writeFileSync(dir+'/publication-ir.json',JSON.stringify(publication,null,2));
 const parts=[];for(let n=1;n<=5;n++){const asset=assets.find(a=>a.pageId==='P0'+n&&a.status==='PASS_BYTES');if(asset)parts.push({kind:'FIXED_ART',assetId:asset.pageId,png:fs.readFileSync(out+'/assets/'+asset.pageId+'.png'),sha256:asset.actualSha256});}
 const sectionProof=[];
 for(const section of publication.sections.filter(s=>!s.interactive)){
  const divider=assets.find(a=>a.pageId==='SEC-'+section.id&&a.status==='PASS_BYTES');if(divider)parts.push({kind:'FIXED_ART',assetId:divider.pageId,png:fs.readFileSync(out+'/assets/'+divider.pageId+'.png'),sha256:divider.actualSha256});
  const preview=renderEcrAuthorPublicationChapter({publication,sectionId:section.id,manifest}),htmlFile=path.join(dir,'section-'+section.id+'.html');fs.writeFileSync(htmlFile,preview.html);
  await page.goto('file:///'+htmlFile.replaceAll('\\','/'),{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  const rendered=await page.locator('[data-author-body]').evaluateAll(xs=>Object.fromEntries(xs.map(x=>[x.dataset.authorBody,x.textContent]))),normalized=s=>s.replace(/\s+/g,'');
  for(const body of section.authorBodies){const key=section.id+':'+body.locale,expected=authorVisibleText(body.text);if(normalized(rendered[key])!==normalized(expected))throw Error('RENDERER_CHANGED_AUTHOR_WORDS');textProof.push({reportLanguage:locale,sectionId:section.id,bodyLocale:body.locale,sourceSha256:body.exactTextSha256,visibleWordsPreserved:true,normalization:'Markdown presentation markers and layout whitespace only; all source files unchanged.'});}
  const pdf=await page.pdf({format:'A4',preferCSSPageSize:true,printBackground:true,omitBackground:true});fs.writeFileSync(path.join(dir,'section-'+section.id+'-text.pdf'),pdf);parts.push({kind:'BODY_TEXT',sectionId:section.id,pdf});sectionProof.push({sectionId:section.id,dividerIncluded:!!divider});
 }
 const assembled=await assembleEcrAuthorPublicationPdf({parts,bodyPng:fs.readFileSync(out+'/assets/BODY.png'),localReview:true,title:'PHI Configuration - Personal Resonance Reading - '+locale+' - Private Review'}),name='PHI-CONFIGURATION-R33-'+locale+'.pdf';fs.writeFileSync(path.join(dir,name),assembled.bytes);fs.writeFileSync(path.join(dir,'page-map.json'),JSON.stringify(assembled.pageMap,null,2));
 results.push({locale,file:path.join(dir,name),pages:assembled.pageMap.length,sections:sectionProof,sha256:crypto.createHash('sha256').update(assembled.bytes).digest('hex'),customerPublishable:false});
 }}finally{await browser.close();}
fs.writeFileSync(out+'/pdf-results.json',JSON.stringify({results,providerCalls:0},null,2));fs.writeFileSync(out+'/renderer-text-integrity.json',JSON.stringify({checks:textProof,allSourceFilesUnchanged:true},null,2));console.log(JSON.stringify({pdfs:results.map(r=>({locale:r.locale,pages:r.pages})),renderedLanguageBodyChecks:textProof.length,privateOutput:true,providerCalls:0}));
