import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const MAP_PATH=path.join(ROOT,'content/books/book-6/articles/article-production-map-v1.json');
const PUBLIC_ROOT=path.join(ROOT,'content/knowledge/public/successors/book6-publication-v1/visual-articles');
const HTML_ROOT=path.join(ROOT,'articles');
const LOCALES=['zh-Hans','en'];

const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const map=readJson(MAP_PATH);
assert.equal(map.bookCode,'BOOK-6');
assert.equal(map.articleCount,28);
assert.equal(map.localeRecordCount,56);
assert.equal(map.records.length,28);

const slugs=new Set();
let localeRecords=0;
for(const record of map.records){
  assert.ok(record.slug,'Book VI article record missing slug');
  assert.ok(!slugs.has(record.slug),`Duplicate Book VI slug: ${record.slug}`);
  slugs.add(record.slug);

  const htmlPath=path.join(HTML_ROOT,`${record.slug}.html`);
  assert.ok(fs.existsSync(htmlPath),`Missing public HTML: ${record.slug}`);
  const html=fs.readFileSync(htmlPath,'utf8');
  assert.match(html,new RegExp(`data-article-slug=["']${record.slug}["']`));
  assert.match(html,/hreflang=["']zh-Hans["']/);
  assert.match(html,/hreflang=["']en["']/);
  assert.match(html,/data-static-article-admission/);
  assert.match(html,/data-cx-en=/);
  assert.match(html,/data-cx-zh=/);

  for(const locale of LOCALES){
    const jsonPath=path.join(PUBLIC_ROOT,locale,`${record.slug}.json`);
    assert.ok(fs.existsSync(jsonPath),`Missing ${locale} article JSON: ${record.slug}`);
    const article=readJson(jsonPath);
    localeRecords++;
    assert.equal(article.locale,locale,`${record.slug}: locale mismatch`);
    assert.equal(article.slug,record.slug,`${record.slug}: slug mismatch`);
    assert.equal(article.publicationStatus,'published',`${record.slug}: not published in ${locale}`);
    assert.ok(article.title?.trim(),`${record.slug}: missing ${locale} title`);
    assert.ok(article.summary?.trim(),`${record.slug}: missing ${locale} summary`);
    assert.ok(Array.isArray(article.sections)&&article.sections.length>0,`${record.slug}: missing ${locale} public article body`);
    assert.equal(article.sourceReading?.accessBoundary,'PRIVATE_MANUSCRIPT_TEXT_NOT_EMBEDDED_IN_PUBLIC_ARTICLE');
    assert.ok(!Object.prototype.hasOwnProperty.call(article.sourceReading||{},'path'),`${record.slug}: public sourceReading.path must stay removed`);
    assert.equal(article.publicationContext?.bookCode,'BOOK-6');
  }
}
assert.equal(localeRecords,56);
console.log('Book VI public article bilingual gate PASS: 28 canonical articles / 56 locale records / 28 HTML shells.');
