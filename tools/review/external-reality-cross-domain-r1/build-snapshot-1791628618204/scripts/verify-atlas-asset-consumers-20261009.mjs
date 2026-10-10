import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {resolveAtlasVisualById,resolveAtlasVisualDeepLink} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';
const dir='docs/assets/r2-public/wiring-20261009'; fs.mkdirSync(dir,{recursive:true});
const read=p=>JSON.parse(fs.readFileSync(p));
const bindings=read('content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json');
const mode=process.argv[2]||'WORLD';
const bookVMode=mode==='BOOK-V'||mode==='BOOK-V-SPOT';
const output=dir+'/'+mode+'-CONSUMERS.json';
async function save(){for(let i=0;i<5;i++)try{fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');return;}catch(e){if(i===4)throw e;await new Promise(r=>setTimeout(r,200));}}
const head=()=>execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const result={started:new Date().toISOString(),head:head(),scope:'LOCAL_SOURCE_WITH_PUBLIC_R2_GET_ONLY',providerCalls:0,rows:[],errors:[]};
if(mode==='BOOK-V'&&process.argv.includes('--resume')&&fs.existsSync(output))result.rows=read(output).rows.filter(r=>r.state==='LOADED_DECODED_VISIBLE');
result.registry=bindings.assets.map(a=>({assetId:a.assetId,family:a.family,subjectId:a.subjectId,key:a.bucketKey,contentRegistry:a.sourceRegistry,contentPointer:a.sourcePointer,contentRegistryExists:fs.existsSync(a.sourceRegistry),acceptance:a.reviewEvidence,acceptanceExists:fs.existsSync(a.reviewEvidence),resolverAccepted:!!resolveAtlasVisualById(bindings,a.assetId),deepLink:resolveAtlasVisualDeepLink(bindings,a.assetId)}));
await build({entryPoints:['scripts/lib/book-publication-review-server.mjs'],bundle:true,platform:'node',format:'esm',outfile:dir+'/review-server.mjs'});
const {createPublicationReviewServer}=await import(pathToFileURL(path.resolve(dir+'/review-server.mjs')));
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext();const cache=new Map();let blocked=0;
await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(req.method()!=='GET'){blocked++;return route.abort();}if(u.origin===origin)return route.continue();if(u.origin==='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev'){try{let x=cache.get(u.href);if(!x){const r=await fetch(u);if(!r.ok)throw Error('HTTP '+r.status);const body=Buffer.from(await r.arrayBuffer());x={body,contentType:r.headers.get('content-type')||'image/webp',sha256:crypto.createHash('sha256').update(body).digest('hex')};cache.set(u.href,x);}return route.fulfill({status:200,body:x.body,contentType:x.contentType});}catch(e){result.errors.push({url:u.href,error:String(e)});return route.abort();}}blocked++;return route.abort();});
context.setDefaultTimeout(45000);const page=await context.newPage();
try{
const keys=new Set(read('docs/assets/r2-public/audit-20261009/OBJECT-REVIEW.json').rows.filter(x=>x.classification==='已批准但未接入'&&x.key.includes('civilization-atlas')).map(x=>x.key));
let selected=bindings.assets.filter(a=>mode==='WORLD'?a.family==='WORLD_SNAPSHOT_ATMOSPHERE':mode==='BOOK-VI'?a.family==='WORLD_RECONFIGURATION_SNAPSHOT':keys.has(a.bucketKey)&&a.family!=='WORLD_SNAPSHOT_ATMOSPHERE'&&a.family!=='WORLD_RECONFIGURATION_SNAPSHOT');
if(mode==='BOOK-V-SPOT')selected=selected.filter((a,i,all)=>all.findIndex(x=>x.family===a.family)===i);
async function exercise(items,page){let lastAsset=null,lastLocale=null;
for(const a of items)for(const locale of ['en','zh-Hans'])for(const width of [1280,390]){
 if(result.rows.some(r=>r.assetId===a.assetId&&r.locale===locale&&r.width===width))continue;
 const row={assetId:a.assetId,key:a.bucketKey,locale,width,page:'/books/reality-differentiation/?atlas=world&snapshot='+a.subjectId+'&lang='+locale,before:'DYNAMIC_CONSUMER_MISCLASSIFIED_BY_STATIC_SCAN',sourceChange:'NONE'};
 if(mode==='BOOK-VI')row.page='/books/reality-reconfiguration/?atlas=snapshots&snapshot='+a.subjectId+'&lang='+locale;
 else if(bookVMode){row.page='/books/reality-differentiation/?visual='+a.assetId+'&lang='+locale;row.scope='EXISTING_CONTEXTUAL_VISUAL_DEEP_LINK';}
 try{await page.setViewportSize({width,height:900});if(lastAsset!==a.assetId){await page.goto(origin+row.page,{waitUntil:'domcontentloaded'});lastAsset=a.assetId;lastLocale=locale;}else if(lastLocale!==locale){await page.evaluate(async l=>{const m=await import('/assets/js/i18n.js');m.setLocale(l);},locale);lastLocale=locale;}await page.locator('[data-civilization-atlas-root][data-atlas-ready="true"]').waitFor();
 if(mode==='WORLD')await page.locator('details.civ-world__deep-dive').evaluate(e=>e.open=true);
 const selector=mode==='WORLD'?'.civ-world__globe img':mode==='BOOK-VI'?'.civ-reconfig-shift-card.is-current img':'[data-atlas-primary-visual] img';
 const image=page.locator(selector+'[src="'+a.publicUrl+'"]');await image.first().evaluate(e=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});await image.first().scrollIntoViewIfNeeded();await image.first().evaluate(async e=>{await e.decode();});
 row.display=await image.first().evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {src:e.currentSrc,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight,width:r.width,height:r.height,display:s.display,visibility:s.visibility,objectFit:s.objectFit,viewport:innerWidth,locale:document.documentElement.lang};});
 row.sha256=cache.get(a.publicUrl)?.sha256;row.acceptedDigestMatches=row.sha256===a.sha256;
 row.state=row.display.naturalWidth>0&&row.display.width>0&&row.display.height>0&&row.acceptedDigestMatches?'LOADED_DECODED_VISIBLE':'FAIL';
 await page.emulateMedia({media:'print'});row.print=await image.first().evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {display:s.display,visibility:s.visibility,width:r.width,height:r.height};});await page.emulateMedia({media:'screen'});
 if(!bookVMode)await page.screenshot({path:dir+'/'+a.assetId+'-'+locale+'-'+width+'.png',fullPage:true});else if(locale==='en'&&width===390)await image.first().screenshot({path:dir+'/'+a.assetId+'-'+locale+'-'+width+'.png'});
 }catch(e){row.state='FAIL';row.error=String(e).slice(0,400);}result.rows.push(row);
 if(result.rows.length%10===0)await save();
}
}
if(bookVMode){const workers=process.argv.includes('--single')?1:3;await Promise.all(Array.from({length:workers},async(_,i)=>exercise(selected.filter((_,n)=>n%workers===i),i===0?page:await context.newPage())));}else await exercise(selected,page);
}finally{result.finished=new Date().toISOString();result.endHead=head();result.blockedRequests=blocked;await browser.close();await new Promise(r=>server.close(r));await save();}
console.log(JSON.stringify({rows:result.rows.length,passed:result.rows.filter(r=>r.state==='LOADED_DECODED_VISIBLE').length,errors:result.errors.length,headStable:result.head===result.endHead}));
