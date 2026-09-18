import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const routes=[
 ['reality-formation','book-1'],['reality-runtime','book-2'],['reality-continuity','book-3'],['reality-expansion','book-4'],
 ['reality-differentiation','book-5'],['reality-configuration','book-6'],['reality-observation','book-7'],['reality-navigation','book-8']
];
for(const [slug,id] of routes){
 const path=`books/${slug}/index.html`,html=read(path);
 assert.ok(html.includes('<meta name="viewport"'),`${path}:viewport`);
 assert.ok(html.includes(`<link rel="canonical" href="/books/${slug}/">`)||html.includes(`<link rel="canonical" href="https://getphios.com/books/${slug}/">`),`${path}:canonical`);
 assert.ok(html.includes(`data-book-id="${id}"`),`${path}:book-id`);
 assert.ok(html.includes('id="book-main"'),`${path}:main`);
 assert.ok(html.includes('href="#book-main"'),`${path}:skip-link`);
 assert.ok(html.includes('/assets/js/pages/book-volume-seven.js'),`${path}:seven-renderer`);
}
for(const path of ['index.html','books/index.html','knowledge/index.html']){
 const html=read(path);assert.ok(html.includes('<meta name="viewport"'),`${path}:viewport`);assert.ok(html.includes('data-cx-header'),`${path}:header`);assert.ok(html.includes('data-cx-footer'),`${path}:footer`);assert.ok(html.includes('/assets/customer-ui/'),`${path}:customer-ui`);
}
const home=read('index.html');assert.ok(home.includes('data-cx-en="EIGHT BOOKS"'));for(let i=1;i<=8;i++)assert.ok(home.includes(`data-cx-seven-volume-asset="BOOK-${i}-HARDCOVER"`),`home:cover-${i}`);
const books=read('books/index.html');assert.ok(books.includes('data-cx-seven-volume-asset="HERO-8V-SYSTEM"'));assert.ok(books.includes('data-cx-en="VOLUME I → VIII"'));
console.log('✓ Eight-volume current responsive/accessibility projection passed through the existing checker entry point.');
console.log('  Eight canonical routes retain viewport, canonical, skip/main semantics and the existing renderer; CX Home/Books/Knowledge retain the customer shell.');
