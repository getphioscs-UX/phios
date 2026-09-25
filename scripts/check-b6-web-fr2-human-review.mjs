import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('tools/review/B6-WEB-FR2-HUMAN-REVIEW.html','utf8');
assert.ok(html.includes('B6-WEB-FR2 Human Review'));
assert.equal((html.match(/<article class="review-item" data-review="/g)||[]).length,13,'FR2 review must expose exactly 13 decision dimensions.');
assert.ok(html.includes("dimensions.every(x=>x.status==='ACCEPT')?'HUMAN_ACCEPTED'"),'FR2 acceptance must require every human dimension.');
assert.ok(html.includes("dimensions.some(x=>x.status==='REJECT')?'HUMAN_REJECTED'"),'Any FR2 rejection must keep the review rejected.');
assert.ok(html.includes("'PENDING_HUMAN_REVIEW'"),'Incomplete FR2 review must remain pending.');
for(const viewport of ['360','768','1440']) assert.ok(html.includes(`data-width="${viewport}"`),`Missing FR2 viewport ${viewport}`);
for(const locale of ['en','zh-Hans']) assert.ok(html.includes(`data-locale="${locale}"`),`Missing FR2 locale ${locale}`);
for(const layer of ['timeline','world','cases','comparison','trajectories','transitions','loss']) assert.ok(html.includes(`data-layer="${layer}"`),`Missing FR2 layer ${layer}`);
assert.ok(html.includes('comparison-mobile'),'FR2 review must separately judge the mobile comparison matrix.');
assert.ok(html.includes('392 visual asset role'),'FR2 review must judge structural visual activation.');
assert.ok(!html.includes('status:"HUMAN_ACCEPTED"'),'FR2 review HTML must not pre-record acceptance.');
console.log('B6-WEB-FR2 human review surface PASS: 13 explicit PENDING dimensions across seven asset-led Atlas layers.');
