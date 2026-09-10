import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildFixtureProjection} from './lib/ecr-mandala-acceptance-fixture.mjs';
import {renderPhiMandalaVisual} from '../assets/customer-ui/js/specialists/ecr/mandala-renderer.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const text=p=>fs.readFileSync(p,'utf8');
const contract=read('content/product-visual-platform-r1/ecr/semantic-zoom/ecr-mandala-semantic-zoom-contract-v1.json');
const acceptance=read('content/product-visual-platform-r1/acceptance/pvp-r1-vis-w13-ecr-mandala-semantic-zoom-v1.json');
const projection=buildFixtureProjection(),visual={title:'你的 PHI 构型',payload:projection};
const free=renderPhiMandalaVisual(visual,{experienceState:'FREE_SNAPSHOT'}),paid=renderPhiMandalaVisual(visual,{experienceState:'PAID_DEPTH'});
for(const html of [free,paid]){
  assert.match(html,/data-ecr-mandala-summary/);assert.match(html,/data-ecr-mandala-explore/);assert.match(html,/data-ecr-mandala-detail/);assert.match(html,/aria-live="polite"/);
  assert.equal((html.match(/data-ecr-mandala-node="true"/g)||[]).length,145,'semantic zoom must keep all 145 addressable nodes');
  assert.match(html,/先读意义 · 编号追溯/);assert.match(html,/保留技术编号以便追溯/);
}
assert.match(free,/data-locked-depth="true"/);assert.match(free,/看看深层读取还会增加什么/);assert.match(paid,/展开更深层结构/);
const cfg=projection.selected.configurationId.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const lockedCfg=new RegExp(`data-layer="H64" data-node-id="${cfg}" data-detail-title="更深层结构"`);assert.match(free,lockedCfg,'free semantic zoom must use generic locked detail for the selected deep configuration');
const paidCfg=new RegExp(`data-layer="H64" data-node-id="${cfg}" data-detail-title="[^"]*${cfg}`);assert.match(paid,paidCfg,'paid semantic zoom may expose the already-governed selected configuration label');
const renderer=text('assets/customer-ui/js/specialists/ecr/mandala-renderer.js');for(const token of ['pointerover','focusin',"event.key==='Enter'","event.key===' '","event.key==='Escape'"])assert.ok(renderer.includes(token),token);
for(const forbidden of ['resolveEcrCoordinateFromSolarLongitude','questionCapabilityMatrix','getEcrCanonicalOntology'])assert.equal(renderer.includes(forbidden),false,forbidden);
assert.equal(contract.levels.length,4);assert.equal(contract.freeDepthRule.includes('must not expose personalized deep labels'),true);assert.equal(contract.boundaries.zoomMayUnlockPaidDepth,false);
assert.equal(acceptance.status,'MACHINE_ACCEPTED_SEMANTIC_ZOOM');assert.ok(Object.values(acceptance.checks).every(Boolean));
console.log('✓ PVP-R1-VIS-W13 Semantic Zoom passed.');
console.log('  Summary → complete 145-node Mandala → focused node detail → governed deeper disclosure is preserved without changing ECR selection or meaning.');
console.log('  Free locked deep nodes expose generic detail; Paid Depth may reveal only already-governed selected detail.');
