import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const evidence=json('content/civilization-atlas/evidence/b6-fr1-reconfiguration-customer-reader-v1.json');
const review=json('content/civilization-atlas/evidence/b6-fr1-human-review-v1.json');
const renderer=read('assets/js/pages/civilization-atlas/reconfiguration-renderer.js');
const state=read('assets/js/pages/civilization-atlas/atlas-state.js');
const reviewHtml=read('tools/review/B6-FR1-RECONFIGURATION-HUMAN-REVIEW.html');

assert.equal(evidence.status,'IMPLEMENTED_READY_FOR_HUMAN_REVIEW');
assert.equal(review.status,'READY_FOR_HUMAN_REVIEW');
assert.equal(review.finalAcceptance,'PENDING_OWNER_DECISION');
for(const key of Object.keys(review.gates)) assert.equal(review.gates[key],'PENDING_OWNER_DECISION',key+' must remain pending until owner review');

for(const token of ['重组案例','重组窗口','世界变化','当前档案','日常现实']) assert.ok(renderer.includes(token),'Missing primary reader: '+token);
assert.ok(state.includes("legacyLayerMap={overview:'cases',timeline:'windows',visuals:'snapshots'}"));
assert.ok(reviewHtml.includes('ACCEPT / REVISE / REJECT'));
assert.ok(reviewHtml.includes('/books/reality-configuration/?atlas=cases&case=RC-01#atlas'));
assert.ok(reviewHtml.includes('/books/reality-configuration/?atlas=windows&window=RW-01#atlas'));
assert.ok(reviewHtml.includes('/books/reality-configuration/?atlas=snapshots&snapshot=WORLD_RECONFIGURATION_SNAPSHOT_1945#atlas'));
assert.ok(reviewHtml.includes('/books/reality-configuration/?atlas=dossiers&dossier=DOSSIER-JP#atlas'));
assert.ok(reviewHtml.includes('/books/reality-configuration/?atlas=lived&dossier=DOSSIER-JP#atlas'));

console.log('B6-FR1 human-review readiness PASS: five customer readers are implemented and owner acceptance remains pending.');
