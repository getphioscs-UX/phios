import assert from 'node:assert/strict';
import { readText, readJson, exists, BASELINE } from './lib/web-production/wpr-public-v1.mjs';
const c=readJson('content/web-production/composition/public/article-composition-v1.json'); assert.equal(c.baselineCommit,BASELINE); assert.equal(c.work,'WPR-W16'); assert.equal(c.publishedOnly,true); assert.equal(c.candidateOrDraftConsumptionAllowed,false);
const pub=readJson('content/knowledge/public/published-articles.json'); assert.equal(pub.recordCount,pub.records.length); assert.ok(pub.records.length>0); assert.ok(pub.records.every(r=>r.publicationStatus==='published'));
const slugs=[...new Set(pub.records.map(r=>r.slug))]; assert.equal(slugs.length,3);
for(const slug of slugs){const f=`articles/${slug}.html`;assert.ok(exists(f),f);const h=readText(f);assert.ok(h.includes(`data-article-slug="${slug}"`));assert.ok(h.includes('/assets/js/pages/article.js'));assert.ok(h.includes('/assets/css/wpr-public-production.css'));assert.equal(/candidate|review_only/i.test(h),false,`candidate leakage:${f}`);}
console.log('✓ WPR-W16 Existing Published Article Production Composition accepted.');
