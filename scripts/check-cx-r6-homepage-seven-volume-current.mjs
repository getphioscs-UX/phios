import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const html=read('index.html');
const predecessor=read('scripts/check-cx-r6-homepage.mjs');
const assets=json('content/web-production/registries/wpr-seven-volume-r2-public-assets-v1.json');
const books=json('content/registry/successors/seven-volume-v1/books.json');

assert.ok(html.includes('data-cx-surface="HOME"'),'HOME_SURFACE_MARKER_MISSING');
assert.equal((html.match(/data-cx-home-section="H\d{2}"/g)||[]).length,9,'H01_H09_REQUIRED');
assert.ok(html.includes('data-cx-home-section="H06"'),'H06_BOOK_SECTION_REQUIRED');
assert.ok(html.includes('data-cx-en="SEVEN BOOKS"'),'SEVEN_BOOKS_EYEBROW_REQUIRED');
assert.ok(html.includes('Seven volumes. One continuous Reality cycle.'),'SEVEN_VOLUME_COPY_REQUIRED');
assert.equal(books.books.length,7,'SEVEN_BOOK_REGISTRY_REQUIRED');
for(let i=1;i<=7;i++){
  const marker=`data-cx-seven-volume-asset="BOOK-${i}-HARDCOVER"`;
  assert.equal((html.match(new RegExp(marker,'g'))||[]).length,1,`BOOK_${i}_COVER_BINDING_REQUIRED`);
  const asset=assets.assets.find(x=>x.assetId===`BOOK-${i}-HARDCOVER`);
  assert.equal(asset?.available,true,`BOOK_${i}_R2_ASSET_UNAVAILABLE`);
  assert.match(asset?.publicUrl||'',/^https:\/\//,`BOOK_${i}_R2_URL_REQUIRED`);
}
assert.ok(html.includes('/assets/customer-ui/js/seven-volume-assets.js'),'SEVEN_VOLUME_ASSET_HYDRATOR_REQUIRED');
assert.ok(html.includes('hydrateSevenVolumeAssets(document)'),'SEVEN_VOLUME_ASSET_HYDRATION_REQUIRED');
assert.ok(!html.includes('data-cx-en="FIVE BOOKS"'),'ACTIVE_FIVE_BOOKS_COPY_FORBIDDEN');
assert.ok(predecessor.includes('BOOK-5-HARDCOVER'),'HISTORICAL_CX_R6_PREDECESSOR_RETAINED');
console.log('✓ CX-R6 Homepage seven-volume current successor passed.');
console.log('  H01–H09 remain intact; H06 projects BOOK-1…BOOK-7 through the owner-confirmed R2 successor registry.');
