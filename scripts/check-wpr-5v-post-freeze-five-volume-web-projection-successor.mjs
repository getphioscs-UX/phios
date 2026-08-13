import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd();
const j=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const t=p=>fs.readFileSync(path.join(ROOT,p),'utf8').replace(/^\uFEFF/,'');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const BASE='1cbc50f7590759774944a577d3082c13ef59c40b';

const DRIFT_PATTERNS=[
 ['four-volume',/four-volume/i],['Four Volume',/Four\s+Volume/i],['4 volumes',/\b4\s+volumes\b/i],['四册',/(?<!第)四册/],
 ['Volume III Civilization',/Volume\s+III(?:(?!Volume\s+IV).){0,28}(?:Reality\s+)?Civilization|Civilization(?:(?!Volume\s+IV).){0,28}Volume\s+III/i],
 ['Volume IV Navigation',/Volume\s+IV(?:(?!Volume\s+V).){0,28}(?:Reality\s+)?Navigation|Navigation(?:(?!Volume\s+V).){0,28}Volume\s+IV/i],
 ['Book II P5–P9',/Book\s*II(?:(?!Book\s*III).){0,42}P?5\s*[–-]\s*P?9/i],
 ['BOOK-5 = Volume III',/BOOK-5[^\n]{0,50}Volume\s*III/i],['BOOK-3 = Volume IV',/BOOK-3[^\n]{0,50}Volume\s*IV/i],['BOOK-4 = Volume V',/BOOK-4[^\n]{0,50}Volume\s*V/i],
 ['KN-B2-P8-',/KN-B2-P8-/],['KN-B3-P10-',/KN-B3-P10-/],['KN-B4-P13-',/KN-B4-P13-/]
];
const DRIFT_EXT=new Set(['.js','.mjs','.json','.md','.html','.css','.xml','.txt','.jsonc']);
const HISTORICAL_EXACT=new Set(['content/registry/timeline.json','content/registry/m0-validation.json','content/registry/m3b-knowledge-release.json','content/registry/book-1-free-preview.json']);
const walkFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
 const full=path.join(dir,entry.name); const rel=path.relative(ROOT,full).replaceAll('\\','/');
 if(entry.isDirectory()){ if(['.git','node_modules'].includes(entry.name)) return []; return walkFiles(full); }
 return [rel];
});
const classifyDrift=(rel,patternName)=>{
 if(patternName.startsWith('KN-')) return 'INTERNAL_REFERENCE';
 if(rel.startsWith('docs/')||rel.startsWith('content/knowledge/migrations/')||rel.startsWith('content/knowledge/reconciliation/')||rel.startsWith('content/knowledge/authoring/audits/')||rel.startsWith('content/knowledge/authoring/extensions/legacy-supporting-source/')||rel.startsWith('content/web-production/audits/')||rel.startsWith('content/governance/')||HISTORICAL_EXACT.has(rel)||rel.toLowerCase().includes('four-volume')) return 'HISTORICAL_ALLOWED';
 if(path.extname(rel).toLowerCase()==='.html'||rel.startsWith('assets/js/locales/')||rel.startsWith('assets/js/pages/')||rel.startsWith('assets/js/web-production/')||rel.startsWith('assets/js/knowledge/')) return 'PUBLIC_STALE';
 if(rel==='GOVERNANCE.md'||rel==='content/registry/books.json'||rel==='content/registry/parts.json'||rel.startsWith('content/knowledge/public/')||rel.startsWith('content/web-production/registries/wpr-route-registry-v1.1.json')||rel.startsWith('content/web-production/registries/canonical-web-production-registry-v1.1.json')||rel.startsWith('content/web-production/registries/wpr-public-discovery-registry-v1.1.json')||rel.startsWith('content/web-production/registries/wpr-five-volume')||rel.startsWith('content/web-production/composition/public/')) return 'CURRENT_STALE';
 return 'INTERNAL_REFERENCE';
};
const liveDriftCounts=()=>{
 const counts={HISTORICAL_ALLOWED:0,CURRENT_STALE:0,INTERNAL_REFERENCE:0,PUBLIC_STALE:0};
 for(const rel of walkFiles(ROOT)){
  if(rel==='content/web-production/audits/wpr-five-volume-legacy-vocabulary-drift-scan-v1.json'||!DRIFT_EXT.has(path.extname(rel).toLowerCase())) continue;
  let source; try{source=t(rel);}catch{continue;}
  for(const line of source.split(/\n/)) for(const [name,rx] of DRIFT_PATTERNS) if(rx.test(line)) counts[classifyDrift(rel,name)]++;
 }
 return counts;
};

