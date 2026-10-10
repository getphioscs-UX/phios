import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import './check-b14-sks-loading.mjs';
import './check-b14-sks-search.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),base='content/knowledge/structured/';
const discovery=read(base+'structured-knowledge-registry-v1.json'),backlinks=read(base+'structured-knowledge-backlinks-v1.json').backlinks,index=read(base+'structured-knowledge-search-index-v1.json'),manifest=read(base+'loading/manifest-v1.json');
const params={'BOOK-1':'mechanism','BOOK-2':'pattern','BOOK-3':'topic','BOOK-4':'expansion'};
for(const o of discovery.objects){
 const b=backlinks.find(b=>b.objectId===o.objectId);assert.ok(b,'MISSING_PROJECTION_BACKLINK');
 assert.ok(index.some(r=>r.objectId===o.objectId&&r.bookCode===o.bookCode),'UNDISCOVERABLE_OBJECT');
 const url=new URL(b.explorerHref,'https://local');assert.equal(url.origin,'https://local');assert.equal(url.searchParams.get(params[o.bookCode]),o.objectId,'DEEPLINK_OBJECT_MISMATCH');
 assert.ok(fs.existsSync('.'+url.pathname+'index.html'),'DEEPLINK_PAGE_MISSING');
 const book=read('.'+manifest.books[o.bookCode].path);assert.ok(book.objects[o.objectId],'BOOK_PROJECTION_MISSING');
 const family=read('.'+book.families[book.objects[o.objectId].family].path);const item=family.items.find(i=>i.objectId===o.objectId);assert.ok(item,'FAMILY_PROJECTION_MISSING');
 const payload=read('.'+item.path);assert.equal(payload.object.objectId,o.objectId);assert.equal(payload.backlink.explorerHref,b.explorerHref);
}
console.log(`✓ W67 static projection: all ${discovery.objects.length} objects discoverable, scoped payloads present and deep-link pages/IDs resolve.`);
// Full rendered assertions run through the same public progressive renderer used by book mounts.
if(process.argv.includes('--rendered')){const r=spawnSync(process.execPath,['scripts/check-b14-sks-loading.mjs','--browser','--all'],{stdio:'inherit'});if(r.error)throw r.error;assert.equal(r.status,0,'PROJECTION_BROWSER_FAILED');}
