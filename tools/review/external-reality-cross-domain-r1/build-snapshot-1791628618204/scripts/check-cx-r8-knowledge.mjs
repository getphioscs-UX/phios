import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAskContextAvailability,isPublicKnowledgeContextRef,resolveExplicitAskContexts} from '../functions/contextual-ask/contextual-ask-runtime.js';

const read=path=>fs.readFileSync(path,'utf8');
const json=path=>JSON.parse(read(path));
const contract=json('content/customer-experience-rebuild/authority/knowledge-customer-experience-v1.json');
const pages=[
 ['KNOWLEDGE_HOME','knowledge/index.html','/knowledge/'],
 ['KNOWLEDGE_SEARCH','search/index.html','/search/'],
 ['KNOWLEDGE_ARTICLES','articles/index.html','/articles/'],
 ['KNOWLEDGE_BOOKS','books/index.html','/books/'],
 ['KNOWLEDGE_FIGURES','figures/index.html','/figures/'],
 ['KNOWLEDGE_CONCEPTS','knowledge/concepts/index.html','/knowledge/concepts/']
];
const legacyStyles=['/assets/css/tokens.css','/assets/css/design/','/assets/css/public-experience.css','/assets/css/knowledge-release.css','/assets/css/knowledge-spine.css','/assets/css/phios-public-v2.css','/assets/css/wpr-public-production.css'];
const legacyClasses=['puxr-','public-','px2-','ks-','knowledge-page','knowledge-shell','wpr-','phi-public-'];

assert.equal(contract.phase,'CX-R8');
assert.equal(contract.baselineCommit,'d1e3311c5a931b7f49f07236aee8efe106eb7fcc');
assert.equal(contract.status,'ACCEPTANCE_CANDIDATE');
assert.equal(contract.invariants.singleCustomerShell,true);
assert.equal(contract.invariants.legacyStylesheets,0);
assert.equal(contract.invariants.legacyClassNamespaces,0);
assert.equal(contract.invariants.secondKnowledgeAuthority,false);
assert.equal(contract.invariants.secondAnswerAuthority,false);
assert.equal(contract.invariants.explicitAskContext,true);
assert.deepEqual(contract.knowledgeHome,['SEARCH','ASK','FEATURED_ARTICLES','BOOKS','FIGURES','CONCEPTS','LEARNING']);
assert.deepEqual(contract.searchResultContract,['TITLE','TYPE','BOOK_OR_NODE_CONTEXT','SUMMARY','SOURCE','RELATED']);

for(const [surface,path,route] of pages){
 assert.ok(fs.existsSync(path),`CX-R8 missing ${path}`);
 const html=read(path);
 assert.ok(html.includes(`data-cx-surface="${surface}"`),`${path} surface id drift`);
 assert.ok(html.includes(`href="${route}"`)||html.includes(`canonical" href="${route}"`),`${path} canonical route missing`);
 assert.equal((html.match(/data-cx-header/g)||[]).length,1,`${path} must mount one CX header`);
 assert.equal((html.match(/data-cx-footer/g)||[]).length,1,`${path} must mount one CX footer`);
 assert.ok(html.includes('/assets/customer-ui/js/shell.js'),`${path} missing single customer shell`);
 assert.ok(html.includes('/assets/customer-ui/surfaces/knowledge.css'),`${path} missing Knowledge surface CSS`);
 assert.ok(html.includes('/assets/customer-ui/js/surfaces/knowledge.js'),`${path} missing Knowledge renderer`);
 for(const bad of legacyStyles)assert.equal(html.includes(bad),false,`${path} legacy stylesheet leak: ${bad}`);
 for(const bad of legacyClasses)assert.equal(new RegExp(`class=["'][^"']*${bad}`).test(html),false,`${path} legacy class leak: ${bad}`);
 assert.ok((html.match(/data-cx-en=/g)||[]).length>=4,`${path} needs EN customer copy`);
 assert.ok((html.match(/data-cx-zh=/g)||[]).length>=4,`${path} needs zh-Hans customer copy`);
}

const home=read('knowledge/index.html');
for(const marker of ['Search knowledge','Ask PHI OS','FEATURED ARTICLES','Five Books','Figures','Concepts','Learning','HERO-002','ILL-001','data-cx-knowledge-featured'])assert.ok(home.includes(marker),`Knowledge Home missing ${marker}`);
assert.equal(home.includes('data-cx-surface="CONTEXTUAL_ASK"'),false,'/knowledge/ must not remain a duplicate Ask surface');
assert.ok(read('knowledge/ask/index.html').includes('data-cx-surface="CONTEXTUAL_ASK"'),'/knowledge/ask/ must remain the Ask surface');

