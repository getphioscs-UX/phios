import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {historicalPisBytes} from './lib/page-consolidation-successor-r1.mjs';
import {assertCurrentVisualSuccessor} from './lib/check-pis-visual-successor.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const routes=[
 ['reality-formation','book-1'],['reality-runtime','book-2'],['reality-continuity','book-3'],['reality-expansion','book-4'],
 ['reality-differentiation','book-5'],['reality-reconfiguration','book-6'],['reality-observation','book-7'],['reality-navigation','book-8']
];
for(const [slug,id] of routes){
 const path=`books/${slug}/index.html`,html=read(path);
 assert.ok(html.includes('<meta name="viewport"'),`${path}:viewport`);
 assert.ok(html.includes(`<link rel="canonical" href="/books/${slug}/">`)||html.includes(`<link rel="canonical" href="https://getphios.com/books/${slug}/">`),`${path}:canonical`);
 assert.ok(html.includes(`data-book-id="${id}"`),`${path}:book-id`);
 assert.ok(html.includes('id="book-main"'),`${path}:main`);
 assert.ok(html.includes('href="#book-main"'),`${path}:skip-link`);
 if(id==='book-8'){
  const manifest=JSON.parse(read('content/registry/successors/eight-volume-v1/book-8-manifest.json'));
  assert.equal(manifest.content_status,'architecture-only');
  assert.ok(html.includes('Not for public sale')&&html.includes('不对外出售'),`${path}:internal-volume boundary`);
  assert.ok(!html.includes('/assets/js/pages/book-volume-seven.js'),`${path}:no public full-text renderer`);
  assert.ok(html.includes('/assets/js/public-shell.js'),`${path}:public identity shell`);
 }else assert.ok(html.includes('/assets/js/pages/book-volume-seven.js'),`${path}:seven-renderer`);
}
for(const path of ['index.html','books/index.html','knowledge/index.html']){
 const html=read(path);assert.ok(html.includes('<meta name="viewport"'),`${path}:viewport`);assert.ok(html.includes('data-cx-header'),`${path}:header`);assert.ok(html.includes('data-cx-footer'),`${path}:footer`);assert.ok(html.includes('/assets/customer-ui/'),`${path}:customer-ui`);
}
// The admitted consolidated homepage is checked by the eight-volume successor;
// retain cover-grid assertions against its digest-verified predecessor.
const home=historicalPisBytes('index.html').toString('utf8');assert.ok(home.includes('data-cx-en="EIGHT BOOKS"'));for(let i=1;i<=8;i++)assert.ok(home.includes(`data-cx-seven-volume-asset="BOOK-${i}-HARDCOVER"`),`home:cover-${i}`);
export function assertBooksResponsivePresentation(books){
if(books.includes('data-approved-visual="PHIOS-HERO-EIGHT-VOLUME-SYSTEM-v1.webp"')){
 const document=parseHTML(books).document;
 const heroes=document.querySelectorAll('main figure[data-vr2-role="HERO"] img[data-approved-visual="PHIOS-HERO-EIGHT-VOLUME-SYSTEM-v1.webp"]');
 assert.equal(heroes.length,1,'Books must consume one eight-volume system hero');
 assert.equal(heroes[0].getAttribute('src'),'https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/hero/PHIOS-HERO-EIGHT-VOLUME-SYSTEM-v1.webp');
 assert.ok(heroes[0].getAttribute('alt')?.trim(),'Books hero alternative text required');
 assert.equal(heroes[0].getAttribute('loading'),'eager');
 assert.ok(Number(heroes[0].getAttribute('width'))>0&&Number(heroes[0].getAttribute('height'))>0);
 assert.ok(books.includes('data-cx-en="EIGHT BOOKS"'));
}else if(parseHTML(books).document.body?.getAttribute('data-pis-hero')==='PIS-039'){
 // The registered PIS landing hero is hydrated from readable foreground HTML;
 // it does not use either historical static hero-image marker above/below.
 const {document}=parseHTML(books);
 const bindings=JSON.parse(read('content/web/index-surfaces/pis-r1-presentation-manifest-v1.json')).pages.filter(p=>p.file==='books/index.html');
 assert.equal(bindings.length,1,'Books requires one registered PIS presentation binding');
 assert.equal(bindings[0].hero,'PIS-039','Books must retain its registered PIS hero');
 const heroes=document.querySelectorAll('main section.cx-knowledge-hero--books[data-vr2-role="HERO"]');
 assert.equal(heroes.length,1,'Books requires one current PIS hero section');
 const foreground=heroes[0].querySelector('[data-pis-hero-content]');
 assert.ok(foreground,'Books PIS hero requires an explicit foreground container');
 assert.ok(!foreground.closest('[hidden],[aria-hidden="true"]'),'Books hero foreground must remain accessible');
 assert.equal(document.querySelectorAll('main h1').length,1,'Books requires one main heading');
 const heading=foreground.querySelector('h1');
 assert.ok(heading?.textContent.trim(),'Books hero requires a readable heading');
 assert.ok(heading.getAttribute('data-cx-en')?.trim()&&heading.getAttribute('data-cx-zh')?.trim(),'Books hero requires both heading locales');
 assert.ok(!foreground.querySelector('form,.cx-card,.account-card,[data-cx-result],[data-profile-result]'),'Books foreground must remain compatible with the existing PIS renderer');
 assert.ok(document.querySelector('script[type="module"][src="/assets/customer-ui/js/public-index-copy.js"]'),'Books requires the existing PIS hero hydrator');
 assert.ok(document.querySelector('link[rel="stylesheet"][href="/assets/customer-ui/surfaces/public-index.css"]'),'Books requires responsive PIS hero styling');
 const registry=assertCurrentVisualSuccessor(JSON.parse(read('content/web-production/registries/current-client-visual-registry.json')));
 const assets=registry.assets.filter(a=>a.assetCode==='PIS-039');
 assert.equal(assets.length,1,'Books PIS hero must resolve one registered asset');
 assert.equal(assets[0].r2.remoteVerified,true,'Books PIS hero must retain verified delivery evidence');
 assert.equal(assets[0].r2.objectKey,'images/illustrations/PHIOS-ILLUSTRATION-READING-PATH-LANDSCAPE-v1.webp');
 assert.ok(books.includes('data-cx-en="EIGHT BOOKS"'));
 assert.ok(books.includes('data-cx-en="VOLUME I → VIII"'));
}else{assert.ok(books.includes('data-cx-seven-volume-asset="HERO-8V-SYSTEM"'));assert.ok(books.includes('data-cx-en="VOLUME I → VIII"'));}
}
assertBooksResponsivePresentation(read('books/index.html'));
console.log('✓ Eight-volume current responsive/accessibility projection passed through the existing checker entry point.');
console.log('  Eight canonical routes retain viewport, canonical and skip/main semantics; seven public volumes retain their renderer, Book VIII preserves its internal-volume identity boundary; CX Home/Books/Knowledge retain the customer shell.');
