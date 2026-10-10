import assert from 'node:assert/strict';
import fs from 'node:fs';

const base=String(process.env.PHIOS_ATLAS_LIVE_BASE_URL||'https://getphios.com').replace(/\/$/,'');
if(!/^https:\/\//.test(base)) throw new Error('PHIOS_ATLAS_LIVE_BASE_URL_HTTPS_REQUIRED');

const map=JSON.parse(fs.readFileSync('content/books/book-6/articles/article-production-map-v1.json','utf8'));
const get=async(path,{accept='text/html,application/json,*/*',timeout=20000}={})=>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(base+path,{headers:{accept},redirect:'follow',signal:controller.signal});
    const text=await response.text();
    return {response,text};
  } finally { clearTimeout(timer); }
};

let x=await get('/books/reality-differentiation/');
assert.equal(x.response.status,200,'Book V canonical route must return 200');
for(const marker of [
  'data-civilization-atlas-root',
  'data-book-id="book-5"',
  '/assets/css/civilization-atlas.css',
  '/assets/js/pages/civilization-atlas.js',
  '42 published readings'
]) assert.ok(x.text.includes(marker),`BOOK5_LIVE_MARKER_MISSING_${marker}`);

x=await get('/books/reality-configuration/');
assert.equal(x.response.status,200,'Book VI canonical route must return 200');
for(const marker of [
  'data-civilization-atlas-root',
  'data-book-id="book-6"',
  'data-atlas-mode="reconfiguration"',
  '/assets/js/pages/book6-reconfiguration-atlas.js'
]) assert.ok(x.text.includes(marker),`BOOK6_LIVE_MARKER_MISSING_${marker}`);

for(const asset of [
  '/assets/css/civilization-atlas.css',
  '/assets/js/pages/civilization-atlas.js',
  '/assets/js/pages/civilization-atlas/atlas-shell.js',
  '/assets/js/pages/civilization-atlas/atlas-static-visual.js',
  '/assets/js/pages/civilization-atlas/reconfiguration-renderer.js'
]){
  x=await get(asset,{accept:'text/css,application/javascript,text/javascript,*/*'});
  assert.equal(x.response.status,200,`LIVE_ASSET_MISSING_${asset}`);
  assert.ok(x.text.length>500,`LIVE_ASSET_TOO_SMALL_${asset}`);
}

x=await get('/content/civilization-atlas/visuals/civilization-visual-approved-bindings-v2.json',{accept:'application/json'});
assert.equal(x.response.status,200,'Live 392 visual bindings must return 200');
const bindings=JSON.parse(x.text);
assert.equal(bindings.assets?.length,392,'Live visual bindings must expose 392 accepted assets');
assert.equal(new Set(bindings.assets.map(a=>a.family)).size,15,'Live visual bindings must expose 15 families');

let articleHtml=0,localeJson=0;
for(const record of map.records){
  const slug=record.slug;
  x=await get(`/articles/${slug}`);
  assert.equal(x.response.status,200,`LIVE_ARTICLE_HTTP_${slug}`);
  for(const marker of [
    `data-article-slug="${slug}"`,
    'data-static-article-admission',
    'data-cx-en=',
    'data-cx-zh='
  ]) assert.ok(x.text.includes(marker),`LIVE_ARTICLE_MARKER_${slug}_${marker}`);
  assert.ok(!x.text.includes('PRIVATE_MANUSCRIPT_TEXT_NOT_EMBEDDED_IN_PUBLIC_ARTICLE')||!x.text.includes('sourceReading.path'),'Public HTML must not expose private manuscript path');
  articleHtml++;

  for(const locale of ['zh-Hans','en']){
    const path=`/content/knowledge/public/successors/book6-publication-v1/visual-articles/${locale}/${slug}.json`;
    const y=await get(path,{accept:'application/json'});
    assert.equal(y.response.status,200,`LIVE_ARTICLE_JSON_HTTP_${locale}_${slug}`);
    const article=JSON.parse(y.text);
    assert.equal(article.locale,locale,`LIVE_ARTICLE_LOCALE_${slug}`);
    assert.equal(article.slug,slug,`LIVE_ARTICLE_SLUG_${slug}`);
    assert.equal(article.publicationStatus,'published',`LIVE_ARTICLE_PUBLISHED_${locale}_${slug}`);
    assert.ok(article.title?.trim(),`LIVE_ARTICLE_TITLE_${locale}_${slug}`);
    assert.ok(article.summary?.trim(),`LIVE_ARTICLE_SUMMARY_${locale}_${slug}`);
    assert.ok(Array.isArray(article.sections)&&article.sections.length>0,`LIVE_ARTICLE_BODY_${locale}_${slug}`);
    assert.equal(article.sourceReading?.accessBoundary,'PRIVATE_MANUSCRIPT_TEXT_NOT_EMBEDDED_IN_PUBLIC_ARTICLE');
    assert.ok(!Object.prototype.hasOwnProperty.call(article.sourceReading||{},'path'),`LIVE_PRIVATE_PATH_LEAK_${locale}_${slug}`);
    localeJson++;
  }
}

assert.equal(articleHtml,28);
assert.equal(localeJson,56);
console.log(`Civilization Atlas live public smoke PASS: Book V/VI canonical routes, 392 visuals, ${articleHtml} Book VI article pages, ${localeJson} bilingual article records.`);
