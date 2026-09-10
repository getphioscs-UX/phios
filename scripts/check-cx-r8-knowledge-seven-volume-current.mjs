import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAskContextAvailability,isPublicKnowledgeContextRef,resolveExplicitAskContexts} from '../functions/contextual-ask/contextual-ask-runtime.js';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const pages=[
 ['KNOWLEDGE_HOME','knowledge/index.html'],['KNOWLEDGE_SEARCH','search/index.html'],['KNOWLEDGE_ARTICLES','articles/index.html'],
 ['KNOWLEDGE_BOOKS','books/index.html'],['KNOWLEDGE_FIGURES','figures/index.html'],['KNOWLEDGE_CONCEPTS','knowledge/concepts/index.html']
];
for(const [surface,path] of pages){const html=read(path);assert.ok(html.includes(`data-cx-surface="${surface}"`),`${path}:surface`);assert.equal((html.match(/data-cx-header/g)||[]).length,1,`${path}:header`);assert.equal((html.match(/data-cx-footer/g)||[]).length,1,`${path}:footer`);assert.ok(html.includes('/assets/customer-ui/js/surfaces/knowledge.js'),`${path}:knowledge-runtime`);}
const home=read('knowledge/index.html');assert.ok(home.includes('Seven Books'));assert.ok(!home.includes('Five Books'));
const booksHtml=read('books/index.html');for(const m of ['SEVEN BOOKS','VOLUME I → VII','HERO-7V-SYSTEM','data-cx-book-grid'])assert.ok(booksHtml.includes(m),`books:${m}`);
const client=read('assets/customer-ui/js/surfaces/knowledge.js');for(const m of ['loadSevenVolumeBooks','loadSevenVolumeParts','hydrateSevenVolumeAssets',"'BOOK-6':'/books/reality-observation/'","'BOOK-7':'/books/reality-navigation/'"])assert.ok(client.includes(m),`client:${m}`);
const registry=json('content/registry/successors/seven-volume-v1/books.json');assert.equal(registry.architecture,'seven-volume-15-part');assert.deepEqual(registry.books.map(x=>x.bookCode),['BOOK-1','BOOK-2','BOOK-3','BOOK-4','BOOK-5','BOOK-6','BOOK-7']);
const visual=json('content/web-production/registries/wpr-seven-volume-r2-public-assets-v1.json');for(let i=1;i<=7;i++)assert.ok(visual.assets.some(x=>x.assetId===`BOOK-${i}-HARDCOVER`&&x.available===true),`cover:${i}`);
assert.ok(isPublicKnowledgeContextRef('BOOK:BOOK-1'));assert.ok(isPublicKnowledgeContextRef('BOOK:BOOK-7'));assert.equal(isPublicKnowledgeContextRef('BOOK:BOOK-8'),false);
const availability=buildAskContextAvailability({locale:'en',requestedContextSeed:{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-7'}});assert.equal(availability.find(x=>x.contextType==='KNOWLEDGE')?.availability,'AVAILABLE');
const specific=resolveExplicitAskContexts({requested:[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-7'}],locale:'en'});assert.equal(specific[0].contextRef,'BOOK:BOOK-7');assert.deepEqual(specific[0].selectedRefs,['BOOK:BOOK-7']);
assert.throws(()=>resolveExplicitAskContexts({requested:[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-8'}]}),/ASK_PUBLIC_KNOWLEDGE_REF_INVALID/);
console.log('✓ CX-R8 Knowledge seven-volume current successor passed.');
console.log('  Knowledge Home, Books, current client runtime, R2 covers and explicit Ask BOOK-1…BOOK-7 context are aligned.');
