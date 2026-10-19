import {historicalPisBytes,consolidationSuccessor} from './lib/page-consolidation-successor-r1.mjs';
import {pisCurrentSurfaceSuccessor,assertPisCurrentSurface} from './lib/pis-current-surface-successor.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {assertCurrentVisualSuccessor} from './lib/check-pis-visual-successor.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const registry=assertCurrentVisualSuccessor(read('content/web-production/registries/current-client-visual-registry.json'));
const pages=read('content/web/index-surfaces/pis-r1-presentation-manifest-v1.json').pages;
const books=read('content/web/index-surfaces/pis-r1-book-context-v1.json').books;
assert.equal(pages.length,29);assert.equal(books.length,8);
const activeCodes=new Set();
const successor=pisCurrentSurfaceSuccessor();
for(const p of pages){
 const actual=parseHTML(fs.readFileSync(p.file,'utf8')).document;
 const consolidated=consolidationSuccessor()?.surfaces.some(s=>s.file===p.file);
 const historical=historicalPisBytes(p.file);
 if(p.file==='explore/index.html')assert(actual.querySelector('script[src="/assets/js/explore-about-compat.js"]'));else assertPisCurrentSurface(actual,successor.surfaces.find(s=>s.file===p.file));
 // Retained PIS presentation evidence is checked against its exact predecessor; current composition is checked above.
 const {document}=parseHTML(consolidated?historical.toString('utf8'):fs.readFileSync(p.file,'utf8')); 
 if(successor.surfaces.some(s=>s.file===p.file))for(const image of document.querySelectorAll('img[data-px2-asset]')){
  const code=image.getAttribute('data-px2-asset');
  assert.ok(registry.assets.some(a=>a.assetCode===code&&a.r2.remoteVerified),p.file+': unverified current image '+code);
  activeCodes.add(code);
 }
 assert.ok(document.querySelector('meta[name="description"]')?.getAttribute('content'));
 assert.ok(document.querySelector('link[rel="canonical"]'));
 assert.ok(document.querySelector('meta[property="og:title"]'));
 assert.ok(document.querySelector('main h1'));
 if(p.hero)activeCodes.add(p.hero);
 for(const image of document.querySelectorAll('.pis-visual-story img')){
  const code=image.getAttribute('data-px2-asset');activeCodes.add(code);
  assert.ok(registry.assets.some(a=>a.assetCode===code&&a.r2.remoteVerified));
  assert.equal(image.getAttribute('alt'),'');assert.equal(image.getAttribute('aria-hidden'),'true');
 }
 for(const node of document.querySelectorAll('[data-pis-copy]')){
  assert.ok(node.getAttribute('data-cx-en'));assert.ok(node.getAttribute('data-cx-zh'));
  assert.doesNotMatch(node.getAttribute('data-cx-en'),/\b(?:registry|resolver|cutover|successor|fixture|checker|admission)\b/i);
 }
}
const contextFigures=read('content/web/index-surfaces/pis-r1-context-figures-v1.json').bindings;
assert.equal(contextFigures.length,39);assert.equal(new Set(contextFigures.map(x=>x.code)).size,39);
for(const binding of contextFigures){
 const asset=registry.assets.find(x=>x.assetCode===binding.code);assert.ok(asset?.r2.remoteVerified);assert.equal(asset.r2.objectKey,binding.key);
 assert.ok(!['HERO-003','FIG-001','FIG-007','FIG-042','ICON-003'].includes(binding.code));
 if(binding.file==='academy/index.html'){
  const step=read('content/web/index-surfaces/pis-current-surface-followup-successor-v4.json').additionalAcademy;
  const {createHash}=await import('node:crypto');const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  assert.equal(step.file,binding.file);assert.equal(hash(step.previousPath),step.previousSha256);assert.equal(hash(step.file),step.sha256);
  assert.deepEqual(step.retiredFigureCodes,['FIG-037','FIG-038','FIG-039','FIG-040','FIG-041']);assert(step.retiredFigureCodes.includes(binding.code));
  assert(parseHTML(fs.readFileSync(step.previousPath,'utf8')).document.querySelector('[data-pis-context-figures] [data-px2-asset="'+binding.code+'"]'));
  assert(parseHTML(fs.readFileSync(step.file,'utf8')).document.querySelector('[data-r42-academy-figures]'));continue;
 }
 const actualBinding=parseHTML(fs.readFileSync(binding.file,'utf8')).document;const d=parseHTML(historicalPisBytes(binding.file).toString('utf8')).document;const current=successor.surfaces.find(s=>s.file===binding.file);if(current?.retiredContextFigures.includes(binding.code)){assert.equal(actualBinding.querySelector('[data-pis-context-figures] [data-px2-asset="'+binding.code+'"]'),null);assertPisCurrentSurface(actualBinding,current);continue;}assert.ok(d.querySelector('[data-pis-context-figures] [data-px2-asset="'+binding.code+'"]'));
 assert.ok(d.querySelector('script[src="/assets/customer-ui/js/public-index-figures.js"]'));
}
const evidence=read('docs/public-index-successor/pis-r1-41-remote-evidence-v1.json');
const allocation=registry.assets.filter(a=>a.assetCode.startsWith('PIS-')).map(a=>{
 const duplicate=registry.assets.find(b=>b.assetCode!==a.assetCode&&activeCodes.has(b.assetCode)&&b.r2?.sha256===a.r2.sha256);
 const state=activeCodes.has(a.assetCode)?'PIS_PREDECESSOR_CONSUMER_PRESERVED_AS_EVIDENCE':duplicate?'IDENTICAL_BYTES_ALTERNATE_PATH':'FUNCTIONAL_RESERVED';
 if(state==='FUNCTIONAL_RESERVED')assert.ok(['PIS-008','PIS-029','PIS-030','PIS-031','PIS-032','PIS-033'].includes(a.assetCode),'Unallocated accepted image: '+a.assetCode);
 return {assetCode:a.assetCode,key:a.r2.objectKey,state,sameBytesAs:duplicate?.assetCode||null,reason:state==='FUNCTIONAL_RESERVED'?'Preserve existing canonical header logo and real runtime status icons. Do not display a status merely to use an asset.':state==='IDENTICAL_BYTES_ALTERNATE_PATH'?'Same actual-byte SHA256; display one copy only.':'Historical PIS manifest binding preserved; current successor composition is validated separately.',humanImageAcceptance:'ALREADY_ACCEPTED',productionVerified:false};
});
assert.equal(evidence.results.length,41);assert.equal(allocation.length,41);
for(const b of books){
 const html=fs.readFileSync(b.file,'utf8');
 if(b.file==='books/reality-navigation/index.html'){
  const manifest=read('content/registry/successors/eight-volume-v1/book-8-manifest.json');
  assert.equal(manifest.canonical_book_id,'book-8');assert.equal(manifest.content_status,'architecture-only');
  assert.match(html,/data-book-id="book-8"/);
  assert.match(html,/Not for public sale/);assert.match(html,/不对外出售/);
  assert.doesNotMatch(html,/data-wpr-book-volume|book-volume-seven\.js/);
  for(const route of ['reality-continuity','reality-expansion','reality-observation'])assert.ok(html.includes(`/books/${route}/`));
 }else{
  assert.match(html,/data-wpr-book-volume/);assert.match(html,/book-volume-seven\.js/);
  assert.match(html,/PIS BOOK CONTEXT START/);
 }
 assert.doesNotMatch(html,/price_1|prod_|\bsubscribe\b/);
}
const home=parseHTML(historicalPisBytes('index.html').toString('utf8')).document;
assert.equal(home.querySelectorAll('[data-cx-home-section="H03"] .cx-home-beginning').length,6);
assert.equal(home.querySelectorAll('[data-cx-seven-volume-asset$="HARDCOVER"]').length,8);
const offer=fs.readFileSync('functions/pws/registry/product-offer-registry.js','utf8');
assert.match(offer,/amount_minor:\s*8900,\s*currency:\s*'MYR'/);
const deleted=read('content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json');
for(const item of deleted.candidates.filter(x=>x.state==='PHYSICALLY_DELETED'))assert.equal(fs.existsSync(item.path),false,`Retired page resurrected: ${item.path}`);
const bridge=fs.readFileSync('assets/customer-ui/js/public-index-copy.js','utf8');
assert.doesNotMatch(bridge,/checkout|stripe|localStorage|\/api\//i);
fs.writeFileSync('docs/public-index-successor/pis-r1-41-consumption-audit-v1.json',JSON.stringify({scope:'HISTORICAL_PIS_BINDINGS_WITH_CURRENT_SUCCESSOR_VALIDATION_NOT_LIVE_IMAGE_CENSUS',assets:allocation},null,2)+'\n');
console.log('PASS PIS presentation: historical 29-page/eight-book bindings preserved; current successors, redirects, commerce and retired-page boundaries verified. Live browser acceptance remains separate.');
