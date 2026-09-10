import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const t=p=>fs.readFileSync(p,'utf8');
const BASE='62c3afe108b92ebc33cb07a61ad2db9ea7e6058d';
const ptr=j('content/registry/current-book-architecture.json');
assert.equal(ptr.baselineCommit,BASE);assert.equal(ptr.architecture,'seven-volume-15-part');
const books=j('content/registry/successors/seven-volume-v1/books.json');const parts=j('content/registry/successors/seven-volume-v1/parts.json');
assert.equal(books.books.length,7);assert.equal(parts.parts.length,15);assert.equal(books.architecture,'seven-volume-15-part');assert.equal(parts.architecture,'seven-volume-15-part');
const expected={1:'book-1',2:'book-1',3:'book-1',4:'book-1',5:'book-2',6:'book-2',7:'book-2',8:'book-3',9:'book-3',10:'book-4',11:'book-4',12:'book-5',13:'book-6',14:'book-7',15:'book-7'};
for(const p of parts.parts)assert.equal(p.book,expected[p.number],`P${p.number} ownership`);
assert.deepEqual(books.books.find(b=>b.bookCode==='BOOK-4').parts,[10,11]);assert.deepEqual(books.books.find(b=>b.bookCode==='BOOK-5').parts,[12]);assert.deepEqual(books.books.find(b=>b.bookCode==='BOOK-6').parts,[13]);assert.deepEqual(books.books.find(b=>b.bookCode==='BOOK-7').parts,[14,15]);
const historicalBooks=j('content/registry/books.json'),historicalParts=j('content/registry/parts.json');assert.equal(historicalBooks.architecture,'five-volume-15-part');assert.equal(historicalBooks.books.length,5);assert.equal(historicalParts.architecture,'five-volume-15-part');
const visual=j('content/web-production/registries/wpr-seven-volume-r2-public-assets-v1.json');assert.equal(visual.assets.length,15);assert.equal(visual.metadataPolicy.historicalPublicAssetsRegistryMutated,false);const hero=visual.assets.find(a=>a.assetId==='HERO-7V-SYSTEM');assert.equal(hero.width,1672);assert.equal(hero.height,941);assert.equal(hero.sha256,'92f395cdaffd9f49d813688c35648f16b3c63f7e5ce85109e8a908e70ff2725b');
for(let i=1;i<=7;i++){assert.ok(visual.assets.find(a=>a.assetId===`BOOK-${i}-HARDCOVER`));assert.ok(visual.assets.find(a=>a.assetId===`BOOK-${i}-BRANDING`));}
const pub=j('content/web-production/registries/wpr-seven-volume-book-production-projection-v1.json');assert.equal(pub.books.length,7);assert.equal(pub.books.find(b=>b.bookCode==='BOOK-5').route,'/books/reality-differentiation/');assert.equal(pub.books.find(b=>b.bookCode==='BOOK-6').route,'/books/reality-observation/');assert.equal(pub.books.find(b=>b.bookCode==='BOOK-7').route,'/books/reality-navigation/');
const ctx=j('content/web-production/registries/wpr-seven-volume-publication-context-registry-v1.json');assert.equal(ctx.partOwnership.find(x=>x.partCode==='P12').publicationBookCode,'BOOK-5');assert.equal(ctx.partOwnership.find(x=>x.partCode==='P13').publicationBookCode,'BOOK-6');assert.equal(ctx.partOwnership.find(x=>x.partCode==='P14').publicationBookCode,'BOOK-7');assert.equal(ctx.partOwnership.find(x=>x.partCode==='P15').publicationBookCode,'BOOK-7');
for(const slug of ['reality-formation','reality-runtime','reality-continuity','reality-expansion','reality-differentiation','reality-observation','reality-navigation']){const html=t(`books/${slug}/index.html`);assert.ok(html.includes('/assets/js/pages/book-volume-seven.js'));assert.ok(!html.includes('five-volume'));}
const booksHtml=t('books/index.html');assert.ok(booksHtml.includes('SEVEN BOOKS'));assert.ok(booksHtml.includes('HERO-7V-SYSTEM'));assert.ok(booksHtml.includes('VOLUME I → VII'));
const home=t('index.html');for(let i=1;i<=7;i++)assert.ok(home.includes(`BOOK-${i}-HARDCOVER`));assert.ok(home.includes('Reality Differentiation'));assert.ok(home.includes('Reality Observation'));
const knowledge=t('assets/customer-ui/js/surfaces/knowledge.js');assert.ok(knowledge.includes("'BOOK-7':'/books/reality-navigation/'"));assert.ok(knowledge.includes('loadSevenVolumeBooks'));assert.ok(knowledge.includes('hydrateSevenVolumeAssets'));const ask=t('functions/contextual-ask/contextual-ask-runtime.js');assert.ok(ask.includes('BOOK:BOOK-[1-7]'));const thesis=t('thesis.html');assert.ok(thesis.includes('/assets/js/pages/thesis-seven.js'));assert.ok(thesis.includes('Reality Observation'));assert.ok(thesis.includes('Reality Navigation'));
assert.ok(t('_redirects').includes('/books/reality-civilization/ /books/reality-expansion/ 308'));const site=t('sitemap.xml');for(const slug of ['reality-expansion','reality-differentiation','reality-observation','reality-navigation'])assert.ok(site.includes(`/books/${slug}`));
console.log('✓ 7V Architecture Successor passed.');
console.log('  P12→BOOK-5, P13→BOOK-6, P14–P15→BOOK-7; canonical Part/Node identity is preserved.');
console.log('  Public/CX routes and owner-confirmed R2 cover/branding/hero successor bindings are aligned.');
console.log('  Historical five-volume registries and public-assets authority remain untouched.');
