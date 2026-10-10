import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadCanonicalBooks,loadCanonicalParts,loadFiveVolumePublicationContextRegistry,resolvePublicationContextForNode,bookRoute,resolveBookCover } from '../assets/js/web-production/public-surface-data.js';
const root=path.resolve(import.meta.dirname,'..');
globalThis.fetch=async url=>{
  const name=typeof url==='string'?url:url.url;
  const p=path.join(root,new URL(name,'https://phios.test').pathname);
  return new Response(fs.readFileSync(p),{headers:{'content-type':'application/json'}});
};
const books=await loadCanonicalBooks(),parts=await loadCanonicalParts(),context=await loadFiveVolumePublicationContextRegistry();
assert.equal(books.books.length,7);
assert.equal(parts.parts.length,15);
for(const [part,book,route] of [['P11','BOOK-4','expansion'],['P12','BOOK-5','differentiation'],['P13','BOOK-6','observation'],['P14','BOOK-7','navigation'],['P15','BOOK-7','navigation']]){
  const value=resolvePublicationContextForNode({nodeCode:'SOURCE-NODE',partCode:part},books,parts,context);
  assert.equal(value.publicationBookCode,book);
  assert.equal(value.bookRoute,`/books/reality-${route}/`);
}
for(const book of books.books){
  const route=bookRoute(book.book_id);
  assert.ok(fs.existsSync(path.join(root,route,'index.html')),route);
  const cover=await resolveBookCover(book.book_id);
  assert.equal(cover.renderable,true);
}
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
for(const p of walk('assets/js/locales')){
  const text=fs.readFileSync(path.join(root,p),'utf8');
  assert.doesNotMatch(text,/\bfive[ -](?:books?|volumes?)\b|(?<!第)五册/i,p);
}
const figures=fs.readFileSync(path.join(root,'figures/index.html'),'utf8');
assert.doesNotMatch(figures,/data-cx-asset="FIG-00[17]"/);
assert.match(fs.readFileSync(path.join(root,'explore/index.html'),'utf8'),/data-cx-seven-volume-asset="HERO-7V-SYSTEM"/);
assert.match(fs.readFileSync(path.join(root,'_redirects'),'utf8'),/\/book-one\.html \/books\/reality-formation\/ 308/);
console.log('✓ Seven-volume public consumers: 7 routes/covers, P11–P15 ownership and bilingual copy verified.');
