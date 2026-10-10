import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseHTML} from 'linkedom';
import {renderArticleDocument} from '../assets/js/knowledge/article-renderer.js';
import {resolveSelectedArticle} from '../functions/contextual-ask/contextual-ask-runtime.js';
import {retrievePublishedBookSources,runKapGroundingPipeline} from '../functions/_lib/knowledge-answer-grounding.js';
import {atlasStateFromUrl} from '../assets/js/pages/civilization-atlas/atlas-url-state.js';
import {rankPublicSearch} from '../assets/customer-ui/js/search-ranking.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const requests=[];
const localFetch=async input=>{const pathname=new URL(typeof input==='string'?input:input.url,'https://assets.local').pathname;requests.push(pathname);try{return new Response(fs.readFileSync('.'+pathname),{headers:{'content-type':'application/json'}});}catch{return new Response('',{status:404});}};
globalThis.fetch=localFetch;
const env={ASSETS:{fetch:localFetch}};
const manifest=read('content/knowledge/public/successors/book5-publication-v1/visual-article-release.json');
const map=read('content/books/book-5/articles/article-production-map-v1.json');
const parity=read('content/books/book-5/articles/semantic-parity-v1.json');
for(const pair of parity.records){
 const rows=manifest.records.filter(r=>r.articleId===pair.articleId);
 const bodies=rows.map(r=>read('.'+r.path).sections[0].blocks.filter(b=>b.type==='paragraph').map(b=>b.text));
 const numbers=paragraphs=>[...new Set(paragraphs.join(' ').match(/\d+/g)||[])].sort();
 assert.deepEqual(numbers(bodies[0]),numbers(bodies[1]),pair.articleId+': numeric semantic parity');
 assert.equal(pair.humanDecision,'PENDING_HUMAN_REVIEW');
}
const bindings=read('content/knowledge/knowledge-intelligence-r2/registries/successors/book5-publication-v1/published-article-bindings-v1.json');
assert.equal(manifest.records.length,84);assert.equal(manifest.parts.length,11);
assert.equal(manifest.manuscriptContents.length,126);
for(const section of manifest.manuscriptContents){
 const row=manifest.records.find(r=>r.href===section.href&&r.locale==='zh-Hans');assert.ok(row);
 const source=read('.'+read('.'+row.path).sourceReading.path);
 assert.ok(source.pages.some(p=>p.page===section.page),'Original contents must open a real manuscript page');
}
const {document}=parseHTML('<html><body></body></html>');
for(const row of manifest.records){
 const article=read('.'+row.path),plan=map.records.find(p=>p.articleId===article.articleId&&p.locale===article.locale);
 assert.equal(article.provenance.sourcePdfSha256,map.sourcePdfSha256);
 assert.deepEqual(article.provenance.sourceSectionCodes,plan.sourceSections);
 assert.equal(article.publicationContext.bookCode,'BOOK-5');
 assert.ok(article.sections[0].blocks.filter(b=>b.type==='paragraph').length>=4);
 assert.ok(!row.sections,'Metadata must not include article bodies');
 assert.ok(fs.existsSync('articles/'+row.slug+'.html'));
 const element=renderArticleDocument(document,article,{publishedArticles:manifest.records.filter(r=>r.locale===row.locale),translate:key=>key});
 assert.equal(element.querySelector('h1').textContent,row.title);
 assert.ok(element.querySelector('details summary'));
 assert.ok(element.querySelectorAll('.knowledge-related a').length>0,'Related reading must survive shared node IDs');
 assert.ok(bindings.records.some(b=>b.slug===row.slug&&b.locale===row.locale&&b.nodeCode===row.nodeCode));
 for(const link of article.connections.relatedAtlasEntries){const state=atlasStateFromUrl(link.href);assert.notEqual(state.activeLayer,'timeline');if(link.href.includes('snapshot='))assert.ok(state.snapshotId);}
 const alignment=parity.records.find(p=>p.articleId===article.articleId);
 for(const [i,p] of article.sections[0].blocks.filter(b=>b.type==='paragraph').entries())assert.equal(hash(p.text),alignment.paragraphPairs[i][row.locale==='en'?'enSha256':'zhSha256']);
 const source=read('.'+article.sourceReading.path);assert.ok(source.pages.some(p=>p.paragraphs.length));
 const selected=await resolveSelectedArticle(env,row.slug,row.locale);assert.equal(selected.bookCode,'BOOK-5');assert.deepEqual(selected.articleContext.sourceSections,plan.sourceSections);
}
const {loadPublishedArticleBySlug,loadPublishedArticles}=await import('../assets/js/knowledge/published-content.js');
requests.length=0;
await loadPublishedArticleBySlug('book5-song-china','en');
assert.equal(requests.filter(p=>p.includes('book5-publication-v1/visual-articles/')).length,1);
requests.length=0;
const all=await loadPublishedArticles('en');assert.equal(all.filter(r=>r.articleId?.startsWith('book5-')).length,42);
assert.equal(requests.filter(p=>p.includes('book5-publication-v1/visual-articles/')).length,0,'Article index must fetch no Book V body');
const {loadPublicSearchIndex,loadPublicKnowledgeCatalog}=await import('../assets/js/knowledge/public-discovery.js');
const search=await loadPublicSearchIndex('zh-Hans');assert.equal(search.filter(r=>r.articleId?.startsWith('book5-')).length,42);
const hits=rankPublicSearch(search.map(r=>({...r,ids:[r.slug],terms:r.searchText})), '宋代');assert.ok(hits.some(r=>r.slug==='book5-song-china'));assert.ok(search.some(r=>r.type==='ATLAS'&&r.href.includes('snapshot=WS-1250')));
assert.equal((await loadPublicKnowledgeCatalog()).books.find(b=>b.bookCode==='BOOK-5').publishedArticleCount,42);
const results=[];
for(const fixture of read('content/books/book-5/maintenance/ask-fixtures-v1.json').fixtures){
 const retrieval=await retrievePublishedBookSources({env,bookCode:'BOOK-5',locale:'zh-Hans',question:fixture.question});
 const slugs=retrieval.articles.map(a=>a.slug);
 assert.ok(fixture.expectedArticles.some(slug=>slugs.includes(slug)),fixture.question+' → '+slugs.join(', '));
 assert.equal(retrieval.sources[0].sourceType,fixture.expectedSnapshots?'CIVILIZATION_ATLAS_ENTITY':'PUBLISHED_CANONICAL_ARTICLE');
 assert.ok(retrieval.sources.some(s=>s.sourceType==='COMPLETED_MANUSCRIPT'));
 for(const id of fixture.expectedSnapshots||[])assert.ok(retrieval.sources.some(s=>s.atlasEntityId===id),id);
 results.push({question:fixture.question,articles:slugs,sourceCount:retrieval.sources.length,status:'PASS'});
}
const request=new Request('https://phios.test/api/ask-phios');
const selected=await runKapGroundingPipeline({input:{question:'为什么宋代没有走向欧洲工业化？',locale:'zh-Hans',surfaceContext:{articleSlug:'book5-song-china',bookCode:'BOOK-5'}},request,env});
assert.ok(selected.groundingBundle.sources.length);
assert.ok(selected.groundingBundle.sources.every(s=>s.articleSlug==='book5-song-china'),'Explicit article isolates retrieval');
const book=await runKapGroundingPipeline({input:{question:'为什么蒙古帝国分裂以后欧亚连接加强？',locale:'zh-Hans',surfaceContext:{bookCode:'BOOK-5'}},request,env});
assert.equal(book.groundingBundle.sources[0].bookCode,'BOOK-5');
assert.ok(book.groundingBundle.sources.some(s=>s.href?.includes('case=CA-T10-01')));
const sitemap=fs.readFileSync('sitemap.xml','utf8');for(const row of manifest.records)assert.ok(sitemap.includes('https://getphios.com'+row.href));
fs.writeFileSync('content/books/book-5/maintenance/ask-fixture-results-v1.json',JSON.stringify({scope:'Actual local grounding and retrieval. Live model composition is separately reviewed.',results},null,2)+'\n');
console.log('PASS W2–W14 publication: 84 rendered bilingual bodies, 42 distinct routes, lazy source reading, source alignment, 176 knowledge bindings, search, 10 Ask retrieval fixtures, selected-article isolation, Book grounding, Atlas deep links and sitemap. Human acceptance and live model answers are not asserted.');
