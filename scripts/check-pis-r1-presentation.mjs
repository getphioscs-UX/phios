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
 const {document}=parseHTML(fs.readFileSync(p.file,'utf8'));
 assertPisCurrentSurface(document,successor.surfaces.find(s=>s.file===p.file));
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
 const d=parseHTML(fs.readFileSync(binding.file,'utf8')).document;const current=successor.surfaces.find(s=>s.file===binding.file);if(current?.retiredContextFigures.includes(binding.code)){assert.equal(d.querySelector('[data-pis-context-figures] [data-px2-asset="'+binding.code+'"]'),null);assertPisCurrentSurface(d,current);continue;}assert.ok(d.querySelector('[data-pis-context-figures] [data-px2-asset="'+binding.code+'"]'));
 assert.ok(d.querySelector('script[src="/assets/customer-ui/js/public-index-figures.js"]'));
}
const evidence=read('docs/public-index-successor/pis-r1-41-remote-evidence-v1.json');
const allocation=registry.assets.filter(a=>a.assetCode.startsWith('PIS-')).map(a=>{
 const duplicate=registry.assets.find(b=>b.assetCode!==a.assetCode&&activeCodes.has(b.assetCode)&&b.r2?.sha256===a.r2.sha256);
 const state=activeCodes.has(a.assetCode)?'CURRENT_LOCAL_CONSUMER':duplicate?'IDENTICAL_BYTES_ALTERNATE_PATH':'FUNCTIONAL_RESERVED';
 if(state==='FUNCTIONAL_RESERVED')assert.ok(['PIS-008','PIS-029','PIS-030','PIS-031','PIS-032','PIS-033'].includes(a.assetCode),'Unallocated accepted image: '+a.assetCode);
 return {assetCode:a.assetCode,key:a.r2.objectKey,state,sameBytesAs:duplicate?.assetCode||null,reason:state==='FUNCTIONAL_RESERVED'?'Preserve existing canonical header logo and real runtime status icons. Do not display a status merely to use an asset.':state==='IDENTICAL_BYTES_ALTERNATE_PATH'?'Same actual-byte SHA256; display one copy only.':'Presentation manifest and existing resolver bind this object.',humanImageAcceptance:'ALREADY_ACCEPTED',productionVerified:false};
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
const home=parseHTML(fs.readFileSync('index.html','utf8')).document;
assert.equal(home.querySelectorAll('[data-cx-home-section="H03"] .cx-home-beginning').length,6);
assert.equal(home.querySelectorAll('[data-cx-seven-volume-asset$="HARDCOVER"]').length,8);
const offer=fs.readFileSync('functions/pws/registry/product-offer-registry.js','utf8');
assert.match(offer,/amount_minor:\s*8900,\s*currency:\s*'MYR'/);
const deleted=read('content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json');
for(const item of deleted.candidates.filter(x=>x.state==='PHYSICALLY_DELETED'))assert.equal(fs.existsSync(item.path),false,`Retired page resurrected: ${item.path}`);
const bridge=fs.readFileSync('assets/customer-ui/js/public-index-copy.js','utf8');
assert.doesNotMatch(bridge,/checkout|stripe|localStorage|\/api\//i);
fs.writeFileSync('docs/public-index-successor/pis-r1-41-consumption-audit-v1.json',JSON.stringify({scope:'LOCAL_SOURCE_BINDING_NOT_DEPLOYED_BROWSER_PROOF',assets:allocation},null,2)+'\n');
console.log('PASS PIS presentation: 29 entry pages + eight book orientations; bilingual editorial copy, metadata, 41 verified image dispositions, six home entries, commerce and retired-page boundaries.');
