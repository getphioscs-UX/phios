import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('tools/review/B6-WEB-F-SUCCESSOR-HUMAN-REVIEW.html','utf8');
assert.ok(html.includes('B6-WEB-F Successor Human Review'));
assert.ok(html.includes('PENDING_HUMAN_REVIEW'),'Human review export must preserve a pending state when review is incomplete.');
assert.ok(html.includes("dimensions.every(x=>x.status==='ACCEPT')?'HUMAN_ACCEPTED'"),'Acceptance must require every human dimension to be accepted.');
assert.ok(html.includes("dimensions.some(x=>x.status==='REJECT')?'HUMAN_REJECTED'"),'Any rejection must keep the review rejected.');
assert.equal((html.match(/data-review="/g)||[]).length,12,'Human review must expose exactly 12 explicit decision dimensions.');
for(const viewport of ['360','768','1440']) assert.ok(html.includes(`data-width="${viewport}"`),`Missing review viewport ${viewport}`);
for(const locale of ['en','zh-Hans']) assert.ok(html.includes(`data-locale="${locale}"`),`Missing review locale ${locale}`);
for(const surface of ['book5','book6','article']) assert.ok(html.includes(`data-surface="${surface}"`),`Missing review surface ${surface}`);
assert.ok(html.includes('/content/books/book-6/articles/article-production-map-v1.json'),'Review must load the current 28-article map instead of freezing a handwritten subset.');
assert.ok(html.includes('/books/reality-differentiation/'),'Review must include Book V canonical route.');
assert.ok(html.includes('/books/reality-configuration/'),'Review must include Book VI canonical route.');
assert.ok(!html.includes('status:"HUMAN_ACCEPTED"'),'Review HTML must not pre-record acceptance.');
console.log('B6-WEB-F successor human review surface PASS: 12 PENDING human dimensions across Book V/VI, articles, locales and responsive viewports.');
