import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const routes=[
 ['reality-formation','book-1'],['reality-runtime','book-2'],['reality-continuity','book-3'],['reality-expansion','book-4'],
 ['reality-differentiation','book-5'],['reality-observation','book-6'],['reality-navigation','book-7']
];
for(const [slug,id] of routes){
 const path=`books/${slug}/index.html`,html=read(path);
 assert.ok(html.includes('<meta name="viewport"'),`${path}:viewport`);
 assert.ok(html.includes(`<link rel="canonical" href="/books/${slug}/">`),`${path}:canonical`);
 assert.ok(html.includes(`data-book-id="${id}"`),`${path}:book-id`);
 assert.ok(html.includes('id="book-main"'),`${path}:main`);
 assert.ok(html.includes('href="#book-main"'),`${path}:skip-link`);
 assert.ok(html.includes('/assets/js/pages/book-volume-seven.js'),`${path}:seven-renderer`);
}
for(const path of ['index.html','books/index.html','knowledge/index.html']){
 const html=read(path);assert.ok(html.includes('<meta name="viewport"'),`${path}:viewport`);assert.ok(html.includes('data-cx-header'),`${path}:header`);assert.ok(html.includes('data-cx-footer'),`${path}:footer`);assert.ok(html.includes('/assets/customer-ui/'),`${path}:customer-ui`);
}
const home=read('index.html');assert.ok(home.includes('data-cx-en="SEVEN BOOKS"'));for(let i=1;i<=7;i++)assert.ok(home.includes(`data-cx-seven-volume-asset="BOOK-${i}-HARDCOVER"`),`home:cover-${i}`);
const books=read('books/index.html');assert.ok(books.includes('data-cx-seven-volume-asset="HERO-7V-SYSTEM"'));assert.ok(books.includes('data-cx-en="VOLUME I → VII"'));
console.log('✓ Seven-volume current responsive/accessibility projection passed.');
console.log('  Seven canonical book routes retain viewport, canonical, skip/main semantics and the seven-volume renderer; CX Home/Books/Knowledge retain the customer shell.');
