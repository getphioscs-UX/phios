# BAZI R2 FINAL READABILITY REPAIR R4
# Reviewed attachments: BILINGUAL, EN, ZH-HANS; each 48 pages / 15 diagrams.
# Matching manuscript: 2cc520d1e7f1eafb46e9f16e565b9f4793c756ad8ad7fabca44a130ede57c2c9
# Source comparisons against the reconstructed closure text: 334 / 327 / 289,
# with zero mismatches. Closing bridge is outside section manuscript matching.
# Node/edge inventories match in all modes. Original attachments: passes 1/0/0.
# Actual Edge screen/print validation runs below; it was not run in the authoring environment.
# No provider calls, no package installation, no automatic acceptance or deployment.
[CmdletBinding()]
param(
    [string]$ProjectRoot = 'C:\phios',
    [switch]$ApplyOnly,
    [switch]$RunRepositoryCheck
)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $ProjectRoot
if (-not (Test-Path -LiteralPath '.\scripts\run-bazi-final-closure.ps1')) {
    throw 'Run this script against the current phios project; final closure scripts are missing.'
}
$null = Get-Command node -ErrorAction Stop
$oldLive = $env:REPORT_PROVIDER_LIVE_ALLOWED
$oldBrowser = $env:REPORT_BROWSER_EXECUTABLE
try {
    $env:REPORT_PROVIDER_LIVE_ALLOWED = 'false'
    if (-not $env:REPORT_BROWSER_EXECUTABLE) {
        foreach ($candidate in @(
            'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
            'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
            'C:\Program Files\Google\Chrome\Application\chrome.exe'
        )) {
            if (Test-Path -LiteralPath $candidate) {
                $env:REPORT_BROWSER_EXECUTABLE = $candidate
                break
            }
        }
    }
    $enginePath = Join-Path $PWD 'scripts\repair-bazi-r2-readability-r4.mjs'
    $engine = @'
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(), marker='BDM_READABILITY_R4';
const dir='docs/acceptance/bazi-paid-report/deep-manuscript-r2/';
const paths={renderer:'assets/customer-ui/js/personal-products/bazi-deep-manuscript-pages.js',css:'assets/customer-ui/surfaces/bazi-deep-manuscript-r2.css',browser:'scripts/check-bazi-final-closure-browser.mjs',plan:'assets/customer-ui/js/personal-products/bazi-editorial-paragraphs-r4.js'};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
function paragraphBlocks(text){const out=[];const re=/\n\s*\n/g;let start=0;for(const m of text.matchAll(re)){if(text.slice(start,m.index).trim())out.push({start,end:m.index});start=m.index+m[0].length;}if(text.slice(start).trim())out.push({start,end:text.length});return out;}
const snapshot=JSON.parse(read(dir+'LIVE-MANUSCRIPT-SNAPSHOT-R2-CLOSURE.json'));
assert(snapshot.digest&&snapshot.sections?.length===9,'Missing current closure manuscript');
const plan={manuscriptDigest:snapshot.digest,sections:{}};
for(const s of snapshot.sections){plan.sections[s.sectionId]={};for(const [locale,field] of [['zh-Hans','zhHansManuscript'],['en','enManuscript']]){const text=s[field];assert.equal(typeof text,'string');assert.equal(sha(JSON.stringify(text)),s.unitDigests[locale],'Manuscript unit digest mismatch: '+s.sectionId+' '+locale);plan.sections[s.sectionId][locale]=paragraphBlocks(text);}}
const originals=new Map();
for(const p of Object.values(paths)){originals.set(p,fs.existsSync(p)?read(p):null);}
if(process.argv.includes('--verify')){
 const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);let chromium;
 try{({chromium}=require('playwright'));}catch{throw Error('Playwright unavailable; no packages were installed. Use the existing project QA environment.');}
 const candidates=[process.env.REPORT_BROWSER_EXECUTABLE,path.join(process.env['ProgramFiles(x86)']||'', 'Microsoft/Edge/Application/msedge.exe'),path.join(process.env.ProgramFiles||'', 'Microsoft/Edge/Application/msedge.exe'),path.join(process.env.ProgramFiles||'', 'Google/Chrome/Application/chrome.exe')];
 const executablePath=candidates.find(p=>p&&fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{} )});const results=[];
 try{
  for(const mode of ['BILINGUAL','EN','ZH-HANS']){
   const p=await browser.newPage({viewport:{width:1366,height:768}});const file=path.join(root,'tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-'+mode+'.html');
   const {pathToFileURL}=await import('node:url');await p.goto(pathToFileURL(file).href,{waitUntil:'load',timeout:60000});await p.evaluate(()=>document.fonts.ready);
   const report=await p.evaluate(()=>{
    const pages=[...document.querySelectorAll('.bdm-page')],issues=[];const article=document.querySelector('.bdm-report');
    for(const pg of pages){const num=Number(pg.dataset.pageNumber),footer=pg.querySelector('footer').getBoundingClientRect(),box=pg.getBoundingClientRect();
     for(const el of pg.querySelectorAll('.bdm-locale p')){const r=document.createRange();r.selectNodeContents(el);for(const b of r.getClientRects())if(b.width&&b.height&&(b.bottom>footer.top-4+2||b.top<box.top+15-2||b.left<box.left+15-2||b.right>box.right-15+2)){issues.push({page:num,kind:'TEXT_OUTSIDE_SAFE_AREA',sourceStart:el.dataset.sourceStart});break;}}
     if(pg.querySelector('.bdm-locale')){const ps=getComputedStyle(pg.querySelector('.pub-decoration'),'::after');if(ps.content==='none'||ps.backgroundImage==='none')issues.push({page:num,kind:'WHITE_BACKING_MISSING'});}
    }
    return {mode:article.dataset.presentationMode,digest:article.dataset.manuscriptDigest,pass:article.dataset.recomposePass,pageCount:pages.length,groups:document.querySelectorAll('.bdm-editorial-prose-group').length,issues,spans:[...document.querySelectorAll('p[data-source-start]')].map(p=>({section:p.closest('.bdm-page').dataset.sectionId,locale:p.closest('[lang]')?.lang,start:Number(p.dataset.sourceStart),end:Number(p.dataset.sourceEnd),text:p.textContent}))};
   });
   assert.equal(report.digest,snapshot.digest);assert.equal(report.pageCount,48);assert(report.groups>0,'Editorial grouping missing');
   for(const span of report.spans){const s=snapshot.sections.find(s=>s.sectionId===span.section);if(!s)continue;const source=s[span.locale==='en'?'enManuscript':'zhHansManuscript'];assert.equal(source.slice(span.start,span.end),span.text,'Source span changed: '+span.section+' '+span.start);}
   for(const n of [17,21,29,37])await p.locator('[data-page-number="'+n+'"]').screenshot({path:path.join(root,dir+'fit-closure/'+mode+'-READABILITY-P'+n+'.png')});
   await p.emulateMedia({media:'print'});const printIssues=await p.evaluate(()=>{const issues=[];for(const pg of document.querySelectorAll('.bdm-page')){const footer=pg.querySelector('footer').getBoundingClientRect();for(const el of pg.querySelectorAll('.bdm-locale p')){const r=document.createRange();r.selectNodeContents(el);if([...r.getClientRects()].some(b=>b.height&&b.bottom>footer.top-2))issues.push(Number(pg.dataset.pageNumber));}}return [...new Set(issues)];});
   const terminal=JSON.parse(read(dir+'LIVE-PUBLICATION-IR-R2-CLOSURE-'+report.mode+'.json'));
   assert.equal(Number(report.pass),terminal.publication.recomposePass||0,'Reviewed HTML is not the terminal composition');
   results.push({mode:report.mode,status:report.issues.length||printIssues.length?'FAIL':'PASS',pass:Number(report.pass),pageCount:report.pageCount,groups:report.groups,sourceSpans:report.spans.length,screenIssues:report.issues,printOverflowPages:printIssues});await p.close();
  }
 }finally{await browser.close();}
 const receipt={version:marker,manuscriptDigest:snapshot.digest,providerCalls:0,humanAccepted:false,status:results.every(r=>r.status==='PASS')?'PASS':'FAIL',results};
 fs.writeFileSync(path.join(root,dir+'fit-closure/READABILITY-R4-RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));assert.equal(receipt.status,'PASS','Readability remains blocked');
 process.exit(0);
}
const pending=new Map();
let renderer=originals.get(paths.renderer);assert(renderer,'Missing renderer');
const start=renderer.indexOf('function prose(content,locales');const end=renderer.indexOf('\nexport function renderBaziDeepManuscript',start);assert(start>=0&&end>start,'Unknown prose renderer version');
assert(renderer.slice(start,end).includes('data-source-start'),'Source identity missing');
const helper=`// ${marker}: preserve every source span; restore manuscript paragraph boundaries.
function prose(content,locales,sectionId,manuscriptDigest){
 if(manuscriptDigest!==BAZI_EDITORIAL_PARAGRAPHS_R4.manuscriptDigest)throw Error('EDITORIAL_PARAGRAPH_LINEAGE_MISMATCH: rerun readability installer');
 return locales.map(locale=>{
  const blocks=BAZI_EDITORIAL_PARAGRAPHS_R4.sections[sectionId]?.[locale];
  const entries=content?.[locale]||[],groups=[];
  const paragraph=s=>\`<p data-source-start="\${s.start}" data-source-end="\${s.end}" data-source-role="\${s.role}">\${esc(s.text)}</p>\`;
  if(!blocks)return \`<div lang="\${locale}" class="bdm-locale">\${entries.map(paragraph).join('')}</div>\`;
  let current=[],last=-1;
  for(const s of entries){
   const index=blocks.findIndex(b=>Number(s.start)>=b.start&&Number(s.end)<=b.end);
   if(index<0)throw Error('EDITORIAL_SOURCE_SPAN_OUTSIDE_PARAGRAPH '+sectionId+' '+locale+' '+s.start);
   if(current.length&&index!==last){groups.push(current);current=[];}
   current.push(s);last=index;
  }
  if(current.length)groups.push(current);
  return \`<div lang="\${locale}" class="bdm-locale">\${groups.map(group=>'<div class="bdm-editorial-prose-group">'+group.map(paragraph).join(locale==='en'?' ':'')+'</div>').join('')}</div>\`;
 }).join('');
}`;
renderer=renderer.slice(0,start).replace(/(?:\/\/ BDM_READABILITY_R4[^\n]*\n)+$/, '')+helper+renderer.slice(end);
const importLine="import {BAZI_EDITORIAL_PARAGRAPHS_R4} from './bazi-editorial-paragraphs-r4.js';\n";
if(!renderer.includes(importLine.trim()))renderer=importLine+renderer;
const call=/prose\(p\.content,locales(?:,p\.pageNumber|,p\.sectionId,ir\.manuscript\.digest)?\)/;
assert(call.test(renderer),'Unknown prose call');renderer=renderer.replace(call,'prose(p.content,locales,p.sectionId,ir.manuscript.digest)');pending.set(paths.renderer,renderer);
let css=originals.get(paths.css);assert(css,'Missing report CSS');
const cssStart='/* '+marker+' START */',cssEnd='/* '+marker+' END */';
if(css.includes(cssStart)){const a=css.indexOf(cssStart),b=css.indexOf(cssEnd,a);assert(b>a);css=css.slice(0,a)+css.slice(b+cssEnd.length);}
css=css.trimEnd()+`\n${cssStart}
.bdm-report .bdm-page:has(.bdm-locale) .pub-decoration::after{
 content:"";position:absolute;inset:0;pointer-events:none;
 background:linear-gradient(to bottom,rgba(255,255,255,0) 65%,rgba(255,255,255,.88) 78%,rgba(255,255,255,.97) 100%);
}
.bdm-report .bdm-locale .bdm-editorial-prose-group{margin:0 0 2.4mm;}
.bdm-report .bdm-locale .bdm-editorial-prose-group>p{display:inline;margin:0;}
@media print{
 .bdm-report .bdm-page:has(.bdm-locale) .pub-decoration::after{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
}
${cssEnd}\n`;
pending.set(paths.css,css);
let check=originals.get(paths.browser);assert(check,'Missing browser checker');
const needle="if(mode==='BILINGUAL')fs.writeFileSync('tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-BILINGUAL.html',";
const writer="fs.writeFileSync('tools/review/BAZI-DEEP-MANUSCRIPT-R2-PUBLICATION-REVIEW-R2-'+(mode==='ZH_HANS'?'ZH-HANS':mode)+'.html',";
if(check.includes(needle))check=check.replace(needle,writer);else assert(check.includes(writer),'Unknown terminal HTML writer');
if(!check.includes("'"+paths.plan+"'"))check=check.replace("const renderFiles=[","const renderFiles=['"+paths.plan+"',");
assert(check.includes("'"+paths.plan+"'"),'Unable to register paragraph plan fingerprint');
check=check.replace(/for\(const n of \[([\d, ]+)\]\)/,(match,numbers)=>'for(const n of ['+[...new Set([...numbers.split(',').map(Number),17,21,29,37])].join(',')+'])');
pending.set(paths.browser,check);pending.set(paths.plan,'// '+marker+'; generated from the current immutable manuscript.\nexport const BAZI_EDITORIAL_PARAGRAPHS_R4='+JSON.stringify(plan,null,2)+';\n');
// All version checks above precede all source mutations.
const changed=[...pending].filter(([p,text])=>originals.get(p)!==text),stamp=Date.now(),backupDir=path.join(root,dir+'readability-r4-backups/'+stamp);fs.mkdirSync(backupDir,{recursive:true});
const manifest=[];
for(const [p,text] of changed){const before=originals.get(p),backup=path.join(backupDir,p.replaceAll('/','__'));if(before!==null)fs.writeFileSync(backup,before);manifest.push({path:p,backup:before===null?null:backup,before:before===null?null:sha(before),after:sha(text)});}
fs.writeFileSync(path.join(backupDir,'manifest.json'),JSON.stringify({manuscriptDigest:snapshot.digest,providerCalls:0,files:manifest},null,2));
const written=[];try{for(const [p,text] of changed){fs.writeFileSync(path.join(root,p),text);written.push(p);}}catch(error){for(const p of written){const before=originals.get(p);if(before===null)fs.unlinkSync(path.join(root,p));else fs.writeFileSync(path.join(root,p),before);}throw error;}
console.log(JSON.stringify({status:'APPLIED',changed:manifest.map(f=>f.path),backupDir,manuscriptDigest:snapshot.digest,providerCalls:0,humanAccepted:false}));
'@
    [System.IO.File]::WriteAllText($enginePath, $engine, (New-Object System.Text.UTF8Encoding($false)))
    node scripts/capture-bazi-final-closure-baseline.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Protected-file baseline capture failed; stopped.' }
    node $enginePath
    if ($LASTEXITCODE -ne 0) { throw 'Readability repair did not apply; stopped.' }
    if ($ApplyOnly) {
        Write-Host 'Repair applied with backups. Browser/PDF checks and acceptance remain pending.'
        return
    }
    foreach ($command in @(
        'build:bazi-deep-manuscript:r2-final-human-acceptance-review',
        'check:bazi-deep-manuscript:r2-final-closure-architecture',
        'check:bazi-deep-manuscript:r2-s04-seven-killings-coverage',
        'check:bazi-deep-manuscript:r2-timing-consistency',
        'check:bazi-deep-manuscript:r2-diagram-fidelity',
        'check:bazi-deep-manuscript:r2-publication-semantic-coverage',
        'check:bazi-deep-manuscript:r2-prelive',
        'check:bazi-deep-manuscript:r2-capacity-closure',
        'check:bazi-deep-manuscript:r2-final-browser',
        'check:bazi-deep-manuscript:r2-final-pdf',
        'check:bazi-deep-manuscript:r2-final-zero-provider',
        'check:bazi-deep-manuscript:r2-final-closure'
    )) {
        npm run $command
        if ($LASTEXITCODE -ne 0) { throw "Check failed: $command. Human acceptance remains pending." }
    }
    node $enginePath --verify
    if ($LASTEXITCODE -ne 0) { throw 'Additional source/readability/screen/print checks failed; stopped.' }
    if ($RunRepositoryCheck) {
        npm run check
        $globalExit = $LASTEXITCODE
        node -e "require('node:fs').writeFileSync('docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-GLOBAL-CHECK.json', JSON.stringify({status:process.argv[1]==='0'?'PASS':'FAIL',classification:process.argv[1]==='0'?null:'UNKNOWN',exitCode:Number(process.argv[1]),overallPass:process.argv[1]==='0'},null,2))" "$globalExit"
        if ($LASTEXITCODE -ne 0) { throw 'Could not record the repository check result.' }
    } else {
        $globalExit = 0
        node -e "require('node:fs').writeFileSync('docs/acceptance/bazi-paid-report/deep-manuscript-r2/FINAL-CLOSURE-GLOBAL-CHECK.json', JSON.stringify({status:'NOT_RUN_FOR_READABILITY_REPAIR',classification:'GLOBAL_REVIEW_PENDING',overallPass:false},null,2))"
        if ($LASTEXITCODE -ne 0) { throw 'Could not record pending repository review.' }
    }
    node scripts/report-bazi-final-closure.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Machine report generation failed.' }
    if ($globalExit -ne 0) { throw 'BaZi repair checks passed; repository-wide check failed. Send the failure output.' }
    Start-Process (Join-Path $PWD 'tools\review\BAZI-DEEP-MANUSCRIPT-R2-FINAL-HUMAN-ACCEPTANCE-REVIEW.html')
    Write-Host 'BaZi readability checks passed. Inspect all three reports, especially pages 17/21/29/37.'
    Write-Host 'No provider calls; human acceptance and production admission remain pending.'
} finally {
    $env:REPORT_PROVIDER_LIVE_ALLOWED = $oldLive
    $env:REPORT_BROWSER_EXECUTABLE = $oldBrowser
}
