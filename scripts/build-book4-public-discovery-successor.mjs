import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const OUT='content/knowledge/public/successors/book4-discovery-v1';
const BASELINE='1e1d0363c4170fa751c93ac4d8111e76bbae95b8';
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const stable=v=>JSON.stringify(v,(k,val)=>val&&typeof val==='object'&&!Array.isArray(val)?Object.fromEntries(Object.entries(val).sort(([a],[b])=>a.localeCompare(b))):val,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
const norm=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
const rel=p=>String(p||'').replace(/^\/+/, '');
const uniq=a=>[...new Set(a.filter(Boolean))];
const textOfBlock=b=>[b?.heading,b?.text,b?.statement,b?.question,b?.answer,b?.label,b?.description].filter(Boolean).join(' ');
function articleBody(a){
 const out=[];
 for(const s of a.sections||[]){
  if(s.heading)out.push(s.heading);
  for(const p of s.paragraphs||[])out.push(p);
  for(const b of s.blocks||[])out.push(textOfBlock(b));
 }
 return out.filter(Boolean).join('\n');
}
function tokens(text,locale){
 const s=norm(text);
 const latin=(s.match(/[a-z][a-z0-9-]{2,}/g)||[]).filter(x=>!new Set(['the','and','that','this','with','from','into','when','what','why','how','for','are','can','will','not','does','its','their','through','more','than','about','only','also','between','across','which','while','where','have','has','was','were']).has(x));
 const cjk=s.match(/[\u3400-\u9fff]+/g)||[]; const grams=[];
 if(locale==='zh-Hans') for(const chunk of cjk) for(let i=0;i<chunk.length-1;i++) grams.push(chunk.slice(i,i+2));
 return new Set([...latin,...grams]);
}
function partNum(code){const m=String(code||'').match(/^P(\d+)$/);return m?Number(m[1]):null}

const [nodesReg,locReg,assetsReg,booksReg,partsReg,legacyRelease,ablRelease,book4Release]=await Promise.all([
 read('content/knowledge/registry/nodes.json'),
 read('content/knowledge/registry/localized-content.json'),
 read('content/knowledge/registry/assets.json'),
 read('content/registry/successors/seven-volume-v1/books.json'),
 read('content/registry/successors/seven-volume-v1/parts.json'),
 read('content/knowledge/public/visual-article-release.json'),
 read('content/knowledge/public/abl-bilingual-release.json'),
 read('content/knowledge/public/successors/book4-publication-v1/visual-article-release.json')
]);
const bookById=new Map(booksReg.books.map(b=>[b.book_id,b]));
const bookByCode=new Map(booksReg.books.map(b=>[b.bookCode,b]));
const parts=[partsReg.part_0,...partsReg.parts];
const partByCode=new Map(parts.map(p=>[`P${p.number}`,p]));
const localeByNode=new Map(locReg.localizedContent.map(x=>[x.nodeCode,x]));
const base=[];
for(const n of nodesReg.nodes||[]){
 if(n.registryStatus!=='frozen')continue;
 for(const locale of ['zh-Hans','en']){
  if(!n.requiredPublicLanguages?.includes(locale))continue;
  const l=localeByNode.get(n.nodeCode)?.locales?.[locale];
  if(!l||l.contentStatus!=='content_reviewed'||l.reviewStatus!=='approved'||l.publicationStatus!=='published')continue;
  if(locale==='en'&&(l.terminologyReviewStatus!=='approved'||l.semanticParityStatus!=='approved'))continue;
  const a=(assetsReg.assets||[]).find(x=>x.assetCode===l.articleAssetCode&&x.assetType==='article'&&x.locale===locale&&x.contentStatus==='content_reviewed'&&x.reviewStatus==='approved'&&x.publicationStatus==='published');
  if(a?.contentPath)base.push({nodeCode:n.nodeCode,locale,path:`/${a.contentPath}`,status:'published',source:'BASE_REGISTRY'});
 }
}
const precedence=[...base,...(legacyRelease.records||[]),...(ablRelease.records||[]),...(book4Release.records||[])];
const byKey=new Map(); for(const r of precedence)if(r.status==='published')byKey.set(`${r.nodeCode}:${r.locale}`,r);
const sourceRecords=[...byKey.values()].sort((a,b)=>`${a.locale}:${a.nodeCode}`.localeCompare(`${b.locale}:${b.nodeCode}`));
const rows=[];
for(const src of sourceRecords){
 const p=rel(src.path); const a=await read(p);
 if(a.publicationStatus!=='published'||a.locale!==src.locale||a.nodeCode!==src.nodeCode)throw new Error(`DISCOVERY_SOURCE_INVALID:${p}`);
 const inferredPart=a.publicationContext?.partCode||a.provenance?.partCode||(a.nodeCode.match(/-P(\d+)-/)?.[1]?`P${a.nodeCode.match(/-P(\d+)-/)[1]}`:a.nodeCode.startsWith('KN-PREFACE-')?'P0':null);
 const part=partByCode.get(inferredPart);
 const inferredBook=a.publicationContext?.publicationBookCode||a.publicationContext?.bookCode||a.provenance?.bookCode||(part?.book==='cross-volume'?'BOOK-1':bookById.get(part?.book)?.bookCode)||null;
 const book=bookByCode.get(inferredBook);
 const title=String(a.title||'').trim(),summary=String(a.summary||a.shortAnswer||a.hero?.lead||'').trim(),question=String(a.displayQuestion||title).trim(),body=articleBody(a);
 const concepts=uniq([...(a.keyConcepts||[]),...(a.taxonomy?.tags||[]),a.taxonomy?.themeCode]);
 const searchText=uniq([title,summary,question,...concepts,body]).join('\n');
 rows.push({
  discoveryCode:`DISC-${a.nodeCode}-${a.locale.toUpperCase()}`,
  nodeCode:a.nodeCode,coveredNodeCodes:uniq(a.coveredNodeCodes||a.provenance?.coveredNodeCodes||[a.nodeCode]),locale:a.locale,
  articleCode:a.assetCode||a.articleCode||src.articleCode||null,slug:a.slug||src.slug,href:a.publicHref||src.href||`/articles/${a.slug||src.slug}`,
  title,summary,displayQuestion:question,publishedAt:a.publishedAt||null,publicationOrder:Number(a.publicationOrder||0),
  bookCode:inferredBook,bookVolume:book?.volume??null,bookTitle:book?.title||null,bookRoute:book?({'BOOK-1':'/books/reality-formation/','BOOK-2':'/books/reality-runtime/','BOOK-3':'/books/reality-continuity/','BOOK-4':'/books/reality-expansion/','BOOK-5':'/books/reality-differentiation/','BOOK-6':'/books/reality-observation/','BOOK-7':'/books/reality-navigation/'}[book.bookCode]||'/books/'):null,
  partCode:inferredPart,partTitle:part?.title||null,keyConcepts:uniq(a.keyConcepts||[]),tags:uniq(a.taxonomy?.tags||[]),themeCode:a.taxonomy?.themeCode||null,
  searchText,sourcePath:p,sourceDigest:sha(await fs.readFile(path.join(root,p),'utf8')),
  authorityClass:'PUBLISHED_PUBLIC_KNOWLEDGE'
 });
}
const rowByCode=new Map(rows.map(r=>[r.discoveryCode,r]));
const structuredTerms=r=>new Set(uniq([...r.keyConcepts,...r.tags,r.themeCode]).map(norm).filter(x=>x.length>=2));
const cross=[];
for(const r of rows){
 const st=structuredTerms(r), tt=tokens(`${r.title}\n${r.summary}`,r.locale); const candidates=[];
 for(const c of rows){
  if(c.locale!==r.locale||c.bookCode===r.bookCode||c.discoveryCode===r.discoveryCode)continue;
  const ct=structuredTerms(c), ctt=tokens(`${c.title}\n${c.summary}`,c.locale);
  let score=0; const shared=[];
  for(const x of st)if(ct.has(x)){score+=8;shared.push(x)}
  let lexical=0;for(const x of tt)if(ctt.has(x))lexical++;
  score+=Math.min(lexical,10);
  if(score>0)candidates.push({c,score,shared,lexical});
 }
 candidates.sort((a,b)=>b.score-a.score||b.lexical-a.lexical||a.c.title.localeCompare(b.c.title));
 for(const x of candidates.slice(0,3))cross.push({
  relationshipCode:`XBOOK-${r.discoveryCode}-${x.c.discoveryCode}`,
  locale:r.locale,sourceDiscoveryCode:r.discoveryCode,sourceNodeCode:r.nodeCode,sourceBookCode:r.bookCode,
  targetDiscoveryCode:x.c.discoveryCode,targetNodeCode:x.c.nodeCode,targetBookCode:x.c.bookCode,targetTitle:x.c.title,targetHref:x.c.href,
  score:x.score,sharedExplicitTerms:x.shared,lexicalOverlapCount:x.lexical,
  relationshipClass:'DISCOVERY_HEURISTIC_NOT_CANONICAL_RELATIONSHIP'
 });
}
const crossBySource=new Map(); for(const x of cross){if(!crossBySource.has(x.sourceDiscoveryCode))crossBySource.set(x.sourceDiscoveryCode,[]);crossBySource.get(x.sourceDiscoveryCode).push(x)}
const indexRows=rows.map(r=>({...r,crossBookNeighbors:(crossBySource.get(r.discoveryCode)||[]).map(x=>({targetDiscoveryCode:x.targetDiscoveryCode,bookCode:x.targetBookCode,title:x.targetTitle,href:x.targetHref,score:x.score}))}));
const bookCatalog=booksReg.books.map(book=>{
 const rs=rows.filter(r=>r.bookCode===book.bookCode); const route={'BOOK-1':'/books/reality-formation/','BOOK-2':'/books/reality-runtime/','BOOK-3':'/books/reality-continuity/','BOOK-4':'/books/reality-expansion/','BOOK-5':'/books/reality-differentiation/','BOOK-6':'/books/reality-observation/','BOOK-7':'/books/reality-navigation/'}[book.bookCode];
 return {bookCode:book.bookCode,volume:book.volume,title:book.title,subtitle:book.subtitle,canonicalRoute:route,partCodes:(book.parts||[]).map(n=>`P${n}`),hasPublishedKnowledge:rs.length>0,publishedLocaleArticleCount:rs.length,publishedArticleCount:new Set(rs.map(r=>r.slug)).size,publishedPrimaryNodeCount:new Set(rs.map(r=>r.nodeCode)).size,publishedCoveredNodeCount:new Set(rs.flatMap(r=>r.coveredNodeCodes)).size,locales:uniq(rs.map(r=>r.locale)).sort()};
});
const publishedBooks=bookCatalog.filter(b=>b.hasPublishedKnowledge);
const legacyCatalogPath='content/knowledge/public/public-knowledge-catalog.json';
const legacyRetrievalPath='content/knowledge/public/retrieval/published-retrieval-index.json';
const sevenMetaPath='content/knowledge/public/successors/seven-volume-v1/public-book-metadata.json';
const predecessorDigests={}; for(const p of [legacyCatalogPath,legacyRetrievalPath,sevenMetaPath])predecessorDigests[p]=sha(await fs.readFile(path.join(root,p),'utf8'));
const protectedPaths=['package-lock.json','content/knowledge/production-planning/plans/book4-a3-final-article-map-v1.json','content/knowledge/contracts/book-4-production-admission-authority-v1.json','content/knowledge/production-planning/publication/book4-bilingual-publication-customer-integration-v1.json','content/knowledge/public/visual-article-release.json','content/knowledge/public/retrieval/published-retrieval-index.json'];
const protectedDigests={}; for(const p of protectedPaths)protectedDigests[p]=sha(await fs.readFile(path.join(root,p),'utf8'));
const common={schemaVersion:'PHI-OS-BOOK4-PUBLIC-DISCOVERY-SUCCESSOR-v1.0.0',stage:'BOOK4-PUBLIC-SEARCH-KNOWLEDGE-CATALOG-CROSS-BOOK-DISCOVERY',baselineCommit:BASELINE,recordedAt:'2026-09-11'};
const searchIndex={...common,status:'ACTIVE_PUBLIC_SEARCH_SUCCESSOR',recordCount:indexRows.length,locales:['en','zh-Hans'],publishedBookCodes:publishedBooks.map(b=>b.bookCode),records:indexRows,policies:{publishedOnly:true,customerSafe:true,fullTextSearch:true,doesNotCreateCanonicalRelationships:true}};
const catalog={...common,status:'ACTIVE_KNOWLEDGE_CATALOG_SUCCESSOR',bookCount:7,publishedBookCount:publishedBooks.length,publishedLocaleArticleCount:rows.length,publishedArticleRouteCount:new Set(rows.map(r=>r.slug)).size,publishedPrimaryNodeCount:new Set(rows.map(r=>r.nodeCode)).size,publishedCoveredNodeCount:new Set(rows.flatMap(r=>r.coveredNodeCodes)).size,books:bookCatalog,predecessorDigests};
const crossBook={...common,status:'ACTIVE_CROSS_BOOK_DISCOVERY_SUCCESSOR',recordCount:cross.length,records:cross,authorityBoundary:{heuristicDiscoveryOnly:true,canonicalRelationshipAuthority:false,doesNotMutateNodeRelationships:true,usesOnlyPublishedCustomerSafeFields:true}};
const authority={...common,status:'PUBLIC_DISCOVERY_ADMITTED',protectedDigests,successors:{publicSearchIndex:`${OUT}/public-search-index.json`,knowledgeCatalog:`${OUT}/knowledge-catalog.json`,crossBookDiscovery:`${OUT}/cross-book-discovery.json`},counts:{searchRecords:rows.length,crossBookRelationships:cross.length,publishedBooks:publishedBooks.length,book4LocaleArticles:rows.filter(r=>r.bookCode==='BOOK-4').length,book4ArticleRoutes:new Set(rows.filter(r=>r.bookCode==='BOOK-4').map(r=>r.slug)).size,book4CoveredNodes:new Set(rows.filter(r=>r.bookCode==='BOOK-4').flatMap(r=>r.coveredNodeCodes)).size},predecessorDigests,boundaries:{legacyCatalogMutated:false,legacyRetrievalIndexMutated:false,sevenVolumeMetadataMutated:false,book4PublicationAuthorityMutated:false,searchDoesNotBecomeAnswer:true,crossBookDiscoveryNotCanonicalRelationship:true}};
await fs.mkdir(path.join(root,OUT),{recursive:true});
for(const [name,data] of [['public-search-index.json',searchIndex],['knowledge-catalog.json',catalog],['cross-book-discovery.json',crossBook],['authority.json',authority]])await fs.writeFile(path.join(root,OUT,name),stable(data),'utf8');
console.log(`Book IV public discovery successor built: ${rows.length} locale articles, ${publishedBooks.length} published books, ${cross.length} cross-book discovery edges.`);
console.log(`Book IV: ${authority.counts.book4LocaleArticles} locale articles / ${authority.counts.book4ArticleRoutes} routes / ${authority.counts.book4CoveredNodes} covered canonical nodes.`);