// W0: frozen WPR v1 remains untouched as authority; successor is explicit.
const freeze=j('content/web-production/freeze/wpr-v1-freeze-v1.json');
assert.equal(freeze.freezeCode,'WPR-v1.0.0-FROZEN');
assert.equal(freeze.productionRecordCountAtFreeze,38);
const audit=j('content/web-production/audits/wpr-five-volume-post-freeze-mutability-audit-v1.json');
assert.equal(audit.baselineCommit,BASE); assert.equal(audit.invariants.wprV1AuthorityRewritten,false); assert.equal(audit.invariants.wprV2Created,false);
assert.equal(audit.classes.EXACT_DIGEST_FROZEN_CHECKERS.length,31);

// W1/W5/W6/W7: five current books, exact order, current public route mapping.
const books=j('content/registry/books.json'); const parts=j('content/registry/parts.json');
assert.equal(books.architecture,'five-volume-15-part'); assert.equal(parts.architecture,'five-volume-15-part');
assert.deepEqual(books.books.map(b=>[b.bookCode,b.volume,b.title.en,b.parts]),[
 ['BOOK-1',1,'Reality Formation',[1,2,3,4]],['BOOK-2',2,'Reality Runtime',[5,6,7]],['BOOK-3',3,'Reality Continuity',[8,9]],['BOOK-4',4,'Reality Civilization',[10,11,12]],['BOOK-5',5,'Reality Navigation',[13,14,15]]
]);
books.books.forEach((b,i)=>assert.equal(b.volume,i+1));
const bookProjection=j('content/web-production/registries/wpr-five-volume-book-production-projection-v1.json');
assert.deepEqual(bookProjection.books.map(x=>x.visualTone),['Gold','Purple','Rose-Amethyst','Emerald','Cyan']);
const visualCss=t('assets/css/wpr-public-production.css'); for(const n of [1,2,3,4,5]) assert.ok(visualCss.includes(`.wpr-volume-${n}`),`WPR_VOLUME_COLOR:${n}`);

// W2/W3 canonical + compatibility routes.
const route=j('content/web-production/registries/wpr-route-registry-v1.1.json');
const canonical=['/books/reality-formation','/books/reality-runtime','/books/reality-continuity','/books/reality-civilization','/books/reality-navigation'];
assert.deepEqual(route.rules.canonicalBookRoutes,canonical);
for(const p of canonical) assert.ok(route.entries.some(e=>e.path===p),p);
for(const p of ['/book-3','/book-4','/book-5']) assert.equal(route.entries.some(e=>e.path===p),false,p);
assert.ok(route.legacyCompatibility.some(e=>e.legacyPath==='/books/reality-maintenance'&&e.targetRouteCode==='BOOK_REALITY_CONTINUITY'));
assert.ok(t('_redirects').includes('/books/reality-maintenance /books/reality-continuity 308'));

// W4: predecessor 38 remains, successor 40 and shifted BOOK-3/4 + added BOOK-5 routes.
const predecessor=j('content/web-production/registries/canonical-web-production-registry-v1.json');
const successor=j('content/web-production/registries/canonical-web-production-registry-v1.1.json');
assert.equal(predecessor.productionRecords.length,38); assert.equal(successor.productionRecords.length,40);
for(const locale of ['en','zh_Hans']){
 assert.equal(successor.productionRecords.find(r=>r.productionCode===`WPR-BOOK-3-PUBLIC-${locale}`).routeCode,'BOOK_REALITY_CONTINUITY');
 assert.equal(successor.productionRecords.find(r=>r.productionCode===`WPR-BOOK-4-PUBLIC-${locale}`).routeCode,'BOOK_REALITY_CIVILIZATION');
 const book5=successor.productionRecords.find(r=>r.productionCode===`WPR-BOOK-5-PUBLIC-${locale}`); assert.equal(book5.routeCode,'BOOK_REALITY_NAVIGATION'); assert.deepEqual(book5.assetReferences,[]); assert.equal(book5.renderPolicy.missingGovernedCoverFallsBackWithoutInventingAssetAuthority,true);
}
assert.ok(successor.productionRecords.every(r=>r.productionState==='LIMITED_PRODUCTION'));

// W5 pages: five canonical cards/routes and correct book-id projection binding.
for(const f of ['books/index.html','books/reality-formation/index.html','books/reality-runtime/index.html','books/reality-continuity/index.html','books/reality-civilization/index.html','books/reality-navigation/index.html']) assert.ok(exists(f),f);
assert.ok(t('books/reality-continuity/index.html').includes('data-book-id="book-3"'));
assert.ok(t('books/reality-civilization/index.html').includes('data-book-id="book-4"'));
assert.ok(t('books/reality-navigation/index.html').includes('data-book-id="book-5"'));

// W6/W7 public vocabulary and P1-P15 filter.
for(const f of ['index.html','library.html','books/index.html']){
 const s=t(f); assert.equal(/four-volume|Four volumes|four canonical volumes|四册/i.test(s),false,`PUBLIC_FOUR_VOLUME:${f}`);
}
const lib=t('library.html'); for(let i=1;i<=15;i++) assert.ok(lib.includes(`value="P${i}"`),`LIBRARY_PART_FILTER:P${i}`);
const publicData=t('assets/js/web-production/public-surface-data.js');
assert.ok(publicData.includes("'book-3': '/books/reality-continuity'")); assert.ok(publicData.includes("'book-5': '/books/reality-navigation'"));
assert.equal(publicData.includes("architecture !== 'four-volume-15-part'"),false);

