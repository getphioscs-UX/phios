import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const letters='ABCDEFGH'.split('');
const ids=letters.map(x=>'FIG_13'+x);
const expectedPath=x=>'images/figures/books/book-6/13'+x+'.webp';
const figures=read('content/registry/figures.json');
const publicAssets=read('content/registry/public-assets.json');
const visuals=read('content/civilization-atlas/reconfiguration/book-vi-visual-asset-status-v1.json');
const books=read('content/registry/successors/eight-volume-v1/books.json');
const parts=read('content/registry/successors/eight-volume-v1/parts.json');
const browser=read('content/civilization-atlas/reconfiguration/book-vi-atlas-browser-acceptance-v2.json');
const human=read('content/civilization-atlas/reconfiguration/book-vi-atlas-human-acceptance-v2.json');
const surface=fs.readFileSync('assets/js/web-production/public-surface-data.js','utf8');
const detail=fs.readFileSync('assets/js/pages/figure-detail.js','utf8');
assert.equal(books.architecture,'eight-volume');
assert.equal(books.books.find(x=>x.book_id==='book-6')?.title?.en,'Reality Reconfiguration');
assert.equal(parts.parts.find(x=>x.number===13)?.book,'book-6');
for(const [i,id] of ids.entries()){
 const letter=letters[i];
 const f=figures.figures.find(x=>x.figure_id===id);
 assert.ok(f,id+' missing from canonical figure registry');
 assert.equal(f.book,6); assert.equal(f.part,13); assert.equal(f.asset_code,id);
 const a=publicAssets.assets.find(x=>x.asset_code===id);
 assert.ok(a,id+' missing from public asset resolver registry');
 assert.equal(a.object_key,expectedPath(letter));
 const v=visuals.assets.find(x=>x.assetId===id);
 assert.ok(v,id+' missing from Book VI visual status');
 assert.equal(v.expectedR2Path,expectedPath(letter));
 assert.ok(['PRESENT','MISSING','UNVERIFIED'].includes(v.status));
}
assert.match(surface,/'book-6': '\/books\/reality-configuration\/'/);
assert.match(surface,/'book-7': '\/books\/reality-observation\/'/);
assert.match(surface,/'book-8': '\/books\/reality-navigation\/'/);
assert.match(detail,/resolveCanonicalVisual/);
assert.match(detail,/figure\?\.asset_code/);
const cutover=process.argv.includes('--cutover');
if(cutover){
 assert.equal(visuals.assets.length,23);
 assert.equal(visuals.assets.filter(x=>x.status==='PRESENT').length,23,'all 23 core visuals must be live-probe PRESENT');
 assert.equal(browser.status,'ACCEPTED','real browser acceptance required');
 assert.equal(human.status,'ACCEPTED','human acceptance required');
 console.log('PASS: B6-WEB-F final cutover gate.');
}else{
 assert.notEqual(browser.status,'ACCEPTED','readiness must not fabricate browser acceptance');
 assert.notEqual(human.status,'ACCEPTED','readiness must not fabricate human acceptance');
 console.log('PASS: B6-WEB-F readiness. Figure keys and eight-volume figure route are reconciled; live R2, real browser and human gates remain explicit.');
}
