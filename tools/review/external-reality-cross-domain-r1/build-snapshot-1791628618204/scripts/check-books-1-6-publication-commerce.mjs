import assert from 'node:assert/strict';
import fs from 'node:fs';
import {STRIPE_PRODUCT_REGISTRY} from '../functions/pws/commercial/stripe-product-registry.js';

const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const read=p=>fs.readFileSync(p,'utf8');

const books=json('content/registry/successors/eight-volume-v1/books.json');
const publicMeta=json('content/knowledge/public/successors/eight-volume-v1/public-book-metadata.json');
const samples=json('content/web-production/registries/book-public-samples-v1.json');
const bookRoutes=read('assets/js/web-production/public-surface-data-seven.js');
const knowledge=read('assets/customer-ui/js/surfaces/knowledge.js');
const volumePage=read('assets/js/pages/book-volume-seven.js');
const booksIndex=read('books/index.html');

assert.equal(books.books.length,8);
for(const b of books.books.filter(b=>Number(b.volume)<=6)){
  assert.equal(b.status,'published',`${b.bookCode} must be published`);
  assert.equal(b.content_status,'completed',`${b.bookCode} must be completed`);
}
for(const b of books.books.filter(b=>Number(b.volume)>=7)){
  assert.notEqual(b.status,'published',`${b.bookCode} must not be prematurely published`);
}

assert.equal(publicMeta.recordCount,8);
const pm6=publicMeta.records.find(r=>r.bookCode==='BOOK-6');
assert.ok(pm6,'BOOK-6 public metadata missing');
assert.equal(pm6.status,'published');
assert.equal(pm6.canonicalRoute,'/books/reality-configuration/');
assert.deepEqual(pm6.partCodes,['P13']);
assert.equal(pm6.hasPublishedKnowledge,true);
assert.equal(pm6.publishedArticleCount,28);
assert.equal(pm6.manuscriptSectionCount,85);
assert.equal(pm6.localeRecordCount,56);
assert.equal(pm6.previewPageCount,50);

const s6=samples.books.find(b=>b.bookId==='book-6');
assert.ok(s6,'Book VI public sample record missing');
assert.equal(s6.previewPages.length,50);
for(let i=1;i<=50;i++){
  const expected=`/books/previews/book-6/page-${String(i).padStart(3,'0')}.webp`;
  assert.ok(s6.previewPages[i-1].endsWith(expected),`Book VI preview order mismatch at page ${i}`);
}

const bookProducts=STRIPE_PRODUCT_REGISTRY.filter(p=>p.category==='BOOK'&&p.active&&Number(p.publicationVolume)<=6);
assert.equal(bookProducts.length,6,'Books I-VI must each have one active commerce product');
for(let volume=1;volume<=6;volume++){
  const product=bookProducts.find(p=>Number(p.publicationVolume)===volume);
  assert.ok(product,`Missing active commerce product for volume ${volume}`);
  assert.equal(product.publicationBookCode,`BOOK-${volume}`);
}
const book6Product=bookProducts.find(p=>p.publicationBookCode==='BOOK-6');
assert.equal(book6Product.productId,'COM-BOOK-CONFIGURATION');
assert.equal(book6Product.amountMinor,10900);
assert.equal(book6Product.currency,'MYR');

assert.ok(bookRoutes.includes("'book-6':'/books/reality-configuration/'"),'Book VI canonical customer route drift');
assert.ok(knowledge.includes("'BOOK-6':'/books/reality-configuration/'"),'Knowledge Books route must use Book VI canonical route');
assert.ok(knowledge.includes("Buy complete volume")&&knowledge.includes("购买完整书籍"),'Books index must expose purchase CTA');
assert.ok(volumePage.includes("Published · complete edition available")&&volumePage.includes("已出版 · 完整版可购买"),'Volume pages must expose published sale readiness');
assert.ok(volumePage.includes("'/account/?product='+encodeURIComponent(product.productId)+'#commerce'"),'Volume purchase must target the selected commerce product');
assert.ok(booksIndex.includes('Volumes I–VI are complete and published for purchase.'));
assert.ok(booksIndex.includes('第一册至第六册已经完成并正式出版'));

console.log('Books I-VI publication + commerce gate PASS: six completed published volumes, six active catalog products, and Book VI 50-page preview registration.');
