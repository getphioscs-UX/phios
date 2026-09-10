import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const books=json('content/registry/successors/seven-volume-v1/books.json');
const parts=json('content/registry/successors/seven-volume-v1/parts.json');
const current=json('content/registry/current-book-architecture.json');
const publicMeta=json('content/knowledge/public/successors/seven-volume-v1/public-book-metadata.json');
const routes=json('content/web-production/registries/wpr-seven-volume-book-production-projection-v1.json');
const oldBooks=json('content/registry/books.json');
assert.equal(current.architecture,'seven-volume-15-part');assert.equal(books.books.length,7);assert.equal(parts.parts.length,15);assert.equal(publicMeta.records.length,7);assert.equal(routes.books.length,7);
assert.equal(oldBooks.architecture,'five-volume-15-part');assert.equal(oldBooks.books.length,5);
const expected={
 'BOOK-1':{parts:[1,2,3,4],route:'/books/reality-formation/'},'BOOK-2':{parts:[5,6,7],route:'/books/reality-runtime/'},'BOOK-3':{parts:[8,9],route:'/books/reality-continuity/'},
 'BOOK-4':{parts:[10,11],route:'/books/reality-expansion/'},'BOOK-5':{parts:[12],route:'/books/reality-differentiation/'},'BOOK-6':{parts:[13],route:'/books/reality-observation/'},'BOOK-7':{parts:[14,15],route:'/books/reality-navigation/'}
};
for(const [code,e] of Object.entries(expected)){
 const b=books.books.find(x=>x.bookCode===code);assert.ok(b,code);assert.deepEqual(b.parts,e.parts,`${code}:parts`);
 const pm=publicMeta.records.find(x=>x.bookCode===code);assert.equal(pm?.canonicalRoute,e.route,`${code}:metadata-route`);
 const pr=routes.books.find(x=>x.bookCode===code);assert.equal(pr?.route,e.route,`${code}:production-route`);
 const file=`books/${e.route.split('/').filter(Boolean).pop()}/index.html`;const html=read(file);assert.ok(html.includes(`data-book-id="book-${Number(code.slice(5))}"`),`${code}:page-id`);
 assert.ok(html.includes('/assets/js/pages/book-volume-seven.js'),`${code}:seven-renderer`);
}
for(const n of [12,13,14,15]){const p=parts.parts.find(x=>x.number===n);assert.equal(p.book,n===12?'book-5':n===13?'book-6':'book-7',`P${n}`);}
assert.ok(read('_redirects').includes('/books/reality-civilization/ /books/reality-expansion/ 308'));
console.log('✓ BOOK-W1E seven-volume current public book projection passed.');
console.log('  BOOK-1…BOOK-7 routes and P1–P15 publication ownership are current-successor aligned while the five-volume predecessor remains intact.');
