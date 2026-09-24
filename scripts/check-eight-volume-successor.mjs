import assert from 'node:assert/strict';
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import {STRIPE_PRODUCT_REGISTRY,commerceEntitlements} from '../functions/pws/commercial/stripe-product-registry.js';
import {resolveCommerceBookSourceKey} from '../functions/commerce/book-product-registry.js';
import {isPublicKnowledgeContextRef} from '../functions/contextual-ask/contextual-ask-runtime.js';
const text=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(text(p));
const pointer=json('content/registry/current-book-architecture.json');
assert.equal(pointer.architecture,'eight-volume');assert.equal(pointer.historicalPredecessor.mutable,false);
const books=json(pointer.books.slice(1)).books,parts=json(pointer.parts.slice(1)).parts;
assert.equal(books.length,8);assert.equal(parts.length,15);
assert.deepEqual(books.map(b=>b.parts),[[1,2,3,4],[5,6,7],[8,9],[10,11],[12],[13],[14],[15]]);
assert.equal(books[5].title.en,'Reality Reconfiguration');assert.equal(books[5].title['zh-Hans'],'世界如何重组');
assert.equal(books[5].content_status,'completed');
const validate=new Ajv2020({strict:false}).compile(json('data/schemas/book-publication-successor.schema.json'));
for(const n of [6,7,8]){const manifest=json(`content/registry/successors/eight-volume-v1/book-${n}-manifest.json`);assert(validate(manifest),JSON.stringify(validate.errors));assert.equal(manifest.volume,n);assert.equal(manifest.bookCode,`BOOK-${n}`);}
for(const p of parts)assert(books.find(b=>b.book_id===p.book)?.parts.includes(p.number));
const previous=json('content/registry/successors/seven-volume-v1/books.json');
assert.equal(previous.books[5].title.en,'Reality Observation');assert.deepEqual(previous.books[6].parts,[14,15]);
assert.equal(json('content/registry/books.json').books.length,5);
const root='content/web-production/registries/';
const projection=json(root+'wpr-eight-volume-book-production-projection-v1.json');
const context=json(root+'wpr-eight-volume-publication-context-registry-v1.json');
const assets=json(root+'wpr-eight-volume-r2-public-assets-v1.json');
assert.equal(projection.books.length,8);
for(const b of projection.books){const html=text(b.route.slice(1)+'index.html');assert(html.includes(`data-book-id="${b.bookId}"`));assert(html.includes('/assets/js/pages/book-volume-seven.js'));assert(text('sitemap.xml').includes(b.route));}
assert.equal(context.partOwnership.find(p=>p.partNumber===13).publicationBookCode,'BOOK-6');
assert.equal(context.partOwnership.find(p=>p.partNumber===14).publicationBookCode,'BOOK-7');
assert.equal(context.partOwnership.find(p=>p.partNumber===15).publicationBookCode,'BOOK-8');
for(const n of [1,2,3,4,5])assert.equal(assets.assets.find(a=>a.assetId===`BOOK-${n}-HARDCOVER`).available,true);
for(const id of ['HERO-8V-SYSTEM',...[6,7,8].flatMap(n=>[`BOOK-${n}-HARDCOVER`,`BOOK-${n}-BRANDING`])]){
 const a=assets.assets.find(a=>a.assetId===id);
 if(!a.available){assert.equal(a.publicUrl,null);continue;}
 const proof=json(a.evidence).results.find(r=>r.key===a.objectKey);
 assert(proof?.httpImagePass);assert.equal(proof.url,a.publicUrl);assert.match(a.sha256,/^[a-f0-9]{64}$/);
 assert(!/BOOK-6-REALITY-OBSERVATION|BOOK-7-REALITY-NAVIGATION/.test(a.objectKey),'Historical numbered covers cannot represent successor books');
}
const home=text('index.html');assert(home.includes('EIGHT BOOKS'));
for(let n=1;n<=8;n++)assert.equal(home.split(`data-cx-seven-volume-asset="BOOK-${n}-HARDCOVER"`).length-1,1);
assert.equal((home.match(/data-cx-home-section="H\d{2}"/g)||[]).length,9);
for(const p of ['books/index.html','knowledge/index.html','library.html','explore/index.html'])assert(!/\bseven books\b|七册书/i.test(text(p)),p);
assert(isPublicKnowledgeContextRef('BOOK:BOOK-8'));assert(!isPublicKnowledgeContextRef('BOOK:BOOK-9'));
const products=STRIPE_PRODUCT_REGISTRY.filter(p=>p.category==='BOOK');
assert.equal(products.length,8);assert.equal(new Set(products.map(p=>p.publicationBookCode)).size,8);
const config=products.find(p=>p.publicationBookCode==='BOOK-6');assert.equal(config.productId,'COM-BOOK-CONFIGURATION');assert.equal(config.amountMinor,10900);
for(const [id,volume,code] of [['COM-BOOK-06',7,'BOOK_06_FULL_ACCESS'],['COM-BOOK-07',8,'BOOK_07_FULL_ACCESS']]){const p=products.find(p=>p.productId===id);assert.equal(p.publicationVolume,volume);assert.equal(commerceEntitlements(id)[0].entitlementCode,code);assert.notEqual(code,config.entitlementPolicy);}
const env={COMMERCE_BOOK_SOURCE_KEYS_JSON:JSON.stringify({'COM-BOOK-06':'private/observation.pdf','COM-BOOK-07':'private/navigation.pdf','COM-BOOK-CONFIGURATION':'private/configuration.pdf'})};
assert.equal(resolveCommerceBookSourceKey(env,'COM-BOOK-06'),'private/observation.pdf');assert.equal(resolveCommerceBookSourceKey(env,'COM-BOOK-07'),'private/navigation.pdf');assert.equal(resolveCommerceBookSourceKey(env,config.productId),'private/configuration.pdf');
assert.throws(()=>resolveCommerceBookSourceKey({COMMERCE_BOOK_SOURCE_KEYS_JSON:JSON.stringify({'COM-BOOK-06':'private/observation.pdf'})},config.productId),/not configured/);
const price=json('docs/qa/commerce-stripe-r1/eight-volume-price-readback.json');assert.equal(price.account,'acct_1UFr0TBEKXJyHMkK');assert.equal(price.price.livemode,false);assert.equal(price.price.id,config.qaPriceId);assert.equal(price.price.product,config.qaProductId);assert.equal(price.price.unit_amount,10900);
console.log('COM-8V-STRIPE-R1A machine PASS: eight volumes, preserved Part/Node and purchased-work identities, QA RM109 price, explicit source/visual gaps. Human acceptance and real payment E2E NOT_RUN.');
