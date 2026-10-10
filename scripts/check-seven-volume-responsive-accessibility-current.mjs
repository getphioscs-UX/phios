import assert from 'node:assert/strict';
import fs from 'node:fs';
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
const home=read('index.html');assert.ok(home.includes('data-cx-en="EIGHT BOOKS"'));for(let i=1;i<=8;i++)assert.ok(home.includes(`data-cx-seven-volume-asset="BOOK-${i}-HARDCOVER"`),`home:cover-${i}`);
const books=read('books/index.html');assert.ok(books.includes('data-cx-seven-volume-asset="HERO-8V-SYSTEM"'));assert.ok(books.includes('data-cx-en="VOLUME I → VIII"'));
console.log('✓ Eight-volume current responsive/accessibility projection passed through the existing checker entry point.');
console.log('  Eight canonical routes retain viewport, canonical and skip/main semantics; seven public volumes retain their renderer, Book VIII preserves its internal-volume identity boundary; CX Home/Books/Knowledge retain the customer shell.');