const search=read('search/index.html');
for(const marker of ['data-cx-knowledge-search-form','data-cx-knowledge-search-results','articles, books, figures and concepts','ILL-003'])assert.ok(search.includes(marker),`Search missing ${marker}`);
const articles=read('articles/index.html');
for(const marker of ['data-cx-article-filters','name="order"','name="volume"','name="topic"','data-cx-article-grid','Latest first','ILL-002'])assert.ok(articles.includes(marker),`Articles missing ${marker}`);
const books=read('books/index.html');
for(const marker of ['data-cx-book-grid','HERO-003','VOLUME I → V'])assert.ok(books.includes(marker),`Books missing ${marker}`);
const figures=read('figures/index.html');
for(const marker of ['data-cx-figure-part','data-cx-figure-grid','VISUAL KNOWLEDGE','HERO-005','ILL-003','KNOWLEDGE SYSTEM DIAGRAMS','BOOK FIGURE LIBRARY','canonical-figure-library','FIG-001','FIG-007','FIG-008','FIG-009','FIG-010','FIG-011'])assert.ok(figures.includes(marker),`Figures missing ${marker}`);
const concepts=read('knowledge/concepts/index.html');
for(const marker of ['data-cx-concept-search-form','data-cx-concept-grid','ILL-001'])assert.ok(concepts.includes(marker),`Concepts missing ${marker}`);

const client=read('assets/customer-ui/js/surfaces/knowledge.js');
for(const marker of ['loadPublishedArticles','articleHref','loadFigureRegistry','figureHasCanonicalBookOwnership','/content/registry/books.json','/content/registry/concepts.json','Ask about this','contextType','KNOWLEDGE','contextRef','contextLabel','contextRoute','BOOK-1-HARDCOVER','BOOK-2-HARDCOVER','BOOK-3-HARDCOVER','BOOK-4-HARDCOVER','BOOK-5-HARDCOVER','source:','related:'])assert.ok(client.includes(marker),`Knowledge client missing ${marker}`);
for(const bad of ['innerHTML=location','eval(','new Function('])assert.equal(client.includes(bad),false,`Knowledge client unsafe pattern ${bad}`);

