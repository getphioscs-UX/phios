import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rel='content/web-production/registries/wpr-eight-volume-book-production-projection-v1.json';
const target=path.join(root,rel);
const original=fs.readFileSync(target,'utf8');
const registry=JSON.parse(original.replace(/^\uFEFF/,''));
const book=registry.books.find(b=>b.bookCode==='BOOK-6');
assert(book&&book.bookId==='book-6'&&book.volume===6,'BOOK-6 identity mismatch');
assert.deepEqual(book.parts,['P13']);
const oldRoute='/books/reality-configuration/';
const newRoute='/books/reality-reconfiguration/';
assert([oldRoute,newRoute].includes(book.route),'Unexpected route; no write');
const html=fs.readFileSync(path.join(root,'books/reality-reconfiguration/index.html'),'utf8');
assert(html.includes('data-book-id="book-6"'),'Target page identity mismatch');
assert(html.includes('/assets/js/pages/book-volume-seven.js'),'Target renderer missing');
const sitemapFile=path.join(root,'sitemap.xml');
const sitemap=fs.readFileSync(sitemapFile,'utf8');
assert(sitemap.includes(newRoute)||sitemap.includes(oldRoute),'Both BOOK-6 routes absent from sitemap; no write');
const sitemapUpdated=sitemap.replaceAll(oldRoute,newRoute);
if(book.route===oldRoute){
 const updated=original.replaceAll('"'+oldRoute+'"','"'+newRoute+'"');
 const verify=JSON.parse(updated.replace(/^\uFEFF/,''));
 const before=structuredClone(registry),after=structuredClone(verify);
 before.books.find(b=>b.bookCode==='BOOK-6').route=newRoute;
 assert.deepEqual(after,before,'Unexpected registry changes');
 fs.writeFileSync(target+'.route-fix-backup',original);
 fs.writeFileSync(target,updated,'utf8');
 console.log('FIXED '+rel+': '+oldRoute+' -> '+newRoute);
}else console.log('UNCHANGED: BOOK-6 canonical route already correct.');
if(sitemapUpdated!==sitemap){
 fs.writeFileSync(sitemapFile+'.route-fix-backup',sitemap);
 fs.writeFileSync(sitemapFile,sitemapUpdated,'utf8');
 console.log('FIXED sitemap.xml: BOOK-6 canonical route.');
}
console.log('PASS BOOK-6 route: existing page, book-6 identity, renderer and sitemap agree. Run the original npm checker next.');