// W8/W9: publication context is authoritative; B-prefix is never parsed for Book/Volume.
const ctx=j('content/web-production/registries/wpr-five-volume-publication-context-registry-v1.json');
assert.equal(ctx.identityPolicy.nodeBPrefixBookInferenceAllowed,false);
const p8=ctx.partOwnership.find(x=>x.partCode==='P8'); assert.equal(p8.publicationBookCode,'BOOK-3'); assert.equal(p8.publicationVolume,3); assert.equal(p8.bookTitle.en,'Reality Continuity');
const p10=ctx.partOwnership.find(x=>x.partCode==='P10'); assert.equal(p10.publicationBookCode,'BOOK-4');
const p13=ctx.partOwnership.find(x=>x.partCode==='P13'); assert.equal(p13.publicationBookCode,'BOOK-5');
assert.deepEqual(ctx.nodeOverrides.map(x=>[x.nodeCode,x.publicationPartCode]),[['KN-B2-P7-052','P11'],['KN-B2-P7-057','P10']]);
assert.ok(publicData.includes('nodeCodePrefixUsedForBookInference: false'));
assert.equal(/nodeCode.*split|nodeCode.*match.*B|KN-B.*infer/i.test(publicData),false);
const articleProjection=t('assets/js/knowledge/article-projection.js'); assert.ok(articleProjection.includes('publicationContext'));
const articleRenderer=t('assets/js/knowledge/article-renderer.js'); assert.ok(articleRenderer.includes('article.publicationContext?.bookRoute'));
const fig=t('assets/js/pages/figure-detail.js'); assert.ok(fig.includes('resolveFigurePublicationContext')); assert.equal(fig.includes('/books/reality-formation'),false);

// W10 Academy: Volume III / Reality Continuity must be visible from the five-book registry projection.
assert.ok(t('academy.html').includes('data-wpr-academy-volumes'));
assert.ok(t('assets/js/pages/academy.js').includes('loadCanonicalBooks'));
assert.equal(books.books[2].title.en,'Reality Continuity');

// W11 cross-volume reading path projection P7 -> P8 is Volume II -> III.
const reading=j('content/web-production/composition/public/reading-path-composition-v1.1.json');
assert.deepEqual(reading.transitionExample,{fromPart:'P7',toPart:'P8',fromVolume:2,toVolume:3,label:'Volume II → Volume III'});
assert.ok(publicData.includes('readingPathVolumeTransition'));

// W12 discovery successor is 17; compatibility route is not canonical/indexed.
const discovery=j('content/web-production/registries/wpr-public-discovery-registry-v1.1.json');
assert.equal(discovery.entries.length,17); assert.ok(discovery.entries.some(e=>e.path==='/books/reality-continuity'));
assert.equal(discovery.entries.some(e=>e.path==='/books/reality-maintenance'),false);
const locs=[...t('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]); assert.equal(locs.length,17); assert.ok(locs.includes('https://phios-github.pages.dev/books/reality-continuity'));

// W13 drift scan has no current/public stale residue for specified vocabulary patterns.
const drift=j('content/web-production/audits/wpr-five-volume-legacy-vocabulary-drift-scan-v1.json');
const liveDrift=liveDriftCounts(); assert.deepEqual(drift.summary,liveDrift);
assert.equal(liveDrift.CURRENT_STALE,0); assert.equal(liveDrift.PUBLIC_STALE,0);

// W14 acceptance: no WPR v2, WPR v1 authority unchanged.
const acceptance=j('content/web-production/acceptance/wpr-five-volume-production-successor-acceptance-v1.json');
assert.equal(acceptance.accepted,true); assert.equal(acceptance.result.wprV1Authority,'UNCHANGED'); assert.equal(acceptance.result.wprV2Created,false); assert.equal(acceptance.result.fiveVolumeProductionRecords,'ACCEPTED_40_RECORD_SUCCESSOR');
const pkg=j('package.json'); assert.equal(pkg.scripts['check:wpr-5v'],'node scripts/check-wpr-5v-post-freeze-five-volume-web-projection-successor.mjs'); assert.equal(pkg.scripts['check:web-five-volume-successor'],'npm run check:wpr-5v');
assert.ok(pkg.scripts.postcheck.endsWith('npm run check:web-five-volume-successor'));
console.log('✓ WPR-5V W0-W14 Post-Freeze Five-Volume Web Projection Successor passed.');
console.log('  WPR v1 remains frozen at 38 predecessor records; five-volume successor has 40 LIMITED_PRODUCTION records and 17 stable sitemap routes.');
console.log('  Canonical public books are Volume I–V; Reality Continuity is Volume III; publication context never infers Book/Volume from nodeCode B-prefix.');