const booksRegistry=json('content/registry/books.json');
assert.equal(booksRegistry.books.length,5,'five-volume registry drift');
assert.deepEqual(booksRegistry.books.map(x=>x.bookCode),['BOOK-1','BOOK-2','BOOK-3','BOOK-4','BOOK-5']);
const conceptsRegistry=json('content/registry/concepts.json');assert.ok(conceptsRegistry.concepts.length>=40,'concept registry unexpectedly incomplete');
const figuresRegistry=json('content/registry/figures.json');assert.ok(figuresRegistry.figures.length>=16,'figure registry unexpectedly incomplete');
const visuals=json('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json');
assert.deepEqual(contract.figureVisualAssetIds,['FIG-001','FIG-007','FIG-008','FIG-009','FIG-010','FIG-011']);
for(const id of [...contract.visualRoles,...contract.bookAssetIds,...contract.figureVisualAssetIds]){const row=visuals.entries.find(x=>x.assetId===id);assert.ok(row,`visual authority missing ${id}`);assert.equal(row.available,true,`${id} not available`);assert.ok(/^https:\/\//.test(row.publicUrl),`${id} missing public delivery`)}

assert.ok(isPublicKnowledgeContextRef('ARTICLE:how-reality-enters-life-through-carriers-senses-and-cognitive-entry'));
assert.ok(isPublicKnowledgeContextRef('BOOK:BOOK-5'));
assert.ok(isPublicKnowledgeContextRef('FIGURE:figure-3a'));
assert.equal(isPublicKnowledgeContextRef('ARTICLE:../secret'),false);
const availability=buildAskContextAvailability({locale:'en',requestedContextSeed:{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-1'}});
const knowledgeAvailability=availability.find(x=>x.contextType==='KNOWLEDGE');assert.equal(knowledgeAvailability.availability,'AVAILABLE');assert.equal(knowledgeAvailability.requestedContextRef,'BOOK:BOOK-1');
const specific=resolveExplicitAskContexts({requested:[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-1'}],locale:'en'});assert.equal(specific[0].contextRef,'BOOK:BOOK-1');assert.deepEqual(specific[0].selectedRefs,['BOOK:BOOK-1']);assert.equal(specific[0].caseScope,'SOURCE');
const generic=resolveExplicitAskContexts({requested:[{contextType:'KNOWLEDGE'}],locale:'en'});assert.equal(generic[0].contextRef,'PHIOS_GOVERNED_KNOWLEDGE');assert.deepEqual(generic[0].selectedRefs,[]);
assert.throws(()=>resolveExplicitAskContexts({requested:[{contextType:'KNOWLEDGE',contextRef:'ARTICLE:../secret'}]}),/ASK_PUBLIC_KNOWLEDGE_REF_INVALID/);
assert.throws(()=>resolveExplicitAskContexts({requested:[{contextType:'PERSONAL_PAID_NARRATIVE',contextRef:'N1'}]}),/ASK_CONTEXT_NOT_AUTHORIZED/,'R8 must not weaken protected-context authorization');

const askClient=read('assets/customer-ui/js/surfaces/contextual-ask.js');
for(const marker of ['selectedKnowledgeContext','knowledgeContext','data-context-route','Selected from the page you came from','data-context-type="KNOWLEDGE"'])assert.ok(askClient.includes(marker),`Ask client explicit knowledge handoff missing ${marker}`);
const askApi=read('functions/api/customer-contextual-ask.js');
for(const marker of ['explicitKnowledgeEntryContext','entryContext','articleCode','bookCode','figureCode','relatedKnowledgeRef','isPublicKnowledgeContextRef','context.data?.resolvedAskContexts'])assert.ok(askApi.includes(marker),`Ask API knowledge bridge missing ${marker}`);
assert.equal(askApi.includes('body?.resolvedAskContexts'),false,'client must still be unable to self-authorize protected context');

const redirects=read('_redirects');
for(const line of ['/knowledge /knowledge/ 308','/search /search/ 308','/articles /articles/ 308','/articles.html /articles/ 308','/books /books/ 308','/figures /figures/ 308','/figures.html /figures/ 308','/glossary /knowledge/concepts/ 308','/glossary.html /knowledge/concepts/ 308','/knowledge/concepts /knowledge/concepts/ 308'])assert.ok(redirects.includes(line),`CX-R8 redirect missing ${line}`);
assert.ok(redirects.includes('/ask /knowledge/ask/ 308'),'Ask compatibility cutover must remain intact');

const css=read('assets/customer-ui/surfaces/knowledge.css');
assert.ok(css.includes('@layer cx.surface.knowledge'));
for(const marker of ['@media (max-width:72rem)','@media (max-width:52rem)','@media (max-width:30rem)','prefers-reduced-motion'])assert.ok(css.includes(marker),`Knowledge CSS responsive contract missing ${marker}`);
assert.equal(css.includes('!important'),false,'Knowledge CSS must not use !important');
assert.equal(css.includes('clamp('),false,'Knowledge surface must consume typography authority instead of page-specific clamp');
for(const bad of ['.puxr-','.public-','.px2-','.ks-','.wpr-'])assert.equal(css.includes(bad),false,`Knowledge CSS legacy namespace leak ${bad}`);

const shell=read('assets/customer-ui/js/shell.js');
assert.ok(shell.includes("action=\"/search/\""),'global Search must point to CX-R8 search');
assert.ok(shell.includes("action=\"/knowledge/ask/\""),'global Ask must point to contextual Ask');
assert.equal(shell.includes('second search engine or knowledge authority'),false,'customer shell must not expose internal repair language');
assert.equal(shell.includes('governed Ask runtime, not by the shell'),false,'customer shell must not expose runtime repair language');

const pkg=json('package.json');assert.equal(pkg.scripts['check:cx-knowledge'],'node scripts/check-cx-r8-knowledge.mjs && node scripts/check-cx-r9-r2-contextual-ask.mjs');assert.equal(pkg.scripts['check:cx-r8'],'npm run check:cx-r7 && npm run check:cx-knowledge');
console.log('✓ CX-R8 Knowledge Experience passed.');
console.log('  Knowledge Home, Search, Articles, Five Books, Figures and Concepts share one CX shell and consume existing knowledge authorities.');
console.log('  “Ask about this” now carries a bounded, visible public knowledge reference into /knowledge/ask/ without weakening protected-context authorization.');
