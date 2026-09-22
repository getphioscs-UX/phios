import fs from 'node:fs';
import assert from 'node:assert/strict';
import {BOOK_ONE_PRODUCT,BOOK_PRODUCTS,resolveBookOneSourceKey} from '../functions/commerce/book-product-registry.js';
const config=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
export function validatePreview(preview){
 assert.deepEqual(preview.ai,{binding:'AI'});
 assert.deepEqual(preview.d1_databases,[{binding:'RUNTIME_DB',database_name:'phios-runtime-sandbox',database_id:'c2c6e313-9bc8-4fd4-89b1-36f3d764dad8',migrations_dir:'db/migrations'}]);
 assert.deepEqual(preview.r2_buckets,[{binding:'BOOKS',bucket_name:'phios-private-books-sandbox'},{binding:'PRIVATE_REPORTS',bucket_name:'phios-private-reports-sandbox'}]);
 assert.equal(preview.vars.PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED,'false');
 assert.equal(preview.vars.PHIOS_ENVIRONMENT,'qa');
 assert.equal(preview.vars.BOOK_ONE_SOURCE_KEY,'books/book-one/PHI-OS-Book-I-v2');
 assert.equal(preview.vars.PHIOS_BOOK_ONE_SALES_ENABLED,'false');
 assert.doesNotMatch(JSON.stringify(preview),/phios-runtime-production|phios-private-manuscripts|"phios-private-books"|sk_live_|rk_live_/);
 assert.ok(Object.keys(preview.vars).every(k=>! /SECRET|TOKEN|API_KEY/.test(k)),'no committed credentials');
}
validatePreview(config.env.preview);
for(const mutate of [p=>p.d1_databases[0].database_name='phios-runtime-production',p=>p.r2_buckets[0].bucket_name='phios-private-books',p=>p.vars.STRIPE_SECRET_KEY='sk_live_fixture',p=>p.r2_buckets.push({binding:'MANUSCRIPTS',bucket_name:'phios-private-manuscripts'})]){const p=structuredClone(config.env.preview);mutate(p);assert.throws(()=>validatePreview(p));}
assert.deepEqual(config.d1_databases,[{binding:'RUNTIME_DB',database_name:'phios-runtime-production',database_id:'073639fa-01e4-4868-af10-6ed032637dab',migrations_dir:'db/migrations'}]);
assert.deepEqual(config.r2_buckets,[{binding:'MANUSCRIPTS',bucket_name:'phios-private-manuscripts'},{binding:'PRIVATE_REPORTS',bucket_name:'phios-private-reports'}]);assert.deepEqual(config.ai,{binding:'AI'});
assert.equal(resolveBookOneSourceKey({}),'private/books/book-one/zh-Hans/book-one-v1.pdf');
assert.equal(resolveBookOneSourceKey({BOOK_ONE_SOURCE_KEY:'  '}),BOOK_ONE_PRODUCT.sourceObjectKey);
assert.equal(resolveBookOneSourceKey(config.env.preview.vars),'books/book-one/PHI-OS-Book-I-v2');
assert.equal(BOOK_PRODUCTS.length,1);assert.equal(BOOK_ONE_PRODUCT.currency,'MYR');assert.equal(BOOK_ONE_PRODUCT.amountMinor,8900);
console.log('PASS: Pages Preview isolation, unchanged production resources, one Book I source authority, MYR 89.00 and negative production-binding guards. Offline only.');
