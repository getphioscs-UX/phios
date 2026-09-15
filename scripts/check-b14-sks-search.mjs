import fs from 'node:fs';
import assert from 'node:assert/strict';
import {searchIndex,output} from './build-b14-sks-search.mjs';
import {searchStructuredIndex,createStructuredSearch} from '../assets/js/knowledge/structured-search.js';
const rows=JSON.parse(fs.readFileSync(output));assert.deepEqual(rows,searchIndex());assert.equal(rows.length,71);
const fields=['objectId','title','aliases','objectType','bookCode','partCode','keywords'].sort();
for(const row of rows){assert.deepEqual(Object.keys(row).sort(),fields);assert.ok(row.aliases.every(x=>typeof x==='string'));assert.ok(row.keywords.every(x=>typeof x==='string'));}
assert.equal(new Set(rows.map(r=>r.objectId)).size,71);
for(const row of rows){assert.equal(searchStructuredIndex(rows,row.objectId,{bookCode:row.bookCode})[0].objectId,row.objectId);assert.ok(searchStructuredIndex(rows,row.title,{bookCode:row.bookCode}).some(x=>x.objectId===row.objectId));}
assert.equal(searchStructuredIndex(rows,'CONSTRAINT',{bookCode:'BOOK-1'})[0].objectId,'SK-B1-CONSTRAINT');
assert.deepEqual(searchStructuredIndex(rows,'差异',{bookCode:'BOOK-2'}),[]);
assert.deepEqual(searchStructuredIndex(rows,'zz-no-match-998'),[]);assert.deepEqual(searchStructuredIndex(rows,'  '),[]);
assert.deepEqual(searchStructuredIndex(rows,'差异'),searchStructuredIndex([...rows].reverse(),'差异'));
let calls=0,fail=true;const load=createStructuredSearch(async()=>{calls++;if(fail){fail=false;throw Error('offline');}return {ok:true,json:async()=>rows};});
await load(' ');assert.equal(calls,0);await assert.rejects(()=>load('差异'));await Promise.all([load('差异'),load('constraint')]);assert.equal(calls,2);
console.log('✓ W63: 71 reproducible seven-field records; bilingual identity/title search, book scope, empty/no-match behavior, deterministic order and lazy retry/cache passed.');
