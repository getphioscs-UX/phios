import './check-founder-owner-r3.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {assertCurrentVisualSuccessor} from './lib/check-pis-visual-successor.mjs';
import {assertCurrentConsolidationLocale} from './lib/page-consolidation-successor-r1.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),registry=assertCurrentVisualSuccessor(read('content/web-production/registries/current-client-visual-registry.json'));
const pages=read('content/web/index-surfaces/pis-r1-presentation-manifest-v1.json').pages,books=read('content/web/index-surfaces/pis-r1-book-context-v1.json').books;
assert.equal(pages.length,29);assert.equal(books.length,8);
const activeCodes=new Set(),routeResults=[];
for(const p of pages){
 const source=fs.readFileSync(p.file,'utf8'),document=parseHTML(source).document;
 if(p.file==='explore/index.html'){
  assert.equal(document.querySelectorAll('script[src="/assets/js/explore-about-compat.js"]').length,1);
  assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'),'https://www.getphios.com/about/founder/');
  assert.equal(document.querySelector('a')?.getAttribute('href'),'/about/founder/');assert.equal(document.querySelectorAll('form,input,textarea,iframe').length,0);
  const d=parseHTML(fs.readFileSync('about/founder/index.html','utf8')).document;for(const id of ['founder-origin','founder-connected-reality','founder-next-step','founder-trust'])assert(d.getElementById(id),'CURRENT_FOUNDER_TARGET_REQUIRED:'+id);
  routeResults.push({file:p.file,state:'CURRENT_COMPATIBILITY_ROUTE'});continue;
 }
 if(document.querySelector('[data-consolidation-target]')){assertCurrentConsolidationLocale(p.file);routeResults.push({file:p.file,state:'CURRENT_REGISTERED_REDIRECT'});continue;}
 assert.equal(document.querySelectorAll('h1').length,1,p.file+': current one h1');
 assert(document.querySelector('main h1'),p.file+': current main title');
 assert(document.querySelector('meta[name="description"]')?.getAttribute('content'),p.file+': description');assert(document.querySelector('link[rel="canonical"]'),p.file+': canonical');assert(document.querySelector('meta[property="og:title"]'),p.file+': public title');
 assert.equal(document.querySelectorAll('script[src="/assets/js/locale-bootstrap.js"]').length,1,p.file+': single locale bootstrap');
 for(const image of document.querySelectorAll('img[data-px2-asset]')){const code=image.getAttribute('data-px2-asset');assert(registry.assets.some(a=>a.assetCode===code&&a.r2.remoteVerified),p.file+': unverified current asset '+code);activeCodes.add(code);}
 for(const image of document.querySelectorAll('.pis-visual-story img')){const code=image.getAttribute('data-px2-asset');assert(registry.assets.some(a=>a.assetCode===code&&a.r2.remoteVerified));assert.equal(image.getAttribute('alt'),'');assert.equal(image.getAttribute('aria-hidden'),'true');}
 for(const n of document.querySelectorAll('[data-pis-copy]')){assert(n.getAttribute('data-cx-en')&&n.getAttribute('data-cx-zh'));assert.doesNotMatch(n.getAttribute('data-cx-en'),/\b(?:registry|resolver|cutover|successor|fixture|checker|admission)\b/i);}
 routeResults.push({file:p.file,state:'CURRENT_PUBLIC_SURFACE'});
}
// Preserve registered identity/remote evidence without resurrecting removed figure consumers.
const bindings=read('content/web/index-surfaces/pis-r1-context-figures-v1.json').bindings;assert.equal(bindings.length,39);assert.equal(new Set(bindings.map(x=>x.code)).size,39);
for(const b of bindings){const a=registry.assets.find(x=>x.assetCode===b.code);assert(a?.r2.remoteVerified);assert.equal(a.r2.objectKey,b.key);assert(!['HERO-003','FIG-001','FIG-007','FIG-042','ICON-003'].includes(b.code));}
const evidence=read('docs/public-index-successor/pis-r1-41-remote-evidence-v1.json');assert.equal(evidence.results.length,41);const allocated=registry.assets.filter(a=>a.assetCode.startsWith('PIS-'));assert.equal(allocated.length,41);
for(const b of books){const html=fs.readFileSync(b.file,'utf8');if(b.file==='books/reality-navigation/index.html'){const m=read('content/registry/successors/eight-volume-v1/book-8-manifest.json');assert.equal(m.canonical_book_id,'book-8');assert.equal(m.content_status,'architecture-only');assert.match(html,/data-book-id="book-8"/);assert.match(html,/Not for public sale/);assert.match(html,/不对外出售/);assert.doesNotMatch(html,/data-wpr-book-volume|book-volume-seven\.js/);for(const s of ['reality-continuity','reality-expansion','reality-observation'])assert(html.includes('/books/'+s+'/'));}else{assert.match(html,/data-wpr-book-volume/);assert.match(html,/book-volume-seven\.js/);assert.match(html,/PIS BOOK CONTEXT START/);}assert.doesNotMatch(html,/price_1|prod_|\bsubscribe\b/);}
const home=parseHTML(fs.readFileSync('index.html','utf8')).document;for(const subject of ['personal','family','team','business','institution','country'])assert(home.querySelector('a[href="/subjects/'+subject+'/"]'),'CURRENT_SIX_SUBJECT_ROUTE_REQUIRED:'+subject);
const offer=fs.readFileSync('functions/pws/registry/product-offer-registry.js','utf8');assert.match(offer,/amount_minor:\s*8900,\s*currency:\s*'MYR'/);
const deleted=read('content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json');for(const x of deleted.candidates.filter(x=>x.state==='PHYSICALLY_DELETED'))assert.equal(fs.existsSync(x.path),false,'Retired page resurrected:'+x.path);
assert.doesNotMatch(fs.readFileSync('assets/customer-ui/js/public-index-copy.js','utf8'),/checkout|stripe|localStorage|\/api\//i);
const result={scope:'ACTUAL_CURRENT_PIS_ROUTES_REGISTERED_ASSETS_BOOK_AND_DENIAL_BOUNDARIES_NOT_HISTORICAL_REPLAY',routes:routeResults,books:8,registeredContextIdentities:39,registeredPISAssetIdentities:41,actuallyObservedCurrentPISCodes:[...activeCodes],historicalBeforeRead:false,sourceAuthorityChanged:false,providerCalls:0,liveBrowserAcceptance:false};
if(process.env.PHIOS_PIS_QA_OUTPUT_DIR)fs.writeFileSync(process.env.PHIOS_PIS_QA_OUTPUT_DIR+'/PRESENTATION-CURRENT-RESULT.json',JSON.stringify(result,null,2));
console.log('PASS current PIS presentation: actual29routes,39registered figure identities,41approved PIS identities,eightbooks,closed commerce,and retiredpage denial; no historical before required.');
